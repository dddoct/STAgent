"""配置加载模块"""
import os
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
import yaml


@dataclass
class TargetConfig:
    """被测程序配置"""
    program: str = ""
    args: List[str] = field(default_factory=list)
    timeout: int = 30


@dataclass
class InputFieldConfig:
    """输入字段配置"""
    name: str = ""
    type: str = "int"
    range_min: Optional[int] = None
    range_max: Optional[int] = None
    range: Optional[List[int]] = None
    count_from: Optional[str] = None
    count_fixed: Optional[int] = None
    separator: str = " "
    choices: Optional[List[str]] = None
    length_min: Optional[int] = None
    length_max: Optional[int] = None


@dataclass
class WrapperConfig:
    """Wrapper 配置"""
    enabled: bool = False
    mode: str = "stdin"  # stdin | args
    input_schema: List[Dict[str, Any]] = field(default_factory=list)

    def get_schema_config(self) -> List[Dict[str, Any]]:
        return self.input_schema


@dataclass
class GenerationConfig:
    """用例生成配置"""
    strategy: str = "random"
    count: int = 10
    max_input_size: int = 1024


@dataclass
class CaseConfig:
    """单个用例配置 - 用例与断言绑定"""
    input: str = ""
    input_ref: Optional[str] = None  # 引用 wrapper 字段生成
    assertions: List[Dict[str, Any]] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class SuiteConfig:
    """测试套件配置"""
    name: str = "default"
    cases: List[CaseConfig] = field(default_factory=list)


@dataclass
class DeduplicationConfig:
    """用例去重配置"""
    enabled: bool = True
    strategy: str = "hash"  # hash | equivalence | both
    normalize_numbers: bool = True  # 数字规范化
    ignore_order: bool = False  # 忽略输入顺序


@dataclass
class CoverageConfig:
    """覆盖率统计配置"""
    enabled: bool = False
    source_file: Optional[str] = None  # 源码文件路径
    compile_with_coverage: bool = True  # 是否重新编译


@dataclass
class AnalysisConfig:
    """结果分析配置"""
    compare_mode: str = "exact"
    report_format: str = "json"
    default_assertions: List[Dict[str, Any]] = field(default_factory=list)  # 全局默认断言
    deduplication: DeduplicationConfig = field(default_factory=DeduplicationConfig)
    coverage: CoverageConfig = field(default_factory=CoverageConfig)


@dataclass
class OutputConfig:
    """输出配置"""
    report_path: str = "./results/report.json"
    log_level: str = "INFO"


@dataclass
class Config:
    """全局配置"""
    target: TargetConfig = field(default_factory=TargetConfig)
    wrapper: WrapperConfig = field(default_factory=WrapperConfig)
    generation: GenerationConfig = field(default_factory=GenerationConfig)
    suite: Optional[SuiteConfig] = field(default_factory=None)  # 预设用例套件
    analysis: AnalysisConfig = field(default_factory=AnalysisConfig)
    output: OutputConfig = field(default_factory=OutputConfig)


def load_config(path: str) -> Config:
    """从 YAML 文件加载配置"""
    if not os.path.exists(path):
        raise FileNotFoundError(f"配置文件不存在: {path}")

    with open(path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    # 加载 wrapper 配置
    wrapper_data = data.get("wrapper", {})
    wrapper_cfg = WrapperConfig(
        enabled=wrapper_data.get("enabled", False),
        mode=wrapper_data.get("mode", "stdin"),
        input_schema=wrapper_data.get("schema", [])
    )

    # 加载 suite 配置（预设用例）
    suite_data = data.get("suite", {})
    suite_cases = []
    for case_data in suite_data.get("cases", []):
        case = CaseConfig(
            input=case_data.get("input", ""),
            input_ref=case_data.get("input_ref"),
            assertions=case_data.get("assertions", []),
            metadata=case_data.get("metadata", {})
        )
        suite_cases.append(case)
    suite_cfg = SuiteConfig(
        name=suite_data.get("name", "default"),
        cases=suite_cases
    ) if suite_data else None

    # 加载 analysis 配置
    analysis_data = data.get("analysis", {})

    # 去重配置
    dedup_data = analysis_data.get("deduplication", {})
    dedup_cfg = DeduplicationConfig(
        enabled=dedup_data.get("enabled", True),
        strategy=dedup_data.get("strategy", "hash"),
        normalize_numbers=dedup_data.get("normalize_numbers", True),
        ignore_order=dedup_data.get("ignore_order", False)
    )

    # 覆盖率配置
    cov_data = analysis_data.get("coverage", {})
    cov_cfg = CoverageConfig(
        enabled=cov_data.get("enabled", False),
        source_file=cov_data.get("source_file"),
        compile_with_coverage=cov_data.get("compile_with_coverage", True)
    )

    ana_cfg = AnalysisConfig(
        compare_mode=analysis_data.get("compare_mode", "exact"),
        report_format=analysis_data.get("report_format", "json"),
        default_assertions=analysis_data.get("default_assertions", []),
        deduplication=dedup_cfg,
        coverage=cov_cfg
    )

    target_cfg = TargetConfig(**data.get("target", {}))
    gen_cfg = GenerationConfig(**data.get("generation", {}))
    out_cfg = OutputConfig(**data.get("output", {}))

    return Config(
        target=target_cfg,
        wrapper=wrapper_cfg,
        generation=gen_cfg,
        suite=suite_cfg if suite_cases else None,
        analysis=ana_cfg,
        output=out_cfg,
    )


def save_config(config: Config, path: str) -> None:
    """保存配置到 YAML 文件"""
    # 处理 wrapper schema
    schema_data = []
    for field_cfg in config.wrapper.input_schema:
        cleaned = {k: v for k, v in field_cfg.items() if v is not None}
        schema_data.append(cleaned)

    # 处理 suite 配置
    suite_data = None
    if config.suite and config.suite.cases:
        suite_data = {
            "name": config.suite.name,
            "cases": [
                {
                    "input": c.input,
                    "input_ref": c.input_ref,
                    "assertions": c.assertions,
                    "metadata": c.metadata
                }
                for c in config.suite.cases
            ]
        }

    data = {
        "target": {
            "program": config.target.program,
            "args": config.target.args,
            "timeout": config.target.timeout,
        },
        "wrapper": {
            "enabled": config.wrapper.enabled,
            "mode": config.wrapper.mode,
            "schema": schema_data,
        },
        "generation": {
            "strategy": config.generation.strategy,
            "count": config.generation.count,
            "max_input_size": config.generation.max_input_size,
        },
        "suite": suite_data,
        "analysis": {
            "compare_mode": config.analysis.compare_mode,
            "report_format": config.analysis.report_format,
            "default_assertions": config.analysis.default_assertions,
            "deduplication": {
                "enabled": config.analysis.deduplication.enabled,
                "strategy": config.analysis.deduplication.strategy,
                "normalize_numbers": config.analysis.deduplication.normalize_numbers,
                "ignore_order": config.analysis.deduplication.ignore_order,
            },
            "coverage": {
                "enabled": config.analysis.coverage.enabled,
                "source_file": config.analysis.coverage.source_file,
                "compile_with_coverage": config.analysis.coverage.compile_with_coverage,
            },
        },
        "output": {
            "report_path": config.output.report_path,
            "log_level": config.output.log_level,
        },
    }
    with open(path, "w", encoding="utf-8") as f:
        yaml.dump(data, f, allow_unicode=True)
