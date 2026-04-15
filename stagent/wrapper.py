"""Wrapper 模块 - 结构化输入适配器"""
import random
import string
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from enum import Enum


class FieldType(Enum):
    """字段类型"""
    INT = "int"
    FLOAT = "float"
    STRING = "string"
    LIST_INT = "list[int]"
    LIST_FLOAT = "list[float]"
    LIST_STRING = "list[string]"
    CHOICE = "choice"


@dataclass
class InputField:
    """输入字段定义"""
    name: str
    type: str = "int"
    range_min: Optional[int] = None
    range_max: Optional[int] = None
    count_from: Optional[str] = None  # 引用其他字段的数量
    count_fixed: Optional[int] = None  # 固定数量
    separator: str = " "  # 多值分隔符
    choices: Optional[List[str]] = None  # 选择列表
    length_min: Optional[int] = None  # 字符串长度范围
    length_max: Optional[int] = None


@dataclass
class InputSchema:
    """输入结构模式"""
    fields: List[InputField] = field(default_factory=list)
    mode: str = "stdin"  # stdin | args


class Wrapper:
    """结构化输入适配器"""

    def __init__(self, schema: InputSchema):
        self.schema = schema

    def generate(self, context: Dict[str, Any] = None) -> str:
        """根据 schema 生成符合格式的输入"""
        if context is None:
            context = {}

        values = []
        for field_def in self.schema.fields:
            value = self._generate_field(field_def, context)
            values.append(value)

        # 根据模式返回不同格式
        if self.schema.mode == "args":
            return " ".join(values)  # 命令行参数格式
        else:
            return "\n".join(values)  # stdin 格式

    def _generate_field(self, field: InputField, context: Dict[str, Any]) -> str:
        """生成单个字段的值"""
        field_type = field.type.lower()

        if field_type == "int":
            return self._generate_int(field, context)
        elif field_type == "float":
            return self._generate_float(field, context)
        elif field_type == "string":
            return self._generate_string(field, context)
        elif field_type in ("list[int]", "list[float]", "list[string]"):
            return self._generate_list(field, field_type, context)
        elif field_type == "choice":
            return self._generate_choice(field)
        else:
            raise ValueError(f"不支持的字段类型: {field.type}")

    def _generate_int(self, field: InputField, context: Dict[str, Any]) -> str:
        """生成整数"""
        min_val = field.range_min if field.range_min is not None else -1000
        max_val = field.range_max if field.range_max is not None else 1000
        value = random.randint(min_val, max_val)
        context[field.name] = value
        return str(value)

    def _generate_float(self, field: InputField, context: Dict[str, Any]) -> str:
        """生成浮点数"""
        min_val = field.range_min if field.range_min is not None else -1000.0
        max_val = field.range_max if field.range_max is not None else 1000.0
        value = random.uniform(min_val, max_val)
        context[field.name] = value
        return f"{value:.2f}"

    def _generate_string(self, field: InputField, context: Dict[str, Any]) -> str:
        """生成字符串"""
        # 如果有 choices/values，从中选择
        if field.choices:
            value = random.choice(field.choices)
            context[field.name] = value
            return value

        # 否则生成随机字符串
        min_len = field.length_min if field.length_min is not None else 1
        max_len = field.length_max if field.length_max is not None else 20
        length = random.randint(min_len, max_len)
        chars = string.ascii_letters + string.digits
        value = ''.join(random.choices(chars, k=length))
        context[field.name] = value
        return value

    def _generate_list(self, field: InputField, field_type: str, context: Dict[str, Any]) -> str:
        """生成列表（数字序列）"""
        # 确定数量
        if field.count_fixed is not None:
            count = field.count_fixed
        elif field.count_from is not None:
            count = context.get(field.count_from, 5)
        else:
            count = random.randint(1, 10)

        # 根据元素类型生成
        if field_type == "list[int]":
            min_val = field.range_min if field.range_min is not None else -1000
            max_val = field.range_max if field.range_max is not None else 1000
            values = [str(random.randint(min_val, max_val)) for _ in range(count)]
        elif field_type == "list[float]":
            min_val = field.range_min if field.range_min is not None else -1000.0
            max_val = field.range_max if field.range_max is not None else 1000.0
            values = [f"{random.uniform(min_val, max_val):.2f}" for _ in range(count)]
        else:  # list[string]
            min_len = field.length_min if field.length_min is not None else 1
            max_len = field.length_max if field.length_max is not None else 10
            chars = string.ascii_letters + string.digits
            values = []
            for _ in range(count):
                length = random.randint(min_len, max_len)
                values.append(''.join(random.choices(chars, k=length)))

        return field.separator.join(values)

    def _generate_choice(self, field: InputField) -> str:
        """从选项中选择"""
        if not field.choices:
            return ""
        return random.choice(field.choices)

    @staticmethod
    def from_config(schema_config: List[Dict[str, Any]], mode: str = "stdin") -> "Wrapper":
        """从配置创建 Wrapper"""
        fields = []
        for item in schema_config:
            # 处理 range: [min, max] 格式
            range_min = item.get("range_min")
            range_max = item.get("range_max")
            if item.get("range"):
                range_min = item["range"][0]
                range_max = item["range"][1]

            # 处理 values 列表（转换为 choices）
            choices = item.get("choices") or item.get("values")

            field = InputField(
                name=item.get("name", ""),
                type=item.get("type", "int"),
                range_min=range_min,
                range_max=range_max,
                count_from=item.get("count_from"),
                count_fixed=item.get("count_fixed"),
                separator=item.get("separator", " "),
                choices=choices,
                length_min=item.get("length_min"),
                length_max=item.get("length_max"),
            )
            fields.append(field)

        return Wrapper(InputSchema(fields=fields, mode=mode))
