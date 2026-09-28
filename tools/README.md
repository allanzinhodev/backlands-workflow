# tools

Scripts auxiliares para o projeto de downgrade do client Tibia 7.4 rodando
sobre uma base de servidor moderna (8.60). Cada subpasta é uma ferramenta
independente, com seu próprio README.

## Índice

- [otb-gen](otb-gen/README.md) — gera `items.otb` a partir do `Tibia.dat`/`Tibia.spr` do client.
- [items-migrate](items-migrate/README.md) — migra Server IDs e atributos do `items.xml` do datapack 7.4 para o `items.xml` do servidor atual.
- [monsters-migrate](monsters-migrate/README.md) — migra monstros do datapack 7.4 (XML) para os scripts de monstro (`.lua`) do servidor atual.
