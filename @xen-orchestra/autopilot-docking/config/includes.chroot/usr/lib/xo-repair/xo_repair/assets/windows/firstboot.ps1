# XO repair - first boot on XCP-ng
#
# Started at every boot as LocalSystem by the temporary service XoRepairFirstboot
# (created offline by xo-repair) until all phases are done:
#
#   standard: drivers -> finish
#   full:     drivers -> cleanup -> finish
#
#   drivers  install the Xen PV packages copied by xo-repair,
#            uninstall VMware Tools (MSI),
#            then reboot onto the PV drivers
#   cleanup  remove VMware driver packages and VMware Tools files, then reboot
#
#   A reboot is a shut down when XO follows the first boot (reboot=xo in
#   config.ini): XO starts the VM again, and knows where the first boot is.
#   finish   reapply the static IP configuration of the old adapters (network.ini),
#            remove VMware ghost devices (full mode, Windows 10 2004+ only),
#            report "done" to XO, delete the service
#
# Progress is written to C:\xo-repair\firstboot.log and, once the PV drivers are
# loaded, to xenstore (vm-data/xo-repair/out/firstboot = "<phase>:<state>").
#
# Must stay compatible with Windows PowerShell 2.0 (Windows 7 / Server 2008 R2):
# no ConvertFrom-Json, no CIM or PnpDevice cmdlets.

$ErrorActionPreference = 'Continue'
$Base = Split-Path -Parent $MyInvocation.MyCommand.Definition
$LogFile = Join-Path $Base 'firstboot.log'
$ServiceName = 'XoRepairFirstboot'
$Phases = @{ 'standard' = @('drivers', 'finish'); 'full' = @('drivers', 'cleanup', 'finish') }
$OkExitCodes = @(0, 1641, 3010)  # success, success + reboot initiated, success + reboot required

# -- helpers -------------------------------------------------------------------

function Write-Log([string]$Message) {
    $line = '{0} {1}' -f (Get-Date -Format 'yyyy-MM-ddTHH:mm:ss'), $Message
    Add-Content -Path $LogFile -Value $line
}

function Read-Config {
    $config = @{ 'msi_patterns' = '*.msi'; 'cleanup' = 'standard'; 'reboot' = 'guest'; 'max_attempts' = '3' }
    $path = Join-Path $Base 'config.ini'
    if (Test-Path $path) {
        foreach ($line in Get-Content $path) {
            if ($line -match '^\s*([^#=]+?)\s*=\s*(.*)$') { $config[$matches[1]] = $matches[2].Trim() }
        }
    }
    return $config
}

function Get-State([string]$Name, [string]$Default) {
    $path = Join-Path $Base $Name
    if (Test-Path $path) { return [string](Get-Content $path | Select-Object -First 1) }
    return $Default
}

function Set-State([string]$Name, [string]$Value) {
    Set-Content -Path (Join-Path $Base $Name) -Value $Value
}

# xenstore through the WMI interface of the PV drivers (xeniface). Best effort:
# unavailable before the PV drivers are loaded, class names differ between builds
# (XenProject* for the XCP-ng 9.x drivers). Early in the boot the WMI provider
# may not be ready yet: $Attempts tries, 10 s apart.
function Send-Status([string]$Value, [int]$Attempts = 1) {
    for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
        if ($attempt -gt 1) { Start-Sleep -Seconds 10 }
        foreach ($class in @('XenProjectXenStoreBase', 'CitrixXenStoreBase', 'XenStoreBase')) {
            try {
                $base = Get-WmiObject -Namespace root\wmi -Class $class -ErrorAction Stop | Select-Object -First 1
                if (-not $base) { continue }
                $sessionId = $base.AddSession('xo-repair').SessionId
                $sessionClass = $class -replace 'Base$', 'Session'
                $session = Get-WmiObject -Namespace root\wmi -Query "select * from $sessionClass where SessionId=$sessionId"
                $session.SetValue('vm-data/xo-repair/out/firstboot', $Value) | Out-Null
                $session.EndSession() | Out-Null
                Write-Log "status sent: $Value"
                return
            } catch {
                continue
            }
        }
    }
    Write-Log "status not sent (xenstore WMI interface unavailable): $Value"
}

# The services are disabled offline, but the VMware user process is started at
# logon from the Run keys (SOFTWARE hive), and crashes without its services
# ("VMware Tools unrecoverable error"). The MSI uninstall removes it later.
function Remove-VmwareAutorun {
    foreach ($key in @('HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run',
                       'HKLM:\SOFTWARE\Wow6432Node\Microsoft\Windows\CurrentVersion\Run')) {
        $values = Get-ItemProperty -Path $key -ErrorAction SilentlyContinue
        if (-not $values) { continue }
        foreach ($property in $values.PSObject.Properties) {
            if ($property.Name -like 'PS*') { continue }
            if ([string]$property.Value -like '*\VMware\VMware Tools\*') {
                Remove-ItemProperty -Path $key -Name $property.Name -ErrorAction SilentlyContinue
                Write-Log "removed autorun $($property.Name) from $key"
            }
        }
    }
}

# xo-repair wrote this folder through ntfs-3g, which leaves it writable by every user of the guest, while
# its script and packages run as LocalSystem: restricted to SYSTEM and the administrators, by SID since the
# names of the groups are localized. At every run, before anything is read from the folder
function Protect-Base {
    $output = & icacls.exe $Base /inheritance:r /grant:r '*S-1-5-18:(OI)(CI)F' '*S-1-5-32-544:(OI)(CI)F' 2>&1 |
        Out-String
    if ($LASTEXITCODE -eq 0) {
        # the files take the access of the folder
        $output = & icacls.exe (Join-Path $Base '*') /reset /T /C 2>&1 | Out-String
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Log "warning: the access to $Base could not be restricted: $($output.Trim())"
    }
}

function Remove-FirstbootService {
    & sc.exe delete $ServiceName | Out-Null
    Write-Log "service $ServiceName removed"
}

function Restart-Now([string]$Reason) {
    if ($script:Config['reboot'] -eq 'xo') {
        # XO starts the VM again. Only sent once the PV drivers are loaded: XO
        # does not rely on it, a stopped VM is what it waits for
        Send-Status "$($script:Phase):reboot"
        Write-Log "shutting down, XO starts the VM again: $Reason"
        & shutdown.exe /s /t 15 /c "XO repair: $Reason, XO starts the VM again"
        exit 0
    }
    Write-Log "rebooting: $Reason"
    & shutdown.exe /r /t 15 /c "XO repair: $Reason"
    exit 0
}

function Stop-Attempt([string]$Reason) {
    Write-Log $Reason
    Send-Status "$($script:Phase):error"
    if ($script:Attempt -ge [int]$script:Config['max_attempts']) {
        Write-Log 'maximum number of attempts reached, giving up'
        Send-Status "$($script:Phase):failed"
        Remove-FirstbootService
    } elseif ($script:Config['reboot'] -eq 'xo') {
        # XO follows the first boot: the next attempt is now, not at a boot nobody does. A reboot and
        # not a shut down, which XO would take for the end of the phase
        Write-Log "rebooting for attempt $($script:Attempt + 1)"
        & shutdown.exe /r /t 15 /c "XO repair: $Reason, retrying"
    }
    exit 1
}

# Copied from the guest tools disk by xo-repair. Only from there: what is installed as LocalSystem must come
# from a folder only SYSTEM and the administrators can write, see Protect-Base
function Find-Package([string]$Pattern) {
    $local = Join-Path $Base 'packages'
    if (-not (Test-Path $local)) { return $null }
    $found = Get-ChildItem -Path $local -Filter $Pattern -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) { return $found.FullName }
    return $null
}

function Invoke-Msi([string[]]$Arguments) {
    $process = Start-Process -FilePath msiexec.exe -ArgumentList $Arguments -Wait -PassThru
    return $process.ExitCode
}

function Test-VMwareSigned([string]$Path) {
    $signature = Get-AuthenticodeSignature -FilePath $Path -ErrorAction SilentlyContinue
    return ($signature -and $signature.SignerCertificate -and $signature.SignerCertificate.Subject -match 'VMware')
}

# Locked files are deleted at the next boot (MoveFileEx + MOVEFILE_DELAY_UNTIL_REBOOT)
Add-Type -ErrorAction SilentlyContinue -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class XoRepairFile {
    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    public static extern bool MoveFileEx(string existing, string replacement, int flags);
}
'@

function Remove-FileOrSchedule([string]$Path) {
    try {
        Remove-Item -LiteralPath $Path -Force -ErrorAction Stop
        Write-Log "deleted $Path"
    } catch {
        if ([XoRepairFile]::MoveFileEx($Path, $null, 4)) { Write-Log "scheduled for deletion at reboot: $Path" }
        else { Write-Log "cannot delete $Path" }
    }
}

# INF provider, resolving %Token% from the [Strings] section
function Get-InfProvider([string]$Path) {
    $content = Get-Content -LiteralPath $Path -ErrorAction SilentlyContinue
    $provider = ''
    foreach ($line in $content) {
        if ($line -match '^\s*Provider\s*=\s*(.+?)\s*$') { $provider = $matches[1]; break }
    }
    if ($provider -match '^%(.+)%$') {
        $token = [regex]::Escape($matches[1])
        foreach ($line in $content) {
            if ($line -match "^\s*$token\s*=\s*`"?(.*?)`"?\s*$") { return $matches[1] }
        }
    }
    return $provider.Trim('"')
}

# -- phases --------------------------------------------------------------------

function Invoke-DriversPhase {
    # The XCP-ng 9.x MSI runs a managed custom action that needs .NET 4.x:
    # without it, msiexec only says 1603.
    $ndp = Get-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full' -ErrorAction SilentlyContinue
    if ($ndp) {
        Write-Log ".NET Framework 4.x release $($ndp.Release)"
    } else {
        Write-Log 'warning: .NET Framework 4.x not found, the XCP-ng 9.x PV drivers will fail to install (1603)'
    }
    foreach ($pattern in $Config['msi_patterns'].Split(';')) {
        if (-not $pattern) { continue }
        $msi = Find-Package $pattern
        if (-not $msi) { Stop-Attempt "no package matching $pattern in $Base\packages" }
        $name = [IO.Path]::GetFileNameWithoutExtension($msi)
        Write-Log "installing $msi"
        $code = Invoke-Msi @('/i', "`"$msi`"", '/qn', '/norestart', '/l*v', "`"$(Join-Path $Base "install-$name.log")`"")
        Write-Log "msiexec exit code $code"
        if ($OkExitCodes -notcontains $code) { Stop-Attempt "installation of $msi failed" }
    }

    # VMware Tools: best effort, the uninstaller sometimes refuses to run outside
    # VMware. Its services and drivers were already disabled offline.
    $uninstallKeys = @(
        'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*',
        'HKLM:\SOFTWARE\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*'
    )
    $entries = Get-ItemProperty -Path $uninstallKeys -ErrorAction SilentlyContinue |
        Where-Object { $_.DisplayName -like 'VMware Tools*' }
    foreach ($entry in $entries) {
        if ($entry.PSChildName -match '^\{[0-9A-Fa-f-]+\}$') {
            $code = Invoke-Msi @('/x', $entry.PSChildName, '/qn', '/norestart')
            Write-Log "VMware Tools removal exit code $code"
        }
    }
}

function Invoke-CleanupPhase {
    # 1. VMware driver packages from the driver store. vsock is kept on purpose:
    #    removing it means editing the Winsock catalog, which this tool avoids.
    foreach ($inf in Get-ChildItem -Path "$env:SystemRoot\INF" -Filter 'oem*.inf' -ErrorAction SilentlyContinue) {
        $provider = Get-InfProvider $inf.FullName
        if ($provider -notmatch 'VMware') { continue }
        if ((Get-Content -LiteralPath $inf.FullName | Out-String) -match 'vsock') {
            Write-Log "keeping $($inf.Name) (vsock)"
            continue
        }
        $output = & pnputil.exe -f -d $inf.Name 2>&1 | Out-String
        Write-Log "pnputil -f -d $($inf.Name): $($output.Trim())"
    }

    # 2. VMware Tools files. Whole directories, they only hold VMware Tools.
    $directories = @(
        "$env:ProgramFiles\VMware\VMware Tools",
        "$env:ProgramData\VMware\VMware Tools",
        "$env:ProgramData\VMware\VMware CAF",
        "$env:ProgramData\VMware\VMware VGAuth"
    )
    if (${env:ProgramFiles(x86)}) { $directories += "${env:ProgramFiles(x86)}\VMware\VMware Tools" }
    foreach ($directory in $directories) {
        if (-not (Test-Path -LiteralPath $directory)) { continue }
        Get-ChildItem -LiteralPath $directory -Recurse -Force -ErrorAction SilentlyContinue |
            Where-Object { -not $_.PSIsContainer } |
            ForEach-Object { Remove-FileOrSchedule $_.FullName }
        Remove-Item -LiteralPath $directory -Recurse -Force -ErrorAction SilentlyContinue
    }

    # 3. System32: only files signed by VMware, vsock excluded (see above)
    $system32 = Join-Path $env:SystemRoot 'System32'
    $candidates = @()
    $candidates += Get-ChildItem -Path $system32 -Filter 'vm*.dll' -ErrorAction SilentlyContinue
    $candidates += Get-ChildItem -Path (Join-Path $system32 'drivers') -Filter 'vm*.sys' -ErrorAction SilentlyContinue
    $candidates += Get-ChildItem -Path (Join-Path $system32 'drivers') -Filter 'pvscsi.sys' -ErrorAction SilentlyContinue
    foreach ($file in $candidates) {
        if ($file.Name -match 'vsock') { continue }
        if (Test-VMwareSigned $file.FullName) { Remove-FileOrSchedule $file.FullName }
    }
}

# Static IP configuration of the old (VMware) adapters, captured offline by
# xo-repair, applied to the new adapter with the same MAC. network.ini: one
# adapter per line, mac|addresses|masks|gateways|dns, lists comma-separated.
function Set-StaticNetwork {
    $path = Join-Path $Base 'network.ini'
    if (-not (Test-Path $path)) { return }
    foreach ($line in Get-Content $path) {
        if (-not $line.Trim()) { continue }
        $fields = $line.Split('|')
        $mac = $fields[0].ToUpper()
        $adapter = $null
        # the PV adapter can show up late after boot: wait up to one minute
        for ($i = 0; $i -lt 12 -and -not $adapter; $i++) {
            $adapter = Get-WmiObject Win32_NetworkAdapterConfiguration -Filter 'IPEnabled=TRUE' |
                Where-Object { $_.MACAddress -eq $mac } | Select-Object -First 1
            if (-not $adapter) { Start-Sleep -Seconds 5 }
        }
        if (-not $adapter) { Stop-Attempt "no network adapter with MAC ${mac}" }
        $addresses = [string[]]@($fields[1].Split(',') | Where-Object { $_ })
        $masks = [string[]]@($fields[2].Split(',') | Where-Object { $_ })
        $gateways = [string[]]@($fields[3].Split(',') | Where-Object { $_ })
        $dns = [string[]]@($fields[4].Split(',') | Where-Object { $_ })
        # 0: done, 1: done, reboot required
        $codes = @($adapter.EnableStatic($addresses, $masks).ReturnValue)
        if ($gateways.Count) {
            $metrics = [uint16[]]@($gateways | ForEach-Object { 1 })
            $codes += $adapter.SetGateways($gateways, $metrics).ReturnValue
        }
        if ($dns.Count) { $codes += $adapter.SetDNSServerSearchOrder($dns).ReturnValue }
        Write-Log "static IP on ${mac} ($($adapter.Description)): $($fields[1]) gateway $($fields[3]) dns $($fields[4]), results $($codes -join ',')"
        foreach ($code in $codes) {
            if ($code -gt 1) { Stop-Attempt "static IP configuration of ${mac} failed ($code)" }
        }
    }
}

function Invoke-FinishPhase {
    Set-StaticNetwork
    if ($Config['cleanup'] -eq 'full') {
        # Ghost VMware PCI devices (vendor 15AD). pnputil /remove-device exists
        # since Windows 10 2004 (build 19041); older versions keep them, which is
        # harmless since the old static IPs were cleared offline.
        $build = [int](Get-WmiObject Win32_OperatingSystem).BuildNumber
        if ($build -ge 19041) {
            $enum = 'HKLM:\SYSTEM\CurrentControlSet\Enum\PCI'
            foreach ($device in Get-ChildItem -Path $enum -ErrorAction SilentlyContinue |
                    Where-Object { $_.PSChildName -like 'VEN_15AD*' }) {
                foreach ($instance in Get-ChildItem -Path $device.PSPath -ErrorAction SilentlyContinue) {
                    $id = "PCI\$($device.PSChildName)\$($instance.PSChildName)"
                    $output = & pnputil.exe /remove-device $id 2>&1 | Out-String
                    Write-Log "pnputil /remove-device ${id}: $($output.Trim())"
                }
            }
        } else {
            Write-Log "build ${build}: ghost devices left in place"
        }
    }
}

# -- main ------------------------------------------------------------------------

Protect-Base
$Config = Read-Config
$Plan = $Phases[$Config['cleanup']]
if (-not $Plan) { $Plan = $Phases['standard'] }
$Phase = Get-State 'phase' $Plan[0]
if ($Phase -eq 'done') {
    # a previous run finished but could not delete the service
    Remove-FirstbootService
    exit 0
}
$Attempt = [int](Get-State 'attempts' '0') + 1
Set-State 'attempts' $Attempt
Write-Log "phase $Phase, attempt $Attempt ($($Config['cleanup']) cleanup)"
Send-Status "${Phase}:running"
Remove-VmwareAutorun

$index = [array]::IndexOf($Plan, $Phase)
if ($index -lt 0) { Stop-Attempt "unknown phase $Phase" }
$next = $null
if ($index -lt $Plan.Length - 1) { $next = $Plan[$index + 1] }

switch ($Phase) {
    'drivers' { Invoke-DriversPhase }
    'cleanup' { Invoke-CleanupPhase }
    'finish'  { Invoke-FinishPhase }
}

if ($next) {
    Set-State 'phase' $next
    Set-State 'attempts' '0'
    Restart-Now "$Phase done"
}

Set-State 'phase' 'done'
Set-Content -Path (Join-Path $Base 'firstboot.done') -Value (Get-Date -Format 's')
Send-Status 'done' -Attempts 6  # the signal XO waits for
Remove-FirstbootService
Write-Log 'all phases done'
