<#
.SYNOPSIS
    Abre cada janela e lista o que ainda NAO esta em silkscreen-16.

.DESCRIPTION
    Complemento do uisweep: aquele mede geometria, este mede fonte. Este fork nao
    expoe nome de fonte ao Lua, entao a deteccao e por medicao - o mesmo texto num
    widget comprovadamente silkscreen, larguras comparadas. E a metrica real do
    atlas, entao nao ha falso positivo.

.EXAMPLE
    .\tools\uifonts.ps1
    .\tools\uifonts.ps1 -Only options,hotkeys
#>
[CmdletBinding()]
param(
    [string[]]$Only,
    [switch]$NoRestart,
    [int]$Limit = 40
)

$ErrorActionPreference = 'Continue'
$drive = Join-Path $PSScriptRoot 'uidrive.ps1'

$targets = [ordered]@{
    cyclopedia   = 'modules.game_cyclopedia.toggle()'
    forge        = 'modules.game_forge.show()'
    prey         = 'modules.game_prey.show()'
    soulseal     = 'modules.game_soulseal.show()'
    highscores   = 'modules.game_highscores.show()'
    questlog     = 'modules.game_questlog.show()'
    hotkeys      = 'modules.game_hotkeys.show()'
    inspect      = 'modules.game_inspect.show()'
    taskhunt     = 'modules.game_task_hunt.show()'
    market       = 'modules.game_tibia_market.show()'
    report       = 'modules.game_report.show()'
    bugreport    = 'modules.game_bugreport.show()'
    compendium   = 'modules.game_compendium.show()'
    proficiency  = 'modules.game_proficiency.show()'
    lootsplitter = 'modules.game_lootsplitter.show()'
    searchlocker = 'modules.game_search_locker.show()'
    exiva        = 'modules.game_exiva_options.show()'
    options      = 'modules.client_settings.toggle()'
    camviewer    = 'modules.client_camviewer.show()'
    helper       = 'modules.game_helper.show()'
    bazaar       = 'modules.game_character_bazaar.show()'
    podium       = 'modules.game_player_podium.show()'
}

if (-not $NoRestart) { & (Join-Path $PSScriptRoot 'uiplay.ps1') | Write-Output }

foreach ($name in $targets.Keys) {
    if ($Only -and $Only -notcontains $name) { continue }
    $r = & $drive -Action lua -Script "$($targets[$name]) return 'ok'" -TimeoutSec 25
    if ($r -notmatch '^OK') { Write-Output "[$name] nao abriu"; continue }
    Start-Sleep -Milliseconds 800
    $audit = & $drive -Action lua -Script "local w = UID.root():getChildren() return UID.fontaudit(w[#w], $Limit)" -TimeoutSec 40
    Write-Output "[$name] $audit"
    [void](& $drive -Action lua -Script "local w = UID.root():getChildren() local t = w[#w] if t and t:getId() ~= 'gameRootPanel' then t:hide() end return 'hidden'" -TimeoutSec 15)
}
