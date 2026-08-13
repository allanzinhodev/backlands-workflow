# Backlands — Workspace

As regras deste workspace são compartilhadas com outros agentes (Antigravity, etc.) e vivem em
`AGENTS.md`. Leia-o como se fosse este arquivo.

@AGENTS.md

## Específico do Claude Code

- Procedimentos detalhados (builds, layout de cada repo, checklists entre repositórios) estão na
  skill `backlands` — invoque com `/backlands` ou carregue-a quando a tarefa envolver mais de um
  repositório.
- O `.gitignore` da raiz esconde as cinco subpastas. Ferramentas de busca (Glob/Grep) **ainda
  enxergam** esses diretórios, então buscar a partir de `d:\backlands` varre ~1,4 GB. Prefira
  passar `path` apontando para o repositório certo.
