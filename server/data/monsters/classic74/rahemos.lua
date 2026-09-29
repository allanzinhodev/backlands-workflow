local mType = Game.createMonsterType("Rahemos")
local monster = {}

monster.name = "Rahemos"

monster.experience = 3100
monster.outfit = {
	lookType = 88,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 3008

monster.health = 3700
monster.maxHealth = 3700
monster.race = "undead"
monster.corpse = 4215
monster.speed = 100
monster.manaCost = 0

monster.changeTarget = {
	interval = 4000,
	chance = 3,
}

monster.strategiesTarget = {
	nearest = 80,
	health = 10,
	damage = 10,
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
	runHealth = 0,
}

monster.summon = {
	maxSummons = 1,
	summons = {
		{
			name = "Demon",
			interval = 9000,
			chance = 100,
			count = 1,
		},
	},
}

monster.voices = {
	interval = 5000,
	chance = 10,
	{
		text = "It's a kind of magic.",
		yell = false,
	},
	{
		text = "Abrah Kadabrah!",
		yell = false,
	},
	{
		text = "Nothing hidden in my warpings.",
		yell = false,
	},
	{
		text = "It's not a trick, it's Rahemos.",
		yell = false,
	},
	{
		text = "Meet my dear friend from hell.",
		yell = false,
	},
	{
		text = "I will make you believe in magic.",
		yell = false,
	},
}

monster.loot = {
	{
		id = 3036,
		chance = 1000,
	},
	{
		id = 3335,
		chance = 100,
	},
	{
		id = 3033,
		chance = 10000,
		maxCount = 3,
	},
	{
		id = 3098,
		chance = 5000,
	},
	{
		id = 3060,
		chance = 500,
	},
	{
		id = 3573,
		chance = 2000,
	},
	{
		id = 3031,
		chance = 35000,
		maxCount = 95,
	},
	{
		id = 3031,
		chance = 50000,
		maxCount = 85,
	},
	{
		id = 3031,
		chance = 70000,
		maxCount = 80,
	},
	{
		id = 3068,
		chance = 100,
	},
	{
		id = 3235,
		chance = 100000,
	},
}

monster.attacks = {
	{
		name = "melee",
		interval = 2000,
		chance = 100,
		minDamage = 0,
		maxDamage = -40,
	},
	{
		name = "combat",
		interval = 5000,
		chance = 100,
		type = COMBAT_PHYSICALDAMAGE,
		minDamage = -200,
		maxDamage = -600,
		shootEffect = CONST_ANI_SUDDENDEATH,
		effect = CONST_ME_MORTAREA,
		range = 7,
	},
	{
		name = "combat",
		interval = 5000,
		chance = 100,
		type = COMBAT_ENERGYDAMAGE,
		minDamage = -200,
		maxDamage = -600,
		shootEffect = CONST_ANI_ENERGY,
		effect = CONST_ME_ENERGYHIT,
		range = 7,
	},
	{
		name = "combat",
		interval = 15000,
		chance = 100,
		type = COMBAT_LIFEDRAIN,
		minDamage = -50,
		maxDamage = -750,
		range = 1,
	},
}

monster.defenses = {
	defense = 65, armor = 40,
	{
		name = "combat",
		interval = 5000,
		chance = 100,
		type = COMBAT_HEALING,
		minDamage = 200,
		maxDamage = 500,
		effect = CONST_ME_MAGIC_BLUE,
	},
}

monster.elements = {
	{
		type = COMBAT_PHYSICALDAMAGE,
		percent = 0,
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
		condition = true,
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
