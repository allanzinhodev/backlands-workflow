# Backlands — site

Landing page React + TypeScript + Tailwind CSS, em `frontend/`. Usa fundo preto, títulos Cinzel (Google Fonts) com gradiente dourado, fonte Helvetica/Arial para subtítulos e navegação, e texto corrido `#ccc`.

O link de seleção do Google Fonts informado não continha uma família de fonte. Cinzel foi adotada como padrão; para trocar, altere o link em `frontend/index.html` e `--font-display` em `frontend/src/styles.css`.

## Rodar localmente

Requer Node.js 22.22.2+, 24.15+ ou 26+ e npm (compatibilidade das ferramentas de teste).

```powershell
cd site/frontend
npm ci
npm run dev
```

Acesse `http://127.0.0.1:5173`. Para testar no celular na mesma rede, use `npm run dev -- --host 0.0.0.0` e abra o IP do computador na porta 5173.

## Compilar e verificar

```powershell
npm run build
npm run preview
```

A saída está em `frontend/dist`, pronta para um servidor de arquivos estáticos. Nenhum backend é necessário para esta landing page.

```powershell
npm test
npm run test:e2e
```

Os testes de navegador usam Microsoft Edge instalado. Para usar o Chromium do Playwright, defina `PLAYWRIGHT_BROWSER_CHANNEL=chromium` e execute `npx playwright install chromium` uma vez. Os relatórios e capturas ficam em pastas ignoradas pelo Git.

## Idiomas e configuração

Copie `frontend/.env.example` para `frontend/.env` se quiser personalizar as variáveis. Reinicie o servidor de desenvolvimento após alterações; em produção, gere um novo build.

| Variável | Uso |
| --- | --- |
| `VITE_DEFAULT_LANGUAGE` | `pt` (padrão) ou `en`, usado quando as outras fontes não indicam um idioma suportado. |
| `VITE_GEOIP_URL` | Endpoint JSON de localização. Padrão: `https://ipapi.co/json/`. Um valor vazio desativa a consulta. |
| `VITE_DOWNLOAD_URL` | Destino público do botão de download, como `https://...` ou `/downloads/client.apk`. |
| `VITE_REGISTER_URL` | Destino público do cadastro, como `https://...` ou `/cadastro`. |

O idioma segue esta prioridade:

1. Escolha manual PT/EN salva no navegador.
2. Idioma principal ou país estimado pela consulta de IP.
3. Primeiro idioma PT/EN nas preferências do navegador.
4. `VITE_DEFAULT_LANGUAGE`.

A consulta de localização termina após 2 segundos; falhas, bloqueios e limites do serviço usam o fallback. A localização apenas sugere o idioma de uma região: a pessoa pode corrigir pelo seletor, que permanece no topo. O browser consulta o serviço diretamente, sem enviar cookies; o site não guarda o IP, apenas a escolha `pt` ou `en`. Em produção, um endpoint próprio pode retornar `languages` e/ou `country_code` no mesmo formato. [Documentação do serviço padrão](https://ipapi.co/api/).

Todos os textos, rótulos de acessibilidade e metadados estão nos catálogos `pt` e `en` de `frontend/src/i18n/catalog.ts`. O tipo `Copy` exige ambos os idiomas. Toda nova seção ou funcionalidade deve atualizar os dois catálogos; [AGENTS.md](AGENTS.md) registra essa regra e a skill de design responsivo para trabalhos futuros.

## Conteúdo inicial

- Home com texto do briefing e estágio atual **Pré Launch**; marcos futuros Pré Alpha, Alpha, Beta e Oficial Launch. A barra indica o início da jornada, sem estimativa de percentual ou data.
- Carrossel reutilizável com três temas do briefing: RPG Oldschool, folclore brasileiro e cultura regional. Sem reprodução automática.
- Seções de mundo e FAQ com títulos e espaço reservado, sem conteúdo.
- Rodapé com botões **Baixar jogo** e **Cadastrar**. Exibem **Em breve** e ficam indisponíveis até receberem os destinos reais nas variáveis acima.

A skill externa [responsive-design](.skills/responsive-design/SKILL.md) e sua licença estão preservadas em `.skills/`.
