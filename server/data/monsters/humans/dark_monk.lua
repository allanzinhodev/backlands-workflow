local mType = Game.createMonsterType("Dark Monk")
local monster = {}

monster.name = "Dark Monk"
monster.description = "a dark monk"
monster.experience = 145
monster.outfit = {
	lookType = 225,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 225
monster.Bestiary = {
	class = "Human",
	race = BESTY_RACE_HUMAN,
	toKill = 500,
	FirstUnlock = 25,
	SecondUnlock = 250,
	CharmsPoints = 15,
	Stars = 2,
	Occurrence = 0,
	Locations = "Dark Cathedral, Vandura (Cult Cave), Foreigner Quarter.",
}

monster.health = 190
monster.maxHealth = 190
monster.race = "blood"
monster.corpse = 3058
monster.speed = 75
monster.manaCost = 480

monster.changeTarget = {
	interval = 5000,
	chance = 0,
}

monster.strategiesTarget = {
	nearest = 70,
	health = 20,
	damage = 10,
}

monster.flags = {
	summonable = false,
	attackable = true,
	hostile = true,
	convinceable = true,
	pushable = false,
	rewardBoss = false,
	illusionable = true,
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

monster.voices = {
	interval = 5000,
	chance = 10,
	{
		text = "This is where your path will end!",
		yell = false,
	},
	{
		text = "Your end has come.",
		yell = false,
	},
	{
		text = "You are no match for us!",
		yell = false,
	},
}

monster.loot = {
	{
		id = 2401,
		chance = 11000,
	},
	{
		id = 1949,
		chance = 20000,
	},
	{
		id = 2642,
		chance = 8000,
	},
	{
		id = 2166,
		chance = 100,
	},
	{
		id = 2044,
		chance = 10000,
	},
	{
		id = 2177,
		chance = 1000,
	},
	{
		id = 2467,
		chance = 5500,
	},
	{
		id = 2148,
		chance = 15000,
		maxCount = 18,
	},
	{
		id = 1987,
		chance = 13000,
	},
	{
		id = 2015,
		chance = 9000,
	},
	{
		id = 2689,
		chance = 20000,
	},
	{
		id = 2193,
		chance = 100,
	},
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -100 },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_LIFEDRAIN, minDamage = -20, maxDamage = -50, range = 1, effect = CONST_ME_MAGIC_RED, target = false },
}

monster.defenses = {
	defense = 25,
	armor = 22,
	mitigation = 1.13,
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_HEALING, minDamage = 25, maxDamage = 49, effect = CONST_ME_MAGIC_BLUE, target = false },
	{ name = "speed", interval = 2000, chance = 15, speedChange = 300, effect = CONST_ME_MAGIC_RED, target = false, duration = 6000 },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = -10 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 0 },
	{ type = COMBAT_EARTHDAMAGE, percent = 0 },
	{ type = COMBAT_FIREDAMAGE, percent = 0 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
	{ type = COMBAT_HOLYDAMAGE, percent = -10 },
	{ type = COMBAT_DEATHDAMAGE, percent = 40 },
}

monster.immunities = {
	{ type = "paralyze", condition = false },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
