-- Dump das caixas de tinta de todo texto visivel, em coordenada de tela.
--
-- Serve de entrada para a checagem de contraste: a auditoria de geometria diz
-- onde o texto cai, mas nao se da para LE-LO. Texto sem contraste com o fundo
-- e pior que texto cortado - o cortado ainda mostra metade, o sem contraste
-- some inteiro, e foi o que aconteceu com "Sell All" quando o botao ganhou a
-- placa escura e manteve a tinta escura.
--
-- Uma linha por widget: x y w h | caminho | texto
local alvo = UIDARG or ''
local raiz = alvo ~= '' and UID.find(alvo) or UID.root()
if not raiz then return 'alvo ausente: ' .. alvo end

-- Widget dentro de container com clipping so pinta onde o container mostra. Sem
-- isso, linha de lista rolada para fora entra na conta com contraste zero - o
-- que e verdade, mas nao e defeito: ninguem esta tentando le-la.
local function recorte(w)
  local clip = nil
  local p = w:getParent()
  while p do
    if p:isClipping() then
      local r = p:getRect()
      if not clip then
        clip = { x = r.x, y = r.y, width = r.width, height = r.height }
      else
        local x1 = math.max(clip.x, r.x)
        local y1 = math.max(clip.y, r.y)
        local x2 = math.min(clip.x + clip.width, r.x + r.width)
        local y2 = math.min(clip.y + clip.height, r.y + r.height)
        clip = { x = x1, y = y1, width = math.max(0, x2 - x1), height = math.max(0, y2 - y1) }
      end
    end
    p = p:getParent()
  end
  return clip
end

local out = {}
local function walk(c, d, caminho)
  if d > 25 or not c:isVisible() or c:getOpacity() < 0.9 then return end
  local nome = tostring(c:getId() or c:getClassName())
  local sub = caminho == '' and nome or (caminho .. '/' .. nome)
  local t = c:getText()
  if t and #t > 0 then
    local r = c:getRect()
    local o = c:getTextOffset()
    local ts = c:getTextSize()
    local al = c:getTextAlign()
    local function tem(f) return math.floor(al / f) % 2 == 1 end
    local bx, bw = r.x + o.x, r.width - o.x
    local x = bx
    if tem(2) then x = bx + bw - ts.width
    elseif tem(16) then x = bx + math.floor((bw - ts.width) / 2) end
    local y = r.y + o.y
    local by, bh = r.y + o.y, r.height - o.y
    if tem(8) then y = by + bh - ts.height
    elseif tem(32) then y = by + math.floor((bh - ts.height) / 2) end
    local w = math.min(ts.width, math.max(0, bw))
    local h = math.min(ts.height, math.max(0, bh))
    local cl = recorte(c)
    if cl then
      local x1 = math.max(x, cl.x)
      local y1 = math.max(y, cl.y)
      local x2 = math.min(x + w, cl.x + cl.width)
      local y2 = math.min(y + h, cl.y + cl.height)
      x, y, w, h = x1, y1, math.max(0, x2 - x1), math.max(0, y2 - y1)
    end
    if w > 8 and h > 8 then
      out[#out+1] = string.format('%d %d %d %d|%s|%s',
        math.floor(x), math.floor(y), w, h, sub, t:gsub('\n', ' '):sub(1, 40))
    end
  end
  for _, k in ipairs(c:getChildren()) do walk(k, d + 1, sub) end
end
walk(raiz, 0, '')
return table.concat(out, '\n')
