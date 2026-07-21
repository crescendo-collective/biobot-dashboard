import { useCallback, useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import * as d3 from 'd3'
import { countyFeatures, stateBordersMesh, geographyExtentSource } from './geography'

export interface UseCountyChoroplethOptions {
  getFill: (fips: string) => string
  onHover: (fips: string, x: number, y: number) => void
  onMove: (x: number, y: number) => void
  onLeave: () => void
  /** Called with the current zoom scale (1 = 100%) whenever it changes,
   * from scroll/drag zoom OR the imperative controls below. */
  onZoomChange?: (scale: number) => void
}

export interface CountyChoroplethControls {
  zoomIn: () => void
  zoomOut: () => void
  /** Resets pan + zoom back to the initial fitted view. */
  zoomToFit: () => void
}

const ZOOM_STEP = 1.4
const ZOOM_EXTENT: [number, number] = [1, 8]

/**
 * Owns all D3 rendering for the county choropleth: projection, county
 * fills, state border overlay, zoom/pan, and hover interactions. Split
 * out of MapContainer so the component itself stays a thin "render a
 * container + wire this hook up" shell instead of mixing React lifecycle
 * and imperative D3 DOM manipulation in one file.
 *
 * `options` is stored in a ref and read fresh inside the D3 event
 * handlers, rather than being a dependency of the setup effect — so
 * passing new inline callbacks from MapContainer on every render (e.g.
 * because hover state changed) does NOT tear down and rebuild the whole
 * map on every mouse move. Only container/svg ref identity re-runs setup.
 *
 * Returns imperative zoom controls (zoomIn/zoomOut/zoomToFit) for a
 * button UI — the D3 zoom behavior itself lives entirely inside the
 * setup effect's closure, so these reach it via a ref rather than
 * recreating/duplicating any zoom logic.
 */
export function useCountyChoropleth(
  containerRef: RefObject<HTMLDivElement>,
  svgRef: RefObject<SVGSVGElement>,
  options: UseCountyChoroplethOptions,
): CountyChoroplethControls {
  const optionsRef = useRef(options)
  optionsRef.current = options

  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)

  useEffect(() => {
    const container = containerRef.current
    const svgEl = svgRef.current
    if (!container || !svgEl) return

    function render() {
      if (!container || !svgEl) return

      // Measure .map-canvas (the SVG's own sizing box), not the outer
      // .map-container — the outer container's height isn't guaranteed
      // to be just the map (e.g. it briefly also held the legend during
      // earlier work on this component). Sizing off whichever element
      // is guaranteed to be map-only avoids that class of bug entirely,
      // regardless of what else ends up inside .map-container later.
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
      // BUG FIX: the original chained .fitSize(...).fitExtent(...) on the
      // same projection. fitExtent fully recomputes scale + translate, so
      // it silently threw away whatever fitSize had just set — the
      // fitSize call was dead code. Keeping only fitExtent (the one that
      // actually took effect).
      projection.fitExtent([[0, 0], [width - 40, height]], geographyExtentSource)

      const path = d3.geoPath(projection)

      mapRoot
        .append('g')
        .attr('class', 'counties')
        .selectAll('path')
        .data(countyFeatures.features)
        .join('path')
        .attr('class', 'county')
        .attr('d', path)
        .attr('fill', (d: any) => optionsRef.current.getFill(String(d.id)))
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.3)
        .on('mouseenter', function (event, d: any) {
          // BUG FIX: the original used event.offsetX/offsetY, which is
          // relative to whichever <path> the cursor happens to be over —
          // not the map container. Every county has its own bounding
          // box, so the tooltip position was inconsistent per-county
          // (and offsetX/Y on SVG targets has known cross-browser
          // inconsistencies besides). Using the container's own
          // bounding rect + clientX/Y is stable regardless of which
          // county is under the cursor.
          const rect = container!.getBoundingClientRect()
          optionsRef.current.onHover(
            String(d.id),
            event.clientX - rect.left,
            event.clientY - rect.top,
          )

          d3.select(this).raise().transition().duration(120).attr('stroke-width', 1)
        })
        .on('mousemove', function (event) {
          const rect = container!.getBoundingClientRect()
          optionsRef.current.onMove(event.clientX - rect.left, event.clientY - rect.top)
        })
        .on('mouseleave', function () {
          optionsRef.current.onLeave()

          d3.select(this).transition().duration(120).attr('stroke', '#fff').attr('stroke-width', 0.3)
        })

      mapRoot
        .append('path')
        .datum(stateBordersMesh)
        .attr('fill', 'none')
        .attr('stroke', '#969696')
        .attr('stroke-width', 0.8)
        .attr('pointer-events', 'none')
        .attr('d', path)

      // Zoom always starts at 100% on a fresh render (fitExtent above
      // resets the projection itself), so make sure any external
      // percentage readout reflects that rather than a stale value.
      optionsRef.current.onZoomChange?.(1)
    }

    render()

    // BUG FIX: the original effect ran once on mount and never again, so
    // the map never reflowed on window resize — meaning the responsive
    // breakpoints in MapContainer.scss (min-height steps, sidebar width
    // changes affecting the map's 1fr track) had no visible effect on
    // the actual SVG content, only its container box. A ResizeObserver
    // re-renders the map whenever its actual sizing box (.map-canvas)
    // changes size.
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
    // across renders), so this effect only truly runs once per mount —
    // getFill/onHover/onMove/onLeave/onZoomChange are intentionally NOT
    // deps here; see optionsRef above for why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, svgRef])

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
