"""测试用例生成器工厂"""
from ..config import Config, GenerationConfig
from ..wrapper import Wrapper
from .base import BaseGenerator
from .random_gen import RandomGenerator
from .boundary_gen import BoundaryGenerator
from .schema_gen import SchemaGenerator


def create_generator(config: Config) -> BaseGenerator:
    """根据配置创建生成器"""
    gen_config = config.generation
    strategy = gen_config.strategy.lower()

    # 如果启用了 wrapper，使用 schema 生成器
    if config.wrapper.enabled and config.wrapper.input_schema:
        wrapper = Wrapper.from_config(
            config.wrapper.get_schema_config(),
            mode=config.wrapper.mode
        )
        return SchemaGenerator(gen_config, wrapper)

    generators = {
        "random": RandomGenerator,
        "boundary": BoundaryGenerator,
    }

    generator_class = generators.get(strategy)
    if generator_class is None:
        raise ValueError(f"未知的生成策略: {strategy}，支持的策略: {list(generators.keys())}")

    return generator_class(gen_config)
