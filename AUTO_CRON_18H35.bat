@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ======================================================= >> cron_history.log
echo [%date% %time%] BẮT ĐẦU CHẠY TỰ ĐỘNG THEO DÕI LIVE XSMB TỪ 18H15... >> cron_history.log

:: 1. Quét Radar Live trực tiếp theo thời gian thực trong giờ quay (18h15 - 18h32)
:: Cào liên tục mỗi 7 giây, tự động dừng khi nhận đủ 19 giải và có giải Đặc Biệt (hoặc tối đa 1050s = 17.5 phút)
echo [%date% %time%] Đang quét Radar Live G1-G5.6 theo thời gian thực... >> cron_history.log
python live_radar_scanner.py --live --interval 7 --duration 1050 >> cron_history.log 2>&1

:: 2. Sau khi quay xong giải Đặc Biệt (khoảng 18h31-18h33), chạy phân tích toàn diện Khung 3 Ngày
echo [%date% %time%] Đã hoàn tất quay thưởng, bắt đầu phân tích Khung 3 Ngày & chốt dữ liệu... >> cron_history.log
python crawl_and_analyze.py >> cron_history.log 2>&1

:: 3. Quét chốt và cập nhật lại Radar lần cuối cùng ngày mới
python live_radar_scanner.py >> cron_history.log 2>&1

:: 4. Đẩy toàn bộ dữ liệu & kết quả lên GitHub Pages
git add . >> cron_history.log 2>&1
git commit -m "Auto update Live XSMB: Radar G1-G5 & Khung 3N %date%" >> cron_history.log 2>&1
git push origin main >> cron_history.log 2>&1

echo [%date% %time%] HOÀN TẤT ĐỒNG BỘ TOÀN BỘ DỮ LIỆU LÊN GITHUB THÀNH CÔNG! >> cron_history.log
echo ======================================================= >> cron_history.log
exit /b 0
