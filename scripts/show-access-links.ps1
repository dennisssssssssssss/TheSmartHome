param(
    [int]$Port = 5110
)

function Get-LanIPv4Addresses {
    try {
        return Get-NetIPAddress -AddressFamily IPv4 -ErrorAction Stop |
            Where-Object {
                $_.IPAddress -notlike '127.*' -and
                $_.IPAddress -notlike '169.254.*' -and
                $_.PrefixOrigin -ne 'WellKnown'
            } |
            Select-Object -ExpandProperty IPAddress -Unique
    }
    catch {
        return [System.Net.Dns]::GetHostAddresses([System.Net.Dns]::GetHostName()) |
            Where-Object {
                $_.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetwork -and
                $_.ToString() -notlike '127.*' -and
                $_.ToString() -notlike '169.254.*'
            } |
            ForEach-Object { $_.ToString() } |
            Select-Object -Unique
    }
}

$ipv4Addresses = Get-LanIPv4Addresses

Write-Host ""
Write-Host "Local access:" -ForegroundColor Cyan
Write-Host "  http://localhost:$Port"

if ($ipv4Addresses.Count -eq 0) {
    Write-Host ""
    Write-Host "No LAN IPv4 addresses were detected on this machine." -ForegroundColor Yellow
    return
}

Write-Host ""
Write-Host "LAN access from another PC on the same network:" -ForegroundColor Cyan
foreach ($ipAddress in $ipv4Addresses) {
    Write-Host "  http://$ipAddress`:$Port"
}

Write-Host ""
Write-Host "If another PC still cannot connect, allow the app or port in Windows Firewall." -ForegroundColor Yellow
