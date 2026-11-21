#Requires -Version 5.1
# Asterisk Bookmark Manager - unified interactive setup/management script.
# Handles: Node.js check/install, instance add/remove, autostart (Scheduled Task), start/stop server.

$ErrorActionPreference = 'Stop'

$ScriptDir = $PSScriptRoot
$DataDir = Join-Path $ScriptDir 'data'
$InstancesFile = Join-Path $DataDir 'instances.json'
$ReservedNames = @('api', 'data', 'app', 'styles', 'images', 'icons', 'global')
$TaskName = 'AsteriskBookmarkManager'
$Port = 8666

$DefaultBookmarkConfig = [ordered]@{
    tabSortOrder = [ordered]@{}
    tabs = @()
}

function Test-NodeInstalled {
    return [bool](Get-Command node -ErrorAction SilentlyContinue)
}

function Install-Node {
    Write-Host "Node.js is required but was not found." -ForegroundColor Yellow
    $answer = Read-Host "Install it now via winget? (y/n)"
    if ($answer -notmatch '^(y|yes)$') { return $false }

    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        Write-Host "winget is not available on this system. Install Node.js manually from https://nodejs.org/ and re-run this script." -ForegroundColor Red
        return $false
    }

    winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements

    # winget updates the machine/user PATH but this process's copy is stale until refreshed
    $env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path', 'User')
    return (Test-NodeInstalled)
}

function Get-Instances {
    if (-not (Test-Path $InstancesFile)) { return @() }
    try {
        $config = Get-Content $InstancesFile -Raw | ConvertFrom-Json
        if ($config.instances) { return @($config.instances) }
        return @()
    } catch {
        Write-Host "Warning: could not parse instances.json ($($_.Exception.Message)); treating as empty." -ForegroundColor Yellow
        return @()
    }
}

function Save-Instances {
    param([string[]]$InstanceList)
    if (-not (Test-Path $DataDir)) { New-Item -ItemType Directory -Path $DataDir | Out-Null }
    $obj = [ordered]@{ instances = @($InstanceList) }
    $obj | ConvertTo-Json -Depth 5 | Set-Content -Path $InstancesFile -Encoding utf8
}

function New-InstanceDataFile {
    param([string]$Name)
    $file = Join-Path $DataDir "bookmarks-$Name.json"
    if (Test-Path $file) {
        Write-Host "  Exists:  bookmarks-$Name.json"
        return
    }
    $DefaultBookmarkConfig | ConvertTo-Json -Depth 5 | Set-Content -Path $file -Encoding utf8
    Write-Host "  Created: bookmarks-$Name.json" -ForegroundColor Green
}

function Add-Instances {
    param([string[]]$Names)

    $invalid = $Names | Where-Object { $ReservedNames -contains $_ }
    if ($invalid) {
        Write-Host "ERROR: Reserved names cannot be used: $($invalid -join ', ')" -ForegroundColor Red
        return
    }

    $all = @(Get-Instances)
    $added = @()
    foreach ($n in $Names) {
        if ($all -notcontains $n) {
            $all += $n
            $added += $n
        }
    }

    Save-Instances $all
    foreach ($n in $all) { New-InstanceDataFile $n }

    if ($added.Count -gt 0) {
        Write-Host "Added: $($added -join ', ')" -ForegroundColor Green
    } else {
        Write-Host "No new instances added (all already existed)."
    }
}

function Remove-Instance {
    param([string]$Name)

    $existing = Get-Instances
    if ($existing -notcontains $Name) {
        Write-Host "Instance '$Name' not found." -ForegroundColor Yellow
        return
    }

    Save-Instances @($existing | Where-Object { $_ -ne $Name })
    Write-Host "Removed '$Name' from instances.json." -ForegroundColor Green

    $deleteData = Read-Host "Also delete its bookmark data file (bookmarks-$Name.json)? This cannot be undone. (y/n)"
    if ($deleteData -match '^(y|yes)$') {
        $file = Join-Path $DataDir "bookmarks-$Name.json"
        if (Test-Path $file) {
            Remove-Item $file -Force
            Write-Host "Deleted bookmarks-$Name.json" -ForegroundColor Green
        }
    }
}

function Get-AutostartTask {
    $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if ($task) { return $task }
    # The ScheduledTasks cmdlets enumerate tasks via CIM, and a single task
    # with malformed XML anywhere on the machine (often third-party) makes
    # them fail for every task - Get-ScheduledTask then silently returns
    # $null even though ours exists. schtasks.exe looks the task up directly,
    # so fall back to it for the existence check.
    schtasks.exe /query /tn $TaskName *> $null
    if ($LASTEXITCODE -eq 0) { return [pscustomobject]@{ TaskName = $TaskName } }
    return $null
}

function Test-IsAdmin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = [Security.Principal.WindowsPrincipal]::new($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Request-ElevatedRelaunch {
    if (Test-IsAdmin) { return }
    $relaunch = Read-Host "This requires Administrator rights. Relaunch setup.ps1 elevated now? (y/n)"
    if ($relaunch -match '^(y|yes)$') {
        Start-Process powershell -Verb RunAs -ArgumentList "-NoExit -ExecutionPolicy Bypass -File `"$PSCommandPath`""
        exit
    }
}

function Register-Autostart {
    # Launch node with CreateNoWindow so no console is ever allocated for it.
    # (Running it inline under "powershell -WindowStyle Hidden" isn't enough:
    # when Windows Terminal is the default terminal app, its console
    # delegation doesn't honor the hidden window request, so a visible
    # terminal window sticks around for the server's whole lifetime.)
    $innerScript = @"
`$psi = [System.Diagnostics.ProcessStartInfo]::new()
`$psi.FileName = 'node.exe'
`$psi.Arguments = 'simple-server.js'
`$psi.WorkingDirectory = '$ScriptDir'
`$psi.UseShellExecute = `$false
`$psi.CreateNoWindow = `$true
[System.Diagnostics.Process]::Start(`$psi) | Out-Null
"@
    $encodedCommand = [Convert]::ToBase64String([System.Text.Encoding]::Unicode.GetBytes($innerScript))
    $action = New-ScheduledTaskAction -Execute 'powershell.exe' `
        -Argument "-NoLogo -NonInteractive -WindowStyle Hidden -EncodedCommand $encodedCommand"
    $trigger = New-ScheduledTaskTrigger -AtLogOn
    $settings = New-ScheduledTaskSettingsSet -Hidden -ExecutionTimeLimit ([TimeSpan]::Zero) `
        -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
    try {
        # -ErrorAction Stop is required here: this CIM-backed cmdlet does not
        # reliably honor the script-level $ErrorActionPreference on failure.
        Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings `
            -Description 'Starts the Asterisk Bookmark Manager server at logon.' -ErrorAction Stop | Out-Null
        Write-Host "Autostart enabled (Scheduled Task '$TaskName')." -ForegroundColor Green
    } catch {
        Write-Host "Failed to register scheduled task: $($_.Exception.Message)" -ForegroundColor Red
        Request-ElevatedRelaunch
    }
}

function Unregister-Autostart {
    try {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction Stop
        Write-Host "Autostart disabled." -ForegroundColor Green
    } catch {
        # Same CIM issue as in Get-AutostartTask: fall back to schtasks.exe.
        $cimError = $_.Exception.Message
        $schtasksOutput = schtasks.exe /delete /tn $TaskName /f 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Autostart disabled." -ForegroundColor Green
            return
        }
        Write-Host "Failed to remove scheduled task: $cimError" -ForegroundColor Red
        Write-Host "schtasks.exe: $($schtasksOutput -join ' ')" -ForegroundColor Red
        Request-ElevatedRelaunch
    }
}

function Get-ServerProcessId {
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($conn) { return $conn.OwningProcess }
    return $null
}

function Start-Server {
    if (Get-ServerProcessId) {
        Write-Host "Server already running on port $Port." -ForegroundColor Yellow
        return
    }
    $psi = [System.Diagnostics.ProcessStartInfo]::new()
    $psi.FileName = 'node.exe'
    $psi.Arguments = 'simple-server.js'
    $psi.WorkingDirectory = $ScriptDir
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    [System.Diagnostics.Process]::Start($psi) | Out-Null
    Start-Sleep -Milliseconds 800
    if (Get-ServerProcessId) {
        Write-Host "Server started: http://localhost:$Port/" -ForegroundColor Green
    } else {
        Write-Host "Server may have failed to start - check for errors." -ForegroundColor Yellow
    }
}

function Stop-Server {
    $procId = Get-ServerProcessId
    if (-not $procId) {
        Write-Host "Server is not running." -ForegroundColor Yellow
        return
    }
    Stop-Process -Id $procId -Force
    Write-Host "Server stopped." -ForegroundColor Green
}

function Show-Urls {
    Write-Host ""
    Write-Host "Landing page: http://localhost:$Port/"
    foreach ($i in (Get-Instances | Sort-Object)) {
        Write-Host "  $i : http://localhost:$Port/$i/"
    }
    Write-Host ""
}

# ---- Main ----

Write-Host "========================================"
Write-Host "  Asterisk Bookmark Manager - Setup"
Write-Host "========================================"
Write-Host ""

if (-not (Test-NodeInstalled)) {
    if (-not (Install-Node)) {
        Write-Host "Node.js is required to continue. Exiting." -ForegroundColor Red
        exit 1
    }
}

if (-not (Test-Path $DataDir)) { New-Item -ItemType Directory -Path $DataDir | Out-Null }

if ((Get-Instances).Count -eq 0) {
    Write-Host "No instances configured yet."
    $inputStr = Read-Host "Enter instance name(s), comma-separated (Enter for 'default')"
    if ([string]::IsNullOrWhiteSpace($inputStr)) { $inputStr = 'default' }
    $names = $inputStr -split ',' | ForEach-Object { $_.Trim().ToLower() } | Where-Object { $_ -ne '' }
    Add-Instances $names
}

$exit = $false
while (-not $exit) {
    $instances = Get-Instances
    $task = Get-AutostartTask
    $procId = Get-ServerProcessId

    Write-Host ""
    Write-Host "---- Current status ----"
    Write-Host ("Instances : {0}" -f $(if ($instances.Count -gt 0) { $instances -join ', ' } else { '(none)' }))
    Write-Host ("Autostart : {0}" -f $(if ($task) { 'Enabled' } else { 'Disabled' }))
    Write-Host ("Server    : {0}" -f $(if ($procId) { "Running (PID $procId)" } else { 'Stopped' }))
    Write-Host "-------------------------"
    Write-Host ""
    Write-Host "[1] Add instance(s)"
    Write-Host "[2] Remove an instance"
    Write-Host "[3] $(if ($task) { 'Disable' } else { 'Enable' }) autostart"
    Write-Host "[4] $(if ($procId) { 'Stop' } else { 'Start' }) server now"
    Write-Host "[5] Show URLs"
    Write-Host "[0] Exit"
    Write-Host ""
    $choice = Read-Host "Choose an option"

    switch ($choice) {
        '1' {
            $inputStr = Read-Host "Enter instance name(s) to add, comma-separated"
            $names = $inputStr -split ',' | ForEach-Object { $_.Trim().ToLower() } | Where-Object { $_ -ne '' }
            if ($names.Count -gt 0) { Add-Instances $names }
        }
        '2' {
            if ($instances.Count -eq 0) {
                Write-Host "No instances to remove." -ForegroundColor Yellow
            } else {
                Write-Host "Existing instances: $($instances -join ', ')"
                $name = Read-Host "Instance name to remove"
                if ($name) { Remove-Instance $name.Trim().ToLower() }
            }
        }
        '3' { if ($task) { Unregister-Autostart } else { Register-Autostart } }
        '4' { if ($procId) { Stop-Server } else { Start-Server } }
        '5' { Show-Urls }
        '0' { $exit = $true }
        default { Write-Host "Invalid choice." -ForegroundColor Yellow }
    }
}

Write-Host "Done."
