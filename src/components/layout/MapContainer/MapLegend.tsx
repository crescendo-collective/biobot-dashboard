import { RISK_TIER_ORDER, getTierColor } from './colors'
import './MapLegend.scss'

export default function MapLegend() {
  return (
    <div className="map-legend">
      <div className="map-legend-title">Risk Tiers:</div>

      <ul className="map-legend-list">
        {RISK_TIER_ORDER.map((tier) => (
          <li key={tier} className="map-legend-item">
            <span className="map-legend-swatch" style={{ background: getTierColor(tier) }} />
            <span className="map-legend-label">{tier}</span>
            <span
              className="map-legend-info"
              title={`About the "${tier}" risk tier`}
              aria-label={`More info about the ${tier} risk tier`}
            >
              ?
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
