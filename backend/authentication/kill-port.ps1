# Quick script to kill process on port 3001
# Usage: .\kill-port.ps1 [port_number]

param(
    [int]$Port = 3001
)

$connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue

if ($connection) {
    $pid = $connection.OwningProcess
    $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
    
    if ($process) {
        Write-Host "Found process $pid ($($process.ProcessName)) using port $Port"
        Write-Host "Stopping process..."
        Stop-Process -Id $pid -Force
        Write-Host "✅ Port $Port is now free"
    } else {
        Write-Host "Process $pid not found"
    }
} else {
    Write-Host "No process found using port $Port"
}








