$action = New-ScheduledTaskAction -Execute "wscript.exe" -Argument '"e:\DONG BO\New Ha GCCK\Năm 2026\Dự Án AI_ Antigravity\67_up_95\AUTO_CRON_SILENT.vbs"'
$trigger = New-ScheduledTaskTrigger -Daily -At "18:15"
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
Register-ScheduledTask -TaskName "XSMB_AI_AutoUpdate_18h15" -Action $action -Trigger $trigger -Settings $settings -Description "Tu dong theo doi Live Radar XSMB luc 18h15 va cap nhat day len GitHub" -Force
