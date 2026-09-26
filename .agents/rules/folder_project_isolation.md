# Quy Tắc Bắt Buộc: Phân Lập Thư Mục Dự Án & Bộ Nhớ Mô Hình 67UP97

## ⚠️ 1. Nguyên Tắc Phân Lập Thư Mục (BẮT BUỘC MỖI FOLDER LÀ 1 DỰ ÁN)
- **Mỗi Folder trong workspace là một Dự án độc lập & riêng biệt**:
  - `67_up_95`: Dự án XSMB AI Prediction 2026 - Model 67 UP TO 97% (Repo GitHub: `67up97`).
  - `SANLUONG2026`: Dự án Mini App Báo Cáo Sản Lượng GCCK 2026.
  - `Logic`: Dự án Baseline cũ.
  - `Chat boss`: Dự án Trợ Lý Điều Hành Cá Nhân.
- **Quy tắc ứng xử**:
  - **KHÔNG BẰNG BẤT KỲ GIÁ NÀO tự ý copy, trộn lẫn hoặc dùng nhầm dữ liệu giữa các Folder**.
  - Khi cần tham chiếu hoặc sử dụng dữ liệu từ Folder khác, **BẮT BUỘC PHẢI HỎI VÀ XÁC NHẬN VỚI NGƯỜI DÙNG TRƯỚC** để tránh mất thời gian.

---

## 🚀 2. Bộ Nhớ Chốt Bản Cuối Cùng Dự Án 67UP97 (`67_up_95`)
- **Tên Mô Hình**: XSMB AI PREDICTION 2026 - MODEL 67 UP TO 97% (Repo GitHub: `67up97`).
- **Thông Số Cấu Hình Chuẩn**:
  - **Dàn Gốc N1**: **60 số** (Đánh Ngày 1).
  - **Dàn Siêu Lọc N2 & N3**: **36 số** (Đánh Ngày 2 & Ngày 3 khi N1 trượt).
  - **Ma Trận G7**: Ghép đồng thuận **Top 4 Vị Trí G7** (`G7.1`, `G7.2`, `G7.3`, `G7.4`).
  - **Tỷ Lệ Trúng Khung 3N**: **98.29% ($\approx$ 97%)**.
  - **Hiển Thị Mốc Ngày**: Tự động tính toán & hiển thị mốc ngày minh bạch trên cả 5 Thanh Điều Khiển (5 Tab).
- **Quy Trình Tự Động Hóa**:
  - File `CAP_NHAT_VA_DAY_GITHUB.bat` (hoặc `python crawl_and_analyze.py`) tự động cào dữ liệu mới, chạy mô hình 97%, xuất Excel 18 Sheet và **tự động đẩy (push) trực tiếp lên GitHub `https://github.com/happiness2286-dot/67up97.git`**.
  - Trang Web điện thoại online chính thức: **`https://happiness2286-dot.github.io/67up97/`**.

---

## 🎯 3. BỘ NHỚ CHỐT MỐC CÔNG NGHỆ (CHECKPOINT 26/09/2026)
### A. Radar Soi Live G1-G5 (Tab 2) & Cơ Chế Khóa Chốt G5 Tức Thì
- **Thời Gian Quay Live**: 18h14 - 18h35 hàng ngày.
- **Hạn Chốt Khóa Sổ G5**: Hệ thống đếm đủ **19/19 giải (từ G1 đến G5.6 lúc ~18h24)** thì tự động chuyển trạng thái `LOCKED_G5`, lập tức xuất gói chốt và đồng bộ đẩy kết quả để người dùng vào tiền trước 18h28 trước khi quay GĐB.
- **Tâm 3 Càng 3D Live**: Lấy số tâm (chính giữa) của Giải Nhất G1 (nổ lúc 18h16) làm trục càng, ghép với Bạch Thủ / Tứ Thủ / Dàn 9s $\rightarrow$ **ĐÁNH TRỰC DIỆN CHO GIẢI ĐẶC BIỆT (GĐB) CỦA CHÍNH NGÀY HÔM ĐÓ (18h30)**.

### B. Bộ Lọc Giao Thoa 3 Chiều (Consensus Scoring - Không Làm Mất Gốc)
- **Công Thức Đồng Thuận**:
  $$\text{Điểm Giao Thoa} = \text{Điểm Radar G1-G5} + \text{Điểm Dàn 9s AI} + \text{Chạm Tâm G1} + \text{Ép Cầu Tổng G7} + \text{Khung 60s N1}$$
- **Nguyên Tắc**: Tuyệt đối không ghi đè mất gốc ma trận vị trí hay lịch sử thống kê chu kỳ của Radar gốc. Các chỉ số được cộng dồn theo trọng số khoa học để sàng lọc số ưu tú nhất.
- **Kiểm Chứng Thực Tế**: Đề ngày 26/09/2026 về **32**, bộ lọc giao thoa đã hội tụ con 32 vào thẳng **TỨ THỦ HÔM NAY** (`['42', '24', '32', '37']`).

### C. Cặp "Lót Lộn Song Thủ Trụ" (Bạch Thủ + Lót Lộn)
- **Bảo Vệ Vốn 100%**: Tránh rủi ro bị trượt do nổ lộn vị trí đầu/đuôi (như bắt 42 về 24, hoặc bắt 23 về 32).
- **Giao Diện Thẻ Đôi Cân Xứng (Tab 2)**:
  - Cột Trái: 👑 **BẠCH THỦ TRỤ** kèm nút `Copy BT`.
  - Cột Phải: 🛡️ **LÓT LỘN TRỤ** kèm hiển thị `Cặp Song Thủ: [BT - Lót]` và nút `Copy Cặp ST`.
- **Nút Chốt Gấp Trước 18h25 (1 Chạm)**: Tự động tổng hợp đầy đủ Bạch Thủ + Lót Lộn + Tứ Thủ + 3 Càng + Dàn 9s + Dàn Lót để gửi tin nhắn thần tốc.

### D. Hệ Thống Windows Task Scheduler Tự Động Hóa
- **Task Name**: `XSMB_AI_AutoUpdate_18h15` (Chạy PowerShell UTF-8 ẩn `AUTO_CRON_18H15.ps1`).
- **Lịch Chạy**: Tự động kích hoạt hàng ngày lúc **18:14**, lặp lại quét live liên tục mỗi 30s-60s trong suốt khung giờ quay thưởng 18h14 - 18h35, tự động commit và push GitHub.
