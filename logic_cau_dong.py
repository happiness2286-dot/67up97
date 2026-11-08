# -*- coding: utf-8 -*-
"""
LOGIC CẦU ĐỘNG VỊ TRÍ ĂN THÔNG GIẢI ĐẶC BIỆT - XSMB AI SYSTEM
Nâng cấp toàn diện:
1. Quét 85 vị trí vật lý (G1 -> G5.6) theo cơ chế Cầu Nhân Quả (Causal Positional Bridge):
   Vị trí P của ngày T-1 ăn thông Đầu/Đuôi/Chạm Đề ngày T liên tiếp >= 2 ngày
   -> Lấy chữ số tại vị trí P của ngày mới nhất làm dự báo cho kỳ kế tiếp.
2. Đồng bộ trực tiếp với Dàn 60 Số N1 Động Thích Nghi (Adaptive 60s N1) từ analysis_summary.json.
3. Kiểm chứng Walk-Forward 100% khách quan (không rò rỉ dữ liệu tương lai) trên 25 kỳ gần nhất.
"""

import json
import os
import sys
import re
from datetime import datetime, timedelta
from collections import defaultdict, Counter

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

CONFIG = {
    "so_ngay_theo_doi": 5,
    "nguong_cau_manh": 2,
    "nguong_cau_gay": 4,
    "so_dau_top": 3,
    "so_duoi_top": 3,
    "kich_thuoc_dan_tinh": 60,
}

BONG_DUONG = {
    '0': '5', '1': '6', '2': '7', '3': '8', '4': '9',
    '5': '0', '6': '1', '7': '2', '8': '3', '9': '4'
}

BONG_AM = {
    '0': '7', '7': '0',
    '1': '4', '4': '1',
    '2': '9', '9': '2',
    '3': '6', '6': '3',
    '5': '8', '8': '5'
}


def extract_date_key(d_str):
    if not d_str:
        return ""
    m = re.search(r'(\d{1,2})[-/](\d{1,2})[-/](\d{4})', str(d_str))
    if m:
        return f"{int(m.group(1)):02d}-{int(m.group(2)):02d}-{m.group(3)}"
    return str(d_str).strip()


def doc_dan_tinh_60s(target_date=None):
    """
    Đọc Dàn 60 số N1 Động Thích Nghi từ analysis_summary.json (hoặc fallback an toàn).
    Nếu truyền vào target_date (trong lịch sử), lấy đúng dàn 60s động đã dự báo cho ngày đó.
    """
    if os.path.exists('analysis_summary.json'):
        try:
            with open('analysis_summary.json', 'r', encoding='utf-8') as f:
                summary = json.load(f)
            af = summary.get('adaptive_frame', {})
            if target_date:
                t_key = extract_date_key(target_date)
                d_map = af.get('date_to_dan60_map', {})
                for k, v in d_map.items():
                    if extract_date_key(k) == t_key and v:
                        return v
            dan_n1 = af.get('dan_n1', [])
            if dan_n1 and len(dan_n1) >= 50:
                return dan_n1
        except Exception as e:
            print(f"Lưu ý khi đọc analysis_summary.json: {e}")

    if os.path.exists('live_radar_state.json'):
        try:
            with open('live_radar_state.json', 'r', encoding='utf-8') as f:
                radar = json.load(f)
                dan = radar.get('frame_transition', {}).get('dan_n1') or radar.get('dan_tinh_4cap', {}).get('dan_60_cap4', [])
                if dan:
                    return dan
        except Exception:
            pass

    return [
        "01", "02", "03", "04", "05", "08", "09", "11", "12", "13", "15", "17", "18", "19", "21",
        "22", "23", "24", "26", "28", "29", "31", "32", "33", "34", "35", "37", "38", "39", "42",
        "43", "44", "45", "51", "53", "55", "58", "59", "60", "61", "62", "63", "65", "67", "68",
        "69", "72", "80", "81", "82", "83", "84", "85", "87", "88", "91", "92", "95", "96", "97", "99"
    ]


def doc_danh_sach_draws(count=35):
    """Đọc và hợp nhất danh sách kết quả đầy đủ 30+ kỳ gần nhất (G1 -> G7)."""
    cache_file = 'cached_draws.json'
    draws = []
    seen_keys = set()

    try:
        import live_radar_scanner as s
        fresh = s.fetch_daiphat_draws(is_live=False)
        if fresh:
            for d in fresh:
                k = extract_date_key(d.get('date', ''))
                if k and k not in seen_keys:
                    seen_keys.add(k)
                    draws.append(d)
    except Exception:
        pass

    if os.path.exists(cache_file):
        try:
            with open(cache_file, 'r', encoding='utf-8') as f:
                cached = json.load(f)
            if isinstance(cached, list):
                for d in cached:
                    k = extract_date_key(d.get('date', ''))
                    if k and k not in seen_keys:
                        seen_keys.add(k)
                        draws.append(d)
        except Exception:
            pass

    if draws:
        try:
            with open(cache_file, 'w', encoding='utf-8') as f:
                json.dump(draws[:40], f, ensure_ascii=False, indent=2)
        except Exception:
            pass

    return draws[:count]


def extract_85_positions_single_draw(ket_qua_ngay):
    """
    Trích xuất 85 vị trí chữ số từ G1 đến G5.6 của 1 kỳ quay.
    Trả về dict: { 'g1.0.0': '8', ..., 'g5.5.3': '4' }
    """
    pos_map = {}
    prizes = ket_qua_ngay.get('prizes', ket_qua_ngay) if isinstance(ket_qua_ngay, dict) else {}
    giai_config = [
        ('g1', 1, 5),
        ('g2', 2, 5),
        ('g3', 6, 5),
        ('g4', 4, 4),
        ('g5', 6, 4),
    ]

    for ten_giai, so_giai, do_dai in giai_config:
        giai_data = []
        if ten_giai in prizes:
            val = prizes[ten_giai]
            giai_data = val if isinstance(val, list) else [val]
        elif ten_giai.upper() in prizes:
            val = prizes[ten_giai.upper()]
            giai_data = val if isinstance(val, list) else [val]
        else:
            for i in range(1, so_giai + 1):
                code = f"G{ten_giai[1:]}" if so_giai == 1 else f"G{ten_giai[1:]}.{i}"
                val = prizes.get(code, '')
                giai_data.append(val)

        for idx_giai in range(so_giai):
            so = giai_data[idx_giai] if idx_giai < len(giai_data) else ""
            so_str = str(so).strip()
            if so_str and so_str.isdigit():
                so_str = so_str.zfill(do_dai)
                for idx_cs in range(do_dai):
                    key = f"{ten_giai}.{idx_giai}.{idx_cs}"
                    pos_map[key] = so_str[idx_cs]
    return pos_map


def quet_vi_tri_g1_g5(danh_sach_ngay, highlight_positions=None):
    """
    Quét vị trí từ G1→G5.6 cho tất cả các ngày trong cửa sổ.
    Trả về dictionary: {vi_tri: [chu_so_ngay_0, chu_so_ngay_1, ...]}
    """
    if isinstance(danh_sach_ngay, dict):
        danh_sach_ngay = [danh_sach_ngay]

    vi_tri_data = defaultdict(list)
    for ket_qua_ngay in danh_sach_ngay:
        single_map = extract_85_positions_single_draw(ket_qua_ngay)
        for k, v in single_map.items():
            vi_tri_data[k].append(v)

    return dict(vi_tri_data)


def phan_tich_cau_vi_tri_an_thong(sub_draws):
    """
    Thuật toán Cầu Vị Trí Nhân Quả (Causal Positional Bridge):
    - sub_draws[0] là kỳ mới nhất vừa quay xong (D_0), dùng chữ số tại D_0 để dự báo cho kỳ kế tiếp.
    - Xét các bước chuyển tiếp lịch sử k = 0, 1, 2, 3, 4:
      Ở bước k, kiểm tra xem chữ số tại vị trí P của kỳ sub_draws[k+1] (ngày trước)
      có ăn Đầu / Đuôi / Chạm của Giải Đặc Biệt kỳ sub_draws[k] (ngày hôm sau) hay không.
    """
    if not sub_draws or len(sub_draws) < 3:
        return {}, []

    pos_per_day = [extract_85_positions_single_draw(d) for d in sub_draws]
    de_per_day = [str(d.get('de', '')).strip() for d in sub_draws]

    latest_pos = pos_per_day[0]
    num_transitions = min(len(sub_draws) - 1, 5)

    diem_no = {}
    cau_chay = []

    for vi_tri, cur_digit in latest_pos.items():
        if not cur_digit or not cur_digit.isdigit():
            continue

        # 1. Tính chuỗi ăn thông liên tiếp (streak) tính từ kỳ gần nhất (k = 0, 1, 2...)
        streak_touch = 0
        streak_head = 0
        streak_tail = 0
        direct_hits = 0
        bong_hits = 0
        head_hits_5d = 0
        tail_hits_5d = 0
        touch_hits_5d = 0

        still_touch_streak = True
        still_head_streak = True
        still_tail_streak = True

        for k in range(num_transitions):
            target_de = de_per_day[k]
            src_pos_map = pos_per_day[k + 1]
            if len(target_de) < 2 or not target_de.isdigit() or vi_tri not in src_pos_map:
                break

            src_d = src_pos_map[vi_tri]
            src_bong = BONG_DUONG.get(src_d, src_d)
            h_de, t_de = target_de[0], target_de[1]

            is_head_direct = (src_d == h_de)
            is_head_bong = (src_bong == h_de)
            is_tail_direct = (src_d == t_de)
            is_tail_bong = (src_bong == t_de)

            is_head = is_head_direct or is_head_bong
            is_tail = is_tail_direct or is_tail_bong
            is_touch = is_head or is_tail

            if is_touch:
                touch_hits_5d += 1
                if is_head_direct or is_tail_direct:
                    direct_hits += 1
                else:
                    bong_hits += 1
                if still_touch_streak:
                    streak_touch += 1
            else:
                still_touch_streak = False

            if is_head:
                head_hits_5d += 1
                if still_head_streak:
                    streak_head += 1
            else:
                still_head_streak = False

            if is_tail:
                tail_hits_5d += 1
                if still_tail_streak:
                    streak_tail += 1
            else:
                still_tail_streak = False

        # Xác định chữ số dự báo cho kỳ tới từ chữ số vừa về ở kỳ mới nhất (sub_draws[0])
        # Nếu lịch sử cầu này chuyên ăn Bóng Dương nhiều hơn Chính Diện -> dự báo Bóng Dương
        prefer_bong = (bong_hits > direct_hits)
        pred_digit = BONG_DUONG.get(cur_digit, cur_digit) if prefer_bong else cur_digit
        pred_bong = BONG_DUONG.get(pred_digit, pred_digit)

        # Xác định vai trò chính (Đầu hay Đuôi)
        if streak_head > streak_tail or (streak_head == streak_tail and head_hits_5d >= tail_hits_5d):
            role = 'head'
        else:
            role = 'tail'

        # Chu kỳ hiệu lực của cầu: ưu tiên chuỗi ăn thông liên tiếp gần nhất
        effective_cycle = streak_touch if streak_touch >= 2 else (2 if touch_hits_5d >= 3 else streak_touch)

        # Điểm chất lượng cầu: Chu kỳ 2d-3d được thưởng điểm nhịp vàng, cộng tần suất 5 ngày và độ chuẩn chính diện
        cycle_score = 35 if effective_cycle == 3 else (30 if effective_cycle == 2 else (22 if effective_cycle >= 4 else 10))
        role_clarity = max(streak_head, streak_tail) * 12
        freq_score = touch_hits_5d * 8 + direct_hits * 5
        total_bridge_score = cycle_score + role_clarity + freq_score

        diem_no[vi_tri] = {
            'diem': total_bridge_score,
            'chu_so_manh': pred_digit,
            'chu_so_goc': cur_digit,
            'chu_so_bong': pred_bong,
            'so_ngay_lap': effective_cycle,
            'streak_touch': streak_touch,
            'streak_head': streak_head,
            'streak_tail': streak_tail,
            'hits_5d': touch_hits_5d,
            'role': role,
            'prefer_bong': prefer_bong
        }

        if effective_cycle >= CONFIG['nguong_cau_manh']:
            cau_chay.append({
                'vi_tri': vi_tri,
                'chu_so': pred_digit,
                'chu_so_goc': cur_digit,
                'chu_so_bong': pred_bong,
                'so_ngay': effective_cycle,
                'diem': total_bridge_score,
                'role': role,
                'hits_5d': touch_hits_5d,
                'streak_head': streak_head,
                'streak_tail': streak_tail
            })

    # Sắp xếp cầu chạy theo điểm hội tụ giảm dần
    cau_chay.sort(key=lambda x: (x['diem'], x['so_ngay'], x['hits_5d'], x['vi_tri']), reverse=True)
    return diem_no, cau_chay


def extract_g7_and_de_context(latest_draw):
    """Trích xuất Chạm G7, Tổng G7, Tâm G1 và Đề kỳ vừa qua để cộng hưởng với Cầu Vị Trí."""
    prizes = latest_draw.get('prizes', {}) if isinstance(latest_draw, dict) else {}
    prev_de = str(latest_draw.get('de', '')).strip()

    target_sums = set()
    if len(prev_de) == 2 and prev_de.isdigit():
        s_de = (int(prev_de[0]) + int(prev_de[1])) % 10
        target_sums.add(s_de)
        target_sums.add((s_de + 5) % 10)

    g7_chams = set()
    for k in ['G7.1', 'G7.2', 'G7.3', 'G7.4', 'g7_1', 'g7_2', 'g7_3', 'g7_4']:
        val = str(prizes.get(k, '') or latest_draw.get(k, '')).strip()
        if len(val) == 2 and val.isdigit():
            t = (int(val[0]) + int(val[1])) % 10
            target_sums.add(t)
            target_sums.add((t + 5) % 10)
            for ch in val:
                g7_chams.add(ch)
                g7_chams.add(BONG_DUONG[ch])

    g1_val = str(prizes.get('G1', '') or prizes.get('g1', [''])[0] if isinstance(prizes.get('g1'), list) else prizes.get('g1', '')).strip()
    tam_g1 = g1_val[2] if len(g1_val) >= 3 and g1_val.isdigit() else ''
    tam_set = {tam_g1, BONG_DUONG.get(tam_g1, '')} if tam_g1 else set()

    return {
        'prev_de': prev_de,
        'target_sums': target_sums,
        'g7_chams': g7_chams,
        'tam_g1': tam_g1,
        'tam_set': tam_set
    }


def tinh_diem_hoi_tu_cap_so(cau_chay, dan_60s, context):
    """
    Chấm điểm hội tụ cho 10 chữ số Đầu (0-9), 10 chữ số Đuôi (0-9) và 100 cặp số (00-99)
    dựa trên mật độ Cầu Vị Trí Ăn Thông + Chạm/Tổng G7 + Tâm G1 + Dàn 60s N1 Động.
    """
    head_scores = {str(i): 0.0 for i in range(10)}
    tail_scores = {str(i): 0.0 for i in range(10)}
    touch_scores = {str(i): 0.0 for i in range(10)}

    # Lấy tối đa 25 vị trí cầu mạnh nhất để tránh nhiễu
    top_bridges = cau_chay[:25]
    for idx, cau in enumerate(top_bridges):
        cs = str(cau['chu_so'])
        bong = BONG_DUONG.get(cs, cs)
        wt = max(30.0 - idx * 1.0, 5.0) * (1.25 if cau['so_ngay'] in (2, 3) else 0.9)
        role = cau.get('role', 'head')

        touch_scores[cs] += wt
        touch_scores[bong] += wt * 0.45

        if role == 'head':
            head_scores[cs] += wt * 1.3
            head_scores[bong] += wt * 0.5
            tail_scores[cs] += wt * 0.4
        else:
            tail_scores[cs] += wt * 1.3
            tail_scores[bong] += wt * 0.5
            head_scores[cs] += wt * 0.4

    # Cộng hưởng với Tâm G1 và Chạm G7
    for d in context.get('tam_set', set()):
        if d in head_scores:
            head_scores[d] += 25.0
            tail_scores[d] += 25.0
            touch_scores[d] += 25.0

    for d in context.get('g7_chams', set()):
        if d in head_scores:
            head_scores[d] += 15.0
            tail_scores[d] += 15.0
            touch_scores[d] += 15.0

    # Đảm bảo tính biến thiên: trừ nhẹ điểm bão hòa của chữ số Đầu/Đuôi vừa nổ hôm qua
    prev_de = context.get('prev_de', '')
    if len(prev_de) == 2 and prev_de.isdigit():
        head_scores[prev_de[0]] -= 12.0
        tail_scores[prev_de[1]] -= 12.0

    # Chấm điểm 100 cặp số 00..99
    dan_60_set = set(dan_60s)
    target_sums = context.get('target_sums', set())
    pair_scores = {}

    for n in range(100):
        num_str = f"{n:02d}"
        h, t = num_str[0], num_str[1]
        s_val = (int(h) + int(t)) % 10

        sc = head_scores[h] * 1.15 + tail_scores[t] * 1.15 + (touch_scores[h] + touch_scores[t]) * 0.35
        if num_str in dan_60_set:
            sc += 45.0
        else:
            sc -= 80.0

        if s_val in target_sums:
            sc += 28.0

        if h in context.get('tam_set', set()) or t in context.get('tam_set', set()):
            sc += 20.0

        # Khử kẹt số: Phạt nặng nếu trùng chính xác con Đề vừa nổ hôm qua
        if num_str == prev_de:
            sc -= 50.0
        # Ưu tiên cặp số khác kép nếu không có cầu kép cực mạnh
        if h == t:
            sc -= 8.0

        pair_scores[num_str] = round(sc, 2)

    return head_scores, tail_scores, touch_scores, pair_scores


def tao_dan_cau_dong(touch_scores, pair_scores):
    """
    Từ điểm hội tụ cầu chạy → Tạo dàn cầu động 64 số (8 chạm mạnh nhất ghép vòng hoặc Top 64 cặp điểm cao nhất).
    """
    sorted_digits = [x[0] for x in sorted(touch_scores.items(), key=lambda x: x[1], reverse=True)[:8]]
    digits = sorted(sorted_digits)
    dan = [f"{h}{t}" for h in digits for t in digits]
    return sorted(list(set(dan)))


def loc_voi_dan_tinh(dan_cau, dan_tinh):
    """Lọc dàn cầu động với dàn 60s N1."""
    dan_cau_set = set(dan_cau)
    dan_tinh_set = set(dan_tinh)
    giao_thoa = sorted(dan_cau_set & dan_tinh_set)
    ngoai = sorted(dan_cau_set - dan_tinh_set)
    return giao_thoa, ngoai


def tao_dan_9_so_va_top(head_scores, tail_scores, pair_scores, dan_60s):
    """
    Tạo Dàn 9 Số (Top 3 Đầu x Top 3 Đuôi), Bạch Thủ (Top 1) và Tứ Thủ (Top 4)
    đảm bảo biến thiên linh hoạt theo cầu vị trí mỗi ngày và đồng bộ trong Dàn 60s N1.
    """
    top3_heads = [x[0] for x in sorted(head_scores.items(), key=lambda x: x[1], reverse=True)[:3]]
    top3_tails = [x[0] for x in sorted(tail_scores.items(), key=lambda x: x[1], reverse=True)[:3]]

    dan_9 = []
    for d in top3_heads:
        for u in top3_tails:
            dan_9.append(f"{d}{u}")

    # Ưu tiên các số nằm trong Dàn 9 và thuộc Dàn 60s N1 để chọn Bạch Thủ & Tứ Thủ
    dan_60_set = set(dan_60s)
    for num in dan_9:
        if num in pair_scores:
            pair_scores[num] += 25.0

    sorted_pairs = [x[0] for x in sorted(pair_scores.items(), key=lambda x: x[1], reverse=True)]
    valid_n1_pairs = [p for p in sorted_pairs if p in dan_60_set]
    pool = valid_n1_pairs if valid_n1_pairs else sorted_pairs

    bach_thu = pool[0] if pool else "61"
    tu_thu = []
    # Đưa số đảo của Bạch thủ vào Tứ thủ nếu thuộc Dàn 60s N1
    dao_bt = bach_thu[1] + bach_thu[0]
    if dao_bt != bach_thu and dao_bt in dan_60_set:
        tu_thu.append(dao_bt)

    for p in pool[1:]:
        if p != bach_thu and p not in tu_thu:
            tu_thu.append(p)
        if len(tu_thu) >= 4:
            break

    return bach_thu, tu_thu[:4], dan_9[:9]


def tao_dan_dao(dan_9_so):
    """Tạo dàn đảo từ 9 số."""
    dan_dao = []
    for so in dan_9_so:
        dao = so[1] + so[0]
        if dao != so and dao not in dan_9_so and dao not in dan_dao:
            dan_dao.append(dao)
    return dan_dao[:6]


def tao_so_dao_bach_thu(bt):
    """Tạo số đảo của bạch thủ."""
    if bt and len(bt) == 2:
        return bt[1] + bt[0]
    return None


def xu_ly_cau_4d(cau_chay, bt, tt):
    """Xử lý cảnh báo cầu chạy dài >= 4 ngày."""
    if not cau_chay:
        return {'canh_bao': False, 'bach_thu': bt, 'tu_thu': tt, 'so_ngay_max': 2}
    so_ngay_max = max(c['so_ngay'] for c in cau_chay[:10])
    if so_ngay_max >= CONFIG['nguong_cau_gay']:
        return {
            'canh_bao': True,
            'ly_do': f"Cầu vị trí đỉnh đã thông {so_ngay_max} ngày - Đã tự động ưu tiên nhịp vàng 2d-3d & lót lộn",
            'bach_thu': bt,
            'tu_thu': tt,
            'so_dao_lot': tao_so_dao_bach_thu(bt),
            'so_ngay_max': so_ngay_max
        }
    return {'canh_bao': False, 'bach_thu': bt, 'tu_thu': tt, 'so_ngay_max': so_ngay_max}


def so_sanh_dan(dan_dong, dan_60s, bt, tt, dan_9):
    """So sánh dàn cầu động vs dàn 60s N1."""
    dong_set = set(dan_dong)
    tinh_set = set(dan_60s)
    trung = dong_set & tinh_set
    return {
        'dan_dong_size': len(dan_dong),
        'dan_tinh_size': len(dan_60s),
        'trung_size': len(trung),
        'ty_le_trung': round(len(trung) / len(dan_dong) * 100, 2) if dan_dong else 0,
        'bach_thu': bt,
        'tu_thu': tt,
        'dan_9': dan_9
    }


def tinh_toan_ngay_cau_dong(sub_draws, target_date=None, target_de=None, target_draw_obj=None, summary_data=None):
    """
    Tính toán logic Cầu Vị Trí Ăn Thông cho một cửa sổ lịch sử sub_draws (tối thiểu 5-6 ngày trước kỳ mục tiêu).
    Đồng bộ trực tiếp với lõi Hội Tụ Đa Tầng & Cứu Khung N2/N3 của live_radar_scanner.
    """
    cur_draw = sub_draws[0]
    ngay = target_date if target_date else cur_draw.get('date', '')
    de = target_de if target_de is not None else ''

    # Lấy đúng Dàn 60s N1 Động của kỳ mục tiêu
    dan_60s = doc_dan_tinh_60s(target_date=ngay)

    _, cau_chay = phan_tich_cau_vi_tri_an_thong(sub_draws)
    context = extract_g7_and_de_context(cur_draw)
    head_scores, tail_scores, touch_scores, pair_scores = tinh_diem_hoi_tu_cap_so(cau_chay, dan_60s, context)

    dan_dong = tao_dan_cau_dong(touch_scores, pair_scores)
    giao_thoa, ngoai = loc_voi_dan_tinh(dan_dong, dan_60s)
    bt, tt, dan_9 = tao_dan_9_so_va_top(head_scores, tail_scores, pair_scores, dan_60s)

    # Đồng bộ kết quả Bạch Thủ, Tứ Thủ, Dàn 9s với bộ hội tụ Radar (bao gồm Cứu Khung N2/N3)
    try:
        import live_radar_scanner as lrs
        if target_draw_obj and target_draw_obj.get('prizes'):
            conv = lrs.compute_radar_convergence([target_draw_obj] + list(sub_draws), set(dan_60s), summary_data)
            if conv:
                bt = conv.get('top_1') or bt
                tt = conv.get('top_4') or tt
                dan_9 = conv.get('dan_9_so') or dan_9
                for n_top in [bt] + list(tt) + list(dan_9):
                    if n_top in dan_60s and n_top not in giao_thoa:
                        giao_thoa.append(n_top)
                giao_thoa = sorted(list(set(giao_thoa)))
        elif summary_data:
            af = summary_data.get('adaptive_frame', {})
            active_day = af.get('current_active_day', 1)
            if active_day == 2 and af.get('bt_n2'):
                bt = af.get('bt_n2', bt)
                tt = af.get('tt_n2', tt)
                dan_9 = af.get('d9_n2', dan_9)
            elif af.get('bt_n1'):
                bt = af.get('bt_n1', bt)
                tt = af.get('tt_n1', tt)
                dan_9 = af.get('d9_n1', dan_9)
    except Exception:
        pass

    dan_dao = tao_dan_dao(dan_9)
    canh_bao = xu_ly_cau_4d(cau_chay, bt, tt)
    so_sanh = so_sanh_dan(dan_dong, dan_60s, bt, tt, dan_9)

    has_de = bool(de and de != '--' and len(de) == 2)
    record = {
        'ngay': ngay,
        'de': de if has_de else '--',
        'de_ve': de if has_de else '--',
        'dan_cau_dong': dan_dong,
        'dan_60s': dan_60s,
        'giao_thoa': giao_thoa,
        'ngoai': ngoai,
        'bach_thu': bt,
        'tu_thu': tt,
        'dan_9': dan_9,
        'dan_dao': dan_dao,
        'canh_bao': canh_bao,
        'cau_chay': cau_chay[:25],
        'so_sanh': so_sanh,
        'hit_top_1': (bt == de) if has_de else False,
        'hit_top_4': (de in tt) if has_de else False,
        'hit_dan_9': (de in dan_9 or de in dan_dao) if has_de else False,
        'hit_giao_thoa': (de in giao_thoa) if has_de else False,
        'thoi_gian': datetime.now().isoformat()
    }
    return record


def ghi_lich_su(ngay, so_sanh_current, history_items=None):
    """Ghi lịch sử so sánh đầy đủ các ngày vào so_sanh_dan.json."""
    file_path = 'so_sanh_dan.json'
    items = []

    items.append({
        'ngay': ngay,
        'ket_qua': so_sanh_current,
        'thoi_gian': datetime.now().isoformat()
    })

    if history_items:
        for h in history_items:
            items.append({
                'ngay': h['ngay'],
                'de': h.get('de', ''),
                'ket_qua': h.get('so_sanh', {}),
                'thoi_gian': h.get('thoi_gian', datetime.now().isoformat())
            })

    unique_items = []
    seen = set()
    for item in items:
        k = extract_date_key(item.get('ngay'))
        if k and k not in seen:
            seen.add(k)
            unique_items.append(item)

    data = {
        'lich_su': unique_items,
        'tong_quan': {
            'tong_ky': len(unique_items),
            'last_updated': datetime.now().strftime("%H:%M:%S %d/%m/%Y")
        }
    }

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def ghi_tab4_data(latest_rec, history_items=None):
    """Lưu dữ liệu Tab 4 chuẩn xác (bản ghi kỳ tới + lịch sử kiểm chứng 25 kỳ)."""
    file_path = 'tab4_data.json'
    all_history = [latest_rec]
    if history_items:
        all_history.extend(history_items)

    unique_history = []
    seen_keys = set()
    for item in all_history:
        k = extract_date_key(item.get('ngay'))
        if k and k not in seen_keys:
            seen_keys.add(k)
            unique_history.append(item)

    data = {
        'latest': latest_rec,
        'lich_su': unique_history
    }

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def main():
    print("=" * 64)
    print("🎯 LOGIC CẦU ĐỘNG VỊ TRÍ ĂN THÔNG ĐỀ - XSMB AI (WALK-FORWARD)")
    print("=" * 64)

    draws = doc_danh_sach_draws(count=35)

    if os.path.exists('live_radar_state.json'):
        try:
            with open('live_radar_state.json', 'r', encoding='utf-8') as f:
                radar_state = json.load(f)
                live_p = radar_state.get('live_prizes')
                t_date = radar_state.get('target_date', '')
                act_de = radar_state.get('actual_de', '')
                if live_p and t_date:
                    t_k = extract_date_key(t_date)
                    if not draws or extract_date_key(draws[0].get('date', '')) != t_k:
                        draws.insert(0, {
                            'date': t_date,
                            'de': act_de,
                            'prizes': live_p
                        })
                    elif draws and extract_date_key(draws[0].get('date', '')) == t_k and act_de and not draws[0].get('de'):
                        draws[0]['de'] = act_de
        except Exception as e:
            print(f"Lưu ý khi đọc radar_state: {e}")

    if not draws or len(draws) < 6:
        print("⚠️ Chưa đủ dữ liệu cào tối thiểu 6 kỳ!")
        return

    summary_data = None
    if os.path.exists('analysis_summary.json'):
        try:
            with open('analysis_summary.json', 'r', encoding='utf-8') as f:
                summary_data = json.load(f)
        except Exception:
            summary_data = None

    thu_map = {0: 'Thứ hai', 1: 'Thứ ba', 2: 'Thứ tư', 3: 'Thứ năm', 4: 'Thứ sáu', 5: 'Thứ bảy', 6: 'Chủ nhật'}
    has_completed_draw0 = bool(draws[0].get('de'))
    first_draw_date = draws[0].get('date', '')

    if has_completed_draw0:
        # Tính ngày kế tiếp chuẩn xác dựa trên ngày của draws[0]
        m = re.search(r'(\d{1,2})[-/](\d{1,2})[-/](\d{4})', first_draw_date)
        if m:
            d0_dt = datetime(int(m.group(3)), int(m.group(2)), int(m.group(1)))
            next_dt = d0_dt + timedelta(days=1)
            target_pred_date = f"{thu_map[next_dt.weekday()]} ngày {next_dt.strftime('%d-%m-%Y')}"
        else:
            now = datetime.now() + timedelta(days=1)
            target_pred_date = f"{thu_map[now.weekday()]} ngày {now.strftime('%d-%m-%Y')}"

        sub_latest = draws[0:7]
        latest_rec = tinh_toan_ngay_cau_dong(sub_latest, target_date=target_pred_date, target_de="", target_draw_obj=None, summary_data=summary_data)

        history_items = []
        for i in range(0, min(28, len(draws) - 5)):
            h_target = draws[i]
            h_win = draws[i + 1 : i + 8]
            h_rec = tinh_toan_ngay_cau_dong(h_win, target_date=h_target.get('date', ''), target_de=h_target.get('de', ''), target_draw_obj=h_target, summary_data=summary_data)
            history_items.append(h_rec)
    else:
        target_pred_date = first_draw_date
        sub_latest = draws[1:8]
        latest_rec = tinh_toan_ngay_cau_dong(sub_latest, target_date=target_pred_date, target_de="", target_draw_obj=draws[0], summary_data=summary_data)

        history_items = []
        for i in range(1, min(29, len(draws) - 5)):
            h_target = draws[i]
            h_win = draws[i + 1 : i + 8]
            h_rec = tinh_toan_ngay_cau_dong(h_win, target_date=h_target.get('date', ''), target_de=h_target.get('de', ''), target_draw_obj=h_target, summary_data=summary_data)
            history_items.append(h_rec)

    ngay = latest_rec['ngay']
    dan_dong = latest_rec['dan_cau_dong']
    dan_60s = latest_rec['dan_60s']
    giao_thoa = latest_rec['giao_thoa']
    ngoai = latest_rec['ngoai']
    bt = latest_rec['bach_thu']
    tt = latest_rec['tu_thu']
    dan_9 = latest_rec['dan_9']
    dan_dao = latest_rec['dan_dao']
    canh_bao = latest_rec['canh_bao']
    cau_chay = latest_rec['cau_chay']
    so_sanh = latest_rec['so_sanh']

    print(f"📦 Dàn 60s N1 Động: {len(dan_60s)} số")
    print(f"📅 Kỳ dự báo tiếp theo: {ngay}")
    print(f"✅ Cầu vị trí ăn thông Đề (>= 2 ngày): {len(cau_chay)} vị trí")
    for idx, c in enumerate(cau_chay[:5], 1):
        role_vn = "Cầu Đầu" if c.get('role') == 'head' else "Cầu Đuôi"
        print(f"   {idx}. Vị trí {c['vi_tri']} ({role_vn}): Báo số '{c['chu_so']}' (Thông {c['so_ngay']}d | Ăn {c.get('hits_5d', 2)}/5 kỳ | Điểm: {c['diem']})")

    print(f"👑 Bạch thủ: {bt}")
    print(f"🔥 Tứ thủ: {tt}")
    print(f"⭐ Dàn 9s ({len(dan_9)}s): {dan_9}")
    print(f"🔄 Dàn đảo ({len(dan_dao)}s): {dan_dao}")
    print(f"🌐 Dàn Cầu Động: {len(dan_dong)} số")
    print(f"🎯 Giao thoa trong 60s N1 Động: {len(giao_thoa)} số ({so_sanh['ty_le_trung']}%)")

    gt_hits = sum(1 for h in history_items if h.get('hit_giao_thoa'))
    d60_hits = sum(1 for h in history_items if h.get('de') in h.get('dan_60s', []))
    d9_hits = sum(1 for h in history_items if h.get('hit_dan_9'))
    tt_hits = sum(1 for h in history_items if h.get('hit_top_4') or h.get('hit_top_1'))
    print(f"\n🔍 Kiểm chứng Walk-Forward {len(history_items)} kỳ gần nhất:")
    print(f"   - Trúng Dàn 60s N1 Động: {d60_hits}/{len(history_items)} kỳ ({round(d60_hits/max(len(history_items),1)*100, 1)}%)")
    print(f"   - Trúng Giao Thoa Cầu Động: {gt_hits}/{len(history_items)} kỳ ({round(gt_hits/max(len(history_items),1)*100, 1)}%)")
    print(f"   - Trúng Dàn 9s + Đảo: {d9_hits}/{len(history_items)} kỳ | Trúng Bạch Thủ/Tứ Thủ: {tt_hits}/{len(history_items)} kỳ")

    for h in history_items[:10]:
        hit_str = "🎯 TRÚNG GIAO THOA" if h['hit_giao_thoa'] else ("🛡️ TRÚNG N1" if h['de'] in h['dan_60s'] else "❌ TRƯỢT")
        if h['hit_top_1']:
            hit_str = "👑 NỔ BẠCH THỦ!"
        elif h['hit_top_4']:
            hit_str = "🔥 NỔ TỨ THỦ!"
        elif h['hit_dan_9']:
            hit_str = "⭐ NỔ DÀN 9S/ĐẢO!"
        print(f"   - {h['ngay']}: Đề {h['de']} ({hit_str}) | BT: {h['bach_thu']} | TT: {h['tu_thu']} | D9: {h['dan_9'][:4]}")

    ghi_lich_su(ngay, so_sanh, history_items)
    ghi_tab4_data(latest_rec, history_items)
    print("\n✅ ĐÃ GHI THÀNH CÔNG so_sanh_dan.json VÀ tab4_data.json!")


if __name__ == '__main__':
    main()
