"""结果分析模块 - 支持多断言"""
import json
import logging
from typing import List, Dict, Any
from .models import (
    TestCase, ExecutionResult, TestResult, TestStatus,
    ExecutionStatus, TestReport, AssertionTestResult
)
from .config import AnalysisConfig


class ResultAnalyzer:
    """结果分析器 - 支持多种断言类型"""

    def __init__(self, config: AnalysisConfig):
        self.config = config
        self.logger = logging.getLogger(__name__)

    def analyze(self, test_case: TestCase, execution: ExecutionResult) -> TestResult:
        """分析单个测试结果，执行多断言检查"""
        # 先检查执行状态
        if execution.status == ExecutionStatus.TIMEOUT:
            return TestResult(
                test_case_id=test_case.id,
                passed=False,
                execution=execution,
                reason="执行超时",
                assertion_results=[]
            )

        if execution.status == ExecutionStatus.ERROR:
            return TestResult(
                test_case_id=test_case.id,
                passed=False,
                execution=execution,
                reason=f"执行错误: {execution.stderr}",
                assertion_results=[]
            )

        # 执行断言检查（包括 CRASH 状态 - 非零退出码也可能是预期的）
        return self._run_assertions(test_case, execution)

    def _run_assertions(self, test_case: TestCase, execution: ExecutionResult) -> TestResult:
        """运行断言检查"""
        # 获取断言列表
        assertions = test_case.get_assertions()

        # 如果用例没有断言，使用默认断言
        if not assertions and self.config.default_assertions:
            from .assertions import AssertionFactory
            assertions = AssertionFactory.from_list(self.config.default_assertions)

        assertion_results: List[AssertionTestResult] = []
        context = {
            "exit_code": execution.exit_code,
            "stderr": execution.stderr,
            "stdout": execution.stdout,
            "duration": execution.duration,
        }

        # 执行每条断言
        for assertion in assertions:
            result = assertion.check(execution.stdout, context)
            assertion_results.append(AssertionTestResult(
                assertion_type=assertion.type_name(),
                passed=result.passed,
                message=result.message,
                actual=result.actual,
                expected=result.expected
            ))

        # 判断整体通过/失败
        if not assertion_results:
            # 没有断言时，只要程序正常退出就算通过
            passed = True
            reason = "无断言，程序正常执行"
        else:
            # 所有断言都通过才算通过
            passed = all(r.passed for r in assertion_results)
            failed = [r for r in assertion_results if not r.passed]
            if passed:
                reason = f"所有 {len(assertion_results)} 条断言通过"
            else:
                first_fail = failed[0]
                reason = f"断言失败: {first_fail.message}"

        return TestResult(
            test_case_id=test_case.id,
            passed=passed,
            execution=execution,
            reason=reason,
            assertion_results=assertion_results
        )

    def generate_report(self, results: List[TestResult]) -> TestReport:
        """生成测试报告"""
        passed = sum(1 for r in results if r.passed)
        failed = sum(1 for r in results if not r.passed)
        errors = sum(1 for r in results if r.execution.status in [
            ExecutionStatus.TIMEOUT, ExecutionStatus.ERROR, ExecutionStatus.CRASH
        ])

        # 构建详细结果
        detail_results = []
        for result in results:
            # 统计断言情况
            total_assertions = len(result.assertion_results)
            passed_assertions = sum(1 for a in result.assertion_results if a.passed)

            detail_results.append({
                "test_case_id": result.test_case_id,
                "passed": result.passed,
                "status": result.execution.status.value,
                "exit_code": result.execution.exit_code,
                "duration": round(result.execution.duration, 3),
                "stdout": result.execution.stdout[:500],
                "stderr": result.execution.stderr[:200],
                "reason": result.reason,
                "assertions": {
                    "total": total_assertions,
                    "passed": passed_assertions,
                    "failed": total_assertions - passed_assertions,
                    "details": [
                        {
                            "type": a.assertion_type,
                            "passed": a.passed,
                            "message": a.message,
                            "actual": str(a.actual)[:100] if a.actual else None,
                            "expected": str(a.expected)[:100] if a.expected else None,
                        }
                        for a in result.assertion_results
                    ] if result.assertion_results else []
                }
            })

        # 统计摘要
        total_duration = sum(r.execution.duration for r in results)
        total_assertions = sum(len(r.assertion_results) for r in results)
        passed_assertions = sum(
            sum(1 for a in r.assertion_results if a.passed)
            for r in results
        )

        summary = {
            "total_duration": round(total_duration, 3),
            "avg_duration": round(total_duration / len(results), 3) if results else 0,
            "pass_rate": f"{passed / len(results) * 100:.1f}%" if results else "0%",
            "assertions": {
                "total": total_assertions,
                "passed": passed_assertions,
                "failed": total_assertions - passed_assertions,
                "pass_rate": f"{passed_assertions / total_assertions * 100:.1f}%" if total_assertions else "N/A"
            }
        }

        return TestReport(
            total=len(results),
            passed=passed,
            failed=failed,
            errors=errors,
            results=detail_results,
            summary=summary
        )

    def save_report(self, report: TestReport, path: str) -> None:
        """保存报告到文件"""
        report_data = {
            "total": report.total,
            "passed": report.passed,
            "failed": report.failed,
            "errors": report.errors,
            "summary": report.summary,
            "results": report.results
        }

        with open(path, "w", encoding="utf-8") as f:
            json.dump(report_data, f, ensure_ascii=False, indent=2)
