-- Instancia cada estilo de janela declarado no cliente e audita.
--
-- As varreduras abrem a janela pelo modulo, e boa parte do cliente so abre com
-- dado de servidor: a Store precisa do catalogo, o Market das ofertas, o Wheel da
-- arvore de pericia. Essas telas nunca foram auditadas. Criar o widget direto
-- pelo nome do estilo passa por cima disso - o layout e o mesmo, so o conteudo
-- fica vazio, e e o layout que a fonte nova quebra.
--
-- Criar e medir sao chamadas SEPARADAS. `createWidget` so agenda o layout: medir
-- no mesmo quadro pega os filhos em posicao provisoria, e o resultado foi uma
-- duzia de "ESCAPA-Y buttonOk" que sumiam sozinhos no quadro seguinte.
--
--   -LuaArg "cria <Estilo> [<Estilo>...]"  -> instancia e guarda
--   -LuaArg "audita"                       -> audita e destroi os guardados
--
-- `@onSetup` de alguns estilos mexe em estado de modulo e estoura; por isso tudo
-- vai em pcall e o erro entra no relatorio em vez de matar a varredura.
local arg = UIDARG or ''
local modo, resto = arg:match('^(%S+)%s*(.*)$')
UID.estilos = UID.estilos or {}

if modo == 'cria' then
  local n, erros = 0, {}
  for nome in resto:gmatch('%S+') do
    local ok, w = pcall(g_ui.createWidget, nome, g_ui.getRootWidget())
    if ok and w then
      UID.estilos[#UID.estilos + 1] = { nome = nome, w = w }
      n = n + 1
    else
      erros[#erros + 1] = string.format('%-32s NAO CRIA: %s', nome, tostring(w):sub(1, 80))
    end
  end
  if #erros == 0 then return n .. ' criados' end
  return n .. ' criados\n' .. table.concat(erros, '\n')
end

if modo ~= 'audita' then return 'modo desconhecido: ' .. tostring(modo) end

local out = {}
local n = #UID.estilos
for _, e in ipairs(UID.estilos) do
  local geo, fnt = 'erro', 'erro'
  pcall(function() geo = UID.audit(e.w, 8) end)
  pcall(function() fnt = UID.fontaudit(e.w, 8) end)
  local r = e.w:getRect()
  if not (geo:match('^limpo') and fnt:match('^tudo em')) then
    out[#out + 1] = string.format('%s (%dx%d)\n  %s\n  FONTE: %s', e.nome, r.width, r.height, geo, fnt)
  end
  pcall(function() e.w:destroy() end)
end
UID.estilos = {}

if #out == 0 then return n .. ' estilos auditados, todos limpos' end
return string.format('%d estilos, %d com achado:\n%s', n, #out, table.concat(out, '\n'))
