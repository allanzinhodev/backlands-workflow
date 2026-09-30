-- Ported from the Tibia 7.4 datapack: 74/scripts/movements/map/rookgaard/level_2_bridge.lua
-- (tools/scripts-migrate/port-74-scripts.js: item ids 7.4 Server ID -> Client ID, storages -> classic74QuestBase + n)

local moveevent = MoveEvent()

function moveevent.onStepIn(creature, item, position, fromPosition)
	if creature:isPlayer() and creature:getPlayer():getLevel() < 2 then
		doRelocate(item:getPosition(),{x = item:getPosition().x - 1, y = 32176, z = 07})
		Game.sendMagicEffect({x = item:getPosition().x - 1, y = 32176, z = 07}, 13)
	end
end

moveevent:aid(3051)
moveevent:register()

local moveevent = MoveEvent()

function moveevent.onAddItem(item, tileitem, position)
	doRelocate(tileitem:getPosition(),{x = tileitem:getPosition().x - 1, y = 32176, z = 07})
	Game.sendMagicEffect({x = tileitem:getPosition().x - 1, y = 32176, z = 07}, 13)
end

moveevent:aid(3051)
moveevent:tileItem(true)
moveevent:register()