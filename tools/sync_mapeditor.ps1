# tools/sync_mapeditor.ps1
$ErrorActionPreference = "Stop"

$workspace = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

$serverData = Join-Path $workspace "server\data"
$editorData = Join-Path $workspace "mapeditor\data\860"

Write-Host "Sincronizando arquivos do servidor com o Map Editor..."

if (-Not (Test-Path $editorData)) {
    Write-Host "Aviso: Pasta data/860 do mapeditor nao existe. Criando..."
    New-Item -ItemType Directory -Force -Path $editorData | Out-Null
}

# 1. Copiar items.otb
Copy-Item -Path "$serverData\items\items.otb" -Destination "$editorData\items.otb" -Force
Write-Host "items.otb copiado."

# 2. Copiar items.xml
Copy-Item -Path "$serverData\items\items.xml" -Destination "$editorData\items.xml" -Force
Write-Host "items.xml copiado."

# 3. Copiar monsters
$editorMonsters = Join-Path $editorData "monsters"
if (Test-Path $editorMonsters) { Remove-Item -Recurse -Force $editorMonsters }
Copy-Item -Path "$serverData\monsters" -Destination $editorMonsters -Recurse -Force
Write-Host "Pasta de monstros sincronizada."

# 4. Copiar npcs
$editorNpcs = Join-Path $editorData "npcs"
if (Test-Path $editorNpcs) { Remove-Item -Recurse -Force $editorNpcs }
Copy-Item -Path "$serverData\npc" -Destination $editorNpcs -Recurse -Force
Write-Host "Pasta de npcs sincronizada."

Write-Host "Sincronizacao concluida com sucesso!"
