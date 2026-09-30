actionIds = {
	sandHole = 100, -- hidden sand hole
	pickHole = 105, -- hidden mud hole
	levelDoor = 1000, -- level door
	citizenship = 30020, -- citizenship teleport
	citizenshipLast = 30050 -- citizenship teleport last
}

-- Doors of the Tibia 7.4 map. The 7.4 engine kept door rules in its own item
-- attributes; tools/map-migrate/convert-door-attrs.js turns them into action ids
-- in these ranges (none of them is used by any map item or script):
--   key / keyhole number N        -> keyBase + N            (key and door match)
--   level L                       -> levelBase + L          (opens from level L)
--   quest number Q, quest value V -> questBase + Q * 16 + V (opens when the 7.4
--                                    QuestValue Q equals V)
Classic74Doors = {
	questBase = 40000,
	questValueSlots = 16,
	levelBase = 46000,
	levelLast = 46999,
	keyBase = 50000,
}

function Classic74Doors.isQuestDoor(actionId)
	return actionId >= Classic74Doors.questBase and actionId < Classic74Doors.levelBase
end

function Classic74Doors.isLevelDoor(actionId)
	return actionId >= Classic74Doors.levelBase and actionId <= Classic74Doors.levelLast
end

-- 7.4 quest doors open only when the QuestValue equals the door's value.
function Classic74Doors.canPassQuestDoor(player, actionId)
	local offset = actionId - Classic74Doors.questBase
	local questNumber = math.floor(offset / Classic74Doors.questValueSlots)
	local questValue = offset % Classic74Doors.questValueSlots
	return player:getStorageValue(PlayerStorageKeys.classic74QuestBase + questNumber) == questValue
end

function Classic74Doors.canPassLevelDoor(player, actionId)
	return player:getLevel() >= actionId - Classic74Doors.levelBase
end

uniqueIds = {}

-- Check duplicates actionIds
do
	local duplicates = {}
	for name, id in pairs(actionIds) do
		if duplicates[id] then error("Duplicate actionId: " .. id) end
		duplicates[id] = name
	end

	local __index = function(self, key)
		local aid = actionIds[key]
		if not aid then debugPrint("Invalid actionId: " .. key) end
		return aid
	end

	setmetatable(actionIds, {__index = __index})
end
