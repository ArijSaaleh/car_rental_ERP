@echo off
echo ========================================
echo  CAR RENTAL ERP - SETUP SCRIPT
echo ========================================
echo.
echo This script will install all dependencies
echo.

:backend
echo [1/2] Installing Backend Dependencies...
cd backend
pip install httpx
echo.
echo Backend dependencies installed!
echo.

:frontend
echo [2/2] Installing Frontend Dependencies...
cd ..\frontend-new
call npm install
echo.
echo Frontend dependencies installed!
echo.

:finish
echo ========================================
echo  SETUP COMPLETE!
echo ========================================
echo.
echo You can now:
echo  - Run backend: cd backend ^&^& python -m uvicorn app.main:app --reload
echo  - Run frontend: cd frontend-new ^&^& npm run dev
echo  - Use scripts: run_scripts.bat
echo.
pause
