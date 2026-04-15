import { Plus, Trash2 } from 'lucide-react';

const assertionTypes = [
  { value: 'exact', label: '精确匹配', fields: [{ name: 'expected', label: '期望输出', type: 'textarea' }] },
  { value: 'fuzzy', label: '模糊匹配', fields: [{ name: 'expected', label: '期望输出', type: 'textarea' }] },
  { value: 'regex', label: '正则匹配', fields: [{ name: 'pattern', label: '正则表达式', type: 'text' }] },
  { value: 'contains', label: '包含子串', fields: [{ name: 'substring', label: '子串', type: 'text' }] },
  { value: 'numeric_range', label: '数值范围', fields: [{ name: 'min', label: '最小值', type: 'number' }, { name: 'max', label: '最大值', type: 'number' }] },
  { value: 'exit_code', label: '退出码', fields: [{ name: 'expected', label: '期望退出码', type: 'number' }] },
  { value: 'no_error', label: '无错误', fields: [] },
];

export default function AssertionBuilder({ assertions, onChange }) {
  const updateAssertion = (index, updates) => {
    const newAssertions = [...assertions];
    newAssertions[index] = { ...newAssertions[index], ...updates };
    onChange(newAssertions);
  };

  const addAssertion = () => {
    onChange([...assertions, { type: 'no_error' }]);
  };

  const removeAssertion = (index) => {
    onChange(assertions.filter((_, i) => i !== index));
  };

  const getTypeInfo = (type) => assertionTypes.find(t => t.value === type) || assertionTypes[assertionTypes.length - 1];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">断言规则</h3>
        <button
          onClick={addAssertion}
          className="flex items-center gap-1 px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
        >
          <Plus size={14} /> 添加断言
        </button>
      </div>

      {assertions.length === 0 && (
        <div className="p-6 text-center text-gray-500 border-2 border-dashed rounded-lg">
          <p>暂无断言规则</p>
          <p className="text-sm mt-1">添加断言来验证程序输出</p>
        </div>
      )}

      <div className="space-y-3">
        {assertions.map((assertion, index) => {
          const typeInfo = getTypeInfo(assertion.type);

          return (
            <div key={index} className="p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">断言 #{index + 1}</span>
                <button
                  onClick={() => removeAssertion(index)}
                  className="p-1.5 text-red-500 hover:bg-red-100 rounded"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">类型</label>
                  <select
                    value={assertion.type}
                    onChange={(e) => updateAssertion(index, { type: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                  >
                    {assertionTypes.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                {typeInfo.fields.map((field) => (
                  <div key={field.name}>
                    <label className="block text-xs text-gray-500 mb-1">{field.label}</label>
                    {field.type === 'textarea' ? (
                      <textarea
                        value={assertion[field.name] || ''}
                        onChange={(e) => updateAssertion(index, { [field.name]: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                        placeholder={`输入${field.label}...`}
                      />
                    ) : field.type === 'number' ? (
                      <input
                        type="number"
                        value={assertion[field.name] ?? ''}
                        onChange={(e) => updateAssertion(index, { [field.name]: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <input
                        type="text"
                        value={assertion[field.name] || ''}
                        onChange={(e) => updateAssertion(index, { [field.name]: e.target.value })}
                        className="w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                        placeholder={`输入${field.label}...`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-gray-100 rounded-lg">
        <h4 className="text-sm font-medium text-gray-600 mb-2">断言类型说明</h4>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div><strong>exact</strong>: 输出必须完全一致</div>
          <div><strong>fuzzy</strong>: 忽略空白差异</div>
          <div><strong>regex</strong>: 正则表达式匹配</div>
          <div><strong>contains</strong>: 输出包含指定字符串</div>
          <div><strong>numeric_range</strong>: 输出数字在范围内</div>
          <div><strong>exit_code</strong>: 程序退出码匹配</div>
          <div><strong>no_error</strong>: 无错误信息</div>
        </div>
      </div>
    </div>
  );
}
