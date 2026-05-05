# Serves this folder on port 8080 so your phone can open the site.
# 127.0.0.1 on the phone = the phone itself (wrong). Use the URL printed below.

Set-Location $PSScriptRoot
$port = 8080

$lanIps = @(
  Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.IPAddress -notmatch '^127\.' } |
    Select-Object -ExpandProperty IPAddress -Unique
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Phone / tablet: DO NOT use 127.0.0.1" -ForegroundColor Yellow
Write-Host "  That address means THIS device only." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
if ($lanIps.Count -gt 0) {
  Write-Host "Try one of these on your phone (same Wi-Fi as this PC):" -ForegroundColor Green
  foreach ($ip in $lanIps) {
    Write-Host ("  http://{0}:{1}" -f $ip, $port) -ForegroundColor White
  }
} else {
  Write-Host "Could not detect LAN IP. Run ipconfig and use your Wi-Fi IPv4." -ForegroundColor Yellow
}
Write-Host ""
Write-Host "Press Ctrl+C to stop the server." -ForegroundColor DarkGray
Write-Host ""

python -m http.server $port --bind 0.0.0.0
