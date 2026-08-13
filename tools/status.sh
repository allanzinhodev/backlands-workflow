#!/usr/bin/env bash
#
# Estado consolidado dos cinco repositorios do workspace Backlands.
#
# Uso:
#   ./tools/status.sh            estado local
#   ./tools/status.sh --fetch    faz fetch antes, para ahead/behind refletir o remoto

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

DO_FETCH=0
for arg in "$@"; do
  case "$arg" in
    --fetch)   DO_FETCH=1 ;;
    -h|--help) sed -n '3,7p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *)         echo "Opcao desconhecida: $arg (use --help)" >&2; exit 1 ;;
  esac
done

if [ -t 1 ]; then
  C_DIM=$'\033[0;90m'; C_ERR=$'\033[0;31m'; C_OFF=$'\033[0m'
else
  C_DIM=''; C_ERR=''; C_OFF=''
fi

# O proprio workspace entra primeiro.
ENTRIES=("(workflow)|$ROOT")
for d in client server mapeditor objectbuilder devfolio; do
  ENTRIES+=("$d|$ROOT/$d")
done

printf '\n%-15s %-10s %-16s %s\n' "REPO" "BRANCH" "ALTERACOES" "REMOTO"
printf '%-15s %-10s %-16s %s\n' "---------------" "----------" "----------------" "------------"

for entry in "${ENTRIES[@]}"; do
  IFS='|' read -r name path <<< "$entry"

  if [ ! -d "$path/.git" ]; then
    printf '%s%-15s %-10s %-16s %s%s\n' "$C_ERR" "$name" "-" "-" "AUSENTE" "$C_OFF"
    continue
  fi

  [ "$DO_FETCH" -eq 1 ] && git -C "$path" fetch --quiet 2>/dev/null

  branch="$(git -C "$path" rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')"

  dirty="$(git -C "$path" status --porcelain 2>/dev/null | wc -l | tr -d ' ')"
  if [ "$dirty" -eq 0 ]; then changes="limpo"; else changes="$dirty arquivo(s)"; fi

  if upstream="$(git -C "$path" rev-parse --abbrev-ref '@{upstream}' 2>/dev/null)"; then
    counts="$(git -C "$path" rev-list --left-right --count "$upstream...HEAD" 2>/dev/null || echo '')"
    if [ -n "$counts" ]; then
      behind="$(echo "$counts" | awk '{print $1}')"
      ahead="$(echo "$counts" | awk '{print $2}')"
      if [ "$ahead" -eq 0 ] && [ "$behind" -eq 0 ]; then remote="em dia"; else remote="+$ahead / -$behind"; fi
    else
      remote="-"
    fi
  else
    remote="sem upstream"
  fi

  printf '%-15s %-10s %-16s %s\n' "$name" "$branch" "$changes" "$remote"
done

echo ""
printf '%s  +N = commits locais nao enviados   -N = commits do remoto nao trazidos%s\n' "$C_DIM" "$C_OFF"
printf '%s  Faltando algum repositorio?  ./tools/bootstrap.sh%s\n' "$C_DIM" "$C_OFF"
echo ""
