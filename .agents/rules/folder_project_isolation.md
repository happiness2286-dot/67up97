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
