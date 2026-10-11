# -*- coding: utf-8 -*-
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$scriptDir = $PSScriptRoot
if (-not $scriptDir) {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
}
if (-not $scriptDir) {
    $scriptDir = "e:\DONGBO~1\NEWHAG~1\NM2026~1\DNAI_A~1\67_up_95"
}
Set-Location -LiteralPath $scriptDir

$pythonExe = "C:\Users\Admin\AppData\Local\Programs\Python\Python311\python.exe"
if (-not (Test-Path $pythonExe)) { $pythonExe = "python.exe" }
$gitExe = "C:\Program Files\Git\cmd\git.exe"
if (-not (Test-Path $gitExe)) { $gitExe = "git.exe" }

$logFile = Join-Path $scriptDir "cron_history.log"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# Kiem tra tranh chay trung lap: chi thoat neu chinh tien trinh cua thu muc 67_up_95 dang chay
$existing = Get-CimInstance Win32_Process -Filter "Name LIKE 'python%'" | Where-Object { 
    $_.CommandLine -like "*live_radar_scanner.py*" -and ($_.CommandLine -like "*67_up_95*" -or $_.CommandLine -like "*67UP97*")
}
if ($existing) {
    "[$timestamp] [INFO] Tien trinh live_radar_scanner.py cua 67_up_95 da dang hoat dong (PID: $($existing.ProcessId)). Bo qua lan kich hoat nay." | Out-File -FilePath $logFile -Append -Encoding utf8
    exit 0
}

"=======================================================" | Out-File -FilePath $logFile -Append -Encoding utf8
"[$timestamp] BAT DAU CHU TRINH TU DONG XSMB 67_UP_95 (KHUNG GIO 17H00 - 18H37)..." | Out-File -FilePath $logFile -Append -Encoding utf8

try {
    # 1. Quet Radar Live truc tiep (18h15 - 18h32)
    # Tu dong khoa chot tai G5.5 / 18h23:30 va day len GitHub ngay lap tuc
    "[$timestamp] Dang chay Live Radar Scanner G1->G5.5 (tu dong khoa chot tai G5.5)..." | Out-File -FilePath $logFile -Append -Encoding utf8
    & $pythonExe live_radar_scanner.py --live --interval 5 --duration 1200 --auto_push 2>&1 | Out-File -FilePath $logFile -Append -Encoding utf8

    # 2. Sau khi co Giai Dac Biet (khoang 18h31-18h35), doi den 18h36 de cac dai dong bo ket qua day du va tach roi gio voi Logic (18h35)
    $nowHour = (Get-Date).Hour
    $nowMin = (Get-Date).Minute
    if ($nowHour -eq 18 -and $nowMin -lt 36) {
        $waitSec = (36 - $nowMin) * 60
        "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] Cho $waitSec giay den 18h36 de dong bo ket qua chot toan dien..." | Out-File -FilePath $logFile -Append -Encoding utf8
        Start-Sleep -Seconds $waitSec
    }

    # 3. Chay crawl va phan tich toan dien Khung 3 Ngay
    $time2 = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "[$time2] Bat dau phan tich Khung 3 Ngay va xuat Excel Master..." | Out-File -FilePath $logFile -Append -Encoding utf8
    & $pythonExe crawl_and_analyze.py 2>&1 | Out-File -FilePath $logFile -Append -Encoding utf8

    # 4. Chay Logic Cau Dong AI & Nhat Ky So Sanh (Tab 4)
    $time3 = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "[$time3] Bat dau cap nhat Tab 4: Logic Cau Dong AI & Nhat Ky So Sanh..." | Out-File -FilePath $logFile -Append -Encoding utf8
    & $pythonExe logic_cau_dong.py 2>&1 | Out-File -FilePath $logFile -Append -Encoding utf8

    # 5. Quet chot va cap nhat lai Radar lan cuoi
    $time4 = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "[$time4] Cap nhat lai Live Radar va Lich Su Kiem Chung lan cuoi..." | Out-File -FilePath $logFile -Append -Encoding utf8
    & $pythonExe live_radar_scanner.py 2>&1 | Out-File -FilePath $logFile -Append -Encoding utf8

    # 6. Day lai lan cuoi toan bo du lieu len GitHub
    & $gitExe add . 2>&1 | Out-File -FilePath $logFile -Append -Encoding utf8
    & $gitExe commit -m "Daily live cron sync $(Get-Date -Format 'yyyy-MM-dd HH:mm')" 2>&1 | Out-File -FilePath $logFile -Append -Encoding utf8
    & $gitExe push origin main 2>&1 | Out-File -FilePath $logFile -Append -Encoding utf8

    $timeEnd = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "[$timeEnd] HOAN TAT DONG BO TOAN BO DU LIEU LEN GITHUB THANH CONG!" | Out-File -FilePath $logFile -Append -Encoding utf8
} catch {
    "[$timestamp] LOI: $_" | Out-File -FilePath $logFile -Append -Encoding utf8
}

"=======================================================" | Out-File -FilePath $logFile -Append -Encoding utf8
