"""测试套件加载器 - 用例+断言绑定"""
from typing import List
from .config import Config, SuiteConfig, CaseConfig
from .models import TestCase, TestSuite
from .wrapper import Wrapper


class SuiteLoader:
    """测试套件加载器"""

    def __init__(self, config: Config):
        self.config = config

    def load_suite(self) -> TestSuite:
        """从配置加载测试套件"""
        if not self.config.suite or not self.config.suite.cases:
            return TestSuite(name="empty")

        suite = TestSuite(name=self.config.suite.name)

        # 如果有 wrapper，用于生成动态输入
        wrapper = None
        if self.config.wrapper.enabled and self.config.wrapper.input_schema:
            wrapper = Wrapper.from_config(self.config.wrapper.get_schema_config())

        for i, case_config in enumerate(self.config.suite.cases):
            test_case = self._create_test_case(case_config, i, wrapper)
            suite.add_case(test_case)

        return suite

    def _create_test_case(
        self,
        case_config: CaseConfig,
        index: int,
        wrapper: Wrapper = None
    ) -> TestCase:
        """创建测试用例"""
        # 确定输入
        if case_config.input:
            # 直接指定输入
            input_data = case_config.input
        elif case_config.input_ref and wrapper:
            # 通过 wrapper 引用生成
            context = {}
            input_data = wrapper.generate(context=context)
        elif wrapper:
            # 使用 wrapper 生成
            context = {}
            input_data = wrapper.generate(context=context)
        else:
            input_data = ""

        return TestCase(
            id=f"SUITE_{index:04d}",
            input_data=input_data,
            expected_output=None,
            assertions=case_config.assertions,
            metadata=case_config.metadata
        )

    def create_suite_from_wrapper(self, count: int = None) -> TestSuite:
        """根据 wrapper 配置生成测试套件"""
        if not self.config.wrapper.enabled or not self.config.wrapper.input_schema:
            return TestSuite(name="empty")

        wrapper = Wrapper.from_config(self.config.wrapper.get_schema_config())
        n = count or self.config.generation.count

        suite = TestSuite(name="wrapper_generated")

        for i in range(n):
            context = {}
            input_data = wrapper.generate(context=context)

            test_case = TestCase(
                id=f"WRAP_{i:04d}",
                input_data=input_data,
                assertions=self.config.analysis.default_assertions,
                metadata={"generator": "wrapper", "index": i}
            )
            suite.add_case(test_case)

        return suite