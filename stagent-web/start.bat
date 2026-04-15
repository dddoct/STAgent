@echo off
chcp 65001 >nul
echo ============================================
echo    STAgent Web - 启动脚本
echo ============================================
echo.

:: 检查 Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 Python，请先安装 Python
    pause
    exit /b 1
)

:: 检查 Node
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

:: 启动后端
echo [1/2] 启动后端服务...
cd /d "%~dp0backend"
start "STAgent-Backend" cmd /c "title STAgent Backend && pip install fastapi uvicorn python-multipart pyyaml -q && python -m uvicorn main:app --reload --port 8000"

:: 等待后端启动
timeout /t 3 /nobreak >nul

:: 启动前端
echo [2/2] 启动前端服务...
cd /d "%~dp0frontend"
start "STAgent-Frontend" cmd /c "title STAgent Frontend && npm run dev"

echo.
echo ============================================
echo    启动完成！
echo ============================================
echo.
echo    后端: http://localhost:8000
echo    前端: http://localhost:3000
echo    API文档: http://localhost:8000/docs
echo.
echo    按任意键打开浏览器...
pause >nul

start http://localhost:3000
