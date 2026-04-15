"""覆盖率统计模块"""
import os
import re
import json
import subprocess
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set, Tuple
from pathlib import Path


@dataclass
class CoverageConfig:
    """覆盖率配置"""
    enabled: bool = False
    compiler: str = "gcc"  # gcc | clang
    compiler_flags: List[str] = field(default_factory=lambda: ["-fprofile-arcs", "-ftest-coverage"])
    linker_flags: List[str] = field(default_factory=lambda: ["-fprofile-arcs", "-ftest-coverage", "-lgcov"])
    source_dir: str = "./examples"
    output_format: str = "json"  # json | html | text


@dataclass
class FunctionCoverage:
    """函数覆盖率"""
    name: str
    lines_covered: int = 0
    lines_total: int = 0
    branches_covered: int = 0
    branches_total: int = 0

    @property
    def line_percent(self) -> float:
        if self.lines_total == 0:
            return 100.0
        return (self.lines_covered / self.lines_total) * 100

    @property
    def branch_percent(self) -> float:
        if self.branches_total == 0:
            return 100.0
        return (self.branches_covered / self.branches_total) * 100


@dataclass
class CoverageReport:
    """覆盖率报告"""
    program: str
    total_lines: int = 0
    covered_lines: int = 0
    line_percent: float = 0.0
    total_branches: int = 0
    covered_branches: int = 0
    branch_percent: float = 0.0
    functions: List[FunctionCoverage] = field(default_factory=list)
    uncovered_lines: List[int] = field(default_factory=list)
    source_file: Optional[str] = None

    def to_dict(self) -> Dict:
        return {
            "program": self.program,
            "lines": {
                "total": self.total_lines,
                "covered": self.covered_lines,
                "percent": round(self.line_percent, 2)
            },
            "branches": {
                "total": self.total_branches,
                "covered": self.covered_branches,
                "percent": round(self.branch_percent, 2)
            },
            "functions": [
                {
                    "name": f.name,
                    "lines": f"{f.lines_covered}/{f.lines_total} ({f.line_percent:.1f}%)",
                    "branches": f"{f.branches_covered}/{f.branches_total} ({f.branch_percent:.1f}%)"
                }
                for f in self.functions
            ],
            "uncovered_lines": self.uncovered_lines[:20] if self.uncovered_lines else []  # 只显示前20行
        }


class CoverageCollector:
    """覆盖率收集器"""

    def __init__(self, config: CoverageConfig):
        self.config = config

    def compile_with_coverage(self, source_file: str, output_file: str) -> bool:
        """编译程序并启用覆盖率"""
        if not os.path.exists(source_file):
            print(f"[覆盖率] 源文件不存在: {source_file}")
            return False

        compiler_flags = ' '.join(self.config.compiler_flags)
        linker_flags = ' '.join(self.config.linker_flags)

        cmd = f"{self.config.compiler} {compiler_flags} {source_file} -o {output_file} {linker_flags}"

        print(f"[覆盖率] 编译命令: {cmd}")

        try:
            result = subprocess.run(
                cmd, shell=True,
                capture_output=True,
                text=True,
                timeout=60
            )
            if result.returncode != 0:
                print(f"[覆盖率] 编译失败: {result.stderr}")
                return False
            return True
        except Exception as e:
            print(f"[覆盖率] 编译异常: {e}")
            return False

    def collect(self, program: str, test_inputs: List[str]) -> CoverageReport:
        """收集覆盖率数据"""
        report = CoverageReport(program=program)

        # 查找 .gcno 和 .gcda 文件
        program_dir = os.path.dirname(program)
        program_name = os.path.basename(program)

        # 运行测试用例收集覆盖率数据
        for i, input_data in enumerate(test_inputs):
            try:
                process = subprocess.Popen(
                    [program],
                    stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    cwd=program_dir or "."
                )
                stdout, stderr = process.communicate(input=input_data, timeout=10)
            except Exception as e:
                print(f"[覆盖率] 执行测试用例 {i} 失败: {e}")

        # 查找 gcov 生成的覆盖率文件
        gcov_files = list(Path(program_dir or ".").glob("*.gcov"))

        if gcov_files:
            report = self._parse_gcov_files(gcov_files, program)
        else:
            # 尝试使用 gcov 命令
            report = self._run_gcov(program_dir, program)

        return report

    def _run_gcov(self, program_dir: str, program: str) -> CoverageReport:
        """运行 gcov 收集覆盖率"""
        program_name = os.path.basename(program)

        try:
            # 运行 gcov
            result = subprocess.run(
                ["gcov", "-i", program_name + ".c"],
                capture_output=True,
                text=True,
                cwd=program_dir or ".",
                timeout=30
            )

            if result.returncode == 0:
                # 解析 gcov 输出
                return self._parse_gcov_output(result.stdout, program)
        except FileNotFoundError:
            print("[覆盖率] gcov 命令未找到，请安装 gcc 或 lcov")
        except Exception as e:
            print(f"[覆盖率] gcov 执行失败: {e}")

        return CoverageReport(program=program)

    def _parse_gcov_output(self, gcov_output: str, program: str) -> CoverageReport:
        """解析 gcov JSON 输出"""
        report = CoverageReport(program=program)

        # gcov -i 输出是 JSON 格式
        try:
            data = json.loads(gcov_output)

            for file_data in data.get("files", []):
                source_file = file_data.get("file", "")
                report.source_file = source_file

                total_covered = 0
                total_lines = 0
                uncovered = []

                for func in file_data.get("functions", []):
                    f = FunctionCoverage(
                        name=func.get("name", "unknown"),
                        lines_covered=func.get("execution_count", 0),
                        lines_total=1  # gcov -i 每个函数算一行
                    )
                    report.functions.append(f)

                for line in file_data.get("lines", []):
                    line_num = line.get("line_number", 0)
                    count = line.get("count", 0)

                    if line_num > 0:
                        total_lines += 1
                        if count > 0:
                            total_covered += 1
                        else:
                            uncovered.append(line_num)

                report.total_lines += total_lines
                report.covered_lines += total_covered
                report.uncovered_lines.extend(uncovered)

        except json.JSONDecodeError:
            print("[覆盖率] 无法解析 gcov JSON 输出")

        # 计算百分比
        if report.total_lines > 0:
            report.line_percent = (report.covered_lines / report.total_lines) * 100

        return report

    def _parse_gcov_files(self, gcov_files: List[Path], program: str) -> CoverageReport:
        """解析 .gcov 文件"""
        report = CoverageReport(program=program)

        for gcov_file in gcov_files:
            try:
                with open(gcov_file, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()

                source_file = str(gcov_file).replace(".gcov", ".c")
                report.source_file = source_file

                total_lines = 0
                covered_lines = 0
                uncovered = []

                for line in content.split('\n'):
                    # gcov 格式: 覆盖次数 源代码行号 |  source code
                    match = re.match(r'^[\s]*(\d+|-|[0-9]+[#]*)\s+(\d+):', line)
                    if match:
                        count_str, line_num = match.groups()
                        total_lines += 1

                        if count_str.isdigit() and int(count_str) > 0:
                            covered_lines += 1
                        else:
                            uncovered.append(int(line_num))

                report.total_lines += total_lines
                report.covered_lines += covered_lines
                report.uncovered_lines.extend(uncovered)

            except Exception as e:
                print(f"[覆盖率] 解析 {gcov_file} 失败: {e}")

        if report.total_lines > 0:
            report.line_percent = (report.covered_lines / report.total_lines) * 100

        return report

    def save_report(self, report: CoverageReport, path: str) -> None:
        """保存覆盖率报告"""
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)

        with open(path, "w", encoding="utf-8") as f:
            if self.config.output_format == "json":
                json.dump(report.to_dict(), f, ensure_ascii=False, indent=2)
            else:
                # 文本格式
                f.write(f"覆盖率报告: {report.program}\n")
                f.write("=" * 50 + "\n")
                f.write(f"源码文件: {report.source_file}\n\n")
                f.write(f"行覆盖率: {report.covered_lines}/{report.total_lines} ({report.line_percent:.1f}%)\n")
                f.write(f"分支覆盖率: {report.covered_branches}/{report.total_branches} ({report.branch_percent:.1f}%)\n\n")

                if report.functions:
                    f.write("函数覆盖率:\n")
                    for func in report.functions:
                        f.write(f"  {func.name}: {func.line_percent:.1f}%\n")

                if report.uncovered_lines:
                    f.write(f"\n未覆盖行号 (前20个): {report.uncovered_lines[:20]}\n")

    def print_summary(self, report: CoverageReport) -> None:
        """打印覆盖率摘要"""
        print("\n" + "=" * 50)
        print("覆盖率报告")
        print("=" * 50)
        print(f"程序: {report.program}")
        if report.source_file:
            print(f"源码: {report.source_file}")
        print("-" * 50)
        print(f"行覆盖率:  {report.covered_lines:4d} / {report.total_lines:<4d}  ({report.line_percent:5.1f}%)")
        print(f"分支覆盖:  {report.covered_branches:4d} / {report.total_branches:<4d}  ({report.branch_percent:5.1f}%)")
        print("-" * 50)

        if report.uncovered_lines:
            uncovered_count = len(report.uncovered_lines)
            print(f"未覆盖行数: {uncovered_count} (前10个: {report.uncovered_lines[:10]})")


class CoverageAnalyzer:
    """覆盖率分析器 - 分析测试用例对代码的覆盖情况"""

    def __init__(self):
        self.test_coverage: Dict[str, Set[int]] = {}  # test_id -> covered_lines
        self.total_coverage: Set[int] = set()

    def record(self, test_id: str, covered_lines: List[int]) -> None:
        """记录单个测试用例的覆盖情况"""
        self.test_coverage[test_id] = set(covered_lines)
        self.total_coverage.update(covered_lines)

    def get_coverage_by_test(self) -> Dict[str, int]:
        """获取每个测试用例覆盖的行数"""
        return {test_id: len(lines) for test_id, lines in self.test_coverage.items()}

    def get_unique_coverage(self, test_id: str) -> int:
        """获取测试用例独有的覆盖行数"""
        other_coverage = set()
        for tid, lines in self.test_coverage.items():
            if tid != test_id:
                other_coverage.update(lines)

        return len(self.test_coverage[test_id] - other_coverage)

    def get_essential_tests(self) -> List[str]:
        """获取关键测试用例（提供独有覆盖的）"""
        essential = []
        for test_id in self.test_coverage:
            if self.get_unique_coverage(test_id) > 0:
                essential.append(test_id)
        return essential

    def suggest_improvement(self, total_lines: int) -> List[str]:
        """建议改进"""
        suggestions = []
        current_coverage = len(self.total_coverage)
        missing = total_lines - current_coverage

        if missing > 0:
            suggestions.append(f"还有 {missing} 行代码未覆盖 ({missing/total_lines*100:.1f}%)")

        # 检查是否有测试用例的覆盖全为独有
        essential = self.get_essential_tests()
        if len(essential) < len(self.test_coverage):
            suggestions.append(f"{len(self.test_coverage) - len(essential)} 个测试用例可能冗余")

        return suggestions
