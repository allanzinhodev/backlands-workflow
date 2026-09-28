local mType = Game.createMonsterType("Grorlam")
local monster = {}

monster.name = "Grorlam"
monster.description = "Grorlam"
monster.experience = 1600
monster.outfit = {
	lookType = 205,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.bosstiary = {
	bossRaceId = 205,
	bossRace = RARITY_NEMESIS,
}

monster.health = 2700
monster.maxHealth = 2700
monster.race = "undead"
monster.corpse = 2952
monster.speed = 100
monster.manaCost = 590

monster.changeTarget = {
	interval = 5000,
	chance = 3,
}

monster.strategiesTarget = {
	nearest = 100,
}

monster.flags = {
	summonable = false,
	attackable = true,
	hostile = true,
	convinceable = false,
	pushable = false,
	rewardBoss = true,
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
	canWalkOnPoison = true,
}

monster.light = {
	level = 0,
	color = 0,
}

monster.voices = {
	interval = 5000,
	chance = 10,
}

monster.loot = {
	{
		id = 2509,
		chance = 7000,
	},
	{
		id = 2645,
		chance = 500,
	},
	{
		id = 1294,
		chance = 13000,
		maxCount = 4,
	},
	{
		id = 2150,
		chance = 6500,
		maxCount = 2,
	},
	{
		id = 2483,
		chance = 5000,
	},
	{
		id = 2156,
		chance = 500,
	},
	{
		id = 2166,
		chance = 5500,
	},
	{
		id = 2553,
		chance = 6000,
	},
	{
		id = 2148,
		chance = 16000,
		maxCount = 15,
	},
	{
		id = 2124,
		chance = 200,
	},
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, skill = 75, attack = 60 },
	{ name = "combat", interval = 1000, chance = 15, type = COMBAT_PHYSICALDAMAGE, minDamage = -150, maxDamage = -200, range = 7, shootEffect = CONST_ANI_LARGEROCK, target = true },
}

monster.defenses = {
	defense = 25,
	armor = 15,
	mitigation = 1.60,
	{ name = "combat", interval = 1000, chance = 25, type = COMBAT_HEALING, minDamage = 100, maxDamage = 150, effect = CONST_ME_MAGIC_BLUE, target = false },
	{ name = "speed", interval = 1000, chance = 6, speedChange = 270, effect = CONST_ME_MAGIC_RED, target = false, duration = 6000 },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 30 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 20 },
	{ type = COMBAT_EARTHDAMAGE, percent = 100 },
	{ type = COMBAT_FIREDAMAGE, percent = -10 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
	{ type = COMBAT_HOLYDAMAGE, percent = 20 },
	{ type = COMBAT_DEATHDAMAGE, percent = -1 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
