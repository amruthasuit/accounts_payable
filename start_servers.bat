@echo off
echo Starting Accounts Payable Automation Platform...

start "AP Backend (FastAPI)" cmd /k "cd backend && C:\Users\shara\anaconda3\python.exe -m uvicorn app.main:app --reload --port 8000"
timeout /t 3 >nul

start "AP Frontend (Vite React)" cmd /k "cd frontend && npm run dev"
timeout /t 3 >nul

echo Both servers started!
echo Opening browser at http://localhost:5173
start http://localhost:5173
