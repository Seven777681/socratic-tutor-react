@echo off
setlocal
cd /d "%~dp0"
set "BACKEND_DIR=%~dp0socratic_backend"
set "BACKEND_PYTHON=%BACKEND_DIR%\.venv\Scripts\python.exe"

if not exist "%BACKEND_PYTHON%" (
  echo Python backend environment was not found at:
  echo %BACKEND_PYTHON%
  echo Run the backend setup steps in socratic_backend\README.md first.
  exit /b 1
)

echo Starting Socratic Tutor backend on http://127.0.0.1:8001...
start "Socratic Tutor Backend" /B /D "%BACKEND_DIR%" "%BACKEND_PYTHON%" -m uvicorn server:app --port 8001

echo Starting Next.js frontend on http://localhost:3000...
"C:\Program Files\npm.cmd" run dev -- -p 3000
