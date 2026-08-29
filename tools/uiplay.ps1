<#
.SYNOPSIS
    Sobe o cliente, autentica e entra no mundo - um comando so.

.DESCRIPTION
    Envolve tools\uidrive.ps1: start -> UID.enter(conta, senha, personagem) ->
    espera ficar online. E o passo que todo loop de verificacao repete, entao
    vale ser um comando e nao cinco.

    Conta de teste padrao: god / god, personagem "Backlands God" (level 200,
    conta type 5 - abre qualquer janela do jogo). A conta `1` so tem o
    "Account Manager", que nao carrega (Town ID 1 nao existe no mapa).

.EXAMPLE
    .\tools\uiplay.ps1
    .\tools\uiplay.ps1 -Character "Backlands God" -Shot shot.png
#>
[CmdletBinding()]
param(
    [string]$Account   = 'god',
    [string]$Password  = 'god',
    [string]$Character = 'Backlands God',
    [string]$Shot,
    [int]$TimeoutSec   = 90,
    [switch]$NoRestart
)

$ErrorActionPreference = 'Stop'
$drive = Join-Path $PSScriptRoot 'uidrive.ps1'

if (-not $NoRestart) { & $drive -Action start | Write-Output }

$lua = "return UID.enter('$Account','$Password','$Character')"
[void](& $drive -Action lua -Script $lua -TimeoutSec 20)

$deadline = (Get-Date).AddSeconds($TimeoutSec)
$state = ''
while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 2
    $state = (& $drive -Action lua -Script "return tostring(UID.enterState) .. ' online=' .. tostring(g_game.isOnline())" -TimeoutSec 15).Trim()
    if ($state -match 'online=true') { break }
    if ($state -match 'timeout|not in list') { throw "entrada falhou: $state" }
}
if ($state -notmatch 'online=true') { throw "nao ficou online em $TimeoutSec s (ultimo estado: $state)" }

# a primeira tela do jogo ainda esta montando widgets no frame seguinte
Start-Sleep -Seconds 4
Write-Output "in-game: $state"

if ($Shot) { & $drive -Action shot -Out $Shot | Write-Output }
