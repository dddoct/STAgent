import { BookOpen, ShieldCheck, FlaskConical, Rocket, TerminalSquare } from 'lucide-react'

const sections = [
  {
    title: '项目概览 Overview',
    icon: BookOpen,
    content: 'STAgent 是一个配置驱动的软件测试智能体，支持通过 Web 界面完成项目管理、测试执行、结果分析与覆盖率查看。',
  },
  {
    title: '核心能力 Features',
    icon: FlaskConical,
    list: [
      '项目管理 Project management：创建、编辑、删除测试项目',
      '配置编辑 Config editor：YAML 配置 + 可视化表单',
      '测试执行 Test runner：实时进度、日志、结果推送',
      '报告查看 Report viewer：断言详情、失败原因、筛选',
      '覆盖率查看 Coverage：覆盖统计与明细',
    ],
  },
  {
    title: '认证与访问 Auth',
    icon: ShieldCheck,
    list: [
      '支持注册/登录（JWT）',
      '支持游客模式快速体验 Continue as guest',
      '登录状态本地持久化，401 自动回到登录页',
    ],
  },
  {
    title: '快速开始 Quick start',
    icon: Rocket,
    list: [
      '左侧管理项目，点击项目进入配置页',
      '顶部 Run Test 按钮启动测试任务',
      '查看实时日志、进度与结果',
      '点击左上角 STAgent 返回主页',
    ],
  },
]

export default function HelpPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="doc-card p-6 md:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 mb-4">
          <TerminalSquare className="w-3.5 h-3.5" />
          STAgent Documentation
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-950">软件测试智能体</h1>
        <p className="mt-3 text-slate-600 leading-7">
          面向测试流程的可视化工作台，提供从 Config 到 Run、从 Logs 到 Report 的一体化体验。
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <article key={section.title} className="doc-card p-6 hover:border-primary-200 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-slate-950">{section.title}</h2>
              </div>

              {section.content && <p className="text-slate-600 leading-7">{section.content}</p>}

              {section.list && (
                <ul className="space-y-2 text-slate-600">
                  {section.list.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-2 block h-1.5 w-1.5 rounded-full bg-primary-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          )
        })}
      </section>
    </div>
  )
}
