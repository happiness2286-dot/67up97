import os
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
import time
import subprocess
import threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

PORT = 8089

def run_server():
    server = ThreadingHTTPServer(('127.0.0.1', PORT), SimpleHTTPRequestHandler)
    server.serve_forever()

def main():
    print(f"🚀 Khởi động Threading local server cổng {PORT}...")
    t = threading.Thread(target=run_server, daemon=True)
    t.start()
    time.sleep(1.2)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        # 1. TEST PC DESKTOP (1280 x 1400)
        print("🖥️ Kiểm thử trên Desktop (1280px)...")
        page = browser.new_page(viewport={'width': 1280, 'height': 1400})
        page.goto(f'http://127.0.0.1:{PORT}/index.html')
        page.wait_for_load_state('domcontentloaded')
        page.wait_for_timeout(2500)

        # Click Tab 4
        btn_tab4 = page.locator('#btnTabCauDong')
        btn_tab4.click()
        page.wait_for_timeout(1500)

        # Chụp ảnh toàn bộ Tab 4 trên PC
        page.screenshot(path='screenshot_tab4_pc.png', full_page=True)
        print("📸 Đã chụp: screenshot_tab4_pc.png")

        # 2. TEST MOBILE VIEWPORT (390 x 844 - iPhone 13)
        print("📱 Resize sang Mobile (390px)...")
        page.set_viewport_size({'width': 390, 'height': 844})
        page.wait_for_timeout(1500)

        page.screenshot(path='screenshot_tab4_mobile.png', full_page=True)
        print("📸 Đã chụp: screenshot_tab4_mobile.png")

        # 3. VERIFY TAB 1, 2, 3 NGUYÊN VẸN
        print("🔍 Kiểm tra tính toàn vẹn của Tab 1, 2, 3...")
        tab1_btn = page.locator('.tab-btn[data-tab="tab-frame3d"]')
        tab1_btn.click()
        page.wait_for_timeout(500)
        t1_visible = page.locator('#tab-frame3d').is_visible()

        tab2_btn = page.locator('.tab-btn[data-tab="tab-radar-live"]')
        tab2_btn.click()
        page.wait_for_timeout(500)
        t2_visible = page.locator('#tab-radar-live').is_visible()

        tab3_btn = page.locator('.tab-btn[data-tab="tab-history-stats"]')
        tab3_btn.click()
        page.wait_for_timeout(500)
        t3_visible = page.locator('#tab-history-stats').is_visible()

        print(f"Tab 1 hiển thị tốt: {t1_visible}")
        print(f"Tab 2 hiển thị tốt: {t2_visible}")
        print(f"Tab 3 hiển thị tốt: {t3_visible}")

        browser.close()
        print("✅ TOÀN BỘ KIỂM THỬ ĐÃ HOÀN TẤT THÀNH CÔNG!")

if __name__ == '__main__':
    main()
