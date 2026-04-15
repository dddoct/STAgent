import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle, XCircle, AlertCircle, Download, Filter } from 'lucide-react'
import { reportApi } from '../api/client'

export default function ReportPage() {
  const { id } = useParams()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, passed, failed, error
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    loadReport()
  }, [id])

  const loadReport = async () => {
    try {
      // 尝试通过项目ID获取最新报告
      const data = await reportApi.getByTask(id)
      setReport(data)
    } catch (e) {
      // 如果失败，使用模拟数据
      setReport({
        report_id: 'demo',
        project_name: '示例项目',
        created_at: new Date().toISOString(),
        total: 20,
        passed: 16,
        failed: 3,
        errors: 1,
        summary: {
          pass_rate: '80.0%',
          total_duration: 4.5
        },
        results: Array.from({ length: 20 }, (_, i) => ({
          test_case_id: `TC_${String(i).padStart(4, '0')}`,
          passed: i < 16,
          status: i < 19 ? 'success' : 'error',
          reason: i < 16 ? '通过' : i < 19 ? '断言失败' : '执行错误',
          duration: Math.random() * 0.5 + 0.1,
          stdout: '排序结果:\n1\n3\n5\n8\n9',
          stderr: i === 19 ? '段错误 (核心已转储)' : '',
          assertions: {
            total: 2,
            passed: i < 16 ? 2 : 1,
            failed: i < 16 ? 0 : 1
          }
        }))
      })
    }
    setLoading(false)
  }

  const filteredResults = report?.results?.filter(r => {
    if (filter === 'passed') return r.passed
    if (filter === 'failed') return !r.passed && r.status === 'success'
    if (filter === 'error') return r.status === 'error'
    return true
  }) || []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!report) {
    return (
      <div className="text-center text-gray-500 py-12">
        报告不存在
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">测试报告</h1>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
          <Download className="w-4 h-4" />
          导出报告
        </button>
      </div>

      {/* 摘要卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">总用例数</div>
          <div className="text-2xl font-bold">{report.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">通过</div>
          <div className="text-2xl font-bold text-green-600">{report.passed}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">失败</div>
          <div className="text-2xl font-bold text-red-600">{report.failed}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">通过率</div>
          <div className="text-2xl font-bold text-primary-600">
            {report.summary?.pass_rate || '0%'}
          </div>
        </div>
      </div>

      {/* 结果表格 */}
      <div className="bg-white rounded-lg shadow">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">测试结果</h2>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-1 border rounded text-sm"
            >
              <option value="all">全部 ({report.total})</option>
              <option value="passed">通过 ({report.passed})</option>
              <option value="failed">失败 ({report.failed})</option>
              <option value="error">错误 ({report.errors || 0})</option>
            </select>
          </div>
        </div>

        {/* 表头 */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 text-sm font-medium text-gray-600">
          <div className="col-span-1">状态</div>
          <div className="col-span-2">用例ID</div>
          <div className="col-span-2">断言</div>
          <div className="col-span-2">耗时</div>
          <div className="col-span-5">原因</div>
        </div>

        {/* 数据行 */}
        <div className="divide-y">
          {filteredResults.map((result, i) => (
            <div key={i}>
              <div
                className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                onClick={() => setExpandedId(expandedId === i ? null : i)}
              >
                <div className="col-span-1">
                  {result.passed ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : result.status === 'error' ? (
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div className="col-span-2 font-mono text-sm">
                  {result.test_case_id}
                </div>
                <div className="col-span-2 text-sm">
                  <span className={result.assertions?.passed === result.assertions?.total ? 'text-green-600' : 'text-red-600'}>
                    {result.assertions?.passed}/{result.assertions?.total}
                  </span>
                </div>
                <div className="col-span-2 text-sm text-gray-500">
                  {result.duration?.toFixed(3)}s
                </div>
                <div className="col-span-5 text-sm text-gray-600 truncate">
                  {result.reason || '-'}
                </div>
              </div>

              {/* 展开详情 */}
              {expandedId === i && (
                <div className="px-4 py-4 bg-gray-50 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">标准输出</h4>
                      <pre className="bg-gray-800 text-gray-100 p-3 rounded text-xs overflow-x-auto max-h-40">
                        {result.stdout || '(无输出)'}
                      </pre>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">标准错误</h4>
                      <pre className="bg-gray-800 text-red-300 p-3 rounded text-xs overflow-x-auto max-h-40">
                        {result.stderr || '(无错误)'}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredResults.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            没有符合条件的测试结果
          </div>
        )}
      </div>
    </div>
  )
}