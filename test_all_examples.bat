@echo off
REM 测试所有示例配置
echo ========================================
echo 测试所有 STAgent 示例配置
echo ========================================
echo.

set PYTHON=D:\Anaconda\python.exe

echo [1/18] 测试 basic/hello.yaml
%PYTHON% -m stagent.cli --config examples/basic/hello.yaml > nul 2>&1
if %errorlevel% equ 0 (echo   ✓ PASS) else (echo   ✗ FAIL)

echo [2/18] 测试 basic/echo.yaml
%PYTHON% -m stagent.cli --config examples/basic/echo.yaml > nul 2>&1
if %errorlevel% equ 0 (echo   ✓ PASS) else (echo   ✗ FAIL)

echo [3/18] 测试 basic/counter.yaml
%PYTHON% -m stagent.cli --config examples/basic/counter.yaml > nul 2>&1
if %errorlevel% equ 0 (echo   ✓ PASS) else (echo   ✗ FAIL)

echo [4/18] 测试 basic/compare.yaml
%PYTHON% -m stagent.cli --config examples/basic/compare.yaml > nul 2>&1
if %errorlevel% equ 0 (echo   ✓ PASS) else (echo   ✗ FAIL)

echo [5/18] 测试 math/add.yaml
%PYTHON% -m stagent.cli --config examples/math/add.yaml > nul 2>&1
if %errorlevel% equ 0 (echo   ✓ PASS) else (echo   ✗ FAIL)

echo [6/18] 测试 math/divide.yaml
%PYTHON% -m stagent.cli --config examples/math/divide.yaml > nul 2>&1
if %errorlevel% equ 0 (echo   ✓ PASS) else (echo   ✗ FAIL)

echo [7/18] 测试 math/factorial.yaml
%PYTHON% -m stagent.cli --config examples/math/factorial.yaml > nul 2>&1
if %errorlevel% equ 0 (echo   ✓ PASS) else (echo   ✗ FAIL)

echo [8/18] 测试 math/gcd.yaml
%PYTHON% -m stagent.cli --config examples/math/gcd.yaml > nul 2>&1
if %errorlevel% equ 0 (echo   ✓ PASS) else (echo   ✗ FAIL)

echo [9/18] 测试 math/prime.yaml
%PYTHON% -m stagent.cli --config examples/math/prime.yaml > nul 2>&1
if %errorlevel% equ 0 (echo   ✓ PASS) else (echo   ✗ FAIL)

echo [10/18] 测试 string/reverse.yaml
%PYTHON% -m stagent.cli --config examples/string/reverse.yaml > nul 2>&1
if %errorlevel% equ 0 (echo   ✓ PASS) else (echo   ✗ FAIL)

echo [11/18] 测试 string/case.yaml
%PYTHON% -m stagent.cli --config examples/string/case.yaml > nul 2>&1
if %errorlevel% equ 0 (echo   ✓ PASS) else (echo   ✗ FAIL)

echo [12/18] 测试 string/strlen.yaml
%PYTHON% -m stagent.cli --config examples/string/strlen.yaml > nul 2>&1
if %errorlevel% equ 0 (echo   ✓ PASS) else (echo   ✗ FAIL)

echo [13/18] 测试 string/palindrome.yaml
%PYTHON% -m stagent.cli --config examples/string/palindrome.yaml > nul 2>&1
if %errorlevel% equ 0 (echo   ✓ PASS) else (echo   ✗ FAIL)

echo [14/18] 测试 file_io/cat.yaml
%PYTHON% -m stagent.cli --config examples/file_io/cat.yaml > nul 2>&1
if %errorlevel% equ 0 (echo   ✓ PASS) else (echo   ✗ FAIL)

echo [15/18] 测试 file_io/write.yaml
%PYTHON% -m stagent.cli --config examples/file_io/write.yaml > nul 2>&1
if %errorlevel% equ 0 (echo   ✓ PASS) else (echo   ✗ FAIL)

echo [16/18] 测试 file_io/wc.yaml
%PYTHON% -m stagent.cli --config examples/file_io/wc.yaml > nul 2>&1
if %errorlevel% equ 0 (echo   ✓ PASS) else (echo   ✗ FAIL)

echo [17/18] 测试 error_handling/validate.yaml
%PYTHON% -m stagent.cli --config examples/error_handling/validate.yaml > nul 2>&1
if %errorlevel% equ 0 (echo   ✓ PASS) else (echo   ✗ FAIL)

echo [18/18] 测试 error_handling/memory.yaml
%PYTHON% -m stagent.cli --config examples/error_handling/memory.yaml > nul 2>&1
if %errorlevel% equ 0 (echo   ✓ PASS) else (echo   ✗ FAIL)

echo.
echo ========================================
echo 所有测试完成！
echo ========================================
