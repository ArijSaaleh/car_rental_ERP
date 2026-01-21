@echo off
cd /d "C:\Users\Arij\Desktop\Car Rental\CR\backend"
call "C:\Users\Arij\Desktop\Car Rental\CR\.venv\Scripts\activate.bat"
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
pause
