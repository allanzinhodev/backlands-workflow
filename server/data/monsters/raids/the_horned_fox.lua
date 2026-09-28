local mType = Game.createMonsterType("The Horned Fox")
local monster = {}

monster.name = "The Horned Fox"
monster.description = "the Horned Fox"
monster.experience = 200
monster.outfit = {
	lookType = 202,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.bosstiary = {
	bossRaceId = 202,
	bossRace = RARITY_NEMESIS,
}

monster.health = 265
monster.maxHealth = 265
monster.race = "blood"
monster.corpse = 2876
monster.speed = 65
monster.manaCost = 0

monster.changeTarget = {
	interval = 5000,
	chance = 8,
}

monster.strategiesTarget = {
	nearest = 70,
	health = 10,
	damage = 20,
}

monster.flags = {
	summonable = false,
	attackable = true,
	hostile = true,
	convinceable = false,
	pushable = false,
	rewardBoss = false,
	illusionable = false,
	canPushItems = true,
	canPushCreatures = true,
	staticAttackChance = 90,
	targetDistance = 1,
	runHealth = 0,
	healthHidden = false,
	isBlockable = false,
	canWalkOnEnergy = false,
	canWalkOnFire = false,
	canWalkOnPoison = false,
}

monster.light = {
	level = 0,
	color = 0,
}

monster.summon = {
	maxSummons = 2,
	summons = {
		{
			name = "Minotaur Guard",
			interval = 8000,
			chance = 100,
			count = 2,
		},
		{
			name = "Minotaur Archer",
			interval = 8000,
			chance = 100,
			count = 2,
		},
	},
}

monster.voices = {
	interval = 5000,
	chance = 10,
	{
		text = "You will never get me!",
		yell = false,
	},
	{
		text = "I'll be back!",
		yell = false,
	},
	{
		text = "Catch me, if you can!",
		yell = false,
	},
	{
		text = "Help me, boys!",
		yell = false,
	},
}

monster.loot = {
	{
		id = 2666,
		chance = 10000,
	},
	{
		id = 2388,
		chance = 9000,
	},
	{
		id = 2148,
		chance = 60000,
		maxCount = 20,
	},
	{
		id = 2580,
		chance = 5000,
	},
	{
		id = 2502,
		chance = 9000,
	},
	{
		id = 2387,
		chance = 1000,
	},
	{
		id = 2648,
		chance = 15000,
	},
	{
		id = 2465,
		chance = 14000,
	},
	{
		id = 2513,
		chance = 2000,
	},
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -525 },
	{ name = "combat", interval = 1000, chance = 25, type = COMBAT_PHYSICALDAMAGE, minDamage = 0, maxDamage = -20, range = 7, shootEffect = CONST_ANI_BOLT, target = true },
	-- poison
	{ name = "condition", interval = 1000, chance = 40, target = false, condition =
	{ type = CONDITION_POISON, minDamage = -10, maxDamage = -200, range = 10, shootEffect = CONST_ANI_POISON } },
}

monster.defenses = {
	defense = 33,
	armor = 30,
	{ name = "combat", interval = 1000, chance = 15, type = COMBAT_HEALING, minDamage = 80, maxDamage = 100, effect = CONST_ME_MAGIC_RED, target = false },
	{ name = "invisible", interval = 1000, chance = 10, effect = CONST_ME_MAGIC_BLUE },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 0 },
	{ type = COMBAT_EARTHDAMAGE, percent = 0 },
	{ type = COMBAT_FIREDAMAGE, percent = 0 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = -1 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = -1 },
}

monster.immunities = {
	{ type = "paralyze", condition = false },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
