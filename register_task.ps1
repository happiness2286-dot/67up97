# -*- coding: utf-8 -*-
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$psPath = "powershell.exe"
$pythonPath = "C:\Users\Admin\AppData\Local\Programs\Python\Python311\python.exe"
if (-not (Test-Path $pythonPath)) { $pythonPath = "python.exe" }

$scriptDir = $PSScriptRoot
if (-not $scriptDir) {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
}
if (-not $scriptDir) {
    $scriptDir = "e:\DONGBO~1\NEWHAG~1\NM2026~1\DNAI_A~1\67_up_95"
}

$cronPs1 = Join-Path $scriptDir "AUTO_CRON_18H15.ps1"
$catchupPy = Join-Path $scriptDir "catchup_check.py"

# Don dep cac Task rieng cua 67_up_95 (KHONG dung toi Task cua Logic hay 58_up_75)
$cleanupList = @(
    "XSMB_Auto_Update_Daily_18h35",
    "XSMB_AI_AutoUpdate_18h15",
    "XSMB_AI_AutoDaily_18h35",
    "XSMB_AI_AutoDaily_18h37",
    "XSMB_AI_AutoLive_18h14",
    "XSMB_AI_AutoLive_18h15",
    "XSMB_AI_AutoUpdate_17h00",
    "XSMB_AI_Catchup_OnLogon",
    "XSMB_AI_Catchup_Evening"
)

foreach ($t in $cleanupList) {
    if (Get-ScheduledTask -TaskName $t -ErrorAction SilentlyContinue) {
        Unregister-ScheduledTask -TaskName $t -Confirm:$false
        Write-Host "Da lam sach task cu: $t" -ForegroundColor Yellow
    }
}

$commonSettings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -WakeToRun -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

# 1. TASK 17h00: Chuan bi dan so & dong bo Cho Quay
$action17h00 = New-ScheduledTaskAction -Execute $psPath -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$cronPs1`"" -WorkingDirectory $scriptDir
$trigger17h00 = New-ScheduledTaskTrigger -Daily -At "17:00"
Register-ScheduledTask -TaskName "XSMB_AI_AutoUpdate_17h00" -Action $action17h00 -Trigger $trigger17h00 -Settings $commonSettings -Description "Kich hoat chuan bi dan so luc 17h00" -Force

# 2. TASK 18h15: Du phong truc tiep don long cau quay (lech gio Logic 18h14:14)
$action18h15 = New-ScheduledTaskAction -Execute $psPath -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$cronPs1`"" -WorkingDirectory $scriptDir
$trigger18h15 = New-ScheduledTaskTrigger -Daily -At "18:15"
Register-ScheduledTask -TaskName "XSMB_AI_AutoLive_18h15" -Action $action18h15 -Trigger $trigger18h15 -Settings $commonSettings -Description "Don quay truc tiep luc 18h15 khoa chot tai G5.5" -Force

# 3. TASK 18h37: Chot toan dien va day ket qua len GitHub (lech gio Logic 18h35:35)
$action18h37 = New-ScheduledTaskAction -Execute $psPath -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$cronPs1`"" -WorkingDirectory $scriptDir
$trigger18h37 = New-ScheduledTaskTrigger -Daily -At "18:37"
Register-ScheduledTask -TaskName "XSMB_AI_AutoDaily_18h37" -Action $action18h37 -Trigger $trigger18h37 -Settings $commonSettings -Description "Chot ket qua va phan tich Khung 3N luc 18h37" -Force

# 4. TASK TU DONG BU (CATCH-UP ON LOGON): Tu kiem tra va cao bu ngay khi mo may / dang nhap
$actionCatchup = New-ScheduledTaskAction -Execute $pythonPath -Argument "`"$catchupPy`"" -WorkingDirectory $scriptDir
$triggerLogon = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
Register-ScheduledTask -TaskName "XSMB_AI_Catchup_OnLogon" -Action $actionCatchup -Trigger $triggerLogon -Settings $commonSettings -User $env:USERNAME -Description "Tu dong cao bu neu hom nay chua co ket qua ngay khi mo may/dang nhap" -Force

# 5. TASK TU DONG BU BUOI TOI (19h00): Quet du phong neu may bat muon
$triggerEvening = New-ScheduledTaskTrigger -Daily -At "19:00"
Register-ScheduledTask -TaskName "XSMB_AI_Catchup_Evening" -Action $actionCatchup -Trigger $triggerEvening -Settings $commonSettings -Description "Quet du phong cao bu luc 19h00 neu 18h35 may tat" -Force

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "DA CAU HINH HE THONG CRON 5 TANG TU DONG CHO 67_UP_95 THANH CONG!" -ForegroundColor Green
Write-Host "   1. 17h00: Chuan bi dan so Cho Quay" -ForegroundColor White
Write-Host "   2. 18h15: Tu kich hoat quay truc tiep (khoa chot tai G5.5)" -ForegroundColor White
Write-Host "   3. 18h37: Chot toan dien va day GitHub (lech gio Logic)" -ForegroundColor White
Write-Host "   4. Tu dong bu khi Mo may/Dang nhap (AtLogOn)" -ForegroundColor White
Write-Host "   5. Quet du phong buoi toi (19h00) co StartWhenAvailable" -ForegroundColor White
Write-Host "=================================================================" -ForegroundColor Cyan
