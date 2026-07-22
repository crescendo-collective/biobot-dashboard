import { useCallback, useEffect, useRef, useState } from 'react'
import { countyRiskLookup } from '@/data/mock/countyRiskLookup'
import { stateRiskLookup } from '@/data/mock/stateRiskLookup'
import { getCountyColor, getStateColor } from './colors'
import { useChoropleth } from './useChoropleth'
import { countyFeatures, stateFeatures, stateBordersMesh } from './geography'
import MapTooltip from './MapTooltip'
import type { MapTooltipData } from './MapTooltip'
import MapZoomControls from './MapZoomControls'
import MapViewToggle from './MapViewToggle'
import type { MapViewMode } from './MapViewToggle'
import './MapContainer.scss'

export default function MapContainer() {
  const [viewMode, setViewMode] = useState<MapViewMode>('county')
  const [hoveredData, setHoveredData] = useState<MapTooltipData>()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [zoomPercent, setZoomPercent] = useState(100)

  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // Hovered-record state from one view mode is meaningless in the
  // other (a county tooltip showing while state polygons are on
  // screen, etc.) — clear it whenever the mode changes rather than
  // letting a stale tooltip linger.
  useEffect(() => {
    setHoveredData(undefined)
  }, [viewMode])

  const getFill = useCallback(
    (id: string) =>
      viewMode === 'county'
        ? getCountyColor(countyRiskLookup.get(id))
        : getStateColor(stateRiskLookup.get(id)),
    [viewMode],
  )

  const handleHover = useCallback(
    (id: string, x: number, y: number) => {
      if (viewMode === 'county') {
        const county = countyRiskLookup.get(id)
        if (!county) return
        setHoveredData({
          title: county.state_abbr ? `${county.county_name}, ${county.state_abbr}` : county.county_name,
          riskTier: county.biobot_risk_tier,
          trend: county.biobot_trend,
          percChange: county.perc_change,
        })
      } else {
        const state = stateRiskLookup.get(id)
        if (!state) return
        setHoveredData({
          title: state.state_name,
          riskTier: state.biobot_risk_tier,
          trend: state.biobot_trend,
          percChange: state.perc_change,
        })
      }
      setMousePosition({ x, y })
    },
    [viewMode],
  )

  const handleMove = useCallback((x: number, y: number) => {
    setMousePosition({ x, y })
  }, [])

  const handleLeave = useCallback(() => {
    setHoveredData(undefined)
  }, [])

  const handleZoomChange = useCallback((scale: number) => {
    setZoomPercent(Math.round(scale * 100))
  }, [])

  const { zoomIn, zoomOut, zoomToFit } = useChoropleth(containerRef, svgRef, {
    features: viewMode === 'county' ? countyFeatures.features : stateFeatures.features,
    extentSource: viewMode === 'county' ? countyFeatures : stateFeatures,
    // State polygons already draw their own boundaries as the fill
    // regions themselves — an extra state-border overlay only makes
    // sense in county mode, where it's the one level up from what's
    // actually filled.
    borderMesh: viewMode === 'county' ? stateBordersMesh : undefined,
    getFill,
    onHover: handleHover,
    onMove: handleMove,
    onLeave: handleLeave,
    onZoomChange: handleZoomChange,
  })

  return (
    <div ref={containerRef} className="map-container">
      <div className="map-canvas">
        <svg ref={svgRef} />
        <MapTooltip data={hoveredData} x={mousePosition.x} y={mousePosition.y} visible={!!hoveredData} />
        <MapViewToggle value={viewMode} onChange={setViewMode} />
        <MapZoomControls
          zoomPercent={zoomPercent}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onRecenter={zoomToFit}
        />
      </div>
    </div>
  )
}
