<#
.SYNOPSIS
    Audita TODA mini-janela dos paineis laterais do jogo.

.DESCRIPTION
    O uisweep encontra a janela recem-aberta pelo ultimo filho visivel da raiz.
    Mini-janela nao aparece ali: ancora dentro do gameRootPanel, na sidebar. Sao
    tambem as que mais sofrem com a fonte nova, porque dividem 178px de largura.

    A primeira versao desta ferramenta tinha uma lista de `modules.x.toggle()`
    escrita a mao e alcancava 13 janelas. Os paineis carregam ~48: dez sub-janelas
    do analyser, seis trackers, vinte slots de battle. Perguntar ao cliente quais
    existem acha todas e nao depende de saber o nome da funcao que abre cada uma.

    Mini-janela fechada continua no painel, so invisivel, e widget invisivel nao
    tem rect valido. Por isso cada janela e revelada, medida e devolvida ao estado
    anterior - em TRES chamadas separadas ao driver, nao numa so: `setVisible`
    apenas agenda o layout, e medir no mesmo quadro le o rect velho. Foi assim que
    apareceu uma colisao fantasma entre "Bonus" e "Food" na janela de skills.

.EXAMPLE
    .\tools\uiminis.ps1
    .\tools\uiminis.ps1 -NoRestart -Only impact,trade
#>
[CmdletBinding()]
param(
    [switch]$NoRestart,
    [string[]]$Only,
    [int]$Limit = 14
)

$ErrorActionPreference = 'Continue'
$drive = Join-Path $PSScriptRoot 'uidrive.ps1'

function Invoke-Lua([string]$Script, [int]$Timeout = 40) {
    $r = & $drive -Action lua -Script $Script -TimeoutSec $Timeout
    if ($r -match '^OK\s?') { return $r -replace '^OK\s?', '' }
    return "ERRO: $r"
}

if (-not $NoRestart) { & (Join-Path $PSScriptRoot 'uiplay.ps1') | Write-Output }

$listar = @'
local out = {}
local gi = modules.game_interface
for _, side in ipairs({'right', 'left'}) do
  local get = gi['get' .. side:sub(1,1):upper() .. side:sub(2) .. 'Panel']
  if get then
    for _, w in ipairs(get():getChildren()) do
      if w:getClassName() == 'UIMiniWindow' then
        out[#out+1] = side .. '|' .. tostring(w:getId()) .. '|' .. tostring(w:isVisible())
      end
    end
  end
end
return table.concat(out, ';')
'@

$lista = Invoke-Lua $listar 60
if ($lista -like 'ERRO:*') { Write-Output "nao consegui listar: $lista"; exit 1 }

$janelas = $lista -split ';' | Where-Object { $_ } | ForEach-Object {
    $p = $_ -split '\|'
    [pscustomobject]@{ Side = $p[0]; Id = $p[1]; Visivel = ($p[2] -eq 'true') }
}
if ($Only) { $janelas = $janelas | Where-Object { $id = $_.Id; $Only | Where-Object { $id -like "*$_*" } } }
# a mesma mini-janela e listada nos dois paineis; auditar duas vezes so dobra o tempo
$janelas = $janelas | Sort-Object Id -Unique

$achados = 0
foreach ($j in $janelas) {
    $id = $j.Id
    if (-not $j.Visivel) {
        Invoke-Lua "local w = UID.find('$id') if w then w:setVisible(true) end return 'ok'" | Out-Null
        Start-Sleep -Milliseconds 600   # deixa o layout do quadro seguinte rodar
    }
    # Mede duas vezes. Revelar uma mini-janela faz o verticalBox do painel reposicionar
    # as 48, e a primeira medicao pega rects a meio caminho: o impact analyser relatou
    # seis colisoes que sumiram sozinhas no quadro seguinte. So o que sobrevive as duas
    # medicoes e achado.
    $geo = Invoke-Lua "return UID.audit('$id', $Limit)"
    $fnt = Invoke-Lua "return UID.fontaudit('$id', $Limit)"
    if ($geo -notlike 'limpo*' -or $fnt -notlike 'tudo em*') {
        Start-Sleep -Milliseconds 500
        $geo = Invoke-Lua "return UID.audit('$id', $Limit)"
        $fnt = Invoke-Lua "return UID.fontaudit('$id', $Limit)"
    }
    if (-not $j.Visivel) {
        Invoke-Lua "local w = UID.find('$id') if w then w:setVisible(false) end return 'ok'" | Out-Null
    }
    if ($geo -like 'limpo*' -and $fnt -like 'tudo em*') { continue }
    $achados++
    $oculta = if ($j.Visivel) { '' } else { ' (oculta)' }
    Write-Output "[$($j.Side)/$id]$oculta $geo"
    if ($fnt -notlike 'tudo em*') { Write-Output "    FONTE: $fnt" }
}

Write-Output ""
Write-Output "$($janelas.Count) mini-janelas auditadas, $achados com achado"
