export default function HelpPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">STAgent 项目说明</h1>
        <p className="text-gray-600">软件测试智能体 Web 界面使用说明</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">核心能力</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li>项目管理：创建、编辑、删除测试项目</li>
          <li>配置编辑：YAML 配置 + 可视化表单</li>
          <li>测试执行：实时进度、日志、结果推送</li>
          <li>报告查看：断言详情、失败原因、筛选</li>
          <li>覆盖率查看：覆盖统计与明细</li>
        </ul>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">认证与访问</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li>支持注册/登录（JWT）</li>
          <li>支持游客模式快速体验</li>
          <li>登录状态本地持久化，401 自动回到登录页</li>
        </ul>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-2 text-gray-700">
        <h2 className="text-lg font-semibold text-gray-800">使用提示</h2>
        <p>左侧可管理项目，进入项目后可在“配置”与“运行测试”之间切换。</p>
        <p>如需返回主页，点击左上角 STAgent 标题即可。</p>
      </div>
    </div>
  )
}
