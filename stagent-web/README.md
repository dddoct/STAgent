# STAgent Web

软件测试智能体 Web 界面

## 快速启动

### 方式一：一键启动（推荐）

```bash
cd stagent-web
start.bat
```

### 方式二：手动启动

**1. 启动后端**

```bash
cd stagent-web/backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

**2. 启动前端**

```bash
cd stagent-web/frontend
npm install
npm run dev
```

**3. 访问**

打开浏览器访问: http://localhost:5173

## 功能说明

| 模块 | 说明 |
|------|------|
| 项目管理 | 创建、编辑、删除测试项目 |
| 配置管理 | YAML 配置编辑器 + 可视化表单 |
| 测试运行 | 实时进度、日志、暂停/停止 |
| 报告查看 | 结果表格、断言详情、筛选 |
| 覆盖率 | 仪表盘、未覆盖行号 |

## 项目结构

```
stagent-web/
├── backend/
│   ├── main.py              # FastAPI 后端主入口
│   ├── requirements.txt     # Python 依赖
│   └── data/               # 数据存储
│       ├── projects/       # 项目数据
│       ├── reports/        # 测试报告
│       └── uploads/        # 上传文件
│
├── frontend/
│   ├── src/
│   │   ├── api/           # API 客户端
│   │   ├── components/    # UI 组件
│   │   │   ├── Config/    # 配置相关组件
│   │   │   ├── Coverage/  # 覆盖率组件
│   │   │   ├── Project/   # 项目管理组件
│   │   │   └── Runner/    # 测试运行组件
│   │   ├── pages/         # 页面
│   │   └── stores/        # Zustand 状态管理
│   ├── package.json
│   └── vite.config.js
│
├── start.bat               # Windows 一键启动脚本
└── README.md
```

## API 接口

### 项目管理

| 接口 | 方法 | 说明 |
|------|------|------|
| GET | /api/projects | 获取项目列表 |
| POST | /api/projects | 创建项目 |
| GET | /api/projects/{id} | 获取单个项目 |
| PUT | /api/projects/{id} | 更新项目 |
| DELETE | /api/projects/{id} | 删除项目 |

### 测试运行

| 接口 | 方法 | 说明 |
|------|------|------|
| POST | /api/run | 启动测试 |
| GET | /api/run/{task_id} | 获取任务状态 |
| POST | /api/run/{task_id}/stop | 停止任务 |
| GET | /api/run/{task_id}/results | 获取任务结果 |

### 实时通信

| 接口 | 协议 | 说明 |
|------|------|------|
| /api/ws/{task_id} | WebSocket | 实时推送测试进度、日志、结果 |

### 报告

| 接口 | 方法 | 说明 |
|------|------|------|
| GET | /api/reports/{id} | 获取报告 |
| GET | /api/reports/task/{task_id} | 根据任务ID获取报告 |
| GET | /api/coverage/{id} | 获取覆盖率报告 |

### 文件上传

| 接口 | 方法 | 说明 |
|------|------|------|
| POST | /api/upload/source | 上传源码文件 |
| POST | /api/upload/binary | 上传可执行文件 |

## WebSocket 消息格式

```javascript
// 状态更新
{ "type": "status", "data": { ... } }

// 进度更新
{ "type": "progress", "data": { progress: 5, total: 10, passed: 3, failed: 1 } }

// 日志消息
{ "type": "log", "level": "info", "message": "开始测试..." }

// 单个结果
{ "type": "result", "data": { test_case_id: "TC_0001", passed: true, ... } }

// 测试完成
{ "type": "completed", "data": { ... } }

// 错误消息
{ "type": "error", "message": "执行异常" }
```

## 技术栈

- **后端**: FastAPI + Uvicorn + WebSocket
- **前端**: React 18 + Vite + TailwindCSS + Zustand

## 配置示例

Web 界面创建项目时，默认配置模板：

```yaml
target:
  program: "examples/math/add.exe"
  timeout: 5

wrapper:
  enabled: true
  mode: "args"
  schema:
    - name: "num1"
      type: "float"
      range: [0.0, 100.0]
    - name: "num2"
      type: "float"
      range: [0.0, 100.0]

assertions:
  - type: "exit_code"
    expected: 0
  - type: "regex"
    pattern: "^\\d+\\.\\d{2}\\n$"
```

## 环境要求

- Python 3.10+
- Node.js 18+
- npm 或 yarn
