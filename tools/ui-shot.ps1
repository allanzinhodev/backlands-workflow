# Launch the AstraClient, wait for the login screen, screenshot its window and
# close it. This is how a UI change gets verified: the client is the only thing
# that renders OTUI, so "it should look right" is never good enough.
#
#   powershell -File tools/ui-shot.ps1 -Out shot.png
#   powershell -File tools/ui-shot.ps1 -Out shot.png -Wait 25
#
# The screenshot is window-relative: pixel (0,0) is the window's top-left, so
# coordinates from it feed straight back into tools/pixelui/probe.js.
param(
  [Parameter(Mandatory = $true)][string]$Out,
  [int]$Wait = 18,
  [string]$ClientDir,
  [switch]$KeepOpen
)

$ErrorActionPreference = 'Stop'
# resolved here, not as a param default: $PSScriptRoot is not populated yet
# while the param block is being bound under Windows PowerShell 5.1
if (-not $ClientDir) { $ClientDir = Join-Path $PSScriptRoot '..\client' }
Add-Type -AssemblyName System.Drawing
Add-Type @"
using System; using System.Runtime.InteropServices;
public class UiShot {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr h, IntPtr after, int x, int y, int cx, int cy, uint flags);
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L, T, R, B; }
}
"@

$exe = Join-Path $ClientDir 'otclient_gl_x64.exe'
if (-not (Test-Path $exe)) { throw "client binary not found: $exe (build vc23/otclient.sln, config OpenGL|x64)" }

# a stale instance both steals the screenshot and locks the exe against relinking
$stale = @(Get-Process otclient_gl_x64 -ErrorAction SilentlyContinue)
if ($stale.Count) { Write-Output "stopping $($stale.Count) stale client process(es)"; $stale | Stop-Process -Force; Start-Sleep -Seconds 2 }

$log = [System.IO.Path]::ChangeExtension($Out, '.log')
$proc = Start-Process -FilePath $exe -WorkingDirectory $ClientDir -PassThru `
          -RedirectStandardOutput $log -RedirectStandardError "$log.err"
Start-Sleep -Seconds $Wait

$live = @(Get-Process -Id $proc.Id -ErrorAction SilentlyContinue)
if (-not $live.Count) { throw "client exited before the screenshot - see $log" }

[void][UiShot]::SetForegroundWindow($proc.MainWindowHandle)
Start-Sleep -Seconds 2

# The client restores its last window position, which may be mostly off-screen.
# CopyFromScreen can only read what is actually on the desktop, so an off-screen
# window screenshots as blank - move it fully into view first.
# 0x0001 = SWP_NOSIZE, 0x0004 = SWP_NOZORDER, 0x0010 = SWP_NOACTIVATE
[void][UiShot]::SetWindowPos($proc.MainWindowHandle, [IntPtr]::Zero, 0, 0, 0, 0, 0x0015)
Start-Sleep -Milliseconds 800

$r = New-Object UiShot+RECT
[void][UiShot]::GetWindowRect($proc.MainWindowHandle, [ref]$r)
$w = $r.R - $r.L; $h = $r.B - $r.T

$bmp = New-Object System.Drawing.Bitmap $w, $h
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($r.L, $r.T, 0, 0, $bmp.Size)
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Output "saved $Out (${w}x${h})"

# surface anything the client complained about; the audio errors are expected on
# machines with no sound device and are not a UI problem
$ui = Select-String -Path $log -Pattern 'ERROR|FATAL' -ErrorAction SilentlyContinue |
      Where-Object { $_.Line -notmatch 'audio' }
if ($ui) { Write-Output "--- client errors ---"; $ui | ForEach-Object { Write-Output $_.Line } }
else { Write-Output "no UI errors in $log" }

if (-not $KeepOpen) { Stop-Process -Id $proc.Id -Force }
