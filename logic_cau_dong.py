# -*- coding: utf-8 -*-
"""
LOGIC CẦU ĐỘNG - XSMB AI SYSTEM
Tự động hóa theo phương pháp của người dùng
Phát hiện cầu chạy 2-3 ngày dựa trên dữ liệu 5 ngày gần nhất
"""

import json
import os
import sys
from datetime import datetime
from collections import defaultdict, Counter
import re

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


def doc_dan_tinh_60s(file_path='verified_history_data.json'):
    """Đọc dàn tĩnh 60 số N1."""
    if not os.path.exists(file_path):
        if os.path.exists('live_radar_state.json'):
            try:
                with open('live_radar_state.json', 'r', encoding='utf-8') as f:
                    radar = json.load(f)
                    return radar.get('dan_tinh_4cap', {}).get('dan_60_cap4', [])
            except Exception:
                pass
        return []

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        if isinstance(data, dict):
            def parse_d(k):
                try:
                    return datetime.strptime(k, '%d/%m/%Y')
                except Exception:
                    return datetime.min
            latest = max(data.keys(), key=parse_d)
            dan = data[latest].get('dan_n1', [])
            if dan:
                return dan
    except Exception as e:
        print(f"Lỗi đọc {file_path}: {e}")

    if os.path.exists('live_radar_state.json'):
        try:
            with open('live_radar_state.json', 'r', encoding='utf-8') as f:
                radar = json.load(f)
                return radar.get('dan_tinh_4cap', {}).get('dan_60_cap4', [])
        except Exception:
            pass

    return []


def doc_danh_sach_draws(count=25):
    """Đọc hoặc cào danh sách kết quả đầy đủ các kỳ gần nhất."""
    cache_file = 'cached_draws.json'
    draws = []

    # 1. Thử cào online trước nếu có module live_radar_scanner
    try:
        import live_radar_scanner as s
        html = s.fetch_html(is_live=False, count=count)
        if html:
            parsed = s.parse_draws(html)
            if parsed and len(parsed) >= 5:
                draws = parsed
                try:
                    with open(cache_file, 'w', encoding='utf-8') as f:
                        json.dump(draws, f, ensure_ascii=False, indent=2)
                except Exception:
                    pass
    except Exception:
        pass

    # 2. Nếu không cào được, đọc từ file cache
    if not draws and os.path.exists(cache_file):
        try:
            with open(cache_file, 'r', encoding='utf-8') as f:
                draws = json.load(f)
        except Exception:
            pass

    return draws


def quet_vi_tri_g1_g5(danh_sach_5_ngay, highlight_positions=None):
    """
    1. Quét vị trí từ G1→G5.6 cho TẤT CẢ các ngày trong danh sách (chuẩn 5 ngày gần nhất).
    Đầu vào: danh sách 5 ngày [ngay_1, ngay_2, ngay_3, ngay_4, ngay_5].
    Trả về dictionary: {vi_tri: [chu_so_ngay1, chu_so_ngay2, ...]}
    """
    if isinstance(danh_sach_5_ngay, dict):
        danh_sach_5_ngay = [danh_sach_5_ngay]

    vi_tri_data = defaultdict(list)
    giai_config = [
        ('g1', 1, 5),
        ('g2', 2, 5),
        ('g3', 6, 5),
        ('g4', 4, 4),
        ('g5', 6, 4),
    ]

    for ket_qua_ngay in danh_sach_5_ngay:
        prizes = ket_qua_ngay.get('prizes', ket_qua_ngay) if isinstance(ket_qua_ngay, dict) else {}

        for ten_giai, so_giai, do_dai in giai_config:
            giai_data = []
            if ten_giai in prizes:
                val = prizes[ten_giai]
                giai_data = val if isinstance(val, list) else [val]
            else:
                for i in range(1, so_giai + 1):
                    code = f"G{ten_giai[1:]}" if so_giai == 1 else f"G{ten_giai[1:]}.{i}"
                    val = prizes.get(code, '')
                    giai_data.append(val)

            for idx_giai in range(so_giai):
                so = giai_data[idx_giai] if idx_giai < len(giai_data) else ""
                so_str = str(so).zfill(do_dai) if so else ""
                for idx_cs in range(do_dai):
                    key = f"{ten_giai}.{idx_giai}.{idx_cs}"
                    cs = so_str[idx_cs] if idx_cs < len(so_str) else None
                    if cs is not None and cs.isdigit():
                        vi_tri_data[key].append(cs)

    return dict(vi_tri_data)


def tinh_diem_no(vi_tri_data):
    """
    2. Tính điểm nổ dựa trên 5 ngày.
    Điểm = số ngày lặp lại của cùng 1 chữ số tại 1 vị trí.
    Ví dụ: Nếu G3_3_3 có chữ số 0 trong 3 ngày → Điểm = 3.
    """
    diem_no = {}
    for vi_tri, cs_list in vi_tri_data.items():
        if not cs_list:
            continue
        dem = Counter(cs_list)
        cs_manh = None
        max_diem = 0
        for cs in cs_list:
            cnt = dem[cs]
            if cnt > max_diem:
                max_diem = cnt
                cs_manh = cs

        diem_no[vi_tri] = {
            'diem': max_diem,
            'chu_so_manh': cs_manh,
            'so_ngay_lap': max_diem,
            'chi_tiet': dict(dem)
        }
    return diem_no


def xac_dinh_cau_chay(diem_no, nguong=2):
    """
    3. Xác định cầu đang chạy mạnh.
    Chỉ lấy vị trí có điểm >= 2 (cầu chạy 2 ngày trở lên).
    Sắp xếp theo điểm giảm dần.
    """
    cau_chay = []
    for vi_tri, info in diem_no.items():
        if info['so_ngay_lap'] >= nguong and info['chu_so_manh'] is not None:
            cau_chay.append({
                'vi_tri': vi_tri,
                'chu_so': info['chu_so_manh'],
                'so_ngay': info['so_ngay_lap'],
                'diem': info['diem']
            })
    cau_chay.sort(key=lambda x: (x['diem'], x['so_ngay'], x['vi_tri']), reverse=True)
    return cau_chay


def tao_dan_cau_dong(cau_chay):
    """
    4. Từ cầu chạy → Tạo dàn cầu động.
    Lấy các chữ số mạnh nhất từ cầu chạy và bóng dương của chúng.
    Dàn này sẽ THAY ĐỔI mỗi ngày vì cầu thay đổi.
    """
    chu_so_tap = set()
    for cau in cau_chay:
        cs = cau.get('chu_so')
        if cs is None:
            continue
        chu_so_tap.add(cs)
        if cs in BONG_DUONG:
            chu_so_tap.add(BONG_DUONG[cs])
        if len(chu_so_tap) >= 8:
            break

    digits = sorted(list(chu_so_tap))
    dan = [f"{h}{t}" for h in digits for t in digits]
    return sorted(list(set(dan)))


def loc_voi_dan_tinh(dan_cau, dan_tinh):
    """Lọc dàn cầu với dàn tĩnh."""
    dan_cau_set = set(dan_cau)
    dan_tinh_set = set(dan_tinh)
    giao_thoa = sorted(dan_cau_set & dan_tinh_set)
    ngoai = sorted(dan_cau_set - dan_tinh_set)
    return giao_thoa, ngoai


def chon_bach_thu(cau_chay, dan_60s):
    """
    5. Bạch thủ = vị trí sáng nhất.
    """
    if not cau_chay:
        return None
    vi_tri_sang = cau_chay[0]
    cs = vi_tri_sang['chu_so']
    if cs is None:
        return None

    # Nếu có vị trí tiếp theo, thử ghép cs0 + cs1
    if len(cau_chay) > 1 and cau_chay[1].get('chu_so'):
        ghep = f"{cs}{cau_chay[1]['chu_so']}"
        if ghep in dan_60s:
            return ghep

    # Thử kép cs + cs
    kep = f"{cs}{cs}"
    if kep in dan_60s:
        return kep

    ung_vien = [so for so in dan_60s if cs in so]
    if not ung_vien:
        return kep
    for so in ung_vien:
        if so[0] == cs:
            return so
    return ung_vien[0]


def chon_tu_thu(cau_chay, dan_60s, bach_thu):
    """
    5. Tứ thủ = 4 vị trí tiếp theo.
    """
    tu_thu = []
    tiep_theo = cau_chay[1:]
    for cau in tiep_theo:
        cs = cau.get('chu_so')
        if cs is None:
            continue
        ung_vien = [so for so in dan_60s if cs in so and so != bach_thu and so not in tu_thu]
        so_chon = None
        for so in ung_vien:
            if so[0] == cs:
                so_chon = so
                break
        if not so_chon and ung_vien:
            so_chon = ung_vien[0]
        if so_chon:
            tu_thu.append(so_chon)
        if len(tu_thu) >= 4:
            break

    if len(tu_thu) < 4:
        for so in dan_60s:
            if so != bach_thu and so not in tu_thu:
                tu_thu.append(so)
            if len(tu_thu) >= 4:
                break
    return tu_thu[:4]


def tao_dan_9_so(cau_chay, dan_60s=None):
    """
    5. Dàn 9 = Top 3 đầu + Top 3 đuôi (3 x 3 = 9 số chuẩn cội nguồn).
    """
    dau_list = []
    for cau in cau_chay:
        cs = cau.get('chu_so')
        if cs is not None and cs not in dau_list:
            dau_list.append(cs)
        if len(dau_list) >= 3:
            break

    for cs in list(dau_list):
        if len(dau_list) >= 3:
            break
        bong = BONG_DUONG.get(cs)
        if bong and bong not in dau_list:
            dau_list.append(bong)

    for d in ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']:
        if len(dau_list) >= 3:
            break
        if d not in dau_list:
            dau_list.append(d)

    dau_list = dau_list[:3]
    duoi_list = list(dau_list)

    dan_9 = []
    for d in dau_list:
        for u in duoi_list:
            dan_9.append(f"{d}{u}")
    return dan_9[:9]


def tao_dan_dao(dan_9_so):
    """Tạo dàn đảo từ 9 số."""
    dan_dao = []
    for so in dan_9_so:
        dao = so[1] + so[0]
        if dao != so and dao not in dan_dao:
            dan_dao.append(dao)
    return dan_dao


def tao_so_dao_bach_thu(bt):
    """Tạo số đảo của bạch thủ."""
    if bt and len(bt) == 2:
        return bt[1] + bt[0]
    return None


def xu_ly_cau_4d(cau_chay, bt, tt):
    """Xử lý cầu 4d+."""
    if not cau_chay:
        return {'canh_bao': False, 'bach_thu': bt, 'tu_thu': tt}
    so_ngay_max = cau_chay[0]['so_ngay']
    if so_ngay_max >= CONFIG['nguong_cau_gay']:
        return {
            'canh_bao': True,
            'ly_do': f"Cầu đã chạy {so_ngay_max} ngày - Nguy cơ gãy",
            'bach_thu': bt,
            'tu_thu': tt,
            'so_dao_lot': tao_so_dao_bach_thu(bt),
            'so_ngay_max': so_ngay_max
        }
    return {'canh_bao': False, 'bach_thu': bt, 'tu_thu': tt, 'so_ngay_max': so_ngay_max}


def so_sanh_dan(dan_dong, dan_60s, bt, tt, dan_9):
    """So sánh dàn động vs dàn tĩnh."""
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


def ghi_lich_su(ngay, ket_qua):
    """Ghi lịch sử so sánh."""
    file_path = 'so_sanh_dan.json'
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    else:
        data = {'lich_su': [], 'tong_quan': {}}

    da_co = False
    for item in data['lich_su']:
        if item.get('ngay') == ngay:
            item['ket_qua'] = ket_qua
            item['thoi_gian'] = datetime.now().isoformat()
            da_co = True
            break
    if not da_co:
        data['lich_su'].insert(0, {
            'ngay': ngay,
            'ket_qua': ket_qua,
            'thoi_gian': datetime.now().isoformat()
        })
    data['tong_quan']['tong_ky'] = len(data['lich_su'])

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def extract_date_key(d_str):
    if not d_str:
        return ""
    m = re.search(r'(\d{1,2})[-/](\d{1,2})[-/](\d{4})', str(d_str))
    if m:
        return f"{int(m.group(1)):02d}-{int(m.group(2)):02d}-{m.group(3)}"
    return str(d_str).strip()


def ghi_tab4_data(ngay, dan_dong, dan_60s, giao_thoa, ngoai, bt, tt, dan_9, dan_dao, canh_bao, cau_chay, so_sanh, history_items=None):
    """
    6. Lưu dàn cầu động MỚI mỗi ngày.
    Không ghi đè dữ liệu cũ bừa bãi.
    """
    file_path = 'tab4_data.json'
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception:
            data = {'lich_su': []}
    else:
        data = {'lich_su': []}

    latest_record = {
        'ngay': ngay,
        'dan_cau_dong': dan_dong,
        'dan_60s': dan_60s,
        'giao_thoa': giao_thoa,
        'ngoai': ngoai,
        'bach_thu': bt,
        'tu_thu': tt,
        'dan_9': dan_9,
        'dan_dao': dan_dao,
        'canh_bao': canh_bao,
        'cau_chay': cau_chay,
        'so_sanh': so_sanh,
        'thoi_gian': datetime.now().isoformat()
    }

    data['latest'] = latest_record

    target_key = extract_date_key(ngay)
    # Cập nhật hoặc chèn bản ghi ngày hiện tại
    da_co = False
    for item in data['lich_su']:
        if extract_date_key(item.get('ngay')) == target_key:
            item.update(latest_record)
            da_co = True
            break
    if not da_co:
        data['lich_su'].insert(0, latest_record)

    # Nạp/Cập nhật các ngày lịch sử thực tế có tính toán đầy đủ dàn cầu động
    if history_items:
        for h in history_items:
            h_date = h.get('ngay')
            h_key = extract_date_key(h_date)
            if not h_key:
                continue
            # Tìm xem ngày này đã có trong lich_su chưa
            existing = None
            for item in data['lich_su']:
                if extract_date_key(item.get('ngay')) == h_key:
                    existing = item
                    break
            if existing:
                existing['ngay'] = h_date
                existing['dan_cau_dong'] = h.get('dan_cau_dong', existing.get('dan_cau_dong', []))
                existing['dan_60s'] = h.get('dan_60s', existing.get('dan_60s', []))
                existing['giao_thoa'] = h.get('giao_thoa', existing.get('giao_thoa', []))
                existing['ngoai'] = h.get('ngoai', existing.get('ngoai', []))
                existing['bach_thu'] = h.get('bach_thu', existing.get('bach_thu', ''))
                existing['tu_thu'] = h.get('tu_thu', existing.get('tu_thu', []))
                existing['dan_9'] = h.get('dan_9', existing.get('dan_9', []))
                existing['dan_dao'] = h.get('dan_dao', existing.get('dan_dao', []))
                existing['so_sanh'] = h.get('so_sanh', existing.get('so_sanh', {}))
                if 'cau_chay' in h:
                    existing['cau_chay'] = h['cau_chay']
                if 'de' in h:
                    existing['de'] = h['de']
                if 'hit_top_1' in h:
                    existing['hit_top_1'] = h['hit_top_1']
                if 'hit_top_4' in h:
                    existing['hit_top_4'] = h['hit_top_4']
                if 'hit_dan_9' in h:
                    existing['hit_dan_9'] = h['hit_dan_9']
            else:
                data['lich_su'].append(h)

    # Khử trùng lặp (deduplicate) trong lich_su
    unique_history = []
    seen_keys = set()
    for item in data['lich_su']:
        k = extract_date_key(item.get('ngay'))
        if k and k not in seen_keys:
            seen_keys.add(k)
            unique_history.append(item)
    data['lich_su'] = unique_history

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def tinh_toan_ngay_cau_dong(sub_5days, dan_60s):
    """Tính toán logic cầu động hoàn chỉnh cho một cửa sổ 5 ngày."""
    cur_draw = sub_5days[0]
    ngay = cur_draw.get('date', '')
    de = cur_draw.get('de', '')

    vtd = quet_vi_tri_g1_g5(sub_5days)
    diem_no = tinh_diem_no(vtd)
    cau_chay = xac_dinh_cau_chay(diem_no, CONFIG['nguong_cau_manh'])
    dan_dong = tao_dan_cau_dong(cau_chay)
    giao_thoa, ngoai = loc_voi_dan_tinh(dan_dong, dan_60s)

    bt = chon_bach_thu(cau_chay, dan_60s)
    tt = chon_tu_thu(cau_chay, dan_60s, bt)
    dan_9 = tao_dan_9_so(cau_chay, dan_60s)
    dan_dao = tao_dan_dao(dan_9)
    canh_bao = xu_ly_cau_4d(cau_chay, bt, tt)
    so_sanh = so_sanh_dan(dan_dong, dan_60s, bt, tt, dan_9)

    record = {
        'ngay': ngay,
        'de': de,
        'dan_cau_dong': dan_dong,
        'dan_60s': dan_60s,
        'giao_thoa': giao_thoa,
        'ngoai': ngoai,
        'bach_thu': bt,
        'tu_thu': tt,
        'dan_9': dan_9,
        'dan_dao': dan_dao,
        'canh_bao': canh_bao,
        'cau_chay': cau_chay,
        'so_sanh': so_sanh,
        'hit_top_1': (bt == de) if de else False,
        'hit_top_4': (de in tt) if de else False,
        'hit_dan_9': (de in dan_9) if de else False,
        'thoi_gian': datetime.now().isoformat()
    }
    return record


def main():
    print("=" * 60)
    print("🎯 LOGIC CẦU ĐỘNG - XSMB AI SYSTEM (CHUẨN 5 NGÀY GẦN NHẤT)")
    print("=" * 60)

    dan_60s = doc_dan_tinh_60s()
    print(f"📦 Dàn 60s N1: {len(dan_60s)} số")

    # 1. Đọc danh sách kết quả xổ số nhiều ngày (để lấy cửa sổ 5 ngày thực tế)
    draws = doc_danh_sach_draws(count=25)

    # Nếu có live_radar_state.json và có live_prizes hôm nay
    if os.path.exists('live_radar_state.json'):
        try:
            with open('live_radar_state.json', 'r', encoding='utf-8') as f:
                radar_state = json.load(f)
                live_p = radar_state.get('live_prizes')
                t_date = radar_state.get('target_date', '')
                if live_p and t_date:
                    if not draws or t_date not in draws[0].get('date', ''):
                        draws.insert(0, {
                            'date': t_date,
                            'de': radar_state.get('actual_de', ''),
                            'prizes': live_p
                        })
        except Exception as e:
            print(f"Lưu ý khi đọc radar_state: {e}")

    if not draws or len(draws) < 5:
        print("⚠️ Chưa đủ 5 ngày cào, nạp dữ liệu mẫu an toàn...")
        draws = [
            {
                'date': 'Thứ sáu ngày 02-10-2026', 'de': '83',
                'prizes': {'g1': ['48799'], 'g2': ['63906', '22370'], 'g3': ['92151', '85709', '96557', '45967', '17050', '35145'], 'g4': ['2719', '2206', '1575', '1644'], 'g5': ['8754', '3913', '4102', '5685', '9938', '3837']}
            },
            {
                'date': 'Thứ năm ngày 01-10-2026', 'de': '08',
                'prizes': {'g1': ['92635'], 'g2': ['10244', '59341'], 'g3': ['48530', '71042', '31698', '20158', '51336', '84013'], 'g4': ['3258', '4718', '2938', '5035'], 'g5': ['6123', '3554', '4209', '6305', '5552', '4314']}
            },
            {
                'date': 'Thứ tư ngày 30-09-2026', 'de': '42',
                'prizes': {'g1': ['82585'], 'g2': ['24297', '13691'], 'g3': ['09006', '92188', '16348', '26272', '60098', '01271'], 'g4': ['9323', '6991', '2485', '0001'], 'g5': ['6672', '3984', '2140', '5302', '3225', '6175']}
            },
            {
                'date': 'Thứ ba ngày 29-09-2026', 'de': '51',
                'prizes': {'g1': ['08389'], 'g2': ['72814', '46429'], 'g3': ['61403', '53225', '12186', '68865', '70733', '05305'], 'g4': ['0985', '7902', '1519', '9746'], 'g5': ['2966', '2437', '6169', '6077', '5155', '7323']}
            },
            {
                'date': 'Thứ hai ngày 28-09-2026', 'de': '15',
                'prizes': {'g1': ['86908'], 'g2': ['34512', '98124'], 'g3': ['12345', '67890', '54321', '98765', '13579', '24680'], 'g4': ['1122', '3344', '5566', '7788'], 'g5': ['9900', '1234', '5678', '9012', '3456', '7890']}
            }
        ]

    # Tính toán cho ngày mới nhất (Cửa sổ 5 ngày đầu tiên)
    sub_latest_5days = draws[0:5]
    latest_rec = tinh_toan_ngay_cau_dong(sub_latest_5days, dan_60s)

    ngay = latest_rec['ngay']
    dan_dong = latest_rec['dan_cau_dong']
    giao_thoa = latest_rec['giao_thoa']
    ngoai = latest_rec['ngoai']
    bt = latest_rec['bach_thu']
    tt = latest_rec['tu_thu']
    dan_9 = latest_rec['dan_9']
    dan_dao = latest_rec['dan_dao']
    canh_bao = latest_rec['canh_bao']
    cau_chay = latest_rec['cau_chay']
    so_sanh = latest_rec['so_sanh']

    print(f"📅 Ngày phân tích: {ngay}")
    print(f"✅ Cầu chạy mạnh (>= {CONFIG['nguong_cau_manh']} ngày): {len(cau_chay)} vị trí")
    for idx, c in enumerate(cau_chay[:5], 1):
        print(f"   {idx}. Vị trí {c['vi_tri']}: Chữ số '{c['chu_so']}' (Điểm nổ: {c['diem']} - Chu kỳ {c['so_ngay']}d)")

    print(f"👑 Bạch thủ: {bt}")
    print(f"🔥 Tứ thủ: {tt}")
    print(f"⭐ Dàn 9s ({len(dan_9)}s): {dan_9}")
    print(f"🔄 Dàn đảo ({len(dan_dao)}s): {dan_dao}")
    print(f"🌐 Dàn Cầu Động: {len(dan_dong)} số")
    print(f"🎯 Giao thoa trong 60s N1: {len(giao_thoa)} số ({so_sanh['ty_le_trung']}%)")
    print(f"🛡️ Ngoài 60s N1: {len(ngoai)} số")

    if canh_bao['canh_bao']:
        print(f"⚠️ {canh_bao['ly_do']}")
    else:
        print(f"🟢 Cầu chạy an toàn, chu kỳ cao nhất: {canh_bao.get('so_ngay_max', 2)}d")

    # Tính toán cho các ngày lịch sử qua sliding window 5 ngày
    history_items = []
    print("\n🔍 Đang tính toán kiểm chứng lịch sử qua các ngày:")
    for i in range(1, min(15, len(draws) - 4)):
        window = draws[i:i+5]
        h_rec = tinh_toan_ngay_cau_dong(window, dan_60s)
        history_items.append(h_rec)
        print(f"   - {h_rec['ngay']}: Dàn {len(h_rec['dan_cau_dong'])}s | BT: {h_rec['bach_thu']} | TT: {h_rec['tu_thu']} | D9 ({len(h_rec['dan_9'])}s) | Đề: {h_rec['de']}")

    # Ghi dữ liệu
    ghi_lich_su(ngay, so_sanh)
    ghi_tab4_data(ngay, dan_dong, dan_60s, giao_thoa, ngoai, bt, tt, dan_9, dan_dao, canh_bao, cau_chay, so_sanh, history_items)

    print("\n✅ ĐÃ GHI THÀNH CÔNG so_sanh_dan.json VÀ tab4_data.json!")


if __name__ == '__main__':
    main()
