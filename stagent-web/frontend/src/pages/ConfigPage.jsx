import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, Play, Eye, Code, ChevronRight, Plus, Trash2, RefreshCw, FileText } from 'lucide-react'
import { useProjectStore } from '../stores/projectStore'
import YAML from 'yaml'

function Section({ title, subtitle, children, action }) {
  return (
    <section className="doc-panel space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <ChevronRight className="w-5 h-5 text-primary-600 mt-0.5" />
          <div>
            <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
            {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

const defaultForm = {
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
}

function mergeConfig(parsed) {
  return {
    ...defaultForm,
    ...parsed,
    target: { ...defaultForm.target, ...(parsed?.target || {}) },
    wrapper: { ...defaultForm.wrapper, ...(parsed?.wrapper || {}) },
    generation: { ...defaultForm.generation, ...(parsed?.generation || {}) },
    analysis: {
      ...defaultForm.analysis,
      ...(parsed?.analysis || {}),
      deduplication: { ...defaultForm.analysis.deduplication, ...(parsed?.analysis?.deduplication || {}) },
      coverage: { ...defaultForm.analysis.coverage, ...(parsed?.analysis?.coverage || {}) }
    },
    output: { ...defaultForm.output, ...(parsed?.output || {}) }
  }
}

export default function ConfigPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    currentProject, fetchProject, updateProject, loading,
    reportHistory, fetchReportHistory, inputPreview, previewInputs
  } = useProjectStore()

  const [config, setConfig] = useState('')
  const [viewMode, setViewMode] = useState('form')
  const [hasChanges, setHasChanges] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')
  const [yamlError, setYamlError] = useState('')
  const [form, setForm] = useState(defaultForm)

  const yamlPreview = useMemo(() => YAML.stringify(form), [form])

  useEffect(() => {
    if (id) {
      fetchProject(id).then(project => {
        if (!project) navigate('/')
      })
      fetchReportHistory(id)
    }
  }, [id, fetchProject, fetchReportHistory, navigate])

  useEffect(() => {
    if (currentProject?.config_yaml) {
      try {
        const parsed = YAML.parse(currentProject.config_yaml)
        setConfig(currentProject.config_yaml)
        setForm(mergeConfig(parsed))
        setYamlError('')
      } catch (e) {
        setConfig(currentProject.config_yaml)
        setYamlError(e.message)
      }
    }
  }, [currentProject])

  const handleSave = async () => {
    if (yamlError) return
    const yamlContent = viewMode === 'yaml' ? config : yamlPreview
    const result = await updateProject(id, { config_yaml: yamlContent })
    if (result) {
      setConfig(yamlContent)
      setHasChanges(false)
      setSaveStatus('Saved')
      fetchReportHistory(id)
      setTimeout(() => setSaveStatus(''), 2000)
    }
  }

  const handleFieldChange = (path, value) => {
    setForm(prev => {
      const newForm = JSON.parse(JSON.stringify(prev))
      const keys = path.split('.')
      let obj = newForm
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {}
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
      setForm(mergeConfig(parsed))
      setYamlError('')
    } catch (e) {
      setYamlError(e.message)
    }
    setHasChanges(true)
  }

  const updateWrapperField = (index, patch) => {
    setForm(prev => {
      const next = JSON.parse(JSON.stringify(prev))
      next.wrapper.input_schema = [...(next.wrapper.input_schema || [])]
      next.wrapper.input_schema[index] = { ...next.wrapper.input_schema[index], ...patch }
      return next
    })
    setHasChanges(true)
  }

  const addWrapperField = () => {
    setForm(prev => ({
      ...prev,
      wrapper: {
        ...prev.wrapper,
        enabled: true,
        input_schema: [...(prev.wrapper?.input_schema || []), { name: `field${(prev.wrapper?.input_schema || []).length + 1}`, type: 'int', range_min: 0, range_max: 100 }]
      }
    }))
    setHasChanges(true)
  }

  const removeWrapperField = (index) => {
    setForm(prev => ({
      ...prev,
      wrapper: { ...prev.wrapper, input_schema: (prev.wrapper?.input_schema || []).filter((_, i) => i !== index) }
    }))
    setHasChanges(true)
  }

  const updateAssertion = (index, patch) => {
    setForm(prev => {
      const next = JSON.parse(JSON.stringify(prev))
      next.analysis.default_assertions = [...(next.analysis.default_assertions || [])]
      next.analysis.default_assertions[index] = { ...next.analysis.default_assertions[index], ...patch }
      return next
    })
    setHasChanges(true)
  }

  const addAssertion = () => {
    setForm(prev => ({
      ...prev,
      analysis: {
        ...prev.analysis,
        default_assertions: [...(prev.analysis?.default_assertions || []), { type: 'exit_code', expected: 0 }]
      }
    }))
    setHasChanges(true)
  }

  const removeAssertion = (index) => {
    setForm(prev => ({
      ...prev,
      analysis: { ...prev.analysis, default_assertions: (prev.analysis?.default_assertions || []).filter((_, i) => i !== index) }
    }))
    setHasChanges(true)
  }

  const handlePreviewInputs = async () => {
    await previewInputs(id, Math.min(form.generation?.count || 5, 5))
  }

  return (
    <div className="space-y-6">
      <div className="doc-toolbar">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Config</div>
          <h1 className="text-2xl font-semibold text-slate-950 mt-1">测试配置 Test Configuration</h1>
          <div className="flex items-center gap-3 text-sm mt-1">
            {hasChanges && <span className="doc-badge-warning">Unsaved changes</span>}
            {saveStatus && <span className="doc-badge-success">{saveStatus}</span>}
            {yamlError && <span className="doc-badge-danger">Invalid YAML</span>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 bg-white p-1">
            <button onClick={() => setViewMode('form')} className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md ${viewMode === 'form' ? 'bg-slate-100 text-slate-950' : 'text-slate-500 hover:text-slate-900'}`}>
              <Code className="w-4 h-4" /> Form
            </button>
            <button onClick={() => setViewMode('yaml')} className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md ${viewMode === 'yaml' ? 'bg-slate-100 text-slate-950' : 'text-slate-500 hover:text-slate-900'}`}>
              <Eye className="w-4 h-4" /> YAML
            </button>
          </div>
          <button onClick={() => navigate(`/projects/${id}/run`)} className="doc-btn-secondary"><Play className="w-4 h-4" /> Run</button>
          <button onClick={handleSave} disabled={!hasChanges || loading || !!yamlError} className="doc-btn-primary disabled:opacity-50"><Save className="w-4 h-4" /> Save</button>
        </div>
      </div>

      {viewMode === 'form' ? (
        <div className="space-y-4">
          <Section title="被测程序 Target Program" subtitle="配置待测可执行程序的位置和运行超时。">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="doc-label">程序路径 Program path</label>
                <input type="text" value={form.target?.program || ''} onChange={(e) => handleFieldChange('target.program', e.target.value)} className="doc-input" placeholder="./examples/program.exe" />
              </div>
              <div>
                <label className="doc-label">超时时间 Timeout (s)</label>
                <input type="number" value={form.target?.timeout ?? ''} onChange={(e) => handleFieldChange('target.timeout', e.target.value === '' ? '' : parseInt(e.target.value, 10))} className="doc-input" />
              </div>
            </div>
          </Section>

          <Section title="输入格式 Input Wrapper" subtitle="可视化编辑参数字段，减少手写 YAML。" action={<button onClick={addWrapperField} className="doc-btn-secondary"><Plus className="w-4 h-4" /> Add Field</button>}>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.wrapper?.enabled || false} onChange={(e) => handleFieldChange('wrapper.enabled', e.target.checked)} className="w-4 h-4 text-primary-600 rounded border-slate-300" />
              启用结构化输入 Enable wrapper
            </label>
            <div>
              <label className="doc-label">输入模式 Mode</label>
              <select value={form.wrapper?.mode || 'args'} onChange={(e) => handleFieldChange('wrapper.mode', e.target.value)} className="doc-input max-w-xs">
                <option value="args">命令行参数 args</option>
                <option value="stdin">标准输入 stdin</option>
              </select>
            </div>
            <div className="space-y-3">
              {(form.wrapper?.input_schema || []).map((field, index) => (
                <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    <input className="doc-input" value={field.name || ''} onChange={(e) => updateWrapperField(index, { name: e.target.value })} placeholder="name" />
                    <select className="doc-input" value={field.type || 'int'} onChange={(e) => updateWrapperField(index, { type: e.target.value })}>
                      <option value="int">int</option><option value="float">float</option><option value="string">string</option><option value="list[int]">list[int]</option>
                    </select>
                    <input className="doc-input" type="number" value={field.range_min ?? ''} onChange={(e) => updateWrapperField(index, { range_min: e.target.value === '' ? undefined : Number(e.target.value) })} placeholder="min" />
                    <input className="doc-input" type="number" value={field.range_max ?? ''} onChange={(e) => updateWrapperField(index, { range_max: e.target.value === '' ? undefined : Number(e.target.value) })} placeholder="max" />
                    <input className="doc-input" type="number" value={field.count_fixed ?? ''} onChange={(e) => updateWrapperField(index, { count_fixed: e.target.value === '' ? undefined : Number(e.target.value) })} placeholder="count" />
                    <div className="flex gap-2">
                      <input className="doc-input" value={field.separator || ''} onChange={(e) => updateWrapperField(index, { separator: e.target.value })} placeholder="sep" />
                      <button onClick={() => removeWrapperField(index)} className="doc-btn-ghost text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
              {(form.wrapper?.input_schema || []).length === 0 && <p className="text-sm text-slate-500">暂无字段。点击 Add Field 添加输入参数。</p>}
            </div>
          </Section>

          <Section title="用例生成 Generation" subtitle="选择测试用例生成策略与数量。" action={<button onClick={handlePreviewInputs} className="doc-btn-secondary"><RefreshCw className="w-4 h-4" /> Preview Inputs</button>}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="doc-label">策略 Strategy</label><select value={form.generation?.strategy || 'wrapper'} onChange={(e) => handleFieldChange('generation.strategy', e.target.value)} className="doc-input"><option value="wrapper">结构化输入 wrapper</option><option value="random">随机生成 random</option><option value="boundary">边界值 boundary</option></select></div>
              <div><label className="doc-label">用例数量 Count</label><input type="number" value={form.generation?.count ?? ''} onChange={(e) => handleFieldChange('generation.count', e.target.value === '' ? '' : parseInt(e.target.value, 10))} className="doc-input" /></div>
            </div>
            {inputPreview && <pre className="text-xs bg-slate-950 text-slate-100 p-3 rounded-lg overflow-x-auto max-h-56">{JSON.stringify(inputPreview.items, null, 2)}</pre>}
          </Section>

          <Section title="断言 Assertions" subtitle="可视化编辑默认断言。" action={<button onClick={addAssertion} className="doc-btn-secondary"><Plus className="w-4 h-4" /> Add Assertion</button>}>
            <div className="space-y-3">
              {(form.analysis?.default_assertions || []).map((assertion, index) => (
                <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                  <select className="doc-input" value={assertion.type || 'exit_code'} onChange={(e) => updateAssertion(index, { type: e.target.value })}>
                    <option value="exit_code">exit_code</option><option value="no_error">no_error</option><option value="contains">contains</option><option value="regex">regex</option><option value="exact">exact</option>
                  </select>
                  {assertion.type === 'no_error' ? (
                    <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={!!assertion.allow_stderr} onChange={(e) => updateAssertion(index, { allow_stderr: e.target.checked })} /> allow_stderr</label>
                  ) : (
                    <input className="doc-input md:col-span-2" value={assertion.expected ?? assertion.substring ?? assertion.pattern ?? ''} onChange={(e) => updateAssertion(index, assertion.type === 'contains' ? { substring: e.target.value } : assertion.type === 'regex' ? { pattern: e.target.value } : { expected: assertion.type === 'exit_code' && /^\d+$/.test(e.target.value) ? Number(e.target.value) : e.target.value })} placeholder="expected / substring / pattern" />
                  )}
                  <button onClick={() => removeAssertion(index)} className="doc-btn-ghost text-red-600 justify-self-end"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </Section>

          <Section title="YAML Preview" subtitle="当前表单会保存为以下 YAML。">
            <pre className="text-xs bg-slate-950 text-slate-100 p-3 rounded-lg overflow-x-auto max-h-80">{yamlPreview}</pre>
          </Section>

          <Section title="Report History" subtitle="该项目的历史运行报告。">
            {reportHistory.length === 0 ? <p className="text-sm text-slate-500">暂无报告历史。运行测试后会显示在这里。</p> : (
              <div className="space-y-2">
                {reportHistory.map(report => (
                  <button key={report.task_id} onClick={() => navigate(`/reports/${report.task_id}`)} className="w-full rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50 flex items-center justify-between">
                    <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-primary-600" /> {new Date(report.created_at).toLocaleString()}</span>
                    <span className="text-sm text-slate-500">{report.passed}/{report.total} · {report.pass_rate}</span>
                  </button>
                ))}
              </div>
            )}
          </Section>
        </div>
      ) : (
        <div className="doc-panel space-y-3">
          {yamlError && <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 p-3 text-sm">{yamlError}</div>}
          <textarea value={config} onChange={(e) => handleYamlChange(e.target.value)} className="w-full h-[560px] font-mono text-sm p-4 border border-slate-200 rounded-xl bg-slate-950 text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500" spellCheck={false} />
        </div>
      )}
    </div>
  )
}
