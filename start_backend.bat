@echo off
echo Starting AP Automation FastAPI Backend on http://localhost:8000 ...
cd backend
if exist "C:\Users\shara\anaconda3\python.exe" (
    "C:\Users\shara\anaconda3\python.exe" -m uvicorn app.main:app --reload --port 8000
) else (
    python -m uvicorn app.main:app --reload --port 8000
)
pause
