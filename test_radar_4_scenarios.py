# -*- coding: utf-8 -*-
"""
KỊCH BẢN KIỂM THỬ 4 GIAI ĐOẠN RADAR XSMB (THEO ĐÚNG YÊU CẦU AN TOÀN):
1. 18h15: Chưa có bóng -> Không hiện dàn (radar_status: BEFORE_DRAW, dan_type: NONE, top_1: "", top_4: [])
2. 18h17: Có G7 -> Hiện "Đang dò cầu" (radar_status: DYNAMIC, dan_type: DYNAMIC, is_locked: False, is_dynamic: True)
3. 18h22: Có G5.5 -> Vẫn "Đang dò cầu" (radar_status: DYNAMIC, dan_type: DYNAMIC, is_locked: False, is_dynamic: True)
4. 18h24: Có G5.6 -> Chốt dàn cứng (radar_status: LOCKED, dan_type: LOCKED, is_locked: True, is_dynamic: False)
"""

import os
import sys
import json
import datetime
from unittest.mock import patch

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Import scanner functions
import live_radar_scanner as scanner

# Dữ liệu kỳ trước (28/09/2026: ĐB 15)
prev_draw = {
    'date': 'Thứ hai ngày 28-09-2026',
    'db': '12315',
    'de': '15',
    'prizes': {
        'G1': '08389',
        'G2.1': '72814', 'G2.2': '46429',
        'G3.1': '61403', 'G3.2': '53225', 'G3.3': '12186', 'G3.4': '68865', 'G3.5': '70733', 'G3.6': '05305',
        'G4.1': '0985', 'G4.2': '7902', 'G4.3': '1519', 'G4.4': '9746',
        'G5.1': '2966', 'G5.2': '2437', 'G5.3': '6169', 'G5.4': '6077', 'G5.5': '5155', 'G5.6': '7323',
        'G6.1': '873', 'G6.2': '010', 'G6.3': '575',
        'G7.1': '63', 'G7.2': '19', 'G7.3': '26', 'G7.4': '67'
    }
}

def test_scenario_1_18h15_empty():
    print("\n=======================================================")
    print("▶ KIỂM THỬ KỊCH BẢN 1: Lúc 18h15 (Chưa có bóng rơi)")
    print("=======================================================")
    
    today_draw = {
        'date': 'Thứ ba ngày 29-09-2026',
        'db': '',
        'de': '',
        'prizes': {} # Hoàn toàn chưa có giải nào
    }
    
    fake_draws = [today_draw, prev_draw]
    mock_time = datetime.datetime(2026, 9, 29, 18, 15, 10)
    
    with patch('live_radar_scanner.fetch_html', return_value="dummy"), \
         patch('live_radar_scanner.parse_draws', return_value=fake_draws), \
         patch('live_radar_scanner.datetime') as mock_dt:
        mock_dt.now.return_value = mock_time
        mock_dt.side_effect = lambda *args, **kw: datetime.datetime(*args, **kw)
        
        state = scanner.scan_radar()
    
    print(f"[*] Trạng thái radar: {state['radar_status']}")
    print(f"[*] Loại dàn: {state['dan_type']}")
    print(f"[*] Lock Badge: {state['lock_badge']}")
    print(f"[*] Bạch thủ: '{state['top_1']}' (Kỳ vọng rỗng '')")
    print(f"[*] Tứ thủ: {state['top_4']} (Kỳ vọng rỗng [])")
    print(f"[*] Dàn 9s: {state['dan_9_so']} (Kỳ vọng rỗng [])")
    print(f"[*] Dàn lót: {state['dan_lot']} (Kỳ vọng rỗng [])")
    print(f"[*] is_locked: {state['is_locked']} (Kỳ vọng False)")
    print(f"[*] is_dynamic: {state['is_dynamic']} (Kỳ vọng False)")
    
    assert state['radar_status'] == "BEFORE_DRAW", f"Sai status: {state['radar_status']}"
    assert state['dan_type'] == "NONE", f"Sai dan_type: {state['dan_type']}"
    assert state['top_1'] == "", f"LỖI: Bạch thủ không được có số khi chưa quay: {state['top_1']}"
    assert state['top_4'] == [], f"LỖI: Tứ thủ không được có số khi chưa quay: {state['top_4']}"
    assert state['dan_9_so'] == [], f"LỖI: Dàn 9s không được có số khi chưa quay"
    assert state['is_locked'] == False, "LỖI: is_locked phải là False"
    print("✅ KỊCH BẢN 1 ĐẠT 100%: Lúc 18h15 chưa có bóng -> Hoàn toàn KHÔNG hiện dàn cứng giả định!")
    return state

def test_scenario_2_18h17_has_g7():
    print("\n=======================================================")
    print("▶ KIỂM THỬ KỊCH BẢN 2: Lúc 18h17 (Có Giải 7 rơi bóng)")
    print("=======================================================")
    
    today_draw = {
        'date': 'Thứ ba ngày 29-09-2026',
        'db': '',
        'de': '',
        'prizes': {
            'G7.1': '63', 'G7.2': '19', 'G7.3': '26', 'G7.4': '67'
        }
    }
    
    fake_draws = [today_draw, prev_draw]
    mock_time = datetime.datetime(2026, 9, 29, 18, 17, 30)
    
    with patch('live_radar_scanner.fetch_html', return_value="dummy"), \
         patch('live_radar_scanner.parse_draws', return_value=fake_draws), \
         patch('live_radar_scanner.datetime') as mock_dt:
        mock_dt.now.return_value = mock_time
        mock_dt.side_effect = lambda *args, **kw: datetime.datetime(*args, **kw)
        
        state = scanner.scan_radar()
    
    print(f"[*] Trạng thái radar: {state['radar_status']}")
    print(f"[*] Loại dàn: {state['dan_type']}")
    print(f"[*] Số giải đã xổ: {state['filled_count']}/{state['total_count']}")
    print(f"[*] Lock Badge: {state['lock_badge']}")
    print(f"[*] Status Text: {state['status_text']}")
    print(f"[*] is_locked: {state['is_locked']} (Kỳ vọng False)")
    print(f"[*] is_dynamic: {state['is_dynamic']} (Kỳ vọng True)")
    
    assert state['radar_status'] == "DYNAMIC", f"Sai status: {state['radar_status']}"
    assert state['dan_type'] == "DYNAMIC", f"Sai dan_type: {state['dan_type']}"
    assert "⚡ DÀN ĐỘNG" in state['lock_badge'], f"Sai lock_badge: {state['lock_badge']}"
    assert state['is_locked'] == False, "LỖI: Chưa xong G5.6 không được lock!"
    assert state['is_dynamic'] == True, "LỖI: Phải ở trạng thái DYNAMIC!"
    print("✅ KỊCH BẢN 2 ĐẠT 100%: Lúc 18h17 có G7 -> Hiển thị chuẩn '⚡ DÀN ĐỘNG - Đang dò cầu', chưa lock!")
    return state

def test_scenario_3_18h22_has_g5_5():
    print("\n=======================================================")
    print("▶ KIỂM THỬ KỊCH BẢN 3: Lúc 18h22 (Có G7, G6, G5.1 -> G5.5, G5.6 CHƯA CÓ)")
    print("=======================================================")
    
    today_draw = {
        'date': 'Thứ ba ngày 29-09-2026',
        'db': '',
        'de': '',
        'prizes': {
            'G7.1': '63', 'G7.2': '19', 'G7.3': '26', 'G7.4': '67',
            'G6.1': '873', 'G6.2': '010', 'G6.3': '575',
            'G5.1': '2966', 'G5.2': '2437', 'G5.3': '6169', 'G5.4': '6077',
            'G5.5': '5155', # ĐÃ CÓ G5.5
            'G5.6': ''       # G5.6 CHƯA CÓ!
        }
    }
    
    fake_draws = [today_draw, prev_draw]
    mock_time = datetime.datetime(2026, 9, 29, 18, 22, 15) # Trước 18h24
    
    with patch('live_radar_scanner.fetch_html', return_value="dummy"), \
         patch('live_radar_scanner.parse_draws', return_value=fake_draws), \
         patch('live_radar_scanner.datetime') as mock_dt:
        mock_dt.now.return_value = mock_time
        mock_dt.side_effect = lambda *args, **kw: datetime.datetime(*args, **kw)
        
        state = scanner.scan_radar()
    
    print(f"[*] Trạng thái radar: {state['radar_status']}")
    print(f"[*] Loại dàn: {state['dan_type']}")
    print(f"[*] Có G5.5?: {state['is_g5_5_done']}")
    print(f"[*] Có G5.6?: {state['is_g5_6_done']}")
    print(f"[*] is_locked: {state['is_locked']} (Kỳ vọng False - Vì chưa có G5.6)")
    print(f"[*] is_dynamic: {state['is_dynamic']} (Kỳ vọng True)")
    
    assert state['radar_status'] == "DYNAMIC", f"LỖI: Mới có G5.5 mà đã lock! Thực tế: {state['radar_status']}"
    assert state['dan_type'] == "DYNAMIC", f"Sai dan_type: {state['dan_type']}"
    assert state['is_g5_5_done'] == True, "Phải ghi nhận đã có G5.5"
    assert state['is_g5_6_done'] == False, "G5.6 chưa có thì phải là False"
    assert state['is_locked'] == False, "LỖI: Có G5.5 nhưng chưa có G5.6 thì KHÔNG ĐƯỢC LOCK!"
    assert state['is_dynamic'] == True, "LỖI: Phải tiếp tục ở trạng thái DYNAMIC!"
    print("✅ KỊCH BẢN 3 ĐẠT 100%: Lúc 18h22 có G5.5 nhưng chưa có G5.6 -> Vẫn chuẩn xác '⚡ DÀN ĐỘNG - Đang dò cầu', tuyệt đối KHÔNG chốt non!")
    return state

def test_scenario_4_18h24_has_g5_6():
    print("\n=======================================================")
    print("▶ KIỂM THỬ KỊCH BẢN 4: Lúc 18h24 (ĐÃ CÓ G5.6 HOÀN TẤT)")
    print("=======================================================")
    
    today_draw = {
        'date': 'Thứ ba ngày 29-09-2026',
        'db': '',
        'de': '',
        'prizes': {
            'G7.1': '63', 'G7.2': '19', 'G7.3': '26', 'G7.4': '67',
            'G6.1': '873', 'G6.2': '010', 'G6.3': '575',
            'G5.1': '2966', 'G5.2': '2437', 'G5.3': '6169', 'G5.4': '6077',
            'G5.5': '5155',
            'G5.6': '7323' # ĐÃ CÓ G5.6 CHÍNH THỨC!
        }
    }
    
    fake_draws = [today_draw, prev_draw]
    mock_time = datetime.datetime(2026, 9, 29, 18, 24, 5)
    
    with patch('live_radar_scanner.fetch_html', return_value="dummy"), \
         patch('live_radar_scanner.parse_draws', return_value=fake_draws), \
         patch('live_radar_scanner.datetime') as mock_dt:
        mock_dt.now.return_value = mock_time
        mock_dt.side_effect = lambda *args, **kw: datetime.datetime(*args, **kw)
        
        state = scanner.scan_radar()
    
    print(f"[*] Trạng thái radar: {state['radar_status']}")
    print(f"[*] Loại dàn: {state['dan_type']}")
    print(f"[*] Có G5.6?: {state['is_g5_6_done']}")
    print(f"[*] is_locked: {state['is_locked']} (Kỳ vọng True - ĐÃ CHỐT HẠ!)")
    print(f"[*] is_dynamic: {state['is_dynamic']} (Kỳ vọng False)")
    print(f"[*] Lock Badge: {state['lock_badge']}")
    print(f"[*] Status Text: {state['status_text']}")
    print(f"[*] Bạch thủ chốt: {state['top_1']}")
    print(f"[*] Tứ thủ chốt: {state['top_4']}")
    
    assert state['radar_status'] == "LOCKED", f"LỖI: Có G5.6 rồi mà chưa lock! Thực tế: {state['radar_status']}"
    assert state['dan_type'] == "LOCKED", f"Sai dan_type: {state['dan_type']}"
    assert state['is_g5_6_done'] == True, "Phải ghi nhận đã có G5.6"
    assert state['is_locked'] == True, "LỖI: Có G5.6 phải kích hoạt is_locked = True!"
    assert state['is_dynamic'] == False, "LỖI: Đã lock thì is_dynamic phải là False!"
    assert "🔒 DÀN CỨNG" in state['lock_badge'], f"Sai badge: {state['lock_badge']}"
    print("✅ KỊCH BẢN 4 ĐẠT 100%: Lúc 18h24 có đủ G5.6 -> ĐÃ CHỐT DÀN CỨNG THÀNH CÔNG!")
    return state

if __name__ == '__main__':
    print("=== BẮT ĐẦU CHẠY KIỂM THỬ 4 KỊCH BẢN THEO CHỈ ĐẠO ===")
    test_scenario_1_18h15_empty()
    test_scenario_2_18h17_has_g7()
    test_scenario_3_18h22_has_g5_5()
    test_scenario_4_18h24_has_g5_6()
    print("\n🎉🎉🎉 TOÀN BỘ 4 KỊCH BẢN ĐÃ VƯỢT QUA KIỂM THỬ XUẤT SẮC 100%!")
