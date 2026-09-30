-- Ported from the Tibia 7.4 datapack: 74/scripts/movements/map/rookgaard/premium_bridge.lua
-- (tools/scripts-migrate/port-74-scripts.js: item ids 7.4 Server ID -> Client ID, storages -> classic74QuestBase + n)

local moveevent = MoveEvent()

function moveevent.onStepIn(creature, item, position, fromPosition)
	if creature:isPlayer() and not creature:getPlayer():isPremium() then
		doRelocate(item:getPosition(),{x = item:getPosition().x + 3, y = item:getPosition().y, z = 07})
		Game.sendMagicEffect(item:getPosition(), 13)
	end
end

moveevent:aid(3052)
moveevent:register()

local moveevent = MoveEvent()

function moveevent.onAddItem(item, tileitem, position)
	doRelocate(tileitem:getPosition(),{x = tileitem:getPosition().x + 3, y = tileitem:getPosition().y, z = 07})
	Game.sendMagicEffect(item:getPosition(), 13)
end

moveevent:aid(3052)
moveevent:tileItem(true)
moveevent:register()