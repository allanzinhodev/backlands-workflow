-- Censo de fonte na arvore inteira de widgets.
--
-- UID.fontaudit compara a largura medida do texto com a que a silkscreen daria, o
-- que so funciona em widget que TEM texto naquele instante. Metade do cliente nao
-- tem: rotulo de mensagem de chat so existe quando chega mensagem, linha de lista
-- so quando a lista carrega. Perguntar getFont() em todo widget encontra o estilo
-- errado antes do jogador encontrar.
local contagem, exemplos = {}, {}
local n = 0

local function walk(w, d)
  if d > 30 then return end
  n = n + 1
  local ok, f = pcall(function() return w:getFont() end)
  if ok and f then
    local nome = tostring(f)
    -- Widget sem texto herda a fonte do estilo base e nao desenha nada com ela:
    -- 12889 dos 20449 widgets do cliente reportam verdana so por isso. Contar
    -- so quem tem texto responde a pergunta que importa.
    local t = w:getText() or ''
    if #t > 0 then
      contagem[nome] = (contagem[nome] or 0) + 1
      if not exemplos[nome] then exemplos[nome] = {} end
      if #exemplos[nome] < 6 then
        exemplos[nome][#exemplos[nome] + 1] = string.format('%s <%s> [%s]',
          tostring(w:getId()), w:getClassName(), t:sub(1, 34))
      end
    end
  end
  for _, c in ipairs(w:getChildren()) do walk(c, d + 1) end
end

walk(g_ui.getRootWidget(), 0)

local nomes = {}
for k in pairs(contagem) do nomes[#nomes + 1] = k end
table.sort(nomes, function(a, b) return contagem[a] > contagem[b] end)

local out = { n .. ' widgets' }
for _, k in ipairs(nomes) do
  out[#out + 1] = string.format('%5d  %s', contagem[k], k)
  if k ~= 'silkscreen-16' then
    for _, e in ipairs(exemplos[k]) do out[#out + 1] = '         ' .. e end
  end
end
return '\n' .. table.concat(out, '\n')
