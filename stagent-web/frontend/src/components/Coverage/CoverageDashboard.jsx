export default function CoverageDashboard({ coverage }) {
  if (!coverage) {
    return (
      <div className="p-8 text-center text-gray-500 border-2 border-dashed rounded-lg">
        暂无覆盖率数据
      </div>
    );
  }

  const metrics = [
    {
      label: '行覆盖',
      covered: coverage.lines?.covered || 0,
      total: coverage.lines?.total || 0,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
    },
    {
      label: '分支覆盖',
      covered: coverage.branches?.covered || 0,
      total: coverage.branches?.total || 0,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric) => {
          const percentage = metric.total > 0
            ? Math.round((metric.covered / metric.total) * 100)
            : 0;

          return (
            <div key={metric.label} className="p-6 bg-white border rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-3">{metric.label}</h3>

              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="35"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="35"
                      fill="none"
                      stroke={metric.color}
                      strokeWidth="8"
                      strokeDasharray={`${percentage * 2.2} 220`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold">{percentage}%</span>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="text-2xl font-bold">{metric.covered}</div>
                  <div className="text-sm text-gray-500">/ {metric.total} 行</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${metric.color} transition-all`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {coverage.functions && coverage.functions.length > 0 && (
        <div className="p-4 bg-white border rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-3">函数覆盖</h3>
          <div className="space-y-2">
            {coverage.functions.map((func, index) => (
              <div key={index} className="flex items-center justify-between py-1">
                <span className="font-mono text-sm">{func.name}</span>
                <span className="text-sm text-gray-500">{func.lines}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {coverage.uncovered_lines && coverage.uncovered_lines.length > 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">
            未覆盖行号 ({coverage.uncovered_lines.length} 个)
          </h3>
          <div className="flex flex-wrap gap-2">
            {coverage.uncovered_lines.slice(0, 20).map((line, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded font-mono"
              >
                {line}
              </span>
            ))}
            {coverage.uncovered_lines.length > 20 && (
              <span className="px-2 py-1 text-yellow-600 text-xs">
                ... 还有 {coverage.uncovered_lines.length - 20} 个
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
