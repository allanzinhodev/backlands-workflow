# otb-gen

Gera `server/data/items/items.otb` a partir de `client/data/things/Tibia.dat`
e `Tibia.spr`, sem depender do Object Builder (Flash/AIR). É uma
reimplementação em Node puro (sem dependências) da leitura de `.dat`/`.spr` e
da escrita de `.otb` que o Object Builder faz.

## Por que existe

O `items.otb` que estava versionado era um resquício do baseline 8.60
original — desatualizado em relação ao conteúdo real (Tibia 7.4 convertido
para o formato 8.60 extended). O servidor (TFS-like) usa o `.otb` para saber
quais Client IDs existem e quais flags/atributos cada item tem; sem
regenerá-lo, o servidor fica com um mapeamento de itens que não bate com o
client atual.

## Uso

```
node generate-items-otb.js [datDir] [outFile] [--ids reference.otb]
```

- `datDir` (opcional): pasta com `Tibia.dat` e `Tibia.spr`. Default:
  `D:/backlands/client/data/things`.
- `outFile` (opcional): caminho do `.otb` de saída. Default:
  `D:/backlands/server/data/items/items.otb`.
- `--ids reference.otb` (opcional): tira a numeração Server ID → Client ID
  de um `.otb` de referência em vez de usar Server ID = Client ID. Flags,
  hash de sprite e atributos continuam vindo do `.dat`/`.spr`, pelo Client
  ID de cada par.

**O `items.otb` do servidor é gerado com `--ids 74/items/items.otb`:**

```
node generate-items-otb.js "D:/backlands/client/data/things" "D:/backlands/server/data/items/items.otb" --ids "D:/backlands/74/items/items.otb"
```

O mapa (`world.otbm`) e o `items.xml` do servidor falam os Server IDs do
7.4, e no 7.4 Server ID e Client ID divergem em 4652 dos 4990 itens (ex.:
Server ID 2700 "fir tree" usa o Client ID 3614). Sem `--ids`, o `.otb` sai
1:1 e cada Server ID do mapa é desenhado/tratado como o item de outro Client
ID. O Client ID do `.otb` do 7.4 indexa o `.dat` atual sem remapeamento:
4949/4990 hashes de sprite idênticos (os 41 restantes são bordas animadas
com ordem de frame diferente) e flags idênticas em 4989/4990.

O script sobrescreve o arquivo de saída (escreve em `.tmp` e renomeia por
cima, mesma estratégia do `OtbWriter` do Object Builder).

## O que o script faz

1. **Lê o `.dat`** — cabeçalho (signature + contagem de items/outfits/
   effects/missiles) e, para cada item (`ThingType`), as flags e atributos
   (ground, container, fluid container, light, stack order, market name,
   etc.) e os frame groups com seus índices de sprite. Segue o layout de
   flags do `MetadataReader5` do Object Builder — o leitor correto para
   client 8.60 (v1/v2), que é a versão detectada via as signatures do
   `Tibia.dat`/`Tibia.spr` batendo com `objectbuilder/src/config/versions.xml`.
2. **Lê o `.spr`** — endereços de sprite (header extended, 4 bytes de
   contagem) e descompacta o RLE de cada sprite sob demanda.
3. **Calcula o hash do sprite de cada item** — MD5 dos pixels do frame group
   `DEFAULT` em BGR0, espelhado verticalmente, exatamente como
   `SpriteStorage.getSpriteHash` faz no Object Builder. É esse hash que o
   servidor usa para casar item ⇄ sprite.
4. **Converte cada `ThingType` em `ServerItem`** — mesma lógica de
   `OtbSync.createFromThingType`: type (ground/container/fluid/splash),
   todas as flags booleanas, light, ground speed, minimap color, max read/
   read-write chars, stack order, trade-as e nome de mercado. Como o client
   é 8.60 (< 10.10), `forceUse` e `fullGround` ficam sempre `false`
   (paridade com o comportamento do ItemEditor citado no código do Object
   Builder).
5. **Escreve o `.otb`** — formato de árvore binária com bytes especiais
   `0xFE`/`0xFF`/`0xFD` (start/end/escape de nó), igual ao `OtbWriter`.
   Sem `--ids`, Server ID é igual ao Client ID (mapeamento 1:1); com
   `--ids`, os pares vêm do `.otb` de referência, na ordem dele. Versão do OTB
   gravada no header: `major=3, minor=20, build=1` (o mesmo trio que já
   estava no `items.otb` anterior, correspondente a "8.60 v2" em
   `versions.xml`).

## Por que confiar no resultado

O hash de sprite calculado para os primeiros itens (ex.: server ID 100) bate
byte a byte com o hash que já existia no `items.otb` anterior, o que confirma
que a decodificação do `.spr` e o algoritmo de hash estão corretos. A
estrutura do `.otb` gerado também foi validada por round-trip (reler o
arquivo com um parser independente e confirmar ausência de bytes sobrando,
IDs duplicados ou hashes vazios).

## Limitações conhecidas

- Só gera itens (`ThingType` categoria `item`, IDs 100+). Outfits, effects e
  missiles são lidos do `.dat` (para manter a leitura sequencial correta) mas
  descartados — não entram no `.otb`.
- Assume client version fixa 860 (8.60), client 8.60 v1/v2 sinalizado no
  `Tibia.otfi` ao lado do `.dat`. Se o `.dat`/`.spr` forem trocados por uma
  versão de client diferente, os offsets de flags (`MetadataFlags5`) podem
  não bater mais — nesse caso o script vai lançar `Unknown DAT flag ...` em
  vez de gerar dados incorretos silenciosamente.
- Não lê nem escreve `items.xml` (nomes/artigos/atributos de jogo) — isso é
  um arquivo separado, mantido à parte.
