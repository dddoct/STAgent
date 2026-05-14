import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FolderKanban, Clock, ArrowRight } from 'lucide-react'
import { useProjectStore } from '../stores/projectStore'

export default function ProjectsPage() {
  const navigate = useNavigate()
  const { projects, createProject, clearCurrentProject } = useProjectStore()
  const [showModal, setShowModal] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', description: '' })

  useEffect(() => {
    clearCurrentProject()
  }, [clearCurrentProject])

  const handleCreate = async (e) => {
    e.preventDefault()
    const project = await createProject(newProject)
    if (project) {
      setShowModal(false)
      setNewProject({ name: '', description: '' })
      navigate(`/projects/${project.id}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="doc-toolbar">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Projects</div>
          <h1 className="text-2xl font-semibold text-slate-950 mt-1">项目列表 Project Index</h1>
          <p className="text-sm text-slate-500 mt-1">创建并管理你的测试配置与运行任务。</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="doc-btn-primary"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="doc-panel p-12 text-center">
          <FolderKanban className="w-14 h-14 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">暂无项目 No projects</h3>
          <p className="text-slate-500 mb-6">创建一个新项目开始测试。</p>
          <button
            onClick={() => setShowModal(true)}
            className="doc-btn-primary mx-auto"
          >
            创建项目 Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <button
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              className="doc-card text-left p-5 hover:border-primary-200 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <FolderKanban className="w-5 h-5 text-primary-600 flex-shrink-0" />
                  <h3 className="font-semibold text-slate-950 truncate">{project.name}</h3>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary-600 transition-colors" />
              </div>

              {project.description ? (
                <p className="text-sm text-slate-500 mb-4 line-clamp-2">{project.description}</p>
              ) : (
                <p className="text-sm text-slate-400 mb-4">No description</p>
              )}

              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="w-3 h-3" />
                {new Date(project.created_at).toLocaleDateString()}
              </div>
            </button>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="doc-card w-full max-w-md p-6">
            <h2 className="text-xl font-semibold text-slate-950 mb-1">新建项目 New Project</h2>
            <p className="text-sm text-slate-500 mb-5">为新的测试任务创建配置容器。</p>

            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="doc-label">项目名称 Name *</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="doc-input"
                  placeholder="输入项目名称"
                  required
                  autoFocus
                />
              </div>

              <div className="mb-6">
                <label className="doc-label">描述 Description</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="doc-input"
                  rows={3}
                  placeholder="描述项目用途"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="doc-btn-secondary"
                >
                  取消 Cancel
                </button>
                <button
                  type="submit"
                  className="doc-btn-primary"
                >
                  创建 Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
