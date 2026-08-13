#!/usr/bin/env bash
#
# Reconstroi o workspace Backlands em uma maquina nova.
# Funciona em Linux, WSL e Git Bash (Windows).
#
# Uso:
#   ./tools/bootstrap.sh                 clona repos + vcpkg + npm + assets
#   ./tools/bootstrap.sh --repos-only    so os cinco repositorios
#   ./tools/bootstrap.sh --with-apt      instala tambem os pacotes de build (usa sudo)
#   ./tools/bootstrap.sh --skip-vcpkg    nao instala o vcpkg
#
# Idempotente: pula o que ja existe, nunca sobrescreve.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

REPOS_ONLY=0
WITH_APT=0
SKIP_VCPKG=0

for arg in "$@"; do
  case "$arg" in
    --repos-only) REPOS_ONLY=1 ;;
    --with-apt)   WITH_APT=1 ;;
    --skip-vcpkg) SKIP_VCPKG=1 ;;
    -h|--help)    sed -n '3,12p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *)            echo "Opcao desconhecida: $arg (use --help)" >&2; exit 1 ;;
  esac
done

# ------------------------------------------------------------------ saida
if [ -t 1 ]; then
  C_STEP=$'\033[1;36m'; C_OK=$'\033[0;32m'; C_SKIP=$'\033[0;90m'
  C_WARN=$'\033[0;33m'; C_ERR=$'\033[0;31m'; C_OFF=$'\033[0m'
else
  C_STEP=''; C_OK=''; C_SKIP=''; C_WARN=''; C_ERR=''; C_OFF=''
fi

step() { printf '\n%s==> %s%s\n' "$C_STEP" "$1" "$C_OFF"; }
ok()   { printf '%s    OK   %s%s\n' "$C_OK"   "$1" "$C_OFF"; }
skip() { printf '%s    skip %s%s\n' "$C_SKIP" "$1" "$C_OFF"; }
warn() { printf '%s    !    %s%s\n' "$C_WARN" "$1" "$C_OFF"; }
die()  { printf '%s\nErro: %s%s\n' "$C_ERR" "$1" "$C_OFF" >&2; exit 1; }

MANUAL=()
manual() { MANUAL+=("$1"); }

# ------------------------------------------------------------------ repositorios
# dir|url|branch
REPOS=(
  "client|https://github.com/allanzinhodev/backlands-client.git|main"
  "server|https://github.com/allanzinhodev/backlands-server.git|main"
  "mapeditor|https://github.com/allanzinhodev/backlands-mapeditor.git|main"
  "objectbuilder|https://github.com/allanzinhodev/backlands-objectbuilder.git|master"
  "devfolio|https://github.com/allanzinhodev/devfolio.git|main"
)

# ------------------------------------------------------------------ pre-requisitos
step "Verificando pre-requisitos"
command -v git >/dev/null 2>&1 || die "git nao encontrado no PATH."
ok "git $(git --version | sed 's/git version //')"

for tool in cmake node npm; do
  if command -v "$tool" >/dev/null 2>&1; then ok "$tool"; else warn "$tool ausente (necessario para parte dos builds)"; fi
done

# ------------------------------------------------------------------ pacotes de build
if [ "$WITH_APT" -eq 1 ]; then
  step "Pacotes de build (apt)"
  if ! command -v apt-get >/dev/null 2>&1; then
    warn "apt-get nao disponivel - pulando (instale as dependencias do seu gerenciador)"
  else
    sudo apt-get update
    # Base comum a client, server e mapeditor (ver READMEs de cada repo).
    sudo apt-get install -y \
      git curl unzip zip tar pkg-config \
      build-essential gcc g++ cmake ninja-build autoconf libtool \
      libglew-dev libgl1-mesa-dev zlib1g-dev
    ok "pacotes instalados"
  fi
fi

# ------------------------------------------------------------------ clones
step "Sincronizando repositorios em $ROOT"
for entry in "${REPOS[@]}"; do
  IFS='|' read -r dir url branch <<< "$entry"

  # Pasta ausente: clona.
  if [ ! -d "$ROOT/$dir/.git" ]; then
    if [ -d "$ROOT/$dir" ]; then
      warn "$dir existe mas nao e repositorio git - pulando"
      manual "Verificar $ROOT/$dir manualmente"
      continue
    fi
    echo "    clonando $dir ..."
    git -C "$ROOT" clone --branch "$branch" "$url" "$dir" || die "falha ao clonar $url"
    ok "$dir <- $url"
    continue
  fi

  # Pasta ja existe: confere se ha commits novos no remoto e puxa.
  repo="$ROOT/$dir"
  if ! git -C "$repo" fetch --quiet 2>/dev/null; then
    warn "$dir: fetch falhou (sem rede ou sem acesso)"
    continue
  fi

  local_head="$(git -C "$repo" rev-parse HEAD 2>/dev/null)"
  upstream="$(git -C "$repo" rev-parse --abbrev-ref '@{upstream}' 2>/dev/null || echo '')"

  if [ -z "$upstream" ]; then
    warn "$dir: sem upstream configurado"
    continue
  fi

  behind="$(git -C "$repo" rev-list --count "HEAD..$upstream" 2>/dev/null || echo 0)"
  ahead="$(git -C "$repo" rev-list --count "$upstream..HEAD" 2>/dev/null || echo 0)"
  dirty="$(git -C "$repo" status --porcelain 2>/dev/null | wc -l | tr -d ' ')"

  if [ "$behind" -eq 0 ]; then
    if [ "$ahead" -gt 0 ]; then
      skip "$dir em dia com o remoto ($ahead commit(s) local(is) a enviar)"
    else
      skip "$dir em dia com o remoto"
    fi
    continue
  fi

  # Ha commits novos no remoto. So puxa se for seguro.
  if [ "$dirty" -gt 0 ]; then
    warn "$dir: $behind commit(s) no remoto, mas ha $dirty alteracao(oes) local(is) - NAO puxei"
    manual "Resolver alteracoes locais em $dir e rodar: git -C \"$repo\" pull"
    continue
  fi

  if [ "$ahead" -gt 0 ]; then
    warn "$dir: divergiu ($ahead local, $behind remoto) - NAO puxei para nao criar merge automatico"
    manual "Reconciliar $dir manualmente: git -C \"$repo\" pull --rebase"
    continue
  fi

  # Fast-forward puro: seguro.
  if git -C "$repo" merge --ff-only "$upstream" --quiet 2>/dev/null; then
    ok "$dir atualizado (+$behind commit(s) do remoto)"
  else
    warn "$dir: fast-forward falhou"
    manual "Atualizar $dir manualmente: git -C \"$repo\" pull"
  fi
done

if [ "$REPOS_ONLY" -eq 1 ]; then
  step "--repos-only: parando aqui"
  exit 0
fi

# ------------------------------------------------------------------ vcpkg
if [ "$SKIP_VCPKG" -eq 0 ]; then
  step "vcpkg (dependencias C++ de client, server e mapeditor)"
  if [ -n "${VCPKG_ROOT:-}" ] && [ -d "${VCPKG_ROOT}" ]; then
    skip "VCPKG_ROOT ja aponta para $VCPKG_ROOT"
  elif [ -d "$ROOT/vcpkg" ]; then
    skip "vcpkg ja clonado em $ROOT/vcpkg"
    manual "export VCPKG_ROOT=\"$ROOT/vcpkg\"  (adicione ao ~/.bashrc)"
  else
    git clone https://github.com/microsoft/vcpkg.git "$ROOT/vcpkg" || die "falha ao clonar vcpkg"
    "$ROOT/vcpkg/bootstrap-vcpkg.sh" -disableMetrics
    ok "vcpkg instalado em $ROOT/vcpkg"
    manual "export VCPKG_ROOT=\"$ROOT/vcpkg\"  (adicione ao ~/.bashrc)"
  fi
fi

# ------------------------------------------------------------------ devfolio
step "devfolio (npm)"
if ! command -v npm >/dev/null 2>&1; then
  warn "npm ausente - pulando"
  manual "Instalar Node.js e rodar: npm install --prefix \"$ROOT/devfolio\""
elif [ -d "$ROOT/devfolio/node_modules" ]; then
  skip "node_modules ja existe"
else
  if npm install --prefix "$ROOT/devfolio"; then
    ok "dependencias do devfolio instaladas"
  else
    warn "npm install falhou"
    manual "Rodar manualmente: npm install --prefix \"$ROOT/devfolio\""
  fi
fi

# ------------------------------------------------------------------ assets do cliente
step "Assets do cliente (protocolo 8.60)"
THINGS="$ROOT/client/data/things"
# O 860.rar ja contem uma pasta "860/" na raiz, entao a extracao vai para
# data/things/ e NAO para data/things/860/. Extrair para dentro de 860/
# produz o aninhamento data/things/860/860/, que o cliente nao encontra.
if [ -f "$THINGS/860/860/Tibia.dat" ]; then
  warn "assets aninhados em data/things/860/860/ - o cliente espera data/things/860/"
  manual "Mover client/data/things/860/860/* para client/data/things/860/"
elif [ -f "$THINGS/860/Tibia.dat" ]; then
  skip "data/things/860/ ja extraido"
elif [ ! -f "$THINGS/860.rar" ]; then
  warn "860.rar nao encontrado"
  manual "Baixar 860.rar (ver client/readme.md) e extrair para client/data/things/860/"
else
  EXTRACTED=0
  if command -v unrar >/dev/null 2>&1; then
    unrar x -o- "$THINGS/860.rar" "$THINGS/" >/dev/null && EXTRACTED=1
  elif command -v 7z >/dev/null 2>&1; then
    7z x "$THINGS/860.rar" -o"$THINGS" -y >/dev/null && EXTRACTED=1
  elif command -v bsdtar >/dev/null 2>&1; then
    bsdtar -xf "$THINGS/860.rar" -C "$THINGS" && EXTRACTED=1
  fi
  if [ "$EXTRACTED" -eq 1 ] && [ -f "$THINGS/860/Tibia.dat" ]; then
    ok "860.rar extraido"
  else
    warn "nao consegui extrair (.rar precisa de unrar, 7z ou bsdtar)"
    manual "Extrair client/data/things/860.rar para client/data/things/860/"
  fi
fi

# ------------------------------------------------------------------ config do servidor
step "Config do servidor"
if [ -f "$ROOT/server/config.lua" ]; then
  skip "server/config.lua ja existe"
elif [ -f "$ROOT/server/config.lua.dist" ]; then
  cp "$ROOT/server/config.lua.dist" "$ROOT/server/config.lua"
  ok "server/config.lua criado a partir do .dist"
  manual "Preencher credenciais de banco em server/config.lua"
fi
manual "Importar server/schema.sql no MariaDB"

# ------------------------------------------------------------------ resumo
step "Pronto"
echo ""
echo "Repositorios:"
for entry in "${REPOS[@]}"; do
  IFS='|' read -r dir url branch <<< "$entry"
  if [ -d "$ROOT/$dir" ]; then
    printf '    %-15s %s\n' "$dir" "$(git -C "$ROOT/$dir" rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')"
  else
    printf '%s    %-15s AUSENTE%s\n' "$C_ERR" "$dir" "$C_OFF"
  fi
done

if [ "${#MANUAL[@]}" -gt 0 ]; then
  echo ""
  printf '%sPassos manuais restantes:%s\n' "$C_WARN" "$C_OFF"
  i=1
  for m in "${MANUAL[@]}"; do
    printf '    %d. %s\n' "$i" "$m"
    i=$((i + 1))
  done
fi

echo ""
printf '%sEstado dos repos a qualquer momento:  ./tools/status.sh%s\n' "$C_SKIP" "$C_OFF"
echo ""
