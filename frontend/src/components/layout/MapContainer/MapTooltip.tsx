import './MapTooltip.scss'
import type { BiobotRiskTier, BiobotTrend } from '@/types/map'

export interface MapTooltipData {
  title: string
  riskTier: BiobotRiskTier
  trend: BiobotTrend
  percChange: number | null
}

interface Props {
  data?: MapTooltipData
  x: number
  y: number
  visible: boolean
}

function trendClass(trend: BiobotTrend): string {
  return trend.toLowerCase()
}

function changeClass(percChange: number | null): string {
  if (percChange == null) return 'stable'
  if (percChange > 0) return 'increasing'
  if (percChange < 0) return 'decreasing'
  return 'stable'
}

export default function MapTooltip({ data, x, y, visible }: Props) {
  if (!data) return null

  return (
    <div className={`map-tooltip ${visible ? 'visible' : ''}`} style={{ left: x + 18, top: y + 18 }}>
      <h3>{data.title}</h3>

      <div className="tooltip-row">
        <span className="tooltip-label">Risk Tier:</span>
        <span className={`pill tier-${data.riskTier.toLowerCase().replace(' ', '-')}`}>
          {data.riskTier}
        </span>
      </div>

      <div className="tooltip-row">
        <span className="tooltip-label">Trend:</span>
        <span className={`pill trend-${trendClass(data.trend)}`}>{data.trend}</span>
      </div>

      {data.percChange != null && (
        <div className="tooltip-row">
          <span className="tooltip-label">% Change:</span>
          <span className={`pill trend-${changeClass(data.percChange)}`}>
            {`${data.percChange > 0 ? '+' : ''}${data.percChange.toFixed(1)}%`}
          </span>
        </div>
      )}
    </div>
  )
}
