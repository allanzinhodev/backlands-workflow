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
Write-Step "Sincronizando repositorios em $Root"
foreach ($repo in $Repos) {
    $target = Join-Path $Root $repo.Dir

    # Pasta ausente: clona.
    if (-not (Test-Path (Join-Path $target '.git'))) {
        if (Test-Path $target) {
            Write-Warn "$($repo.Dir) existe mas nao e repositorio git - pulando"
            $Manual.Add("Verificar $target manualmente")
            continue
        }
        Write-Host "    clonando $($repo.Dir) ..."
        git -C $Root clone --branch $repo.Branch $repo.Url $repo.Dir
        if ($LASTEXITCODE -ne 0) { throw "Falha ao clonar $($repo.Url)" }
        Write-Ok "$($repo.Dir) <- $($repo.Url)"
        continue
    }

    # Pasta ja existe: confere se ha commits novos no remoto e puxa.
    git -C $target fetch --quiet 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "$($repo.Dir): fetch falhou (sem rede ou sem acesso)"
        continue
    }

    $upstream = git -C $target rev-parse --abbrev-ref '@{upstream}' 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $upstream) {
        Write-Warn "$($repo.Dir): sem upstream configurado"
        continue
    }

    $behind = [int](git -C $target rev-list --count "HEAD..$upstream" 2>$null)
    $ahead = [int](git -C $target rev-list --count "$upstream..HEAD" 2>$null)
    $dirty = @(git -C $target status --porcelain 2>$null).Count

    if ($behind -eq 0) {
        if ($ahead -gt 0) { Write-Skip "$($repo.Dir) em dia com o remoto ($ahead commit(s) local(is) a enviar)" }
        else { Write-Skip "$($repo.Dir) em dia com o remoto" }
        continue
    }

    # Ha commits novos no remoto. So puxa se for seguro.
    if ($dirty -gt 0) {
        Write-Warn "$($repo.Dir): $behind commit(s) no remoto, mas ha $dirty alteracao(oes) local(is) - NAO puxei"
        $Manual.Add("Resolver alteracoes locais em $($repo.Dir) e rodar: git -C `"$target`" pull")
        continue
    }

    if ($ahead -gt 0) {
        Write-Warn "$($repo.Dir): divergiu ($ahead local, $behind remoto) - NAO puxei para nao criar merge automatico"
        $Manual.Add("Reconciliar $($repo.Dir) manualmente: git -C `"$target`" pull --rebase")
        continue
    }

    # Fast-forward puro: seguro.
    git -C $target merge --ff-only $upstream --quiet 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "$($repo.Dir) atualizado (+$behind commit(s) do remoto)"
    } else {
        Write-Warn "$($repo.Dir): fast-forward falhou"
        $Manual.Add("Atualizar $($repo.Dir) manualmente: git -C `"$target`" pull")
    }
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
