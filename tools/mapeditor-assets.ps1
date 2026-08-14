<#
.SYNOPSIS
    Aponta o NexaMap Editor para os assets 8.60 do cliente e valida que ele consegue le-los.

.DESCRIPTION
    O editor NAO procura Tibia.dat/Tibia.spr dentro de mapeditor/data/860/ -- esse diretorio so tem
    items.otb, items.xml e os XML de brushes. O .dat/.spr vem de um caminho por versao guardado na
    chave de settings ASSETS_DATA_DIRS, que o Preferences > Client Version grava.

    Como essa chave nunca foi salva nesta maquina, o editor abre um dialogo modal pedindo a pasta
    de assets -- o que trava qualquer execucao nao interativa. Este script grava a configuracao
    direto, apontando para a pasta do cliente.

    Por que apontar em vez de copiar: o Tibia.spr tem 432 MB. Copiar para dentro do repositorio do
    editor duplicaria isso em disco e criaria uma segunda copia para sair de sincronia. Se um dia
    for mesmo necessario copiar, use -Copy: o script leva junto o Tibia.otfi, que e obrigatorio
    (sem ele o editor deriva flags de formato errados para 8.6 e o parser quebra neste .dat).

.PARAMETER Copy
    Copia Tibia.dat/.spr/.otfi para mapeditor/data/860/ em vez de apontar para o cliente.

.PARAMETER VerifyOnly
    So roda as verificacoes, sem escrever configuracao.

.EXAMPLE
    .\tools\mapeditor-assets.ps1
    .\tools\mapeditor-assets.ps1 -VerifyOnly
#>
[CmdletBinding()]
param(
    [switch]$Copy,
    [switch]$VerifyOnly
)

$ErrorActionPreference = 'Stop'

$Root       = Split-Path -Parent $PSScriptRoot
$ClientDir  = Join-Path $Root 'client\data\things\860'
$EditorDir  = Join-Path $Root 'mapeditor'
$ExePath    = Join-Path $EditorDir 'vcproj\x64\Release\NexaMap Editor.exe'
$ClientsXml = Join-Path $EditorDir 'data\clients.xml'

# ClientVersionID de 8.60 em mapeditor/data/clients.xml
$ClientVersionId860 = 20

function Write-Ok($text)   { Write-Host "    [ok]    $text" -ForegroundColor Green }
function Write-Bad($text)  { Write-Host "    [falha] $text" -ForegroundColor Red }
function Write-Info($text) { Write-Host "    [nota]  $text" -ForegroundColor DarkGray }

function Get-Signature($path) {
    $bytes = [System.IO.File]::ReadAllBytes($path)[0..3]
    return ('0x{0:X2}{1:X2}{2:X2}{3:X2}' -f $bytes[3], $bytes[2], $bytes[1], $bytes[0])
}

$problems = @()

Write-Host ""
Write-Host "==> Assets do cliente" -ForegroundColor Cyan

$dat  = Join-Path $ClientDir 'Tibia.dat'
$spr  = Join-Path $ClientDir 'Tibia.spr'
$otfi = Join-Path $ClientDir 'Tibia.otfi'

foreach ($file in @($dat, $spr, $otfi)) {
    if (Test-Path $file) {
        $size = [math]::Round((Get-Item $file).Length / 1MB, 2)
        Write-Ok ("{0} ({1} MB)" -f (Split-Path $file -Leaf), $size)
    } else {
        Write-Bad ("{0} ausente" -f (Split-Path $file -Leaf))
        $problems += (Split-Path $file -Leaf)
    }
}

if ($problems.Count -gt 0) {
    Write-Host ""
    Write-Host "Assets 8.60 faltando. Extraia client\data\things\860.rar antes." -ForegroundColor Red
    Write-Host ""
    return
}

# ---------------------------------------------------------------- assinaturas

Write-Host ""
Write-Host "==> Assinaturas x clients.xml" -ForegroundColor Cyan

$datSig = Get-Signature $dat
$sprSig = Get-Signature $spr
Write-Info "Tibia.dat = $datSig    Tibia.spr = $sprSig"

if (Test-Path $ClientsXml) {
    $xml = Get-Content $ClientsXml -Raw
    # A entrada 8.60 aceita mais de um par de assinaturas; basta uma casar.
    if ($xml -match [regex]::Escape($datSig)) { Write-Ok "assinatura do .dat aceita pelo clients.xml" }
    else { Write-Bad "assinatura do .dat ($datSig) nao aparece no clients.xml"; $problems += 'dat-sig' }

    if ($xml -match [regex]::Escape($sprSig)) { Write-Ok "assinatura do .spr aceita pelo clients.xml" }
    else { Write-Bad "assinatura do .spr ($sprSig) nao aparece no clients.xml"; $problems += 'spr-sig' }
} else {
    Write-Bad "clients.xml nao encontrado em $ClientsXml"
    $problems += 'clients.xml'
}

# ---------------------------------------------------------------- otfi

Write-Host ""
Write-Host "==> Flags do Tibia.otfi" -ForegroundColor Cyan
Write-Info "sem .otfi o editor assume extended=0 / durations=0 / groups=0 para 8.6 e quebra neste .dat"

$otfiText = Get-Content $otfi -Raw
foreach ($flag in @('extended', 'frame-durations', 'frame-groups')) {
    if ($otfiText -match "$flag\s*:\s*true") { Write-Ok "${flag}: true" }
    else { Write-Bad "$flag nao esta true no .otfi"; $problems += $flag }
}
if ($otfiText -match 'transparency\s*:\s*false') { Write-Ok "transparency: false (pixel RGB de 3 bytes)" }

# ---------------------------------------------------------------- binario

Write-Host ""
Write-Host "==> Editor" -ForegroundColor Cyan
if (Test-Path $ExePath) {
    $exe = Get-Item $ExePath
    Write-Ok ("compilado: {0} ({1} MB, {2})" -f (Split-Path $ExePath -Leaf), [math]::Round($exe.Length / 1MB, 2), $exe.LastWriteTime)
} else {
    Write-Bad "editor nao compilado - abra mapeditor\vcproj\Editor.sln (x64, Release)"
    $problems += 'editor-bin'
}

if ($VerifyOnly) {
    Write-Host ""
    if ($problems.Count -eq 0) { Write-Host "Verificacao limpa." -ForegroundColor Green }
    else { Write-Host ("Pendencias: " + ($problems -join ', ')) -ForegroundColor Yellow }
    Write-Host ""
    return
}

# ---------------------------------------------------------------- configuracao

Write-Host ""
Write-Host "==> Configuracao" -ForegroundColor Cyan

if ($Copy) {
    $target = Join-Path $EditorDir 'data\860'
    Write-Info "copiando os assets para $target (o .spr tem 432 MB, isto demora)"
    foreach ($file in @($dat, $spr, $otfi)) {
        Copy-Item $file (Join-Path $target (Split-Path $file -Leaf)) -Force
        Write-Ok ("copiado: " + (Split-Path $file -Leaf))
    }
    $assetsPath = ($target -replace '\\', '/') + '/'
} else {
    $assetsPath = ($ClientDir -replace '\\', '/') + '/'
    Write-Info "apontando o editor para $assetsPath (sem copiar)"
}

if (-not (Test-Path $ExePath)) {
    Write-Host ""
    Write-Host "Sem o binario nao da para gravar o editor.cfg no lugar certo." -ForegroundColor Yellow
    Write-Host ""
    return
}

# O editor procura editor.cfg no DIRETORIO DE TRABALHO do processo. Gravando ao lado do exe e
# iniciando a partir dali, ele acha -- e a configuracao fica no repositorio, nao no registro.
$exeDir = Split-Path $ExePath -Parent
$cfgPath = Join-Path $exeDir 'editor.cfg'

$assetsJson = '[{"id":"8.60","path":"' + $assetsPath + '"}]'
$lines = @(
    '[Version]',
    'CHECK_SIGNATURES=1',
    "ASSETS_DATA_DIRS=$assetsJson",
    '',
    '[Editor]',
    "DEFAULT_CLIENT_VERSION=$ClientVersionId860"
)
Set-Content -Path $cfgPath -Value $lines -Encoding ASCII
Write-Ok "editor.cfg gravado em $cfgPath"
Write-Info "DEFAULT_CLIENT_VERSION=$ClientVersionId860 (8.60). Sem isso o editor abre pedindo assets do 13.30."

Write-Host ""
Write-Host "Pronto. Inicie o editor a partir da pasta do exe para ele achar o editor.cfg:" -ForegroundColor Green
Write-Host "  Start-Process -FilePath '$ExePath' -WorkingDirectory '$exeDir'" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Recarregar sprites depois de mexer no .dat/.spr: F5 dentro do editor." -ForegroundColor DarkGray
Write-Host "Reimportar PNG editado de volta para o .spr NAO existe no editor (so leitura)." -ForegroundColor DarkGray
Write-Host ""
