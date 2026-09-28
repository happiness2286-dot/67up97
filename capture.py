import subprocess
import os

edge = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
out_radar = os.path.abspath("screenshot_tab_radar.png")

# Edge command to capture Tab 2
cmd = [
    edge,
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    "--virtual-time-budget=3000",
    "--run-all-compositor-stages-before-draw",
    "--window-size=1280,3600",
    f"--screenshot={out_radar}",
    "http://localhost:8080/index.html#tab-radar-live"
]

print("Running Edge capture...")
proc = subprocess.Popen(cmd)
try:
    proc.wait(timeout=8)
except subprocess.TimeoutExpired:
    proc.kill()

print("out_radar exists?:", os.path.exists(out_radar))
if os.path.exists(out_radar):
    print("Size:", os.path.getsize(out_radar))
