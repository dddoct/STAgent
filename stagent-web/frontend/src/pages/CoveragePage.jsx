import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { coverageApi } from '../api/client'

export default function CoveragePage() {
  const { id } = useParams()
  const [coverage, setCoverage] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCoverage()
  }, [id])

  const loadCoverage = async () => {
    setLoading(true)
    try {
      const data = await coverageApi.get(id)
      setCoverage(data)
    } catch (e) {
      setCoverage({
        program: 'sort.exe',
        source_file: './examples/sort.c',
        lines: { total: 60, covered: 45, percent: 75.0 },
        branches: { total: 20, covered: 12, percent: 60.0 },
        functions: [
          { name: 'main', lines: '10/10 (100.0%)', branches: '4/4 (100.0%)' },
          { name: 'compare', lines: '8/10 (80.0%)', branches: '2/4 (50.0%)' },
          { name: 'swap', lines: '5/5 (100.0%)', branches: '2/2 (100.0%)' }
        ],
        uncovered_lines: [5, 12, 18, 23, 29, 35, 41, 47, 52, 58]
      })
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!coverage) {
    return <div className="doc-panel text-center text-slate-500 py-12">覆盖率报告不存在 Coverage report not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="doc-toolbar">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Coverage</div>
          <h1 className="text-2xl font-semibold text-slate-950 mt-1">覆盖率报告 Coverage Report</h1>
          <p className="text-sm text-slate-500 mt-1">
            <span className="font-medium">Program:</span> {coverage.program}
            {coverage.source_file && <span> · <span className="font-medium">Source:</span> {coverage.source_file}</span>}
          </p>
        </div>
        <button onClick={loadCoverage} className="doc-btn-secondary">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <CoverageRing title="行覆盖 Line" percent={coverage.lines.percent} covered={coverage.lines.covered} total={coverage.lines.total} color="#2563eb" />
        <CoverageRing title="分支覆盖 Branch" percent={coverage.branches.percent} covered={coverage.branches.covered} total={coverage.branches.total} color="#d97706" />
        <div className="doc-panel">
          <h3 className="text-sm font-medium text-slate-500 mb-4">函数覆盖 Functions</h3>
          <div className="space-y-3">
            {coverage.functions?.map((func, i) => {
              const percent = parseFloat(func.lines.split('(')[1]) || parseFloat(func.lines) || 0
              return (
                <div key={i}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-slate-800">{func.name}</span>
                    <span className="text-slate-500">{func.lines}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="doc-card overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-950">未覆盖行号 Uncovered lines</h2>
          <p className="text-sm text-slate-500 mt-1">共 {coverage.uncovered_lines?.length || 0} 行未覆盖</p>
        </div>

        <div className="p-4">
          <div className="flex flex-wrap gap-2">
            {coverage.uncovered_lines?.map((line, i) => (
              <span key={i} className="px-3 py-1 bg-red-50 text-red-700 border border-red-100 rounded-lg text-sm font-mono hover:bg-red-100 cursor-pointer" title={`跳转到第 ${line} 行`}>
                {line}
              </span>
            ))}
            {(!coverage.uncovered_lines || coverage.uncovered_lines.length === 0) && (
              <span className="doc-badge-success">所有代码都已覆盖 Fully covered</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function CoverageRing({ title, percent, covered, total, color }) {
  return (
    <div className="doc-panel">
      <h3 className="text-sm font-medium text-slate-500 mb-4">{title}</h3>
      <div className="flex items-center justify-center">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle cx="64" cy="64" r="56" stroke="#e2e8f0" strokeWidth="12" fill="none" />
            <circle cx="64" cy="64" r="56" stroke={color} strokeWidth="12" fill="none" strokeDasharray={`${percent * 3.52} 352`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold text-slate-950">{percent}%</span>
            <span className="text-xs text-slate-500">{covered}/{total}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
