<#
.SYNOPSIS
    Compila o servidor (TFS) e/ou o cliente (AstraClient) no Windows.

.DESCRIPTION
    Encapsula o ambiente de build: entra no vcvars64 do Visual Studio, aponta o
    VCPKG_ROOT para o vcpkg do workspace e chama o gerador certo de cada repo.

      server  -> CMake + Ninja + vcpkg (manifest em server\vcpkg.json)  -> server\build\tfs.exe
      client  -> MSBuild client\vc23\otclient.sln (x64, OpenGL)         -> client\otclient_gl_x64.exe

    O vcpkg serializa os builds por um lock global: rodar os dois ao mesmo tempo
    em janelas diferentes faz um esperar o outro, nao acelera nada.

.PARAMETER Target
    'server', 'client' ou 'all' (default: all).

.PARAMETER VsPath
    Instalacao do Visual Studio. Default: detectada pelo vswhere.

.EXAMPLE
    .\tools\build.ps1 -Target server
    .\tools\build.ps1
#>
[CmdletBinding()]
param(
    [ValidateSet('server', 'client', 'all')]
    [string]$Target = 'all',
    [string]$VsPath
)

$ErrorActionPreference = 'Stop'

$Root      = Split-Path -Parent $PSScriptRoot
$ServerDir = Join-Path $Root 'server'
$ClientDir = Join-Path $Root 'client'
$VcpkgRoot = Join-Path $Root 'vcpkg'

# ---------------------------------------------------------------- ambiente

if (-not $VsPath) {
    $vswhere = Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio\Installer\vswhere.exe'
    if (-not (Test-Path $vswhere)) { throw "vswhere nao encontrado - passe -VsPath com a pasta do Visual Studio" }
    $VsPath = & $vswhere -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
    if (-not $VsPath) { throw "Visual Studio com toolchain C++ nao encontrado" }
}

$VcVars  = Join-Path $VsPath 'VC\Auxiliary\Build\vcvars64.bat'
$CMake   = Join-Path $VsPath 'Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin\cmake.exe'
$NinjaDir = Join-Path $VsPath 'Common7\IDE\CommonExtensions\Microsoft\CMake\Ninja'
$MSBuild = Join-Path $VsPath 'MSBuild\Current\Bin\MSBuild.exe'

foreach ($needed in @($VcVars, $CMake, $MSBuild)) {
    if (-not (Test-Path $needed)) { throw "nao encontrei $needed" }
}

if (-not (Test-Path (Join-Path $VcpkgRoot 'vcpkg.exe'))) {
    throw "vcpkg nao esta bootstrapado em $VcpkgRoot - rode .\tools\bootstrap.ps1"
}

# VCPKG_ROOT permanente para o usuario: os presets de CMake do servidor usam $env:VCPKG_ROOT.
if ([Environment]::GetEnvironmentVariable('VCPKG_ROOT', 'User') -ne $VcpkgRoot) {
    [Environment]::SetEnvironmentVariable('VCPKG_ROOT', $VcpkgRoot, 'User')
    Write-Host "VCPKG_ROOT do usuario ajustado para $VcpkgRoot" -ForegroundColor DarkGray
}

# Roda um comando dentro do ambiente do MSVC (vcvars64 nao sobrevive entre chamadas).
function Invoke-InVcEnv([string]$workDir, [string]$commandLine) {
    $script = Join-Path $env:TEMP ("backlands-build-" + [guid]::NewGuid().ToString('N') + ".cmd")
    $lines = @(
        '@echo off',
        "call `"$VcVars`" >nul || exit /b 1",
        "set `"VCPKG_ROOT=$VcpkgRoot`"",
        "set `"PATH=$NinjaDir;%PATH%`"",
        "cd /d `"$workDir`" || exit /b 1",
        $commandLine
    )
    Set-Content -Path $script -Value $lines -Encoding ASCII
    try {
        & cmd /c $script
        return $LASTEXITCODE
    } finally {
        Remove-Item $script -Force -ErrorAction SilentlyContinue
    }
}

# ---------------------------------------------------------------- servidor

if ($Target -eq 'server' -or $Target -eq 'all') {
    Write-Host ""
    Write-Host "==> Compilando o servidor (Release, Ninja, vcpkg)" -ForegroundColor Cyan
    Write-Host "    a primeira vez baixa e compila as dependencias do vcpkg - demora." -ForegroundColor DarkGray

    $cmd = "`"$CMake`" -S . -B build -G Ninja -DCMAKE_BUILD_TYPE=Release -DBUILD_TESTING=OFF " +
           "-DCMAKE_TOOLCHAIN_FILE=%VCPKG_ROOT%\scripts\buildsystems\vcpkg.cmake && " +
           "`"$CMake`" --build build --config Release"
    $code = Invoke-InVcEnv $ServerDir $cmd
    if ($code -ne 0) { throw "build do servidor falhou (exit $code)" }
    Write-Host "    servidor: $(Join-Path $ServerDir 'build\tfs.exe')" -ForegroundColor Green
}

# ---------------------------------------------------------------- cliente

if ($Target -eq 'client' -or $Target -eq 'all') {
    Write-Host ""
    Write-Host "==> Compilando o cliente (x64, OpenGL)" -ForegroundColor Cyan

    $cmd = "`"$MSBuild`" vc23\otclient.sln /p:Configuration=OpenGL /p:Platform=x64 /m"
    $code = Invoke-InVcEnv $ClientDir $cmd
    if ($code -ne 0) { throw "build do cliente falhou (exit $code)" }
    Write-Host "    cliente: $(Join-Path $ClientDir 'otclient_gl_x64.exe')" -ForegroundColor Green
}

Write-Host ""
Write-Host "Pronto. Para subir tudo: .\tools\run-local.ps1" -ForegroundColor Green
Write-Host ""
