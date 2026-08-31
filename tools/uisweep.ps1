<#
.SYNOPSIS
    Abre uma a uma as janelas do cliente, audita e fotografa cada uma.

.DESCRIPTION
    O passo "abrir cada janela uma vez" do RESKIN-PROGRESS. A maioria das features
    esta OFF no servidor, entao essas telas nunca aparecem jogando - so por Lua.

    Para cada alvo: abre, roda UID.audit (colisao e texto saindo da janela),
    recorta o screenshot no retangulo da janela e esconde.

.EXAMPLE
    .\tools\uisweep.ps1 -OutDir shots
    .\tools\uisweep.ps1 -OutDir shots -Only cyclopedia,forge
#>
[CmdletBinding()]
param(
    [string]$OutDir = 'shots',
    [string[]]$Only,
    [switch]$NoRestart
)

$ErrorActionPreference = 'Continue'
$here = $PSScriptRoot

# nome -> chunk que abre a janela
$targets = [ordered]@{
    cyclopedia     = 'modules.game_cyclopedia.toggle()'
    forge          = 'modules.game_forge.show()'
    prey           = 'modules.game_prey.show()'
    bazaar         = 'modules.game_character_bazaar.show()'
    soulseal       = 'modules.game_soulseal.show()'
    highscores     = 'modules.game_highscores.show()'
    questlog       = 'modules.game_questlog.show()'
    hotkeys        = 'modules.game_hotkeys.show()'
    inspect        = 'modules.game_inspect.show()'
    taskhunt       = 'modules.game_task_hunt.show()'
    market         = 'modules.game_tibia_market.show()'
    transfer       = 'modules.game_transfer.show()'
    report         = 'modules.game_report.show()'
    bugreport      = 'modules.game_bugreport.show()'
    compendium     = 'modules.game_compendium.show()'
    proficiency    = 'modules.game_proficiency.show()'
    analyser       = 'modules.game_analyser.show()'
    lootsplitter   = 'modules.game_lootsplitter.show()'
    searchlocker   = 'modules.game_search_locker.show()'
    exiva          = 'modules.game_exiva_options.show()'
    partylist      = 'modules.game_party_list.show()'
    podium         = 'modules.game_player_podium.show()'
    playerdeath    = 'modules.game_playerdeath.openWindow()'
    options        = 'modules.client_settings.toggle()'
    # client_terminal fica de fora: o buffer de log e o overlay de selecao ocupam
    # o mesmo retangulo por construcao, entao cada linha visivel vira uma colisao
    # e afoga o resto do relatorio. E console de debug, nao faz parte da skin.
    feedback       = 'modules.client_feedback.show()'
    camviewer      = 'modules.client_camviewer.show()'
    viplist        = 'modules.game_viplist.toggle()'
    ruleviolation  = 'modules.game_ruleviolation.show()'
    itemselector   = 'modules.game_itemselector.show()'
    npctrade       = 'modules.game_npctrade.show()'
    outfit         = 'modules.game_outfit.create()'
    schedule       = 'modules.game_schedule.toggle()'
    helper         = 'modules.game_helper.show()'
    bot            = 'modules.game_bot.toggle()'
    stats          = 'modules.game_stats.show()'
    wheel          = 'modules.game_wheel.show()'
    store          = 'modules.game_store.showStoreWindow()'
    stash          = 'modules.game_stash.showStash()'
    quickloot      = 'modules.game_quickloot.showQuickLoot()'
    dailyreward    = 'modules.game_dailyreward.show()'
    realminimap    = 'modules.game_realminimap.toggle()'
    offsets        = 'modules.game_offsets.showOffset()'
    healthcircle   = 'modules.game_healthcircle.toggleOptionsPanel()'
    clientstats    = 'modules.client_stats.toggle()'
    channels       = 'modules.game_console.doCreateChannelWindow()'
    communication  = 'modules.game_console.doCreateCommunicationWindow()'
    hotkeysmanager = 'modules.game_hotkeys.toggle()'
}

if (-not $NoRestart) { & (Join-Path $here 'uiplay.ps1') | Write-Output }

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
foreach ($name in $targets.Keys) {
    if ($Only -and $Only -notcontains $name) { continue }
    try {
        & (Join-Path $here 'uiwin.ps1') -Open $targets[$name] -Name $name -OutDir $OutDir | Write-Output
    } catch {
        Write-Output "[$name] EXCECAO: $_"
    }
}
