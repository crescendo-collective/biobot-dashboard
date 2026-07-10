import { useState } from 'react'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import type { TrackerGroup } from './components/layout/Sidebar'
import MapContainer from './components/layout/MapContainer'
import InsightPanel from './components/layout/InsightPanel'
import type { Insight } from './components/layout/InsightPanel'

const pathogens: TrackerGroup = {
  items: [
    { id: 'sars-cov-2', label: 'SARS-CoV-2' },
    { id: 'rsv', label: 'RSV' },
    { id: 'flu-a', label: 'Influenza A' },
    { id: 'norovirus', label: 'Norovirus' },
  ],
  moreCount: 16,
}

const drugs: TrackerGroup = {
  items: [
    { id: 'fentanyl', label: 'Fentanyl' },
    { id: 'cocaine', label: 'Cocaine' },
    { id: 'meth', label: 'Methamphetamine' },
    { id: 'heroin', label: 'Heroin' },
  ],
  moreCount: 21,
}

const risk: Insight = {
  icon: '⚠',
  label: 'SARS-CoV-2',
  percent: 35,
  direction: 'up',
  color: 'var(--warn)',
  description: 'Covid is anticipated to increase 35% over the next 2 weeks in Chicago, IL.',
}

const forecast: Insight = {
  icon: '🛡',
  label: 'SARS-CoV-2',
  percent: 24,
  direction: 'down',
  color: 'var(--safe)',
  description: 'Covid is predicted to drop 24% over the next 2 weeks in Austin, TX.',
}

export default function App() {
  const [activePathogenId, setActivePathogenId] = useState<string | null>('sars-cov-2')
  const [activeDrugId, setActiveDrugId] = useState<string | null>(null)

  return (
    <div className="app">
      <Header />
      <div className="app-body">
        <Sidebar
          pathogens={pathogens}
          drugs={drugs}
          activePathogenId={activePathogenId}
          onSelectPathogen={setActivePathogenId}
          activeDrugId={activeDrugId}
          onSelectDrug={setActiveDrugId}
        />
        <MapContainer />
        <InsightPanel risk={risk} forecast={forecast} />
      </div>

      <style>{`
        .app {
          min-height: 100%;
          background: var(--bg-vignette);
        }
        .app-body {
          display: grid;
          grid-template-columns: 260px 1fr 320px;
          align-items: start;
        }
        @media (max-width: 1100px) {
          .app-body {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
