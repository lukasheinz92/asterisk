@echo off
setlocal

echo Removing Bookmark Manager autostart...

REM Stop the server first
echo Stopping server...
taskkill /f /im node.exe /fi "WINDOWTITLE eq simple-server.js*" 2>nul
taskkill /f /im node.exe /fi "IMAGENAME eq node.exe" 2>nul

REM Kill processes on port 8666
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8666') do (
    taskkill /f /pid %%a 2>nul
)

REM Remove the startup VBS file
set "VBS_FILE=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\bookmark manager.vbs"

if exist "%VBS_FILE%" (
    del "%VBS_FILE%"
    if not exist "%VBS_FILE%" (
        echo Success! Bookmark Manager autostart has been removed.
        echo The server has been stopped and will no longer start automatically.
    ) else (
        echo Error: Could not delete the startup file.
        echo Please check if you have write permissions.
    )
) else (
    echo Autostart file not found. Bookmark Manager was not set to start automatically.
)

echo.
echo Server stopped.