import os
import sys
import time
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

artifacts_dir = r"C:\Users\Admin\.gemini\antigravity-ide\brain\524a251c-6b4a-4d70-8e81-1498a347558b"
os.makedirs(artifacts_dir, exist_ok=True)

url = "http://localhost:8080/index.html"

with sync_playwright() as p:
    # 1. PC TEST
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 900})
    
    console_errors = []
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
    
    print(f"Loading {url} on PC...")
    page.goto(url, wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(2000)
    
    print(f"Console errors: {console_errors}")
    
    # Kiểm tra Tab 1
    tab1_legend = page.locator(".legend-n1-bar")
    print(f"Legend bar visible: {tab1_legend.is_visible()}")
    
    bt_tags = page.locator(".num-tag.tag-bach-thu").all_inner_texts()
    tt_tags = page.locator(".num-tag.tag-tu-thu").all_inner_texts()
    d9_tags = page.locator(".num-tag.tag-dan-9").all_inner_texts()
    dd_tags = page.locator(".num-tag.tag-dan-dao").all_inner_texts()
    lot_tags = page.locator(".num-tag.tag-dan-lot").all_inner_texts()
    
    print(f"Tab 1 Highlighted:")
    print(f" - Bạch thủ (👑): {bt_tags}")
    print(f" - Tứ thủ (🔥): {tt_tags}")
    print(f" - Dàn 9 (⭐): {d9_tags}")
    print(f" - Dàn đảo (🔄): {dd_tags}")
    print(f" - Dàn lót (count): {len(lot_tags)}")
    
    # Chụp ảnh Tab 1 PC
    pc_tab1_path = os.path.join(artifacts_dir, "screenshot_tab1_highlight_pc.png")
    page.screenshot(path=pc_tab1_path, full_page=False)
    print(f"Saved: {pc_tab1_path}")
    
    # Chuyển sang Tab 3
    print("Switching to Tab 3 (Thống kê & Nhật ký)...")
    page.click("button[data-tab='tab-history-stats']")
    page.wait_for_timeout(1000)
    
    # Cuộn tới bảng Nhật ký
    page.locator("#tableHistoryDetailed").scroll_into_view_if_needed()
    page.wait_for_timeout(500)
    
    # Kiểm tra số lượng dòng
    rows = page.locator("#tbodyHistoryRecords tr").count()
    print(f"Total rows rendered in History table: {rows}")
    
    # Lấy thông tin dòng đầu tiên (khung mới nhất)
    first_row_cells = page.locator("#tbodyHistoryRecords tr").first.locator("td").all_inner_texts()
    print(f"First row (Khung mới nhất) cells: {first_row_cells}")
    
    # Lấy thông tin dòng cuối cùng (khung cũ)
    last_row_cells = page.locator("#tbodyHistoryRecords tr").last.locator("td").all_inner_texts()
    print(f"Last row (Khung cũ nhất) cells: {last_row_cells}")
    
    # Chụp ảnh Tab 3 PC
    pc_tab3_path = os.path.join(artifacts_dir, "screenshot_history_5cols_pc.png")
    page.screenshot(path=pc_tab3_path, full_page=False)
    print(f"Saved: {pc_tab3_path}")
    
    browser.close()
    
    # 2. IPHONE 11 TEST
    print("\n--- Testing iPhone 11 ---")
    iphone_browser = p.chromium.launch(headless=True)
    # iPhone 11 viewport: 414 x 896
    iphone_page = iphone_browser.new_page(
        viewport={"width": 414, "height": 896},
        user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1"
    )
    
    iphone_page.goto(url, wait_until="networkidle", timeout=30000)
    iphone_page.wait_for_timeout(2000)
    
    # Chụp ảnh Tab 1 iPhone 11
    ip_tab1_path = os.path.join(artifacts_dir, "screenshot_tab1_highlight_iphone11.png")
    iphone_page.screenshot(path=ip_tab1_path, full_page=False)
    print(f"Saved iPhone 11 Tab 1: {ip_tab1_path}")
    
    # Chuyển sang Tab 3 iPhone 11
    iphone_page.click("button[data-tab='tab-history-stats']")
    iphone_page.wait_for_timeout(1000)
    iphone_page.locator("#tableHistoryDetailed").scroll_into_view_if_needed()
    iphone_page.wait_for_timeout(500)
    
    # Chụp ảnh Tab 3 iPhone 11
    ip_tab3_path = os.path.join(artifacts_dir, "screenshot_history_5cols_iphone11.png")
    iphone_page.screenshot(path=ip_tab3_path, full_page=False)
    print(f"Saved iPhone 11 Tab 3: {ip_tab3_path}")
    
    # Cuộn ngang bảng trên iPhone 11
    iphone_page.evaluate("document.querySelector('#tab-history-stats .table-responsive').scrollLeft = 360")
    iphone_page.wait_for_timeout(500)
    ip_scrolled_path = os.path.join(artifacts_dir, "screenshot_history_iphone11_scrolled.png")
    iphone_page.screenshot(path=ip_scrolled_path, full_page=False)
    print(f"Saved iPhone 11 Tab 3 Scrolled: {ip_scrolled_path}")
    
    iphone_browser.close()

print("\n✅ TẤT CẢ TEST ĐÃ HOÀN TẤT THÀNH CÔNG!")
