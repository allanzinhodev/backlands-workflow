# monsters-migrate

Migra monstros do datapack de referência Tibia 7.4 (`74/monster/monsters/
*.xml`) para os scripts de monstro do servidor atual
(`server/data/monsters/**/*.lua`), usando o 7.4 como fonte da verdade para
os dados centrais (health, experience, speed, flags básicas, imunidades)
enquanto preserva o que só existe no servidor moderno (Bestiary, attacks,
strategiesTarget, elements/defenses já definidos, flags extras).

## Por que existe

O servidor atual **não usa XML para monstros — usa Lua**: cada monstro é
um arquivo `.lua` que se autorregistra chamando `Game.createMonsterType(
"Nome")` + `mType:register(monster)`. Não há um formato comum com o 7.4,
então a migração não é reescrever XML em XML (como em `items-migrate`) —
é **gerar/editar código Lua** a partir do XML do 7.4, seguindo a tabela
`monster = {...}` que `data/scripts/lib/register_monster_type.lua` e os
bindings em `src/luamonstertype.cpp` esperam.

## Uso

```
node migrate-monsters.js [--dry-run]
```

- `--dry-run`: parseia, casa por nome, calcula o plano completo (merges/
  criações/deleções) e escreve o relatório, mas **não toca em nenhum
  arquivo**. Sempre rode isso primeiro depois de qualquer mudança no
  script ou nos dados de origem.
- Sem flag: faz backup de toda a pasta `server/data/monsters/` (cópia
  completa com timestamp, ex: `monsters.2026-09-28T19-58-15Z.bak`, ao lado
  dela) e então aplica merges, cria os monstros novos em
  `server/data/monsters/classic74/`, e deleta todo `.lua` sem
  correspondente no 74.

Outros scripts desta pasta (módulos internos, não standalone):
`xml-74.js` (parser XML do 7.4), `translate-74.js` (XML 7.4 → forma JS
intermediária, com as tabelas de `mapping.js`), `lua-write.js`
(serializador de tabelas Lua), `lua-extract.js` (extração estrutural por
regex balanceado sobre os `.lua` do servidor atual), `generate-new.js`
(gera um `.lua` do zero), `merge.js` (edita um `.lua` existente por
splice de texto, tocando só os campos que a regra manda mudar).
`validate-output.js` roda uma checagem pós-migração standalone (chaves/
parênteses balanceados, `raceId` únicos, presença de
`createMonsterType`/`register`) — útil pra reauditar depois de qualquer
edição manual subsequente.

### IDs de item: `remap-item-ids.js`

`corpse` e o `loot` vêm do XML do 7.4, que fala os **Server IDs do 7.4**;
o servidor indexa itens por **Client ID** (ver `tools/items-migrate/
README.md`, "Por que Client ID"). Depois da migração, rode:

```
node remap-item-ids.js [--dry-run] [reference.otb]
```

Ele troca `monster.corpse` e todo `id = N` dentro do bloco `monster.loot`
de cada `.lua` em `server/data/monsters/`, pelos pares de
`74/items/items.otb` (default). Nada fora desses dois campos é tocado.
Execução atual: 157 arquivos, 1639 IDs remapeados, nenhum sem Client ID
(ex.: rat — gold coin 2148 → 3031, cheese 2696 → 3607, corpse 2813 →
3994 "dead rat"). Todo `.lua` restante veio do 7.4 (relatório: 146 merges,
11 criados, 0 ambíguos), então o script roda sobre a pasta inteira; **não
rode duas vezes** — um ID já em Client ID seria remapeado de novo.

## O que o script faz

1. **Casa cada monstro do 74 com um monstro do atual por nome**
   (case-insensitive), com uma tabela de sinônimos para nomes que mudaram
   entre versões (`beholder`→`bonelord`, `elder beholder`→
   `elder bonelord`) e uma lista de exclusão forçada para arquivos do 74
   cujo `name=` interno é enganoso e colidiria com o monstro errado:
   - As 4 variantes de cor de `Butterfly` (`blue/purple/red/yellow
     butterfly.xml`) todas têm `name="Butterfly"` internamente — a cor só
     está no nome do arquivo. Isso colide ambiguamente com 4 candidatos
     diferentes no atual; tratadas como monstros novos em vez de
     adivinhar qual candidato é qual.
   - Seis arquivos (`ferumbras.xml`, `morgaroth.xml`, `orshabaal.xml`,
     `rahemos.xml`, `infernatil.xml`, `illusion.xml`) usam
     `name="Demon"` — mecânica real do 7.4 onde esses bosses aparecem
     visualmente disfarçados de Demon até serem provocados. Seus stats
     (health 50 a 110000) não têm nada a ver com o Demon real (health
     8200); casá-los por nome sobrescreveria `demon.lua` várias vezes.
     Tratados como monstros novos com nome de exibição derivado do nome
     do arquivo.
   - Quando o nome do 74 casa com **múltiplos** arquivos do atual e não
     dá pra desambiguar automaticamente (ver abaixo), o monstro é
     reportado como ambíguo e **não migrado** — fica pra revisão manual.
2. **Desambiguação automática quando o nome casa com vários arquivos do
   atual**: prefere o único candidato que já tem `raceId` definido (a
   maioria das duplicatas de nome no servidor atual são variantes de
   quest/raid/nostalgia sem `raceId`, versus o monstro "canônico" que
   tem). Se ainda sobrar mais de um candidato com `raceId`, fica ambíguo.
3. **Merge** (monstro existe nos dois lados, match único) — edição
   cirúrgica por splice de texto, nunca reescreve o arquivo inteiro:
   - `health`, `maxHealth`, `experience`, `speed`, `manaCost`, `corpse`,
     `race`, `outfit`: **74 vence**, substitui o valor do atual.
   - `flags`: **74 vence nas keys que define** (`summonable`,
     `illusionable`, `pushable`, `convinceable`, `canPushItems`,
     `canPushCreatures`, `targetDistance`, `runHealth`); qualquer flag que
     só existe no atual (`attackable`, `hostile`, `staticAttackChance`,
     `boss`, `challengeable`, `rewardBoss`, `canWalkOnEnergy/Fire/Poison`,
     etc.) **permanece intocada**.
   - `elements` (resistências): o atual **prevalece por tipo de combate**
     — se já existe uma entrada pra `COMBAT_FIREDAMAGE`, por exemplo, ela
     não é tocada. O 74 só **adiciona** entradas para tipos de combate que
     o atual não tem nenhuma (convertendo `<immunity X="0|1"/>` do 7.4 em
     `percent=100` ou `percent=0`).
   - `immunities` (condition-type: paralyze/invisible/outfit): mesma
     regra — atual prevalece por tipo, 74 só adiciona os que faltam.
   - `defenses`: `defense`/`armor`/`mitigation` do atual **nunca são
     tocados**. Defense spells (`{name="healing", ...}`) do 74 só são
     adicionados se o atual não tiver nenhuma entrada pro mesmo
     `COMBAT_TYPE` já.
   - `attacks`, `strategiesTarget`, `Bestiary`: **nunca tocados**, mesmo
     que o 74 tivesse dados. Ficam exatamente como o servidor atual já
     define.
   - `loot`, `voices`, `summon`: **74 sempre substitui inteiramente**
     (não é merge por entrada — a lista toda do atual é descartada e
     trocada pela tradução do 74).
4. **Criação** (monstro só existe no 74): gera um `.lua` novo do zero em
   `server/data/monsters/classic74/`, com `raceId` novo sequencial
   (começando depois do maior `raceId` em uso, ignorando a faixa
   reservada 9000+ usada por dummies de teste) e sem bloco `Bestiary`
   (não há dados de charm/unlock pra herdar).
5. **Deleção** (monstro do atual sem correspondente no 74, nem por nome
   nem por sinônimo): removido, **incluindo bosses, quests, raids e
   conteúdo de eventos/temporadas modernos** — decisão explícita do
   projeto: o servidor final só tem os monstros do 7.4. Diretórios que
   ficam vazios depois das deleções são removidos.

## Conversões numéricas relevantes

- `delay=` em `<attack>`/`<defense>`/`<summon>` do 7.4 é em **segundos**
  (convenção OTServ clássica); o campo `interval`/`interval` equivalente
  no formato atual é em **milissegundos** — multiplicado por 1000 na
  tradução.
- `chance=` de loot é base 100000 nos dois formatos (sem conversão).
- Efeitos visuais (`shooteffect`/`areaeffect` do 7.4 → `CONST_ANI_*`/
  `CONST_ME_*` do atual) são mapeados em `mapping.js`, verificados contra
  `server/src/const.h`; valores sem correspondência exata caem num
  fallback neutro (`CONST_ME_POFF`) — são puramente cosméticos, não
  afetam a mecânica de combate.

## Por que confiar no resultado

- O parser do 7.4 processa os 157 arquivos sem erro; cada `<immunity
  X="0|1"/>` é um elemento separado no XML (não um único elemento com 8
  atributos) — bug real encontrado e corrigido durante o desenvolvimento
  desta ferramenta (a primeira versão só lia a primeira immunity de cada
  monstro, perdendo 7 de 8 entradas).
- Merge testado manualmente contra casos reais (Beholder→Bonelord,
  Dragon Lord, Demon) conferindo campo por campo que a regra de
  precedência foi aplicada corretamente.
- Pós-migração: `validate-output.js` confirma chaves/parênteses
  balanceados e `raceId` únicos em todos os 157 arquivos finais; a
  contagem bate exatamente (146 merges + 11 criações = 157, igual ao
  total de monstros do 7.4; 146 + 1663 deletados = 1809, o total original
  do servidor atual).
- Backup completo da pasta `server/data/monsters/` antes de qualquer
  escrita/deleção.

## Limitações conhecidas

- Match por nome exato (normalizado), sem heurística de similaridade —
  qualquer sinônimo além de `beholder`/`elder beholder` precisa ser
  adicionado manualmente em `SYNONYMS` (`migrate-monsters.js`).
- Attacks do tipo `firefield`/`energyfield`/`poisonfield`/`*condition`
  (armadilhas de campo, condições de status) do 7.4 não são traduzidos ao
  **criar um monstro novo** — só os tipos de dano direto
  (melee/physical/fire/energy/poison/manadrain/lifedrain) são mapeados.
  Isso nunca ocorreu nos 11 monstros criados nesta migração (nenhum usava
  esses tipos), mas um novo dado de origem poderia precisar de extensão
  em `translate-74.js`/`mapping.js`.
- Não roda de forma idempotente sobre o próprio resultado: rodar de novo
  depois de já ter migrado trata o resultado como "atual", mudando o que
  conta como match. Sempre partir de um `server/data/monsters/` não
  migrado (ou restaurar o `.bak`) antes de rodar de novo.
- Extração de campos do lado atual é por regex balanceado (não um parser
  Lua completo) — funciona porque os arquivos são gerados por um conjunto
  pequeno e consistente de ferramentas; um `.lua` escrito à mão fora desse
  padrão pode não ser reconhecido corretamente.
