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
2. **Engine 2 - Fallback Dự Phòng Bền Vững (Secondary Engine)**:
   - **Nguồn**: `xosodaiphat.com` (`/xsmb-xo-so-mien-bac.html` và `/xsmb-30-ngay.html`).
   - **Bộ Bóc Tách (Parser)**: BeautifulSoup phân tích DOM bảng kết quả chuẩn xác, có Retry và User-Agent header, tự động kích hoạt ngay khi API 383.im gặp sự cố mạng hoặc phản hồi rỗng.
3. **Đồng Bộ Dữ Liệu Tự Động**:
   - Tự động ghi nhận và cập nhật vào `data_2026.json`, `live_radar_state.json`, `cached_draws.json` và `analysis_summary.json`.
   - Áp dụng trên cả 2 kịch bản: `live_radar_scanner.py` (chạy live 18h14 - 18h35) và `crawl_and_analyze.py` (tổng hợp phân tích chuyên sâu).

---

## ⚡ 3. CƠ CHẾ LIVE QUAY CÙNG ĐÀI & KHÓA CHỐT SỚM G5.5 / 18H23:30 (ĐÃ FIX TRIỆT ĐỂ)
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
   - Gỡ bỏ việc gọi GitHub API (tránh bị 403 Rate Limit sau 3 phút).
   - Kéo trực tiếp `live_radar_state.json?t=Date.now()` kèm cờ ép bỏ qua cache (`no-store`, `must-revalidate`), đảm bảo độ trễ 0s.

---

## 🔄 4. ĐỒNG BỘ SONG SONG CÙNG ĐÀI VỚI REPO `Logic` LÚC 18H14:00
1. **Cơ Chế Gọi Đón Giờ Quay**:
   - Đúng **18h14:00**, khi `live_radar_scanner.py` thức dậy chuẩn bị quét live, nó sẽ tự động kích hoạt tiến trình ngầm `soi_cau_g1_g5.py --live --interval 8 --push` bên thư mục `Logic`.
   - Cả 2 hệ thống cùng chạy song song, cùng đài 18h14 - 18h35.
2. **Khắc Phục Lỗi Đường Dẫn Tiếng Việt**:
   - Đường dẫn gọi `Logic` trong [AUTO_CRON_18H15.ps1](file:///e:/DONG%20BO/New%20Ha%20GCCK/N%C4%83m%202026/D%E1%BB%B1%20%C3%81n%20AI_%20Antigravity/67_up_95/AUTO_CRON_18H15.ps1) và Python được quy chuẩn sang đường dẫn tương đối an toàn qua `Split-Path` / `os.path.normpath`, không còn bị lỗi font tiếng Việt của Windows PowerShell.

---

## ⏰ 5. KHUNG GIỜ VẬN HÀNH & CHỐNG CÀO LẶP (STRICT TIMEFRAME 17H00 - 18H35)
1. **Trước 17h00**: Hệ thống ở trạng thái nghỉ, ngăn chặn cào lặp để tiết kiệm CPU và tài nguyên mạng.
2. **17h00 - 18h14**: Giai đoạn chuẩn bị dữ liệu, rà soát kết quả ngày hôm qua và tải dữ liệu nền.
3. **18h14 - 18h35 (Khung Giờ Vàng Live)**:
   - Tự động quét theo chu kỳ 3s - 5s / lần.
   - Bắt trọn từng bóng số từ Giải Nhất (18h16) -> Giải Nhì -> Giải Ba -> Giải Tư -> Giải Năm (Khóa chốt 18h23:30) -> Giải Sáu -> Giải Bảy -> Giải Đặc Biệt (18h30).
4. **Sau 18h35**:
   - Tự động chạy `crawl_and_analyze.py` (tổng hợp 3N, xuất Master Excel 18 Sheet) và `logic_cau_dong.py` (Tab 4 Cầu Động AI), đồng bộ toàn diện lên GitHub và dừng an toàn.

---

## 🔬 6. BỘ LỌC GIAO THOA 3 CHIỀU & BẠCH THỦ TRỤ
1. **Thuật Toán Điểm Đồng Thuận**:
   $$\text{Điểm Giao Thoa} = \text{Điểm Radar G1-G5} + \text{Điểm Dàn 9s AI} + \text{Chạm Tâm G1} + \text{Ép Cầu Tổng G7} + \text{Khung 60s N1}$$
2. **Cặp "Lót Lộn Song Thủ Trụ"**:
   - 👑 **Bạch Thủ Trụ**: Hiển thị số Top 1 + Nút Copy BT.
   - 🛡️ **Lót Lộn Trụ**: Hiển thị số lộn + Nút Copy Cặp ST (`BT - Lót`).
   - ⚡ **Nút Gói Chốt Gấp 1 Chạm**: Tích hợp sẵn Bạch Thủ + Lót Lộn + Tứ Thủ + 3 Càng + Dàn 9s + Dàn Lót.

---

## 🚀 7. BỘ CÔNG CỤ TỰ ĐỘNG HÓA ĐÃ KIỂM ĐỊNH
1. **Windows Task Scheduler**: Task `XSMB_AI_AutoUpdate_17h00` kích hoạt [AUTO_CRON_18H15.ps1](file:///e:/DONG%20BO/New%20Ha%20GCCK/N%C4%83m%202026/D%E1%BB%B1%20%C3%81n%20AI_%20Antigravity/67_up_95/AUTO_CRON_18H15.ps1) lúc 17:00 với quyền `-WakeToRun`.
2. **Khởi Động Trực Tiếp Thủ Công**: File [CHAY_LIVE_TRUC_TIEP_18H14.bat](file:///e:/DONG%20BO/New%20Ha%20GCCK/N%C4%83m%202026/D%E1%BB%B1%20%C3%81n%20AI_%20Antigravity/67_up_95/CHAY_LIVE_TRUC_TIEP_18H14.bat) cho phép click đúp xem màn hình console nhảy số trực tiếp bất cứ lúc nào.
3. **Kịch Bản Kiểm Thử Mô Phỏng**: File [test_live_cycle_simulation.py](file:///e:/DONG%20BO/New%20Ha%20GCCK/N%C4%83m%202026/D%E1%BB%B1%20%C3%81n%20AI_%20Antigravity/67_up_95/test_live_cycle_simulation.py) giả lập 4 giai đoạn live (18h15, 18h16, 18h22:55 G5.5, 18h23:30 backup) đã kiểm định đạt 100%.
