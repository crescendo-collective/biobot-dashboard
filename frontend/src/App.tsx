import { Navigate, Route, Routes } from 'react-router-dom'
import Dashboard from './Dashboard'
import { DEFAULT_DISEASE_ID } from '@/data/trackers'

export default function App() {
  return (
    <Routes>
      <Route path="/:disease" element={<Dashboard />} />
      <Route path="/" element={<Navigate to={`/${DEFAULT_DISEASE_ID}`} replace />} />
    </Routes>
  )
}
