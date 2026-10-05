# Desenvolvimento do site Backlands

Este site faz parte do repositório `backlands-workflow`. O aplicativo React está em `frontend/`.

- Toda alteração de interface deve incluir português e inglês no mesmo trabalho. Centralize texto visível, rótulos de acessibilidade e metadados em `frontend/src/i18n/catalog.ts`; mantenha ambos os idiomas compatíveis com `Copy`.
- Preserve o seletor PT/EN no topo em todas as larguras. A escolha manual tem prioridade sobre detecção automática e deve permanecer salva quando o navegador permitir.
- Antes de alterar layouts, leia a skill [responsive-design](.skills/responsive-design/SKILL.md), solicitada para este projeto. Exemplos estão em [references/details.md](.skills/responsive-design/references/details.md).
- Use React, TypeScript e Tailwind. Comece pela menor largura, use tipografia fluida e queries de container quando o componente precisar se adaptar ao espaço disponível.
- Preserve fundo preto, títulos Cinzel com efeito dourado, subtítulos claros, texto corrido `#ccc` e navegação laranja. A fonte pode ser substituída quando o usuário informar outra família.
- Componentes interativos precisam funcionar com teclado, foco visível e alvos de toque de pelo menos 44 × 44 px. Respeite `prefers-reduced-motion`.
- A seção de mundo e o FAQ permanecem sem conteúdo até que ele seja fornecido. Não invente mecânicas ou informações de lançamento.
- Configure links de download e cadastro por variáveis públicas `VITE_*`; nenhum segredo deve entrar no frontend. Sem destinos reais, mantenha os botões indisponíveis com aviso traduzido.
- Valide mudanças relevantes com `npm run build`, `npm test` e, para navegação/layout, `npm run test:e2e`. Não inclua `node_modules`, `dist`, capturas ou relatórios de teste nos commits.
