"""随机测试用例生成器"""
import random
import string
from typing import List
from .base import BaseGenerator
from ..models import TestCase
from ..config import GenerationConfig


class RandomGenerator(BaseGenerator):
    """随机测试用例生成器"""

    def generate(self) -> List[TestCase]:
        """生成随机测试用例"""
        test_cases = []
        count = self.config.count
        max_size = self.config.max_input_size

        for i in range(count):
            # 随机决定输入类型
            input_type = random.choice(["text", "numbers", "mixed"])

            if input_type == "text":
                # 随机文本
                length = random.randint(1, min(max_size, 256))
                input_data = ''.join(
                    random.choices(string.ascii_letters + string.digits, k=length)
                )
            elif input_type == "numbers":
                # 随机数字序列
                length = random.randint(1, min(max_size // 2, 50))
                numbers = [str(random.randint(0, 999)) for _ in range(length)]
                input_data = '\n'.join(numbers)
            else:
                # 混合内容
                length = random.randint(1, min(max_size, 128))
                input_data = ''.join(
                    random.choices(string.ascii_letters + string.digits + " \n\t", k=length)
                )

            test_cases.append(TestCase(
                id=self._generate_id(i),
                input_data=input_data,
                metadata={"generator": "random", "input_type": input_type}
            ))

        return test_cases
