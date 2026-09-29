-- Converted from the Tibia 7.4 datapack: 74/npc/the gatekeeper.xml + behavior/the gatekeeper.npc
-- Rookgaard exit: level 8 and premium, chooses a home town and a profession.
local internalNpcName = "The Gatekeeper"
local npcType = Game.createNpcType(internalNpcName)
local npcConfig = {}

npcConfig.name = internalNpcName
npcConfig.description = internalNpcName

npcConfig.health = 100
npcConfig.maxHealth = npcConfig.health
npcConfig.walkInterval = 2000
npcConfig.walkRadius = 0

-- 7.4 look typeex="1448" (angel statue) is a 7.4 Server ID; 2031 is its Client ID.
npcConfig.outfit = {
	lookTypeEx = 2031,
}

npcConfig.flags = {
	floorchange = false,
}

local keywordHandler = KeywordHandler:new()
local npcHandler = NpcHandler:new(keywordHandler)

npcType.onThink = function(npc, interval)
	npcHandler:onThink(npc, interval)
end

npcType.onAppear = function(npc, creature)
	npcHandler:onAppear(npc, creature)
end

npcType.onDisappear = function(npc, creature)
	npcHandler:onDisappear(npc, creature)
end

npcType.onMove = function(npc, creature, fromPosition, toPosition)
	npcHandler:onMove(npc, creature, fromPosition, toPosition)
end

npcType.onSay = function(npc, creature, type, message)
	npcHandler:onSay(npc, creature, type, message)
end

npcType.onCloseChannel = function(npc, creature)
	npcHandler:onCloseChannel(npc, creature)
end

local FAREWELL = "COME BACK WHEN YOU ARE PREPARED TO FACE YOUR DESTINY!"

-- Town ids are the ones of the 7.4 map (server/data/world/world.otbm).
local towns = {
	{ words = { "ab'dendriel" }, townId = 4, name = "AB'DENDRIEL", destination = Position(32732, 31634, 7) },
	{ words = { "kazordoon" }, townId = 3, name = "KAZORDOON", destination = Position(32649, 31925, 11) },
	{ words = { "darashia" }, townId = 6, name = "DARASHIA", destination = Position(33213, 32454, 1) },
	{ words = { "ankrahmun" }, townId = 8, name = "ANKRAHMUN", destination = Position(33194, 32853, 8) },
	{ words = { "port", "hope" }, townId = 9, name = "PORT HOPE", destination = Position(32595, 32744, 6) },
}

local professions = {
	{ word = "knight", vocationId = VOCATION.ID.KNIGHT, name = "KNIGHT" },
	{ word = "paladin", vocationId = VOCATION.ID.PALADIN, name = "PALADIN" },
	{ word = "sorcerer", vocationId = VOCATION.ID.SORCERER, name = "SORCERER" },
	{ word = "druid", vocationId = VOCATION.ID.DRUID, name = "DRUID" },
}

-- Choice in progress per player (the 7.4 "Data" and "Type" registers).
local chosenTown = {}
local chosenProfession = {}

local function isWorthy(player)
	return player:getLevel() >= 8 and player:isPremium()
end

local function containsAll(message, words)
	for _, word in ipairs(words) do
		if not MsgContains(message, word) then
			return false
		end
	end
	return true
end

local function dismiss(npc, creature, text)
	npcHandler:say(text, npc, creature)
	npcHandler:removeInteraction(npc, creature)
	npcHandler:setTopic(creature, 0)
end

local function greetCallback(npc, creature)
	local player = Player(creature)
	if not player then
		return false
	end

	if not isWorthy(player) then
		npcHandler:say("CHILD! COME BACK WHEN YOU HAVE GROWN UP!", npc, creature)
		return false
	end

	npcHandler:setTopic(creature, 0)
	return true
end

local function creatureSayCallback(npc, creature, type, message)
	local player = Player(creature)
	if not player or not npcHandler:checkInteraction(npc, creature) then
		return false
	end

	local playerId = player:getId()
	local topic = npcHandler:getTopic(creature)

	if topic == 1 then
		for _, town in ipairs(towns) do
			if containsAll(message, town.words) then
				chosenTown[playerId] = town
				npcHandler:say("IN " .. town.name .. "! AND WHAT PROFESSION HAVE YOU CHOSEN: KNIGHT, PALADIN, SORCERER, OR DRUID?", npc, creature)
				npcHandler:setTopic(creature, 2)
				return true
			end
		end
		npcHandler:say("AB'DENDRIEL, KAZORDOON, ANKRAHMUN, PORT HOPE OR DARASHIA?", npc, creature)
		return true
	end

	if topic == 2 then
		for _, profession in ipairs(professions) do
			if MsgContains(message, profession.word) then
				chosenProfession[playerId] = profession
				npcHandler:say("A " .. profession.name .. "! ARE YOU SURE? THIS DECISION IS IRREVERSIBLE!", npc, creature)
				npcHandler:setTopic(creature, 3)
				return true
			end
		end
		npcHandler:say("KNIGHT, PALADIN, SORCERER, OR DRUID?", npc, creature)
		return true
	end

	if topic == 3 and MsgContains(message, "yes") then
		local town = chosenTown[playerId]
		local profession = chosenProfession[playerId]
		chosenTown[playerId], chosenProfession[playerId] = nil, nil
		if not town or not profession then
			dismiss(npc, creature, FAREWELL)
			return true
		end

		npcHandler:say("SO BE IT!", npc, creature)
		npcHandler:removeInteraction(npc, creature)
		npcHandler:setTopic(creature, 0)

		player:setVocation(Vocation(profession.vocationId))
		player:setTown(Town(town.townId))
		player:getPosition():sendMagicEffect(CONST_ME_TELEPORT)
		player:teleportTo(town.destination)
		town.destination:sendMagicEffect(CONST_ME_TELEPORT)
		return true
	end

	if topic == 0 and MsgContains(message, "yes") then
		if player:isPremium() then
			npcHandler:say("IN WHICH TOWN DO YOU WANT TO LIVE: AB'DENDRIEL, KAZORDOON, ANKRAHMUN, PORT HOPE OR DARASHIA?", npc, creature)
			npcHandler:setTopic(creature, 1)
		else
			dismiss(npc, creature, "YOU ARE NOT WORTHY!")
		end
		return true
	end

	-- Anything else ends the conversation (7.4: "-> *" after "bye").
	chosenTown[playerId], chosenProfession[playerId] = nil, nil
	dismiss(npc, creature, FAREWELL)
	return true
end

-- The 7.4 Gatekeeper also answers "greet".
keywordHandler:addKeyword({ "greet" }, function(cid)
	return npcHandler:onGreet(cid)
end)

npcHandler:setMessage(MESSAGE_GREET, "|PLAYERNAME|, ARE YOU PREPARED TO FACE YOUR DESTINY?")
npcHandler:setMessage(MESSAGE_FAREWELL, FAREWELL)
npcHandler:setMessage(MESSAGE_WALKAWAY, FAREWELL)

npcHandler:setCallback(CALLBACK_GREET, greetCallback)
npcHandler:setCallback(CALLBACK_MESSAGE_DEFAULT, creatureSayCallback)
npcHandler:addModule(FocusModule:new(), npcConfig.name, true, true, true)

npcType:register(npcConfig)
