import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, Play, Eye, Code, ChevronRight } from 'lucide-react'
import { useProjectStore } from '../stores/projectStore'
import YAML from 'yaml'

export default function ConfigPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentProject, fetchProject, updateProject, loading } = useProjectStore()

  const [config, setConfig] = useState('')
  const [viewMode, setViewMode] = useState('form')
  const [hasChanges, setHasChanges] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')

  const [form, setForm] = useState({
    target: { program: '', args: [], timeout: 10 },
    wrapper: { enabled: false, mode: 'args', input_schema: [] },
    generation: { strategy: 'wrapper', count: 10 },
    analysis: {
      compare_mode: 'exact',
      default_assertions: [{ type: 'exit_code', expected: 0 }],
      deduplication: { enabled: true },
      coverage: { enabled: false }
    },
    output: { report_path: './results/report.json', log_level: 'INFO' }
  })

  useEffect(() => {
    if (id) {
      fetchProject(id)
    }
  }, [id])

  useEffect(() => {
    if (currentProject && currentProject.config_yaml) {
      try {
        const parsed = YAML.parse(currentProject.config_yaml)
        setConfig(currentProject.config_yaml)
        setForm(prev => ({ ...prev, ...parsed }))
      } catch (e) {
        setConfig(currentProject.config_yaml)
      }
    }
  }, [currentProject])

  const handleSave = async () => {
    const yamlContent = YAML.stringify(form)
    const result = await updateProject(id, { config_yaml: yamlContent })
    if (result) {
      setConfig(yamlContent)
      setHasChanges(false)
      setSaveStatus('已保存')
      setTimeout(() => setSaveStatus(''), 2000)
    }
  }

  const handleFieldChange = (path, value) => {
    setForm(prev => {
      const newForm = JSON.parse(JSON.stringify(prev))
      const keys = path.split('.')
      let obj = newForm
      for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]]
      }
      obj[keys[keys.length - 1]] = value
      return newForm
    })
    setHasChanges(true)
  }

  const handleYamlChange = (value) => {
    setConfig(value)
    try {
      const parsed = YAML.parse(value)
      setForm(parsed)
    } catch (e) {
      // 解析错误
    }
    setHasChanges(true)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">配置</h1>
          {hasChanges && (
            <span className="text-sm text-orange-500">（有未保存的更改）</span>
          )}
          {saveStatus && (
            <span className="text-sm text-green-500">{saveStatus}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex border rounded overflow-hidden">
            <button
              onClick={() => setViewMode('form')}
              className={`px-3 py-1.5 text-sm ${viewMode === 'form' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              <Code className="w-4 h-4 inline mr-1" />
              表单
            </button>
            <button
              onClick={() => setViewMode('yaml')}
              className={`px-3 py-1.5 text-sm ${viewMode === 'yaml' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              <Eye className="w-4 h-4 inline mr-1" />
              YAML
            </button>
          </div>

          <button
            onClick={() => navigate(`/projects/${id}/run`)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
          >
            <Play className="w-4 h-4" />
            运行测试
          </button>

          <button
            onClick={handleSave}
            disabled={!hasChanges || loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            保存
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        {viewMode === 'form' ? (
          <div className="p-6 space-y-8">
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ChevronRight className="w-5 h-5 text-primary-500" />
                被测程序
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">程序路径</label>
                  <input
                    type="text"
                    value={form.target?.program || ''}
                    onChange={(e) => handleFieldChange('target.program', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                    placeholder="./examples/program.exe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">超时时间（秒）</label>
                  <input
                    type="number"
                    value={form.target?.timeout || 10}
                    onChange={(e) => handleFieldChange('target.timeout', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ChevronRight className="w-5 h-5 text-primary-500" />
                输入格式定义
              </h2>
              <div className="flex items-center gap-4 mb-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.wrapper?.enabled || false}
                    onChange={(e) => handleFieldChange('wrapper.enabled', e.target.checked)}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span>启用结构化输入</span>
                </label>
              </div>

              {form.wrapper?.enabled && (
                <div className="bg-gray-50 rounded p-4">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">输入模式</label>
                    <select
                      value={form.wrapper?.mode || 'args'}
                      onChange={(e) => handleFieldChange('wrapper.mode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="args">命令行参数</option>
                      <option value="stdin">标准输入 (stdin)</option>
                    </select>
                  </div>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify(form.wrapper?.input_schema || [], null, 2)}
                  </pre>
                </div>
              )}
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ChevronRight className="w-5 h-5 text-primary-500" />
                用例生成
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">策略</label>
                  <select
                    value={form.generation?.strategy || 'wrapper'}
                    onChange={(e) => handleFieldChange('generation.strategy', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="wrapper">结构化输入</option>
                    <option value="random">随机生成</option>
                    <option value="boundary">边界值</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">用例数量</label>
                  <input
                    type="number"
                    value={form.generation?.count || 10}
                    onChange={(e) => handleFieldChange('generation.count', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ChevronRight className="w-5 h-5 text-primary-500" />
                结果分析
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">比对模式</label>
                  <select
                    value={form.analysis?.compare_mode || 'exact'}
                    onChange={(e) => handleFieldChange('analysis.compare_mode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="exact">精确匹配</option>
                    <option value="fuzzy">模糊匹配</option>
                    <option value="regex">正则匹配</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">用例去重</label>
                  <label className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={form.analysis?.deduplication?.enabled ?? true}
                      onChange={(e) => handleFieldChange('analysis.deduplication.enabled', e.target.checked)}
                      className="w-4 h-4 text-primary-600"
                    />
                    <span>启用去重</span>
                  </label>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="p-6">
            <textarea
              value={config}
              onChange={(e) => handleYamlChange(e.target.value)}
              className="w-full h-[500px] font-mono text-sm p-4 border border-gray-200 rounded bg-gray-50 focus:ring-2 focus:ring-primary-500"
              spellCheck={false}
            />
          </div>
        )}
      </div>
    </div>
  )
}
