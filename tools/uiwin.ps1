<#
.SYNOPSIS
    Abre uma janela do cliente, fotografa so ela e fecha.

.DESCRIPTION
    O passo 2 do RESKIN-PROGRESS ("abrir cada janela uma vez") e repetitivo o
    bastante para virar script. Roda o Lua que abre a janela, descobre o retangulo
    real do widget que apareceu e recorta o screenshot nesse retangulo - ver a
    janela inteira e nada alem dela e o que faz um rotulo cortado saltar aos olhos.

    A maioria das features esta OFF no servidor, entao a janela nunca aparece
    jogando normalmente: abrir por Lua e a unica rota.

.PARAMETER Open
    Chunk Lua que abre a janela. Ex: "modules.game_wheel.show()"

.PARAMETER Name
    Nome do arquivo de saida (sem extensao).

.PARAMETER Pad
    Margem em pixels ao redor da janela no recorte. Default 8.

.EXAMPLE
    .\tools\uiwin.ps1 -Open "modules.game_wheel.show()" -Name wheel -OutDir shots
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$Open,
    [Parameter(Mandatory = $true)][string]$Name,
    [string]$OutDir = '.',
    [int]$Pad = 8,
    [int]$SettleMs = 900,
    [switch]$KeepOpen
)

$ErrorActionPreference = 'Stop'
$drive = Join-Path $PSScriptRoot 'uidrive.ps1'
$probe = Join-Path $PSScriptRoot 'pixelui\probe.js'
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

# Lembra o que ja estava na tela para saber qual widget e novo.
$before = (& $drive -Action lua -Script "return UID.windows()" -TimeoutSec 15)

$res = & $drive -Action lua -Script "$Open return 'opened'" -TimeoutSec 25
if ($res -notmatch '^OK') { Write-Output "[$Name] FALHOU AO ABRIR: $res"; return }
Start-Sleep -Milliseconds $SettleMs

$after = (& $drive -Action lua -Script "return UID.windows()" -TimeoutSec 15)

# O widget novo e o que aparece em $after e nao em $before. Se nada mudou, a
# janela pode ter sido reaproveitada: cai para o ultimo da lista (topo do z-order).
$beforeSet = @{}
foreach ($l in ($before -split "`n")) { $beforeSet[$l.Trim()] = $true }
$new = @()
foreach ($l in ($after -split "`n")) {
    $t = $l.Trim()
    if ($t -and -not $beforeSet.ContainsKey($t) -and $t -notmatch '^(OK\s*)?gameRootPanel') { $new += $t }
}
$target = if ($new.Count) { $new[-1] } else { ($after -split "`n")[-1].Trim() }

if ($target -notmatch '(\d+),(\d+)\s+(\d+)x(\d+)') {
    Write-Output "[$Name] sem retangulo legivel. after=$after"
    return
}
$x = [int]$Matches[1]; $y = [int]$Matches[2]; $w = [int]$Matches[3]; $h = [int]$Matches[4]

# auditoria em runtime: sobreposicao e texto saindo da janela, que a varredura
# estatica de largura nao enxerga
$wid = ($target -split '\s+')[0] -replace '^OK$', ''
if ($wid -and $wid -ne 'OK') {
    $audit = (& $drive -Action lua -Script "return UID.audit('$wid', 30)" -TimeoutSec 30)
    Write-Output "[$Name] AUDIT $audit"
}

$full = Join-Path $OutDir "$Name-full.png"
[void](& $drive -Action shot -Out $full)

$cx = [Math]::Max(0, $x - $Pad); $cy = [Math]::Max(0, $y - $Pad)
$crop = Join-Path $OutDir "$Name.png"
& node $probe crop $full $crop $cx $cy ($w + 2 * $Pad) ($h + 2 * $Pad) | Out-Null
Remove-Item $full -Force -ErrorAction SilentlyContinue

if (-not $KeepOpen) {
    # esconde, nao destroi: os modulos guardam o widget numa variavel e voltam a
    # usa-lo no proximo toggle - destruir deixa o modulo com referencia morta
    [void](& $drive -Action lua -Script "local w = UID.root():getChildren() local t = w[#w] if t and t:getId() ~= 'gameRootPanel' then t:hide() end return 'hidden'" -TimeoutSec 15)
}

Write-Output "[$Name] $target -> $crop"
