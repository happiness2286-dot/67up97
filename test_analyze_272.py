import json
import crawl_and_analyze as c

with open('data_2026.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Add 03-10-2026 if not first
if data[0]['date'] != 'Thứ bảy ngày 03-10-2026':
    rec_03_10 = {
        "date": "Thứ bảy ngày 03-10-2026",
        "db": "77961",
        "de": "61",
        "g7_1": "38",
        "g7_2": "43",
        "g7_3": "37",
        "g7_4": "27",
        "all_lo": [
            "61", "14", "56", "68", "16", "74", "77", "93", "46", "88",
            "88", "48", "63", "74", "10", "76", "73", "68", "29", "52",
            "87", "41", "21", "38", "43", "37", "27"
        ]
    }
    data.insert(0, rec_03_10)

print(f"Total records: {len(data)}, Latest: {data[0]['date']}")
summary = c.analyze_all(data)
print("Analysis complete!")
print("Summary last_date:", summary['last_date'])
print("Total frames:", len(summary['frame3_records']))
print("Latest frame:", summary['frame3_records'][-1])
