-- Descobre as "abas" de uma janela sem saber a API do modulo.
--
-- uisweep abre a janela e audita o que esta a vista. Janela com abas mostra um
-- painel de cada vez, e os outros ficam invisiveis no mesmo lugar - o Cyclopedia
-- tem nove, a janela de Opcoes quinze. Auditar so o visivel deixou onze defeitos
-- de pe em cada uma delas.
--
-- O padrao e reconhecivel sem conhecer o modulo: irmaos com o MESMO retangulo,
-- dos quais no maximo um esta visivel. Este script acha esses grupos, revela um
-- painel por chamada e devolve o estado anterior na chamada seguinte.
--
--   -LuaArg "<janela>"          -> lista os grupos e quantos paineis cada um tem
--   -LuaArg "<janela>|<i>|<j>"  -> mostra o painel j do grupo i (esconde os irmaos)
local arg = UIDARG or ''
local janela, gi, pi = arg:match('^([^|]*)|?(%d*)|?(%d*)$')
local w = UID.find(janela)
if not w then return 'janela ausente: ' .. tostring(janela) end

-- agrupa irmaos por retangulo
local function grupos(raiz)
  local achados = {}
  local function walk(c, d)
    if d > 12 then return end
    local porRect = {}
    for _, k in ipairs(c:getChildren()) do
      local r = k:getRect()
      -- painel fora do retangulo da janela nao e aba: e grade rolada para fora da
      -- vista, como os nove slots do prey em coordenada negativa.
      local wr = w:getRect()
      local dentro = r.x + r.width > wr.x and r.x < wr.x + wr.width
                 and r.y + r.height > wr.y and r.y < wr.y + wr.height
      if dentro and r.width > 60 and r.height > 60 then
        local chave = r.x .. ',' .. r.y .. ',' .. r.width .. ',' .. r.height
        porRect[chave] = porRect[chave] or {}
        table.insert(porRect[chave], k)
      end
    end
    for chave, lista in pairs(porRect) do
      if #lista >= 3 then
        local visiveis = 0
        for _, k in ipairs(lista) do if k:isVisible() then visiveis = visiveis + 1 end end
        if visiveis <= 1 then
          table.insert(achados, { pai = c, chave = chave, paineis = lista })
        end
      end
    end
    for _, k in ipairs(c:getChildren()) do walk(k, d + 1) end
  end
  walk(raiz, 0)
  -- ordem estavel entre chamadas: o Lua nao garante a ordem de pairs()
  table.sort(achados, function(a, b) return a.chave < b.chave end)
  return achados
end

local gs = grupos(w)
if gi == '' then
  if #gs == 0 then return 'sem grupo de paineis' end
  local out = {}
  for i, g in ipairs(gs) do
    local nomes = {}
    for _, p in ipairs(g.paineis) do nomes[#nomes+1] = tostring(p:getId()) end
    out[#out+1] = string.format('%d %s (%d): %s', i, g.chave, #g.paineis, table.concat(nomes, ' '))
  end
  return table.concat(out, '\n')
end

local g = gs[tonumber(gi)]
if not g then return 'grupo ausente' end
local p = g.paineis[tonumber(pi)]
if not p then return 'painel ausente' end
for _, k in ipairs(g.paineis) do k:setVisible(k == p) end
return 'mostrando ' .. tostring(p:getId())
