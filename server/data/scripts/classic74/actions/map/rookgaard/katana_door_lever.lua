-- Ported from the Tibia 7.4 datapack: 74/scripts/actions/map/rookgaard/katana_door_lever.lua
-- (tools/scripts-migrate/port-74-scripts.js: item ids 7.4 Server ID -> Client ID, storages -> classic74QuestBase + n)

local action = Action()

function action.onUse(player, item, fromPosition, target, toPosition)
	if item:getId() == 2772 and Game.isItemInPosition({x = 32177, y = 32148, z = 11}, 1630) then 
		item:transform(2773, 1)
		item:decay()
		doRelocate({x = 32177, y = 32148, z = 11},{x = 32178, y = 32148, z = 11})
		Game.transformItemInPosition({x = 32177, y = 32148, z = 11}, 1630, 1628)
	elseif item:getId() == 2772 then
		item:transform(2773, 1)
		item:decay()
		Game.transformItemInPosition({x = 32177, y = 32148, z = 11}, 1629, 1628)
	elseif item:getId() == 2773 then 
		item:transform(2772, 1)
		item:decay()
		Game.transformItemInPosition({x = 32177, y = 32148, z = 11}, 1628, 1630)
	end
	return true
end

action:aid(2051)
action:register()