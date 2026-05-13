import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Settings, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, register, isAuthenticated, enterGuest } = useAuthStore()

  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: ''
  })

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  if (isAuthenticated) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        await login(form.username, form.password)
        navigate('/')
      } else {
        await register(form.username, form.email, form.password)
        await login(form.username, form.password)
        navigate('/')
      }
    } catch (err) {
      const message = err.response?.data?.detail || err.message
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-doc-bg flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 items-stretch">
        <section className="doc-card p-8 md:p-10 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 mb-6">
              STAgent Web Console
            </div>
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-50 rounded-xl mb-5">
              <Settings className="w-6 h-6 text-primary-600" />
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950">软件测试智能体</h1>
            <p className="mt-4 text-slate-600 leading-7 max-w-xl">
              用文档化的工作流管理测试项目，从 Config 到 Run，再到 Report 与 Coverage。
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-10 text-sm">
            {['Config-driven', 'Real-time logs', 'Coverage report'].map(item => (
              <div key={item} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-600">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="doc-card p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-slate-950">{isLogin ? '登录 Login' : '注册 Register'}</h2>
            <p className="text-sm text-slate-500 mt-1">进入 STAgent 测试工作台</p>
          </div>

          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`py-2 rounded-lg text-sm font-medium transition-colors ${isLogin ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              登录
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`py-2 rounded-lg text-sm font-medium transition-colors ${!isLogin ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              注册
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="doc-label">用户名 Username</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="doc-input"
                placeholder="输入用户名"
                required
              />
            </div>

            {!isLogin && (
              <div>
                <label className="doc-label">邮箱 Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="doc-input"
                  placeholder="输入邮箱"
                  required
                />
              </div>
            )}

            <div>
              <label className="doc-label">密码 Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="doc-input pr-10"
                  placeholder="输入密码"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="doc-btn-primary w-full disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLogin ? '登录 Login' : '注册 Register'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              onClick={() => enterGuest()}
              className="text-sm text-slate-500 hover:text-primary-600"
            >
              游客模式访问 Continue as guest
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
