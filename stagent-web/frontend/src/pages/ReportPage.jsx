import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle, XCircle, AlertCircle, Download, Filter } from 'lucide-react'
import { reportApi } from '../api/client'

export default function ReportPage() {
  const { id } = useParams()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    loadReport()
  }, [id])

  const loadReport = async () => {
    try {
      const data = await reportApi.getByTask(id)
      setReport(data)
    } catch (e) {
      setReport({
        report_id: 'demo',
        project_name: '示例项目',
        created_at: new Date().toISOString(),
        total: 20,
        passed: 16,
        failed: 3,
        errors: 1,
        summary: { pass_rate: '80.0%', total_duration: 4.5 },
        results: Array.from({ length: 20 }, (_, i) => ({
          test_case_id: `TC_${String(i).padStart(4, '0')}`,
          passed: i < 16,
          status: i < 19 ? 'success' : 'error',
          reason: i < 16 ? '通过' : i < 19 ? '断言失败' : '执行错误',
          duration: Math.random() * 0.5 + 0.1,
          stdout: '排序结果:\n1\n3\n5\n8\n9',
          stderr: i === 19 ? '段错误' : '',
          assertions: { total: 2, passed: i < 16 ? 2 : 1, failed: i < 16 ? 0 : 1 }
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
    return <LoadingState />
  }

  if (!report) {
    return <div className="doc-panel text-center text-slate-500 py-12">报告不存在 Report not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="doc-toolbar">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Report</div>
          <h1 className="text-2xl font-semibold text-slate-950 mt-1">测试报告 Test Report</h1>
          <p className="text-sm text-slate-500 mt-1">{report.project_name} · {new Date(report.created_at).toLocaleString()}</p>
        </div>
        <button className="doc-btn-secondary">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="总用例 Total" value={report.total} />
        <MetricCard label="通过 Passed" value={report.passed} color="text-green-600" />
        <MetricCard label="失败 Failed" value={report.failed} color="text-red-600" />
        <MetricCard label="通过率 Pass rate" value={report.summary?.pass_rate || '0%'} color="text-primary-600" />
      </div>

      <div className="doc-card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div>
            <h2 className="font-semibold text-slate-950">测试结果 Results</h2>
            <p className="text-xs text-slate-500 mt-1">Click a row to inspect stdout/stderr</p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="doc-input py-1 text-sm">
              <option value="all">全部 All ({report.total})</option>
              <option value="passed">通过 Passed ({report.passed})</option>
              <option value="failed">失败 Failed ({report.failed})</option>
              <option value="error">错误 Error ({report.errors || 0})</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-slate-50 text-sm font-medium text-slate-500 border-b border-slate-200">
          <div className="col-span-1">Status</div>
          <div className="col-span-2">Case ID</div>
          <div className="col-span-2">Assertions</div>
          <div className="col-span-2">Duration</div>
          <div className="col-span-5">Reason</div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredResults.map((result, i) => (
            <div key={i}>
              <div className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-slate-50 cursor-pointer" onClick={() => setExpandedId(expandedId === i ? null : i)}>
                <div className="col-span-1">
                  {result.passed ? <CheckCircle className="w-5 h-5 text-green-600" /> : result.status === 'error' ? <AlertCircle className="w-5 h-5 text-amber-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                </div>
                <div className="col-span-2 font-mono text-sm text-slate-800">{result.test_case_id}</div>
                <div className="col-span-2 text-sm">
                  <span className={result.assertions?.passed === result.assertions?.total ? 'text-green-600' : 'text-red-600'}>
                    {result.assertions?.passed}/{result.assertions?.total}
                  </span>
                </div>
                <div className="col-span-2 text-sm text-slate-500">{result.duration?.toFixed(3)}s</div>
                <div className="col-span-5 text-sm text-slate-600 truncate">{result.reason || '-'}</div>
              </div>

              {expandedId === i && (
                <div className="px-4 py-4 bg-slate-50 border-t border-slate-100">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <OutputBlock title="标准输出 stdout" content={result.stdout || '(无输出)'} />
                    <OutputBlock title="标准错误 stderr" content={result.stderr || '(无错误)'} error />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredResults.length === 0 && <div className="p-8 text-center text-slate-500">没有符合条件的测试结果</div>}
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
    </div>
  )
}

function MetricCard({ label, value, color = 'text-slate-950' }) {
  return (
    <div className="doc-panel">
      <div className="text-sm text-slate-500 mb-1">{label}</div>
      <div className={`text-2xl font-semibold ${color}`}>{value}</div>
    </div>
  )
}

function OutputBlock({ title, content, error }) {
  return (
    <div>
      <h4 className="text-sm font-medium mb-2 text-slate-700">{title}</h4>
      <pre className={`bg-slate-950 ${error ? 'text-red-300' : 'text-slate-100'} p-3 rounded-lg text-xs overflow-x-auto max-h-40`}>
        {content}
      </pre>
    </div>
  )
}
