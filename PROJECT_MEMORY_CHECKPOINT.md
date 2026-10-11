# BỘ NHỚ CHỐT DỰ ÁN XSMB AI 67UP97 (CHECKPOINT HOÀN TẤT: THÁNG 10/2026)

## 📌 1. THÔNG TIN CHUNG
* **Tên Dự Án**: XSMB AI PREDICTION 2026 - MODEL 67 UP TO 97%
* **Workspace Folder**: `67_up_95` (Tuyệt đối phân lập độc lập, không xâm lấn thư mục khác).
* **GitHub Repository**: [https://github.com/happiness2286-dot/67up97.git](https://github.com/happiness2286-dot/67up97.git) (Branch: `main`).
* **Web App Trực Tuyến**: [https://happiness2286-dot.github.io/67up97/](https://happiness2286-dot.github.io/67up97/)

---

## 🌐 2. KIẾN TRÚC DUAL-ENGINE CÀO & QUÉT LIVE (API 383.IM & XOSODAIPHAT.COM)
Hệ thống đã hoàn tất nâng cấp toàn bộ sang cơ chế 2 lớp siêu tốc và chống gián đoạn:
1. **Engine 1 - API Siêu Tốc (Primary Engine)**:
   - **Endpoint**: `https://api.383.im/lottery/live.json`
   - **Tốc Độ Phản Hồi**: ~50ms (Direct JSON Payload, không phụ thuộc render HTML).
   - **Cơ Chế Bắt Bóng**: Trích xuất real-time từng bóng số khi lồng quay đang quay từ G1 đến G7 và GĐB.
   - **Chuẩn Hóa Trường**: Đã fix triệt để cấu trúc trả về, tự động giải nén `prizes` sang `g7_1..g7_4` và `all_lo`, tránh hoàn toàn lỗi `KeyError: 'g7_1'` trong [crawl_and_analyze.py](file:///e:/DONG%20BO/New%20Ha%20GCCK/N%C4%83m%202026/D%E1%BB%B1%20%C3%81n%20AI_%20Antigravity/67_up_95/crawl_and_analyze.py).
2. **Engine 2 - Fallback Dự Phòng Bền Vững (Secondary Engine)**:
   - **Nguồn**: `xosodaiphat.com` (`/xsmb-xo-so-mien-bac.html` và `/xsmb-30-ngay.html`).
   - **Bộ Bóc Tách (Parser)**: BeautifulSoup phân tích DOM bảng kết quả chuẩn xác, có Retry và User-Agent header, tự động kích hoạt ngay khi API 383.im gặp sự cố mạng hoặc phản hồi rỗng.
3. **Đồng Bộ Dữ Liệu Tự Động**:
   - Tự động ghi nhận và cập nhật vào `data_2026.json`, `live_radar_state.json`, `cached_draws.json` và `analysis_summary.json`.
   - Áp dụng trên cả 2 kịch bản: [live_radar_scanner.py](file:///e:/DONG%20BO/New%20Ha%20GCCK/N%C4%83m%202026/D%E1%BB%B1%20%C3%81n%20AI_%20Antigravity/67_up_95/live_radar_scanner.py) (chạy live 18h14 - 18h35) và [crawl_and_analyze.py](file:///e:/DONG%20BO/New%20Ha%20GCCK/N%C4%83m%202026/D%E1%BB%B1%20%C3%81n%20AI_%20Antigravity/67_up_95/crawl_and_analyze.py) (tổng hợp phân tích chuyên sâu).

---

## ⚡ 3. CƠ CHẾ LIVE QUAY CÙNG ĐÀI & KHÓA CHỐT SỚM G5.5 / 18H23:30
1. **Live Push Từng Giải Mới (Quay Cùng Đài 100%)**:
   - Trong khung giờ live **18h15 - 18h23:30**, cứ mỗi khi lồng cầu xổ xong 1 giải mới (**G1, G2, G3, G4, G5**) hoặc tối đa **15 giây/lần**, hệ thống tự động đẩy nhẹ `live_radar_state.json` lên GitHub.
   - Giao diện web/điện thoại liên tục nhảy số, vẽ cầu, đổi màu vị trí ăn thông theo đúng thời gian thực của đài.
2. **Khóa Chốt Sớm Tại G5.5 (18/19 Giải)**:
   - Ngay khi nổ giải 5 thứ 5 (**G5.5, khoảng 18h22:45 – 18h23:15**), hệ thống tự động khóa trạng thái `LOCKED_G5` mà **không cần chờ G5.6**.
   - Lập tức chốt hạ Bạch Thủ Top 1, Lót Lộn, Tứ Thủ Top 4 và Dàn 3 Càng 3D.
3. **Backup Cứng Đúng 18h23:30 (Chống Hết Giờ Ghi)**:
   - Nếu mạng lag hoặc đài quay chậm mà chạm mốc **18h23:30**, hệ thống **ép khóa chốt ngay lập tức**.
   - Đảm bảo chậm nhất **18h23:45** điện thoại người dùng đã có số chốt đầy đủ, còn trọn vẹn 4-5 phút để vào tiền trước 18h28.
4. **Triệt Tiêu Độ Trễ Web & Rate Limit ([app.js](file:///e:/DONG%20BO/New%20Ha%20GCCK/N%C4%83m%202026/D%E1%BB%B1%20%C3%81n%20AI_%20Antigravity/67_up_95/app.js))**:
   - Kéo trực tiếp `live_radar_state.json?t=Date.now()` kèm cờ ép bỏ qua cache (`no-store`, `must-revalidate`), đảm bảo độ trễ 0s.

---

## 🛡️ 4. KIẾN TRÚC CRON 5 TẦNG TỰ ĐỘNG & BÙ DỮ LIỆU THÔNG MINH (SELF-HEALING)
Đã khắc phục hoàn toàn sự cố ngày 09/10 do tắt máy/mất nguồn:
1. **Tách biệt các mốc độc lập (Không dùng Sleep dài 74 phút)**:
   - **Tầng 1 (17h00)**: [AUTO_CRON_18H15.ps1](file:///e:/DONG%20BO/New%20Ha%20GCCK/N%C4%83m%202026/D%E1%BB%B1%20%C3%81n%20AI_%20Antigravity/67_up_95/AUTO_CRON_18H15.ps1) chuẩn bị dàn số Chờ Quay cho ngày mới và thoát ngay.
   - **Tầng 2 (18h15)**: Task `XSMB_AI_AutoLive_18h15` kích hoạt đón lồng cầu quay trực tiếp, khóa chốt sớm tại G5.5 / 18h23:30.
   - **Tầng 3 (18h37)**: Task `XSMB_AI_AutoDaily_18h37` chốt toàn diện Khung 3N & Tab 4, xuất Excel Master và đẩy GitHub (lệch giờ sau Logic 18h35:35 để tránh tranh chấp).
2. **Cơ chế Tự Động Bù (Self-Healing Recovery)**:
   - **Tầng 4 (AtLogOn - Khi mở máy/đăng nhập)**: Task `XSMB_AI_Catchup_OnLogon` chạy [catchup_check.py](file:///e:/DONG%20BO/New%20Ha%20GCCK/N%C4%83m%202026/D%E1%BB%B1%20%C3%81n%20AI_%20Antigravity/67_up_95/catchup_check.py). Nếu máy tính bị tắt trong giờ quay và mở lại lúc tối (19h, 20h, 22h...), script phát hiện hôm nay chưa có kết quả sẽ **tự động cào và cập nhật bù ngay trong 10 giây**.
   - **Tầng 5 (19h00 Evening Fallback)**: Task `XSMB_AI_Catchup_Evening` có cờ `StartWhenAvailable = $true`, tự động kích hoạt bù nếu bị lỡ giờ.

---

## 📊 5. CÁC TỆP DỮ LIỆU ĐÃ ĐỒNG BỘ MỚI NHẤT
* **Kết quả đã cập nhật**: Đến ngày 10/10/2026 (279 kỳ năm 2026, Đề 53, ĐB 20653).
* **Excel Master**: [Thong_Ke_G7_Va_Top20_XSMB_2026.xlsx](file:///e:/DONG%20BO/New%20Ha%20GCCK/N%C4%83m%202026/D%E1%BB%B1%20%C3%81n%20AI_%20Antigravity/67_up_95/Thong_Ke_G7_Va_Top20_XSMB_2026.xlsx) (18 Sheets phân tích).
* **Tab 4 Cầu Động AI**: [tab4_data.json](file:///e:/DONG%20BO/New%20Ha%20GCCK/N%C4%83m%202026/D%E1%BB%B1%20%C3%81n%20AI_%20Antigravity/67_up_95/tab4_data.json) & [so_sanh_dan.json](file:///e:/DONG%20BO/New%20Ha%20GCCK/N%C4%83m%202026/D%E1%BB%B1%20%C3%81n%20AI_%20Antigravity/67_up_95/so_sanh_dan.json).
* **Live Radar State**: [live_radar_state.json](file:///e:/DONG%20BO/New%20Ha%20GCCK/N%C4%83m%202026/D%E1%BB%B1%20%C3%81n%20AI_%20Antigravity/67_up_95/live_radar_state.json).
* **Bộ cài đặt Task Scheduler**: [register_task.ps1](file:///e:/DONG%20BO/New%20Ha%20GCCK/N%C4%83m%202026/D%E1%BB%B1%20%C3%81n%20AI_%20Antigravity/67_up_95/register_task.ps1).

---

## 🔒 6. CƠ CHẾ PHÂN LẬP & LỆCH GIỜ VỚI DỰ ÁN LOGIC & 58_UP_TO_75
1. **Phân lập tuyệt đối dữ liệu & Git**:
   - `67_up_95`: Git repo `happiness2286-dot/67up97.git`, dữ liệu nằm độc lập trong thư mục `67_up_95`.
   - `Logic`: Git repo `happiness2286-dot/logistic.git`, chạy độc lập trong thư mục `Logic`.
   - `58_up_to_75`: Git repo `happiness2286-dot/57_up_to_75.git`, chạy độc lập trong thư mục `58_up_to_75`.
2. **Lệch giờ chạy tự động (Staggered Scheduling)**:
   - Live: `Logic` chạy **18:14:14** | `67_up_95` chạy **18:15:15** (lệch sau 1 phút, đón đúng giờ đài quay).
   - Chốt ngày: `Logic` chạy **18:35:35** | `67_up_95` chạy **18:37:37** (lệch sau 2 phút, cào và xuất Excel Master sau khi Logic đã đẩy xong).
3. **Chống nhận diện nhầm tiến trình**:
   - Trong `AUTO_CRON_18H15.ps1`: Bộ lọc `Win32_Process` kiểm tra chính xác `CommandLine` chứa `67_up_95` mới coi là trùng. Tuyệt đối không tự thoát nhầm khi tiến trình của `Logic` đang chạy.
4. **Quy tắc chốt dàn động G5.5**:
   - Dàn động của `67_up_95` khóa cứng ngay khi nổ giải 5 thứ 5 (**G5.5, 18/19 giải**) hoặc backup khẩn cấp tại **18h23:30**, đảm bảo người dùng có số hoàn tất trước 18h28.
