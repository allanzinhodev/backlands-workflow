# TODO — Backlands

Fila de trabalho do workspace. Organizado por **feature**, e dentro de cada uma: o que falta
construir e os **testes** que validam a entrega.

Escopo desta lista: o que atravessa repositórios ou ainda não foi validado. Bug pontual dentro de um
repositório vive na issue dele.

---

## Feature 1 — Proficiência de Equipamentos + Árvore de Habilidades

**Onde:** `server/` · commit `59779b37` ("Weapon and Skilltree system"), merge `4a4ed432` (PR #1,
branch `weaponSystem`, 13/08/2026) · 26 arquivos, +1523/−434.

**Estado:** código escrito, **nunca compilado e nunca executado**. O handoff
`server/docs/HANDOFF-proficiencia-arvore.md` documenta o design em detalhe e é a referência — mas
está desatualizado em um ponto (ver F1.0).

### Bloqueadores encontrados na revisão

Três problemas que impedem o exemplo embutido de funcionar. Precisam ser resolvidos **antes** de
qualquer teste funcional — sem isso os testes falham por motivo errado e mascaram o resto.

- [ ] **F1.1 — Spells referenciadas por `words`, não por `name`.** Os dois arquivos de configuração
      novos apontam para spells que **não existem com esse nome**:

      | Referência usada | Onde | Nome real da spell |
      |---|---|---|
      | `"Exori Flam"` | `equipment_spells.lua:40`, `skilltree_nodes.lua:37` | **`"Flame Strike"`** (`spells/attack/both/flame_strike.lua:20`, words `exori flam`) |
      | `"Exevo Flam Hur"` | `equipment_spells.lua:48`, `skilltree_nodes.lua:46,48` | **`"Fire Wave"`** (`spells/attack/sorcerer/fire_wave.lua:20`, words `exevo flam hur`) |

      O cabeçalho do próprio `equipment_spells.lua` (linhas 10-12) manda usar o **nome**. Consequências:
      `teaches` chama `learnSpell` num nome inexistente, e como todo o pipeline de modificadores é
      chaveado por nome de spell, **nenhum modificador casa** — falham em silêncio, sem erro.

- [ ] **F1.2 — As duas spells têm `needLearn(false)`.** `flame_strike.lua:30` e `fire_wave.lua:26`.
      O cabeçalho do `equipment_spells.lua` (linhas 21-24) exige `needLearn(true)` em toda spell
      referenciada. Sem isso o portão nunca engata: a spell já é castável por vocação, e a distinção
      emprestada/aprendida perde sentido.
      **Cuidado:** o handoff (risco 3) avisa que marcar `needLearn(true)` numa spell hoje disponível
      é **destrutivo** — tira ela de quem já usa até ser aprendida. Decidir entre criar spells novas
      ou aceitar a quebra.

- [ ] **F1.3 — Conflito de vocação no exemplo da Fire Sword.** `equipment_spells.lua:38` dá
      `"Exori Flam"` ao **Knight**, mas `flame_strike.lua:31` declara
      `vocation("sorcerer", "master sorcerer", "druid", "elder druid")`. O commit tornou a vocação
      **sempre obrigatória** (conhecimento virou filtro adicional, não substituto), então Knight será
      recusado mesmo com o nome corrigido. A entrada Sorcerer→Fire Wave é coerente; a do Knight não.

- [ ] **F1.0 — Corrigir o handoff.** `HANDOFF-proficiencia-arvore.md` descreve a Fase 3 como
      implementada no corpo (linhas 80-107) mas a lista como `(pendente)` (linha 118) e repete em
      "Próximo passo" (linha 202). Os arquivos **existem** no commit (`skilltree.lua` 427 linhas,
      `skilltree_nodes.lua` 67). Atualizar para não induzir a retrabalho.

### Conteúdo a construir

- [ ] **F1.4** — Popular `equipment_spells.lua`. Hoje tem **1 item** (Fire Sword 2392, 2 vocações).
- [ ] **F1.5** — Expandir `skilltree_nodes.lua`. Hoje são **5 nós** de exemplo em 2 ramos
      (`fire_affinity`, `flame_strike`, `conflagration`, `toughness`, `shield_training`).
      Alinhar com as classes do GDD — Guardião, Caçador, Arcanista e as trilhas do Arcanista.
- [ ] **F1.6** — Recalibrar `EXPERIENCE_TABLES` em `proficiency.lua`. Foi calibrada para **uma** arma;
      agora até **8 peças** ganham XP em paralelo (handoff, risco 1).
- [ ] **F1.7** — UI de cliente. Nem a wheel nem a proficiência trazem `.otui`/módulo OTC. Toca
      `client/` — ver F1.T9 antes de começar.

### Testes

Roteiro derivado do handoff (seção "O que precisa ser testado"), com os bloqueadores acima
incorporados. Executar **em ordem** — cada bloco depende do anterior.

**Pré-condições**
- [ ] **F1.T0 — Compilar.** Nunca foi compilado. O projeto deve continuar compilando com clang
      (commit `6e75ab13` e CI `build-clang.yml`). Pontos de maior risco:
      assinatura nova de `Player::addProficiencySpellAugment(std::string, Augment_t, double)` e seu
      binding em `luaplayer.cpp`; o rename `ProficiencySpellAugmentBonus` → `SpellModifiers`
      (15 ocorrências em `player.{h,cpp}` e `spells.cpp`); `Spell::hasKnowledgeOfSpell` declarado em
      `spells.h` e definido em `spells.cpp`.
- [ ] **F1.T1 — Config.** Copiar `config.lua.dist` → `config.lua` e ligar
      `weaponProficiencySystemEnabled = true` e `skillTreeSystemEnabled = true`
      (linhas 163-164, ambos `false` por padrão). Confirmar no banner de boot:
      `>> Systems: ... | Proficiency [ON] | Skill Tree [ON]`.
- [ ] **F1.T2 — `luacheck` e XML.** O CI valida Lua (`lua-check.yml`) e XML (`xml-syntax.yml`).
      Rodar local antes de subir — os arquivos novos ainda não passaram por eles.

**Marcador de maior level** (Fase 0)
- [ ] **F1.T3** — Subir de level → `highestLevel` acompanha.
- [ ] **F1.T4** — Morrer perdendo level → marcador **não cai**.
- [ ] **F1.T5** — Relogar → o backfill do `onLogin` não corrompe o valor guardado.
- [ ] **F1.T6** — Resetar personagem → marcador zerado (a limpeza roda **antes** da queda de level,
      senão o backfill o reconstrói).

**Proficiência multi-slot** (Fase 1 — depende de F1.1/F1.2/F1.3 resolvidos)
- [ ] **F1.T7** — Equipar duas peças com definição (ex.: arma + elmo) → as **duas** spells castáveis.
- [ ] **F1.T8** — `/proficiency` sem argumento → XP subindo nas **duas** peças em paralelo.
- [ ] **F1.T9** — Desequipar uma peça → só a spell dela recusada, com `YOUNEEDTOLEARNTHISSPELL`.
- [ ] **F1.T10** — Cruzar o `masterLevel` → mensagem de maestria; desequipar → **spell continua
      castável**.
- [ ] **F1.T11** — Relogar e conferir persistência:
      `SELECT * FROM player_spells WHERE player_id = <guid>`.
- [ ] **F1.T12** — Mesmo item em vocação diferente → ensina a **outra** spell; a vocação errada não vê.
- [ ] **F1.T13** — Elite Knight recebe o mesmo que Knight (resolução para vocação **base**).

**Regressão de vocação** (crítico — o portão de cast mudou em `spells.cpp`)
- [ ] **F1.T14** — Spell comum de Sorcerer segue **recusada** para Knight.
- [ ] **F1.T15** — As ~600 spells de monstro com `needLearn(true)` e sem vocação seguem
      **inacessíveis** a jogadores.
- [ ] **F1.T16** — Spells normais de cada vocação seguem funcionando (amostra por vocação).
- [ ] **F1.T17** — A lista do cliente (pacote `0x9F`) e o portão do servidor **concordam** — não pode
      aparecer na UI spell que não casta. É o motivo de `canCast` e `playerSpellCheck` compartilharem
      `hasKnowledgeOfSpell`.

**Modificadores** (Fase 2)
- [ ] **F1.T18** — Com `{ type = SpellModifier.BaseDamage, perLevel = 2 }`, o dano escala com o nível
      de proficiência da peça.
- [ ] **F1.T19** — Desequipar → bônus some, mas spell masterizada continua castável.
- [ ] **F1.T20** — Proficiência funciona com `augmentSystemEnabled = false` (linha 165) — foi
      desacoplada e tem gate próprio nos 4 pontos de `spells.cpp`.

**Árvore de habilidades** (Fase 3 — testável sem cliente, via `/skilltree`)
- [ ] **F1.T21** — `/skilltree` → orçamento coerente com `getHighestLevel()`
      (`(highest - 8) * 1`, teto `MAX_TOTAL_POINTS = 1000`).
- [ ] **F1.T22** — `/skilltree fire_affinity, 3` → aceita, custo total **7** (1+2+4).
- [ ] **F1.T23** — `/skilltree flame_strike, 1` **sem** `fire_affinity` nível 2 → recusa
      ("Missing skill requirement.").
- [ ] **F1.T24** — Alocar acima do orçamento → recusa ("Not enough skill points.").
- [ ] **F1.T25** — `/skilltree conflagration, 1` → aprende a spell de `teaches` permanentemente.
- [ ] **F1.T26** — `/skilltree conflagration, 0` → **desaprende**; se o equipamento também a tiver
      masterizado, ela volta logo em seguida (o refresh de proficiência roda depois do forget).
- [ ] **F1.T27** — `/skilltree reset` → limpa tudo e remove a condição de atributos.
- [ ] **F1.T28** — Relogar → bônus reaplicados **e** alocação que excede o orçamento é
      **descartada**. É o bug da wheel que foi deliberadamente não herdado — testar explicitamente.
- [ ] **F1.T29** — Wheel (subid `86061`) e árvore (subid `86062`) **não se apagam mutuamente**.
- [ ] **F1.T30** — Resetar personagem → marcador, pontos e distribuição zerados.

**Protocolo**
- [ ] **F1.T31** — Pacote de entrada `0xBC` e saída `0xC1` funcionam. Confirmar que `0xC1` está em
      `isOtcOnlyLuaOpcode` — `0xC0` **não** estava livre (é quick-loot da Astra em
      `luanetworkmessage.cpp`).
- [ ] **F1.T32** — Confirmar qual cliente o Backlands usa: `sendBasicData` só roda para
      `isAstraClient` (`protocolgame.cpp:3102`). Fora disso a lista de spells do cliente não atualiza
      — o portão do servidor continua valendo, mas a UI não reflete.

---

## Feature 2 — Ferramenta de sprites (alteração / exclusão rápida)

**Onde:** `tools/` (workspace) · estudo em `objectbuilder/src/otlib/` · alvo: assets de
`client/data/things/860/`.

**Objetivo:** editar e **remover sprites por script**, sem abrir a GUI do Object Builder. O primeiro
caso de uso é **remover sprites que ficaram órfãs** depois da limpeza de itens pré-7.7 —
commits `dfcf7862` ("Remocao de drops pre 77 equipaveis") e `54b9c642` ("Remocao de equipamentos
pre 77 npcs e mapa") em `server/`.

### Estudo do Object Builder (fazer antes de escrever código)

O `otlib` já resolve o problema — `SpritesOptimizer.as` faz exatamente "achar e remover sprite não
usada". Portar, não reinventar.

- [ ] **F2.1 — Ler `otlib/utils/SpritesOptimizer.as`** (257 linhas). Algoritmo, na ordem real do
      `start()`:
      1. Hash de todas as sprites (`Sprite.getHash()`) → `m_hashes`, achando **duplicatas**
      2. `setNewIDsAfterHashing()` — reescreve `frameGroup.spriteIndex` de todo objeto para o id canônico
      3. `scanList()` — varre os `spriteIndex` de **todos** os `ThingType` e marca o que é usado
      4. Compacta: ids sequenciais novos só para as usadas; `setNewIDs()` reescreve as referências
      5. `removedCount` / `oldCount` / `newCount` como resultado
- [ ] **F2.2 — Ler `otlib/sprites/SpriteStorage.as`** (815 linhas) — leitura/escrita do `.spr`,
      incluindo a compressão RLE de transparência.
- [ ] **F2.3 — Ler `otlib/things/ThingTypeStorage.as`** (1013) e `ThingSerializer.as` (1593) — como
      o `.dat` é carregado, indexado e salvo.
- [ ] **F2.4 — Ler `otlib/things/MetadataReader5.as` / `MetadataWriter5.as`** — é a faixa do
      protocolo **8.60** (`<= 986` → reader/writer 5, ver `core/MetadataControllerStorage.as:111-122`).
- [ ] **F2.5 — Confirmar a variante do 8.60.** `objectbuilder/src/config/versions.xml:30-31` tem
      **duas**: `v1` (dat `4C28B721`, otb `19`) e `v2` (dat `4C2C7993`, otb `20`), mesmo `.spr`.
      Ler a assinatura de `client/data/things/860/Tibia.dat` e registrar qual é.

### Construção

- [ ] **F2.6 — Extrair a lista de itens removidos.** Diff dos commits `dfcf7862` e `54b9c642` →
      conjunto de **ServerIDs** que saíram de drops e shops. Atenção: sair de loot/shop **não**
      significa que o item deixou de existir — o item pode continuar em `items.xml` e no mapa. A lista
      precisa ser de itens realmente aposentados, não apenas não-dropados.
- [ ] **F2.7 — Traduzir ServerID → ClientID** via `items.otb`. Referência:
      `otlib/items/OtbReader.as`. Sem essa ponte não dá para saber qual sprite pertence a qual item.
- [ ] **F2.8 — Parser `.dat` (leitura) para 8.60**, com **round-trip byte-idêntico** como critério de
      aceite.
- [ ] **F2.9 — Parser `.spr` (leitura)**, mesmo critério.
- [ ] **F2.10 — Escrita** dos dois formatos.
- [ ] **F2.11 — Comando "sprites órfãs"** — recebe a lista de itens removidos, reporta as sprites que
      ficariam sem referência. **Só relatório na primeira versão**, sem escrita.
- [ ] **F2.12 — Comando de remoção**, com reindexação (o passo 4 do `SpritesOptimizer`).

> ⚠️ **O risco central desta feature.** Remover um ClientID do `.dat` **desloca todos os ClientIDs
> seguintes**, e isso invalida o mapeamento de `items.otb` — em `server/data/items/` **e** em
> `mapeditor/data/860/`. Um mapa salvo com o `.otb` antigo passa a apontar para outro item.
> Decidir explicitamente entre: (a) só remover sprite mantendo o slot do ThingType, (b) reindexar e
> regravar os dois `.otb` no mesmo passo. Ver `otlib/items/OtbSync.as`.

### Testes

- [ ] **F2.T1 — Round-trip `.dat`:** ler e reescrever sem alterar → **bytes idênticos** ao original.
      Sem isso, nenhuma edição é confiável.
- [ ] **F2.T2 — Round-trip `.spr`:** idem, incluindo sprites transparentes e vazias.
- [ ] **F2.T3 — Assinatura:** o parser recusa arquivo cuja assinatura não bate com a variante
      esperada, em vez de interpretar errado.
- [ ] **F2.T4 — Contagem:** total de objetos e sprites lidos bate com o que o Object Builder mostra
      ao abrir os mesmos arquivos. É o oráculo independente.
- [ ] **F2.T5 — Detecção de órfãs sem falso positivo:** rodar com lista **vazia** de itens removidos →
      só pode acusar as sprites já órfãs hoje. Comparar com o `removedCount` do otimizador do OB nos
      mesmos arquivos.
- [ ] **F2.T6 — Não escreve por engano:** o comando de relatório (F2.11) não altera nenhum byte —
      conferir mtime e hash dos arquivos depois de rodar.
- [ ] **F2.T7 — Após remoção:** cliente sobe, e os itens que **permaneceram** renderizam com a sprite
      certa (o teste que pega erro de reindexação).
- [ ] **F2.T8 — Consistência cruzada:** `items.otb` do servidor e o de `mapeditor/data/860/` continuam
      idênticos entre si e coerentes com o `.dat` novo.
- [ ] **F2.T9 — Mapa:** abrir `server/data/world/world.otbm` no editor depois da mudança → nenhum item
      trocado ou perdido.

---

## Convenções

- Ferramenta que atravessa repositórios vai em `tools/`, nunca dentro de um repositório de
  ferramenta. Convenções em [`tools/README.md`](tools/README.md).
- Antes de escrever parser, ler a referência em `otlib` — o layout binário muda por versão de
  cliente. Mapa completo na skill `backlands`, seções 2 e 6.
- Toda ferramenta que mexe em `.dat`/`.spr`/`.otb` trabalha **em cópia**.
- Mudança que atravessa repositórios = **um commit por repositório**.
