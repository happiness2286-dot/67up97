param(
    [string]$Mode = "Auto"
)

$scriptDir = $PSScriptRoot
if (-not $scriptDir) {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
}
if (-not $scriptDir) {
    $scriptDir = "E:\DONG BO\New Ha GCCK\Nam 2026\Du An AI_ Antigravity\67_up_95"
}
Set-Location -LiteralPath $scriptDir

$pythonExe = "C:\Users\Admin\AppData\Local\Programs\Python\Python311\python.exe"
if (-not (Test-Path $pythonExe)) { $pythonExe = "python.exe" }

$runnerPy = Join-Path $scriptDir "auto_cron_runner.py"
& $pythonExe $runnerPy --mode $Mode
exit $LASTEXITCODE
