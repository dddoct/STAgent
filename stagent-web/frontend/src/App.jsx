import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout'
import ProjectsPage from './pages/ProjectsPage'
import ConfigPage from './pages/ConfigPage'
import RunPage from './pages/RunPage'
import ReportPage from './pages/ReportPage'
import CoveragePage from './pages/CoveragePage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ConfigPage />} />
          <Route path="projects/:id/run" element={<RunPage />} />
          <Route path="reports/:id" element={<ReportPage />} />
          <Route path="coverage/:id" element={<CoveragePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
