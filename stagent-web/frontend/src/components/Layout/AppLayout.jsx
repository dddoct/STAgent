import { Outlet, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import { useProjectStore } from '../../stores/projectStore'

export default function AppLayout() {
  const navigate = useNavigate()
  const { projects, fetchProjects } = useProjectStore()

  useEffect(() => {
    fetchProjects()
  }, [])

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 侧边栏 */}
      <Sidebar projects={projects} />

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        {/* 页面内容 */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>

        {/* 状态栏 */}
        <footer className="bg-white border-t border-gray-200 px-6 py-2 text-sm text-gray-500 flex justify-between">
          <span>STAgent Web v0.1.0</span>
          <span>就绪</span>
        </footer>
      </div>
    </div>
  )
}