import './MapTooltip.scss'
import type { CountyData } from '@/types/map'

interface Props {
  county?: CountyData
  x: number
  y: number
  visible: boolean
}

function trendClass(trend: CountyData['biobot_trend']): string {
  return trend.toLowerCase()
}

function changeClass(percChange: number | null): string {
  if (percChange == null) return 'stable'
  if (percChange > 0) return 'increasing'
  if (percChange < 0) return 'decreasing'
  return 'stable'
}

export default function MapTooltip({ county, x, y, visible }: Props) {
  if (!county) return null

  return (
    <div className={`map-tooltip ${visible ? 'visible' : ''}`} style={{ left: x + 18, top: y + 18 }}>
      <h3>
        {county.county_name}
        {county.state_abbr ? `, ${county.state_abbr}` : ''}
      </h3>

      <div className="tooltip-row">
        <span className="tooltip-label">Risk Tier:</span>
        <span className={`pill tier-${county.biobot_risk_tier.toLowerCase().replace(' ', '-')}`}>
          {county.biobot_risk_tier}
        </span>
      </div>

      <div className="tooltip-row">
        <span className="tooltip-label">Trend:</span>
        <span className={`pill trend-${trendClass(county.biobot_trend)}`}>{county.biobot_trend}</span>
      </div>

      {county.perc_change && (
        <div className="tooltip-row">
          <span className="tooltip-label">% Change:</span>
          <span className={`pill trend-${changeClass(county.perc_change)}`}>
            {`${county.perc_change > 0 ? '+' : ''}${county.perc_change.toFixed(1)}%`}
          </span>
        </div>
      )}
    </div>
  )
}
