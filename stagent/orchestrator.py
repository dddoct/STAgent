"""测试编排引擎 - 集成去重和覆盖率"""
import logging
import os
from typing import List, Optional
from .config import Config
from .models import TestCase, TestResult, TestReport
from .generators.factory import create_generator
from .executor import TestExecutor
from .analyzer import ResultAnalyzer
from .dedup import TestCaseDeduplicator, DeduplicationConfig, EquivalenceGrouper
from .coverage import CoverageCollector, CoverageConfig, CoverageReport


class TestOrchestrator:
    """测试编排引擎 - 协调各模块完成测试"""

    def __init__(self, config: Config):
        self.config = config
        self.logger = logging.getLogger(__name__)

        # 初始化各模块
        self.generator = create_generator(config)
        self.executor = TestExecutor(config.target)
        self.analyzer = ResultAnalyzer(config.analysis)

        # 去重器
        self.dedup_config = DeduplicationConfig(
            enabled=config.analysis.deduplication.enabled,
            strategy=config.analysis.deduplication.strategy,
            normalize_numbers=config.analysis.deduplication.normalize_numbers,
            ignore_order=config.analysis.deduplication.ignore_order
        )
        self.deduplicator = TestCaseDeduplicator(self.dedup_config)

        # 覆盖率收集器
        self.coverage_collector = None
        if config.analysis.coverage.enabled:
            cov_config = CoverageConfig(
                enabled=True,
                source_file=config.analysis.coverage.source_file,
            )
            self.coverage_collector = CoverageCollector(cov_config)

    def run(self) -> TestReport:
        """运行完整测试流程"""
        self.logger.info("=" * 50)
        self.logger.info("开始测试流程")
        self.logger.info("=" * 50)

        # 1. 生成测试用例
        self.logger.info(f"[生成] 使用 {self.config.generation.strategy} 策略")
        test_cases = self.generator.generate()
        self.logger.info(f"[生成] 生成了 {len(test_cases)} 个测试用例")

        # 2. 用例去重
        if self.dedup_config.enabled:
            test_cases = self._apply_deduplication(test_cases)

        # 3. 执行并分析每个测试用例
        results = self._execute_tests(test_cases)

        # 4. 生成测试报告
        report = self.analyzer.generate_report(results)

        # 5. 收集覆盖率（如启用）
        if self.coverage_collector:
            self._collect_coverage(test_cases)

        # 6. 打印摘要
        self._print_summary(report)

        return report

    def _apply_deduplication(self, cases: List[TestCase]) -> List[TestCase]:
        """应用去重"""
        self.logger.info("[去重] 开始去重...")

        # 哈希去重
        original_count = len(cases)
        cases = self.deduplicator.deduplicate(cases)
        self.logger.info(f"[去重] 哈希去重: {original_count} -> {len(cases)}")

        # 如果启用等价类分组
        if self.dedup_config.strategy == "equivalence" or self.dedup_config.strategy == "both":
            grouper = EquivalenceGrouper()
            groups = grouper.group(cases)
            self.logger.info(f"[去重] 等价类分组: {len(groups)} 个等价组")

            # 建议
            recommendations = grouper.get_coverage_recommendation()
            for rec in recommendations:
                self.logger.info(f"[去重] {rec}")

            # 返回代表用例
            cases = grouper.get_representatives()
            self.logger.info(f"[去重] 等价类去重: {len(cases)} 个代表用例")

        return cases

    def _execute_tests(self, test_cases: List[TestCase]) -> List[TestResult]:
        """执行测试用例"""
        results: List[TestResult] = []
        test_inputs = []  # 用于覆盖率收集

        for i, test_case in enumerate(test_cases, 1):
            self.logger.info(f"[执行] [{i}/{len(test_cases)}] {test_case.id}")

            # 执行
            execution = self.executor.execute(test_case)
            test_inputs.append(test_case.input_data)

            # 分析
            result = self.analyzer.analyze(test_case, execution)
            results.append(result)

            # 记录结果
            status_str = "✓ PASS" if result.passed else "✗ FAIL"
            self.logger.info(f"  {status_str} - {result.reason or 'OK'}")

        return results

    def _collect_coverage(self, test_cases: List[TestCase]) -> None:
        """收集覆盖率"""
        self.logger.info("[覆盖率] 开始收集覆盖率...")

        program = self.config.target.program

        # 检查是否需要编译
        if self.coverage_collector.config.enabled:
            source_file = self.config.analysis.coverage.source_file
            if source_file and os.path.exists(source_file):
                # 重新编译带覆盖率
                self.coverage_collector.compile_with_coverage(source_file, program)

        # 收集覆盖率
        test_inputs = [tc.input_data for tc in test_cases]
        coverage_report = self.coverage_collector.collect(program, test_inputs)

        # 保存报告
        coverage_path = self.config.output.report_path.replace(".json", "_coverage.json")
        self.coverage_collector.save_report(coverage_report, coverage_path)
        self.coverage_collector.print_summary(coverage_report)

        self.logger.info(f"[覆盖率] 报告已保存: {coverage_path}")

    def _print_summary(self, report: TestReport) -> None:
        """打印测试摘要"""
        self.logger.info("=" * 50)
        self.logger.info("测试摘要")
        self.logger.info("=" * 50)
        self.logger.info(f"总用例数: {report.total}")
        self.logger.info(f"通过: {report.passed}")
        self.logger.info(f"失败: {report.failed}")
        self.logger.info(f"错误: {report.errors}")
        self.logger.info(f"通过率: {report.summary.get('pass_rate', 'N/A')}")
        self.logger.info(f"总耗时: {report.summary.get('total_duration', 0)}s")

        # 断言统计
        if 'assertions' in report.summary:
            a = report.summary['assertions']
            self.logger.info("-" * 50)
            self.logger.info(f"断言总数: {a['total']}")
            self.logger.info(f"断言通过: {a['passed']}")
            self.logger.info(f"断言失败: {a['failed']}")

    def run_with_cases(self, test_cases: List[TestCase]) -> TestReport:
        """使用指定的测试用例运行测试"""
        self.logger.info(f"使用 {len(test_cases)} 个预设测试用例运行测试")

        # 去重
        if self.dedup_config.enabled:
            test_cases = self.deduplicator.deduplicate(test_cases)

        results = self._execute_tests(test_cases)
        report = self.analyzer.generate_report(results)
        self._print_summary(report)

        return report

    def analyze_deduplication(self, cases: List[TestCase]) -> dict:
        """分析用例去重情况"""
        # 哈希重复
        duplicates = self.deduplicator.find_duplicates(cases)

        # 等价类分组
        grouper = EquivalenceGrouper()
        groups = grouper.group(cases)

        return {
            "total_cases": len(cases),
            "hash_duplicates": len(cases) - len(self.deduplicator.deduplicate(cases)),
            "equivalence_groups": len(groups),
            "recommendations": grouper.get_coverage_recommendation()
        }
