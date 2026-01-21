@echo off
echo ========================================
echo  CAR RENTAL ERP - QUICK START
echo ========================================
echo.
echo Starting Backend and Frontend servers...
echo.

REM Lancer backend dans une nouvelle fenêtre
start "Backend Server" cmd /k "cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

REM Attendre 2 secondes
timeout /t 2 /nobreak >nul

REM Lancer frontend dans une nouvelle fenêtre
start "Frontend Server" cmd /k "cd frontend-new && npm run dev"

echo.
echo ========================================
echo  SERVERS STARTED!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo Frontend: http://localhost:5173
echo.
echo Press any key to stop all servers...
pause >nul

REM Arrêter les processus
taskkill /FI "WindowTitle eq Backend Server*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq Frontend Server*" /T /F >nul 2>&1

echo.
echo Servers stopped.
