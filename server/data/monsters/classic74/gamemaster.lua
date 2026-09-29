local mType = Game.createMonsterType("Gamemaster")
local monster = {}

monster.name = "Gamemaster"
monster.description = "a Gamemaster"
monster.experience = 0
monster.outfit = {
	lookType = 75,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 3002

monster.health = 8200
monster.maxHealth = 8200
monster.race = "blood"
monster.corpse = 4240
monster.speed = 199
monster.manaCost = 0

monster.changeTarget = {
	interval = 4000,
	chance = 0,
}

monster.strategiesTarget = {
	nearest = 100,
	health = 0,
	damage = 0,
	random = 0,
}

monster.flags = {
	summonable = false,
	illusionable = false,
	pushable = false,
	convinceable = false,
	canPushItems = true,
	canPushCreatures = true,
	targetDistance = 1,
	runHealth = 20,
}

monster.voices = {
	interval = 5000,
	chance = 10,
	{
		text = "Watch the rules!",
		yell = false,
	},
	{
		text = "Hey, you! I've seen that!",
		yell = false,
	},
	{
		text = "Are you AFK or what?",
		yell = false,
	},
	{
		text = "Does your mother know what you are doing?",
		yell = false,
	},
}

monster.loot = {}

monster.attacks = {
	{
		name = "melee",
		interval = 2000,
		chance = 100,
		minDamage = 0,
		maxDamage = -299,
	},
	{
		name = "combat",
		interval = 5000,
		chance = 100,
		type = COMBAT_ENERGYDAMAGE,
		minDamage = -1750,
		maxDamage = -2250,
		effect = CONST_ME_ENERGYHIT,
		length = 1,
		spread = 0,
	},
	{
		name = "combat",
		interval = 4000,
		chance = 100,
		type = COMBAT_MANADRAIN,
		minDamage = -969,
		maxDamage = -1029,
		range = 7,
	},
	{
		name = "combat",
		interval = 3000,
		chance = 100,
		type = COMBAT_LIFEDRAIN,
		minDamage = -1850,
		maxDamage = -2150,
		range = 1,
	},
}

monster.defenses = {
	defense = 199, armor = 199,
	{
		name = "combat",
		interval = 2000,
		chance = 100,
		type = COMBAT_HEALING,
		minDamage = 4500,
		maxDamage = 7500,
		effect = CONST_ME_MAGIC_BLUE,
	},
}

monster.elements = {
	{
		type = COMBAT_PHYSICALDAMAGE,
		percent = 100,
	},
	{
		type = COMBAT_ENERGYDAMAGE,
		percent = 100,
	},
	{
		type = COMBAT_FIREDAMAGE,
		percent = 100,
	},
	{
		type = COMBAT_EARTHDAMAGE,
		percent = 100,
	},
	{
		type = COMBAT_LIFEDRAIN,
		percent = 100,
	},
}

monster.immunities = {
	{
		type = "paralyze",
		condition = false,
	},
	{
		type = "invisible",
		condition = true,
	},
	{
		type = "outfit",
		condition = true,
	},
}

mType:register(monster)
