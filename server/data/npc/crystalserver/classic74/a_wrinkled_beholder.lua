-- Converted from the Tibia 7.4 datapack: 74/npc/a wrinkled beholder.xml + behavior/a wrinkled beholder.npc
local internalNpcName = "A Wrinkled Beholder"
local npcType = Game.createNpcType(internalNpcName)
local npcConfig = {}

npcConfig.name = internalNpcName
npcConfig.description = internalNpcName

npcConfig.health = 100
npcConfig.maxHealth = npcConfig.health
npcConfig.walkInterval = 2000
npcConfig.walkRadius = 10

npcConfig.outfit = {
	lookType = 17,
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

local function addSay(keywords, text)
	keywordHandler:addKeyword(keywords, StdModule.say, { npcHandler = npcHandler, text = text })
end

addSay({ "job" }, "I am the great librarian.")
addSay({ "name" }, "I am 486486 and NOT 'Blinky' as some people called me ... before they died.")
addSay({ "tibia" }, "It's 1, not 'Tibia', silly.")
addSay({ "ab'dendriel" }, "I heard that elves moved in upstairs.")
addSay({ "elves" }, "These fools and their superstitious life cult don't understand anything of importance.")
addSay({ "humans" }, "Good tools to work with ... After their death, that is.")
addSay({ "orcs" }, "Noisy pests.")
addSay({ "minotaurs" }, "Their mages are so close to the truth. Closer then they know and closer then it's good for them.")
addSay({ "god" }, "They will mourn the day they abandoned us.")
addSay({ "death" }, "Yes, yes, I will kill you soon enough, now let me continue my investigation on you.")
addSay({ "numbers" }, "Numbers are essential. They are the secret behind the scenes. If you are a master of mathematics you are a master over life and death.")
addSay({ "library" }, "It's a fine library, isn't it?")
addSay({ "books" }, "Our books are written in 469, of course you can't understand them.")
addSay({ "469" }, "The language of my kind. Superior to any other language and only to be spoken by entities with enough eyes to blink it.")
addSay({ "cyclops" }, "Uglyness incarnate. One eye! Imagine that! Horrible!")
addSay({ "excalibug" }, "Only inferior species need weapons.")

-- "blinky" -> Burning(10,25), EffectOpp(5), EffectMe(8)
local function creatureSayCallback(npc, creature, type, message)
	local player = Player(creature)
	if not player or not npcHandler:checkInteraction(npc, creature) then
		return false
	end

	if MsgContains(message, "blinky") then
		npcHandler:say("How interesting you are that stupid. Let me apply this on you and see how long you last", npc, creature)

		local burning = Condition(CONDITION_FIRE)
		burning:setParameter(CONDITION_PARAM_DELAYED, true)
		burning:addDamage(10, 4000, -25)
		player:addCondition(burning)

		player:getPosition():sendMagicEffect(CONST_ME_EXPLOSIONAREA)
		npc:getPosition():sendMagicEffect(CONST_ME_YELLOW_RINGS)
		return true
	end
	return false
end

npcHandler:setMessage(MESSAGE_GREET, "What is this? An optically challenged entity called |PLAYERNAME|. How fascinating!")
npcHandler:setMessage(MESSAGE_FAREWELL, "Wait right there. I will eat you after writing down what I found out.")
npcHandler:setMessage(MESSAGE_WALKAWAY, "Strange entity. I will record this encounter.")

npcHandler:setCallback(CALLBACK_MESSAGE_DEFAULT, creatureSayCallback)
npcHandler:addModule(FocusModule:new(), npcConfig.name, true, true, true)

npcType:register(npcConfig)
