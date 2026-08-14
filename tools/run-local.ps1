<#
.SYNOPSIS
    Sobe o stack local do Backlands: MariaDB -> servidor (TFS) -> cliente (AstraClient).

.DESCRIPTION
    Faz o preflight de tudo que o par cliente/servidor precisa para conversar
    (assets 8.60 extraidos, mapa presente, config.lua, banco no ar, binarios
    compilados), sobe o que estiver parado e so entao abre o cliente.

    Cada etapa e idempotente: se o banco ja esta no ar ou o servidor ja esta
    escutando na 7171, o script nao sobe uma segunda instancia.

.PARAMETER NoDb
    Nao tenta subir o MariaDB (use quando o banco roda como servico ou em outra maquina).

.PARAMETER NoClient
    Sobe apenas banco e servidor.

.PARAMETER CheckOnly
    So roda o preflight e mostra o relatorio, sem subir nada.

.PARAMETER MariaDbHome
    Pasta do MariaDB portatil (a que contem bin\mariadbd.exe).
    Default: C:\Users\<voce>\mariadb, ou $env:MARIADB_HOME se definido.

.EXAMPLE
    .\tools\run-local.ps1
    .\tools\run-local.ps1 -CheckOnly
    .\tools\run-local.ps1 -NoClient
#>
[CmdletBinding()]
param(
    [switch]$NoDb,
    [switch]$NoClient,
    [switch]$CheckOnly,
    [string]$MariaDbHome
)

$ErrorActionPreference = 'Stop'

$Root      = Split-Path -Parent $PSScriptRoot
$ServerDir = Join-Path $Root 'server'
$ClientDir = Join-Path $Root 'client'

$ServerExe = Join-Path $ServerDir 'build\tfs.exe'
$ClientExe = Join-Path $ClientDir 'otclient_gl_x64.exe'

if (-not $MariaDbHome) {
    if ($env:MARIADB_HOME) { $MariaDbHome = $env:MARIADB_HOME }
    else { $MariaDbHome = Join-Path $env:USERPROFILE 'mariadb' }
}

# ---------------------------------------------------------------- helpers

function Write-Step($text) {
    Write-Host ""
    Write-Host "==> $text" -ForegroundColor Cyan
}

function Write-Ok($text)   { Write-Host "    [ok]    $text" -ForegroundColor Green }
function Write-Warn2($text) { Write-Host "    [aviso] $text" -ForegroundColor Yellow }
function Write-Bad($text)  { Write-Host "    [falta] $text" -ForegroundColor Red }

function Test-Port($portNumber) {
    $c = New-Object System.Net.Sockets.TcpClient
    try {
        $async = $c.BeginConnect('127.0.0.1', $portNumber, $null, $null)
        $ok = $async.AsyncWaitHandle.WaitOne(700, $false)
        if ($ok -and $c.Connected) { return $true }
        return $false
    } catch {
        return $false
    } finally {
        $c.Close()
    }
}

function Wait-Port($portNumber, $timeoutSeconds, $label) {
    $deadline = (Get-Date).AddSeconds($timeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        if (Test-Port $portNumber) { return $true }
        Start-Sleep -Milliseconds 700
    }
    Write-Bad "$label nao respondeu na porta $portNumber em $timeoutSeconds s"
    return $false
}

# Le uma chave simples do config.lua (formato: chave = "valor" ou chave = 123).
function Get-ConfigValue($configPath, $keyName) {
    $line = Select-String -Path $configPath -Pattern "^\s*$keyName\s*=" | Select-Object -First 1
    if (-not $line) { return $null }
    $value = ($line.Line -split '=', 2)[1].Trim()
    $value = ($value -split '--')[0].Trim()
    return $value.Trim('"').Trim("'")
}

# ---------------------------------------------------------------- preflight

$problems = @()

Write-Step "Preflight"

# 1. assets 8.60 do cliente
$datFile = Join-Path $ClientDir 'data\things\860\Tibia.dat'
$sprFile = Join-Path $ClientDir 'data\things\860\Tibia.spr'
if ((Test-Path $datFile) -and (Test-Path $sprFile)) {
    Write-Ok "assets 8.60 extraidos (data/things/860)"
} else {
    Write-Bad "assets 8.60 ausentes - extraia client\data\things\860.rar para client\data\things\"
    $problems += 'assets'
}

# 2. config.lua do servidor
$configFile = Join-Path $ServerDir 'config.lua'
if (Test-Path $configFile) {
    Write-Ok "server\config.lua presente"
} else {
    Write-Bad "server\config.lua ausente - copie de config.lua.dist"
    $problems += 'config'
}

# 3. mapa declarado no config.lua
if (Test-Path $configFile) {
    $mapName = Get-ConfigValue $configFile 'mapName'
    $mapFile = Join-Path $ServerDir "data\world\$mapName.otbm"
    if (Test-Path $mapFile) {
        Write-Ok "mapa data/world/$mapName.otbm presente"
    } else {
        Write-Bad "mapa data/world/$mapName.otbm ausente (mapName = $mapName no config.lua)"
        $problems += 'mapa'
    }
}

# 4. items.otb espelhado no editor (invariante do workspace)
$otbServer = Join-Path $ServerDir 'data\items\items.otb'
$otbEditor = Join-Path $Root 'mapeditor\data\860\items.otb'
if ((Test-Path $otbServer) -and (Test-Path $otbEditor)) {
    $h1 = (Get-FileHash $otbServer).Hash
    $h2 = (Get-FileHash $otbEditor).Hash
    if ($h1 -eq $h2) { Write-Ok "items.otb do servidor e do editor batem" }
    else { Write-Warn2 "items.otb do editor DIVERGE do servidor - mapa salvo pode gravar ids errados" }
}

# 5. binarios
if (Test-Path $ServerExe) { Write-Ok "binario do servidor: $ServerExe" }
else {
    Write-Bad "servidor nao compilado - rode .\tools\build.ps1 -Target server"
    $problems += 'server-bin'
}

if (Test-Path $ClientExe) { Write-Ok "binario do cliente: $ClientExe" }
else {
    Write-Bad "cliente nao compilado - rode .\tools\build.ps1 -Target client"
    if (-not $NoClient) { $problems += 'client-bin' }
}

if ($CheckOnly) {
    Write-Host ""
    if ($problems.Count -eq 0) { Write-Host "Preflight limpo - da para rodar." -ForegroundColor Green }
    else { Write-Host ("Pendencias: " + ($problems -join ', ')) -ForegroundColor Yellow }
    Write-Host ""
    return
}

# ---------------------------------------------------------------- banco

if (-not $NoDb) {
    Write-Step "MariaDB"
    if (Test-Port 3306) {
        Write-Ok "ja esta no ar na 3306"
    } else {
        $mariadbd = Join-Path $MariaDbHome 'bin\mariadbd.exe'
        $iniFile  = Join-Path $MariaDbHome 'data\my.ini'
        if (-not (Test-Path $mariadbd)) {
            Write-Bad "mariadbd.exe nao encontrado em $MariaDbHome - use -MariaDbHome ou -NoDb"
            $problems += 'db'
        } else {
            $argList = @('--console')
            if (Test-Path $iniFile) { $argList = @("--defaults-file=$iniFile", '--console') }
            Start-Process -FilePath $mariadbd -ArgumentList $argList -WindowStyle Hidden `
                -RedirectStandardOutput (Join-Path $MariaDbHome 'mariadb-stdout.log') `
                -RedirectStandardError  (Join-Path $MariaDbHome 'mariadb-stderr.log')
            if (Wait-Port 3306 30 'MariaDB') { Write-Ok "subiu na 3306" }
            else { $problems += 'db' }
        }
    }
}

# ---------------------------------------------------------------- servidor

if ($problems -contains 'server-bin' -or $problems -contains 'mapa' -or $problems -contains 'db') {
    Write-Host ""
    Write-Host ("Nao da para subir o servidor. Pendencias: " + ($problems -join ', ')) -ForegroundColor Red
    Write-Host ""
    return
}

Write-Step "Servidor (TFS 8.60)"
$loginPort = 7171
if (Test-Path $configFile) {
    $p = Get-ConfigValue $configFile 'loginProtocolPort'
    if ($p) { $loginPort = [int]$p }
}

if (Test-Port $loginPort) {
    Write-Ok "ja esta escutando na $loginPort"
} else {
    # O tfs.exe resolve data/ pelo diretorio de trabalho: precisa ser a raiz do repo do servidor.
    Start-Process -FilePath $ServerExe -WorkingDirectory $ServerDir
    if (Wait-Port $loginPort 120 'Servidor') { Write-Ok "login server no ar na $loginPort" }
    else {
        Write-Bad "o servidor nao abriu a porta - veja a janela do tfs.exe para o erro de carga"
        return
    }
}

# ---------------------------------------------------------------- cliente

if ($NoClient) {
    Write-Host ""
    Write-Host "Pronto (sem cliente). Conta de teste: 1 / 1" -ForegroundColor Green
    Write-Host ""
    return
}

Write-Step "Cliente (AstraClient)"
if (-not (Test-Path $ClientExe)) {
    Write-Bad "binario do cliente ausente - compile client\vc23\otclient.sln (x64, OpenGL)"
    return
}

Start-Process -FilePath $ClientExe -WorkingDirectory $ClientDir
Write-Ok "cliente aberto - servidor LocalTestServ (127.0.0.1:$loginPort, protocolo 860)"

Write-Host ""
Write-Host "Conta de teste: 1 / 1" -ForegroundColor Green
Write-Host ""
