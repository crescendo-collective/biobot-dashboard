import { useState } from 'react'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import type { TrackerGroup } from './components/layout/Sidebar'
import MapContainer from './components/layout/MapContainer/MapContainer'
import InsightPanel from './components/layout/InsightPanel'
import type { Insight } from './components/layout/InsightPanel'
import './App.scss'

const pathogens: TrackerGroup = {
  items: [
    { id: 'sars-cov-2', label: 'SARS-CoV-2' },
    { id: 'rsv', label: 'RSV' },
    { id: 'flu-a', label: 'Influenza A' },
    { id: 'norovirus', label: 'Norovirus' },
    { id: 'flu-b', label: 'Influenza B' },
    { id: 'adenovirus', label: 'Adenovirus' },
    { id: 'enterovirus', label: 'Enterovirus' },
    { id: 'rhinovirus', label: 'Rhinovirus' },
    { id: 'parainfluenza', label: 'Parainfluenza' },
    { id: 'rotavirus', label: 'Rotavirus' },
  ],
}

const drugs: TrackerGroup = {
  items: [
    { id: 'fentanyl', label: 'Fentanyl' },
    { id: 'cocaine', label: 'Cocaine' },
    { id: 'meth', label: 'Methamphetamine' },
    { id: 'heroin', label: 'Heroin' },
    { id: 'xylazine', label: 'Xylazine' },
    { id: 'mdma', label: 'MDMA' },
    { id: 'oxycodone', label: 'Oxycodone' },
    { id: 'benzodiazepines', label: 'Benzodiazepines' },
  ],
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
    </div>
  )
}
