-- Ported from the Tibia 7.4 datapack: 74/scripts/movements/map/rookgaard/spike_sword_first_step.lua
-- (tools/scripts-migrate/port-74-scripts.js: item ids 7.4 Server ID -> Client ID, storages -> classic74QuestBase + n)

local moveevent = MoveEvent()

function moveevent.onStepIn(creature, item, position, fromPosition)
	if creature:isPlayer() and Game.isItemInPosition({x = 32104, y = 32082, z = 07}, 4597) then 
		Game.transformItemInPosition({x = 32104, y = 32082, z = 07}, 4597, 4601)
	end
end

moveevent:aid(3013)
moveevent:register()