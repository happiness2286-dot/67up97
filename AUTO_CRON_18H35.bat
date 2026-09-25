@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ======================================================= >> cron_history.log
echo [%date% %time%] BẮT ĐẦU TỰ ĐỘNG CHẠY CẬP NHẬT 18H35... >> cron_history.log

:: 1. Cào kết quả mới nhất, phân tích Khung 3 Ngày & Đẩy GitHub
python crawl_and_analyze.py >> cron_history.log 2>&1

:: 2. Quét & Cập nhật Radar Live G1-G5.6 theo ngày mới nhất
python live_radar_scanner.py >> cron_history.log 2>&1

:: 3. Đẩy toàn bộ thay đổi còn lại lên GitHub
git add . >> cron_history.log 2>&1
git commit -m "Auto update 18h35 daily: Khung 3N & Radar Live %date%" >> cron_history.log 2>&1
git push origin main >> cron_history.log 2>&1

echo [%date% %time%] HOÀN TẤT ĐỒNG BỘ 18H35 LÊN GITHUB THÀNH CÔNG! >> cron_history.log
echo ======================================================= >> cron_history.log
exit /b 0
