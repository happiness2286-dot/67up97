import os
import sys
import time
import json
import http.server
import socketserver
import threading
from playwright.sync_api import sync_playwright

import live_radar_scanner as scanner
from test_radar_4_scenarios import (
    test_scenario_1_18h15_empty,
    test_scenario_2_18h17_has_g7,
    test_scenario_3_18h22_has_g5_5,
    test_scenario_4_18h24_has_g5_6
)

# Start local server on 8889 for this folder
PORT = 8889
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

server = socketserver.TCPServer(("127.0.0.1", PORT), Handler)
t = threading.Thread(target=server.serve_forever, daemon=True)
t.start()
print(f"[*] Started local server on http://127.0.0.1:{PORT}")

scenarios = [
    ("Kịch bản 1 (18h15: Chưa có bóng - Không hiện dàn)", test_scenario_1_18h15_empty, "screenshot_kb1_18h15_chua_co_bong.png"),
    ("Kịch bản 2 (18h17: Có G7 - Dàn Động)", test_scenario_2_18h17_has_g7, "screenshot_kb2_18h17_co_g7_dong.png"),
    ("Kịch bản 3 (18h22: Có G5.5 - Vẫn Dàn Động)", test_scenario_3_18h22_has_g5_5, "screenshot_kb3_18h22_co_g5_5_dong.png"),
    ("Kịch bản 4 (18h24: Có G5.6 - Chốt Dàn Cứng)", test_scenario_4_18h24_has_g5_6, "screenshot_kb4_18h24_co_g5_6_chot_cung.png")
]

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 1800})
    page.on("console", lambda msg: print(f"[Browser Console] {msg.text}"))
    
    for title, test_func, img_name in scenarios:
        state = test_func()
        scanner.save_state_atomic(state)
        
        # Load local web from 8889 with hash #tab-radar-live
        page.goto(f'http://127.0.0.1:{PORT}/index.html#tab-radar-live', wait_until='networkidle')
        page.wait_for_timeout(300)
        
        # Explicitly activate Tab 2 via JS and trigger radar render with the exact state
        page.evaluate("""(inState) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            const btn = document.querySelector('.tab-btn[data-tab="tab-radar-live"]');
            if (btn) btn.classList.add('active');
            const tab = document.getElementById('tab-radar-live');
            if (tab) tab.classList.add('active');
            
            if (typeof window.setRadarData === 'function') {
                window.setRadarData(inState);
            } else {
                window.radarData = inState;
            }
            if (typeof renderRadarHeaderInfo === 'function') renderRadarHeaderInfo();
            if (typeof renderFastLockBanner === 'function') renderFastLockBanner();
            if (typeof renderLivePrizeChips === 'function') renderLivePrizeChips();
            if (typeof renderRadarTopSummaries === 'function') renderRadarTopSummaries();
            if (typeof renderRadarCang3D === 'function') renderRadarCang3D();
            if (typeof renderRadar5ColTable === 'function') renderRadar5ColTable();
            if (typeof renderRadarFrame3Day === 'function') renderRadarFrame3Day();
            if (typeof renderRadarHistoryTable === 'function') renderRadarHistoryTable();
            if (typeof checkLock === 'function') checkLock();
            console.log(`[Eval] Rendered scenario: ${inState.radar_status} - ${inState.dan_type} (${inState.filled_count}/26)`);
        }""", state)
        page.wait_for_timeout(800)
        
        # Chụp toàn bộ khu vực Tab 2 Radar Live (với animations="disabled" để không bị đợi keyframe animation)
        radar_el = page.locator('#tab-radar-live')
        radar_el.screenshot(path=img_name, animations="disabled")
        full_path = os.path.abspath(img_name)
        print(f"📸 SAVED: {img_name}, Size: {os.path.getsize(full_path)} bytes", flush=True)
        
    browser.close()

print("\n🎉 HOÀN TẤT CHỤP MÀN HÌNH TOÀN BỘ 4 KỊCH BẢN!")
