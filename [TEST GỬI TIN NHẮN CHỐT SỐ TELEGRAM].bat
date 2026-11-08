@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo =======================================================
echo   KIEM TRA GUI TIN NHAN CHOT SO G5.5 VE DIEN THOAI
echo =======================================================
python live_radar_scanner.py --test_telegram
echo.
pause

