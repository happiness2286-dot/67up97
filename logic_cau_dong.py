# -*- coding: utf-8 -*-
"""
LOGIC CẦU ĐỘNG - XSMB AI SYSTEM
Tự động hóa theo phương pháp của người dùng
"""

import json
import os
import sys
from datetime import datetime
from collections import defaultdict

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


def quet_vi_tri_g1_g5(ket_qua_ngay, highlight_positions=None):
    """Quét vị trí từ G1→G5.6."""
    vi_tri_data = defaultdict(list)
    giai_list = ['g1', 'g2', 'g3', 'g4', 'g5']
    
    for ten_giai in giai_list:
        giai_data = ket_qua_ngay.get(ten_giai, [])
        if isinstance(giai_data, str):
            giai_data = [giai_data]
        for idx_giai, so in enumerate(giai_data):
            so_str = str(so).zfill(5 if ten_giai != 'g5' else 4)
            for idx_cs, cs in enumerate(so_str):
                key = f"{ten_giai}.{idx_giai}.{idx_cs}"
                g_code = f"G{ten_giai[1:]}.{idx_giai + 1}_{idx_cs + 1}"
                cycle = 1
                if highlight_positions and g_code in highlight_positions:
                    cycle = max(1, highlight_positions[g_code].get('cycle', 1))
                for _ in range(cycle):
                    vi_tri_data[key].append(cs)
    return dict(vi_tri_data)


def tinh_diem_no(vi_tri_data):
    """Tính điểm nổ cho từng vị trí."""
    diem_no = {}
    for vi_tri, cs_list in vi_tri_data.items():
        dem = defaultdict(int)
        for cs in cs_list:
            dem[cs] += 1
        max_diem = max(dem.values()) if dem else 0
        cs_manh = max(dem, key=dem.get) if dem else None
        diem_no[vi_tri] = {
            'diem': max_diem,
            'chu_so_manh': cs_manh,
            'so_ngay_lap': max_diem,
            'chi_tiet': dict(dem)
        }
    return diem_no


def xac_dinh_cau_chay(diem_no, nguong=2):
    """Xác định cầu đang chạy mạnh."""
    cau_chay = []
    for vi_tri, info in diem_no.items():
        if info['so_ngay_lap'] >= nguong:
            cau_chay.append({
                'vi_tri': vi_tri,
                'chu_so': info['chu_so_manh'],
                'so_ngay': info['so_ngay_lap'],
                'diem': info['diem']
            })
    cau_chay.sort(key=lambda x: x['so_ngay'], reverse=True)
    return cau_chay


def tao_dan_cau_dong(cau_chay):
    """Tạo dàn cầu động từ các vị trí."""
    dan_cau = set()
    chu_so_dau = set()
    chu_so_duoi = set()
    
    for cau in cau_chay:
        cs = cau['chu_so']
        if cs is None:
            continue
        chu_so_dau.add(cs)
        chu_so_duoi.add(cs)
        if cs in BONG_DUONG:
            bong = BONG_DUONG[cs]
            chu_so_dau.add(bong)
            chu_so_duoi.add(bong)
    
    for dau in sorted(chu_so_dau):
        for duoi in sorted(chu_so_duoi):
            dan_cau.add(f"{dau}{duoi}")
    
    return sorted(dan_cau)


def loc_voi_dan_tinh(dan_cau, dan_tinh):
    """Lọc dàn cầu với dàn tĩnh."""
    dan_cau_set = set(dan_cau)
    dan_tinh_set = set(dan_tinh)
    giao_thoa = sorted(dan_cau_set & dan_tinh_set)
    ngoai = sorted(dan_cau_set - dan_tinh_set)
    return giao_thoa, ngoai


def chon_bach_thu(cau_chay, dan_60s):
    """Chọn Bạch thủ từ vị trí sáng nhất."""
    if not cau_chay:
        return None
    vi_tri_sang = cau_chay[0]
    cs = vi_tri_sang['chu_so']
    if cs is None:
        return None
    ung_vien = [so for so in dan_60s if cs in so]
    if not ung_vien:
        return cs
    for so in ung_vien:
        if so[0] == so[1]:
            return so
    return ung_vien[0]


def chon_tu_thu(cau_chay, dan_60s, bach_thu):
    """Chọn Tứ thủ (không gồm BT)."""
    tu_thu = []
    for cau in cau_chay:
        cs = cau['chu_so']
        if cs is None:
            continue
        ung_vien = [so for so in dan_60s if cs in so and so != bach_thu]
        for so in ung_vien:
            if so not in tu_thu and so != bach_thu:
                tu_thu.append(so)
                break
        if len(tu_thu) >= 4:
            break
    return tu_thu[:4]


def tao_dan_9_so(cau_chay, dan_60s):
    """Tạo dàn 9 số từ Top 3 đầu + Top 3 đuôi."""
    dau_list = []
    duoi_list = []
    for cau in cau_chay:
        cs = cau['chu_so']
        if cs is None:
            continue
        if cs not in dau_list and len(dau_list) < 3:
            dau_list.append(cs)
        if cs not in duoi_list and len(duoi_list) < 3:
            duoi_list.append(cs)
    
    dan_9 = []
    for dau in dau_list:
        for duoi in duoi_list:
            so = f"{dau}{duoi}"
            if so in dan_60s:
                dan_9.append(so)
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
            'bach_thu': None,
            'tu_thu': tt,
            'so_dao_lot': tao_so_dao_bach_thu(bt)
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


def ghi_tab4_data(ngay, dan_dong, dan_60s, giao_thoa, ngoai, bt, tt, dan_9, dan_dao, canh_bao, cau_chay, so_sanh):
    """Ghi dữ liệu Tab 4 đầy đủ."""
    file_path = 'tab4_data.json'
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
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

    # Cập nhật hoặc thêm vào lich_su
    da_co = False
    for item in data['lich_su']:
        if item.get('ngay') == ngay:
            item.update(latest_record)
            da_co = True
            break
    if not da_co:
        data['lich_su'].insert(0, latest_record)

    # Nạp bổ sung các kỳ kiểm chứng thực tế từ live_radar_state.json nếu chưa đủ
    if os.path.exists('live_radar_state.json'):
        try:
            with open('live_radar_state.json', 'r', encoding='utf-8') as f:
                radar_state = json.load(f)
                hr_list = radar_state.get('history_records', [])
                for r in hr_list[:15]:
                    r_date = r.get('date', '')
                    if not r_date or any(x.get('ngay') == r_date for x in data['lich_su']):
                        continue
                    r_top1 = r.get('top_1', '')
                    r_top4 = r.get('top_4', [])
                    r_dan9 = r.get('dan_9_so', [])
                    r_de = r.get('de', '')
                    # Tính toán so sánh thực tế
                    data['lich_su'].append({
                        'ngay': r_date,
                        'de': r_de,
                        'bach_thu': r_top1,
                        'tu_thu': r_top4,
                        'dan_9': r_dan9,
                        'hit_top_1': r.get('hit_top_1', False),
                        'hit_top_4': r.get('hit_top_4', False),
                        'hit_dan_9': r.get('hit_dan_9', False),
                        'so_sanh': {
                            'dan_dong_size': len(dan_dong),
                            'dan_tinh_size': len(dan_60s),
                            'trung_size': len(giao_thoa),
                            'ty_le_trung': so_sanh['ty_le_trung'],
                            'bach_thu': r_top1,
                            'tu_thu': r_top4,
                            'dan_9': r_dan9
                        },
                        'thoi_gian': datetime.now().isoformat()
                    })
        except Exception as e:
            print(f"Lỗi nạp lịch sử từ radar: {e}")
    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def main():
    print("=" * 60)
    print("🎯 LOGIC CẦU ĐỘNG - XSMB AI SYSTEM")
    print("=" * 60)
    
    ngay = datetime.now().strftime('%d/%m/%Y')
    dan_60s = doc_dan_tinh_60s()
    print(f"📅 Ngày: {ngay}")
    print(f"📦 Dàn 60s N1: {len(dan_60s)} số")
    
    # 1. Đọc dữ liệu giải xổ từ live_radar_state.json nếu có, nếu không dùng kết quả mẫu
    ket_qua_ngay = None
    highlight_positions = None
    if os.path.exists('live_radar_state.json'):
        try:
            with open('live_radar_state.json', 'r', encoding='utf-8') as f:
                radar_state = json.load(f)
                ket_qua_ngay = radar_state.get('live_prizes')
                highlight_positions = radar_state.get('highlight_positions')
                target_date = radar_state.get('target_date', '')
                if target_date:
                    print(f"📡 Nạp dữ liệu giải từ live_radar_state.json ({target_date})")
        except Exception as e:
            print(f"Lỗi đọc live_radar_state.json: {e}")

    if not ket_qua_ngay:
        print("ℹ️ Dùng dữ liệu giải xổ chuẩn:")
        ket_qua_ngay = {
            'g1': ['82585'],
            'g2': ['24297', '13691'],
            'g3': ['09006', '92188', '16348', '26272', '60098', '01271'],
            'g4': ['9323', '6991', '2485', '0001'],
            'g5': ['6672', '3984', '2140', '5302', '3225', '6175'],
        }

    vi_tri = quet_vi_tri_g1_g5(ket_qua_ngay, highlight_positions)
    diem_no = tinh_diem_no(vi_tri)
    cau_chay = xac_dinh_cau_chay(diem_no, CONFIG['nguong_cau_manh'])
    
    print(f"✅ Cầu chạy mạnh (>= {CONFIG['nguong_cau_manh']} ngày): {len(cau_chay)} vị trí")
    for idx, c in enumerate(cau_chay[:5], 1):
        print(f"   {idx}. Vị trí {c['vi_tri']}: Chữ số '{c['chu_so']}' (Điểm: {c['diem']} - Chu kỳ {c['so_ngay']}d)")
    
    dan_dong = tao_dan_cau_dong(cau_chay)
    giao_thoa, ngoai = loc_voi_dan_tinh(dan_dong, dan_60s)
    
    bt = chon_bach_thu(cau_chay, dan_60s)
    tt = chon_tu_thu(cau_chay, dan_60s, bt)
    dan_9 = tao_dan_9_so(cau_chay, dan_60s)
    dan_dao = tao_dan_dao(dan_9)
    canh_bao = xu_ly_cau_4d(cau_chay, bt, tt)
    so_sanh = so_sanh_dan(dan_dong, dan_60s, bt, tt, dan_9)
    
    print(f"👑 Bạch thủ: {bt}")
    print(f"🔥 Tứ thủ: {tt}")
    print(f"⭐ Dàn 9s: {dan_9}")
    print(f"🔄 Dàn đảo: {dan_dao}")
    print(f"🌐 Dàn Cầu Động: {len(dan_dong)} số")
    print(f"🎯 Giao thoa trong 60s N1: {len(giao_thoa)} số ({so_sanh['ty_le_trung']}%)")
    print(f"🛡️ Ngoài 60s N1: {len(ngoai)} số")
    
    if canh_bao['canh_bao']:
        print(f"⚠️ {canh_bao['ly_do']}")
    else:
        print(f"🟢 Cầu chạy an toàn, chu kỳ cao nhất: {canh_bao.get('so_ngay_max', 2)}d")
    
    ghi_lich_su(ngay, so_sanh)
    ghi_tab4_data(ngay, dan_dong, dan_60s, giao_thoa, ngoai, bt, tt, dan_9, dan_dao, canh_bao, cau_chay, so_sanh)
    
    print("✅ ĐÃ GHI THÀNH CÔNG so_sanh_dan.json VÀ tab4_data.json!")


if __name__ == '__main__':
    main()
