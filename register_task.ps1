$action = New-ScheduledTaskAction -Execute "wscript.exe" -Argument '"e:\DONG BO\New Ha GCCK\Năm 2026\Dự Án AI_ Antigravity\67_up_95\AUTO_CRON_SILENT.vbs"'
$trigger = New-ScheduledTaskTrigger -Daily -At "18:35"
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
Register-ScheduledTask -TaskName "XSMB_AI_AutoUpdate_18h35" -Action $action -Trigger $trigger -Settings $settings -Description "Tu dong cap nhat XSMB AI 67UP97 luc 18h35 va day len GitHub" -Force
