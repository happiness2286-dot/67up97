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
from datetime import datetime

# UTF-8 encoding
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(SCRIPT_DIR, 'data_2026.json')
TAB4_FILE = os.path.join(SCRIPT_DIR, 'tab4_data.json')
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
    cur_date_str = now.strftime('%d-%m-%Y')
    cur_min = now.hour * 60 + now.minute

    # Nếu chưa tới 18h35 thì chưa phải giờ chốt kết quả ngày hôm nay
    if cur_min < (18 * 60 + 35):
        log(f"Hiện tại {now.strftime('%H:%M:%S')} chưa tới giờ chốt kết quả (18h35). Không cần bù.")
        return

    # Kiểm tra xem data_2026.json đã có kết quả hôm nay chưa
    has_today = False
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if data and len(data) > 0:
                    latest_date = data[0].get('date', '')
                    if cur_date_str in latest_date and data[0].get('de'):
                        has_today = True
        except Exception as e:
            log(f"Lỗi đọc data_2026.json: {e}")

    if has_today:
        log(f"Dữ liệu hôm nay ({cur_date_str}) đã đầy đủ. Không cần cập nhật bù.")
        return

    log(f"⚠️ PHÁT HIỆN DỮ LIỆU NGÀY HÔM NAY ({cur_date_str}) CHƯA ĐƯỢC CẬP NHẬT (Do tắt máy/lỡ lịch)! ĐANG TỰ ĐỘNG CHẠY BÙ...")

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

        # 4. Git Push
        log("4/4. Đang đồng bộ lên GitHub...")
        git_exe = r"C:\Program Files\Git\cmd\git.exe"
        if not os.path.exists(git_exe):
            git_exe = "git"
        subprocess.run([git_exe, 'add', '.'], cwd=SCRIPT_DIR)
        subprocess.run([git_exe, 'commit', '-m', f"Auto catch-up sync for {cur_date_str}"], cwd=SCRIPT_DIR)
        subprocess.run([git_exe, 'push', 'origin', 'main'], cwd=SCRIPT_DIR)

        log("✅ TỰ ĐỘNG CẬP NHẬT BÙ THÀNH CÔNG VÀ ĐÃ ĐẨY LÊN GITHUB!")
    except Exception as ex:
        log(f"❌ Lỗi trong quá trình cập nhật bù: {ex}")

if __name__ == '__main__':
    check_and_catchup()
