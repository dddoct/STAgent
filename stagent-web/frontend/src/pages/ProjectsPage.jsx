import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FolderKanban, Clock, ArrowRight, BookOpen, FileText } from 'lucide-react'
import { useProjectStore } from '../stores/projectStore'

export default function ProjectsPage() {
  const navigate = useNavigate()
  const { projects, createProject, clearCurrentProject, examples, fetchExamples, importExample } = useProjectStore()
  const [showModal, setShowModal] = useState(false)
  const [showExamples, setShowExamples] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', description: '' })

  useEffect(() => {
    clearCurrentProject()
    fetchExamples()
  }, [clearCurrentProject, fetchExamples])

  const handleCreate = async (e) => {
    e.preventDefault()
    const project = await createProject(newProject)
    if (project) {
      setShowModal(false)
      setNewProject({ name: '', description: '' })
      navigate(`/projects/${project.id}`)
    }
  }

  const handleImport = async (exampleId) => {
    const project = await importExample(exampleId)
    if (project) {
      setShowExamples(false)
      navigate(`/projects/${project.id}`)
    }
  }

  const statusClass = (status) => {
    if (status === 'completed') return 'doc-badge-success'
    if (status === 'error' || status === 'stopped') return 'doc-badge-danger'
    if (status === 'running') return 'doc-badge-warning'
    return 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600'
  }

  return (
    <div className="space-y-6">
      <div className="doc-toolbar">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Projects</div>
          <h1 className="text-2xl font-semibold text-slate-950 mt-1">项目列表 Project Index</h1>
          <p className="text-sm text-slate-500 mt-1">创建并管理你的测试配置与运行任务。</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowExamples(true)} className="doc-btn-secondary"><BookOpen className="w-4 h-4" /> Import Example</button>
          <button onClick={() => setShowModal(true)} className="doc-btn-primary"><Plus className="w-4 h-4" /> New Project</button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="doc-panel p-10 text-center">
          <FolderKanban className="w-14 h-14 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">暂无项目 No projects</h3>
          <p className="text-slate-500 mb-6">可以创建空项目，也可以直接导入一个可运行的示例。</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={() => setShowModal(true)} className="doc-btn-primary">创建空项目 Blank Project</button>
            <button onClick={() => setShowExamples(true)} className="doc-btn-secondary">导入示例 Import Example</button>
            <button onClick={() => navigate('/help')} className="doc-btn-ghost">查看说明 Docs</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <div key={project.id} className="doc-card p-5 hover:border-primary-200 hover:shadow-md transition-all group">
              <button onClick={() => navigate(`/projects/${project.id}`)} className="text-left w-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <FolderKanban className="w-5 h-5 text-primary-600 flex-shrink-0" />
                    <h3 className="font-semibold text-slate-950 truncate">{project.name}</h3>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary-600 transition-colors" />
                </div>

                {project.description ? <p className="text-sm text-slate-500 mb-4 line-clamp-2">{project.description}</p> : <p className="text-sm text-slate-400 mb-4">No description</p>}

                <div className="flex items-center gap-1 text-xs text-slate-400 mb-3">
                  <Clock className="w-3 h-3" />
                  {new Date(project.created_at).toLocaleDateString()}
                </div>
              </button>

              {project.last_run_status ? (
                <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
                  <span className={statusClass(project.last_run_status)}>{project.last_run_status}</span>
                  <span className="text-xs text-slate-500">{project.last_run_pass_rate || 'N/A'}</span>
                  {project.last_run_task_id && (
                    <button onClick={() => navigate(`/reports/${project.last_run_task_id}`)} className="text-xs text-primary-600 hover:text-primary-700 inline-flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Report
                    </button>
                  )}
                </div>
              ) : (
                <div className="border-t border-slate-100 pt-3 text-xs text-slate-400">No recent run</div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="doc-card w-full max-w-md p-6">
            <h2 className="text-xl font-semibold text-slate-950 mb-1">新建项目 New Project</h2>
            <p className="text-sm text-slate-500 mb-5">为新的测试任务创建配置容器。</p>
            <form onSubmit={handleCreate}>
              <div className="mb-4"><label className="doc-label">项目名称 Name *</label><input type="text" value={newProject.name} onChange={(e) => setNewProject({ ...newProject, name: e.target.value })} className="doc-input" placeholder="输入项目名称" required autoFocus /></div>
              <div className="mb-6"><label className="doc-label">描述 Description</label><textarea value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} className="doc-input" rows={3} placeholder="描述项目用途" /></div>
              <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowModal(false)} className="doc-btn-secondary">取消 Cancel</button><button type="submit" className="doc-btn-primary">创建 Create</button></div>
            </form>
          </div>
        </div>
      )}

      {showExamples && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="doc-card w-full max-w-3xl p-6">
            <div className="flex items-start justify-between mb-5">
              <div><h2 className="text-xl font-semibold text-slate-950">导入示例 Import Example</h2><p className="text-sm text-slate-500 mt-1">选择一个内置项目快速开始。</p></div>
              <button onClick={() => setShowExamples(false)} className="doc-btn-ghost">Close</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {examples.map(example => (
                <button key={example.id} onClick={() => handleImport(example.id)} className="rounded-xl border border-slate-200 p-4 text-left hover:bg-slate-50 hover:border-primary-200 transition-colors">
                  <div className="flex items-center justify-between mb-2"><h3 className="font-semibold text-slate-950">{example.name}</h3><span className="text-xs text-slate-500">{example.category}</span></div>
                  <p className="text-sm text-slate-500">{example.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
