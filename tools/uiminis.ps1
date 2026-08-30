<#
.SYNOPSIS
    Audita as mini-janelas da sidebar, que o uisweep nao alcanca.

.DESCRIPTION
    O uisweep encontra a janela recem-aberta procurando o ultimo filho visivel da
    raiz. Mini-janela nao funciona assim: ela ancora dentro do gameRootPanel, na
    sidebar, e nunca aparece como filha da raiz. Sao tambem as que mais sofrem com
    a fonte nova, porque dividem os 178px da sidebar.

    Abre cada uma pelo modulo, audita geometria e fonte pelo id, e segue.

.EXAMPLE
    .\tools\uiminis.ps1
#>
[CmdletBinding()]
param(
    [switch]$NoRestart,
    [int]$Limit = 20
)

$ErrorActionPreference = 'Continue'
$drive = Join-Path $PSScriptRoot 'uidrive.ps1'

# nome -> @(chunk que abre, id do widget para auditar)
$targets = [ordered]@{
    battle      = @('modules.game_battle.toggle()',            'BattleWindow_1')
    skills      = @('modules.game_skills.toggle()',            'skillWindow')
    minimap     = @('modules.game_minimap.toggle()',           'minimapWindow')
    spells      = @('modules.game_spells.toggle()',            'spellListWidget')
    viplist     = @('modules.game_viplist.toggle()',           'vipWindow')
    unjustified = @('modules.game_unjustifiedpoints.toggle()', 'unjustifiedPointsWindow')
    healthinfo  = @('modules.game_healthinfo.toggle()',        'healthInfoWindow')
    inventory   = @('modules.game_inventory.toggle()',         'inventoryWindow')
    questtrack  = @('modules.game_questlog.toggleTracker()',   'QuestLogTracker')
    analytics   = @('modules.game_analyser.show()',            'analyserMiniWindow')
    partylist   = @('modules.game_party_list.toggle()',        'PartyWindow')
    bot         = @('modules.game_bot.toggle()',               'botWindow')
    schedule    = @('modules.game_schedule.toggle()',          'eventScheduleWindow')
}

if (-not $NoRestart) { & (Join-Path $PSScriptRoot 'uiplay.ps1') | Write-Output }

foreach ($name in $targets.Keys) {
    $open = $targets[$name][0]
    $id = $targets[$name][1]
    $r = & $drive -Action lua -Script "$open return 'ok'" -TimeoutSec 25
    if ($r -notmatch '^OK') { Write-Output "[$name] nao abriu: $r"; continue }
    Start-Sleep -Milliseconds 600
    $geo = & $drive -Action lua -Script "return UID.audit('$id', $Limit)" -TimeoutSec 40
    $fnt = & $drive -Action lua -Script "return UID.fontaudit('$id', $Limit)" -TimeoutSec 40
    Write-Output "[$name] $geo"
    Write-Output "[$name] FONTE: $fnt"
}
