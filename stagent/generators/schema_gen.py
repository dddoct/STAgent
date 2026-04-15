"""结构化输入生成器 - 基于 Wrapper"""
from typing import List
from .base import BaseGenerator
from ..models import TestCase
from ..config import GenerationConfig
from ..wrapper import Wrapper


class SchemaGenerator(BaseGenerator):
    """基于 schema 配置的结构化输入生成器"""

    def __init__(self, config: GenerationConfig, wrapper: Wrapper):
        super().__init__(config)
        self.wrapper = wrapper

    def generate(self) -> List[TestCase]:
        """根据 schema 生成测试用例"""
        test_cases = []
        count = self.config.count

        for i in range(count):
            # 每个用例生成独立的 context，确保数据独立
            input_data = self.wrapper.generate(context={})

            test_cases.append(TestCase(
                id=self._generate_id(i),
                input_data=input_data,
                metadata={
                    "generator": "schema",
                    "wrapper": True,
                    "case_index": i
                }
            ))

        return test_cases