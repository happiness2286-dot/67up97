# -*- coding: utf-8 -*-
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from datetime import datetime
from unittest.mock import patch

import live_radar_scanner as scanner

print("=" * 70)
print("🧪 KIỂM THỬ MÔ PHỎNG TOÀN BỘ CHU TRÌNH LIVE VÀ KHÓA CHỐT G5.5 / 18H23:30")
print("=" * 70)

prev_draw = {
    'date': 'Chủ nhật ngày 04-10-2026',
    'db': '82951',
    'de': '51',
    'prizes': {
        'G1': '28235',
        'G2.1': '82614', 'G2.2': '47824',
        'G3.1': '33386', 'G3.2': '23385', 'G3.3': '09503', 'G3.4': '43582', 'G3.5': '60243', 'G3.6': '04348',
        'G4.1': '2251', 'G4.2': '1053', 'G4.3': '3431', 'G4.4': '9308',
        'G5.1': '3969', 'G5.2': '7927', 'G5.3': '5509', 'G5.4': '2889', 'G5.5': '4781', 'G5.6': '1038'
    }
}

# --- TEST 1: Lúc 18h15: Chưa có giải nào ---
today_draw_empty = {
    'date': 'Thứ hai ngày 05-10-2026',
    'db': '',
    'de': '',
    'prizes': {}
}
with patch('live_radar_scanner.fetch_383_live', return_value=today_draw_empty), \
     patch('live_radar_scanner.fetch_daiphat_draws', return_value=[today_draw_empty, prev_draw]), \
     patch('live_radar_scanner.datetime') as mock_dt:
    mock_dt.now.return_value = datetime(2026, 10, 5, 18, 15, 5)
    mock_dt.side_effect = lambda *args, **kw: datetime(*args, **kw)
    st = scanner.scan_radar(is_live=True)
    print(f"\n1️⃣ Lúc 18h15:05 (Chưa có bóng)")
    print(f"   - filled_count: {st['filled_count']}/19")
    print(f"   - radar_status: {st['radar_status']}")
    print(f"   - is_locked: {st['is_locked']}")
    assert st['filled_count'] == 0
    assert st['is_locked'] == False
    assert st['radar_status'] == 'BEFORE_DRAW'
    print("   -> ✅ PASS: Trạng thái chờ quay an toàn.")

# --- TEST 2: Lúc 18h16:30 (Đã có G1 59714) ---
today_draw_g1 = {
    'date': 'Thứ hai ngày 05-10-2026',
    'db': '',
    'de': '',
    'prizes': {'G1': '59714'}
}
with patch('live_radar_scanner.fetch_383_live', return_value=today_draw_g1), \
     patch('live_radar_scanner.fetch_daiphat_draws', return_value=[today_draw_g1, prev_draw]), \
     patch('live_radar_scanner.datetime') as mock_dt:
    mock_dt.now.return_value = datetime(2026, 10, 5, 18, 16, 30)
    mock_dt.side_effect = lambda *args, **kw: datetime(*args, **kw)
    st = scanner.scan_radar(is_live=True)
    print(f"\n2️⃣ Lúc 18h16:30 (Có G1: 59714)")
    print(f"   - filled_count: {st['filled_count']}/19")
    print(f"   - radar_status: {st['radar_status']}")
    print(f"   - Tâm Càng G1: {st['cang_3d_live']['top3_cang']}")
    print(f"   - is_locked: {st['is_locked']}")
    assert st['filled_count'] == 1
    assert st['is_locked'] == False
    assert st['radar_status'] == 'SCANNING_LIVE'
    print("   -> ✅ PASS: Radar live kích hoạt, bắt được tâm càng G1.")

# --- TEST 3: Lúc 18h22:50 (Đang quay G5, có G5.5, chưa có G5.6) ---
prizes_g5_5 = {
    'G1': '59714',
    'G2.1': '70056', 'G2.2': '79568',
    'G3.1': '20816', 'G3.2': '60874', 'G3.3': '21577', 'G3.4': '85793', 'G3.5': '36546', 'G3.6': '43188',
    'G4.1': '6288', 'G4.2': '2348', 'G4.3': '1063', 'G4.4': '5874',
    'G5.1': '6110', 'G5.2': '2976', 'G5.3': '0273', 'G5.4': '0068', 'G5.5': '4429'
    # G5.6 chưa có!
}
today_draw_g5_5 = {
    'date': 'Thứ hai ngày 05-10-2026',
    'db': '',
    'de': '',
    'prizes': prizes_g5_5
}
with patch('live_radar_scanner.fetch_383_live', return_value=today_draw_g5_5), \
     patch('live_radar_scanner.fetch_daiphat_draws', return_value=[today_draw_g5_5, prev_draw]), \
     patch('live_radar_scanner.datetime') as mock_dt:
    mock_dt.now.return_value = datetime(2026, 10, 5, 18, 22, 55)
    mock_dt.side_effect = lambda *args, **kw: datetime(*args, **kw)
    st = scanner.scan_radar(is_live=True)
    print(f"\n3️⃣ Lúc 18h22:55 (Có G5.5, 18/19 giải, chưa có G5.6)")
    print(f"   - filled_count: {st['filled_count']}/19")
    print(f"   - is_g5_5_done: {st['is_g5_5_done']}")
    print(f"   - is_locked: {st['is_locked']}")
    print(f"   - radar_status: {st['radar_status']}")
    print(f"   - lock_badge: {st['lock_badge']}")
    print(f"   - Bạch Thủ: {st['top_1']} (Lót lộn: {st['lot_lon']}) | Tứ Thủ: {st['top_4']}")
    assert st['filled_count'] == 18
    assert st['is_g5_5_done'] == True
    assert st['is_locked'] == True
    assert st['radar_status'] == 'LOCKED_G5'
    print("   -> ✅ PASS: Đã KHÓA CHỐT NGAY LẬP TỨC TẠI G5.5 (trước 18h23)!")

# --- TEST 4: Lúc 18h23:30 (Mốc backup cứng nếu G5.5 chưa ra) ---
prizes_g5_slow = {
    'G1': '59714',
    'G2.1': '70056', 'G2.2': '79568',
    'G3.1': '20816', 'G3.2': '60874', 'G3.3': '21577', 'G3.4': '85793', 'G3.5': '36546', 'G3.6': '43188',
    'G4.1': '6288', 'G4.2': '2348', 'G4.3': '1063', 'G4.4': '5874',
    'G5.1': '6110', 'G5.2': '2976' # Mới có G5.2
}
today_draw_g5_slow = {
    'date': 'Thứ hai ngày 05-10-2026',
    'db': '',
    'de': '',
    'prizes': prizes_g5_slow
}
with patch('live_radar_scanner.fetch_383_live', return_value=today_draw_g5_slow), \
     patch('live_radar_scanner.fetch_daiphat_draws', return_value=[today_draw_g5_slow, prev_draw]), \
     patch('live_radar_scanner.datetime') as mock_dt:
    mock_dt.now.return_value = datetime(2026, 10, 5, 18, 23, 30)
    mock_dt.side_effect = lambda *args, **kw: datetime(*args, **kw)
    st = scanner.scan_radar(is_live=True)
    print(f"\n4️⃣ Lúc 18h23:30 (Backup cứng: đài quay chậm mới xong G5.2)")
    print(f"   - filled_count: {st['filled_count']}/19")
    print(f"   - is_locked: {st['is_locked']}")
    print(f"   - radar_status: {st['radar_status']}")
    print(f"   - lock_badge: {st['lock_badge']}")
    assert st['is_locked'] == True
    assert st['radar_status'] == 'LOCKED_G5'
    print("   -> ✅ PASS: Backup cứng 18h23:30 ép khóa chốt thành công để kịp giờ ghi!")

print("\n" + "=" * 70)
print("🎉 TOÀN BỘ 4 KỊCH BẢN ĐÃ KIỂM THỬ THÀNH CÔNG 100%!")
print("=" * 70)
