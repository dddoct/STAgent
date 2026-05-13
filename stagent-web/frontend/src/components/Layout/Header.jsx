import { useNavigate, useParams } from 'react-router-dom'
import { Play, HelpCircle, LogOut, User } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useProjectStore } from '../../stores/projectStore'

export default function Header() {
  const navigate = useNavigate()
  const params = useParams()
  const { currentProject } = useProjectStore()
  const { user, logout } = useAuthStore()

  const projectId = params.id

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-doc-surface border-b border-doc-border px-4 md:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4 min-w-0">
        {currentProject && (
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-doc-text truncate">{currentProject.name}</h2>
            {currentProject.description && (
              <p className="text-sm text-doc-subtext truncate">{currentProject.description}</p>
            )}
          </div>
        )}
      </div>

      <nav className="flex items-center gap-2">
        {projectId && (
          <>
            <button
              onClick={() => navigate(`/projects/${projectId}/run`)}
              className="doc-btn-primary"
            >
              <Play className="w-4 h-4" />
              Run Test
            </button>

            <button
              onClick={() => navigate(`/projects/${projectId}`)}
              className="doc-btn-secondary"
            >
              Config
            </button>
          </>
        )}

        {user && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-doc-muted rounded-full border border-doc-border">
            <User className="w-4 h-4 text-doc-subtext" />
            <span className="text-sm text-doc-subtext">{user.username}</span>
            <button
              onClick={handleLogout}
              className="ml-1 text-doc-subtext hover:text-doc-danger"
              title="退出登录 / Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        <button
          onClick={() => navigate('/help')}
          className="doc-btn-ghost"
          title="帮助 / Help"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </nav>
    </header>
  )
}
