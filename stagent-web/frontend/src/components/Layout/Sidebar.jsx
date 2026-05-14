import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { FolderKanban, Plus, Trash2, Settings } from 'lucide-react'
import { useProjectStore } from '../../stores/projectStore'

export default function Sidebar({ projects }) {
  const navigate = useNavigate()
  const params = useParams()
  const { deleteProject } = useProjectStore()

  const handleDelete = async (e, projectId) => {
    e.preventDefault()
    e.stopPropagation()
    if (confirm('确定要删除这个项目吗？')) {
      const deleted = await deleteProject(projectId)
      if (deleted && params.id === projectId) {
        navigate('/')
      }
    }
  }

  return (
    <aside className="w-72 bg-doc-surface border-r border-doc-border flex flex-col">
      <div className="p-4 border-b border-doc-border">
        <button onClick={() => navigate('/')} className="text-left group">
          <h1 className="text-xl font-semibold flex items-center gap-2 text-doc-text group-hover:text-primary-700 transition-colors">
            <Settings className="w-6 h-6 text-primary-600" />
            STAgent
          </h1>
          <p className="text-xs text-doc-subtext mt-1">软件测试智能体</p>
        </button>
      </div>

      <div className="p-4">
        <button
          onClick={() => navigate('/')}
          className="doc-btn-primary w-full"
        >
          <Plus className="w-4 h-4" />
          新建项目 New Project
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2 text-xs text-doc-subtext uppercase tracking-wider">
          Projects
        </div>

        <nav className="space-y-1 px-2">
          {projects.length === 0 ? (
            <div className="px-4 py-2 text-doc-subtext text-sm">
              暂无项目 No projects
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
                    `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors border ${
                      isActive
                        ? 'bg-primary-50 border-primary-200 text-primary-800'
                        : 'border-transparent hover:bg-doc-muted text-doc-subtext hover:text-doc-text'
                    }`
                  }
                >
                  <FolderKanban className="w-4 h-4" />
                  <span className="flex-1 truncate">{project.name}</span>
                </NavLink>

                <button
                  onClick={(e) => handleDelete(e, project.id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 text-red-600 transition-all"
                  title="删除项目"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </nav>
      </div>

      <div className="p-4 border-t border-doc-border text-xs text-doc-subtext">
        {projects.length} projects
      </div>
    </aside>
  )
}
