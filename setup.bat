@echo off
setlocal

echo Setting up Bookmark Manager startup script...

REM Get current directory
set "CURRENT_DIR=%~dp0"

REM Define startup folder path
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"

REM Create the VBS content
set "VBS_FILE=%STARTUP_FOLDER%\bookmark manager.vbs"

echo Creating startup script at: "%VBS_FILE%"

REM Create the VBS file content
(
echo Set WshShell = CreateObject^("WScript.Shell"^)
echo WshShell.Run "cmd /c ""cd /d ""%CURRENT_DIR%"" && node simple-server.js""", 0, False
) > "%VBS_FILE%"

if exist "%VBS_FILE%" (
    echo Success! Bookmark Manager will now start automatically on Windows startup.
    echo The server will run at http://localhost:8666
    echo.
    echo To remove auto-startup, run: remove-autostart.bat
    echo.
    echo Starting server now...
    wscript.exe "%VBS_FILE%"
    timeout /t 2 /nobreak >nul
    echo Server started! Open http://localhost:8666 in your browser.
) else (
    echo Error: Could not create startup script.
    echo Please check if you have write permissions to the Startup folder.
)