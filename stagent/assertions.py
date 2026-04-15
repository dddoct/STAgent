"""断言系统 - 定义各种断言类型"""
import re
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional, List
from dataclasses import dataclass


@dataclass
class AssertionResult:
    """断言结果"""
    passed: bool
    message: str
    actual: Any = None
    expected: Any = None


class Assertion(ABC):
    """断言基类"""

    def __init__(self, name: str = ""):
        self.name = name or self.__class__.__name__

    @abstractmethod
    def check(self, output: str, context: Dict[str, Any] = None) -> AssertionResult:
        """执行断言检查"""
        pass

    def to_config(self) -> Dict[str, Any]:
        """导出为配置"""
        return {"type": self.type_name()}

    @staticmethod
    def type_name() -> str:
        return "base"


class ExactMatchAssertion(Assertion):
    """精确匹配断言"""

    def __init__(self, expected: str):
        super().__init__("精确匹配")
        self.expected = expected

    def check(self, output: str, context: Dict[str, Any] = None) -> AssertionResult:
        if output == self.expected:
            return AssertionResult(
                passed=True,
                message="精确匹配成功",
                actual=output,
                expected=self.expected
            )
        return AssertionResult(
            passed=False,
            message="输出不匹配",
            actual=output[:200] if output else "",
            expected=self.expected
        )

    @staticmethod
    def type_name() -> str:
        return "exact"

    def to_config(self) -> Dict[str, Any]:
        return {"type": "exact", "expected": self.expected}


class FuzzyMatchAssertion(Assertion):
    """模糊匹配断言 - 忽略空白差异"""

    def __init__(self, expected: str):
        super().__init__("模糊匹配")
        self.expected = expected

    def check(self, output: str, context: Dict[str, Any] = None) -> AssertionResult:
        norm_output = ' '.join(output.split())
        norm_expected = ' '.join(self.expected.split())

        if norm_output == norm_expected:
            return AssertionResult(
                passed=True,
                message="模糊匹配成功",
                actual=output,
                expected=self.expected
            )
        return AssertionResult(
            passed=False,
            message="模糊匹配失败",
            actual=norm_output[:200],
            expected=norm_expected
        )

    @staticmethod
    def type_name() -> str:
        return "fuzzy"

    def to_config(self) -> Dict[str, Any]:
        return {"type": "fuzzy", "expected": self.expected}


class RegexMatchAssertion(Assertion):
    """正则表达式匹配断言"""

    def __init__(self, pattern: str, flags: int = 0):
        super().__init__("正则匹配")
        self.pattern = pattern
        self.compiled = re.compile(pattern, flags)

    def check(self, output: str, context: Dict[str, Any] = None) -> AssertionResult:
        match = self.compiled.search(output)
        if match:
            return AssertionResult(
                passed=True,
                message=f"正则匹配成功: {match.group()}",
                actual=match.group(),
                expected=self.pattern
            )
        return AssertionResult(
            passed=False,
            message=f"正则 '{self.pattern}' 未匹配到任何内容",
            actual=output[:200] if output else "",
            expected=self.pattern
        )

    @staticmethod
    def type_name() -> str:
        return "regex"

    def to_config(self) -> Dict[str, Any]:
        return {"type": "regex", "pattern": self.pattern}


class ContainsAssertion(Assertion):
    """包含子串断言"""

    def __init__(self, substring: str):
        super().__init__("包含子串")
        self.substring = substring

    def check(self, output: str, context: Dict[str, Any] = None) -> AssertionResult:
        if self.substring in output:
            return AssertionResult(
                passed=True,
                message=f"包含子串: '{self.substring}'",
                actual=self.substring,
                expected=self.substring
            )
        return AssertionResult(
            passed=False,
            message=f"输出不包含: '{self.substring}'",
            actual=output[:200] if output else "",
            expected=self.substring
        )

    @staticmethod
    def type_name() -> str:
        return "contains"

    def to_config(self) -> Dict[str, Any]:
        return {"type": "contains", "substring": self.substring}


class NumericRangeAssertion(Assertion):
    """数值范围断言"""

    def __init__(self, min_val: float = None, max_val: float = None):
        super().__init__("数值范围")
        self.min_val = min_val
        self.max_val = max_val

    def check(self, output: str, context: Dict[str, Any] = None) -> AssertionResult:
        try:
            numbers = re.findall(r'-?\d+\.?\d*', output)
            if not numbers:
                return AssertionResult(
                    passed=False,
                    message="输出中未找到数字",
                    actual=output[:200],
                    expected=f"范围 [{self.min_val}, {self.max_val}]"
                )

            value = float(numbers[0])
            in_range = True
            if self.min_val is not None and value < self.min_val:
                in_range = False
            if self.max_val is not None and value > self.max_val:
                in_range = False

            if in_range:
                return AssertionResult(
                    passed=True,
                    message=f"数值 {value} 在范围内",
                    actual=value,
                    expected=f"[{self.min_val}, {self.max_val}]"
                )
            return AssertionResult(
                passed=False,
                message=f"数值 {value} 不在范围内",
                actual=value,
                expected=f"[{self.min_val}, {self.max_val}]"
            )
        except (ValueError, IndexError) as e:
            return AssertionResult(
                passed=False,
                message=f"无法解析数值: {e}",
                actual=output[:200],
                expected=f"[{self.min_val}, {self.max_val}]"
            )

    @staticmethod
    def type_name() -> str:
        return "numeric_range"

    def to_config(self) -> Dict[str, Any]:
        config = {"type": "numeric_range"}
        if self.min_val is not None:
            config["min"] = self.min_val
        if self.max_val is not None:
            config["max"] = self.max_val
        return config


class ExitCodeAssertion(Assertion):
    """退出码断言"""

    def __init__(self, expected_code: int | List[int]):
        super().__init__("退出码")
        # 支持单个整数或整数列表
        if isinstance(expected_code, list):
            self.expected_codes = expected_code
        else:
            self.expected_codes = [expected_code]

    def check(self, output: str, context: Dict[str, Any] = None) -> AssertionResult:
        actual_code = context.get("exit_code", 0) if context else 0
        if actual_code in self.expected_codes:
            return AssertionResult(
                passed=True,
                message=f"退出码匹配: {actual_code}",
                actual=actual_code,
                expected=self.expected_codes
            )
        return AssertionResult(
            passed=False,
            message=f"退出码不匹配: 期望 {self.expected_codes}, 实际 {actual_code}",
            actual=actual_code,
            expected=self.expected_codes
        )

    @staticmethod
    def type_name() -> str:
        return "exit_code"

    def to_config(self) -> Dict[str, Any]:
        return {"type": "exit_code", "expected": self.expected_code}


class NoErrorAssertion(Assertion):
    """无错误断言 - 验证 stderr 为空"""

    def __init__(self):
        super().__init__("无错误")

    def check(self, output: str, context: Dict[str, Any] = None) -> AssertionResult:
        stderr = context.get("stderr", "") if context else ""
        error_keywords = ["error", "Error", "ERROR", "fail", "Fail", "exception", "Exception"]
        has_error = any(keyword in stderr for keyword in error_keywords)

        if not stderr or not has_error:
            return AssertionResult(
                passed=True,
                message="无错误信息",
                actual=stderr[:200] if stderr else "",
                expected=""
            )
        return AssertionResult(
            passed=False,
            message="检测到错误信息",
            actual=stderr[:200],
            expected="(无错误)"
        )

    @staticmethod
    def type_name() -> str:
        return "no_error"

    def to_config(self) -> Dict[str, Any]:
        return {"type": "no_error"}


class AssertionFactory:
    """断言工厂"""

    _registry: Dict[str, type] = {}

    @classmethod
    def register(cls, name: str, assertion_class: type):
        cls._registry[name] = assertion_class

    @classmethod
    def create(cls, config: Dict[str, Any]) -> Assertion:
        """从配置创建断言"""
        assertion_type = config.get("type", "").lower()

        if assertion_type == "exact":
            return ExactMatchAssertion(config.get("expected", ""))
        elif assertion_type == "fuzzy":
            return FuzzyMatchAssertion(config.get("expected", ""))
        elif assertion_type == "regex":
            return RegexMatchAssertion(config.get("pattern", ""))
        elif assertion_type == "contains":
            return ContainsAssertion(config.get("substring", ""))
        elif assertion_type == "numeric_range":
            return NumericRangeAssertion(
                min_val=config.get("min"),
                max_val=config.get("max")
            )
        elif assertion_type == "exit_code":
            return ExitCodeAssertion(config.get("expected", 0))
        elif assertion_type == "no_error":
            return NoErrorAssertion()
        else:
            raise ValueError(f"未知的断言类型: {assertion_type}")

    @classmethod
    def from_list(cls, configs: List[Dict[str, Any]]) -> List[Assertion]:
        """从配置列表创建断言列表"""
        return [cls.create(cfg) for cfg in configs]
