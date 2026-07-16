import './InsightPanel.scss'

export type InsightDirection = 'up' | 'down'

export interface Insight {
  icon: string
  label: string
  percent: number
  direction: InsightDirection
  color: string
  description: string
}

interface InsightCardProps extends Insight {
  tone?: 'risk' | 'forecast'
}

function InsightCard({ icon, label, percent, direction, description, color }: InsightCardProps) {
  const arrow = direction === 'up' ? '↑' : '↓'

  return (
    <div className="insight-card">
      <div className="insight-heading">
        <span className="insight-icon" style={{ color }}>{icon}</span>
        <span className="insight-label">{label}</span>
      </div>
      <div className="insight-stat" style={{ color }}>
        {percent}% <span className="insight-arrow">{arrow}</span>
      </div>
      <p className="insight-description">{description}</p>
      <button className="insight-action">ACTION</button>
    </div>
  )
}

export interface InsightPanelProps {
  risk: Insight
  forecast: Insight
}

export default function InsightPanel({ risk, forecast }: InsightPanelProps) {
  return (
    <aside className="insight-panel">
      <div className="insight-stack">
        <InsightCard {...risk} tone="risk" />
        <InsightCard {...forecast} tone="forecast" />
      </div>
    </aside>
  )
}
