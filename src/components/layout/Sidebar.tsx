export interface TrackerItem {
  id: string
  label: string
}

export interface TrackerGroup {
  items: TrackerItem[]
  moreCount?: number
}

interface TrackerListProps {
  title: string
  items: TrackerItem[]
  activeId: string | null
  onSelect: (id: string) => void
  moreCount?: number
}

function TrackerList({ title, items, activeId, onSelect, moreCount }: TrackerListProps) {
  return (
    <div className="tracker-list">
      <span className="tracker-title">{title}</span>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <button
              className={`tracker-item ${activeId === item.id ? 'active' : ''}`}
              onClick={() => onSelect(item.id)}
            >
              {activeId === item.id && <span className="tracker-dot" />}
              {item.label}
            </button>
          </li>
        ))}
      </ul>
      {moreCount ? <span className="tracker-more">+ {moreCount} more</span> : null}

      <style>{`
        .tracker-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .tracker-title {
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.15em;
          color: var(--text-muted);
        }
        ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .tracker-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: var(--font-mono);
          font-size: 15px;
          color: var(--text);
          text-align: left;
        }
        .tracker-item.active {
          color: var(--accent-cyan);
        }
        .tracker-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent-cyan);
        }
        .tracker-more {
          font-family: var(--font-mono);
          font-size: 15px;
          color: var(--text);
        }
      `}</style>
    </div>
  )
}

export interface SidebarProps {
  pathogens: TrackerGroup
  drugs: TrackerGroup
  activePathogenId: string | null
  onSelectPathogen: (id: string) => void
  activeDrugId: string | null
  onSelectDrug: (id: string) => void
}

export default function Sidebar({
  pathogens,
  drugs,
  activePathogenId,
  onSelectPathogen,
  activeDrugId,
  onSelectDrug,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <TrackerList
        title="PATHOGENS"
        items={pathogens.items}
        activeId={activePathogenId}
        onSelect={onSelectPathogen}
        moreCount={pathogens.moreCount}
      />
      <TrackerList
        title="DRUGS"
        items={drugs.items}
        activeId={activeDrugId}
        onSelect={onSelectDrug}
        moreCount={drugs.moreCount}
      />

      <style>{`
        .sidebar {
          display: flex;
          flex-direction: column;
          gap: 56px;
          padding: 8px 40px 40px;
        }
      `}</style>
    </aside>
  )
}
