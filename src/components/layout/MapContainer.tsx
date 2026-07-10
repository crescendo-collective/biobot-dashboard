import type { ReactNode } from 'react'
import './MapContainer.scss'

export interface MapContainerProps {
  children?: ReactNode
}

export default function MapContainer({ children }: MapContainerProps) {
  return (
    <div className="map-container">
      {children ?? (
        <div className="map-placeholder">
          <span className="map-placeholder-title">Map container</span>
          <p>
            County-level choropleth renders here. Suggested stack:{' '}
            <code>react-simple-maps</code> + a US counties TopoJSON, colored
            by whatever metric is selected in the sidebar.
          </p>
        </div>
      )}
    </div>
  )
}
