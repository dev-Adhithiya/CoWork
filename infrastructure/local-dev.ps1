# Co-Work - Local Development Setup
# Run this to set up and run locally

param(
    [switch]$Install,
    [switch]$Run
)

$ErrorActionPreference = "Stop"
$AppPath = ".."

Write-Host "========================================"
Write-Host "Co-Work - Local Development"
Write-Host "========================================"

if ($Install) {
    Write-Host "Installing dependencies..."
    Set-Location $AppPath
    npm install
    
    Write-Host ""
    Write-Host "Dependencies installed!"
    Write-Host ""
}

if ($Run) {
    Set-Location $AppPath
    
    # Check for .env file
    if (-not (Test-Path ".env")) {
        Write-Host "Error: .env file not found"
        Write-Host "Copy .env.example to .env and fill in your values"
        exit 1
    }
    
    Write-Host "Starting Co-Work server..."
    npm run dev
}

if (-not $Install -and -not $Run) {
    Write-Host "Usage:"
    Write-Host "  .\local-dev.ps1 -Install    # Install dependencies"
    Write-Host "  .\local-dev.ps1 -Run        # Run local server"
    Write-Host "  .\local-dev.ps1 -Install -Run  # Both"
}
