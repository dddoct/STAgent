import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import { useProjectStore } from '../../stores/projectStore'

export default function AppLayout() {
  const { projects, fetchProjects } = useProjectStore()

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  return (
    <div className="flex h-screen bg-doc-bg text-doc-text">
      <Sidebar projects={projects} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

        <footer className="bg-doc-surface border-t border-doc-border px-6 py-2 text-sm text-doc-subtext flex justify-between">
          <span>STAgent Web v0.1.0</span>
          <span>Ready</span>
        </footer>
      </div>
    </div>
  )
}
