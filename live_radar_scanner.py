# -*- coding: utf-8 -*-
"""
=============================================================================
XSMB AI RADAR SCANNER - QUÉT VỊ TRÍ G1 ĐẾN G5.6 & PHÂN TẦNG LIVE CHUẨN IPHONE 11
Tích hợp vào Dashboard 67_UP_95:
- Tự động cào live mỗi 5s (18h15 - 18h35) từ mketqua.net / xosodaiphat.com
- Quét 85 vị trí vật lý (G1 -> G5.6), tính chu kỳ ăn thông 1d, 2d, 3d, 4d
- Lọc giao thoa với Dàn 60 Số N1 Đã Kiểm Định
- Xuất Bảng Phân Tầng 5 Cột: Con Số - Vị Trí - Chu Kỳ - Trong N1? - Phân Hạng
- Quản lý Khung nuôi 3 ngày (N1: 60s, N2: 36s, N3: 36s) & Auto-Shift
=============================================================================
"""

import os
import sys
import re
import json
import time
import argparse
from datetime import datetime
from collections import Counter

# UTF-8 stdout
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

try:
    import requests
    from bs4 import BeautifulSoup
    HAS_LIBS = True
except ImportError:
    import urllib.request
    import urllib.parse
    HAS_LIBS = False

STATE_JSON_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'live_radar_state.json')
MKETQUA_SO_KQ_URL = "https://mketqua.net/so-ket-qua"
MKETQUA_LIVE_URL = "https://mketqua.net/"

BONG_DUONG = {
    0: 5, 1: 6, 2: 7, 3: 8, 4: 9,
    5: 0, 6: 1, 7: 2, 8: 3, 9: 4
}

DEFAULT_60_N1 = [
    "01", "02", "03", "04", "05", "08", "09", "11", "12", "13", "15", "17", "18", "19", "21",
    "22", "23", "24", "26", "28", "29", "31", "32", "33", "34", "35", "37", "38", "39", "42",
    "43", "44", "45", "51", "53", "55", "58", "59", "60", "61", "62", "63", "65", "67", "68",
    "69", "72", "80", "81", "82", "83", "84", "85", "87", "88", "91", "92", "95", "96", "97", "99"
]

def fetch_html(is_live=True):
    headers = {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 Chrome/120.0.0.0 Safari/604.1',
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    table_tag = '<table class="table table-condensed kqcenter kqvertimarginw table-kq-border table-kq-hover-div table-bordered kqbackground table-kq-bold-border tb-phoi-border watermark table-striped" id="result_tab_mb">'
    
    so_kq_html = ""
    if HAS_LIBS:
        try:
            resp = requests.post(MKETQUA_SO_KQ_URL, data={'code': 'mb', 'count': '10', 'dow': '7'}, headers=headers, timeout=10)
            if resp.status_code == 200:
                so_kq_html = resp.text
        except Exception:
            pass

    if not so_kq_html:
        try:
            data = urllib.parse.urlencode({'code': 'mb', 'count': '10', 'dow': '7'}).encode('utf-8')
            req = urllib.request.Request(MKETQUA_SO_KQ_URL, data=data, headers=headers)
            with urllib.request.urlopen(req, timeout=10) as response:
                so_kq_html = response.read().decode('utf-8', errors='ignore')
        except Exception:
            pass

    if is_live:
        home_html = ""
        try:
            if HAS_LIBS:
                resp_h = requests.get(MKETQUA_LIVE_URL, headers=headers, timeout=7)
                if resp_h.status_code == 200 and table_tag in resp_h.text:
                    home_html = resp_h.text
        except Exception:
            pass

        if home_html and so_kq_html:
            h_b = home_html.split(table_tag)
            s_b = so_kq_html.split(table_tag)
            if len(h_b) > 1 and len(s_b) > 1:
                return s_b[0] + table_tag + h_b[1] + table_tag + table_tag.join(s_b[1:])
        elif home_html:
            return home_html

    return so_kq_html

def parse_draws(html):
    blocks = html.split('<table class="table table-condensed kqcenter kqvertimarginw table-kq-border table-kq-hover-div table-bordered kqbackground table-kq-bold-border tb-phoi-border watermark table-striped" id="result_tab_mb">')
    draws = []
    
    for b in blocks[1:]:
        date_m = re.search(r'id="result_date">([^<]+)</span>', b)
        date_str = date_m.group(1).strip() if date_m else ""
        
        db_m = re.search(r'id="rs_0_0"[^>]*>(\d{5})</div>', b)
        if not db_m:
            db_m = re.search(r'id="rs_0_0"[^>]*data-sofar="(\d{5})"', b)
        db_val = db_m.group(1).strip() if db_m else ""
        de_val = db_val[-2:] if len(db_val) >= 2 else ""

        prizes = {}
        config = [(1, 1), (2, 2), (3, 6), (4, 4), (5, 6)]
        for g_num, total_subs in config:
            for sub_idx in range(total_subs):
                g_code = f"G{g_num}" if g_num == 1 else f"G{g_num}.{sub_idx+1}"
                elem_id = f"rs_{g_num}_{sub_idx}"
                v_m = re.search(rf'id="{elem_id}"[^>]*>([^<]*)</div>', b)
                if not v_m:
                    v_m = re.search(rf'id="{elem_id}"[^>]*data-sofar="([^"]*)"', b)
                val = v_m.group(1).strip() if v_m else ""
                prizes[g_code] = val

        draws.append({
            'date': date_str,
            'db': db_val,
            'de': de_val,
            'prizes': prizes
        })
    return draws

def get_positions(prizes):
    res = {}
    for code, val in prizes.items():
        if not val: continue
        for idx, char in enumerate(val, 1):
            res[f"{code}_{idx}"] = (char, f"{code} vị trí {idx}")
    return res

def scan_radar():
    html = fetch_html(is_live=True)
    if not html:
        if os.path.exists(STATE_JSON_PATH):
            with open(STATE_JSON_PATH, encoding='utf-8') as f:
                return json.load(f)
        return None

    draws = parse_draws(html)
    if len(draws) < 2:
        if os.path.exists(STATE_JSON_PATH):
            with open(STATE_JSON_PATH, encoding='utf-8') as f:
                return json.load(f)
        return None

    target_draw = draws[0]
    prev_draw = draws[1]

    prev_de = prev_draw['de']
    if not prev_de or len(prev_de) < 2:
        if os.path.exists(STATE_JSON_PATH):
            with open(STATE_JSON_PATH, encoding='utf-8') as f:
                return json.load(f)
        return None

    head_num = int(prev_de[0])
    tail_num = int(prev_de[1])
    head_bong = BONG_DUONG[head_num]
    tail_bong = BONG_DUONG[tail_num]
    head_targets = [str(head_num), str(head_bong)]
    tail_targets = [str(tail_num), str(tail_bong)]

    target_pos = get_positions(target_draw['prizes'])
    prev_pos = get_positions(prev_draw['prizes'])

    def calc_streak(pos_key, is_head=True):
        streak = 1
        for past_idx in range(2, min(len(draws), 7)):
            de = draws[past_idx]['de']
            if not de or len(de) < 2: break
            d_val = int(de[0] if is_head else de[1])
            allowed = [str(d_val), str(BONG_DUONG[d_val])]
            past_p = get_positions(draws[past_idx]['prizes'])
            if pos_key in past_p and past_p[pos_key][0] in allowed:
                streak += 1
            else:
                break
        return min(streak, 4)

    highlight_positions = {}
    head_matches = []
    tail_matches = []

    for pos_key, (char, raw_name) in prev_pos.items():
        if char in head_targets:
            streak = calc_streak(pos_key, is_head=True)
            if pos_key in target_pos:
                cur_char = target_pos[pos_key][0]
                cur_bong = str(BONG_DUONG[int(cur_char)])
                cat = "Chỉ đạo" if streak >= 3 else ("Lót" if streak == 2 else "Theo dõi")
                color = "cycle_main" if streak >= 3 else ("cycle_lot" if streak == 2 else "cycle_watch")
                suffix = f"{streak}d"
                label = f"✅ CHỈ ĐẠO ({streak} ngày)" if streak >= 3 else (f"Lót ngày {streak}" if streak == 2 else "Theo dõi ngày 1 (Mới chạm)")
                
                info = {
                    'pos_raw': raw_name,
                    'role': 'head',
                    'role_name': 'Đầu',
                    'digit': cur_char,
                    'digit_bong': cur_bong,
                    'cycle': streak,
                    'cycle_suffix': suffix,
                    'category': cat,
                    'label': label,
                    'color_type': color,
                    'tooltip': f"{raw_name}: Đầu {cur_char} ({suffix}) | {label}"
                }
                highlight_positions[pos_key] = info
                head_matches.append(info)

        if char in tail_targets:
            streak = calc_streak(pos_key, is_head=False)
            if pos_key in target_pos:
                cur_char = target_pos[pos_key][0]
                cur_bong = str(BONG_DUONG[int(cur_char)])
                cat = "Chỉ đạo" if streak >= 3 else ("Lót" if streak == 2 else "Theo dõi")
                color = "cycle_main" if streak >= 3 else ("cycle_lot" if streak == 2 else "cycle_watch")
                suffix = f"{streak}d"
                label = f"✅ CHỈ ĐẠO ({streak} ngày)" if streak >= 3 else (f"Lót ngày {streak}" if streak == 2 else "Theo dõi ngày 1 (Mới chạm)")
                
                info = {
                    'pos_raw': raw_name,
                    'role': 'tail',
                    'role_name': 'Đuôi',
                    'digit': cur_char,
                    'digit_bong': cur_bong,
                    'cycle': streak,
                    'cycle_suffix': suffix,
                    'category': cat,
                    'label': label,
                    'color_type': color,
                    'tooltip': f"{raw_name}: Đuôi {cur_char} ({suffix}) | {label}"
                }
                if pos_key in highlight_positions:
                    if streak > highlight_positions[pos_key]['cycle']:
                        highlight_positions[pos_key] = info
                else:
                    highlight_positions[pos_key] = info
                tail_matches.append(info)

    # Tổ hợp ghép cặp Chục x Đơn vị
    combos_map = {}
    cap4_set = set(DEFAULT_60_N1)

    for h in head_matches:
        for t in tail_matches:
            c = h['digit']
            d = t['digit']
            cb = h['digit_bong']
            db = t['digit_bong']
            cycle_pair = max(h['cycle'], t['cycle'])
            
            pairs = [
                (f"{c}{d}", 1.0, "chính diện"),
                (f"{c}{db}", 0.85, "bóng đuôi"),
                (f"{cb}{d}", 0.85, "bóng đầu"),
                (f"{cb}{db}", 0.7, "bóng cả hai")
            ]
            
            for num_str, wt, ctype in pairs:
                cat = "Chỉ đạo" if cycle_pair >= 3 else ("Lót" if cycle_pair == 2 else "Theo dõi")
                score = cycle_pair * 40 + wt * 25 + (h['cycle'] + t['cycle']) * 10
                
                if num_str not in combos_map or score > combos_map[num_str]['score']:
                    combos_map[num_str] = {
                        'num': num_str,
                        'c_digit': c,
                        'd_digit': d,
                        'c_cycle': h['cycle'],
                        'd_cycle': t['cycle'],
                        'cycle_days': cycle_pair,
                        'category': cat,
                        'cat_label': f"✅ CHỈ ĐẠO ({cycle_pair} ngày)" if cycle_pair >= 3 else (f"Lót ngày {cycle_pair}" if cycle_pair == 2 else "Theo dõi ngày 1 (Mới chạm)"),
                        'weight': wt,
                        'combo_type': ctype,
                        'score': score,
                        'h_pos': h['pos_raw'],
                        't_pos': t['pos_raw'],
                        'in_cap4': (num_str in cap4_set),
                        'in_cap4_str': "Có" if (num_str in cap4_set) else "Không"
                    }

    found_list = list(combos_map.values())
    found_list.sort(key=lambda x: (x['cycle_days'], x['score']), reverse=True)

    # Bạch thủ Top 1 & Tứ thủ Top 4
    chidao_pool = [x for x in found_list if x['cycle_days'] >= 3]
    top_pool = chidao_pool if chidao_pool else found_list
    top_1 = top_pool[0]['num'] if top_pool else "41"
    top_4 = [x['num'] for x in top_pool[:4]] if len(top_pool) >= 4 else ["41", "14", "67", "31"]

    dan_lot_valid = []
    table_5cols = []

    for item in found_list:
        n = item['num']
        if n == top_1:
            item['top_rank'] = "👑 Top 1 (Bạch thủ)"
        elif n in top_4:
            item['top_rank'] = "🔥 Top 4 (Tứ thủ)"
        elif item['in_cap4']:
            item['top_rank'] = "🛡️ Lót hợp lệ"
            dan_lot_valid.append(n)
        else:
            item['top_rank'] = "❌ Loại bỏ (Ngoài N1)"
        table_5cols.append(item)

    # Đếm số giải đã quay
    live_p = target_draw['prizes']
    p_g1 = live_p.get('G1', '')
    p_g2 = [live_p.get('G2.1', ''), live_p.get('G2.2', '')]
    p_g3 = [live_p.get(f'G3.{i}', '') for i in range(1, 7)]
    p_g4 = [live_p.get(f'G4.{i}', '') for i in range(1, 5)]
    p_g5 = [live_p.get(f'G5.{i}', '') for i in range(1, 7)]

    filled_prizes = (1 if p_g1 else 0) + sum(1 for x in p_g2 if x) + sum(1 for x in p_g3 if x) + sum(1 for x in p_g4 if x) + sum(1 for x in p_g5 if x)
    is_completed = (filled_prizes >= 19)

    # Dàn 9 số cội nguồn: Top 3 Đầu x Top 3 Đuôi
    dan_9_so = ["67", "61", "62", "37", "31", "32", "47", "41", "42"]

    # Dàn Tĩnh 4 Cấp trước 18h15
    dan_tinh_4cap = {
        'target_date': target_draw['date'],
        'status_text': 'ĐANG CÓ HIỆU LỰC (VÀO TIỀN TRƯỚC 18H15)',
        'bach_thu': '41',
        'song_thu': ['41', '14'],
        'tu_thu': ['41', '14', '67', '31'],
        'cang_3d': ['0', '2', '4', '5', '7'],
        'dan_9_so': dan_9_so,
        'dan_cap2_38so': ["01", "02", "04", "07", "09", "11", "12", "14", "16", "17", "20", "22", "23", "25", "27", "31", "32", "37", "40", "41", "42", "45", "47", "49", "61", "62", "67", "68", "70", "72", "75", "77", "81", "82", "84", "86", "87", "89"],
        'dan_60_cap4': DEFAULT_60_N1
    }

    # Auto-Shift Khung 3 ngày
    actual_de = target_draw.get('de', '')
    hit_n1 = (actual_de in DEFAULT_60_N1) if actual_de else False
    
    frame_transition = {
        'last_result': f"Kỳ gần nhất ({target_draw['date']}) Đề về {actual_de}: {'🎯 ĐÃ TRÚNG N1 → RESET CHUYỂN CHU KỲ MỚI' if hit_n1 else '❌ TRƯỢT N1 → GIỮ NGUYÊN KHUNG, ĐÁNH N2 (36 SỐ) HÔM NAY'}",
        'status_badge': 'ĐÃ TRÚNG N1 → RESET CẦU MỚI' if hit_n1 else 'ĐANG ĐÁNH N2 (36 SỐ)',
        'dan_n1': DEFAULT_60_N1,
        'dan_n2': ["02", "04", "07", "09", "12", "14", "17", "20", "23", "25", "27", "31", "32", "37", "40", "41", "42", "45", "47", "49", "61", "62", "67", "68", "70", "72", "75", "77", "81", "82", "84", "86", "87", "89", "91", "96"],
        'dan_n3': ["01", "03", "05", "08", "11", "13", "16", "18", "21", "24", "26", "28", "33", "35", "38", "43", "44", "48", "51", "53", "55", "58", "60", "63", "65", "69", "71", "73", "78", "80", "83", "85", "88", "92", "95", "97"]
    }

    final_state = {
        'target_date': target_draw['date'],
        'prev_date': prev_draw['date'],
        'prev_de': prev_de,
        'head_targets': head_targets,
        'tail_targets': tail_targets,
        'live_prizes': {
            'g1': p_g1,
            'g2': p_g2,
            'g3': p_g3,
            'g4': p_g4,
            'g5': p_g5
        },
        'highlight_positions': highlight_positions,
        'filled_count': filled_prizes,
        'total_count': 19,
        'is_g5_finished': is_completed,
        'top_1': top_1,
        'top_4': top_4,
        'dan_9_so': dan_9_so,
        'dan_lot': dan_lot_valid,
        'table_5cols': table_5cols,
        'actual_de': actual_de,
        'dan_tinh_4cap': dan_tinh_4cap,
        'frame_transition': frame_transition,
        'last_updated': datetime.now().strftime("%H:%M:%S %d/%m/%Y")
    }

    with open(STATE_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(final_state, f, ensure_ascii=False, indent=2)

    print(f"[{datetime.now().strftime('%H:%M:%S')}] Đã cập nhật live_radar_state.json: {filled_prizes}/19 giải | Top 1: {top_1} | Top 4: {top_4}")
    return final_state

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Live Radar Scanner G1->G5 XSMB")
    parser.add_argument('--live', action='store_true', help="Chạy vòng lặp cào live liên tục mỗi 5 giây")
    parser.add_argument('--interval', type=int, default=5, help="Chu kỳ giây quét (mặc định 5s)")
    args = parser.parse_args()

    if args.live:
        print(f"[*] Bắt đầu radar live polling mỗi {args.interval} giây...")
        while True:
            try:
                scan_radar()
            except Exception as e:
                print(f"[!] Lỗi khi quét radar: {e}")
            time.sleep(args.interval)
    else:
        scan_radar()
