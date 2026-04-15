# STAgent 前端实现步骤

## 阶段一：后端 API（8步）

### 1.1 创建 FastAPI 项目
```
stagent-web/
├── backend/
│   ├── __init__.py
│   ├── main.py           # FastAPI 入口
│   ├── auth.py           # JWT 认证
│   ├── users.py          # 用户管理
│   ├── routes/
│   │   └── auth_routes.py # 认证路由
│   └── requirements.txt
└── frontend/            # React 项目
```

**任务**：
- 安装依赖：`fastapi`, `uvicorn`, `python-multipart`, `python-jose[cryptography]`, `passlib[bcrypt]`
- 创建 main.py 基础框架
- 配置 CORS 允许前端访问

### 1.2 实现配置管理 API
```python
# 接口
GET  /api/projects           # 列表
POST /api/projects           # 创建
GET  /api/projects/{id}      # 获取
PUT  /api/projects/{id}      # 更新
DELETE /api/projects/{id}    # 删除
```

**任务**：
- 创建 Project 模型（id, name, config_yaml, created_at）
- 实现 CRUD 接口
- 添加配置验证

### 1.3 实现测试运行 API
```python
# 接口
POST /api/run                # 启动测试
GET  /api/run/{task_id}     # 状态
POST /api/run/{task_id}/stop # 停止
```

**任务**：
- 异步任务管理（asyncio / threading）
- 调用 STAgent 核心引擎
- 任务状态追踪

### 1.4 实现 WebSocket 实时推送
```python
# 接口
WS /api/ws/{task_id}        # 实时日志
```

**任务**：
- 建立 WebSocket 连接
- 推送：日志、进度、结果
- 心跳保活

### 1.5 实现报告查询 API
```python
# 接口
GET /api/reports/{report_id}  # 报告详情
GET /api/reports/latest       # 最新报告
```

**任务**：
- 报告数据模型
- 报告持久化（JSON 文件）
- 分页查询

### 1.6 实现覆盖率 API
```python
# 接口
GET /api/coverage/{report_id}  # 覆盖率详情
```

**任务**：
- 解析 gcov 输出
- 生成覆盖率数据结构
- 源码映射

### 1.7 添加文件上传
```python
# 接口
POST /api/upload/source       # 上传源码
POST /api/upload/binary       # 上传可执行文件
```

**任务**：
- 接收文件保存
- 验证文件类型
- 路径管理

---

### 1.8 添加认证路由
```python
# auth_routes.py
POST /api/auth/register    # 注册
POST /api/auth/login       # 登录
GET  /api/auth/me         # 当前用户
POST /api/auth/logout      # 登出
```

**任务**：
- 实现用户注册（密码哈希存入 JSON）
- 实现用户登录（验证密码，签发 JWT）
- JWT Bearer Token 验证中间件
- 登出接口（前端清除 token 即可）

---

## 阶段二：前端基础（6步）

### 2.1 初始化 React 项目
```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
```

**任务**：
- 安装依赖：axios, react-router-dom, zustand, lucide-react
- 配置 TailwindCSS
- 创建基础目录结构

### 2.2 创建布局组件
```
src/components/Layout/
├── AppLayout.jsx     # 主布局
├── Sidebar.jsx       # 侧边栏
└── Header.jsx        # 顶部栏
```

**任务**：
- 侧边栏：项目列表
- 顶部栏：导航 + 操作按钮
- 内容区：路由视图

### 2.3 配置路由
```jsx
/login              # 登录/注册页（公开）
/                  # 首页/项目列表（需认证或游客）
/projects/:id       # 项目详情（需认证或游客）
/projects/:id/run   # 运行测试（需认证或游客）
/reports/:id        # 查看报告
/coverage/:id       # 覆盖率
```

**任务**：
- 安装 react-router-dom
- 配置路由表
- 路由守卫 ProtectedRoute（未登录跳转 /login）
- 游客模式绕过守卫

### 2.4 创建状态管理
```javascript
// src/stores/
authStore.js        # 认证状态（登录/注册/游客模式）
projectStore.js     # 项目状态
runStore.js         # 运行状态
```

**任务**：
- 定义状态结构（user, token, isAuthenticated, isGuest）
- 定义 actions（login, register, logout, enterGuest）
- 使用 zustand/persist 持久化到 localStorage

### 2.5 创建 API 客户端
```javascript
// src/api/
client.js            # REST API + axios 拦截器
websocket.js         # WebSocket
```

**任务**：
- 封装 axios，baseURL = '/api'
- 请求拦截器附加 Authorization: Bearer token
- 401 响应拦截器自动登出并跳转 /login
- WebSocket 连接管理

### 2.6 创建登录页面
```javascript
// src/pages/LoginPage.jsx
- 登录/注册 Tab 切换
- 登录表单（用户名 + 密码）
- 注册表单（用户名 + 邮箱 + 密码）
- 游客模式入口
- 错误提示
```

**任务**：
- 使用 authStore.login/register
- 正确处理 axios 错误（err.response?.data?.detail）
- 登录成功后 navigate('/')
- 游客模式调用 enterGuest() 直接进入

---

## 阶段三：配置页面（4步）

### 3.1 项目列表页
```
/ (首页)
├── 项目卡片列表
├── 新建项目按钮
└── 删除/编辑操作
```

**任务**：
- 获取项目列表
- 渲染项目卡片
- 新建项目弹窗

### 3.2 配置编辑器页
```
/projects/:id/config
├── target 配置
├── wrapper 配置
├── suite 配置
├── assertions 配置
└── 保存/运行按钮
```

**任务**：
- 表单组件
- 字段动态渲染
- YAML 预览/编辑

### 3.3 Wrapper 可视化构建器
```
WrapperBuilder/
├── FieldList        # 字段列表
├── FieldEditor      # 单字段编辑
└── Preview          # 预览生成结果
```

**任务**：
- 添加/删除字段
- 字段类型选择
- 依赖关系配置
- 实时预览

### 3.4 断言构建器
```
AssertionBuilder/
├── AssertionList    # 断言列表
├── TypeSelector     # 类型选择
└── ConfigForm       # 配置表单
```

**任务**：
- 支持7种断言类型
- 表单验证
- 断言预览

---

## 阶段四：运行页面（4步）

### 4.1 测试运行器组件
```
TestRunner/
├── ProgressBar      # 进度条
├── Controls        # 控制按钮
└── Stats           # 实时统计
```

**任务**：
- 调用 /api/run
- 显示进度
- 暂停/停止功能

### 4.2 实时日志组件
```
LogViewer/
├── LogList         # 日志列表
├── LogItem         # 单条日志
└── FilterBar       # 过滤栏
```

**任务**：
- WebSocket 接收
- 日志级别颜色
- 自动滚动
- 暂停/继续

### 4.3 执行结果列表
```
ResultsList/
├── ResultItem       # 单条结果
├── FilterBar       # 筛选
└── SortControl     # 排序
```

**任务**：
- 实时接收结果
- 通过/失败/错误筛选
- 展开详情

### 4.4 结果详情弹窗
```
ResultDetail/
├── BasicInfo        # 基本信息
├── AssertionResults # 断言结果
├── OutputView      # 输出对比
└── CopyButton      # 复制
```

**任务**：
- 显示 stdout/stderr
- 断言通过/失败详情
- 输入输出对比

---

## 阶段五：报告页面（3步）

### 5.1 报告概览
```
ReportOverview/
├── SummaryCard      # 摘要卡片
├── PassRateChart    # 通过率图表
└── Timeline         # 时间线
```

**任务**：
- 汇总数据展示
- 通过率饼图
- 测试时间线

### 5.2 报告表格
```
ReportTable/
├── TableHeader      # 表头
├── TableRow         # 数据行
└── Pagination       # 分页
```

**任务**：
- 列表展示
- 排序/筛选
- 分页
- 行展开

### 5.3 报告导出
```javascript
// 导出格式
- JSON (原始数据)
- HTML (可分享)
- CSV (数据分析)
```

**任务**：
- 导出按钮
- 格式选择
- 文件下载

---

## 阶段六：覆盖率页面（3步）

### 6.1 覆盖率仪表盘
```
CoverageDashboard/
├── LineCoverage     # 行覆盖
├── BranchCoverage   # 分支覆盖
└── FunctionCoverage # 函数覆盖
```

**任务**：
- 仪表盘组件
- 进度环
- 数字统计

### 6.2 未覆盖代码
```
UncoveredList/
├── LineList         # 行号列表
└── LineDetail       # 详情
```

**任务**：
- 未覆盖行高亮
- 点击跳转源码
- 建议补充用例

### 6.3 源码视图
```
SourceViewer/
├── LineNumbers      # 行号
├── SourceCode       # 源码
└── CoverageOverlay  # 覆盖层
```

**任务**：
- 语法高亮
- 覆盖/未覆盖着色
- 行号点击

---

## 阶段七：完善与优化（3步）

### 7.1 错误处理
- 全局错误边界
- 网络错误提示
- 重试机制

### 7.2 加载状态
- Skeleton 骨架屏
- Loading spinner
- 进度提示

### 7.3 响应式适配
- 移动端兼容
- 黑暗模式（可选）

---

## 实施顺序

```
Week 1: 后端基础 + API
         ├── 1.1-1.3 基础框架
         └── 2.1-2.5 前端基础

Week 2: 配置页面
         └── 3.1-3.4 配置功能

Week 3: 运行 + 报告
         ├── 4.1-4.4 运行功能
         └── 5.1-5.3 报告功能

Week 4: 覆盖率 + 完善
         ├── 6.1-6.3 覆盖率
         └── 7.1-7.3 优化
```

---

## 快速启动命令

```bash
# 后端（启动目录：stagent-web/backend）
cd stagent-web/backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000

# 前端（启动目录：stagent-web/frontend）
cd stagent-web/frontend
npm install
npm run dev        # 访问 http://localhost:3000
```

---

## 依赖清单

### 后端 (Python)
```
fastapi>=0.100.0
uvicorn[standard]>=0.23.0
python-multipart>=0.0.6
pyyaml>=6.0
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
```

### 前端 (Node.js)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.14.0",
    "axios": "^1.4.0",
    "zustand": "^4.4.0",
    "recharts": "^2.7.0",
    "@headlessui/react": "^1.7.0",
    "lucide-react": "^0.263.0"
  }
}
```
