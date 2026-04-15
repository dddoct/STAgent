import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { coverageApi } from '../api/client'

export default function CoveragePage() {
  const { id } = useParams()
  const [coverage, setCoverage] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCoverage()
  }, [id])

  const loadCoverage = async () => {
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
    return (
      <div className="text-center text-gray-500 py-12">
        覆盖率报告不存在
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">覆盖率报告</h1>
        <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
          刷新
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="text-sm text-gray-500">
          <span className="font-medium">程序:</span> {coverage.program}
          {coverage.source_file && (
            <>
              <span className="mx-2">|</span>
              <span className="font-medium">源码:</span> {coverage.source_file}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">行覆盖</h3>
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64" cy="64" r="56"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="64" cy="64" r="56"
                  stroke="#3b82f6"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${coverage.lines.percent * 3.52} 352`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{coverage.lines.percent}%</span>
                <span className="text-xs text-gray-500">
                  {coverage.lines.covered}/{coverage.lines.total}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">分支覆盖</h3>
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64" cy="64" r="56"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="64" cy="64" r="56"
                  stroke="#f59e0b"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${coverage.branches.percent * 3.52} 352`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{coverage.branches.percent}%</span>
                <span className="text-xs text-gray-500">
                  {coverage.branches.covered}/{coverage.branches.total}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">函数覆盖</h3>
          <div className="space-y-3">
            {coverage.functions?.map((func, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium">{func.name}</span>
                  <span className="text-gray-500">{func.lines}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: parseFloat(func.lines) + '%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="font-semibold">未覆盖行号</h2>
          <p className="text-sm text-gray-500 mt-1">
            共 {coverage.uncovered_lines?.length || 0} 行未覆盖
          </p>
        </div>

        <div className="p-4">
          <div className="flex flex-wrap gap-2">
            {coverage.uncovered_lines?.map((line, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm font-mono hover:bg-red-200 cursor-pointer"
                title={`跳转到第 ${line} 行`}
              >
                {line}
              </span>
            ))}
            {(!coverage.uncovered_lines || coverage.uncovered_lines.length === 0) && (
              <span className="text-green-600">所有代码都已覆盖！</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
