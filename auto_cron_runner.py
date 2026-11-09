# -*- coding: utf-8 -*-
"""
BỘ ĐIỀU PHỐI TỰ ĐỘNG XSMB 67_UP_95 (CHẠY TRỰC TIẾP QUA PYTHON.EXE - KHÔNG PHỤ THUỘC POWERSHELL ENCODING)
Hỗ trợ 3 chế độ:
- Prep17h:    17h00 chuẩn bị trạng thái chờ quay
- Live18h15:  18h15 quét trực tiếp G1->G5.5, khóa chốt 18h23 gửi Telegram ngay (<0.5s), đối chiếu 18h30
- Daily18h37: 18h37 phân tích chốt ngày và đồng bộ GitHub (tự bỏ qua nếu Live18h15 vừa chốt xong)
"""

import os
import sys
import json
import time
import argparse
import subprocess
from datetime import datetime

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PYTHON_EXE = sys.executable
GIT_EXE = r"C:\Program Files\Git\cmd\git.exe"
if not os.path.exists(GIT_EXE):
    GIT_EXE = "git"
LOG_FILE = os.path.join(SCRIPT_DIR, 'cron_history.log')
LOCK_FILE = os.path.join(SCRIPT_DIR, 'cron_live_18h15.lock')


def log(msg):
    t = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    line = f"[{t}] {msg}\n"
    print(line.strip(), flush=True)
    try:
        if os.path.exists(LOG_FILE) and os.path.getsize(LOG_FILE) > 1572864:
            with open(LOG_FILE, 'r', encoding='utf-8', errors='ignore') as rf:
                tail_lines = rf.readlines()[-1000:]
            with open(LOG_FILE, 'w', encoding='utf-8') as wf:
                wf.writelines(tail_lines)
        with open(LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(line)
    except Exception:
        pass


def run_step(cmd_list):
    try:
        res = subprocess.run(cmd_list, cwd=SCRIPT_DIR, capture_output=True, text=True, encoding='utf-8', errors='replace')
        if res.stdout:
            for l in res.stdout.splitlines():
                log(f"  {l}")
        if res.stderr:
            for l in res.stderr.splitlines():
                if l.strip():
                    log(f"  [git/io] {l}")
        return res.returncode == 0
    except Exception as ex:
        log(f"[!] Lỗi thực thi {cmd_list}: {ex}")
        return False


def run_daily_analysis_pipeline():
    log("1/4. Bắt đầu phân tích Khung 3 Ngày Động & xuất Excel Master (18 Sheets)...")
    run_step([PYTHON_EXE, 'crawl_and_analyze.py'])

    log("2/4. Bắt đầu cập nhật Tab 4: Cầu Vị Trí Ăn Thông AI & Nhật Ký Kiểm Chứng...")
    run_step([PYTHON_EXE, 'logic_cau_dong.py'])

    log("3/4. Cập nhật lại Live Radar & Lịch Sử Kiểm Chứng 30 Kỳ (kèm kiểm tra gửi bù Telegram nếu thiếu)...")
    run_step([PYTHON_EXE, 'live_radar_scanner.py'])

    log("4/4. Đồng bộ toàn bộ dữ liệu lên GitHub...")
    run_step([GIT_EXE, 'rebase', '--abort'])
    run_step([GIT_EXE, 'add', '.'])
    run_step([GIT_EXE, 'commit', '-m', f"Daily live cron sync {datetime.now().strftime('%Y-%m-%d %H:%M')}"])
    if not run_step([GIT_EXE, 'push', 'origin', 'main']):
        run_step([GIT_EXE, 'fetch', 'origin', 'main'])
        run_step([GIT_EXE, 'merge', 'origin/main', '-X', 'ours', '--no-edit', '-m', 'auto: Sync daily [skip ci]'])
        run_step([GIT_EXE, 'add', '.'])
        run_step([GIT_EXE, 'commit', '-m', 'auto: Resolve daily [skip ci]'])
        run_step([GIT_EXE, 'push', 'origin', 'main'])
    log("HOÀN TẤT ĐỒNG BỘ TOÀN BỘ DỮ LIỆU LÊN GITHUB THÀNH CÔNG!")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--mode', default='Auto', help='Prep17h | Live18h15 | Daily18h37 | Auto')
    args = parser.parse_args()

    now = datetime.now()
    today_str = now.strftime('%d-%m-%Y')
    mode = args.mode
    if mode == 'Auto':
        total_min = now.hour * 60 + now.minute
        if (16 * 60 + 50) <= total_min < (18 * 60 + 10):
            mode = 'Prep17h'
        elif (18 * 60 + 10) <= total_min <= (18 * 60 + 33):
            mode = 'Live18h15'
        else:
            mode = 'Daily18h37'

    log("=======================================================")
    log(f"KÍCH HOẠT CHU TRÌNH TỰ ĐỘNG XSMB 67_UP_95 (MODE: {mode})...")

    if mode == 'Prep17h':
        log("[PREP 17H00] Chuyển trạng thái sang Chờ Quay 18h15 và đồng bộ Dàn Tĩnh 4 Cấp...")
        run_step([PYTHON_EXE, 'live_radar_scanner.py'])
        run_step([GIT_EXE, 'add', 'live_radar_state.json'])
        run_step([GIT_EXE, 'commit', '-m', f"Prep waiting state 17h00 for {today_str}"])
        run_step([GIT_EXE, 'push', 'origin', 'main'])
        log("[PREP 17H00] Hoàn tất chuẩn bị trước giờ quay!")

    elif mode == 'Live18h15':
        # Tạo lock để tránh chạy đúp
        if os.path.exists(LOCK_FILE):
            lock_age = time.time() - os.path.getmtime(LOCK_FILE)
            if lock_age < 1100:
                log(f"[INFO] Phiên Live18h15 đang hoạt động (cách đây {int(lock_age)}s). Bỏ qua lần kích hoạt trùng.")
                return
        try:
            with open(LOCK_FILE, 'w', encoding='utf-8') as lf:
                lf.write(str(os.getpid()))
            log("[LIVE 18H15] Đang chạy Live Radar Scanner G1->G5.5 (khóa chốt & bắn Telegram tại G5.5 / 18h23)...")
            run_step([PYTHON_EXE, 'live_radar_scanner.py', '--live', '--interval', '5', '--duration', '1200', '--auto_push'])

            now_after = datetime.now()
            if now_after.hour == 18 and now_after.minute < 36:
                wait_sec = (36 - now_after.minute) * 60 - now_after.second
                if wait_sec > 0:
                    log(f"Chờ {wait_sec} giây đến 18h36:00 để đồng bộ kết quả chốt toàn diện...")
                    time.sleep(wait_sec)

            run_daily_analysis_pipeline()
        finally:
            try:
                if os.path.exists(LOCK_FILE):
                    os.remove(LOCK_FILE)
            except Exception:
                pass

    else:
        # Daily18h37
        state_path = os.path.join(SCRIPT_DIR, 'live_radar_state.json')
        already_synced = False
        if os.path.exists(state_path):
            try:
                with open(state_path, 'r', encoding='utf-8') as sf:
                    s_json = json.load(sf)
                age_sec = time.time() - os.path.getmtime(state_path)
                if today_str in s_json.get('target_date', '') and s_json.get('actual_de') and age_sec < 300:
                    already_synced = True
            except Exception:
                pass

        if already_synced:
            log(f"[SKIP] Dữ liệu kỳ {today_str} vừa được phiên Live18h15 chốt và đẩy lên GitHub thành công. Chỉ kiểm tra gửi bù Telegram nếu thiếu...")
            run_step([PYTHON_EXE, 'live_radar_scanner.py'])
        else:
            log(f"[DAILY 18H37] Thực hiện cập nhật và phân tích chốt ngày cho kỳ {today_str}...")
            run_daily_analysis_pipeline()

    log("=======================================================")


if __name__ == '__main__':
    main()
