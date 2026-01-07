# PowerShell script to start the authentication server
# Usage: .\start-server.ps1

Write-Host "🚀 Starting Authentication Server..." -ForegroundColor Green
Write-Host ""

# Navigate to the authentication directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Check if .env file exists
if (-not (Test-Path .env)) {
    Write-Host "❌ Error: .env file not found!" -ForegroundColor Red
    Write-Host "Please create a .env file with database configuration." -ForegroundColor Yellow
    Write-Host "See SUPABASE_SETUP.md for instructions." -ForegroundColor Yellow
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path node_modules)) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies!" -ForegroundColor Red
        exit 1
    }
}

# Check if port 3001 is in use
$portInUse = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($portInUse) {
    $pid = $portInUse.OwningProcess
    $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
    Write-Host "⚠️  Port 3001 is already in use by process $pid ($($process.ProcessName))" -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "Do you want to kill the existing process and start a new server? (Y/N)"
    if ($response -eq 'Y' -or $response -eq 'y') {
        Write-Host "Stopping process $pid..." -ForegroundColor Yellow
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        Write-Host "✅ Process stopped" -ForegroundColor Green
    } else {
        Write-Host "Exiting. Please stop the existing process manually or use a different port." -ForegroundColor Yellow
        exit 1
    }
}

# Start the server
Write-Host ""
Write-Host "🚀 Starting server on port 3001..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

npm run dev






