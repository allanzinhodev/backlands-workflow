---
trigger: always_on
description: Regras do workspace Backlands — mapa de repositórios, roteamento de vocabulário e segurança de git.
---

# Workspace Backlands

Resumo do que não pode ser esquecido:

1. `d:\backlands` é um agregador. As cinco subpastas — `client/`, `server/`, `mapeditor/`,
   `objectbuilder/`, `devfolio/` — são **repositórios git independentes**, cada uma com seu
   próprio `origin`.
2. Resolva o repositório a partir do vocabulário do usuário usando a tabela de roteamento de
   `AGENTS.md`, e **declare em qual repositório você está atuando** antes de editar.
