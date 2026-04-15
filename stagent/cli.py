"""命令行入口"""
import argparse
import logging
import os
import sys
from pathlib import Path

from .config import load_config, Config, TargetConfig, GenerationConfig
from .orchestrator import TestOrchestrator
from .models import TestCase


def setup_logging(level: str) -> None:
    """设置日志"""
    numeric_level = getattr(logging, level.upper(), None)
    if not isinstance(numeric_level, int):
        numeric_level = logging.INFO

    logging.basicConfig(
        level=numeric_level,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%H:%M:%S"
    )


def create_parser() -> argparse.ArgumentParser:
    """创建命令行参数解析器"""
    parser = argparse.ArgumentParser(
        description="STAgent - 软件测试智能体",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    parser.add_argument(
        "-c", "--config",
        default="config.yaml",
        help="配置文件路径 (默认: config.yaml)"
    )

    parser.add_argument(
        "-p", "--program",
        help="被测程序路径"
    )

    parser.add_argument(
        "-n", "--count",
        type=int,
        help="生成测试用例数量"
    )

    parser.add_argument(
        "-s", "--strategy",
        choices=["random", "boundary"],
        help="测试用例生成策略"
    )

    parser.add_argument(
        "--timeout",
        type=int,
        help="单个用例执行超时(秒)"
    )

    parser.add_argument(
        "-o", "--output",
        help="报告输出路径"
    )

    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="详细输出"
    )

    return parser


def merge_config(args: argparse.Namespace, config: Config) -> Config:
    """合并命令行参数到配置"""
    if args.program:
        config.target.program = args.program
    if args.count:
        config.generation.count = args.count
    if args.strategy:
        config.generation.strategy = args.strategy
    if args.timeout:
        config.target.timeout = args.timeout
    if args.output:
        config.output.report_path = args.output
    if args.verbose:
        config.output.log_level = "DEBUG"

    return config


def main() -> int:
    """主函数"""
    parser = create_parser()
    args = parser.parse_args()

    # 加载配置
    config_path = args.config
    if not os.path.exists(config_path):
        print(f"错误: 配置文件不存在: {config_path}")
        print("请创建 config.yaml 或指定正确的配置文件路径")
        return 1

    config = load_config(config_path)

    # 合并命令行参数
    config = merge_config(args, config)

    # 设置日志
    setup_logging(config.output.log_level)
    logger = logging.getLogger(__name__)

    # 验证被测程序
    if not config.target.program:
        logger.error("错误: 未指定被测程序")
        return 1

    if not os.path.exists(config.target.program):
        logger.error(f"错误: 被测程序不存在: {config.target.program}")
        return 1

    # 确保输出目录存在
    output_path = Path(config.output.report_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # 运行测试
    logger.info("=" * 50)
    logger.info("STAgent - 软件测试智能体")
    logger.info("=" * 50)
    logger.info(f"被测程序: {config.target.program}")
    wrapper_status = "启用" if config.wrapper.enabled else "关闭"
    logger.info(f"Wrapper 适配: {wrapper_status}")
    if config.wrapper.enabled:
        logger.info(f"  输入字段数: {len(config.wrapper.input_schema)}")
    logger.info(f"生成策略: {config.generation.strategy}")
    logger.info(f"用例数量: {config.generation.count}")
    logger.info(f"执行超时: {config.target.timeout}秒")
    logger.info("-" * 50)

    orchestrator = TestOrchestrator(config)
    report = orchestrator.run()

    # 保存报告
    orchestrator.analyzer.save_report(report, config.output.report_path)
    logger.info(f"报告已保存: {config.output.report_path}")

    # 打印摘要
    logger.info("=" * 50)
    logger.info("测试摘要")
    logger.info("=" * 50)
    logger.info(f"总用例数: {report.total}")
    logger.info(f"通过: {report.passed}")
    logger.info(f"失败: {report.failed}")
    logger.info(f"错误: {report.errors}")
    logger.info(f"通过率: {report.summary['pass_rate']}")
    logger.info(f"总耗时: {report.summary['total_duration']}s")

    # 返回退出码
    if report.failed > 0 or report.errors > 0:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
