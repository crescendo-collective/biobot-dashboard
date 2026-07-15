import { useRef, useState, useCallback } from 'react'
import { countyRiskLookup } from '@/data/mock/countyRiskLookup'
import { getCountyColor } from './colors'
import { useCountyChoropleth } from './useCountyChoropleth'
import MapTooltip from './MapTooltip'
import type { CountyData } from '@/types/map'
import './MapContainer.scss'

export default function MapContainer() {
  const [hoveredCounty, setHoveredCounty] = useState<CountyData>()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const getFill = useCallback((fips: string) => getCountyColor(countyRiskLookup.get(fips)), [])

  const handleHover = useCallback((fips: string, x: number, y: number) => {
    const county = countyRiskLookup.get(fips)
    if (!county) return
    setHoveredCounty(county)
    setMousePosition({ x, y })
  }, [])

  const handleMove = useCallback((x: number, y: number) => {
    setMousePosition({ x, y })
  }, [])

  const handleLeave = useCallback(() => {
    setHoveredCounty(undefined)
  }, [])

  useCountyChoropleth(containerRef, svgRef, {
    getFill,
    onHover: handleHover,
    onMove: handleMove,
    onLeave: handleLeave,
  })

  return (
    <div ref={containerRef} className="map-container">
      <div className="map-canvas">
        <svg ref={svgRef} />
        <MapTooltip
          county={hoveredCounty}
          x={mousePosition.x}
          y={mousePosition.y}
          visible={!!hoveredCounty}
        />
      </div>
    </div>
  )
}
