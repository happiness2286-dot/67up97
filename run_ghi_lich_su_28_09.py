# -*- coding: utf-8 -*-
import sys
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from live_radar_scanner import ghi_lich_su, DEFAULT_60_N1

dan_n1 = DEFAULT_60_N1
dan_n2 = ["02", "04", "07", "09", "12", "14", "17", "20", "23", "25", "27", "31", "32", "37", "40", "41", "42", "45", "47", "49", "61", "62", "67", "68", "70", "72", "75", "77", "81", "82", "84", "86", "87", "89", "91", "96"]
dan_n3 = ["01", "03", "05", "08", "11", "13", "16", "18", "21", "24", "26", "28", "33", "35", "38", "43", "44", "48", "51", "53", "55", "58", "60", "63", "65", "69", "71", "73", "78", "80", "83", "85", "88", "92", "95", "97"]

print("--- BẮT ĐẦU CHẠY GHI_LICH_SU CHO NGÀY 28/09/2026 ---")
record = ghi_lich_su(
    ngay="28/09/2026",
    de="15",
    ket_qua="trung_n1",
    top1="96",
    top4=["96", "69", "91", "39"],
    dan_n1=dan_n1,
    dan_n2=dan_n2,
    dan_n3=dan_n3
)
print("Kết quả bản ghi:", record)
