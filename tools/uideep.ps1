<#
.SYNOPSIS
    Audita TODOS os paineis de cada janela, nao so o que esta a vista.

.DESCRIPTION
    O uisweep abre a janela e audita o painel visivel. Janela com abas mostra um
    de cada vez: o Cyclopedia tem nove, a de Opcoes quinze, o Prey tres estados
    por slot. Auditar so o visivel deixou onze defeitos de pe em cada uma delas.

    Este script abre cada janela, pede ao `uipanels.lua` os grupos de paineis
    alternativos (irmaos com o mesmo retangulo, no maximo um visivel), e audita
    cada painel de cada grupo. Nao sabe nada sobre a API dos modulos.

    Deixa a janela no ultimo painel mostrado - e uma ferramenta de auditoria, nao
    de navegacao. Reabra o cliente depois se for jogar.

.EXAMPLE
    .\tools\uideep.ps1
    .\tools\uideep.ps1 -NoRestart -Only cyclopedia,forge
#>
[CmdletBinding()]
param(
    [switch]$NoRestart,
    [string[]]$Only,
    [int]$Limit = 10
)

$ErrorActionPreference = 'Continue'
$drive = Join-Path $PSScriptRoot 'uidrive.ps1'
$panels = Join-Path $PSScriptRoot 'uipanels.lua'

function Invoke-Lua([string]$Script, [int]$Timeout = 40) {
    $r = & $drive -Action lua -Script $Script -TimeoutSec $Timeout
    if ($r -match '^OK\s?') { return ($r -replace '^OK\s?', '') }
    return "ERRO: $r"
}
function Invoke-Panels([string]$Arg, [int]$Timeout = 40) {
    $r = & $drive -Action lua -File $panels -LuaArg $Arg -TimeoutSec $Timeout
    if ($r -match '^OK\s?') { return ($r -replace '^OK\s?', '') }
    return "ERRO: $r"
}

# nome -> @(chunk que abre, id da janela, [chunk que troca de painel com {0}], [nomes])
#
# Revelar um painel na marra funciona na maioria das janelas, mas nao onde o
# modulo faz mais do que mostrar: o game_helper REDIMENSIONA a janela por aba
# (380x275 no tools, 430x550 no cavebot) e esconde o painel anterior por conta
# propria. Auditar ali sem passar pelo modulo mede tudo no tamanho errado e ainda
# deixa dois paineis visiveis ao mesmo tempo. Quando o modulo tem uma funcao de
# troca, ela vem na terceira posicao.
$alvos = [ordered]@{
    cyclopedia  = @('modules.game_cyclopedia.toggle()',      'cyclopediaWindow')
    forge       = @('modules.game_forge.show()',             'forgeWindow',
                    "modules.game_forge.loadMenu('{0}')",
                    @('fusionMenu', 'transferMenu', 'conversionMenu', 'historyMenu'))
    helper      = @('modules.game_helper.show()',            'helperWindow',
                    "modules.game_helper.loadMenu('{0}')",
                    @('healingMenu', 'toolsMenu', 'shooterMenu', 'equipMenu', 'cavebotMenu', 'timerMenu'))
    options     = @('modules.client_settings.toggle()',      'widget35',
                    "local S = modules.client_settings for k, v in pairs(S.loadedWindows) do v:hide() end S.loadedWindows['{0}']:show(true)",
                    @('controls', 'generalHotkeys', 'actionsHotkeys', 'customHotkeys', 'interface',
                      'hud', 'console', 'gameWindow', 'actionsBars', 'controlButtons',
                      'graphics', 'effects', 'misc', 'gameplay', 'screenshot'))
    prey        = @('modules.game_prey.show()',              'preyWindow')
    taskhunt    = @('modules.game_task_hunt.show()',         'taskHuntWindow')
    market      = @('modules.game_tibia_market.show()',      'marketWindow')
    proficiency = @('modules.game_proficiency.show()',       'weaponProficiencyWindow')
    compendium  = @('modules.game_compendium.show()',        'compendiumWindow')
    highscores  = @('modules.game_highscores.show()',        'highscoresWindow')
    podium      = @('modules.game_player_podium.show()',     'playerPodium')
    outfit      = @('modules.game_outfit.create()',          'outfitWindow')
    questlog    = @('modules.game_questlog.show()',          'questLogWindow')
    hotkeys     = @('modules.game_hotkeys.show()',           'hotkeysWindow')
    soulseal    = @('modules.game_soulseal.show()',          'soulsealWindow')
    exiva       = @('modules.game_exiva_options.show()',     'exivaOptionsWindow')
    schedule    = @('modules.game_schedule.toggle()',        'eventSchedule')
    bazaar      = @('modules.game_character_bazaar.show()',  'characterBazaarWindow')
}

if ($Only) { $nomes = $alvos.Keys | Where-Object { $n = $_; $Only | Where-Object { $n -like "*$_*" } } }
else { $nomes = @($alvos.Keys) }

if (-not $NoRestart) { & (Join-Path $PSScriptRoot 'uiplay.ps1') | Write-Output }

$achados = 0
foreach ($nome in $nomes) {
    $abre = $alvos[$nome][0]
    $id   = $alvos[$nome][1]
    # toggle() fecha a janela que ja estava aberta; a segunda chamada reabre
    foreach ($try in 1, 2) {
        Invoke-Lua "$abre return 'ok'" 30 | Out-Null
        Start-Sleep -Milliseconds 800
        $vis = Invoke-Lua "local w = UID.find('$id') return tostring(w and w:isVisible())" 25
        if ($vis -match 'true') { break }
    }
    if ($vis -notmatch 'true') { Write-Output "[$nome] nao abriu"; continue }

    $trocar = if ($alvos[$nome].Count -ge 3) { $alvos[$nome][2] } else { $null }
    if ($trocar) {
        foreach ($painel in $alvos[$nome][3]) {
            Invoke-Lua ("$trocar return 'ok'" -f $painel) 30 | Out-Null
            Start-Sleep -Milliseconds 650
            $geo = Invoke-Lua "return UID.audit('$id', $Limit)"
            $fnt = Invoke-Lua "return UID.fontaudit('$id', $Limit)"
            if ($geo -like 'limpo*' -and $fnt -like 'tudo em*') { continue }
            $achados++
            Write-Output "[$nome/$painel] $geo"
            if ($fnt -notlike 'tudo em*') { Write-Output "    FONTE: $fnt" }
        }
        continue
    }

    $lista = Invoke-Panels $id
    if ($lista -like 'sem grupo*' -or $lista -like 'ERRO*') {
        $geo = Invoke-Lua "return UID.audit('$id', $Limit)"
        $fnt = Invoke-Lua "return UID.fontaudit('$id', $Limit)"
        if ($geo -notlike 'limpo*' -or $fnt -notlike 'tudo em*') {
            $achados++
            Write-Output "[$nome] $geo"
            if ($fnt -notlike 'tudo em*') { Write-Output "    FONTE: $fnt" }
        }
        continue
    }

    foreach ($linha in ($lista -split "`n")) {
        if ($linha -notmatch '^(d+) S+ ((d+))') { continue }
        $gi = [int]$Matches[1]; $qtd = [int]$Matches[2]
        foreach ($pi in 1..$qtd) {
            $qual = Invoke-Panels "$id|$gi|$pi"
            Start-Sleep -Milliseconds 500
            $geo = Invoke-Lua "return UID.audit('$id', $Limit)"
            $fnt = Invoke-Lua "return UID.fontaudit('$id', $Limit)"
            if ($geo -like 'limpo*' -and $fnt -like 'tudo em*') { continue }
            $achados++
            Write-Output "[$nome/$($qual -replace '^mostrando ','')] $geo"
            if ($fnt -notlike 'tudo em*') { Write-Output "    FONTE: $fnt" }
        }
    }
}

Write-Output ""
Write-Output "$($nomes.Count) janelas percorridas painel a painel, $achados com achado"
