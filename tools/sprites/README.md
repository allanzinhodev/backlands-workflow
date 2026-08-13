# tools/sprites

Parser e editor dos assets `.dat`/`.spr` do protocolo **8.60 v2**, por script — sem abrir a GUI do
Object Builder.

Portado de `objectbuilder/src/otlib/` (ver [`TODO.md`](../../TODO.md), Feature 2). A referência para
cada arquivo está no cabeçalho do módulo correspondente.

## Módulos

| Arquivo | Papel | Referência no `otlib` |
|---|---|---|
| `otfi.js` | Lê o `Tibia.otfi` (extended, transparency, frame-durations, frame-groups) | `utils/OTFI.as` |
| `dat.js` | Parser do `Tibia.dat` | `things/MetadataReader5.as`, `MetadataFlags5.as`, `MetadataReader.as` |
| `otb.js` | Ponte ServerID ↔ ClientID do `items.otb` | `items/OtbReader.as` |

## Comandos

```bash
node tools/sprites/parse-dat.js        # relatório do .dat (só leitura)
node tools/sprites/roundtrip-test.js   # 5 testes de aceite — rode antes de confiar
node tools/sprites/blank-sprites.js --dry-run
node tools/sprites/blank-sprites.js    # aplica
```

## Decisão de projeto: patch no lugar, não reserialização

`dat.js` **não reescreve** o arquivo. Ele percorre o `.dat` registrando o **offset** de cada entrada
de `spriteIndex`; uma alteração é escrita direto nesses offsets, sobre uma cópia do buffer original.

Isso elimina por construção a classe de bug em que o writer discorda do reader: todo byte não tocado
sai idêntico porque nunca passou por serialização. O teste de identidade confirma em 5.407.372 bytes.

## Por que esvaziar em vez de remover

Remover um `ThingType` do `.dat` **desloca todos os ClientIDs seguintes** e invalida o `items.otb` —
no servidor e no editor. Apontar as sprites para o **id 0** (a sprite vazia, reservada pelo próprio
formato em `SpriteStorage.as:184-187`) preserva os ClientIDs e deixa as sprites antigas órfãs.

Sprite id e ClientID são espaços de numeração independentes: o ClientID é a posição do `ThingType`
no `.dat`, o sprite id só existe na relação `.dat` → `.spr`. Por isso compactar sprites depois é
seguro, e remover objetos não é.

## Resultado da execução em 13/08/2026

Alvos: os 1.159 equipamentos não-clássicos removidos do servidor
(`server/tools/reference/items_definition_removal_report.json`), traduzidos de ServerID para
ClientID pelo `items.otb.backup-before-removal` — o `items.otb` atual já não tem esses nós.

| | |
|---|---|
| Alvos mapeados | 1.159 de 1.159 (0 sem mapeamento) |
| ClientID compartilhado com item que ficou | 0 |
| Objetos esvaziados | 1.159 |
| Referências zeradas | 3.145 |
| Sprites usadas | 485.548 → 483.323 |
| **Sprites órfãs** | **2.225** |
| Bytes alterados no `.dat` | 9.428 (teto 12.580) |

Menos bytes que o teto porque sprite id baixo já tem os bytes altos em zero num `uint32`.

## Pendente — compactação do `.spr`

As 2.225 sprites órfãs ainda ocupam espaço. Removê-las exige reindexar (`SpritesOptimizer.as`,
passos 3-4) e reescrever `.dat` e `.spr` juntos. O ganho é pequeno — **~2 MB de 432 MB (0,46%)** —
porque equipamento é uma fração mínima do atlas. Avaliar se compensa o risco.

## Atenção: os assets não são versionados

`client/.gitignore` tem `data/things/*`, então `Tibia.dat` e `Tibia.spr` **não estão no git**. As
alterações aqui são locais e os backups (`.backup-before-blank`) são a única forma de reverter.
