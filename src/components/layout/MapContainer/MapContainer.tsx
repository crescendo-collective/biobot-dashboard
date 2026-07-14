import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { feature, mesh } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import us from 'us-atlas/counties-10m.json'

import { countyLookup } from '../../../data/countyLookup'
import { getCountyColor } from '../../../lib/colors'

import './MapContainer.scss'
import type {CountyData} from "../../../types/map.ts";
import MapTooltip from "../../MapToolTip";

export interface MapContainerProps {}

export default function MapContainer({}: MapContainerProps) {
  const [hoveredCounty, setHoveredCounty] = useState<CountyData>()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return

    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight

    const svg = d3.select(svgRef.current)

    svg.selectAll('*').remove()

    svg
        .attr('width', width)
        .attr('height', height)
        .style('background', 'transparent')

    //---------------------------------------
    // Root
    //---------------------------------------

    const mapRoot = svg
        .append('g')
        .attr('class', 'map-root')

    //---------------------------------------
    // Zoom
    //---------------------------------------

    const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([1, 8])
        .on('zoom', (event) => {
          mapRoot.attr('transform', event.transform)
        })

    svg.call(zoom)

    //---------------------------------------
    // Projection
    //---------------------------------------

    const projection = d3.geoAlbersUsa()

    const topology = us as unknown as Topology
    const counties = feature(
      topology,
      topology.objects.counties as GeometryCollection
    )

    const states = feature(
      topology,
      topology.objects.states as GeometryCollection
    )

    projection.fitSize([width, height], states)
        .fitExtent(
            [
                [0, 0],               // left, top padding
                [width - 40, height], // right, bottom padding
            ],
            counties
        )

    const path = d3.geoPath(projection)

    //---------------------------------------
    // Counties
    //---------------------------------------

    mapRoot
        .append('g')
        .attr('class', 'counties')
        .selectAll('path')
        .data(counties.features)
        .join('path')
        .attr('class', 'county')
        .attr('d', path)
        .attr('fill', (d: any) =>
            getCountyColor(countyLookup.get(d.id))
        )
        .attr('stroke', '#fff')
        .attr('stroke-width', .3)
        .on('mouseenter', function (event, d: any) {
            const county = countyLookup.get(d.id)

            if (!county) return

            setHoveredCounty(county)

            setMousePosition({
                x: event.offsetX,
                y: event.offsetY,
            })

            d3.select(this)
                .raise()
                .transition()
                .duration(120)
                .attr('stroke-width', 1)

        })
        .on('mousemove', function(event){
            setMousePosition({
                x: event.offsetX,
                y: event.offsetY,
            })

        })
        .on('mouseleave', function(){
            setHoveredCounty(undefined)

            d3.select(this)
                .transition()
                .duration(120)
                .attr('stroke', '#fff')
                .attr('stroke-width', .3)

        })

    //---------------------------------------
    // State Borders
    //---------------------------------------

    mapRoot
        .append('path')
        .datum(
            mesh(
                us as any,
                (us as any).objects.states,
                (a: any, b: any) => a !== b
            )
        )
        .attr('fill', 'none')
        .attr('stroke', '#969696')
        .attr('stroke-width', .8)
        .attr('pointer-events', 'none')
        .attr('d', path)

  }, [])

  return (
      <div
          ref={containerRef}
          className="map-container"
      >
        <svg ref={svgRef} />
          <MapTooltip
              county={hoveredCounty}
              x={mousePosition.x}
              y={mousePosition.y}
              visible={!!hoveredCounty}
          />
      </div>
  )
}