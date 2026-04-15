"""数据模型定义"""
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, Dict, Any, List
from .assertions import Assertion, AssertionResult


class ExecutionStatus(Enum):
    """执行状态"""
    SUCCESS = "success"
    TIMEOUT = "timeout"
    CRASH = "crash"
    ERROR = "error"


class TestStatus(Enum):
    """测试结果状态"""
    PASS = "pass"
    FAIL = "fail"
    ERROR = "error"


@dataclass
class TestCase:
    """测试用例"""
    id: str
    input_data: str
    expected_output: Optional[str] = None
    assertions: List[Dict[str, Any]] = field(default_factory=list)  # 断言配置列表
    metadata: Dict[str, Any] = field(default_factory=dict)

    def get_assertions(self) -> List[Assertion]:
        """获取断言实例列表"""
        from .assertions import AssertionFactory
        return AssertionFactory.from_list(self.assertions)


@dataclass
class ExecutionResult:
    """程序执行结果"""
    test_case_id: str
    stdout: str
    stderr: str
    exit_code: int
    duration: float  # 秒
    status: ExecutionStatus


@dataclass
class AssertionTestResult:
    """单条断言的执行结果"""
    assertion_type: str
    passed: bool
    message: str
    actual: Any = None
    expected: Any = None


@dataclass
class TestResult:
    """测试结果"""
    test_case_id: str
    passed: bool
    execution: ExecutionResult
    reason: Optional[str] = None
    assertion_results: List[AssertionTestResult] = field(default_factory=list)  # 多断言结果

    def all_assertions_passed(self) -> bool:
        """所有断言是否都通过"""
        if not self.assertion_results:
            return self.passed
        return all(r.passed for r in self.assertion_results)

    def get_failed_assertions(self) -> List[AssertionTestResult]:
        """获取失败的断言列表"""
        return [r for r in self.assertion_results if not r.passed]


@dataclass
class TestReport:
    """测试报告"""
    total: int
    passed: int
    failed: int
    errors: int
    results: List[Dict[str, Any]] = field(default_factory=list)
    summary: Dict[str, Any] = field(default_factory=dict)


@dataclass
class TestSuite:
    """测试套件 - 用例+断言的绑定集合"""
    name: str = "default"
    cases: List[TestCase] = field(default_factory=list)

    def add_case(self, case: TestCase) -> None:
        """添加测试用例"""
        self.cases.append(case)

    def __len__(self) -> int:
        return len(self.cases)
