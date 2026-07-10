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

      <style>{`
        .insight-card {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .insight-heading {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .insight-icon {
          font-size: 15px;
        }
        .insight-label {
          font-family: var(--font-mono);
          font-size: 14px;
          letter-spacing: 0.05em;
        }
        .insight-stat {
          font-family: var(--font-display);
          font-size: 44px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .insight-arrow {
          font-size: 28px;
        }
        .insight-description {
          font-size: 14px;
          line-height: 1.5;
          color: var(--text);
          max-width: 240px;
          margin: 0;
        }
        .insight-action {
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.1em;
          text-decoration: underline;
          width: fit-content;
          margin-top: 4px;
        }
      `}</style>
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
      <div className="insight-rail" />
      <div className="insight-stack">
        <InsightCard {...risk} tone="risk" />
        <InsightCard {...forecast} tone="forecast" />
      </div>

      <style>{`
        .insight-panel {
          display: flex;
          gap: 24px;
          padding: 8px 40px 40px 0;
        }
        .insight-rail {
          width: 1px;
          background: var(--border);
        }
        .insight-stack {
          display: flex;
          flex-direction: column;
          gap: 64px;
          padding-top: 4px;
        }
      `}</style>
    </aside>
  )
}
