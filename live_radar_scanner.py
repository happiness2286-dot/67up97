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
SUMMARY_JSON_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'analysis_summary.json')
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

def fetch_html(is_live=True, count=35):
    headers = {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 Chrome/120.0.0.0 Safari/604.1',
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    table_tag = '<table class="table table-condensed kqcenter kqvertimarginw table-kq-border table-kq-hover-div table-bordered kqbackground table-kq-bold-border tb-phoi-border watermark table-striped" id="result_tab_mb">'
    
    so_kq_html = ""
    if HAS_LIBS:
        try:
            resp = requests.post(MKETQUA_SO_KQ_URL, data={'code': 'mb', 'count': str(count), 'dow': '7'}, headers=headers, timeout=10)
            if resp.status_code == 200:
                so_kq_html = resp.text
        except Exception:
            pass

    if not so_kq_html:
        try:
            data = urllib.parse.urlencode({'code': 'mb', 'count': str(count), 'dow': '7'}).encode('utf-8')
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

    # Load analysis_summary.json nếu có để đồng bộ Top 3 Đầu x Top 3 Đuôi động
    summary_data = {}
    if os.path.exists(SUMMARY_JSON_PATH):
        try:
            with open(SUMMARY_JSON_PATH, encoding='utf-8') as f:
                summary_data = json.load(f)
        except Exception:
            pass

    # Top 3 Đầu và Top 3 Đuôi động theo AI mới nhất
    head_digits = []
    if summary_data.get('top_predicted_heads'):
        head_digits = [h['head'].replace('Đầu ', '').strip() for h in summary_data['top_predicted_heads'][:3]]
    if not head_digits:
        head_digits = ['3', '4', '2']

    tail_digits = []
    if summary_data.get('top_predicted_tails'):
        tail_digits = [t['tail'].replace('Đuôi ', '').strip() for t in summary_data['top_predicted_tails'][:3]]
    if not tail_digits:
        tail_digits = ['2', '7', '1']

    dan_9_so = sorted(list(set(f"{h}{t}" for h in head_digits for t in tail_digits)))

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
            if n not in dan_lot_valid:
                dan_lot_valid.append(n)
        else:
            item['top_rank'] = "❌ Loại bỏ (Ngoài N1)"
        table_5cols.append(item)

    # Đảm bảo Dàn Lót Hợp Lệ luôn đầy đủ (bổ sung từ Dàn 9 số & Dàn Cấp 2 / N1 loại trừ Top 1 & Top 4)
    dan_cap2_38so = ["01", "02", "04", "07", "09", "11", "12", "14", "16", "17", "20", "22", "23", "25", "27", "31", "32", "37", "40", "41", "42", "45", "47", "49", "61", "62", "67", "68", "70", "72", "75", "77", "81", "82", "84", "86", "87", "89"]
    backup_pool = [x for x in dan_9_so if x in cap4_set and x not in top_4 and x != top_1]
    backup_pool += [x for x in dan_cap2_38so if x in cap4_set and x not in top_4 and x != top_1]
    for n in backup_pool:
        if n not in dan_lot_valid:
            dan_lot_valid.append(n)
    dan_lot_valid = sorted(list(set(dan_lot_valid)))

    # Đếm số giải đã quay
    live_p = target_draw['prizes']
    p_g1 = live_p.get('G1', '')
    p_g2 = [live_p.get('G2.1', ''), live_p.get('G2.2', '')]
    p_g3 = [live_p.get(f'G3.{i}', '') for i in range(1, 7)]
    p_g4 = [live_p.get(f'G4.{i}', '') for i in range(1, 5)]
    p_g5 = [live_p.get(f'G5.{i}', '') for i in range(1, 7)]

    filled_prizes = (1 if p_g1 else 0) + sum(1 for x in p_g2 if x) + sum(1 for x in p_g3 if x) + sum(1 for x in p_g4 if x) + sum(1 for x in p_g5 if x)
    is_completed = (filled_prizes >= 19)

    # Dàn Tĩnh 4 Cấp trước 18h15
    dan_tinh_4cap = {
        'target_date': target_draw['date'],
        'status_text': 'ĐANG CÓ HIỆU LỰC (VÀO TIỀN TRƯỚC 18H15)',
        'bach_thu': top_1 if top_1 else '41',
        'song_thu': [top_1, top_4[1]] if len(top_4) >= 2 else ['41', '14'],
        'tu_thu': top_4 if len(top_4) >= 4 else ['41', '14', '67', '31'],
        'cang_3d': ['0', '2', '4', '5', '7'],
        'dan_9_so': dan_9_so,
        'dan_cap2_38so': dan_cap2_38so,
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

    # Đánh giá Lịch sử kiểm chứng các kỳ trước đó
    history_records, history_summary = build_radar_history(draws, summary_data, max_records=30)

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
        'dan_9_heads': head_digits,
        'dan_9_tails': tail_digits,
        'dan_9_so': dan_9_so,
        'dan_lot': dan_lot_valid,
        'table_5cols': table_5cols,
        'actual_de': actual_de,
        'dan_tinh_4cap': dan_tinh_4cap,
        'frame_transition': frame_transition,
        'history_records': history_records,
        'history_summary': history_summary,
        'last_updated': datetime.now().strftime("%H:%M:%S %d/%m/%Y")
    }

    with open(STATE_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(final_state, f, ensure_ascii=False, indent=2)

    print(f"[{datetime.now().strftime('%H:%M:%S')}] Đã cập nhật live_radar_state.json: {filled_prizes}/19 giải | Top 1: {top_1} | Top 4: {top_4} | Dàn 9: {len(dan_9_so)}s | Dàn Lót: {len(dan_lot_valid)}s | Lịch sử: {len(history_records)} kỳ")
    return final_state

def evaluate_radar_for_draw(sub_draws, cap4_set):
    """Tính toán Bạch thủ Top 1, Tứ thủ Top 4 cho 1 kỳ cụ thể trong lịch sử."""
    if len(sub_draws) < 2:
        return None
    target_draw = sub_draws[0]
    prev_draw = sub_draws[1]
    prev_de = prev_draw.get('de', '')
    if not prev_de or len(prev_de) < 2:
        return None

    head_num = int(prev_de[0])
    tail_num = int(prev_de[1])
    head_targets = [str(head_num), str(BONG_DUONG[head_num])]
    tail_targets = [str(tail_num), str(BONG_DUONG[tail_num])]

    target_pos = get_positions(target_draw['prizes'])
    prev_pos = get_positions(prev_draw['prizes'])

    def calc_streak_local(pos_key, is_head=True):
        streak = 1
        for past_idx in range(2, min(len(sub_draws), 7)):
            de = sub_draws[past_idx].get('de', '')
            if not de or len(de) < 2:
                break
            d_val = int(de[0] if is_head else de[1])
            allowed = [str(d_val), str(BONG_DUONG[d_val])]
            past_p = get_positions(sub_draws[past_idx]['prizes'])
            if pos_key in past_p and past_p[pos_key][0] in allowed:
                streak += 1
            else:
                break
        return min(streak, 4)

    head_matches = []
    tail_matches = []
    for pos_key, (char, raw_name) in prev_pos.items():
        if char in head_targets and pos_key in target_pos:
            st = calc_streak_local(pos_key, is_head=True)
            c = target_pos[pos_key][0]
            head_matches.append({'digit': c, 'digit_bong': str(BONG_DUONG[int(c)]), 'cycle': st, 'pos_raw': raw_name})
        if char in tail_targets and pos_key in target_pos:
            st = calc_streak_local(pos_key, is_head=False)
            c = target_pos[pos_key][0]
            tail_matches.append({'digit': c, 'digit_bong': str(BONG_DUONG[int(c)]), 'cycle': st, 'pos_raw': raw_name})

    combos_map = {}
    for h in head_matches:
        for t in tail_matches:
            c = h['digit']
            d = t['digit']
            cb = h['digit_bong']
            db = t['digit_bong']
            cycle_pair = max(h['cycle'], t['cycle'])
            pairs = [(f"{c}{d}", 1.0), (f"{c}{db}", 0.85), (f"{cb}{d}", 0.85), (f"{cb}{db}", 0.7)]
            for num_str, wt in pairs:
                score = cycle_pair * 40 + wt * 25 + (h['cycle'] + t['cycle']) * 10
                if num_str not in combos_map or score > combos_map[num_str]['score']:
                    combos_map[num_str] = {'num': num_str, 'cycle_days': cycle_pair, 'score': score}

    found = list(combos_map.values())
    found.sort(key=lambda x: (x['cycle_days'], x['score']), reverse=True)
    chidao = [x for x in found if x['cycle_days'] >= 3]
    top_pool = chidao if chidao else found
    t1 = top_pool[0]['num'] if top_pool else ""
    t4 = [x['num'] for x in top_pool[:4]] if len(top_pool) >= 4 else [x['num'] for x in top_pool]

    return {
        'top_1': t1,
        'top_4': t4,
        'found': found
    }

def build_radar_history(draws, summary_data, max_records=30):
    """Xây dựng bảng lịch sử kiểm chứng các kỳ quay (Top 1 Bạch Thủ, Top 4 Tứ Thủ, Dàn 9 Số, Dàn Lót)."""
    cap4_set = set(DEFAULT_60_N1)
    top3_history_map = {r['date']: r for r in summary_data.get('history_top3_dau_duoi_records', [])}
    records = []

    start_k = 0
    if len(draws) > 0 and not draws[0].get('de'):
        start_k = 1

    for k in range(start_k, min(len(draws) - 2, start_k + max_records)):
        sub_draws = draws[k:]
        target_draw = sub_draws[0]
        actual_de = target_draw.get('de', '')
        if not actual_de or len(actual_de) < 2:
            continue

        eval_res = evaluate_radar_for_draw(sub_draws, cap4_set)
        if not eval_res:
            continue

        t1 = eval_res['top_1']
        t4 = eval_res['top_4']

        t_date = target_draw.get('date', '')
        t3_info = top3_history_map.get(t_date, {})
        d9_str = t3_info.get('pred_9_nums', '')
        d9_list = [x.strip() for x in d9_str.split(',') if x.strip()] if d9_str else []
        pred_heads = t3_info.get('pred_heads', '')
        pred_tails = t3_info.get('pred_tails', '')

        if not d9_list:
            d9_list = [x['num'] for x in eval_res['found'][:9]]

        dan_lot = [x['num'] for x in eval_res['found'] if x['num'] in cap4_set and x['num'] not in t4 and x['num'] != t1]
        dan_cap2_38so = ["01", "02", "04", "07", "09", "11", "12", "14", "16", "17", "20", "22", "23", "25", "27", "31", "32", "37", "40", "41", "42", "45", "47", "49", "61", "62", "67", "68", "70", "72", "75", "77", "81", "82", "84", "86", "87", "89"]
        backup_pool = [x for x in d9_list if x in cap4_set and x not in t4 and x != t1]
        backup_pool += [x for x in dan_cap2_38so if x in cap4_set and x not in t4 and x != t1]
        for n in backup_pool:
            if n not in dan_lot:
                dan_lot.append(n)
        dan_lot = sorted(list(set(dan_lot)))

        hit_t1 = (actual_de == t1) if t1 else False
        hit_t4 = (actual_de in t4) if t4 else False
        hit_d9 = (actual_de in d9_list) if d9_list else False
        hit_lot = (actual_de in dan_lot) if dan_lot else False
        hit_n1 = (actual_de in cap4_set)

        records.append({
            'stt': len(records) + 1,
            'date': t_date,
            'de': actual_de,
            'top_1': t1,
            'hit_top_1': hit_t1,
            'top_4': t4,
            'hit_top_4': hit_t4,
            'dan_9_so': d9_list,
            'pred_heads': pred_heads,
            'pred_tails': pred_tails,
            'hit_dan_9': hit_d9,
            'dan_lot': dan_lot,
            'hit_dan_lot': hit_lot,
            'hit_n1': hit_n1
        })

    tot = len(records)
    t1_hits = sum(1 for r in records if r['hit_top_1'])
    t4_hits = sum(1 for r in records if r['hit_top_4'])
    d9_hits = sum(1 for r in records if r['hit_dan_9'])
    lot_hits = sum(1 for r in records if r['hit_dan_lot'])
    n1_hits = sum(1 for r in records if r['hit_n1'])

    summary = {
        'total_evals': tot,
        'top1_hits': t1_hits,
        'top1_rate': round(t1_hits / tot * 100, 2) if tot else 0,
        'top4_hits': t4_hits,
        'top4_rate': round(t4_hits / tot * 100, 2) if tot else 0,
        'dan9_hits': d9_hits,
        'dan9_rate': round(d9_hits / tot * 100, 2) if tot else 0,
        'lot_hits': lot_hits,
        'lot_rate': round(lot_hits / tot * 100, 2) if tot else 0,
        'n1_hits': n1_hits,
        'n1_rate': round(n1_hits / tot * 100, 2) if tot else 0
    }
    return records, summary

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Live Radar Scanner G1->G5 XSMB")
    parser.add_argument('--live', action='store_true', help="Chạy vòng lặp cào live liên tục mỗi 5-10 giây")
    parser.add_argument('--interval', type=int, default=7, help="Chu kỳ giây quét (mặc định 7s)")
    parser.add_argument('--duration', type=int, default=0, help="Thời gian tối đa chạy live tính bằng giây (0 = vô hạn)")
    args = parser.parse_args()

    if args.live:
        print(f"[*] Bắt đầu radar live polling mỗi {args.interval} giây (Thời lượng tối đa: {args.duration if args.duration else 'Vô hạn'}s)...")
        start_t = time.time()
        while True:
            try:
                res = scan_radar()
                if res and res.get('is_g5_finished') and res.get('actual_de'):
                    print(f"[*] Đã nhận diện đủ 19 giải & giải Đặc Biệt ({res.get('actual_de')}). Hoàn tất phiên quét Live!")
                    if args.duration > 0 and (time.time() - start_t) > 60:
                        break
            except Exception as e:
                print(f"[!] Lỗi khi quét radar: {e}")
            if args.duration > 0 and (time.time() - start_t) >= args.duration:
                print(f"[*] Đã hết thời gian live {args.duration}s. Dừng quét!")
                break
            time.sleep(args.interval)
    else:
        scan_radar()
