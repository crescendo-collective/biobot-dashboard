import { useState } from 'react'
import './Sidebar.scss'

export interface TrackerItem {
  id: string
  label: string
}

export interface TrackerGroup {
  items: TrackerItem[]
}

const VISIBLE_LIMIT = 5

interface TrackerListProps {
  title: string
  items: TrackerItem[]
  activeId: string | null
  onSelect: (id: string) => void
}

function TrackerList({ title, items, activeId, onSelect }: TrackerListProps) {
  const [expanded, setExpanded] = useState(false)

  const hiddenCount = items.length - VISIBLE_LIMIT
  const visibleItems = expanded ? items : items.slice(0, VISIBLE_LIMIT)

  return (
    <div className="tracker-list">
      <span className="tracker-title">{title}</span>
      <ul>
        {visibleItems.map((item) => (
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
      {hiddenCount > 0 && (
        <button
          className="tracker-more"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
        >
          {expanded ? 'Show less' : `+ ${hiddenCount} more`}
        </button>
      )}
    </div>
  )
}

export interface SidebarProps {
  pathogens: TrackerGroup
  activePathogenId: string | null
  onSelectPathogen: (id: string) => void
}

export default function Sidebar({
  pathogens,
  activePathogenId,
  onSelectPathogen,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <TrackerList
        title="PATHOGENS"
        items={pathogens.items}
        activeId={activePathogenId}
        onSelect={onSelectPathogen}
      />
    </aside>
  )
}
