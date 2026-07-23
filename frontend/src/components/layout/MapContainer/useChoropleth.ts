import { useCallback, useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import * as d3 from 'd3'
import type { GeoFeatureCollection } from './geography'

export interface UseChoroplethOptions {
  /** The polygons to render — countyFeatures.features or
   * stateFeatures.features from geography.ts. Passed as a real
   * dependency (not read via the options ref below) since switching
   * between county/state view should fully rebuild the map. */
  features: GeoFeatureCollection['features']
  /** fitExtent target — usually the same collection `features` came
   * from (e.g. countyFeatures, or stateFeatures directly). */
  extentSource: GeoFeatureCollection
  /** Optional overlay line (e.g. stateBordersMesh) drawn on top of the
   * fills — pass undefined to skip it (state view doesn't need a
   * separate state-border overlay, since the state fills themselves
   * already are the state boundaries). */
  borderMesh?: unknown
  getFill: (id: string) => string
  /** Changes whenever the timeline selects a different data snapshot. */
  dataVersion: string
  onHover: (id: string, x: number, y: number) => void
  onMove: (x: number, y: number) => void
  onLeave: () => void
  /** Called with the current zoom scale (1 = 100%) whenever it changes,
   * from scroll/drag zoom OR the imperative controls below. */
  onZoomChange?: (scale: number) => void
}

export interface ChoroplethControls {
  zoomIn: () => void
  zoomOut: () => void
  /** Resets pan + zoom back to the initial fitted view. */
  zoomToFit: () => void
}

const ZOOM_STEP = 1.4
const ZOOM_EXTENT: [number, number] = [1, 8]

/**
 * Owns all D3 rendering for the choropleth: projection, region fills,
 * an optional border overlay, zoom/pan, and hover interactions. Works
 * for either the county or the state view — MapContainer decides which
 * `features`/`extentSource`/`borderMesh` to pass in based on the active
 * view mode; this hook doesn't know or care which level it's drawing.
 *
 * `getFill`/`onHover`/`onMove`/`onLeave`/`onZoomChange` are stored in a
 * ref and read fresh inside the D3 event handlers, rather than being
 * setup-effect dependencies — so passing new inline callbacks on every
 * render (e.g. because hover state changed) does NOT tear down and
 * rebuild the whole map on every mouse move. `features`/`extentSource`/
 * `borderMesh` ARE real dependencies, since switching view mode should
 * fully rebuild the map — that's the one case where a rebuild is
 * exactly what's wanted.
 *
 * Returns imperative zoom controls (zoomIn/zoomOut/zoomToFit) for a
 * button UI — the D3 zoom behavior itself lives entirely inside the
 * setup effect's closure, so these reach it via a ref rather than
 * recreating/duplicating any zoom logic.
 */
export function useChoropleth(
  containerRef: RefObject<HTMLDivElement>,
  svgRef: RefObject<SVGSVGElement>,
  options: UseChoroplethOptions,
): ChoroplethControls {
  const { features, extentSource, borderMesh } = options

  const optionsRef = useRef(options)
  optionsRef.current = options

  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)

  // The timeline changes only a region's fill data, not its geometry.
  // Update those paths in place so the current zoom/pan position remains intact.
  useEffect(() => {
    const svgEl = svgRef.current
    if (!svgEl) return
    d3.select(svgEl)
      .selectAll<SVGPathElement, any>('.map-regions .map-region')
      .attr('fill', (d) => options.getFill(String(d.id)))
  }, [options.dataVersion, options.getFill, svgRef])

  useEffect(() => {
    const container = containerRef.current
    const svgEl = svgRef.current
    if (!container || !svgEl) return

    function render() {
      if (!container || !svgEl) return

      // Measure .map-canvas (the SVG's own sizing box), not the outer
      // .map-container — the outer container's height isn't guaranteed
      // to be just the map. Sizing off whichever element is guaranteed
      // to be map-only avoids that class of bug regardless of what
      // else ends up inside .map-container later.
      const canvasEl = svgEl.parentElement
      if (!canvasEl) return

      const width = canvasEl.clientWidth
      const height = canvasEl.clientHeight
      if (width === 0 || height === 0) return

      const svg = d3.select(svgEl)
      svg.selectAll('*').remove()
      svg.attr('width', width).attr('height', height).style('background', 'transparent')

      const mapRoot = svg.append('g').attr('class', 'map-root')

      const zoomBehavior = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent(ZOOM_EXTENT)
        .on('zoom', (event) => {
          mapRoot.attr('transform', event.transform)
          optionsRef.current.onZoomChange?.(event.transform.k)
        })
      svg.call(zoomBehavior)
      zoomBehaviorRef.current = zoomBehavior

      const projection = d3.geoAlbersUsa()
      projection.fitExtent([[0, 0], [width - 40, height]], extentSource)

      const path = d3.geoPath(projection)

      mapRoot
        .append('g')
        .attr('class', 'map-regions')
        .selectAll('path')
        .data(features)
        .join('path')
        .attr('class', 'map-region')
        .attr('d', path)
        .attr('fill', (d: any) => optionsRef.current.getFill(String(d.id)))
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.3)
        .on('mouseenter', function (event, d: any) {
          const rect = container!.getBoundingClientRect()
          const id = String(d.id)
          optionsRef.current.onHover(id, event.clientX - rect.left, event.clientY - rect.top)

        })
        .on('mousemove', function (event) {
          const rect = container!.getBoundingClientRect()
          optionsRef.current.onMove(event.clientX - rect.left, event.clientY - rect.top)
        })
        .on('mouseleave', function () {
          optionsRef.current.onLeave()
        })

      if (borderMesh) {
        mapRoot
          .append('path')
          .datum(borderMesh as any)
          .attr('fill', 'none')
          .attr('stroke', '#969696')
          .attr('stroke-width', 0.8)
          .attr('pointer-events', 'none')
          .attr('d', path as any)
      }

      // Zoom always starts at 100% on a fresh render (fitExtent above
      // resets the projection itself), so make sure any external
      // percentage readout reflects that rather than a stale value.
      optionsRef.current.onZoomChange?.(1)
    }

    render()

    // Re-renders the map whenever its actual sizing box (.map-canvas)
    // changes size — window resize, sidebar breakpoint changes, etc.
    let frame: number | null = null
    const resizeObserver = new ResizeObserver(() => {
      if (frame !== null) cancelAnimationFrame(frame)
      frame = requestAnimationFrame(render)
    })
    const canvasEl = svgEl.parentElement
    if (canvasEl) resizeObserver.observe(canvasEl)

    return () => {
      resizeObserver.disconnect()
      if (frame !== null) cancelAnimationFrame(frame)
      d3.select(svgEl).selectAll('*').remove()
      zoomBehaviorRef.current = null
    }
    // containerRef/svgRef are stable ref objects (identity never changes
    // across renders). getFill/onHover/onMove/onLeave/onZoomChange are
    // intentionally NOT deps — see optionsRef above. features/
    // extentSource/borderMesh ARE real deps: switching view mode
    // (different array identity) should rebuild the whole map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, svgRef, features, extentSource, borderMesh])

  const zoomIn = useCallback(() => {
    const svgEl = svgRef.current
    const zoomBehavior = zoomBehaviorRef.current
    if (!svgEl || !zoomBehavior) return
    d3.select(svgEl).transition().duration(200).call(zoomBehavior.scaleBy, ZOOM_STEP)
  }, [svgRef])

  const zoomOut = useCallback(() => {
    const svgEl = svgRef.current
    const zoomBehavior = zoomBehaviorRef.current
    if (!svgEl || !zoomBehavior) return
    d3.select(svgEl).transition().duration(200).call(zoomBehavior.scaleBy, 1 / ZOOM_STEP)
  }, [svgRef])

  const zoomToFit = useCallback(() => {
    const svgEl = svgRef.current
    const zoomBehavior = zoomBehaviorRef.current
    if (!svgEl || !zoomBehavior) return
    d3.select(svgEl).transition().duration(300).call(zoomBehavior.transform, d3.zoomIdentity)
  }, [svgRef])

  return { zoomIn, zoomOut, zoomToFit }
}
