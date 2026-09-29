-- Converted from the Tibia 7.4 datapack: 74/npc/the queen of the banshee.xml + behavior/the queen of the banshee.npc
-- Guardian of the seventh seal. 7.4 QuestValue(n) lives in storage PlayerStorageKeys.classic74QuestBase + n.
local internalNpcName = "The Queen of the Banshee"
local npcType = Game.createNpcType(internalNpcName)
local npcConfig = {}

npcConfig.name = internalNpcName
npcConfig.description = internalNpcName

npcConfig.health = 100
npcConfig.maxHealth = npcConfig.health
npcConfig.walkInterval = 2000
npcConfig.walkRadius = 6

npcConfig.outfit = {
	lookType = 78,
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

local function questValue(player, number)
	return math.max(0, player:getStorageValue(PlayerStorageKeys.classic74QuestBase + number))
end

local function setQuestValue(player, number, value)
	player:setStorageValue(PlayerStorageKeys.classic74QuestBase + number, value)
end

local QUEST_KISS = 11
local QUEST_KISS_COUNT = 12
local QUEST_SPECTRAL_DRESS = 327
local KISS_DESTINATION = Position(32202, 31812, 8)
local NOT_PREPARED = "Then try to be better prepared next time we meet."

-- Topics 2-7: the six seals the player must have passed, in the 7.4 order.
local seals = {
	[2] = { quest = 4, passed = "Yessss, I can sense you have passed the seal of sacrifice. Have you passed any other seal yet?", missing = "You have not passed the seal of sacrifice yet. Return to me when you are better prepared." },
	[3] = { quest = 5, passed = "I sense you have passed the hidden seal as well. Have you passed any other seal yet?", missing = "You have not found the hidden seal yet. Return when you are better prepared." },
	[4] = { quest = 6, passed = "Oh yes, you have braved the plagueseal. Have you passed any other seal yet?", missing = "You have not faced the plagueseal yet. Return to me when you are better prepared." },
	[5] = { quest = 7, passed = "Ah, I can sense the power of the seal of demonrage burning in your heart. Have you passed any other seal yet?", missing = "You are not filled with the fury of the imprisoned demon. Return when you are better prepared." },
	[6] = { quest = 9, passed = "So, you have managed to pass the seal of the true path. Have you passed any other seal yet?", missing = "You have not found your true path yet. Return when you are better prepared." },
	[7] = { quest = 10, passed = "I see! You have mastered the seal of logic. You have made the sacrifice, you have seen the unseen, you possess fortitude, you have filled yourself with power and found your path. You may ask me for my kiss now.", missing = "You have not found your true path yet. Return to meh when you are better prepared." },
}

local function addSay(keywords, text)
	keywordHandler:addKeyword(keywords, StdModule.say, { npcHandler = npcHandler, text = text })
end

addSay({ "name" }, "It hurts me to even think about my mortal past. Its long lost and forgotten. So don't ask me about it!")
addSay({ "job" }, "It is my curse to be the eternal guardian of this ancient place.")
addSay({ "place" }, "It served as a temple, a source of power and ... as a sender for an ancient race in time long gone by and forgotten.")
addSay({ "race" }, "The race that built this edifice came to this place from the stars. They ran from an enemy even more horrible than even themselves. But they carried the seed of their own destruction in them.")
addSay({ "seed" }, "This ancient race was annihilated by its own doings, that's all I know. Aeons have passed since then, but the sheer presence of this complex is still defiling and desecrating this area.")
keywordHandler:addAliasKeyword({ "destruction" })
addSay({ "complex" }, "Its constructors were too strange for you or even me to understand. We cannot know what this ... thing they have built was supposed to be good for. All I can feel is a constant twisting and binding of souls, though that is probably only a side-effect.")
addSay({ "ghostlands" }, "The place you know as the Ghostlands had a different name once ... and many names thereafter. Too many for me to remember them all.")
addSay({ "banshee" }, "They are my maidens. They give me comfort in my eternal vigil over the last seal.")
addSay({ "seal" }, "I am the guardian of the SEVENTH and final seal. The seal to open the last door before ... but perhaps it is better you see it with your own eyes.")
keywordHandler:addAliasKeyword({ "guardian" })

local function creatureSayCallback(npc, creature, type, message)
	local player = Player(creature)
	if not player or not npcHandler:checkInteraction(npc, creature) then
		return false
	end

	local topic = npcHandler:getTopic(creature)

	if MsgContains(message, "seventh") or MsgContains(message, "last") then
		if player:getLevel() < 60 then
			npcHandler:say("You are not experienced enough to master the challenges ahead or to receive knowledge about the seventh seal. Go and learn more before asking me again.", npc, creature)
			npcHandler:setTopic(creature, 0)
		else
			npcHandler:say("If you have passed the first six seals and entered the blue fires that lead to the chamber of the seal you might receive my kiss ... It will open the last seal. Do you think you are ready?", npc, creature)
			npcHandler:setTopic(creature, 2)
		end
		return true
	end

	if MsgContains(message, "kiss") then
		if player:isPzLocked() then
			npcHandler:say("You have spilled too much blood recently and the dead are hungry for your soul. Perhaps return when you regained you inner balance.", npc, creature)
		elseif topic == 8 and questValue(player, QUEST_KISS) < 1 then
			npcHandler:say("Are you prepared to receive my kiss, even though this will mean that your death as well as a part of your soul will forever belong to me, my dear?", npc, creature)
			npcHandler:setTopic(creature, 1)
			return true
		elseif questValue(player, QUEST_KISS) > 0 then
			npcHandler:say("You have already received my kiss. You should know better then to ask for it.", npc, creature)
		else
			npcHandler:say("To receive my kiss you have to pass all other seals first.", npc, creature)
		end
		npcHandler:setTopic(creature, 0)
		return true
	end

	if MsgContains(message, "yes") then
		if topic == 1 then
			npcHandler:say("So be it! Hmmmmmm...", npc, creature)
			setQuestValue(player, QUEST_KISS, 1)
			setQuestValue(player, QUEST_KISS_COUNT, questValue(player, QUEST_KISS_COUNT) + 1)
			npcHandler:setTopic(creature, 0)
			player:teleportTo(KISS_DESTINATION)
			KISS_DESTINATION:sendMagicEffect(CONST_ME_MAGIC_RED)
			return true
		end

		local seal = seals[topic]
		if seal then
			if questValue(player, seal.quest) == 1 then
				npcHandler:say(seal.passed, npc, creature)
				npcHandler:setTopic(creature, topic + 1)
			else
				npcHandler:say(seal.missing, npc, creature)
				npcHandler:setTopic(creature, 0)
			end
			return true
		end
	end

	if MsgContains(message, "no") then
		if topic == 1 then
			npcHandler:say("Perhaps it is the better choice for you, my dear.", npc, creature)
			npcHandler:setTopic(creature, 0)
			return true
		end
		if seals[topic] then
			npcHandler:say(NOT_PREPARED, npc, creature)
			npcHandler:setTopic(creature, 0)
			return true
		end
	end

	if MsgContains(message, "spectral") and MsgContains(message, "dress") then
		npcHandler:say("Your wish for a spectral dress is silly. Allthough I will grant you the permission to take one. My maidens left one in a box in a room, directly south of here.", npc, creature)
		setQuestValue(player, QUEST_SPECTRAL_DRESS, 1)
		return true
	end

	return false
end

npcHandler:setMessage(MESSAGE_GREET, "Be greeted, dear visitor. Come and stay ... a while.")
npcHandler:setMessage(MESSAGE_FAREWELL, "We will meet again.")
npcHandler:setMessage(MESSAGE_WALKAWAY, "Yes, flee from death. But know it shall be always one step behind you.")

npcHandler:setCallback(CALLBACK_MESSAGE_DEFAULT, creatureSayCallback)
npcHandler:addModule(FocusModule:new(), npcConfig.name, true, true, true)

npcType:register(npcConfig)
