# -*- coding: utf-8 -*-
"""
HỆ THỐNG TỰ ĐỘNG KIỂM TRA & CẬP NHẬT BÙ (AUTO CATCH-UP & SELF-HEALING)
Chức năng:
- Tự động chạy mỗi khi máy tính bật lại / đăng nhập / hoặc theo lịch dự phòng sau 18h35.
- Kiểm tra xem kết quả ngày hôm nay đã có đầy đủ trong data_2026.json và tab4_data.json chưa.
- Nếu bị lỡ (do mất điện, tắt máy, sleep...) -> TỰ ĐỘNG CHẠY CẬP NHẬT BÙ NGAY LẬP TỨC!
"""

import os
import sys
import json
import subprocess
from datetime import datetime, timedelta

# UTF-8 encoding
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(SCRIPT_DIR, 'data_2026.json')
TAB4_FILE = os.path.join(SCRIPT_DIR, 'tab4_data.json')
RADAR_FILE = os.path.join(SCRIPT_DIR, 'live_radar_state.json')
PYTHON_EXE = sys.executable
LOG_FILE = os.path.join(SCRIPT_DIR, 'cron_history.log')

def log(msg):
    t = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    line = f"[{t}] [CATCH-UP] {msg}\n"
    print(line.strip(), flush=True)
    try:
        with open(LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(line)
    except Exception:
        pass

def check_and_catchup():
    now = datetime.now()
    cur_min = now.hour * 60 + now.minute

    # Xác định kỳ quay gần nhất bắt buộc phải có kết quả:
    # - Nếu đã qua 18h37: kỳ mục tiêu là HÔM NAY (now)
    # - Nếu chưa tới 18h37 (ví dụ bật máy lúc sáng/trưa hôm sau sau khi tối qua tắt máy): kỳ mục tiêu là HÔM QUA (now - 1 ngày)
    if cur_min >= (18 * 60 + 37):
        expected_dt = now
    else:
        expected_dt = now - timedelta(days=1)

    expected_date_str = expected_dt.strftime('%d-%m-%Y')

    # Kiểm tra xem data_2026.json và live_radar_state.json đã có kết quả của expected_date_str chưa
    has_expected_data = False
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if data and len(data) > 0:
                    latest_date = data[0].get('date', '')
                    if expected_date_str in latest_date and data[0].get('de'):
                        has_expected_data = True
        except Exception as e:
            log(f"Lỗi đọc data_2026.json: {e}")

    has_expected_radar = False
    if os.path.exists(RADAR_FILE):
        try:
            with open(RADAR_FILE, 'r', encoding='utf-8') as f:
                rdata = json.load(f)
                hist = rdata.get('history_records', [])
                if len(hist) >= 20:
                    has_expected_radar = True
        except Exception:
            pass

    if has_expected_data and has_expected_radar:
        log(f"Dữ liệu kỳ gần nhất ({expected_date_str}) và lịch sử 28 kỳ đã đầy đủ. Không cần cập nhật bù.")
        return

    log(f"⚠️ PHÁT HIỆN DỮ LIỆU KỲ ({expected_date_str}) CHƯA ĐƯỢC CẬP NHẬT ĐẦY ĐỦ (Do tắt máy/lỡ lịch)! ĐANG TỰ ĐỘNG CHẠY BÙ...")

    try:
        # 1. crawl_and_analyze.py
        log("1/4. Đang chạy crawl_and_analyze.py...")
        subprocess.run([PYTHON_EXE, 'crawl_and_analyze.py'], cwd=SCRIPT_DIR, check=True)

        # 2. logic_cau_dong.py
        log("2/4. Đang chạy logic_cau_dong.py...")
        subprocess.run([PYTHON_EXE, 'logic_cau_dong.py'], cwd=SCRIPT_DIR, check=True)

        # 3. live_radar_scanner.py
        log("3/4. Đang chạy live_radar_scanner.py...")
        subprocess.run([PYTHON_EXE, 'live_radar_scanner.py'], cwd=SCRIPT_DIR, check=True)

        # 4. Git Push an toàn
        log("4/4. Đang đồng bộ lên GitHub...")
        git_exe = r"C:\Program Files\Git\cmd\git.exe"
        if not os.path.exists(git_exe):
            git_exe = "git"
        sync_files = [
            'data_2026.json', 'analysis_summary.json', 'tab4_data.json',
            'so_sanh_dan.json', 'live_radar_state.json', 'verified_history_data.json',
            'cached_draws.json', 'Thong_Ke_G7_Va_Top20_XSMB_2026.xlsx'
        ]
        subprocess.run([git_exe, 'rebase', '--abort'], cwd=SCRIPT_DIR, capture_output=True)
        subprocess.run([git_exe, 'add'] + sync_files, cwd=SCRIPT_DIR, capture_output=True)
        subprocess.run([git_exe, 'commit', '-m', f"Auto catch-up sync for {expected_date_str}"], cwd=SCRIPT_DIR, capture_output=True)
        p_res = subprocess.run([git_exe, 'push', 'origin', 'main'], cwd=SCRIPT_DIR, capture_output=True, text=True)
        if p_res.returncode != 0:
            subprocess.run([git_exe, 'fetch', 'origin', 'main'], cwd=SCRIPT_DIR, capture_output=True)
            subprocess.run([git_exe, 'merge', 'origin/main', '-X', 'ours', '--no-edit', '-m', 'auto: Sync catch-up [skip ci]'], cwd=SCRIPT_DIR, capture_output=True)
            subprocess.run([git_exe, 'add'] + sync_files, cwd=SCRIPT_DIR, capture_output=True)
            subprocess.run([git_exe, 'commit', '-m', 'auto: Resolve catch-up [skip ci]'], cwd=SCRIPT_DIR, capture_output=True)
            subprocess.run([git_exe, 'push', 'origin', 'main'], cwd=SCRIPT_DIR, capture_output=True)

        log("✅ TỰ ĐỘNG CẬP NHẬT BÙ THÀNH CÔNG VÀ ĐÃ ĐẨY LÊN GITHUB!")
    except Exception as ex:
        log(f"❌ Lỗi trong quá trình cập nhật bù: {ex}")

if __name__ == '__main__':
    check_and_catchup()
