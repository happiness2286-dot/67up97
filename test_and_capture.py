import os
import sys
import json
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

print("=== BẮT ĐẦU KIỂM THỬ XÁC NHẬN DÀN SỐ GỐC PHẦN 2 & PHẦN 3 ===")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 2200})
    
    # 1. Truy cập trang web localhost:8080
    page.goto('http://localhost:8080/index.html', wait_until='networkidle')
    page.wait_for_timeout(1000)

    # Chuyển sang Tab Radar Live
    tab_btn = page.locator('#btnTabRadarLive')
    if tab_btn.count() > 0:
        tab_btn.click()
        page.wait_for_timeout(1000)
        print("✅ Đã chuyển sang Tab Radar Soi Live")

    # 2. KIỂM THỬ VÀ TRÍCH XUẤT DỮ LIỆU PHẦN 2 (BẠCH THỦ - TỨ THỦ - DÀN 9S - DÀN 8S ĐẢO)
    print("\n--- KIỂM TRA PHẦN 2: DÀN SỐ CHỐT GỐC ---")
    p2_data = page.evaluate("""() => {
        const bt = document.getElementById('radarTop1Display')?.textContent?.trim();
        const lotLon = document.getElementById('radarLotLonDisplay')?.textContent?.trim();
        
        const ttChips = Array.from(document.querySelectorAll('#radarTop4Chips .badge')).map(el => el.textContent.trim());
        const d9Chips = Array.from(document.querySelectorAll('#radarDan9Chips .badge')).map(el => el.textContent.trim());
        const d9DaoChips = Array.from(document.querySelectorAll('#radarDan9DaoChips .badge')).map(el => el.textContent.trim());
        const subtitle = document.getElementById('radarDan9Subtitle')?.innerText?.trim();
        const danLot = document.getElementById('radarDanLotDisplay')?.textContent?.trim();
        const countLot = document.getElementById('lblCountLot')?.textContent?.trim();

        return {
            bt,
            lotLon,
            ttChips,
            d9Chips,
            d9DaoChips,
            subtitle,
            danLot,
            countLot
        };
    }""")

    print(f"Bạch thủ: {p2_data['bt']} (Mong đợi: 96)")
    print(f"Lót lộn trụ: {p2_data['lotLon']} (Mong đợi: 69)")
    print(f"Tứ thủ: {p2_data['ttChips']} (Mong đợi: ['96', '69', '91', '39'])")
    print(f"Dàn 9 số gốc: {p2_data['d9Chips']} (Mong đợi: ['21', '22', '27', '31', '32', '37', '41', '42', '47'])")
    print(f"Dàn 8 số đảo: {p2_data['d9DaoChips']} (Mong đợi: ['12', '72', '13', '23', '73', '14', '24', '74'])")
    print(f"Subtitle Đầu/Đuôi: {p2_data['subtitle']}")
    print(f"Số lượng Dàn Lót: {p2_data['countLot']} (Mong đợi: 56 số)")

    # Assertions PHẦN 2
    assert p2_data['bt'] == "96", f"LỖI: Bạch thủ phải là 96, thực tế {p2_data['bt']}"
    assert p2_data['lotLon'] == "69", f"LỖI: Lót lộn phải là 69, thực tế {p2_data['lotLon']}"
    assert p2_data['ttChips'] == ['96', '69', '91', '39'], f"LỖI: Tứ thủ sai, thực tế {p2_data['ttChips']}"
    assert p2_data['d9Chips'] == ['21', '22', '27', '31', '32', '37', '41', '42', '47'], f"LỖI: Dàn 9 số sai, thực tế {p2_data['d9Chips']}"
    assert p2_data['d9DaoChips'] == ['12', '72', '13', '23', '73', '14', '24', '74'], f"LỖI: Dàn 8 số đảo sai, thực tế {p2_data['d9DaoChips']}"
    assert "Top 3 Đầu [2,3,4]" in p2_data['subtitle'] and "Top 3 Đuôi [1,2,7]" in p2_data['subtitle'], f"LỖI: Top Đầu/Đuôi subtitle sai: {p2_data['subtitle']}"
    print("✅ PHẦN 2 KHỚP 100% VỚI DỮ LIỆU GỐC TỪ ẢNH!")

    # Chụp ảnh PHẦN 2
    phan2_box = page.locator('#tab-radar-live .top-summary-grid').first
    if phan2_box.count() > 0:
        phan2_box.scroll_into_view_if_needed()
        page.wait_for_timeout(500)
        phan2_box.screenshot(path="screenshot_phan2_restored.png")
        print("📸 Đã chụp ảnh PHẦN 2: screenshot_phan2_restored.png")

    # 3. KIỂM THỬ VÀ TRÍCH XUẤT DỮ LIỆU PHẦN 3 (KPI & DÒNG 28/09)
    print("\n--- KIỂM TRA PHẦN 3: LỊCH SỬ VÀ KPI 31 KỲ ---")
    p3_data = page.evaluate("""() => {
        const top1 = document.getElementById('kpiRadarTop1')?.textContent?.trim();
        const top4 = document.getElementById('kpiRadarTop4')?.textContent?.trim();
        const dan9 = document.getElementById('kpiRadarDan9')?.textContent?.trim();
        const lot = document.getElementById('kpiRadarLot')?.textContent?.trim();
        
        const rows = document.querySelectorAll('#tbodyRadarHistory tr');
        const firstRow = rows && rows.length > 0 ? rows[0] : null;
        const cells = firstRow ? Array.from(firstRow.querySelectorAll('td')).map(td => td.innerText.trim()) : [];
        
        return {
            kpi: { top1, top4, dan9, lot },
            totalRows: rows ? rows.length : 0,
            firstRowCells: cells
        };
    }""")

    print(f"Tổng số dòng: {p3_data['totalRows']} (Mong đợi: 31)")
    print(f"Dòng 1: {p3_data['firstRowCells']}")
    print(f"KPI Bạch thủ: {p3_data['kpi']['top1']}")
    print(f"KPI Tứ thủ: {p3_data['kpi']['top4']}")
    print(f"KPI Dàn 9s: {p3_data['kpi']['dan9']}")
    print(f"KPI Dàn lót: {p3_data['kpi']['lot']}")

    # Assertions PHẦN 3
    assert p3_data['totalRows'] == 31, f"LỖI: Tổng số dòng phải là 31, thực tế {p3_data['totalRows']}"
    assert "32.3%" in p3_data['kpi']['top1'] and "10/31" in p3_data['kpi']['top1']
    assert "58.1%" in p3_data['kpi']['top4'] and "18/31" in p3_data['kpi']['top4']
    assert "29" in p3_data['kpi']['dan9'] and "9/31" in p3_data['kpi']['dan9']
    assert "83.9%" in p3_data['kpi']['lot'] and "26/31" in p3_data['kpi']['lot']

    # Dòng 1: Đề 15, BT 96 trượt, TT trượt, Dàn lót trúng
    cells = p3_data['firstRowCells']
    assert "28-09-2026" in cells[1] or "28/09/2026" in cells[1]
    assert cells[2] == "15"
    assert "96" in cells[3] and "❌" in cells[3]
    assert "🎯 Trúng" in cells[7]
    print("✅ PHẦN 3 KHỚP 100% YÊU CẦU: Dòng 28/09 trúng lót, KPI 31 kỳ chính xác!")

    # Chụp ảnh PHẦN 3
    phan3_box = page.locator('#tab-radar-live .frame-manage-box').filter(has_text="PHẦN 3: LỊCH SỬ KIỂM CHỨNG").first
    if phan3_box.count() > 0:
        phan3_box.scroll_into_view_if_needed()
        page.wait_for_timeout(500)
        phan3_box.screenshot(path="screenshot_phan3_fixed_28_09.png")
        print("📸 Đã chụp ảnh PHẦN 3: screenshot_phan3_fixed_28_09.png")

    browser.close()

print("\n=== HOÀN TẤT KIỂM THỬ: TOÀN BỘ 100% CHÍNH XÁC ===")
