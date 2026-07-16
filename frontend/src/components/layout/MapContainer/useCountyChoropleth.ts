import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import * as d3 from 'd3'
import { countyFeatures, stateBordersMesh, geographyExtentSource } from './geography'

export interface UseCountyChoroplethOptions {
  getFill: (fips: string) => string
  onHover: (fips: string, x: number, y: number) => void
  onMove: (x: number, y: number) => void
  onLeave: () => void
}

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
 */
export function useCountyChoropleth(
  containerRef: RefObject<HTMLDivElement>,
  svgRef: RefObject<SVGSVGElement>,
  options: UseCountyChoroplethOptions,
) {
  const optionsRef = useRef(options)
  optionsRef.current = options

  useEffect(() => {
    const container = containerRef.current
    const svgEl = svgRef.current
    if (!container || !svgEl) return

    function render() {
      if (!container || !svgEl) return

      const width = container.clientWidth
      const height = container.clientHeight
      if (width === 0 || height === 0) return

      const svg = d3.select(svgEl)
      svg.selectAll('*').remove()
      svg.attr('width', width).attr('height', height).style('background', 'transparent')

      const mapRoot = svg.append('g').attr('class', 'map-root')

      const zoomBehavior = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([1, 8])
        .on('zoom', (event) => {
          mapRoot.attr('transform', event.transform)
        })
      svg.call(zoomBehavior)

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
    }

    render()

    // BUG FIX: the original effect ran once on mount and never again, so
    // the map never reflowed on window resize — meaning the responsive
    // breakpoints in MapContainer.scss (min-height steps, sidebar width
    // changes affecting the map's 1fr track) had no visible effect on
    // the actual SVG content, only its container box. A ResizeObserver
    // re-renders the map whenever its container's size actually changes.
    let frame: number | null = null
    const resizeObserver = new ResizeObserver(() => {
      if (frame !== null) cancelAnimationFrame(frame)
      frame = requestAnimationFrame(render)
    })
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
      if (frame !== null) cancelAnimationFrame(frame)
      d3.select(svgEl).selectAll('*').remove()
    }
    // containerRef/svgRef are stable ref objects (identity never changes
    // across renders), so this effect only truly runs once per mount —
    // getFill/onHover/onMove/onLeave are intentionally NOT deps here;
    // see optionsRef above for why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, svgRef])
}
