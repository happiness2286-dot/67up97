import os
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import threading
import time
from playwright.sync_api import sync_playwright

PORT = 8092

def run_server():
    server = ThreadingHTTPServer(('127.0.0.1', PORT), SimpleHTTPRequestHandler)
    server.serve_forever()

def main():
    t = threading.Thread(target=run_server, daemon=True)
    t.start()
    time.sleep(1)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 1600})
        page.goto(f'http://127.0.0.1:{PORT}/index.html')
        page.wait_for_load_state('domcontentloaded')
        page.wait_for_timeout(2000)

        # Chuyển tab 4
        btn = page.locator('#btnTabCauDong')
        btn.click()
        page.wait_for_timeout(1500)

        # Chụp ảnh desktop
        page.screenshot(path='screenshot_tab4_highlight_pc.png', full_page=True)
        print("📸 Đã chụp: screenshot_tab4_highlight_pc.png")

        # Chụp ảnh iPhone 11 (414 x 896)
        page.set_viewport_size({'width': 414, 'height': 896})
        page.wait_for_timeout(1500)
        page.screenshot(path='screenshot_tab4_highlight_iphone11.png', full_page=True)
        print("📸 Đã chụp: screenshot_tab4_highlight_iphone11.png")

        browser.close()

if __name__ == '__main__':
    main()
