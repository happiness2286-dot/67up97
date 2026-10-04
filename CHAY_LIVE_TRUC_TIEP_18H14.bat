@echo off
chcp 65001 >nul
title [XSMB LIVE RADAR 2026] - QUET DONG BO TRUC TIEP
cd /d "%~dp0"
color 0B

echo =====================================================================
echo    HE THONG XSMB AI 67UP97 - QUET TRUC TIEP DONG BO LIVE VOI DAI QUAY
echo    Khung gio quay thuong: 18h14 - 18h35 hang ngay
echo    Tu dong chot khoa khi xong G5 (18h24) va day len GitHub/Mini App
echo =====================================================================
echo.

python live_radar_scanner.py --live --interval 5 --duration 1200 --auto_push

echo.
echo =====================================================================
echo    DA KET THUC KY QUAY LIVE! CHAY PHAN TICH KHUNG 3 NGAY...
echo =====================================================================
python crawl_and_analyze.py
python logic_cau_dong.py
python live_radar_scanner.py

git add .
git commit -m "Live XSMB finish and sync"
git push origin main

echo.
echo [DONE] Hoan tat toan bo tien trinh. Nhan phim bat ky de thoat.
pause >nul
