@echo off
echo ========================================
echo  CAR RENTAL ERP - SCRIPTS MENU
echo ========================================
echo.
echo 1. Seed Database (Generate Test Data)
echo 2. Test API Endpoints
echo 3. Run Both (Seed then Test)
echo 4. Start Backend Server
echo 5. Exit
echo.
set /p choice="Select option (1-5): "

if "%choice%"=="1" goto seed
if "%choice%"=="2" goto test
if "%choice%"=="3" goto both
if "%choice%"=="4" goto server
if "%choice%"=="5" goto end

:seed
echo.
echo Running database seed script...
cd backend
python scripts\seed_data.py
pause
goto menu

:test
echo.
echo Running API tests...
cd backend
python scripts\test_api.py
pause
goto menu

:both
echo.
echo Running seed then test...
cd backend
python scripts\seed_data.py
echo.
echo Waiting 3 seconds before testing...
timeout /t 3
python scripts\test_api.py
pause
goto menu

:server
echo.
echo Starting backend server...
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
goto end

:menu
cls
goto start

:end
echo.
echo Goodbye!
