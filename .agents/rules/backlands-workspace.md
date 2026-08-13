---
trigger: always_on
description: Regras do workspace Backlands — mapa de repositórios, roteamento de vocabulário e segurança de git.
---

# Workspace Backlands

As regras completas deste workspace estão em `AGENTS.md`, na raiz (`d:\backlands`). **Leia esse
arquivo antes de agir.** Ele é a fonte única compartilhada entre Antigravity e Claude Code.

Resumo do que não pode ser esquecido:

1. `d:\backlands` é um agregador. As cinco subpastas — `client/`, `server/`, `mapeditor/`,
   `objectbuilder/`, `devfolio/` — são **repositórios git independentes**, cada uma com seu
   próprio `origin`.
2. Resolva o repositório a partir do vocabulário do usuário usando a tabela de roteamento de
   `AGENTS.md`, e **declare em qual repositório você está atuando** antes de editar.
3. Não faça commit nem push sem pedido explícito. Uma mudança entre repositórios = um commit por
   repositório.
4. Respeite os invariantes entre repositórios (ServerID × ClientID, `items.otb` duplicado,
   protocolo 8.60) descritos em `AGENTS.md`.
5. Procedimentos longos (builds, layout interno, checklists) estão em
   `.claude/skills/backlands/SKILL.md` — é markdown comum e vale a leitura mesmo fora do Claude Code.
