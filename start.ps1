# Mercato AI Unified PowerShell Startup Script
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -Path $ScriptDir

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " Mercato AI Platform - Starting Unified Dev Environment" -ForegroundColor Green
Write-Host " Auto-detecting available ports and launching services..." -ForegroundColor White
Write-Host "================================================================" -ForegroundColor Cyan

node scripts/dev.mjs $args
