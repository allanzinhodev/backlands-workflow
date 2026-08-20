---
name: backlands-add-asset
description: Procedimentos para injetar sprites e criar novos itens automatizadamente no workspace Backlands MMO. Use sempre que o usuário pedir para adicionar um novo asset (imagem, sprite, item) usando o fluxo de linha de comando, dispensando o Object Builder manual.
---

# Fluxo de Automação de Assets (add_asset)

Esta skill descreve como usar a ferramenta `tools/add_asset.js` para automatizar o pipeline visual e lógico de novos itens no Backlands.

## 1. O que a ferramenta faz
Em vez de seguir o fluxo manual do `AGENTS.md` (abrir Object Builder -> salvar .dat/.spr -> abrir ItemEditor -> salvar .otb -> editar items.xml), a ferramenta automatiza:
1. Parsing do `client/data/things/860/Tibia.spr` para injetar a nova textura.
2. Parsing do `Tibia.dat` para registrar o ThingType.
3. Atualização do `server/data/items/items.otb`.
4. Atualização do `server/data/items/items.xml`.
5. Aciona o `tools/sync_mapeditor.ps1` para refletir as mudanças no Map Editor.

## 2. Como usar

```bash
node tools/add_asset.js <caminho_da_imagem_ou_pasta> [--name="Nome do Item"] [--isGround=true/false]
```

Exemplos:
```bash
# Adicionar uma única imagem como item não-ground
node tools/add_asset.js "D:\sprites\minha_espada.png" "--name=Minha Espada" "--isGround=false"

# Adicionar uma pasta de imagens (ex: 16 tiles de um piso)
node tools/add_asset.js "D:\sprites\inicio" "--name=Temple floor" "--isGround=true"
```

A ferramenta lerá os PNGs (devem ser 32x32), adicionará ao `Tibia.spr`, criará as propriedades no `Tibia.dat`, registrará os Server IDs no `items.otb`, e adicionará as tags no final do `items.xml`.

*(Nota: O parser binário do otlib para Node.js está em construção. Esta ferramenta é totalmente funcional para assets 32x32 simples e contorna o uso manual do Object Builder).*

## 3. Checklist de Segurança
- Sempre trabalhe com cópias dos arquivos `.dat`, `.spr` e `.otb` durante o parsing antes de sobrescrever.
- Verifique a assinatura do arquivo 8.60 (v1 ou v2) confrome descrito na skill `backlands`.
- Após adicionar, certifique-se de invocar `tools/sync_mapeditor.ps1` para que o Map Editor fique em sincronia e o mapa não seja corrompido.
