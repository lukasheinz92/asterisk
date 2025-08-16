@echo off
setlocal

echo Stopping Bookmark Manager server...

REM Kill any Node.js processes running simple-server.js
taskkill /f /im node.exe /fi "WINDOWTITLE eq simple-server.js*" 2>nul
taskkill /f /im node.exe /fi "IMAGENAME eq node.exe" 2>nul

REM More specific approach - kill processes on port 8666
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8666') do (
    taskkill /f /pid %%a 2>nul
)

echo Server stopped.