@echo off
title Mercato AI Unified Dev Environment
cd /d "%~dp0"
echo ================================================================
echo  Mercato AI Platform - Starting Unified Dev Environment
echo  Auto-detecting available ports and launching services...
echo ================================================================
node scripts\dev.mjs %*
if %ERRORLEVEL% NEQ 0 (
  echo.
  echo [ERROR] Process exited with error code %ERRORLEVEL%.
  pause
)
