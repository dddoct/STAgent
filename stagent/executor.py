"""测试执行模块"""
import subprocess
import time
import os
from typing import List, Optional
from .models import TestCase, ExecutionResult, ExecutionStatus, TestResult, TestStatus
from .config import TargetConfig


class TestExecutor:
    """测试执行器"""

    def __init__(self, config: TargetConfig):
        self.config = config
        # Windows 默认用 GBK 编码读取控制台输出
        self.encoding = 'gbk' if os.name == 'nt' else 'utf-8'

    def _decode_output(self, data: bytes) -> str:
        """智能解码，尝试多种编码"""
        if not data:
            return ""

        # Windows: 优先用 UTF-8 解码（因为 MinGW gcc 通常输出 UTF-8）
        if os.name == 'nt':
            try:
                return data.decode('utf-8')
            except (UnicodeDecodeError, LookupError):
                pass

            try:
                return data.decode('gbk')
            except (UnicodeDecodeError, LookupError):
                pass
        else:
            # Linux/Mac: 优先用 UTF-8
            try:
                return data.decode('utf-8')
            except (UnicodeDecodeError, LookupError):
                pass

        # 最后手段：忽略错误
        return data.decode('utf-8', errors='replace')

    def execute(self, test_case: TestCase) -> ExecutionResult:
        """执行单个测试用例"""
        start_time = time.time()

        try:
            # 验证程序路径
            if not self.config.program:
                return ExecutionResult(
                    test_case_id=test_case.id,
                    stdout="",
                    stderr="未配置被测程序",
                    exit_code=-1,
                    duration=0,
                    status=ExecutionStatus.ERROR
                )

            # 规范化程序路径（支持相对路径）
            program_path = self.config.program
            if not os.path.isabs(program_path):
                # 相对路径转为绝对路径
                program_path = os.path.abspath(program_path)

            # 检查程序是否存在
            if not os.path.exists(program_path):
                return ExecutionResult(
                    test_case_id=test_case.id,
                    stdout="",
                    stderr=f"程序不存在: {program_path}",
                    exit_code=-1,
                    duration=0,
                    status=ExecutionStatus.ERROR
                )

            # 构建命令
            cmd = [program_path] + self.config.args

            # 检查是否需要将输入作为命令行参数
            # 如果 input_data 不包含换行符，且 metadata 中标记了 wrapper=True，则作为参数
            use_args = False
            if test_case.metadata.get("wrapper") and "\n" not in test_case.input_data:
                use_args = True
                # 将输入按空格分割为参数
                cmd.extend(test_case.input_data.split())

            # 先用二进制读取，再手动解码（兼容 Windows GBK）
            process = subprocess.Popen(
                cmd,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )

            try:
                # 如果使用参数模式，不传入 stdin
                stdin_data = None if use_args else test_case.input_data.encode(self.encoding)

                stdout_bytes, stderr_bytes = process.communicate(
                    input=stdin_data,
                    timeout=self.config.timeout
                )

                # 智能解码：尝试多种编码
                stdout = self._decode_output(stdout_bytes)
                stderr = self._decode_output(stderr_bytes)

                duration = time.time() - start_time
                exit_code = process.returncode

                # 判断执行状态
                if exit_code == 0:
                    status = ExecutionStatus.SUCCESS
                else:
                    status = ExecutionStatus.CRASH

                return ExecutionResult(
                    test_case_id=test_case.id,
                    stdout=stdout,
                    stderr=stderr,
                    exit_code=exit_code,
                    duration=duration,
                    status=status
                )

            except subprocess.TimeoutExpired:
                process.kill()
                try:
                    process.communicate(timeout=5)
                except subprocess.TimeoutExpired:
                    process.kill()
                duration = time.time() - start_time
                return ExecutionResult(
                    test_case_id=test_case.id,
                    stdout="",
                    stderr="执行超时",
                    exit_code=-1,
                    duration=duration,
                    status=ExecutionStatus.TIMEOUT
                )

        except Exception as e:
            duration = time.time() - start_time
            return ExecutionResult(
                test_case_id=test_case.id,
                stdout="",
                stderr=str(e),
                exit_code=-1,
                duration=duration,
                status=ExecutionStatus.ERROR
            )

    def execute_batch(self, test_cases: List[TestCase]) -> List[ExecutionResult]:
        """批量执行测试用例"""
        results = []
        for test_case in test_cases:
            result = self.execute(test_case)
            results.append(result)
        return results
