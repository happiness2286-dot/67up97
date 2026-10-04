$psPath = "powershell.exe"
$shortDir = "e:\DONGBO~1\NEWHAG~1\NM2026~1\DNAI_A~1\67_up_95"
$scriptPath = "$shortDir\AUTO_CRON_18H15.ps1"
$argList = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$scriptPath`""

# Dọn dẹp các Task cũ không cần thiết để tránh xung đột
$oldTasks = @("XSMB 2026 Auto Push Daily", "XSMB_Auto_Update_Daily_18h35", "XSMB_AI_AutoUpdate_18h15")
foreach ($t in $oldTasks) {
    if (Get-ScheduledTask -TaskName $t -ErrorAction SilentlyContinue) {
        Unregister-ScheduledTask -TaskName $t -Confirm:$false
        Write-Host "🗑️ Đã gỡ bỏ tác vụ cũ: $t" -ForegroundColor Yellow
    }
}

$action = New-ScheduledTaskAction -Execute $psPath -Argument $argList -WorkingDirectory $shortDir
$trigger = New-ScheduledTaskTrigger -Daily -At "17:00"
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -WakeToRun
Register-ScheduledTask -TaskName "XSMB_AI_AutoUpdate_17h00" -Action $action -Trigger $trigger -Settings $settings -Description "Tu dong kich hoat chuan bi luc 17h00 va theo doi Live Radar XSMB den 18h35" -Force
Write-Host "✅ Đã đăng ký thành công Task Scheduler XSMB_AI_AutoUpdate_17h00 (Kích hoạt lúc 17h00 mỗi ngày tại $shortDir)!" -ForegroundColor Green
