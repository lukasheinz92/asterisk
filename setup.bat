@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   Asterisk Bookmark Manager Setup
echo ========================================
echo.

REM Get current directory
set "CURRENT_DIR=%~dp0"

REM Check if Node.js is available
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    goto :error
)

REM Check if instances.json already exists and show current instances
if exist "%CURRENT_DIR%data\instances.json" (
    echo Existing instances found:
    for /f "usebackq tokens=*" %%a in (`node -e "const c=require('./data/instances.json');c.instances.forEach(i=>console.log('  - '+i))"`) do (
        echo %%a
    )
    echo.
)

REM Prompt for instance names
echo Enter instance names to add (comma-separated, e.g., personal,work)
echo New instances will be merged with existing ones.
if exist "%CURRENT_DIR%data\instances.json" (
    echo Press Enter to use existing instances with no changes.
) else (
    echo Press Enter to create a "default" instance.
)
echo.
set "INSTANCES="
set /p "INSTANCES=Instance names: "

REM Skip instance processing if empty (use existing)
if "%INSTANCES%"=="" (
    if exist "%CURRENT_DIR%data\instances.json" (
        echo Using existing instances configuration.
    ) else (
        echo No instances.json found. Creating default instance...
        set "INSTANCES=default"
    )
)

if not "%INSTANCES%"=="" (
    echo.
    echo Processing...
    echo.

    REM Run the Node.js helper script to handle JSON and file creation
    node "%CURRENT_DIR%setup-helper.js" "%INSTANCES%"
    if %ERRORLEVEL% neq 0 (
        echo.
        echo Setup helper failed. Please check the error above.
        goto :error
    )
)

echo.

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
    echo.
    echo ========================================
    echo   Available URLs:
    echo ========================================
    echo.
    echo   Landing Page: http://localhost:8666/
    echo.
    REM Read instances from the file to display URLs
    for /f "usebackq tokens=*" %%a in (`node -e "const c=require('./data/instances.json');c.instances.forEach(i=>console.log(i))"`) do (
        echo   %%a: http://localhost:8666/%%a
    )
    echo.
    echo ========================================
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

goto :end

:error
echo.
echo Setup failed.
pause
exit /b 1

:end
pause
