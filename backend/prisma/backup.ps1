# FONEVI Production Database Backup Script (Windows PowerShell)
# Creates a compressed PostgreSQL schema + data dump from Supabase

# Load Environment Variables from .env
$EnvFile = Join-Path $PSScriptRoot "..\.env"
if (Test-Path $EnvFile) {
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match '^([^#=]+)=(.*)$') {
            [System.Environment]::SetEnvironmentVariable($Matches[1].Trim(), $Matches[2].Trim())
        }
    }
}

# Config
$DB_URL = [System.Environment]::GetEnvironmentVariable("DATABASE_URL")
if (-not $DB_URL) {
    Write-Error "DATABASE_URL not found in .env. Exiting..."
    Exit 1
}

# Parse connection string
# Format: postgresql://USER:PASSWORD@HOST:PORT/DB_NAME?options
if ($DB_URL -match 'postgresql://([^:]+):([^@]+)@([^:/]+):?([0-9]*)/([^?#]+)') {
    $User = $Matches[1]
    $Pass = $Matches[2]
    $Host = $Matches[3]
    $Port = if ($Matches[4]) { $Matches[4] } else { 5432 }
    $DbName = $Matches[5]
} else {
    Write-Error "Invalid DATABASE_URL format. Exiting..."
    Exit 1
}

# Backup directory setup
$BackupDir = Join-Path $PSScriptRoot "..\backups"
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BackupFile = Join-Path $BackupDir "fonevi_backup_$Timestamp.sql"

# Setup PGPASSWORD so pg_dump doesn't prompt for password
$env:PGPASSWORD = $Pass

Write-Host "🚀 Starting PostgreSQL Backup for FONEVI..." -ForegroundColor Cyan
Write-Host "Database Name: $DbName" -ForegroundColor Cyan
Write-Host "Target Host: $Host" -ForegroundColor Cyan
Write-Host "Backup File: $BackupFile" -ForegroundColor Cyan

# Execute pg_dump
& pg_dump -h $Host -p $Port -U $User -d $DbName -F p -f $BackupFile --no-owner --no-privileges

if ($LASTEXITCODE -eq 0) {
    # Compress the SQL dump to save space
    Compress-Archive -Path $BackupFile -DestinationPath "$BackupFile.zip" -Force
    Remove-Item $BackupFile
    Write-Host "✅ Backup completed successfully: $BackupFile.zip" -ForegroundColor Green
} else {
    Write-Error "❌ Backup failed during pg_dump execution. Check pg_dump path and network connections."
}

# Clear PGPASSWORD
$env:PGPASSWORD = $null
