"""边界值测试用例生成器"""
from typing import List
from .base import BaseGenerator
from ..models import TestCase
from ..config import GenerationConfig


class BoundaryGenerator(BaseGenerator):
    """边界值测试用例生成器"""

    def generate(self) -> List[TestCase]:
        """生成边界值测试用例"""
        test_cases = []
        max_size = self.config.max_input_size

        # 常见边界值
        boundaries = [
            "",  # 空输入
            "0",  # 最小数字
            "1",
            "-1",  # 负数
            "127",  # 单字节边界
            "128",
            "255",  # 单字节上限
            "256",
            "32767",  # 16位正整数上限
            "32768",
            "-32768",
            "-32767",
            "65535",  # 16位上限
            "2147483647",  # 32位整数上限
            "-2147483648",  # 32位整数下限
        ]

        # 字符串边界
        string_boundaries = [
            "a",  # 单字符
            "A",
            "\t",  # 特殊空白字符
            "\n",
            " " * 10,  # 多个空格
            "a" * 100,  # 较长字符串
            "a" * (max_size - 1),  # 最大长度-1
            "a" * max_size,  # 最大长度
            "a" * (max_size + 1),  # 超过最大长度
        ]

        index = 0

        # 添加数值边界
        for value in boundaries:
            test_cases.append(TestCase(
                id=self._generate_id(index),
                input_data=value,
                metadata={"generator": "boundary", "type": "number", "value": value}
            ))
            index += 1

        # 添加字符串边界
        for value in string_boundaries:
            test_cases.append(TestCase(
                id=self._generate_id(index),
                input_data=value,
                metadata={"generator": "boundary", "type": "string", "length": len(value)}
            ))
            index += 1

        # 如果配置的数量更多，补充随机边界值
        while len(test_cases) < self.config.count:
            extra_values = [
                str(i) for i in [
                    0, 1, 2, 10, 100, 1000, -1, -100,
                    max_size, max_size - 1, max_size + 1
                ]
            ]
            for value in extra_values:
                if len(test_cases) >= self.config.count:
                    break
                test_cases.append(TestCase(
                    id=self._generate_id(index),
                    input_data=value,
                    metadata={"generator": "boundary", "type": "extra", "value": value}
                ))
                index += 1

        return test_cases[:self.config.count]
