<#
.SYNOPSIS
Automates starting the Murder Mystery GM backend and Ngrok tunnel for remote judging demos.
.DESCRIPTION
This script verifies Ollama is running, kills stale processes on port 4000,
starts the Node.js backend in a new window, starts the Ngrok tunnel in a new window,
verifies the tunnel is publicly accessible, and copies the URL to your clipboard.
#>

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Starting Murder Mystery Demo Environment " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Ollama
Write-Host "[1/6] Checking if Ollama is running locally..." -ForegroundColor Yellow
try {
    $ollamaResponse = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -ErrorAction Stop
    Write-Host "✅ Ollama is running and responding." -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Ollama is not responding at http://localhost:11434/api/tags." -ForegroundColor Red
    Write-Host "Please start Ollama Desktop or run 'ollama serve' before continuing." -ForegroundColor Red
    exit 1
}

# 2. Kill anything already on port 4000
Write-Host "[2/6] Checking for stale processes on port 4000..." -ForegroundColor Yellow
$staleProcs = netstat -ano | Select-String ":4000\s" | ForEach-Object {
    ($_ -split '\s+')[-1]
} | Where-Object { $_ -match '^\d+$' } | Sort-Object -Unique
if ($staleProcs) {
    foreach ($procId in $staleProcs) {
        try {
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            Write-Host "   Killed stale process PID $procId on port 4000." -ForegroundColor DarkYellow
        } catch { }
    }
    Start-Sleep -Seconds 1
    Write-Host "✅ Port 4000 cleared." -ForegroundColor Green
} else {
    Write-Host "✅ Port 4000 is free." -ForegroundColor Green
}

# Also kill any lingering ngrok process to avoid "tunnel session limit" errors
$ngrokProcs = Get-Process -Name "ngrok" -ErrorAction SilentlyContinue
if ($ngrokProcs) {
    $ngrokProcs | Stop-Process -Force
    Write-Host "   Killed stale ngrok process." -ForegroundColor DarkYellow
    Start-Sleep -Seconds 1
}

# 3. Start Backend
Write-Host "[3/6] Starting Backend Server in a new window..." -ForegroundColor Yellow
try {
    if (-not (Test-Path ".\backend")) {
        Write-Host "❌ ERROR: Cannot find the 'backend' folder. Please run this script from the project root." -ForegroundColor Red
        exit 1
    }
    $scriptRoot = (Get-Location).Path
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptRoot\backend'; npm run dev"
    Write-Host "✅ Backend starting on port 4000." -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Failed to start backend." -ForegroundColor Red
    exit 1
}

# Wait for backend to actually be ready before proceeding
Write-Host "   Waiting for backend to boot..." -ForegroundColor DarkGray
$backendReady = $false
for ($i = 0; $i -lt 10; $i++) {
    Start-Sleep -Seconds 1
    try {
        $localHealth = Invoke-RestMethod -Uri "http://localhost:4000/health" -Method Get -ErrorAction Stop
        if ($localHealth.status -eq "ok") {
            $backendReady = $true
            break
        }
    } catch { }
}
if (-not $backendReady) {
    Write-Host "❌ ERROR: Backend did not respond on localhost:4000 after 10 seconds." -ForegroundColor Red
    Write-Host "Check the backend window for crash logs. Common cause: port 4000 still in use." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Backend confirmed running on localhost:4000." -ForegroundColor Green

# 4. Start Ngrok
Write-Host "[4/6] Starting Ngrok Tunnel in a new window..." -ForegroundColor Yellow
try {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "ngrok http 4000"
    Write-Host "✅ Ngrok starting." -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Failed to start Ngrok. Is it installed and in PATH?" -ForegroundColor Red
    Write-Host "Install it from https://ngrok.com/download and run: ngrok config add-authtoken <token>" -ForegroundColor Red
    exit 1
}

# 5. Wait for Ngrok to spin up and fetch the public URL
Write-Host "[5/6] Waiting for Ngrok tunnel URL..." -ForegroundColor Yellow
$ngrokUrl = $null
$retries = 15
for ($i = 0; $i -lt $retries; $i++) {
    Start-Sleep -Seconds 2
    try {
        $tunnels = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction Stop
        $ngrokUrl = $tunnels.tunnels[0].public_url
        if ($ngrokUrl) {
            break
        }
    } catch {
        # Keep waiting
    }
}

if (-not $ngrokUrl) {
    Write-Host "❌ ERROR: Could not fetch public URL from Ngrok API after 30 seconds." -ForegroundColor Red
    Write-Host "Make sure you have authenticated Ngrok: 'ngrok config add-authtoken <your-token>'" -ForegroundColor Red
    exit 1
}

# Force HTTPS
$ngrokUrl = $ngrokUrl -replace "^http://", "https://"
Write-Host "✅ Tunnel established at: $ngrokUrl" -ForegroundColor Green

# 6. Verify external reachability through the tunnel
# IMPORTANT: Ngrok's free tier returns an HTML interstitial page unless
# the request includes the 'ngrok-skip-browser-warning' header.
Write-Host "[6/6] Verifying external reachability via /health endpoint..." -ForegroundColor Yellow
$healthUrl = "$ngrokUrl/health"

$healthOk = $false
$healthRetries = 3
for ($i = 0; $i -lt $healthRetries; $i++) {
    Start-Sleep -Seconds 2
    try {
        $headers = @{ "ngrok-skip-browser-warning" = "true" }
        $healthResponse = Invoke-RestMethod -Uri $healthUrl -Method Get -Headers $headers -ErrorAction Stop
        if ($healthResponse.status -eq "ok") {
            $healthOk = $true
            break
        }
    } catch {
        # Retry
    }
}

if (-not $healthOk) {
    Write-Host "❌ ERROR: Failed to reach the backend through the tunnel!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting Steps:" -ForegroundColor Red
    Write-Host " 1. Did the backend server crash? (Check the backend window)" -ForegroundColor Red
    Write-Host " 2. Is Windows Firewall blocking port 4000? (Allow Node.js through)" -ForegroundColor Red
    Write-Host " 3. Did Ngrok hit a free-tier limit? (Check the Ngrok window)" -ForegroundColor Red
    Write-Host " 4. Try manually opening: $healthUrl in your browser." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Backend is publicly reachable through the tunnel!" -ForegroundColor Green

# Success!
Set-Clipboard -Value $ngrokUrl
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " SUCCESS! URL copied to clipboard!        " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Your Public Backend URL is: $ngrokUrl" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  NEXT STEPS FOR THE DEMO:" -ForegroundColor Yellow
Write-Host "1. Go to your Vercel Dashboard -> Settings -> Environment Variables."
Write-Host "2. Paste the URL above as the value for VITE_BACKEND_URL."
Write-Host "3. Trigger a Redeploy in Vercel to bake in the new URL."
Write-Host "4. IMPORTANT: Keep this laptop AWAKE and connected to the internet during the entire demo."
Write-Host "   (Disable sleep/lock settings in Windows temporarily if needed)."
Write-Host ""
