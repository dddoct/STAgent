import { useState } from 'react';
import { ChevronDown, ChevronRight, Check, X, AlertTriangle } from 'lucide-react';

export default function ReportTable({ results }) {
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('all');

  const filteredResults = results.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'passed') return r.passed;
    if (filter === 'failed') return !r.passed;
    return true;
  });

  const statusIcon = (passed) => (
    passed ? (
      <span className="flex items-center gap-1 text-green-600">
        <Check size={14} /> 通过
      </span>
    ) : (
      <span className="flex items-center gap-1 text-red-600">
        <X size={14} /> 失败
      </span>
    )
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">测试结果 ({filteredResults.length})</h3>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded"
          >
            <option value="all">全部</option>
            <option value="passed">仅通过</option>
            <option value="failed">仅失败</option>
          </select>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600 w-8"></th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">用例ID</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">状态</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">耗时</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">断言</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">原因</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredResults.map((result) => (
              <>
                <tr
                  key={result.test_case_id}
                  className={`hover:bg-gray-50 cursor-pointer ${result.passed ? '' : 'bg-red-50'}`}
                  onClick={() => setExpandedId(expandedId === result.test_case_id ? null : result.test_case_id)}
                >
                  <td className="px-4 py-3">
                    {expandedId === result.test_case_id ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">{result.test_case_id}</td>
                  <td className="px-4 py-3">{statusIcon(result.passed)}</td>
                  <td className="px-4 py-3 text-gray-500">{result.duration}s</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      result.assertions?.passed === result.assertions?.total
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {result.assertions?.passed || 0}/{result.assertions?.total || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{result.reason}</td>
                </tr>

                {expandedId === result.test_case_id && (
                  <tr key={`${result.test_case_id}-detail`}>
                    <td colSpan={6} className="px-4 py-4 bg-gray-50">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2">输出内容</h4>
                          <pre className="p-3 bg-white border rounded text-xs overflow-auto max-h-40">
                            {result.stdout || '(无输出)'}
                          </pre>
                        </div>

                        {result.stderr && (
                          <div>
                            <h4 className="text-sm font-medium mb-2 text-red-600">错误输出</h4>
                            <pre className="p-3 bg-red-50 border border-red-200 rounded text-xs overflow-auto max-h-40">
                              {result.stderr}
                            </pre>
                          </div>
                        )}

                        <div>
                          <h4 className="text-sm font-medium mb-2">断言详情</h4>
                          <div className="space-y-2">
                            {result.assertions?.details?.map((assertion, idx) => (
                              <div
                                key={idx}
                                className={`p-3 border rounded ${
                                  assertion.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-sm">{assertion.type}</span>
                                  {assertion.passed ? (
                                    <Check size={14} className="text-green-600" />
                                  ) : (
                                    <X size={14} className="text-red-600" />
                                  )}
                                </div>
                                <p className="text-xs mt-1 text-gray-600">{assertion.message}</p>
                                {!assertion.passed && assertion.expected && (
                                  <p className="text-xs mt-1">
                                    <span className="text-gray-500">期望: </span>
                                    <code className="bg-gray-200 px-1 rounded">{assertion.expected}</code>
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>

        {filteredResults.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            暂无测试结果
          </div>
        )}
      </div>
    </div>
  );
}
