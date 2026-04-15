#!/usr/bin/env python3
"""
STAgent 测试示例 - 排序程序测试

使用方法:
    python examples/test_runner.py

依赖:
    pip install pyyaml
"""
import os
import sys
import json
import subprocess

# 切换到项目根目录
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(PROJECT_ROOT)

# 添加到路径
sys.path.insert(0, PROJECT_ROOT)


def step(title):
    """打印步骤标题"""
    print(f"\n{'='*50}")
    print(f"  {title}")
    print(f"{'='*50}")


def compile_sort():
    """编译排序程序"""
    step("步骤1: 编译排序程序")

    src = "examples/sort.c"
    exe = "examples/sort.exe"

    # 检查 gcc
    check = subprocess.run("gcc --version", shell=True, capture_output=True)
    if check.returncode != 0:
        print("错误: 未安装 gcc")
        print("Windows: 下载 MinGW-w64")
        print("Linux: sudo apt install gcc")
        print("Mac: xcode-select --install")
        return False

    cmd = f"gcc {src} -o {exe}"
    print(f"执行命令: {cmd}")

    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)

    if result.returncode == 0:
        print("✓ 编译成功!")
        return True
    else:
        print(f"✗ 编译失败: {result.stderr}")
        return False


def test_wrapper():
    """测试 Wrapper 功能"""
    step("步骤2: 测试 Wrapper")

    from stagent.wrapper import Wrapper

    schema_config = [
        {"name": "count", "type": "int", "range_min": 1, "range_max": 10},
        {"name": "numbers", "type": "list[int]", "count_from": "count", "range_min": -100, "range_max": 100}
    ]

    wrapper = Wrapper.from_config(schema_config)

    print("\n生成5个测试输入:\n")
    for i in range(5):
        context = {}
        result = wrapper.generate(context=context)
        print(f"用例{i+1}:")
        print(result)
        print()


def run_auto_test():
    """运行自动化测试"""
    step("步骤3: 运行自动化测试")

    from stagent.config import load_config
    from stagent.orchestrator import TestOrchestrator

    config_path = "examples/sort_wrapper.yaml"

    if not os.path.exists(config_path):
        print(f"错误: 配置文件不存在 {config_path}")
        return False

    config = load_config(config_path)

    # 检查程序
    if not os.path.exists(config.target.program):
        alt = "examples/sort.exe"
        if os.path.exists(alt):
            config.target.program = alt
        else:
            print(f"错误: 找不到被测程序 {config.target.program}")
            return False

    print(f"被测程序: {config.target.program}")
    print(f"用例数量: {config.generation.count}")
    print(f"生成策略: {config.generation.strategy}")
    print(f"Wrapper: {'启用' if config.wrapper.enabled else '禁用'}")

    # 创建编排器并运行
    orchestrator = TestOrchestrator(config)
    report = orchestrator.run()

    # 保存报告
    report_path = config.output.report_path
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    orchestrator.analyzer.save_report(report, report_path)

    return report


def show_report():
    """显示报告"""
    step("步骤4: 测试结果")

    report_path = "results/sort_report.json"

    if not os.path.exists(report_path):
        print("报告不存在")
        return

    with open(report_path, "r", encoding="utf-8") as f:
        report = json.load(f)

    print(f"""
测试摘要
--------
总用例数: {report['total']}
通过:     {report['passed']}
失败:     {report['failed']}
通过率:   {report['summary']['pass_rate']}
总耗时:   {report['summary']['total_duration']}s

断言统计
--------
断言总数: {report['summary']['assertions']['total']}
断言通过: {report['summary']['assertions']['passed']}
断言失败: {report['summary']['assertions']['failed']}
""")

    # 显示失败用例
    failed = [r for r in report['results'] if not r['passed']]
    if failed:
        print("失败用例:")
        for r in failed[:3]:
            print(f"  - {r['test_case_id']}: {r['reason']}")


def interactive_test():
    """交互式测试"""
    step("步骤5: 交互式测试")

    exe = "examples/sort.exe"
    if not os.path.exists(exe):
        print("排序程序不存在")
        return

    print("输入数字(每行一个，输入空行结束):")
    print("示例输入: 5 3 8 1 9\n")

    # 准备输入
    test_input = "5\n3\n8\n1\n9\n\n"  # 末尾空行表示结束

    result = subprocess.run(
        [exe],
        input=test_input,
        capture_output=True,
        text=True,
        timeout=5
    )

    print("-" * 30)
    print("输出:")
    print(result.stdout)

    if result.stderr:
        print("错误:")
        print(result.stderr)

    print(f"退出码: {result.returncode}")


def main():
    print("""
╔════════════════════════════════════════╗
║       STAgent 测试示例 - 排序程序        ║
╚════════════════════════════════════════╝
""")

    # 1. 编译
    if not compile_sort():
        sys.exit(1)

    # 2. 测试 Wrapper
    test_wrapper()

    # 3. 自动化测试
    report = run_auto_test()

    # 4. 显示报告
    if report:
        show_report()

    # 5. 交互测试
    interactive_test()

    print(f"\n{'='*50}")
    print("  测试完成!")
    print(f"{'='*50}")
    print(f"\n详细报告: {os.path.abspath('results/sort_report.json')}")


if __name__ == "__main__":
    main()
