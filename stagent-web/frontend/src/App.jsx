import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout'
import ProjectsPage from './pages/ProjectsPage'
import ConfigPage from './pages/ConfigPage'
import RunPage from './pages/RunPage'
import ReportPage from './pages/ReportPage'
import CoveragePage from './pages/CoveragePage'
import LoginPage from './pages/LoginPage'
import { useAuthStore } from './stores/authStore'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 登录页（不需要 Layout） */}
        <Route path="/login" element={<LoginPage />} />

        {/* 受保护的路由 */}
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
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
