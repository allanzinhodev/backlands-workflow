-- Syntax-check Lua files without running them.
--
--   luajit.exe tools/lua-syntax.lua <file.lua> [more.lua ...]
--
-- Do NOT try to do this with `luajit -e '...' file.lua`: luajit runs the -e
-- chunk and then executes file.lua as the main script, which for a client
-- module means it blows up on the first global the client would have provided.
local bad = 0
for i = 1, #arg do
  local path = arg[i]
  local chunk, err = loadfile(path)
  if chunk then
    print("OK     " .. path)
  else
    bad = bad + 1
    print("SYNTAX " .. tostring(err))
  end
end
if bad > 0 then os.exit(1) end
