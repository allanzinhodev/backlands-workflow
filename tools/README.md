# tools/

Ferramentas do workspace Backlands. Ao contrário das cinco pastas de repositório, **este diretório
é versionado** no `backlands-workflow` — é o que viaja junto ao trocar de computador.

## O que vive aqui

| Script | Para que serve |
|---|---|
| `bootstrap.ps1` / `bootstrap.sh` | Reconstrói o workspace do zero: clona os cinco repositórios com os nomes curtos e baixa as dependências. |
| `status.ps1` / `status.sh` | Estado consolidado dos repositórios (branch, alterações, ahead/behind). |

Cada ferramenta tem as duas versões — `.ps1` para Windows/PowerShell, `.sh` para Linux, WSL e Git
Bash. Comportamento equivalente.

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
- **Nunca escreva sobre assets de produção.** Ferramentas que mexem em `.dat`/`.spr`/`.otb`
  trabalham em cópia e comparam com o original.

## Ferramentas planejadas

Serão criadas conforme a necessidade aparecer, não antecipadamente. A fila natural, na ordem em que
o valor aparece:

1. **Sync `items.otb` ↔ `items.xml`** entre `server/` e `mapeditor/data/860/` — hoje é o invariante
   mais frágil do stack. Referência: `objectbuilder/src/otlib/items/OtbSync.as`.
2. **Parser `.dat`/`.spr` para 8.60** — edição de sprites e metadata por script, sem GUI.
   Referência: `objectbuilder/src/otlib/things/MetadataReader5.as` e `sprites/SpriteStorage.as`.
3. **Verificador de consistência** — confere que `.otb`, `.dat` e `items.xml` concordam antes de
   subir uma mudança.

O mapa completo dos formatos e dos arquivos de referência está na skill `backlands`
(`.claude/skills/backlands/SKILL.md`, seções 2 e 6). **Leia a referência antes de escrever
parser** — o layout binário muda por versão de cliente.
