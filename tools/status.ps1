<#
.SYNOPSIS
    Estado consolidado dos cinco repositorios do workspace Backlands.

.DESCRIPTION
    Para cada repositorio: branch, quantidade de alteracoes locais e
    posicao em relacao ao remoto (ahead/behind).

.PARAMETER Fetch
    Roda 'git fetch' antes, para que ahead/behind reflita o remoto atual.

.EXAMPLE
    .\tools\status.ps1
    .\tools\status.ps1 -Fetch
#>
[CmdletBinding()]
param(
    [switch]$Fetch
)

$Root  = Split-Path -Parent $PSScriptRoot
$Dirs  = @('client', 'server', 'mapeditor', 'objectbuilder', 'devfolio')
$Rows  = @()

# O proprio workspace entra primeiro.
$All = @([pscustomobject]@{ Name = '(workflow)'; Path = $Root }) +
       ($Dirs | ForEach-Object { [pscustomobject]@{ Name = $_; Path = (Join-Path $Root $_) } })

foreach ($item in $All) {
    if (-not (Test-Path (Join-Path $item.Path '.git'))) {
        $Rows += [pscustomobject]@{
            Repo = $item.Name; Branch = '-'; Alteracoes = '-'; Remoto = 'AUSENTE'
        }
        continue
    }

    if ($Fetch) { git -C $item.Path fetch --quiet 2>$null }

    $branch = git -C $item.Path rev-parse --abbrev-ref HEAD 2>$null
    $dirty  = @(git -C $item.Path status --porcelain 2>$null).Count

    $remote = '-'
    $upstream = git -C $item.Path rev-parse --abbrev-ref '@{upstream}' 2>$null
    if ($LASTEXITCODE -eq 0 -and $upstream) {
        $counts = git -C $item.Path rev-list --left-right --count "$upstream...HEAD" 2>$null
        if ($counts) {
            $parts  = $counts -split '\s+'
            $behind = [int]$parts[0]
            $ahead  = [int]$parts[1]
            if ($ahead -eq 0 -and $behind -eq 0) { $remote = 'em dia' }
            else { $remote = "+$ahead / -$behind" }
        }
    } else {
        $remote = 'sem upstream'
    }

    $Rows += [pscustomobject]@{
        Repo       = $item.Name
        Branch     = $branch
        Alteracoes = $(if ($dirty -eq 0) { 'limpo' } else { "$dirty arquivo(s)" })
        Remoto     = $remote
    }
}

Write-Host ""
$Rows | Format-Table -AutoSize
Write-Host "  +N = commits locais nao enviados   -N = commits do remoto nao trazidos" -ForegroundColor DarkGray
Write-Host "  Faltando algum repositorio?  .\tools\bootstrap.ps1" -ForegroundColor DarkGray
Write-Host ""
