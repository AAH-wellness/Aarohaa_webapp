# Script to stop server running on port 3001
$port = 3001
$processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($processes) {
    foreach ($pid in $processes) {
        $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "Stopping process $pid ($($proc.ProcessName))..."
            Stop-Process -Id $pid -Force
            Write-Host "Process stopped."
        }
    }
} else {
    Write-Host "No process found using port $port"
}








