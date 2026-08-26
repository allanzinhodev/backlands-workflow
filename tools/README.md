# tools/

Ferramentas do workspace Backlands. Ao contrário das cinco pastas de repositório, **este diretório
é versionado** no `backlands-workflow` — é o que viaja junto ao trocar de computador.

## O que vive aqui

| Script | Para que serve |
|---|---|
| `bootstrap.ps1` / `bootstrap.sh` | Reconstrói o workspace do zero: clona os cinco repositórios com os nomes curtos e baixa as dependências. |
| `status.ps1` / `status.sh` | Estado consolidado dos repositórios (branch, alterações, ahead/behind). |
| `build.ps1` | Compila servidor (CMake+Ninja+vcpkg) e cliente (MSBuild `vc23`) com o ambiente do MSVC já montado. Só Windows. |
| `run-local.ps1` | Sobe o stack local: MariaDB → servidor → cliente, com preflight de assets, mapa, `items.otb` e binários. Só Windows (usa o MariaDB portátil em `%USERPROFILE%\mariadb`). |
| `mapeditor-assets.ps1` | Aponta o NexaMap Editor para os assets 8.60 do cliente e valida assinaturas e flags do `.otfi`. Só Windows. |
| `sprites/` | Parser `.dat`/`.spr`/`.otb`/`.otfi` do 8.60, portado do `objectbuilder/src/otlib`. É a base dos scripts que mexem em asset — ver [`sprites/README.md`](sprites/README.md). |
| `assets-update/` | Exporta a palheta de um brush do NexaMap como uma PNG só (bordas + animação), e regrava no `Tibia.spr` o que você editar no Aseprite — ver [`assets-update/README.md`](assets-update/README.md). |
| `pixelui/` | Sprites da UI pixel-art do cliente: `blockscale.js` reemite arte de grid de blocos em outro tamanho de bloco (redesenho, não resample), `probe.js` mede pixels de sprite ou screenshot, `pngcodec.js` é o PNG sem dependências que os dois usam. |
| `ui-shot.ps1` | Sobe o cliente, espera a tela de login, fotografa a janela, encerra e imprime os erros de UI do log. É como se verifica mudança de UI. Só Windows. |
| `otui-lint.js` | Lint estrutural de `.otui`/`.otfont`/`.otmod` com as regras que o `OTMLParser` exige (indentação de 2, sem tabs, sem salto de profundidade). |
| `lua-syntax.lua` | Compila arquivos Lua sem executá-los. Rodar com o `luajit` do vcpkg. |

### `assets-update/`

```powershell
node tools\assets-update\assets-update.js init "shallow water"   # cria o spec do brush
node tools\assets-update\assets-update.js export shallow-water   # gera a folha PNG
node tools\assets-update\assets-update.js shallow-water          # grava o que mudou na PNG
```

O spec em `assets-update/specs/<nome>.json` é o que declara **quais tiles serão alterados**; a folha
sai em `assets-update/work/<nome>/` (não versionada). A gravação é por acréscimo — só os 4 bytes do
endereço na tabela do `.spr` mudam por sprite — e tem `revert`. Feche o editor e o cliente antes de
gravar: os dois seguram o `.spr` aberto.

### `mapeditor-assets.ps1`

```powershell
.\tools\mapeditor-assets.ps1 -VerifyOnly   # so as verificacoes
.\tools\mapeditor-assets.ps1               # aponta o editor para o cliente
.\tools\mapeditor-assets.ps1 -Copy         # copia os assets para mapeditor/data/860 (432 MB)
```

O editor **não** procura `Tibia.dat`/`Tibia.spr` em `mapeditor/data/860/` — esse diretório só tem
`items.otb`, `items.xml` e os XML de brushes. Os assets vêm de um caminho por versão guardado na
chave `ASSETS_DATA_DIRS`, que o `Preferences > Client Version` grava. Como essa chave nunca foi
salva, o editor abre um diálogo modal pedindo a pasta — o script grava a configuração direto.

Aponta em vez de copiar por padrão: o `Tibia.spr` tem 432 MB, e uma segunda cópia sai de sincronia
com a do cliente. Se copiar, o `Tibia.otfi` **tem** que ir junto — sem ele o editor deriva
`extended=0` para 8.6 e o parser quebra neste `.dat`.

### `build.ps1`

```powershell
.\tools\build.ps1 -Target server   # so o TFS
.\tools\build.ps1 -Target client   # so o AstraClient
.\tools\build.ps1                  # os dois
```

Detecta o Visual Studio pelo `vswhere`, entra no `vcvars64`, fixa `VCPKG_ROOT` no ambiente do
usuário e chama o gerador de cada repo. O vcpkg tem um lock global — os dois builds se serializam
sozinhos, então não adianta abrir duas janelas.

### `run-local.ps1`

```powershell
.\tools\run-local.ps1 -CheckOnly   # so o relatorio de preflight
.\tools\run-local.ps1 -NoClient    # banco + servidor
.\tools\run-local.ps1              # tudo
```

Cada etapa é idempotente: se o banco já responde na 3306 ou o servidor já escuta na 7171, ele não
sobe uma segunda instância. O preflight confere o que costuma faltar — `data/things/860/` extraído,
`data/world/<mapName>.otbm` presente, `items.otb` do editor igual ao do servidor e os dois binários
compilados.

`bootstrap` e `status` têm as duas versões — `.ps1` para Windows/PowerShell, `.sh` para Linux, WSL e
Git Bash, com comportamento equivalente. `build` e `run-local` são só `.ps1`: dependem do MSVC e do
MariaDB portátil do Windows, e o equivalente em Linux seria outro script, não uma tradução.

### UI do cliente — `pixelui/`, `ui-shot.ps1`, `otui-lint.js`, `lua-syntax.lua`

O ciclo de uma mudança de UI no cliente. O detalhamento do design system está na skill
`backlands-client-ui`; aqui ficam só os comandos.

```bash
# 1. lint (o que derruba o cliente na carga)
node tools/otui-lint.js client/data/styles/40-entergame.otui
vcpkg/packages/luajit_x64-windows-static/tools/luajit/luajit.exe \
  tools/lua-syntax.lua client/modules/client_entergame/entergame.lua

# 2. sprite: descubra o grid antes de rescalar; texto rasterizado nao rescala
node tools/pixelui/blockscale.js detect ui-login/widgets/input-field.png
node tools/pixelui/blockscale.js scale  ui-login/widgets/input-field.png out.png 4 2

# 3. rodar e fotografar
powershell -File tools/ui-shot.ps1 -Out shot.png

# 4. medir, nao olhar
node tools/pixelui/probe.js find shot.png "#4e2f24" 6
node tools/pixelui/probe.js crop shot.png zoom.png 560 120 400 520 2
node tools/pixelui/probe.js at   shot.png 900 369
```

`blockscale` recusa rescalar arte que não seja uniforme no grid informado — é a proteção contra
transformar tipografia assada em mingau. `ui-shot` mata instância anterior antes de subir, porque um
cliente aberto trava o `.exe` contra o relink e ainda rouba o screenshot.

## Máquina nova — do zero ao workspace pronto

**Windows**
```powershell
git clone https://github.com/allanzinhodev/backlands-workflow.git d:\backlands
d:\backlands\tools\bootstrap.ps1
```

**Linux / WSL / Git Bash**
```bash
git clone https://github.com/allanzinhodev/backlands-workflow.git ~/backlands
cd ~/backlands
chmod +x tools/*.sh
./tools/bootstrap.sh --with-apt     # --with-apt instala os pacotes de build (usa sudo)
```

### O que o bootstrap faz

1. Clona os cinco repositórios com os nomes curtos, cada um na sua branch (`objectbuilder` é
   `master`, os outros `main`).
2. Instala o `vcpkg` e faz o bootstrap dele — dependências C++ de `client`, `server` e `mapeditor`.
3. `npm install` no `devfolio`.
4. Extrai `client/data/things/860.rar` (precisa de 7-Zip, `unrar` ou `bsdtar`).
5. Cria `server/config.lua` a partir do `.dist`.
6. Lista no fim o que sobrou de manual — credenciais de banco, `schema.sql`, `VCPKG_ROOT`.

**É idempotente.** Pula o que já existe e não sobrescreve nada. Rodar de novo depois de apagar uma
pasta traz só aquela de volta.

Opções: `--repos-only` / `-ReposOnly` (só os clones), `--skip-vcpkg` / `-SkipVcpkg`,
`--with-apt` (só no bash).

### Sempre manual

Credenciais e o banco não dá para versionar:

1. Preencher usuário/senha do MariaDB em `server/config.lua`.
2. Importar `server/schema.sql` no MariaDB.
3. Exportar `VCPKG_ROOT` (o bootstrap imprime o caminho exato no fim).

> **Atenção ao `860.rar`:** o arquivo já contém uma pasta `860/` na raiz. Extraia para
> `client/data/things/`, **não** para `client/data/things/860/` — o segundo caso gera
> `data/things/860/860/` e o cliente não acha os assets. Os scripts detectam e avisam.

## Convenções para ferramentas novas

- **Escreva aqui, não dentro dos repositórios de ferramenta.** Um script que atravessa repos não
  pertence a nenhum deles.
- **Sem acentos nos `.ps1`.** O Windows PowerShell 5.1 desta máquina lê UTF-8 sem BOM como ANSI e
  quebra os caracteres. Comentários e mensagens em ASCII.
- **Windows PowerShell 5.1**, não PowerShell 7: nada de `&&`, `||`, ternário `?:` ou `??`.
- **Nunca escreva sobre assets de produção sem rede de segurança.** Ferramentas que mexem em
  `.dat`/`.spr`/`.otb` validam em cópia antes (o `assets-update/` tem `--assets=<dir>` para isso) e,
  quando gravam no arquivo real, deixam backup e caminho de volta.

## Ferramentas planejadas

Serão criadas conforme a necessidade aparecer, não antecipadamente. A fila natural, na ordem em que
o valor aparece:

1. **Sync `items.otb` ↔ `items.xml`** entre `server/` e `mapeditor/data/860/` — hoje é o invariante
   mais frágil do stack. Referência: `objectbuilder/src/otlib/items/OtbSync.as`.
2. **Criar sprite nova por script** — hoje `assets-update/` só troca pixels de sprites existentes.
   Desenhar onde não havia nada (sprite id 0) ou mudar quantidade de frames exige acrescentar
   sprites ao `.spr` e reescrever o índice no `.dat`. Referência:
   `objectbuilder/src/otlib/sprites/SpriteStorage.as` e `things/MetadataWriter5.as`.
3. **Verificador de consistência** — confere que `.otb`, `.dat` e `items.xml` concordam antes de
   subir uma mudança.

Já entregues: o parser `.dat`/`.spr`/`.otb` do 8.60 (`sprites/`) e a edição de sprites por PNG
(`assets-update/`).

O mapa completo dos formatos e dos arquivos de referência está na skill `backlands`
(`.claude/skills/backlands/SKILL.md`, seções 2 e 6). **Leia a referência antes de escrever
parser** — o layout binário muda por versão de cliente.
