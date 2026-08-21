# tools/assets-update

Edita as sprites de um brush do NexaMap desenhando **uma PNG só** no Aseprite.

A ferramenta monta a palheta do brush — chão + todas as peças de borda, com a animação repetida
frame a frame — numa folha PNG. Você edita a folha, roda o script de novo, e ele compara a imagem
com o que está gravado no `Tibia.spr`, grava **só o que mudou** e não encosta em mais nada.

```powershell
node tools\assets-update\assets-update.js init "shallow water"   # 1. cria o spec
node tools\assets-update\assets-update.js export shallow-water   # 2. gera a PNG
#    edita work\shallow-water\shallow-water.png no Aseprite
node tools\assets-update\assets-update.js shallow-water          # 3. grava o que mudou
```

O passo 3 é o `sync`: exporta se a folha ainda não existe, senão aplica. É o comando do dia a dia.

---

## A cadeia percorrida

É a do `AGENTS.md` — ServerID e ClientID são espaços diferentes de numeração:

```
brush XML (ServerID)  ->  items.otb (ServerID -> ClientID)  ->  Tibia.dat (ClientID -> sprite ids)
                                                             ->  Tibia.spr (sprite id -> pixels)
```

`grounds.xml` e `borders.xml` do editor dizem quais itens formam o brush; o `items.otb` do
**servidor** (a fonte única) traduz para ClientID; o `.dat` diz quais sprites cada ClientID usa em
cada frame; o `.spr` guarda os pixels.

Os parsers vêm de [`tools/sprites/`](../sprites/), que é a porta de `objectbuilder/src/otlib/` e
passa no round-trip. Este diretório só acrescenta o acesso aleatório ao `.spr`
([`lib/sprfile.js`](lib/sprfile.js)) e o recorte da folha.

---

## O spec — o JSON que diz quais tiles serão alterados

Um arquivo por palheta em [`specs/`](specs/), gerado pelo `init` e livre para editar à mão:

```json
{
  "name": "shallow-water",
  "brush": "shallow water",
  "source": "mapeditor/data/860/grounds.xml",
  "assetDir": "client/data/things/860",
  "layout": "island5x5",
  "frameLayout": "horizontal",
  "tiles": [
    { "slot": "ground", "serverId": 13988, "label": "ground", "chance": 2500 },
    { "slot": "n", "serverId": 10114, "label": "n", "border": 174 }
  ]
}
```

| Campo do tile | Para que serve |
|---|---|
| `serverId` | **obrigatório** — o id do item como o servidor e o editor falam |
| `slot` | posição na grade (`ground`, `n`, `e`, `s`, `w`, `cnw`…, `dse`). Sem slot, o tile cai na faixa de extras abaixo da ilha |
| `row` / `col` | posição explícita, quando você quer fugir do layout |
| `clientId` | força o ClientID em vez de resolver pelo `items.otb` |
| `label` | nome que aparece nos relatórios |

`init` reescreve o spec inteiro — se você editou à mão, rode com `--name=outro-nome`.

---

## O arranjo da folha

Cada frame da animação é um bloco de 5×5 células de 32 px. O bloco desenha uma ilha de chão com os
cantos recortados, cercada pelo anel de bordas:

```
        col 0    1      2      3      4
   row0  cse    ---     s     ---    csw
   row1  ---    dse   chão    dsw    ---
   row2   e    chão   CHÃO   chão     w
   row3  ---    dne   chão    dnw    ---
   row4  cne    ---     n     ---    cnw
```

**O nome da aresta diz onde está o chão, não onde está a peça.** A peça `n` é desenhada no tile que
tem chão ao norte — ela aparece *embaixo* da água. Isso não é convenção desta ferramenta: vem de
`mapeditor/source/brush_tables.cpp`, onde `border_types[TILE_NORTH] = NORTH_HORIZONTAL`, e é a mesma
grade que o próprio editor monta em `source/border_workspace_window.cpp:56-64`.

O resultado é que a ilha fecha: as bordas encostam no chão como encostariam no mapa, e o traço passa
direto de uma célula para a outra.

Os blocos se repetem lado a lado, um por frame (`"frameLayout": "vertical"` empilha).

### Células que compartilham a mesma sprite

Acontece por dois motivos, e os dois aparecem no shallow water:

- as quatro células de chão ao redor do centro são **contexto** — o mesmo sprite do centro, só para
  você ver a borda encostando;
- **animações reusam desenho**: o `cse` usa a mesma sprite nos frames 0 e 5.

A regra é simples: **edite uma célula só**. Ao gravar, a ferramenta copia o desenho novo para as
outras células daquele sprite e diz quantas sincronizou — a folha continua coerente e rodar de novo
não desfaz nada. Se você editar duas cópias de formas diferentes, ela recusa e mostra quais são,
porque não há como gravar as duas no mesmo sprite.

Consequência: `apply` **reescreve a PNG de trabalho** quando há células a sincronizar.

### No Aseprite

- **File > Import Sprite Sheet**, tamanho do frame = tamanho do bloco (a folha do shallow water:
  `160x160`, 6 frames).
- **View > Grid Settings**, grade `32x32` — é o tile do jogo.
- Salve por cima da mesma PNG (`Ctrl+S`). Não redimensione, não adicione margem: o corte em células
  depende das dimensões exatas.

---

## O que a ferramenta faz e o que não faz

**Faz:** troca os pixels de sprites que já existem. Isso não muda sprite id, ClientID nem ServerID —
por isso `.dat`, `items.otb` e `items.xml` ficam intactos e não há nada para espelhar no editor.

**Não faz (ainda):**

- **Criar sprite nova.** Se uma célula estava vazia (sprite id 0) e você desenhou nela, a ferramenta
  avisa e não grava — criar sprite exige mexer no `.dat`.
- **Mudar quantidade de frames, tamanho ou camadas.** A geometria vem do `.dat`; a folha só reflete.
- **Separar variações que compartilham sprites.** No shallow water, `13988` e `13989` apontam para os
  **mesmos** sprite ids: são o mesmo desenho em dois itens. Editar um edita os dois. Para que
  fiquem diferentes é preciso criar sprites novas.

---

## Segurança

- **Gravação por acréscimo.** O corpo novo do sprite vai para o fim do `.spr` e só os 4 bytes do
  endereço na tabela mudam — verificado: uma sprite trocada mexeu em exatamente 4 bytes dos 432 MB,
  mais os bytes acrescentados no fim. Cliente e editor leem o corpo pelo endereço da tabela
  (`client/src/client/spritemanager.cpp:614`, `mapeditor/source/graphics.cpp:1377`), então a ordem
  no arquivo não importa.
- **`revert` é exato.** Como o corpo antigo nunca é apagado, o revert só reaponta o endereço e o
  arquivo volta byte a byte ao que era. O histórico das últimas 5 gravações fica em
  `work/<spec>/state.json`, com os bytes anteriores em base64 como segunda rede.
- **Backup na primeira gravação.** `Tibia.spr.backup-before-assets-update`, uma vez só (432 MB).
  `--no-backup` pula.
- **Feche o editor e o cliente antes de gravar.** Os dois mantêm o `.spr` aberto enquanto rodam e o
  Windows recusa a escrita (`EBUSY`); a ferramenta detecta e avisa. Eles só releem os assets ao
  abrir, então reiniciar é necessário de qualquer forma para ver a mudança.
- **Trabalhar em cópia:** `--assets=<dir>` aponta para outra pasta de assets. Foi assim que o ciclo
  completo foi validado antes de liberar a gravação nos arquivos do cliente.

### Transparência

O `Tibia.otfi` do 8.60 tem `transparency: false`: o formato não guarda alpha parcial. Pixel apagado
some, pixel desenhado é opaco. Alpha entre 1 e 254 é tratado como opaco e reportado. Magenta puro
(255,0,255) é gravado como cor — se você usa magenta como "buraco", rode com `--magenta-as-alpha`.

---

## Comandos

| Comando | O que faz |
|---|---|
| `init "<brush>"` | lê o brush do editor e escreve `specs/<slug>.json` |
| `export <slug>` | monta `work/<slug>/<slug>.png` + `state.json` |
| `status <slug>` | compara a PNG com o `.spr` e lista o que falta gravar |
| `apply <slug>` | grava as células alteradas |
| `revert <slug>` | desfaz a última gravação |
| `sync <slug>` | exporta se falta, senão aplica — é o padrão quando você passa só o nome |
| `list` | specs existentes e o estado de cada um |

Opções: `--dry-run`, `--force`, `--no-backup`, `--magenta-as-alpha`, `--assets=<dir>`,
`--name=`/`--title=` (no `init`).

`node tools/assets-update/selftest.js` roda o teste de aceite do gravador sobre um `.spr` sintético
— leitura contra o codec de referência, isolamento da gravação, leitura por um parser independente,
revert e corte da folha. Rode antes de confiar numa mudança neste diretório.

`work/` não é versionado: são as PNGs de trabalho e o estado local, e os assets que eles descrevem
também não estão no git.
