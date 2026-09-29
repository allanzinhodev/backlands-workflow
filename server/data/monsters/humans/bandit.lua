local mType = Game.createMonsterType("Bandit")
local monster = {}

monster.name = "Bandit"
monster.description = "a bandit"
monster.experience = 65
monster.outfit = {
	lookType = 129,
	lookHead = 58,
	lookBody = 40,
	lookLegs = 24,
	lookFeet = 95,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 223
monster.Bestiary = {
	class = "Human",
	race = BESTY_RACE_HUMAN,
	toKill = 500,
	FirstUnlock = 25,
	SecondUnlock = 250,
	CharmsPoints = 15,
	Stars = 2,
	Occurrence = 0,
	Locations = "Dark Cathedral, Tiquanda Bandit Caves, Outlaw Camp, mountain pass west of Ankrahmun, \z
		Tyrsung, Thais Bandit Cave, Formorgar Mines. Also summoned by Gamel.",
}

monster.health = 245
monster.maxHealth = 245
monster.race = "blood"
monster.corpse = 4240
monster.speed = 50
monster.manaCost = 450

monster.changeTarget = {
	interval = 5000,
	chance = 0,
}

monster.strategiesTarget = {
	nearest = 100,
}

monster.flags = {
	summonable = true,
	attackable = true,
	hostile = true,
	convinceable = true,
	pushable = true,
	rewardBoss = false,
	illusionable = true,
	canPushItems = true,
	canPushCreatures = false,
	staticAttackChance = 90,
	targetDistance = 1,
	runHealth = 25,
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
		text = "Your money or your life!",
		yell = false,
	},
	{
		text = "Hand me your purse!",
		yell = false,
	},
}

monster.loot = {
	{
		id = 3279,
		chance = 100,
	},
	{
		id = 3577,
		chance = 10000,
	},
	{
		id = 3286,
		chance = 10000,
	},
	{
		id = 3559,
		chance = 15000,
	},
	{
		id = 3353,
		chance = 500,
	},
	{
		id = 3031,
		chance = 15000,
		maxCount = 10,
	},
	{
		id = 3031,
		chance = 40000,
		maxCount = 20,
	},
	{
		id = 3352,
		chance = 5000,
	},
	{
		id = 3411,
		chance = 17000,
	},
	{
		id = 3359,
		chance = 2500,
	},
	{
		id = 3274,
		chance = 30000,
	},
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -45 },
}

monster.defenses = {
	defense = 15,
	armor = 11,
	mitigation = 0.43,
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
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = -5 },
}

monster.immunities = {
	{ type = "paralyze", condition = false },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = false },
	{ type = "bleed", condition = false },
}

mType:register(monster)
