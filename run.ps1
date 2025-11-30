# Simple one-command starter for Windows PowerShell.
# Default host: localhost, media folder: ./media, API 3001, UI 3000.

$MediaDir = "$PSScriptRoot\media"
$ApiPort = 3001
$UiPort = 3000

# Try to auto-detect a LAN IPv4; fallback to localhost
$hostIp = (Get-NetIPAddress -AddressFamily IPv4 -PrefixOrigin Manual, Dhcp |
  Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254.*" } |
  Select-Object -First 1 -ExpandProperty IPAddress)
if (-not $hostIp) { $hostIp = "localhost" }
$TargetHost = $hostIp

Set-Location $PSScriptRoot

if (-not (Test-Path "node_modules")) {
  Write-Host "Installing npm dependencies..." -ForegroundColor Cyan
  npm install
}

New-Item -ItemType Directory -Force -Path $MediaDir | Out-Null

$env:MEDIA_DIR = $MediaDir
$env:PORT = $ApiPort
$env:VITE_API_URL = "http://$TargetHost`:$ApiPort"

Write-Host "Media dir: $MediaDir" -ForegroundColor Green
Write-Host "API URL:   $env:VITE_API_URL" -ForegroundColor Green
Write-Host "UI URL:    http://$TargetHost`:$UiPort" -ForegroundColor Green

Write-Host "Starting media server (port $ApiPort)..." -ForegroundColor Cyan
$serverJob = Start-Job -ScriptBlock {
  param($dir, $media, $port)
  Set-Location $dir
  $env:MEDIA_DIR = $media
  $env:PORT = $port
  npm run server
} -ArgumentList $PSScriptRoot, $MediaDir, $ApiPort

Write-Host "Starting web app (port $UiPort)..." -ForegroundColor Cyan
$uiJob = Start-Job -ScriptBlock {
  param($dir, $apiUrl, $uiPort)
  Set-Location $dir
  $env:VITE_API_URL = $apiUrl
  npm run dev -- --host 0.0.0.0 --port $uiPort
} -ArgumentList $PSScriptRoot, "http://$TargetHost`:$ApiPort", $UiPort

Write-Host ""
Write-Host "Open: http://$TargetHost`:$UiPort" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop both jobs." -ForegroundColor Yellow

try {
  Wait-Job $serverJob, $uiJob
} finally {
  Write-Host "Stopping jobs..." -ForegroundColor Cyan
  Stop-Job $serverJob, $uiJob -ErrorAction SilentlyContinue
  Remove-Job $serverJob, $uiJob -ErrorAction SilentlyContinue
}
