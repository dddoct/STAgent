# STAgent - 软件测试智能体架构设计

## 一、系统概述

STAgent 是一个配置驱动的自动化软件测试工具，通过 YAML 配置定义测试用例生成策略、输入格式和断言规则，无需编写代码即可完成黑盒/白盒测试。

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
| `analysis` | 断言规则和报告格式 |

### 3.2 Wrapper 模块 (wrapper.py)

**作用**: 将程序需要的输入格式结构化描述，生成符合格式的测试数据。

```yaml
wrapper:
  enabled: true
  input_schema:
    - name: count
      type: "int"
      range_min: 1
      range_max: 10
    - name: numbers
      type: "list[int]"
      count_from: "count"  # 引用其他字段
```

**支持的数据类型**:

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

**作用**: 定义各种验证规则，检查程序输出是否符合预期。

| 断言类型 | 说明 | 配置示例 |
|----------|------|----------|
| `exact` | 精确匹配 | `expected: "hello world"` |
| `fuzzy` | 模糊匹配（忽略空白） | `expected: "hello world"` |
| `regex` | 正则表达式匹配 | `pattern: "\\d+"` |
| `contains` | 包含子串 | `substring: "error"` |
| `numeric_range` | 数值范围 | `min: 0, max: 100` |
| `exit_code` | 退出码验证 | `expected: 0` |
| `no_error` | 无错误信息 | `{}` |

### 3.4 测试套件 (suite + suite_loader.py)

**用例与断言绑定**: 每个用例可以单独定义自己的断言规则。

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

**作用**: 去除重复或等价的测试用例，提高测试效率。

| 配置项 | 说明 |
|--------|------|
| `enabled` | 是否启用去重 |
| `strategy` | 去重策略：`hash`（哈希精确去重）、`equivalence`（等价类去重）、`both`（两者结合） |
| `normalize_numbers` | 数字规范化（如 `1,2,3` 和 `9,8,7` 统一为 `D1,D2,D3`） |
| `ignore_order` | 忽略输入顺序（适合排序类程序） |

**等价类分组**: 按输入特征自动分组，如"空输入"、"单个数字"、"已排序"、"逆序"、"随机"等。

```yaml
analysis:
  deduplication:
    enabled: true
    strategy: "both"
    normalize_numbers: true
    ignore_order: false
```

### 3.6 覆盖率统计 (coverage.py)

**作用**: 统计测试用例对源代码的覆盖程度。

| 功能 | 说明 |
|------|------|
| **行覆盖率** | 多少行代码被执行 |
| **分支覆盖率** | 多少个分支被执行 |
| **函数覆盖率** | 各个函数的覆盖情况 |
| **未覆盖行号** | 列出未覆盖的代码行 |

**使用方式**: 需要 gcc 编译器环境，自动用 `-fprofile-arcs -ftest-coverage` 编译程序。

```yaml
analysis:
  coverage:
    enabled: true
    source_file: "./examples/sort.c"
    compile_with_coverage: true
```

**覆盖率报告示例**:
```
行覆盖率:   45 / 60   (75.0%)
分支覆盖:   12 / 20   (60.0%)
未覆盖行数: 15 (前10个: 5, 12, 18, 23, 29, 35, 41, 47, 52, 58)
```

## 四、完整配置示例

```yaml
target:
  program: "./examples/sort.exe"
  timeout: 10

wrapper:
  enabled: true
  input_schema:
    - name: count
      type: "int"
      range_min: 1
      range_max: 10
    - name: numbers
      type: "list[int]"
      count_from: "count"

suite:
  name: "sort_tests"
  cases:
    - input: "42"
      assertions:
        - type: "exact"
          expected: "排序结果:\n42"
    - input: "5\n3\n8\n1\n9"
      assertions:
        - type: "contains"
          substring: "排序结果"
        - type: "exit_code"
          expected: 0

analysis:
  default_assertions:
    - type: "no_error"

generation:
  strategy: "wrapper"
  count: 10

output:
  report_path: "./results/report.json"
  log_level: "INFO"
```

## 五、工作流程

```
┌─────────────┐
│  加载配置   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│           测试用例来源                │
│  ┌─────────┐     ┌───────────────┐ │
│  │ suite   │ OR  │   Generator   │ │
│  │ (预设)   │     │   (Wrapper)   │ │
│  └─────────┘     └───────────────┘ │
└──────┬────────────────┬────────────┘
       │                │
       ▼                ▼
┌───────────┐    ┌───────────┐
│  Executor │───▶│  Analyzer │
│  (执行)    │    │  (断言)    │
└───────────┘    └─────┬─────┘
                       │
                       ▼
                 ┌───────────┐
                 │  Report   │
                 │  (报告)    │
                 └───────────┘
```

## 六、项目结构

```
STAgent/
├── stagent/
│   ├── __init__.py
│   ├── __main__.py
│   ├── cli.py              # 命令行入口
│   ├── config.py           # 配置加载
│   ├── models.py           # 数据模型
│   ├── wrapper.py          # 结构化输入适配器
│   ├── assertions.py       # 断言系统
│   ├── executor.py         # 测试执行
│   ├── analyzer.py         # 结果分析
│   ├── suite_loader.py     # 测试套件加载
│   ├── dedup.py            # 用例去重
│   ├── coverage.py         # 覆盖率统计
│   ├── orchestrator.py     # 编排引擎
│   └── generators/
│       ├── __init__.py
│       ├── base.py
│       ├── random_gen.py
│       ├── boundary_gen.py
│       ├── schema_gen.py
│       └── factory.py
├── examples/
│   ├── calculator.c
│   ├── sort.c
│   ├── calculator_wrapper.yaml
│   ├── sort_wrapper.yaml
│   └── sort_full.yaml
├── tests/
├── config.yaml
└── requirements.txt
```

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
    "pass_rate": "80.0%",
    "assertions": {
      "total": 15,
      "passed": 12,
      "failed": 3
    }
  },
  "results": [
    {
      "test_case_id": "SUITE_0000",
      "passed": true,
      "assertions": {
        "total": 2,
        "passed": 2,
        "details": [...]
      }
    }
  ]
}
```
