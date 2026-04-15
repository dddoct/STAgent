import { NavLink, useNavigate } from 'react-router-dom'
import { FolderKanban, Plus, Trash2, Settings } from 'lucide-react'
import { useProjectStore } from '../../stores/projectStore'

export default function Sidebar({ projects }) {
  const navigate = useNavigate()
  const { deleteProject } = useProjectStore()

  const handleDelete = async (e, projectId) => {
    e.preventDefault()
    e.stopPropagation()
    if (confirm('确定要删除这个项目吗？')) {
      await deleteProject(projectId)
    }
  }

  return (
    <aside className="w-64 bg-gray-800 text-white flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary-400" />
          STAgent
        </h1>
        <p className="text-xs text-gray-400 mt-1">软件测试智能体</p>
      </div>

      {/* 新建按钮 */}
      <div className="p-4">
        <button
          onClick={() => navigate('/')}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded flex items-center justify-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建项目
        </button>
      </div>

      {/* 项目列表 */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2 text-xs text-gray-400 uppercase tracking-wider">
          项目列表
        </div>

        <nav className="space-y-1 px-2">
          {projects.length === 0 ? (
            <div className="px-4 py-2 text-gray-400 text-sm">
              暂无项目
            </div>
          ) : (
            projects.map(project => (
              <div
                key={project.id}
                className="group relative"
              >
                <NavLink
                  to={`/projects/${project.id}`}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                      isActive
                        ? 'bg-primary-600 text-white'
                        : 'hover:bg-gray-700 text-gray-300'
                    }`
                  }
                >
                  <FolderKanban className="w-4 h-4" />
                  <span className="flex-1 truncate">{project.name}</span>
                </NavLink>

                {/* 删除按钮 */}
                <button
                  onClick={(e) => handleDelete(e, project.id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
                  title="删除项目"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </nav>
      </div>

      {/* 底部信息 */}
      <div className="p-4 border-t border-gray-700 text-xs text-gray-400">
        {projects.length} 个项目
      </div>
    </aside>
  )
}