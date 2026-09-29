local mType = Game.createMonsterType("Demon Illusion")
local monster = {}

monster.name = "Demon Illusion"
monster.description = "a demon"
monster.experience = 25
monster.outfit = {
	lookType = 107,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 3003

monster.health = 50
monster.maxHealth = 50
monster.race = "blood"
monster.corpse = 4121
monster.speed = 20
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
	canPushCreatures = false,
	targetDistance = 1,
	runHealth = 15,
}

monster.voices = {
	interval = 5000,
	chance = 10,
	{
		text = "MUHAHAHAHA!",
		yell = true,
	},
	{
		text = "I SMELL FEEEEEAAAR!",
		yell = true,
	},
	{
		text = "CHAMEK ATH UTHUL ARAK!",
		yell = true,
	},
	{
		text = "Your resistance is futile!",
		yell = false,
	},
	{
		text = "Your soul will be mine!",
		yell = true,
	},
}

monster.loot = {
	{
		id = 1781,
		chance = 30000,
		maxCount = 3,
	},
	{
		id = 3462,
		chance = 10000,
	},
	{
		id = 3294,
		chance = 9000,
	},
	{
		id = 3120,
		chance = 7000,
	},
	{
		id = 3355,
		chance = 10000,
	},
	{
		id = 3361,
		chance = 7500,
	},
	{
		id = 3031,
		chance = 50000,
		maxCount = 9,
	},
	{
		id = 3578,
		chance = 13000,
	},
	{
		id = 3267,
		chance = 18000,
	},
	{
		id = 3115,
		chance = 12000,
	},
}

monster.attacks = {
	{
		name = "melee",
		interval = 2000,
		chance = 100,
		minDamage = 0,
		maxDamage = -10,
	},
	{
		name = "combat",
		interval = 8000,
		chance = 100,
		type = COMBAT_PHYSICALDAMAGE,
		minDamage = -15,
		maxDamage = -25,
		effect = CONST_ME_ENERGYHIT,
		length = 8,
		spread = 0,
	},
	{
		name = "combat",
		interval = 8000,
		chance = 100,
		type = COMBAT_PHYSICALDAMAGE,
		minDamage = -15,
		maxDamage = -25,
		shootEffect = CONST_ANI_FIRE,
		effect = CONST_ME_FIREAREA,
		range = 7,
		radius = 2,
		target = true,
	},
}

monster.defenses = { defense = 8, armor = 6 }

monster.elements = {
	{
		type = COMBAT_PHYSICALDAMAGE,
		percent = 0,
	},
	{
		type = COMBAT_ENERGYDAMAGE,
		percent = 0,
	},
	{
		type = COMBAT_FIREDAMAGE,
		percent = 0,
	},
	{
		type = COMBAT_EARTHDAMAGE,
		percent = 0,
	},
	{
		type = COMBAT_LIFEDRAIN,
		percent = 0,
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
