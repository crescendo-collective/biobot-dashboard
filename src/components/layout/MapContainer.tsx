import type { ReactNode } from 'react'

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

      <style>{`
        .map-container {
          position: relative;
          width: 100%;
          min-height: 520px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .map-placeholder {
          border: 1px dashed var(--border);
          border-radius: 4px;
          padding: 32px 40px;
          max-width: 420px;
          text-align: center;
          color: var(--text-muted);
        }
        .map-placeholder-title {
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.1em;
          color: var(--accent-cyan);
        }
        .map-placeholder p {
          font-size: 13px;
          line-height: 1.6;
          margin-top: 10px;
        }
        .map-placeholder code {
          font-family: var(--font-mono);
          color: var(--text);
        }
      `}</style>
    </div>
  )
}
