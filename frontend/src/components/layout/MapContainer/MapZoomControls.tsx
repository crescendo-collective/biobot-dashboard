import './MapZoomControls.scss'

export interface MapZoomControlsProps {
  zoomPercent: number
  onZoomIn: () => void
  onZoomOut: () => void
  onRecenter: () => void
}

export default function MapZoomControls({
  zoomPercent,
  onZoomIn,
  onZoomOut,
  onRecenter,
}: MapZoomControlsProps) {
  return (
    <div className="map-zoom-controls">
      <button type="button" className="map-zoom-button" onClick={onZoomIn} aria-label="Zoom in">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
          <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      <button type="button" className="map-zoom-button" onClick={onZoomOut} aria-label="Zoom out">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
          <path d="M2 8h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      <button
        type="button"
        className="map-zoom-button"
        onClick={onRecenter}
        aria-label="Reset zoom and re-center"
      >
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
          <path
            d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <span className="map-zoom-percent">{zoomPercent}%</span>
    </div>
  )
}
