-- Quais sprites o cliente realmente prende a um widget.
--
-- `data/images/ui` tem 412 PNGs e 175 ainda cinzas, mas boa parte e arte morta
-- que sobrou de versoes antigas do OTClient. O regrade-batch decide por
-- referencia no fonte, o que erra dos dois lados: nao ve caminho montado em
-- runtime (setImageSource("/images/topbuttons/%s.png", v)) e ve caminho que so
-- aparece num comentario. Perguntar a arvore de widgets responde de verdade.
--
-- Percorre tudo, inclusive invisivel, porque mini-janela fechada continua no
-- painel e volta a aparecer.
local vistos = {}
local n = 0

local function walk(w, d)
  if d > 20 then return end
  n = n + 1
  local ok, src = pcall(function() return w:getImageSource() end)
  if ok and src and #src > 0 then vistos[src] = (vistos[src] or 0) + 1 end
  local ok2, ico = pcall(function() return w:getIcon() end)
  if ok2 and type(ico) == 'string' and #ico > 0 then vistos[ico] = (vistos[ico] or 0) + 1 end
  for _, c in ipairs(w:getChildren()) do walk(c, d + 1) end
end

walk(g_ui.getRootWidget(), 0)

local lista = {}
for src in pairs(vistos) do lista[#lista+1] = src end
table.sort(lista)
return string.format('%d widgets, %d sprites\n%s', n, #lista, table.concat(lista, '\n'))

-- NOTA: isto ve os widgets VIVOS agora. Janela com abas destroi e recria o painel
-- ao trocar de aba, entao uma unica captura pega so a aba ativa - o `charm-options`
-- do Cyclopedia escapou assim. Para cobrir tudo, rode uma vez por aba e una as
-- listas antes de passar ao regrade-live.
