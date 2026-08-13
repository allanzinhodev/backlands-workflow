<#
.SYNOPSIS
    Reconstroi o workspace Backlands em uma maquina nova (Windows / PowerShell 5.1+).

.DESCRIPTION
    Clona os cinco repositorios com os nomes curtos, instala as dependencias que dao
    para automatizar e reporta o que sobrou de manual.

    Idempotente: pula o que ja existe. Nada e sobrescrito.

.PARAMETER ReposOnly
    So clona os repositorios. Pula vcpkg, npm e extracao de assets.

.PARAMETER SkipVcpkg
    Nao clona nem faz bootstrap do vcpkg.

.EXAMPLE
    .\tools\bootstrap.ps1
    .\tools\bootstrap.ps1 -ReposOnly
#>
[CmdletBinding()]
param(
    [switch]$ReposOnly,
    [switch]$SkipVcpkg
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot

$Repos = @(
    @{ Dir = 'client';        Url = 'https://github.com/allanzinhodev/backlands-client.git';        Branch = 'main'   }
    @{ Dir = 'server';        Url = 'https://github.com/allanzinhodev/backlands-server.git';        Branch = 'main'   }
    @{ Dir = 'mapeditor';     Url = 'https://github.com/allanzinhodev/backlands-mapeditor.git';     Branch = 'main'   }
    @{ Dir = 'objectbuilder'; Url = 'https://github.com/allanzinhodev/backlands-objectbuilder.git'; Branch = 'master' }
    @{ Dir = 'devfolio';      Url = 'https://github.com/allanzinhodev/devfolio.git';                Branch = 'main'   }
)

$Manual = New-Object System.Collections.Generic.List[string]

function Write-Step { param([string]$Text) Write-Host ""; Write-Host "==> $Text" -ForegroundColor Cyan }
function Write-Ok   { param([string]$Text) Write-Host "    OK   $Text" -ForegroundColor Green }
function Write-Skip { param([string]$Text) Write-Host "    skip $Text" -ForegroundColor DarkGray }
function Write-Warn { param([string]$Text) Write-Host "    !    $Text" -ForegroundColor Yellow }

function Test-Command {
    param([string]$Name)
    $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

# ---------------------------------------------------------------- pre-requisitos
Write-Step "Verificando pre-requisitos"
if (-not (Test-Command 'git')) {
    throw "git nao encontrado no PATH. Instale o Git para Windows e rode de novo."
}
Write-Ok "git $((git --version) -replace 'git version ','')"

foreach ($tool in 'cmake', 'node', 'npm') {
    if (Test-Command $tool) { Write-Ok $tool } else { Write-Warn "$tool ausente (necessario para parte dos builds)" }
}

# ---------------------------------------------------------------- repositorios
Write-Step "Clonando repositorios em $Root"
foreach ($repo in $Repos) {
    $target = Join-Path $Root $repo.Dir
    if (Test-Path $target) {
        Write-Skip "$($repo.Dir) ja existe"
        continue
    }
    Write-Host "    clonando $($repo.Dir) ..."
    git -C $Root clone --branch $repo.Branch $repo.Url $repo.Dir
    if ($LASTEXITCODE -ne 0) { throw "Falha ao clonar $($repo.Url)" }
    Write-Ok "$($repo.Dir) <- $($repo.Url)"
}

if ($ReposOnly) {
    Write-Step "ReposOnly: parando aqui"
    exit 0
}

# ---------------------------------------------------------------- vcpkg
if (-not $SkipVcpkg) {
    Write-Step "vcpkg (dependencias C++ de client, server e mapeditor)"
    if ($env:VCPKG_ROOT -and (Test-Path $env:VCPKG_ROOT)) {
        Write-Skip "VCPKG_ROOT ja aponta para $env:VCPKG_ROOT"
    } else {
        $vcpkg = Join-Path $Root 'vcpkg'
        if (Test-Path $vcpkg) {
            Write-Skip "vcpkg ja clonado em $vcpkg"
        } else {
            git clone https://github.com/microsoft/vcpkg.git $vcpkg
            if ($LASTEXITCODE -ne 0) { throw "Falha ao clonar vcpkg" }
            & (Join-Path $vcpkg 'bootstrap-vcpkg.bat')
            Write-Ok "vcpkg instalado em $vcpkg"
        }
        $Manual.Add("Definir VCPKG_ROOT: [Environment]::SetEnvironmentVariable('VCPKG_ROOT','$vcpkg','User')")
    }
}

# ---------------------------------------------------------------- devfolio
Write-Step "devfolio (npm)"
$devfolio = Join-Path $Root 'devfolio'
if (-not (Test-Command 'npm')) {
    Write-Warn "npm ausente - pulando"
    $Manual.Add("Instalar Node.js e rodar: npm install --prefix $devfolio")
} elseif (Test-Path (Join-Path $devfolio 'node_modules')) {
    Write-Skip "node_modules ja existe"
} else {
    npm install --prefix $devfolio
    if ($LASTEXITCODE -eq 0) { Write-Ok "dependencias do devfolio instaladas" }
    else { Write-Warn "npm install falhou - rode manualmente" }
}

# ---------------------------------------------------------------- assets do cliente
Write-Step "Assets do cliente (protocolo 8.60)"
$things = Join-Path $Root 'client\data\things'
$rar    = Join-Path $things '860.rar'
$dir860 = Join-Path $things '860'
# O 860.rar ja contem uma pasta "860/" na raiz, entao a extracao vai para
# data/things/ e NAO para data/things/860/. Extrair para dentro de 860/
# produz o aninhamento data/things/860/860/, que o cliente nao encontra.
if (Test-Path (Join-Path $dir860 '860\Tibia.dat')) {
    Write-Warn "assets aninhados em data/things/860/860/ - o cliente espera data/things/860/"
    $Manual.Add("Mover client/data/things/860/860/* para client/data/things/860/")
} elseif (Test-Path (Join-Path $dir860 'Tibia.dat')) {
    Write-Skip "data/things/860/ ja extraido"
} elseif (-not (Test-Path $rar)) {
    Write-Warn "860.rar nao encontrado"
    $Manual.Add("Baixar 860.rar (ver client/readme.md) e extrair para client/data/things/860/")
} else {
    $sevenZip = @(
        "$env:ProgramFiles\7-Zip\7z.exe",
        "${env:ProgramFiles(x86)}\7-Zip\7z.exe"
    ) | Where-Object { Test-Path $_ } | Select-Object -First 1

    if ($sevenZip) {
        & $sevenZip x $rar "-o$things" -y | Out-Null
        if (Test-Path (Join-Path $dir860 'Tibia.dat')) { Write-Ok "860.rar extraido" }
        else { $Manual.Add("Extrair client/data/things/860.rar para client/data/things/860/") }
    } else {
        Write-Warn "7-Zip nao encontrado (.rar precisa dele ou do WinRAR)"
        $Manual.Add("Extrair client/data/things/860.rar para client/data/things/860/")
    }
}

# ---------------------------------------------------------------- config do servidor
Write-Step "Config do servidor"
$cfg     = Join-Path $Root 'server\config.lua'
$cfgDist = Join-Path $Root 'server\config.lua.dist'
if (Test-Path $cfg) {
    Write-Skip "server/config.lua ja existe"
} elseif (Test-Path $cfgDist) {
    Copy-Item $cfgDist $cfg
    Write-Ok "server/config.lua criado a partir do .dist"
    $Manual.Add("Preencher credenciais de banco em server/config.lua")
}
$Manual.Add("Importar server/schema.sql no MariaDB")

# ---------------------------------------------------------------- resumo
Write-Step "Pronto"
Write-Host ""
Write-Host "Repositorios:" -ForegroundColor White
foreach ($repo in $Repos) {
    $target = Join-Path $Root $repo.Dir
    if (Test-Path $target) {
        $branch = git -C $target rev-parse --abbrev-ref HEAD 2>$null
        Write-Host ("    {0,-15} {1}" -f $repo.Dir, $branch)
    } else {
        Write-Host ("    {0,-15} AUSENTE" -f $repo.Dir) -ForegroundColor Red
    }
}

if ($Manual.Count -gt 0) {
    Write-Host ""
    Write-Host "Passos manuais restantes:" -ForegroundColor Yellow
    $i = 1
    foreach ($step in $Manual) {
        Write-Host ("    {0}. {1}" -f $i, $step)
        $i++
    }
}
Write-Host ""
Write-Host "Estado dos repos a qualquer momento:  .\tools\status.ps1" -ForegroundColor DarkGray
Write-Host ""
