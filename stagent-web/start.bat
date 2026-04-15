@echo off
chcp 65001 >nul 2>&1
echo ============================================
echo    STAgent Web - Start Script
echo ============================================
echo.

:: Check Python
D:\Anaconda\python.exe --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Please install Python first.
    pause
    exit /b 1
)

:: Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

:: Start Backend
echo [1/2] Starting Backend...
cd /d "%~dp0backend"
start "STAgent-Backend" cmd /k "title STAgent Backend && D:\Anaconda\python.exe -m uvicorn main:app --reload --port 8000"

:: Wait for backend
timeout /t 3 /nobreak >nul

:: Start Frontend
echo [2/2] Starting Frontend...
cd /d "%~dp0frontend"
start "STAgent-Frontend" cmd /k "title STAgent Frontend && npm run dev"

echo.
echo ============================================
echo    Startup Complete!
echo ============================================
echo.
echo    Backend: http://localhost:8000
echo    Frontend: http://localhost:3000
echo    API Docs: http://localhost:8000/docs
echo.
echo    Opening browser...
timeout /t 2 /nobreak >nul

start http://localhost:3000
