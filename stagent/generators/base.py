"""测试用例生成器基类"""
from abc import ABC, abstractmethod
from typing import List
from ..models import TestCase
from ..config import GenerationConfig


class BaseGenerator(ABC):
    """测试用例生成器基类"""

    def __init__(self, config: GenerationConfig):
        self.config = config

    @abstractmethod
    def generate(self) -> List[TestCase]:
        """生成测试用例"""
        pass

    def _generate_id(self, index: int) -> str:
        """生成用例ID"""
        return f"TC_{index:04d}"
