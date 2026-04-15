import { useNavigate, useParams } from 'react-router-dom'
import { Play, FileText, BarChart3, HelpCircle } from 'lucide-react'
import { useProjectStore } from '../../stores/projectStore'

export default function Header() {
  const navigate = useNavigate()
  const params = useParams()
  const { currentProject } = useProjectStore()

  const projectId = params.id

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {currentProject && (
          <div>
            <h2 className="text-lg font-medium">{currentProject.name}</h2>
            {currentProject.description && (
              <p className="text-sm text-gray-500">{currentProject.description}</p>
            )}
          </div>
        )}
      </div>

      <nav className="flex items-center gap-2">
        {projectId && (
          <>
            <button
              onClick={() => navigate(`/projects/${projectId}/run`)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
            >
              <Play className="w-4 h-4" />
              运行测试
            </button>

            <button
              onClick={() => navigate(`/projects/${projectId}`)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              配置
            </button>
          </>
        )}

        <button
          className="p-2 text-gray-500 hover:bg-gray-100 rounded"
          title="帮助"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </nav>
    </header>
  )
}