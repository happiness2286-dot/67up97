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

"=======================================================" | Out-File -FilePath $logFile -Append -Encoding utf8
"[$timestamp] BAT DAU CHAY TU DONG LIVE XSMB TU 18H14..." | Out-File -FilePath $logFile -Append -Encoding utf8

try {
    # 1. Quet Radar Live truc tiep (18h14 - 18h32)
    # Tu dong chot khoa va push GitHub ngay khi hoan tat G5 (khoang 18h24)
    "[$timestamp] Dang chay Live Radar Scanner G1->G5 (tu khoa khi het G5)..." | Out-File -FilePath $logFile -Append -Encoding utf8
    & $pythonExe live_radar_scanner.py --live --interval 5 --duration 1200 --auto_push 2>&1 | Out-File -FilePath $logFile -Append -Encoding utf8

    # 2. Sau khi co Giai Dac Biet (sau 18h31), chay crawl va phan tich toan dien Khung 3 Ngay
    $time2 = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "[$time2] Bat dau phan tich Khung 3 Ngay va xuat Excel Master..." | Out-File -FilePath $logFile -Append -Encoding utf8
    & $pythonExe crawl_and_analyze.py 2>&1 | Out-File -FilePath $logFile -Append -Encoding utf8

    # 3. Quet chot va cap nhat lai Radar lan cuoi
    & $pythonExe live_radar_scanner.py 2>&1 | Out-File -FilePath $logFile -Append -Encoding utf8

    # 4. Day lai lan cuoi toan bo du lieu len GitHub
    & $gitExe add . 2>&1 | Out-File -FilePath $logFile -Append -Encoding utf8
    & $gitExe commit -m "Daily live cron sync $(Get-Date -Format 'yyyy-MM-dd HH:mm')" 2>&1 | Out-File -FilePath $logFile -Append -Encoding utf8
    & $gitExe push origin main 2>&1 | Out-File -FilePath $logFile -Append -Encoding utf8

    $timeEnd = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "[$timeEnd] HOAN TAT DONG BO TOAN BO DU LIEU LEN GITHUB THANH CONG!" | Out-File -FilePath $logFile -Append -Encoding utf8
} catch {
    "[$timestamp] LOI: $_" | Out-File -FilePath $logFile -Append -Encoding utf8
}

"=======================================================" | Out-File -FilePath $logFile -Append -Encoding utf8
