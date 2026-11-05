@echo off
echo ==============================================================
echo       Templegate Accounts Payable (AP) Automation Suite
echo ==============================================================
echo.
echo Launching Backend (FastAPI on Port 8000)...
start "AP Backend API (8000)" start_backend.bat
timeout /t 3 /nobreak >nul
echo Launching Frontend (Vite on Port 5173)...
start "AP Frontend UI (5173)" start_frontend.bat
echo.
echo AP Automation Platform is starting!
echo - API Docs: http://localhost:8000/docs
echo - Web App:  http://localhost:5173
echo ==============================================================
pause
