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
    if (id) fetchProject(id)
  }, [id, fetchProject])

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
      setSaveStatus('Saved')
      setTimeout(() => setSaveStatus(''), 2000)
    }
  }

  const handleFieldChange = (path, value) => {
    setForm(prev => {
      const newForm = JSON.parse(JSON.stringify(prev))
      const keys = path.split('.')
      let obj = newForm
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]]
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
    } catch (e) {}
    setHasChanges(true)
  }

  const Section = ({ title, subtitle, children }) => (
    <section className="doc-panel space-y-4">
      <div className="flex items-start gap-2">
        <ChevronRight className="w-5 h-5 text-primary-600 mt-0.5" />
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  )

  return (
    <div className="space-y-6">
      <div className="doc-toolbar">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Config</div>
          <h1 className="text-2xl font-semibold text-slate-950 mt-1">测试配置 Test Configuration</h1>
          <div className="flex items-center gap-3 text-sm mt-1">
            {hasChanges && <span className="doc-badge-warning">Unsaved changes</span>}
            {saveStatus && <span className="doc-badge-success">{saveStatus}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 bg-white p-1">
            <button
              onClick={() => setViewMode('form')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'form' ? 'bg-slate-100 text-slate-950' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <Code className="w-4 h-4" /> Form
            </button>
            <button
              onClick={() => setViewMode('yaml')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'yaml' ? 'bg-slate-100 text-slate-950' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <Eye className="w-4 h-4" /> YAML
            </button>
          </div>

          <button onClick={() => navigate(`/projects/${id}/run`)} className="doc-btn-secondary">
            <Play className="w-4 h-4" /> Run
          </button>

          <button onClick={handleSave} disabled={!hasChanges || loading} className="doc-btn-primary disabled:opacity-50">
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
      </div>

      {viewMode === 'form' ? (
        <div className="space-y-4">
          <Section title="被测程序 Target Program" subtitle="配置待测可执行程序的位置和运行超时。">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="doc-label">程序路径 Program path</label>
                <input
                  type="text"
                  value={form.target?.program || ''}
                  onChange={(e) => handleFieldChange('target.program', e.target.value)}
                  className="doc-input"
                  placeholder="./examples/program.exe"
                />
              </div>
              <div>
                <label className="doc-label">超时时间 Timeout (s)</label>
                <input
                  type="number"
                  value={form.target?.timeout || 10}
                  onChange={(e) => handleFieldChange('target.timeout', parseInt(e.target.value))}
                  className="doc-input"
                />
              </div>
            </div>
          </Section>

          <Section title="输入格式 Input Wrapper" subtitle="定义结构化输入如何映射为命令行参数或标准输入。">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.wrapper?.enabled || false}
                onChange={(e) => handleFieldChange('wrapper.enabled', e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded border-slate-300"
              />
              启用结构化输入 Enable wrapper
            </label>

            {form.wrapper?.enabled && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
                <div>
                  <label className="doc-label">输入模式 Mode</label>
                  <select
                    value={form.wrapper?.mode || 'args'}
                    onChange={(e) => handleFieldChange('wrapper.mode', e.target.value)}
                    className="doc-input"
                  >
                    <option value="args">命令行参数 args</option>
                    <option value="stdin">标准输入 stdin</option>
                  </select>
                </div>
                <pre className="text-xs bg-slate-950 text-slate-100 p-3 rounded-lg overflow-x-auto">
                  {JSON.stringify(form.wrapper?.input_schema || [], null, 2)}
                </pre>
              </div>
            )}
          </Section>

          <Section title="用例生成 Generation" subtitle="选择测试用例生成策略与数量。">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="doc-label">策略 Strategy</label>
                <select
                  value={form.generation?.strategy || 'wrapper'}
                  onChange={(e) => handleFieldChange('generation.strategy', e.target.value)}
                  className="doc-input"
                >
                  <option value="wrapper">结构化输入 wrapper</option>
                  <option value="random">随机生成 random</option>
                  <option value="boundary">边界值 boundary</option>
                </select>
              </div>
              <div>
                <label className="doc-label">用例数量 Count</label>
                <input
                  type="number"
                  value={form.generation?.count || 10}
                  onChange={(e) => handleFieldChange('generation.count', parseInt(e.target.value))}
                  className="doc-input"
                />
              </div>
            </div>
          </Section>

          <Section title="结果分析 Analysis" subtitle="配置输出比对、去重与覆盖率策略。">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="doc-label">比对模式 Compare mode</label>
                <select
                  value={form.analysis?.compare_mode || 'exact'}
                  onChange={(e) => handleFieldChange('analysis.compare_mode', e.target.value)}
                  className="doc-input"
                >
                  <option value="exact">精确匹配 exact</option>
                  <option value="fuzzy">模糊匹配 fuzzy</option>
                  <option value="regex">正则匹配 regex</option>
                </select>
              </div>
              <div>
                <label className="doc-label">用例去重 Deduplication</label>
                <label className="flex items-center gap-2 text-sm text-slate-700 mt-2">
                  <input
                    type="checkbox"
                    checked={form.analysis?.deduplication?.enabled ?? true}
                    onChange={(e) => handleFieldChange('analysis.deduplication.enabled', e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded border-slate-300"
                  />
                  启用去重 Enable
                </label>
              </div>
            </div>
          </Section>
        </div>
      ) : (
        <div className="doc-panel">
          <textarea
            value={config}
            onChange={(e) => handleYamlChange(e.target.value)}
            className="w-full h-[560px] font-mono text-sm p-4 border border-slate-200 rounded-xl bg-slate-950 text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            spellCheck={false}
          />
        </div>
      )}
    </div>
  )
}
