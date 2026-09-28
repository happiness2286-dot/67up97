import urllib.request
import re
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

def check_mketqua():
    url = 'https://mketqua.net/'
    try:
        req = urllib.request.Request(url, headers=headers)
        html = urllib.request.urlopen(req, timeout=10).read().decode('utf-8', errors='ignore')
        date_m = re.search(r'id="result_date">([^<]+)</span>', html)
        print("mketqua date:", date_m.group(1) if date_m else "N/A")
        
        db_m = re.search(r'id="rs_0_0"[^>]*>(\d{5})</div>', html)
        if not db_m:
            db_m = re.search(r'id="rs_0_0"[^>]*data-sofar="(\d{5})"', html)
        print("mketqua DB:", db_m.group(1) if db_m else "N/A")
        
        # Check all prizes
        for g_num in range(8):
            for sub in range(6):
                eid = f"rs_{g_num}_{sub}"
                vm = re.search(rf'id="{eid}"[^>]*>([^<]*)</div>', html)
                if vm and vm.group(1).strip():
                    print(f"  {eid}: {vm.group(1).strip()}")
    except Exception as e:
        print("Error mketqua:", e)

def check_xosodaiphat():
    url = 'https://xosodaiphat.com/xsmb-xo-so-mien-bac.html'
    try:
        req = urllib.request.Request(url, headers=headers)
        html = urllib.request.urlopen(req, timeout=10).read().decode('utf-8', errors='ignore')
        dates = re.findall(r'(\d{1,2}[-/]\d{1,2}[-/]\d{4})', html)
        print("xosodaiphat dates:", dates[:5])
        db = re.findall(r'class="special-prize"[^>]*>(\d+)<', html)
        print("xosodaiphat DB:", db[:3])
    except Exception as e:
        print("Error xosodaiphat:", e)

if __name__ == '__main__':
    check_mketqua()
    check_xosodaiphat()
