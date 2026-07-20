import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import MapContainer from '@/components/layout/MapContainer'
import MapLegend from '@/components/layout/MapContainer/MapLegend'
import InsightPanel from '@/components/layout/InsightPanel'
import type { Insight } from '@/components/layout/InsightPanel'
import { pathogens, drugs, DEFAULT_DISEASE_ID } from '@/data/trackers'
import './App.scss'

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

export default function Dashboard() {
  // The URL is the source of truth for which pathogen is selected —
  // reading it here (rather than mirroring it into a separate
  // useState) means there's only one place this can get out of sync.
  // Available to any future API call as-is: useParams().disease.
  const { disease } = useParams<{ disease: string }>()
  const navigate = useNavigate()

  const [activeDrugId, setActiveDrugId] = useState<string | null>(null)

  const validPathogenIds = useMemo(() => new Set(pathogens.items.map((item) => item.id)), [])

  // Someone can type/link to any string in the :disease slot — if it
  // isn't a pathogen we actually know about, redirect to the default
  // before rendering anything else, rather than letting the sidebar
  // and map sit in a state that matches nothing.
  if (!disease || !validPathogenIds.has(disease)) {
    return <Navigate to={`/${DEFAULT_DISEASE_ID}`} replace />
  }

  const handleSelectPathogen = (id: string) => {
    navigate(`/${id}`)
  }

  return (
    <div className="app">
      <Header />
      <div className="app-body">
        <Sidebar
          pathogens={pathogens}
          drugs={drugs}
          activePathogenId={disease}
          onSelectPathogen={handleSelectPathogen}
          activeDrugId={activeDrugId}
          onSelectDrug={setActiveDrugId}
        />
        <div>
          <MapContainer />
          <MapLegend />
        </div>
        <InsightPanel risk={risk} forecast={forecast} />
      </div>
    </div>
  )
}
