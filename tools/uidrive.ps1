<#
.SYNOPSIS
    Pilota o AstraClient rodando: manda Lua para dentro dele e traz o resultado.

.DESCRIPTION
    A verificacao de UI exige o cliente rodando, e automacao de mouse erra o widget
    por 2px. Este script conversa com o mod de dev `client/mods/zz_uidriver`, que
    fica lendo um arquivo de comando no write dir do cliente
    (%APPDATA%\AstraClient\otclientv8\uidriver\) e devolve a resposta em out.txt.

    Screenshot sai por `g_app.doScreenshot`, que grava o framebuffer inteiro sem
    borda de janela - pixel (0,0) e o canto do conteudo, direto para o probe.js.

.PARAMETER Action
    start   sobe o cliente (mata instancia antiga antes)
    lua     executa -Script (ou -File) dentro do cliente e imprime a resposta
    shot    tira screenshot e copia para -Out
    stop    mata o cliente
    status  diz se o cliente esta vivo e se o driver responde

.EXAMPLE
    .\tools\uidrive.ps1 -Action start
    .\tools\uidrive.ps1 -Action lua -Script "return g_game.isOnline()"
    .\tools\uidrive.ps1 -Action shot -Out shot.png
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('start', 'lua', 'shot', 'stop', 'status')]
    [string]$Action,

    [string]$Script,
    [string]$File,
    [string]$Out,
    [int]$TimeoutSec = 20,
    [int]$BootWait = 16,
    [string]$ClientDir
)

$ErrorActionPreference = 'Stop'

if (-not $ClientDir) { $ClientDir = Join-Path (Split-Path -Parent $PSScriptRoot) 'client' }
$ClientExe = Join-Path $ClientDir 'otclient_gl_x64.exe'
$DriveDir  = Join-Path $env:APPDATA 'AstraClient\otclientv8\uidriver'
$CmdFile   = Join-Path $DriveDir 'cmd.lua'
$OutFile   = Join-Path $DriveDir 'out.txt'

function Get-Client { @(Get-Process otclient_gl_x64 -ErrorAction SilentlyContinue) }

function Stop-Client {
    $p = Get-Client
    if ($p.Count) { $p | Stop-Process -Force; Start-Sleep -Seconds 2 }
}

# Envia um chunk e espera a resposta. O driver apaga cmd.lua ao consumir, entao
# a ausencia do arquivo ja significa "chegou"; out.txt e a resposta em si.
function Invoke-Lua([string]$src, [int]$timeout) {
    if (-not (Get-Client).Count) { throw "cliente nao esta rodando - use -Action start" }
    New-Item -ItemType Directory -Force -Path $DriveDir | Out-Null
    Remove-Item $OutFile -Force -ErrorAction SilentlyContinue

    # grava e renomeia: o driver nunca ve um arquivo pela metade
    $tmp = "$CmdFile.tmp"
    [System.IO.File]::WriteAllText($tmp, $src, (New-Object System.Text.UTF8Encoding($false)))
    Move-Item -Force $tmp $CmdFile

    $deadline = (Get-Date).AddSeconds($timeout)
    while ((Get-Date) -lt $deadline) {
        if (Test-Path $OutFile) {
            Start-Sleep -Milliseconds 120
            return [System.IO.File]::ReadAllText($OutFile)
        }
        if (-not (Get-Client).Count) { throw "o cliente morreu enquanto executava o chunk" }
        Start-Sleep -Milliseconds 200
    }
    throw "driver nao respondeu em $timeout s (cliente vivo? mod zz_uidriver carregado?)"
}

switch ($Action) {

    'stop' { Stop-Client; Write-Output 'client stopped'; break }

    'status' {
        $p = Get-Client
        if (-not $p.Count) { Write-Output 'client: DOWN'; break }
        Write-Output "client: UP (pid $($p[0].Id))"
        try { Write-Output ("driver: " + (Invoke-Lua 'return "pong"' 8).Trim()) }
        catch { Write-Output "driver: NO RESPONSE - $_" }
        break
    }

    'start' {
        Stop-Client
        New-Item -ItemType Directory -Force -Path $DriveDir | Out-Null
        Remove-Item $OutFile, $CmdFile -Force -ErrorAction SilentlyContinue
        $log = Join-Path $DriveDir 'client.log'
        $proc = Start-Process -FilePath $ClientExe -WorkingDirectory $ClientDir -PassThru `
                  -RedirectStandardOutput $log -RedirectStandardError "$log.err"
        Start-Sleep -Seconds $BootWait
        if (-not (Get-Process -Id $proc.Id -ErrorAction SilentlyContinue)) {
            throw "cliente saiu antes de subir - veja $log"
        }
        Write-Output ("client: UP (pid $($proc.Id))")
        try { Write-Output ("driver: " + (Invoke-Lua 'return "pong"' 15).Trim()) }
        catch { Write-Output "driver: NO RESPONSE - $_" }
        break
    }

    'lua' {
        if ($File) { $Script = [System.IO.File]::ReadAllText((Resolve-Path $File)) }
        if (-not $Script) { throw "-Script ou -File e obrigatorio" }
        Write-Output (Invoke-Lua $Script $TimeoutSec)
        break
    }

    'shot' {
        if (-not $Out) { throw "-Out e obrigatorio" }
        $shot = Join-Path $DriveDir 'shot.png'
        Remove-Item $shot -Force -ErrorAction SilentlyContinue
        # doScreenshot enfileira no dispatcher grafico: o arquivo aparece um frame depois
        [void](Invoke-Lua "g_app.doScreenshot('/uidriver/shot.png') return 'queued'" $TimeoutSec)
        $deadline = (Get-Date).AddSeconds(10)
        while ((Get-Date) -lt $deadline) {
            if ((Test-Path $shot) -and (Get-Item $shot).Length -gt 0) { break }
            Start-Sleep -Milliseconds 200
        }
        if (-not (Test-Path $shot)) { throw "screenshot nao foi gravado em $shot" }
        Start-Sleep -Milliseconds 400
        Copy-Item -Force $shot $Out
        Write-Output ((Resolve-Path $Out).Path)
        break
    }
}
