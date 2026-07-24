import './MapViewToggle.scss'

export type MapViewMode = 'county' | 'state'

export interface MapViewToggleProps {
  value: MapViewMode
  onChange: (mode: MapViewMode) => void
}

export default function MapViewToggle({ value, onChange }: MapViewToggleProps) {
  return (
    <div className="map-view-toggle" role="group" aria-label="Map geography level">
      <button
        type="button"
        className={`map-view-toggle-option ${value === 'county' ? 'active' : ''}`}
        aria-pressed={value === 'county'}
        onClick={() => onChange('county')}
      >
        County
      </button>
      <button
        type="button"
        className={`map-view-toggle-option ${value === 'state' ? 'active' : ''}`}
        aria-pressed={value === 'state'}
        onClick={() => onChange('state')}
      >
        State
      </button>
    </div>
  )
}
