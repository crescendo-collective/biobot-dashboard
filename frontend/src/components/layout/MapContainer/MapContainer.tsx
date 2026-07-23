import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getCountySnapshotLookup } from '@/data/mock/countyInterpolated'
import { stateRiskLookup } from '@/data/mock/stateRiskLookup'
import { getCountyColor, getStateColor } from './colors'
import { useChoropleth } from './useChoropleth'
import { countyFeatures, stateFeatures, stateBordersMesh } from './geography'
import MapTooltip from './MapTooltip'
import type { MapTooltipData } from './MapTooltip'
import MapZoomControls from './MapZoomControls'
import MapViewToggle from './MapViewToggle'
import type { MapViewMode } from './MapViewToggle'
import type { TimelineDateRange } from '@/types/timeline'
import type { CountySnapshot, StateData } from '@/types/map'
import './MapContainer.scss'

interface MapContainerProps {
  selectedDateRange: TimelineDateRange
}

function countyTooltipData(county: CountySnapshot): MapTooltipData {
  return {
    title: county.state_abbr ? `${county.county_name}, ${county.state_abbr}` : county.county_name,
    riskTier: county.biobot_risk_tier,
    trend: county.biobot_trend,
    percChange: county.perc_change,
  }
}

function stateTooltipData(state: StateData): MapTooltipData {
  return {
    title: state.state_name,
    riskTier: state.biobot_risk_tier,
    trend: state.biobot_trend,
    percChange: state.perc_change,
  }
}

export default function MapContainer({ selectedDateRange }: MapContainerProps) {
  const [viewMode, setViewMode] = useState<MapViewMode>('county')
  const [hoveredData, setHoveredData] = useState<MapTooltipData>()
  const [hoveredRegionId, setHoveredRegionId] = useState<string>()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [zoomPercent, setZoomPercent] = useState(100)

  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const countyRiskLookup = useMemo(() => getCountySnapshotLookup(selectedDateRange), [selectedDateRange])
  const dataVersion = `${viewMode}:${selectedDateRange.start.getTime()}:${selectedDateRange.end.getTime()}`

  useEffect(() => {
    if (!hoveredRegionId) {
      setHoveredData(undefined)
      return
    }

    if (viewMode === 'county') {
      const county = countyRiskLookup.get(hoveredRegionId)
      setHoveredData(county ? countyTooltipData(county) : undefined)
      return
    }

    const state = stateRiskLookup.get(hoveredRegionId)
    setHoveredData(state ? stateTooltipData(state) : undefined)
  }, [viewMode, countyRiskLookup, hoveredRegionId])

  const getFill = useCallback(
    (id: string) =>
      viewMode === 'county'
        ? getCountyColor(countyRiskLookup.get(id))
        : getStateColor(stateRiskLookup.get(id)),
    [viewMode, countyRiskLookup],
  )

  const handleHover = useCallback(
    (id: string, x: number, y: number) => {
      if (viewMode === 'county') {
        const county = countyRiskLookup.get(id)
        if (!county) return
        setHoveredData(countyTooltipData(county))
      } else {
        const state = stateRiskLookup.get(id)
        if (!state) return
        setHoveredData(stateTooltipData(state))
      }
      setHoveredRegionId(id)
      setMousePosition({ x, y })
    },
    [viewMode, countyRiskLookup],
  )

  const handleMove = useCallback((x: number, y: number) => {
    setMousePosition({ x, y })
  }, [])

  const handleLeave = useCallback(() => {
    setHoveredRegionId(undefined)
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
    dataVersion,
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
