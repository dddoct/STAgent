# STAgent - 软件测试智能体架构设计

## 一、系统概述

STAgent 是一个配置驱动的自动化软件测试工具，通过 YAML 配置定义测试用例生成策略、输入格式和断言规则，无需编写代码即可完成黑盒/白盒测试。项目同时提供命令行核心引擎和 Web 可视化界面。

## 二、核心架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        Config.yaml                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │  target  │  │ wrapper  │  │  suite   │  │     analysis     │ │
│  │  (被测)   │  │  (输入)   │  │  (用例)   │  │  断言/去重/覆盖  │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      STAgent 核心引擎                            │
│  ┌────────────┐  ┌────────────┐  ┌───────────┐  ┌───────────┐  │
│  │ Generator  │──│ Deduplicator│─│ Executor  │──│ Analyzer  │  │
│  │ (用例生成)  │  │  (用例去重) │  │  (执行)   │  │  (断言)   │  │
│  └────────────┘  └────────────┘  └───────────┘  └─────┬─────┘  │
│                                                        │        │
│                                          ┌─────────────┘        │
│                                          ▼                      │
│                              ┌──────────────────────┐          │
│                              │    CoverageCollector  │          │
│                              │      (覆盖率统计)      │          │
│                              └──────────┬───────────┘          │
│                                         ▼                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TestReport + CoverageReport                  │
│                    (JSON 格式测试报告 + 覆盖率报告)                │
└─────────────────────────────────────────────────────────────────┘
```

## 三、模块说明

### 3.1 配置模块 (config.py)

| 配置项 | 说明 |
|--------|------|
| `target` | 被测程序路径、超时设置 |
| `wrapper` | 结构化输入格式定义 |
| `suite` | 预设测试用例与断言绑定 |
| `generation` | 用例生成策略 |
| `analysis` | 断言规则、报告格式、去重和覆盖率 |

### 3.2 Wrapper 模块 (wrapper.py)

Wrapper 将结构化字段转换为被测程序需要的输入格式，支持命令行参数模式和标准输入模式。

```yaml
wrapper:
  enabled: true
  mode: "args"          # args=命令行参数，stdin=标准输入
  input_schema:
    - name: count
      type: "int"
      range_min: 1
      range_max: 10
    - name: numbers
      type: "list[int]"
      count_from: "count"
```

| 类型 | 说明 | 示例 |
|------|------|------|
| `int` | 整数 | `42` |
| `float` | 浮点数 | `3.14` |
| `string` | 字符串 | `hello` |
| `list[int]` | 整数列表 | `1 2 3 4 5` |
| `list[float]` | 浮点列表 | `1.1 2.2 3.3` |
| `list[string]` | 字符串列表 | `a b c` |
| `choice` | 从选项中选择 | `+ - * /` |

### 3.3 断言系统 (assertions.py)

| 断言类型 | 说明 | 配置示例 |
|----------|------|----------|
| `exact` | 精确匹配 | `expected: "hello world"` |
| `fuzzy` | 模糊匹配（忽略空白） | `expected: "hello world"` |
| `regex` | 正则表达式匹配 | `pattern: "\\d+"` |
| `contains` | 包含子串 | `substring: "error"` |
| `numeric_range` | 数值范围 | `min: 0, max: 100` |
| `exit_code` | 退出码验证 | `expected: 0` 或 `expected: [0, 1]` |
| `no_error` | 无错误信息 | `{}` |

### 3.4 测试套件 (suite + suite_loader.py)

每个预设用例可以单独定义断言规则：

```yaml
suite:
  cases:
    - input: "5 3 8 1 9"
      assertions:
        - type: "regex"
          pattern: "1\\n3\\n5\\n8\\n9"
        - type: "no_error"
```

### 3.5 用例去重 (dedup.py)

| 配置项 | 说明 |
|--------|------|
| `enabled` | 是否启用去重 |
| `strategy` | 去重策略：`hash`、`equivalence`、`both` |
| `normalize_numbers` | 数字规范化 |
| `ignore_order` | 忽略输入顺序（适合排序类程序） |

### 3.6 覆盖率统计 (coverage.py)

覆盖率统计需要 gcc 编译器环境，支持行覆盖率、分支覆盖率、函数覆盖率和未覆盖行号。

```yaml
analysis:
  coverage:
    enabled: true
    source_file: "./examples/sort.c"
    compile_with_coverage: true
```

## 四、工作流程

```
加载配置 → 生成/加载测试用例 → 去重 → 执行程序 → 分析断言 → 生成报告/覆盖率
```

## 五、项目结构

```
STAgent/
├── stagent/                  # 核心引擎
├── stagent-web/
│   ├── backend/              # FastAPI 后端
│   └── frontend/             # React 前端
├── examples/                 # 测试示例
├── docs/                     # 文档
├── tests/                    # 测试
├── config.yaml
└── requirements.txt
```

## 六、Web 前端架构 (stagent-web/)

### 6.1 技术栈

| 技术 | 选择 | 用途 |
|------|------|------|
| 前端框架 | React 18 + Vite | UI 构建 |
| UI 样式 | TailwindCSS + lucide-react | 样式 + 图标 |
| 状态管理 | Zustand + persist | 全局状态 + 本地持久化 |
| HTTP 客户端 | Axios | API 调用 + 拦截器 |
| 后端框架 | FastAPI | REST API + WebSocket |
| 认证 | JWT (python-jose + passlib) | 用户登录 |

### 6.2 目录结构

```
stagent-web/
├── backend/
│   ├── main.py
│   ├── auth.py
│   ├── users.py
│   ├── routes/
│   ├── data/
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── api/
    │   ├── components/Layout/
    │   ├── pages/
    │   ├── stores/
    │   └── index.css
    └── package.json
```

### 6.3 认证流程

```
用户注册/登录 → POST /api/auth/login → 后端验证密码并签发 JWT
      ↓
前端 Zustand 持久化 token → Axios 请求拦截器附加 Authorization Bearer token
      ↓
401 响应时自动清除登录态并跳转 /login
```

### 6.4 路由

| 路由 | 页面 |
|------|------|
| `/login` | 登录/注册页 |
| `/` | 项目列表 |
| `/help` | 项目说明 |
| `/projects/:id` | 配置页 |
| `/projects/:id/run` | 运行页 |
| `/reports/:id` | 报告页 |
| `/coverage/:id` | 覆盖率页 |

## 七、支持的测试场景

| 场景 | 配置方式 |
|------|----------|
| 随机输入测试 | `generation.strategy: "random"` |
| 边界值测试 | `generation.strategy: "boundary"` |
| 结构化输入测试 | `wrapper.enabled: true` |
| 预设用例测试 | `suite.cases: [...]` |
| 用例+断言绑定 | `suite.cases[].assertions: [...]` |
| 全局默认断言 | `analysis.default_assertions: [...]` |
| 用例去重 | `analysis.deduplication.enabled: true` |
| 覆盖率统计 | `analysis.coverage.enabled: true` |

## 八、报告输出

```json
{
  "total": 10,
  "passed": 8,
  "failed": 2,
  "errors": 0,
  "summary": {
    "total_duration": 1.23,
    "pass_rate": "80.0%"
  },
  "results": [
    {
      "test_case_id": "SUITE_0000",
      "passed": true,
      "assertions": {
        "total": 2,
        "passed": 2,
        "details": []
      }
    }
  ]
}
```

## 九、启动方式

```bash
# 后端
cd stagent-web/backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000

# 前端
cd stagent-web/frontend
npm install
npm run dev
```
