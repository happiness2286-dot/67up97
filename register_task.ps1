$psPath = "powershell.exe"
$scriptPath = 'e:\DONG BO\New Ha GCCK\Năm 2026\Dự Án AI_ Antigravity\67_up_95\AUTO_CRON_18H15.ps1'
$argList = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$scriptPath`""

$action = New-ScheduledTaskAction -Execute $psPath -Argument $argList
$trigger = New-ScheduledTaskTrigger -Daily -At "18:14"
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
Register-ScheduledTask -TaskName "XSMB_AI_AutoUpdate_18h15" -Action $action -Trigger $trigger -Settings $settings -Description "Tu dong theo doi Live Radar XSMB luc 18h14, tu khoa chot khi het G5 va day len GitHub" -Force
Write-Host "✅ Đã đăng ký thành công Task Scheduler XSMB_AI_AutoUpdate_18h15 (Kích hoạt lúc 18h14 mỗi ngày)!" -ForegroundColor Green
