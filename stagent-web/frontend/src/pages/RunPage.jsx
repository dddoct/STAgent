import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Play, Square, CheckCircle, XCircle, AlertCircle, FileText } from 'lucide-react'
import { useProjectStore } from '../stores/projectStore'
import { useRunStore } from '../stores/runStore'

export default function RunPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { fetchProject } = useProjectStore()
  const {
    status, progress, total, passed, failed, errors, logs, results,
    startRun, stopRun, reset
  } = useRunStore()

  const [autoScroll, setAutoScroll] = useState(true)

  useEffect(() => {
    if (id) fetchProject(id)
    return () => reset()
  }, [id, fetchProject, reset])

  const handleStart = async () => {
    await startRun(id)
  }

  const handleStop = async () => {
    await stopRun()
  }

  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0'
  const isRunnable = status === 'idle' || status === 'stopped' || status === 'completed'

  return (
    <div className="space-y-6">
      <div className="doc-toolbar">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Run</div>
          <h1 className="text-2xl font-semibold text-slate-950 mt-1">运行测试 Test Runner</h1>
          <p className="text-sm text-slate-500 mt-1">实时查看执行状态、日志与单个用例结果。</p>
        </div>

        <div className="flex items-center gap-2">
          {isRunnable ? (
            <button onClick={handleStart} className="doc-btn-primary">
              <Play className="w-4 h-4" />
              Start Run
            </button>
          ) : (
            <button onClick={handleStop} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">
              <Square className="w-4 h-4" />
              Stop
            </button>
          )}

          {status === 'completed' && (
            <button onClick={() => navigate(`/reports/${id}`)} className="doc-btn-secondary">
              <FileText className="w-4 h-4" />
              View Report
            </button>
          )}
        </div>
      </div>

      {status !== 'idle' && (
        <div className="doc-panel space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                status === 'running' ? 'bg-green-500 animate-pulse' :
                status === 'completed' ? 'bg-primary-500' :
                status === 'stopped' ? 'bg-amber-500' : 'bg-slate-400'
              }`} />
              <span className="font-medium text-slate-900">
                {status === 'running' ? '运行中 Running' :
                 status === 'completed' ? '已完成 Completed' :
                 status === 'stopped' ? '已停止 Stopped' : '等待中 Pending'}
              </span>
            </div>
            <span className="text-sm text-slate-500">{progress} / {total}</span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2.5">
            <div
              className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${total > 0 ? (progress / total) * 100 : 0}%` }}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<CheckCircle className="w-5 h-5 text-green-600" />} label="通过 Passed" value={passed} color="text-green-600" />
            <StatCard icon={<XCircle className="w-5 h-5 text-red-600" />} label="失败 Failed" value={failed} color="text-red-600" />
            <StatCard icon={<AlertCircle className="w-5 h-5 text-amber-600" />} label="错误 Errors" value={errors} color="text-amber-600" />
            <StatCard label="通过率 Pass rate" value={`${passRate}%`} color="text-primary-600" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="doc-card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <div>
              <h2 className="font-semibold text-slate-950">实时日志 Logs</h2>
              <p className="text-xs text-slate-500 mt-1">WebSocket output stream</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300"
              />
              Auto scroll
            </label>
          </div>

          <div className="h-96 overflow-y-auto p-4 bg-slate-950 text-slate-100 font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-slate-500 text-center py-8">
                {status === 'idle' ? '点击 Start Run 运行测试' : '等待日志输出...'}
              </div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="mb-1">
                  <span className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>{' '}
                  <span className={log.level === 'error' ? 'text-red-400' : log.level === 'warning' ? 'text-yellow-400' : 'text-green-400'}>
                    [{log.level.toUpperCase()}]
                  </span>{' '}
                  <span>{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="doc-card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <div>
              <h2 className="font-semibold text-slate-950">执行结果 Results</h2>
              <p className="text-xs text-slate-500 mt-1">{results.length} test cases</p>
            </div>
          </div>

          <div className="h-96 overflow-y-auto">
            {results.length === 0 ? (
              <div className="text-slate-500 text-center py-8">暂无执行结果 No results</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {results.map((result, i) => (
                  <div key={i} className="p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                    {result.passed ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-slate-950 truncate">{result.test_case_id}</div>
                      <div className="text-xs text-slate-500">{result.reason || (result.passed ? '通过 Passed' : '失败 Failed')}</div>
                    </div>
                    <div className="text-xs text-slate-400">{result.duration}s</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center gap-3">
      {icon}
      <div>
        <div className="text-sm text-slate-500">{label}</div>
        <div className={`text-xl font-semibold ${color}`}>{value}</div>
      </div>
    </div>
  )
}
