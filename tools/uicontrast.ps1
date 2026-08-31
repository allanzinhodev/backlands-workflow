<#
.SYNOPSIS
    Procura texto que nao da para ler porque nao contrasta com o fundo.

.DESCRIPTION
    As auditorias de geometria dizem onde o texto cai; nenhuma diz se ele
    APARECE. Texto sem contraste e pior que texto cortado - o cortado ainda
    mostra metade, o sem contraste some inteiro. Aconteceu com "Sell All" quando
    o botao ganhou a placa escura e manteve a tinta escura que o estilo `Button`
    pinta para a placa dourada: nenhuma checagem viu, e a unica prova foi uma
    captura ampliada.

    Para cada janela: abre, pede ao cliente as caixas de tinta de todo texto
    visivel (`uiboxes.lua`), fotografa, e mede a luminancia dentro de cada caixa.
    Caixa legivel tem duas populacoes separadas - glifo e fundo. Se tudo cabe
    numa faixa estreita, nao ha glifo visivel ali.

.EXAMPLE
    .\tools\uicontrast.ps1
    .\tools\uicontrast.ps1 -NoRestart -Minimo 30
#>
[CmdletBinding()]
param(
    [switch]$NoRestart,
    [string[]]$Only,
    [int]$Minimo = 40
)

$ErrorActionPreference = 'Continue'
$drive = Join-Path $PSScriptRoot 'uidrive.ps1'
$boxes = Join-Path $PSScriptRoot 'uiboxes.lua'
$contrast = Join-Path $PSScriptRoot 'pixelui/contrast.js'
$tmp = Join-Path $env:TEMP 'uicontrast'
New-Item -ItemType Directory -Force -Path $tmp | Out-Null

$alvos = [ordered]@{
    hud         = @('', '')
    cyclopedia  = @('modules.game_cyclopedia.toggle()',      'cyclopediaWindow')
    forge       = @('modules.game_forge.show()',             'forgeWindow')
    prey        = @('modules.game_prey.show()',              'preyWindow')
    taskhunt    = @('modules.game_task_hunt.show()',         'taskHuntWindow')
    market      = @('modules.game_tibia_market.show()',      'marketWindow')
    options     = @('modules.client_settings.toggle()',      'widget35')
    helper      = @('modules.game_helper.show()',            'helperWindow')
    hotkeys     = @('modules.game_hotkeys.show()',           'hotkeysWindow')
    questlog    = @('modules.game_questlog.show()',          'questLogWindow')
    outfit      = @('modules.game_outfit.create()',          'outfitWindow')
    podium      = @('modules.game_player_podium.show()',     'playerPodium')
    highscores  = @('modules.game_highscores.show()',        'highscoresWindow')
    proficiency = @('modules.game_proficiency.show()',       'weaponProficiencyWindow')
    compendium  = @('modules.game_compendium.show()',        'compendiumWindow')
    schedule    = @('modules.game_schedule.toggle()',        'eventSchedule')
    dailyreward = @('modules.game_dailyreward.show()',       'dailyrewardWindow')
    quickloot   = @('modules.game_quickloot.showQuickLoot()', 'quicklootWindow')
    exiva       = @('modules.game_exiva_options.show()',     'exivaOptionsWindow')
    soulseal    = @('modules.game_soulseal.show()',          'soulsealWindow')
}

if ($Only) { $nomes = $alvos.Keys | Where-Object { $n = $_; $Only | Where-Object { $n -like "*$_*" } } }
else { $nomes = @($alvos.Keys) }

if (-not $NoRestart) { & (Join-Path $PSScriptRoot 'uiplay.ps1') | Write-Output }

$total = 0
foreach ($nome in $nomes) {
    $abre = $alvos[$nome][0]
    $id = $alvos[$nome][1]
    if ($abre) {
        foreach ($try in 1, 2) {
            & $drive -Action lua -Script "$abre return 'ok'" -TimeoutSec 30 | Out-Null
            Start-Sleep -Milliseconds 800
            $vis = & $drive -Action lua -Script "local w = UID.find('$id') return tostring(w and w:isVisible())"
            if ($vis -match 'true') { break }
        }
        if ($vis -notmatch 'true') { Write-Output "[$nome] nao abriu"; continue }
    }

    # Esconde toda janela que nao seja o alvo: medir cor de pixel exige que o que
    # esta na tela seja o que se quer medir, e as janelas abertas antes ficam por
    # cima. Sem isso o podium foi medido com o Exiva Options em cima dele.
    if ($id) {
        $limpar = "for _, c in ipairs(UID.root():getChildren()) do if c:getId() ~= '$id' and c:getId() ~= 'gameRootPanel' and c:isVisible() then c:hide() end end return 'ok'"
        & $drive -Action lua -Script $limpar | Out-Null
        Start-Sleep -Milliseconds 500
    }

    $r = & $drive -Action lua -File $boxes -LuaArg $id -TimeoutSec 60
    ($r -replace '^OK\s?', '') | Set-Content -Encoding utf8 (Join-Path $tmp 'caixas.txt')
    & $drive -Action shot -Out (Join-Path $tmp 'shot.png') -TimeoutSec 40 | Out-Null
    $saida = node $contrast (Join-Path $tmp 'shot.png') (Join-Path $tmp 'caixas.txt') $Minimo
    if ($saida -match 'todas com contraste') { continue }
    $total++
    Write-Output "[$nome] $saida"
    # fecha para nao contaminar a proxima captura
    if ($id) { & $drive -Action lua -Script "local w = UID.find('$id') if w then w:hide() end return 'ok'" | Out-Null }
}

Write-Output ""
Write-Output "$($nomes.Count) telas medidas, $total com texto sem contraste"
