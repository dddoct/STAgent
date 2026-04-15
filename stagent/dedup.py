"""用例去重模块"""
import hashlib
import re
from typing import List, Set, Dict, Any
from dataclasses import dataclass
from .models import TestCase


@dataclass
class DeduplicationConfig:
    """去重配置"""
    enabled: bool = True
    strategy: str = "hash"  # hash | equivalence | both
    normalize_numbers: bool = True  # 1,2,3 和 9,8,7 是否算等价
    ignore_order: bool = False  # 排序类程序忽略输入顺序差异


class TestCaseDeduplicator:
    """测试用例去重器"""

    def __init__(self, config: DeduplicationConfig = None):
        self.config = config or DeduplicationConfig()

    def deduplicate(self, cases: List[TestCase]) -> List[TestCase]:
        """去除重复用例"""
        if not self.config.enabled:
            return cases

        seen: Set[str] = set()
        result: List[TestCase] = []

        for case in cases:
            key = self._compute_key(case)
            if key not in seen:
                seen.add(key)
                result.append(case)

        removed = len(cases) - len(result)
        if removed > 0:
            print(f"[去重] 移除了 {removed} 个重复用例，剩余 {len(result)} 个")

        return result

    def _compute_key(self, case: TestCase) -> str:
        """计算用例的唯一标识"""
        input_data = case.input_data

        # 规范化
        if self.config.normalize_numbers:
            input_data = self._normalize_numbers(input_data)

        # 忽略顺序
        if self.config.ignore_order:
            input_data = self._normalize_order(input_data)

        # 计算哈希
        return hashlib.md5(input_data.encode()).hexdigest()

    def _normalize_numbers(self, text: str) -> str:
        """将数字替换为占位符，统一数量级"""
        # 保留数字个数信息，但统一格式
        def replace_number(match):
            num = int(match.group())
            if num == 0:
                return "ZERO"
            elif 1 <= num <= 9:
                return "D1"
            elif 10 <= num <= 99:
                return "D2"
            elif 100 <= num <= 999:
                return "D3"
            else:
                return "DX"

        return re.sub(r'-?\d+', replace_number, text)

    def _normalize_order(self, text: str) -> str:
        """忽略顺序，对数字序列排序后比较"""
        # 提取所有数字
        numbers = re.findall(r'-?\d+', text)
        # 排序
        sorted_numbers = sorted(numbers, key=lambda x: int(x))
        # 替换原文本中的数字序列
        sorted_text = text
        for orig, sorted_num in zip(numbers, sorted_numbers):
            sorted_text = sorted_text.replace(orig, sorted_num, 1)
        return sorted_text

    def find_duplicates(self, cases: List[TestCase]) -> Dict[str, List[TestCase]]:
        """找出所有重复的用例组"""
        groups: Dict[str, List[TestCase]] = {}

        for case in cases:
            key = self._compute_key(case)
            if key not in groups:
                groups[key] = []
            groups[key].append(case)

        # 只返回有重复的组
        return {k: v for k, v in groups.items() if len(v) > 1}


class EquivalenceGrouper:
    """等价类分组器 - 将用例按等价性分组"""

    def __init__(self):
        self.groups: List[List[TestCase]] = []

    def group(self, cases: List[TestCase]) -> List[List[TestCase]]:
        """按等价性分组"""
        representatives: List[tuple] = []  # (key, group)
        groups: List[List[TestCase]] = []

        for case in cases:
            key = self._compute_equivalence_key(case)

            # 查找等价组
            found = False
            for i, (rep_key, _) in enumerate(representatives):
                if self._are_equivalent(key, rep_key):
                    groups[i].append(case)
                    found = True
                    break

            if not found:
                representatives.append((key, case))
                groups.append([case])

        self.groups = groups
        return groups

    def _compute_equivalence_key(self, case: TestCase) -> tuple:
        """计算等价性标识"""
        lines = case.input_data.strip().split('\n')

        # 提取数字个数
        num_count = len(re.findall(r'-?\d+', case.input_data))

        # 判断输入类型
        if num_count == 0:
            input_type = "empty"
        elif num_count == 1:
            input_type = "single"
        elif self._is_sorted_pattern(case.input_data):
            input_type = "already_sorted"
        elif self._is_reverse_pattern(case.input_data):
            input_type = "reverse_sorted"
        elif self._is_random_pattern(case.input_data):
            input_type = "random"
        else:
            input_type = "unknown"

        return (input_type, num_count)

    def _is_sorted_pattern(self, text: str) -> bool:
        """是否已排序"""
        numbers = [int(n) for n in re.findall(r'-?\d+', text)]
        if len(numbers) < 2:
            return False
        return numbers == sorted(numbers)

    def _is_reverse_pattern(self, text: str) -> bool:
        """是否逆序"""
        numbers = [int(n) for n in re.findall(r'-?\d+', text)]
        if len(numbers) < 2:
            return False
        return numbers == sorted(numbers, reverse=True)

    def _is_random_pattern(self, text: str) -> bool:
        """是否随机分布"""
        numbers = [int(n) for n in re.findall(r'-?\d+', text)]
        return len(numbers) >= 3 and not self._is_sorted_pattern(text)

    def _are_equivalent(self, key1: tuple, key2: tuple) -> bool:
        """判断两组是否等价"""
        # 类型相同且数量级相同
        return key1[0] == key2[0] and key1[1] == key2[1]

    def get_representatives(self) -> List[TestCase]:
        """获取每个等价类的代表用例"""
        return [group[0] for group in self.groups]

    def get_coverage_recommendation(self) -> List[str]:
        """获取覆盖率建议 - 应该测试哪些类型"""
        recommendations = []
        covered_types = set()

        for group in self.groups:
            key = self._compute_equivalence_key(group[0])
            covered_types.add(key[0])

        all_types = {"empty", "single", "already_sorted", "reverse_sorted", "random", "unknown"}
        missing = all_types - covered_types

        if missing:
            recommendations.append(f"建议补充测试类型: {', '.join(missing)}")

        return recommendations
