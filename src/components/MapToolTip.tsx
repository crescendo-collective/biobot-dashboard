import './MapTooltip.scss'
import type { CountyData } from '../types/map'

interface Props {
    county?: CountyData
    x: number
    y: number
    visible: boolean
}

export default function MapTooltip({
                                       county,
                                       x,
                                       y,
                                       visible,
                                   }: Props) {
    if (!county) return null

    return (
        <div
            className={`map-tooltip ${visible ? 'visible' : ''}`}
            style={{
                left: x + 18,
                top: y + 18,
            }}
        >
            <h3>
                {county.county_name}, {county.state_abbr}
            </h3>

            <div className="tooltip-row">
                <span>Risk Tier</span>
                <span className={`pill ${county.biobot_risk_tier.toLowerCase().replace(' ', '-')}`}>
          {county.biobot_risk_tier}
        </span>
            </div>

            <div className="tooltip-row">
                <span>Trend</span>
                <span>{county.biobot_trend}</span>
            </div>

            <div className="tooltip-row">
                <span>% Change</span>
                <span>
          {county.perc_change == null
              ? '—'
              : `${county.perc_change.toFixed(1)}%`}
        </span>
            </div>
        </div>
    )
}