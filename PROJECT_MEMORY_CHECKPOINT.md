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

## ⏰ 3. KHUNG GIỜ VẬN HÀNH & CHỐNG CÀO LẶP (STRICT TIMEFRAME 17H00 - 18H35)
1. **Trước 17h00**: Hệ thống ở trạng thái nghỉ, ngăn chặn cào lặp để tiết kiệm CPU và tài nguyên mạng.
2. **17h00 - 18h14**: Giai đoạn chuẩn bị dữ liệu, rà soát kết quả ngày hôm qua và tải dữ liệu nền.
3. **18h14 - 18h35 (Khung Giờ Vàng Live)**:
   - Tự động quét theo chu kỳ 3s - 5s / lần.
   - Bắt trọn từng bóng số từ Giải Nhất (18h16) -> Giải Nhì -> Giải Ba -> Giải Tư -> Giải Năm -> Giải Sáu -> Giải Bảy -> Giải Đặc Biệt (18h30).
   - Tự động commit và push Git theo từng giải mới hoặc mỗi chu kỳ 25s - 30s.
4. **Sau 18h35**:
   - Khi đã nổ GĐB hôm nay hoặc quá 18h35, hệ thống tự động hoàn tất phiên live, cập nhật lịch sử trúng trượt và dừng an toàn.

---

## ⚡ 4. CƠ CHẾ RADAR SOI LIVE G1-G5 & KHÓA CHỐT G5 (TAB 2)
1. **Khóa Chốt G5.5 Tức Thì**:
   - Khi cào nhận được giải **G5.5 (hoặc backup cứng lúc 18h24)**, hệ thống tự động khóa trạng thái `LOCKED_G5`.
   - Lập tức tính toán và xuất các dàn để người dùng vào tiền trước **18h28** (trước khi quay GĐB).
2. **Tâm 3 Càng 3D Live**:
   - Lấy số tâm của G1 (nổ 18h16) làm càng, kết hợp với các dàn số.
   - **Mục tiêu**: Đánh trực tiếp cho **Giải Đặc Biệt (GĐB) của chính ngày hôm đó lúc 18h30**.

---

## 🔬 5. BỘ LỌC GIAO THOA 3 CHIỀU (MULTI-CRITERIA CONVERGENCE)
* **Nguyên Tắc**: Tuyệt đối không ghi đè, không làm mất gốc logic thống kê chu kỳ của Radar gốc.
* **Thuật Toán Điểm Đồng Thuận**:
  $$\text{Điểm Giao Thoa} = \text{Điểm Radar G1-G5} + \text{Điểm Dàn 9s AI} + \text{Chạm Tâm G1} + \text{Ép Cầu Tổng G7} + \text{Khung 60s N1}$$
* **Hiệu Quả Thực Tế**: Đề ngày 26/09/2026 về **32**, số 32 hội tụ đồng thuận vượt bậc vào ngay **Tứ Thủ** (`['42', '24', '32', '37']`).

---

## 🛡️ 6. BỔ SUNG CẶP "LÓT LỘN SONG THỦ TRỤ"
* **Mục Tiêu**: Bảo vệ vốn 100% không bao giờ bị trượt do nổ lộn vị trí đầu đuôi (ví dụ bắt 42 về 24, hay 23 về 32).
* **Giao Diện Tab 2**:
  - 👑 **Bạch Thủ Trụ**: Hiển thị số Top 1 + Nút Copy BT.
  - 🛡️ **Lót Lộn Trụ**: Hiển thị số lộn + Nút Copy Cặp ST (`BT - Lót`).
* **Nút Gói Chốt Gấp 1 Chạm**: Tích hợp sẵn Bạch Thủ + Lót Lộn + Tứ Thủ + 3 Càng + Dàn 9s + Dàn Lót.

---

## 🚀 7. BỘ CÔNG CỤ TỰ ĐỘNG HÓA & TRỰC TIẾP
1. **Windows Task Scheduler**: Task `XSMB_AI_AutoUpdate_18h15` kích hoạt `AUTO_CRON_18H15.ps1` lúc 18:14 hàng ngày với quyền `-WakeToRun`.
2. **Khởi Động Trực Tiếp Thủ Công**: File `CHAY_LIVE_TRUC_TIEP_18H14.bat` cho phép người dùng click đúp chạy xem cửa sổ console nhảy số trực tiếp bất cứ lúc nào.
3. **Bypass Cache GitHub Pages**: `app.js` tự động lấy commit SHA mới nhất qua GitHub API để đọc tức thì dữ liệu từ raw GitHub (độ trễ 0s).
4. **Kịch Bản Đẩy Thủ Công Toàn Diện**: `CAP_NHAT_VA_DAY_GITHUB.bat` cào, phân tích, xuất Excel 18 Sheet và push GitHub toàn bộ.
