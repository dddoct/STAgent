import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Play, Square, Pause, CheckCircle, XCircle, AlertCircle, FileText } from 'lucide-react'
import { useProjectStore } from '../stores/projectStore'
import { useRunStore } from '../stores/runStore'

export default function RunPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentProject, fetchProject } = useProjectStore()
  const {
    status, progress, total, passed, failed, errors, logs, results,
    startRun, stopRun, reset
  } = useRunStore()

  const [autoScroll, setAutoScroll] = useState(true)

  useEffect(() => {
    if (id) {
      fetchProject(id)
    }
    return () => reset()
  }, [id])

  const handleStart = async () => {
    await startRun(id)
  }

  const handleStop = async () => {
    await stopRun()
  }

  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0'

  return (
    <div className="max-w-6xl mx-auto">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">运行测试</h1>

        <div className="flex items-center gap-2">
          {status === 'idle' || status === 'stopped' || status === 'completed' ? (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
            >
              <Play className="w-4 h-4" />
              开始测试
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            >
              <Square className="w-4 h-4" />
              停止
            </button>
          )}

          {status === 'completed' && (
            <button
              onClick={() => navigate(`/reports/${id}`)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors"
            >
              <FileText className="w-4 h-4" />
              查看报告
            </button>
          )}
        </div>
      </div>

      {/* 进度显示 */}
      {status !== 'idle' && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${
                status === 'running' ? 'bg-green-500 animate-pulse' :
                status === 'completed' ? 'bg-blue-500' :
                status === 'stopped' ? 'bg-yellow-500' : 'bg-gray-400'
              }`} />
              <span className="font-medium">
                {status === 'running' ? '运行中...' :
                 status === 'completed' ? '已完成' :
                 status === 'stopped' ? '已停止' : '等待中'}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {progress} / {total}
            </span>
          </div>

          {/* 进度条 */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className="bg-primary-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${total > 0 ? (progress / total) * 100 : 0}%` }}
            />
          </div>

          {/* 统计 */}
          <div className="grid grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <div className="text-sm text-gray-500">通过</div>
                <div className="text-xl font-bold text-green-600">{passed}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <div>
                <div className="text-sm text-gray-500">失败</div>
                <div className="text-xl font-bold text-red-600">{failed}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <div>
                <div className="text-sm text-gray-500">错误</div>
                <div className="text-xl font-bold text-yellow-600">{errors}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div>
                <div className="text-sm text-gray-500">通过率</div>
                <div className="text-xl font-bold text-primary-600">{passRate}%</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 日志和结果 */}
      <div className="grid grid-cols-2 gap-6">
        {/* 日志 */}
        <div className="bg-white rounded-lg shadow">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold">实时日志</h2>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="w-4 h-4"
              />
              自动滚动
            </label>
          </div>

          <div className="h-96 overflow-y-auto p-4 bg-gray-900 text-gray-100 font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                {status === 'idle' ? '点击"开始测试"运行测试' : '等待日志输出...'}
              </div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="mb-1">
                  <span className="text-gray-500">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  {' '}
                  <span className={
                    log.level === 'error' ? 'text-red-400' :
                    log.level === 'warning' ? 'text-yellow-400' :
                    'text-green-400'
                  }>
                    [{log.level.toUpperCase()}]
                  </span>
                  {' '}
                  <span>{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 结果列表 */}
        <div className="bg-white rounded-lg shadow">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold">执行结果</h2>
            <span className="text-sm text-gray-500">
              {results.length} 个用例
            </span>
          </div>

          <div className="h-96 overflow-y-auto">
            {results.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                暂无执行结果
              </div>
            ) : (
              <div className="divide-y">
                {results.map((result, i) => (
                  <div
                    key={i}
                    className={`p-4 flex items-center gap-3 ${
                      result.passed ? 'bg-green-50' : 'bg-red-50'
                    }`}
                  >
                    {result.passed ? (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {result.test_case_id}
                      </div>
                      <div className="text-xs text-gray-500">
                        {result.reason || (result.passed ? '通过' : '失败')}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {result.duration}s
                    </div>
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
