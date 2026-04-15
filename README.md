# STAgent - 软件测试智能体

自动化软件测试框架，支持配置驱动的黑盒/白盒测试。

## 功能特性

| 功能 | 说明 |
|------|------|
| 测试用例生成 | Random / Boundary / Schema 三种策略 |
| 结构化输入 | Wrapper 配置驱动，支持命令行参数和标准输入 |
| 断言系统 | 7种断言类型（exact/fuzzy/regex/contains/numeric_range/exit_code/no_error） |
| 用例去重 | 哈希 + 等价类去重 |
| 覆盖率统计 | gcov 集成（需要源码编译） |
| Web 界面 | 实时进度、日志、报告查看 |

## 项目结构

```
STAgent/
├── stagent/                 # 核心引擎 (Python)
│   ├── cli.py               # 命令行入口
│   ├── config.py           # 配置加载
│   ├── executor.py         # 测试执行
│   ├── analyzer.py          # 结果分析
│   ├── assertions.py        # 断言系统
│   ├── wrapper.py           # 结构化输入适配器
│   ├── dedup.py            # 用例去重
│   ├── coverage.py         # 覆盖率统计
│   ├── orchestrator.py     # 编排引擎
│   └── generators/          # 用例生成器
│       ├── base.py
│       ├── random_gen.py
│       ├── boundary_gen.py
│       ├── schema_gen.py
│       └── factory.py
│
├── stagent-web/            # Web 界面
│   ├── backend/            # FastAPI 后端
│   ├── frontend/           # React 前端
│   ├── start.bat           # Windows 启动脚本
│   └── README.md           # Web 使用说明
│
├── examples/               # 测试示例（19个程序，5大类型）
│   ├── basic/              # 基础测试 (4个)
│   ├── math/               # 数学计算 (6个)
│   ├── string/             # 字符串处理 (4个)
│   ├── file_io/            # 文件IO (3个)
│   ├── error_handling/     # 错误处理 (2个)
│   └── TEST_CASES.md       # 测试用例详细说明
│
└── docs/                   # 文档
    └── STAgent架构设计.md
```

## 快速开始

### 方式一：Web 界面（推荐）

```bash
cd stagent-web
start.bat
```

访问 http://localhost:3000

### 方式二：命令行

```bash
# 运行测试
D:\Anaconda\python.exe -m stagent.cli --config examples/math/add.yaml

# 查看帮助
D:\Anaconda\python.exe -m stagent.cli --help
```

## 测试程序分类

### 1. 基础测试 (4个)

| 程序 | 功能 | 测试点 |
|------|------|--------|
| hello.exe | 打印问候语 | 参数处理、输出格式 |
| echo.exe | 回显文本 | 多参数处理 |
| counter.exe | 数字计数 | 循环输出、边界条件 |
| compare.exe | 比较大小 | 条件分支 |

### 2. 数学计算 (6个)

| 程序 | 功能 | 测试点 |
|------|------|--------|
| add.exe | 两数相加 | 浮点运算 |
| divide.exe | 两数相除 | 除零错误处理 |
| factorial.exe | 阶乘计算 | 递归/循环、边界(20!) |
| gcd.exe | 最大公约数 | 算法正确性 |
| prime.exe | 素数判断 | 数学逻辑 |
| sort.exe | 排序(多行输入) | 数据结构 |

### 3. 字符串处理 (4个)

| 程序 | 功能 | 测试点 |
|------|------|--------|
| reverse.exe | 反转字符串 | 字符串操作 |
| case.exe | 大小写转换 | 字符处理 |
| strlen.exe | 字符统计 | 分类统计 |
| palindrome.exe | 回文检测 | 算法实现 |

### 4. 文件IO (3个)

| 程序 | 功能 | 测试点 |
|------|------|--------|
| cat.exe | 读取文件 | 文件操作、错误处理 |
| write.exe | 写入文件 | 文件创建 |
| wc.exe | 统计行单词字符 | 文本处理 |

### 5. 错误处理 (2个)

| 程序 | 功能 | 退出码 |
|------|------|--------|
| validate.exe | 参数验证 | 0=有效,1=参数错,2=负数,3=超范围 |
| memory.exe | 内存分配 | 0=成功,2=负数,3=太大,4=失败 |

## 配置示例

### 基本配置（命令行参数模式）

```yaml
target:
  program: "examples/math/add.exe"  # 被测程序路径
  timeout: 5                         # 超时时间(秒)

wrapper:
  enabled: true                      # 启用 Wrapper
  mode: "args"                      # args=命令行参数, stdin=标准输入
  schema:
    - name: "num1"                  # 参数名
      type: "float"                 # 类型: int/float/string
      range: [0.0, 100.0]          # 范围

assertions:                          # 断言列表
  - type: "exit_code"
    expected: 0                     # 期望退出码
  - type: "regex"
    pattern: "^\\d+\\.\\d{2}\\n$" # 正则匹配
```

### 标准输入模式

```yaml
target:
  program: "examples/sort.exe"
  timeout: 5

wrapper:
  enabled: true
  mode: "stdin"                     # 标准输入模式
  schema:
    - name: "numbers"
      type: "list[int]"
      count_fixed: 5
      range: [-100, 100]

assertions:
  - type: "exit_code"
    expected: 0
  - type: "contains"
    substring: "排序结果"
```

### 错误处理测试（允许多种退出码）

```yaml
target:
  program: "examples/error_handling/validate.exe"
  timeout: 5

wrapper:
  enabled: true
  mode: "args"
  schema:
    - name: "number"
      type: "int"
      range: [-10, 150]

assertions:
  - type: "exit_code"
    expected: [0, 1, 2, 3]         # 允许多个退出码
```

## 断言类型

| 类型 | 说明 | 配置示例 |
|------|------|----------|
| exact | 精确匹配 | `expected: "Hello"` |
| fuzzy | 模糊匹配（忽略空白） | `expected: "hello world"` |
| regex | 正则表达式 | `pattern: "^\\d+\\.\\d{2}"` |
| contains | 包含子串 | `substring: "成功"` |
| numeric_range | 数值范围 | `min: 0, max: 100` |
| exit_code | 退出码 | `expected: 0` 或 `expected: [0, 1]` |
| no_error | 无错误 | `allow_stderr: true` |

## 技术栈

- **核心引擎**: Python 3.10+ / PyYAML
- **Web 后端**: FastAPI / Uvicorn / WebSocket
- **Web 前端**: React 18 / Vite / TailwindCSS / Zustand

## 依赖安装

```bash
# 核心引擎
pip install pyyaml

# Web 后端
cd stagent-web/backend
pip install -r requirements.txt

# Web 前端
cd stagent-web/frontend
npm install
```

