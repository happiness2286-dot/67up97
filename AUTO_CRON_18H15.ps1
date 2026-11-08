# -*- coding: utf-8 -*-
param(
    [string]$Mode = "Auto"
)

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

# Tự động xoay vòng log nếu file vượt quá 1.5 MB để giữ tốc độ đọc/ghi nhẹ nhàng
if ((Test-Path $logFile) -and ((Get-Item $logFile).Length -gt 1572864)) {
    try {
        $tailLines = Get-Content $logFile -Tail 1000 -Encoding UTF8
        $tailLines | Set-Content $logFile -Encoding UTF8
    } catch {}
}

$now = Get-Date
$timestamp = $now.ToString("yyyy-MM-dd HH:mm:ss")
$todayStr = $now.ToString("dd-MM-yyyy")

# Tự động xác định Mode nếu được gọi với Mode = "Auto"
if ($Mode -eq "Auto") {
    $totalMin = $now.Hour * 60 + $now.Minute
    if ($totalMin -ge (16 * 60 + 50) -and $totalMin -lt (18 * 60 + 10)) {
        $Mode = "Prep17h"
    } elseif ($totalMin -ge (18 * 60 + 10) -and $totalMin -le (18 * 60 + 33)) {
        $Mode = "Live18h15"
    } else {
        $Mode = "Daily18h37"
    }
}

# Kiểm tra tránh chạy trùng lặp: chỉ thoát nếu chính tiến trình của thư mục 67_up_95 đang chạy
$existing = Get-CimInstance Win32_Process -Filter "Name LIKE 'python%'" | Where-Object { 
    ($_.CommandLine -like "*live_radar_scanner.py*" -or $_.CommandLine -like "*crawl_and_analyze.py*") -and ($_.CommandLine -like "*67_up_95*" -or $_.CommandLine -like "*67UP97*")
}
if ($existing) {
    "[$timestamp] [INFO] Tiến trình Python của 67_up_95 đang hoạt động (PID: $($existing.ProcessId), Mode yêu cầu: $Mode). Bỏ qua lần kích hoạt trùng này." | Out-File -FilePath $logFile -Append -Encoding utf8
    exit 0
}

function Invoke-DailyAnalysisPipeline {
    $t2 = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "[$t2] Bắt đầu phân tích Khung 3 Ngày Động & xuất Excel Master (18 Sheets)..." | Out-File -FilePath $logFile -Append -Encoding utf8
    & $pythonExe crawl_and_analyze.py 2>&1 | Out-File -FilePath $logFile -Append -Encoding utf8

    $t3 = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "[$t3] Bắt đầu cập nhật Tab 4: Cầu Vị Trí Ăn Thông AI & Nhật Ký Kiểm Chứng..." | Out-File -FilePath $logFile -Append -Encoding utf8
    & $pythonExe logic_cau_dong.py 2>&1 | Out-File -FilePath $logFile -Append -Encoding utf8

    $t4 = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "[$t4] Cập nhật lại Live Radar & Lịch Sử Kiểm Chứng 30 Kỳ lần cuối..." | Out-File -FilePath $logFile -Append -Encoding utf8
    & $pythonExe live_radar_scanner.py 2>&1 | Out-File -FilePath $logFile -Append -Encoding utf8

    & $gitExe add . 2>&1 | Out-File -FilePath $logFile -Append -Encoding utf8
    & $gitExe commit -m "Daily live cron sync $(Get-Date -Format 'yyyy-MM-dd HH:mm')" 2>&1 | Out-File -FilePath $logFile -Append -Encoding utf8
    & $gitExe push origin main 2>&1 | Out-File -FilePath $logFile -Append -Encoding utf8

    $tEnd = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "[$tEnd] HOÀN TẤT ĐỒNG BỘ TOÀN BỘ DỮ LIỆU LÊN GITHUB THÀNH CÔNG!" | Out-File -FilePath $logFile -Append -Encoding utf8
}

"=======================================================" | Out-File -FilePath $logFile -Append -Encoding utf8
"[$timestamp] KÍCH HOẠT CHU TRÌNH TỰ ĐỘNG XSMB 67_UP_95 (MODE: $Mode)..." | Out-File -FilePath $logFile -Append -Encoding utf8

try {
    if ($Mode -eq "Prep17h") {
        # TẦNG 1 (17h00): Chuẩn bị trạng thái Chờ Quay (BEFORE_DRAW) trong 3 giây rồi thoát ngay (KHÔNG chạy loop 20 phút)
        "[$timestamp] [PREP 17H00] Chuyển trạng thái sang Chờ Quay 18h15 và đồng bộ Dàn Tĩnh 4 Cấp..." | Out-File -FilePath $logFile -Append -Encoding utf8
        & $pythonExe live_radar_scanner.py 2>&1 | Out-File -FilePath $logFile -Append -Encoding utf8
        & $gitExe add live_radar_state.json 2>&1 | Out-File -FilePath $logFile -Append -Encoding utf8
        & $gitExe commit -m "Prep waiting state 17h00 for $todayStr" 2>&1 | Out-File -FilePath $logFile -Append -Encoding utf8
        & $gitExe push origin main 2>&1 | Out-File -FilePath $logFile -Append -Encoding utf8
        "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [PREP 17H00] Hoàn tất chuẩn bị trước giờ quay!" | Out-File -FilePath $logFile -Append -Encoding utf8
    }
    elseif ($Mode -eq "Live18h15") {
        # TẦNG 2 (18h15): Quét Radar Live trực tiếp (18h15 - 18h32), khóa chốt tại G5.5 / 18h23:30
        "[$timestamp] [LIVE 18H15] Đang chạy Live Radar Scanner G1->G5.5 (tự động khóa chốt tại G5.5)..." | Out-File -FilePath $logFile -Append -Encoding utf8
        & $pythonExe live_radar_scanner.py --live --interval 5 --duration 1200 --auto_push 2>&1 | Out-File -FilePath $logFile -Append -Encoding utf8

        # Sau khi có Giải Đặc Biệt (~18h30:30), đợi đến 18h36 để tách rời giờ với dự án Logic (18h35)
        $nowAfterLive = Get-Date
        if ($nowAfterLive.Hour -eq 18 -and $nowAfterLive.Minute -lt 36) {
            $waitSec = (36 - $nowAfterLive.Minute) * 60 - $nowAfterLive.Second
            if ($waitSec -gt 0) {
                "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Chờ $waitSec giây đến 18h36:00 để đồng bộ kết quả chốt toàn diện..." | Out-File -FilePath $logFile -Append -Encoding utf8
                Start-Sleep -Seconds $waitSec
            }
        }

        Invoke-DailyAnalysisPipeline
    }
    else {
        # TẦNG 3 (18h37 - Daily18h37): Kiểm tra nếu phiên Live18h15 đã cập nhật đầy đủ kết quả hôm nay thì bỏ qua chạy đúp!
        $alreadySynced = $false
        $statePath = Join-Path $scriptDir "live_radar_state.json"
        $dataPath = Join-Path $scriptDir "data_2026.json"
        if ((Test-Path $statePath) -and (Test-Path $dataPath)) {
            try {
                $stateJson = Get-Content $statePath -Raw -Encoding UTF8 | ConvertFrom-Json
                $stateAgeSec = ((Get-Date) - (Get-Item $statePath).LastWriteTime).TotalSeconds
                if ($stateJson.target_date -like "*$todayStr*" -and $stateJson.actual_de -and $stateAgeSec -lt 300) {
                    $alreadySynced = $true
                }
            } catch {}
        }

        if ($alreadySynced) {
            "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [SKIP] Dữ liệu kỳ $todayStr (Đề $($stateJson.actual_de)) vừa được phiên Live18h15 chốt và đẩy lên GitHub thành công cách đây $([int]$stateAgeSec)s. Bỏ qua chạy đúp!" | Out-File -FilePath $logFile -Append -Encoding utf8
        } else {
            "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [DAILY 18H37] Thực hiện cập nhật và phân tích chốt ngày cho kỳ $todayStr..." | Out-File -FilePath $logFile -Append -Encoding utf8
            Invoke-DailyAnalysisPipeline
        }
    }
} catch {
    "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] LỖI: $_" | Out-File -FilePath $logFile -Append -Encoding utf8
}

"=======================================================" | Out-File -FilePath $logFile -Append -Encoding utf8
