# items-migrate

Migra Server IDs e atributos do `items.xml` do datapack de referência
Tibia 7.4 (`74/items/items.xml`) para o `items.xml` do servidor atual
(`server/data/items/items.xml`), usando o **Server ID do 7.4 como fonte da
verdade**.

## Por que existe

O `items.xml` atual foi herdado de uma base de servidor moderna genérica
("upstream Mateuzkl") e não tem relação semântica com a numeração de itens
do Tibia 7.4 — é coincidência de numeração (ex: o ID 194 no atual é "dirt"
moderno, mas no 7.4 outro item completamente diferente usa esse mesmo ID).
Para o servidor voltar a se comportar como 7.4, os Server IDs e atributos
do datapack 7.4 precisam substituir o que está no arquivo atual, preservando
ao mesmo tempo os atributos "modernos" (imbuements, scripts, elemental
protection, classification, etc. — conceitos que não existiam em 1998)
quando o mesmo item, identificado por nome, já existe na base atual.

## Uso

```
node migrate-items.js [--dry-run]
```

- `--dry-run`: roda parse, matching, merge e validação, imprime o relatório
  de estatísticas e o relatório de ambiguidade, mas **não escreve nenhum
  arquivo**. Rode sempre isso primeiro depois de qualquer mudança no script
  ou nos dados de origem.
- Sem flag: faz backup de `server/data/items/items.xml` (timestamped
  `.bak` ao lado do arquivo) e sobrescreve o arquivo com o resultado.

Outros scripts desta pasta:
- `node self-test.js [caminho]`: reparseia e reserializa um `items.xml`
  (default: o do servidor atual) e confirma que o resultado é byte-idêntico
  ao original. É o teste de round-trip do parser/serializer — rode depois
  de qualquer mudança em `xml-lite.js`.
- `xml-lite.js` / `read-otb-ids.js`: módulos internos (parser/serializer
  XML manual e leitor de Server IDs de um `.otb`), não scripts standalone.

## O que o script faz

1. **Parseia os dois arquivos** com um parser XML manual escrito para este
   projeto (`xml-lite.js`, zero dependências, mesmo padrão de
   `tools/otb-gen/`). Entende aninhamento recursivo de `<attribute>` (ex:
   `imbuementslot`/`script` com filhos) e preserva, para cada nó, o texto
   original exato (`.raw`) — nós que não são tocados pela migração são
   reemitidos verbatim, nunca reconstruídos, eliminando qualquer risco de
   reformatar acidentalmente os milhares de itens não relacionados ao 7.4.
2. **Preserva os IDs 1-20 intocados** — são os fluid types universais
   (water, wine, beer, ... chocolate), hardcoded no protocolo/`const.h` do
   servidor, sem relação com conteúdo de jogo. Um guard compara o texto
   serializado desses 20 itens byte a byte contra o original e aborta se
   detectar qualquer mudança.
3. **Casa cada item do 74 com um item do atual por nome** (`name=`,
   normalizado por `trim()`+lowercase). Três resultados possíveis:
   - **Sem match**: nenhum item do atual tem esse nome. O item do 74 sobe
     sozinho, com seus próprios atributos.
   - **Match único**: exatamente um item do atual tem esse nome. Os
     atributos são mesclados (ver regra abaixo).
   - **Match ambíguo**: dois ou mais itens do atual têm esse nome (comum
     em terreno/decoração: "water", "grass", "crate" existem em dezenas de
     IDs diferentes). **Tratado como sem match** — o item do 74 sobe
     sozinho, sem herdar nada do atual, porque não há como saber qual dos
     candidatos é o correspondente certo. Todo caso ambíguo é registrado
     no relatório JSON (`ambiguityReport`) para auditoria; na prática, a
     esmagadora maioria são terrenos/cenário sem "bônus moderno" relevante
     — nenhum item com `attack`/`defense`/`armor`/`weapontype`/`slottype`
     no lado do 74 caiu em ambiguidade na migração de referência.
4. **Regra de merge** (quando há match único): o item final usa sempre o
   Server ID do 74. Os atributos partem da base do item **atual** (preserva
   imbuements, scripts, elemental protection, classification, description —
   tudo que só existe no lado moderno), e por cima são aplicados os
   atributos do **74**, que vencem em qualquer key que definam — mesmo que
   o atual já tivesse um valor diferente para a mesma key (ex: `weight`).
   Isso é determinístico: nunca há ambiguidade sobre "quem vence", porque
   o 74 é declarado como fonte da verdade para o que ele efetivamente
   define.
5. **Sobrescreve sem hesitar quando o Server ID do 74 já está ocupado por
   um item diferente no atual** — essa é a política adotada: o Server ID
   do 74 é o que importa, e o item moderno que ocupava aquele ID perde o
   lugar (ele pode continuar existindo em outro ID, se esse outro ID não
   colidir com nada do 74 — ver exemplo do "blue robe" abaixo). Isso é uma
   escolha consciente: referências a esses IDs em scripts Lua, loot de
   monstros ou no mapa `.otbm` podem passar a apontar para o item errado.
   Não há verificação cruzada com esses outros sistemas.
6. **Divide ranges (`fromid`/`toid`) que colidem parcialmente** com IDs do
   74. Um range do atual como `fromid="108" toid="109" name="flowers"` é
   quebrado em torno dos IDs que o 74 ocupa, preservando como range (ou
   item individual, se sobrar só 1 ID) os pedaços não ocupados. Ranges no
   arquivo atual nunca têm `<attribute>` filho (confirmado no dataset),
   então a fragmentação nunca perde atributos aninhados.
7. **Insere os itens do 74 que caem em slot totalmente livre** (nem ID
   individual nem range ocupam aquele Server ID no atual) na posição que
   mantém a ordem local do arquivo.
8. **Reconstrói (nunca copia texto cru) qualquer item tocado** — mesmo no
   caso "sem match", o item do 74 é reconstruído nó a nó no estilo do
   arquivo de destino (aspas duplas, indentação com tab, `... />` com
   espaço antes do fechamento self-closing), nunca colando o bloco XML cru
   do arquivo 74 (que usa outro encoding e outro estilo de fechamento).

## Exemplo real (blue robe)

No 7.4, ID 2656 é "blue robe" com só `armor`/`weight`/`slottype`. No
servidor atual, existia um "blue robe" diferente no ID 3567, com
`imbuementslot` (7 atributos de elemental protection/life leech), `script`
(moveevent), `classification` e `primarytype`. Depois da migração:

- ID 2656 (o Server ID do 74) passa a ser o "blue robe", com `armor`/
  `weight`/`slottype` do 74 **mais** `imbuementslot`/`script`/
  `classification`/`primarytype` herdados do antigo item 3567 (match único
  por nome).
- ID 3567 passa a ser o que quer que o 74 definisse para esse Server ID
  (nesse caso, um item de fluido/água — o "blue robe" antigo não existe
  mais nesse ID, porque o 74 reivindicou esse número para outra coisa).
- O item de arma que antes ocupava o ID 2656 no arquivo atual foi
  descartado (sobrescrito), conforme a política do item 5.

## Validação

- **XML bem formado**: o resultado é reparseado com o mesmo parser antes
  de escrever, para garantir ausência de tag malformada.
- **Todo Server ID migrado existe no `items.otb`**: reusa a leitura de OTB
  (`read-otb-ids.js`, baseado no mesmo formato binário de
  `tools/otb-gen/generate-items-otb.js`) para confirmar que nenhum ID usado
  pela migração seria descartado silenciosamente pelo parser C++ do
  servidor (`Items::parseItemNode`, em `server/src/items.cpp`, ignora sem
  aviso qualquer ID do XML que não exista no `.otb` já carregado). Só
  verifica os IDs que a migração de fato tocou — itens do arquivo atual
  fora da faixa do 74 (ex: IDs acima de 5089) estão fora de escopo.
- **Round-trip do parser**: `self-test.js` confirma que reparsear e
  reserializar um `items.xml` sem nenhuma mudança produz saída byte-
  idêntica — é a garantia de que nós não tocados nunca são reformatados.
- **Backup obrigatório**: `items.xml` é copiado para um `.bak` com
  timestamp antes de qualquer escrita.
- **Relatório**: cada execução grava um JSON em `reports/` com os
  contadores (`overwritten`, `merged`, `ambiguousSkipped`, `insertedFree`,
  `rangesSplit`, `preservedUnrelated`) e a lista completa de matches
  ambíguos (nome, ID no 74, IDs candidatos no atual) para auditoria manual.

## Limitações conhecidas

- O match por nome é exato (após trim+lowercase), sem normalização de
  plural, sinônimos ou variação ortográfica — por desenho: os dados mostram
  que a ambiguidade real vem de nomes genuinamente duplicados (múltiplos
  itens "water"/"grass"/"crate"), não de variação de texto.
- Matches ambíguos nunca são resolvidos automaticamente — sempre viram
  "sem match". Se algum item específico precisar do merge mesmo estando
  ambíguo, hoje isso exige edição manual do `items.xml` depois de rodar a
  migração (não há mecanismo de override).
- Não verifica se os IDs sobrescritos são referenciados em scripts Lua,
  monstros (loot) ou no mapa `.otbm` — sobrescrever é uma decisão aceita
  conscientemente, o risco de referência quebrada em outros sistemas fica
  por conta de auditoria separada.
- Não roda duas vezes de forma idempotente sobre o próprio resultado: rodar
  o script de novo depois de já ter migrado usa o `items.xml` já migrado
  como "atual", o que pode alterar quais itens contam como "match" (porque
  os IDs já mudaram). Sempre partir de um `items.xml` não migrado (ou
  restaurar o `.bak`) antes de rodar de novo.
