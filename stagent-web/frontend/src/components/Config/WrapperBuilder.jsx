import { Plus, Trash2, GripVertical } from 'lucide-react';

export default function WrapperBuilder({ schema, onChange }) {
  const fieldTypes = [
    { value: 'int', label: '整数 (int)' },
    { value: 'float', label: '浮点数 (float)' },
    { value: 'string', label: '字符串 (string)' },
    { value: 'list[int]', label: '整数列表 (list[int])' },
    { value: 'list[float]', label: '浮点列表 (list[float])' },
    { value: 'choice', label: '选项 (choice)' },
  ];

  const updateField = (index, updates) => {
    const newSchema = [...schema];
    newSchema[index] = { ...newSchema[index], ...updates };
    onChange(newSchema);
  };

  const addField = () => {
    onChange([...schema, {
      name: `field_${schema.length + 1}`,
      type: 'int',
      range_min: 0,
      range_max: 100,
    }]);
  };

  const removeField = (index) => {
    onChange(schema.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">输入字段定义</h3>
        <button
          onClick={addField}
          className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Plus size={14} /> 添加字段
        </button>
      </div>

      {schema.length === 0 && (
        <div className="p-8 text-center text-gray-500 border-2 border-dashed rounded-lg">
          <p>暂无字段定义</p>
          <p className="text-sm mt-1">点击上方按钮添加第一个字段</p>
        </div>
      )}

      <div className="space-y-3">
        {schema.map((field, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border"
          >
            <GripVertical className="text-gray-400 mt-2 cursor-grab" size={16} />

            <div className="flex-1 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">字段名</label>
                <input
                  type="text"
                  value={field.name}
                  onChange={(e) => updateField(index, { name: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">类型</label>
                <select
                  value={field.type}
                  onChange={(e) => updateField(index, { type: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                >
                  {fieldTypes.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {(field.type === 'int' || field.type === 'float' || field.type === 'list[int]' || field.type === 'list[float]') && (
                <>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">最小值</label>
                    <input
                      type="number"
                      value={field.range_min ?? ''}
                      onChange={(e) => updateField(index, { range_min: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">最大值</label>
                    <input
                      type="number"
                      value={field.range_max ?? ''}
                      onChange={(e) => updateField(index, { range_max: parseInt(e.target.value) || 100 })}
                      className="w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {field.type === 'list[int]' || field.type === 'list[float]' || field.type === 'list[string]' ? (
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">数量来源</label>
                  <select
                    value={field.count_from ? 'ref' : field.count_fixed ? 'fixed' : 'random'}
                    onChange={(e) => {
                      if (e.target.value === 'ref') {
                        updateField(index, { count_from: 'count', count_fixed: null });
                      } else if (e.target.value === 'fixed') {
                        updateField(index, { count_fixed: 5, count_from: null });
                      } else {
                        updateField(index, { count_from: null, count_fixed: null });
                      }
                    }}
                    className="w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="random">随机数量</option>
                    <option value="fixed">固定数量</option>
                    <option value="ref">引用其他字段</option>
                  </select>
                  {field.count_from && (
                    <input
                      type="text"
                      placeholder="引用字段名，如: count"
                      value={field.count_from}
                      onChange={(e) => updateField(index, { count_from: e.target.value })}
                      className="mt-1 w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                  {field.count_fixed !== null && (
                    <input
                      type="number"
                      placeholder="固定数量"
                      value={field.count_fixed}
                      onChange={(e) => updateField(index, { count_fixed: parseInt(e.target.value) || 5 })}
                      className="mt-1 w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              ) : null}

              {field.type === 'choice' && (
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">选项 (逗号分隔)</label>
                  <input
                    type="text"
                    placeholder="如: +, -, *, /"
                    value={field.choices?.join(', ') || ''}
                    onChange={(e) => updateField(index, {
                      choices: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                    className="w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">分隔符</label>
                <select
                  value={field.separator === '\n' ? 'newline' : field.separator === ',' ? 'comma' : 'space'}
                  onChange={(e) => {
                    const sep = e.target.value === 'newline' ? '\n' : e.target.value === 'comma' ? ',' : ' ';
                    updateField(index, { separator: sep });
                  }}
                  className="w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="space">空格</option>
                  <option value="comma">逗号</option>
                  <option value="newline">换行</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => removeField(index)}
              className="p-2 text-red-500 hover:bg-red-50 rounded"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {schema.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">预览</h4>
          <pre className="text-xs text-blue-700 overflow-auto">
            {`wrapper:
  enabled: true
  input_schema:
${schema.map(f => `    - name: ${f.name || '(未命名)'}
      type: "${f.type}"${f.range_min !== undefined ? `
      range_min: ${f.range_min}
      range_max: ${f.range_max}` : ''}${f.count_from ? `
      count_from: "${f.count_from}"` : ''}${f.count_fixed !== null && f.count_fixed !== undefined ? `
      count_fixed: ${f.count_fixed}` : ''}${f.separator !== ' ' ? `
      separator: "${f.separator === '\n' ? '\\n' : f.separator}"` : ''}`).join('\n')}
`}
          </pre>
        </div>
      )}
    </div>
  );
}
