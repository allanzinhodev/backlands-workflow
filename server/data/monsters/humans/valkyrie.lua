local mType = Game.createMonsterType("Valkyrie")
local monster = {}

monster.name = "Valkyrie"
monster.description = "a valkyrie"
monster.experience = 85
monster.outfit = {
	lookType = 139,
	lookHead = 113,
	lookBody = 38,
	lookLegs = 76,
	lookFeet = 96,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 12
monster.Bestiary = {
	class = "Human",
	race = BESTY_RACE_HUMAN,
	toKill = 500,
	FirstUnlock = 25,
	SecondUnlock = 250,
	CharmsPoints = 15,
	Stars = 2,
	Occurrence = 0,
	Locations = "Amazon Camp (Venore), Amazon Camp (Carlin), Amazonia, \z
		single respawn to the north west of Thais, Foreigner Quarter in Yalahar.",
}

monster.health = 190
monster.maxHealth = 190
monster.race = "blood"
monster.corpse = 3065
monster.speed = 48
monster.manaCost = 450

monster.changeTarget = {
	interval = 4000,
	chance = 10,
}

monster.strategiesTarget = {
	nearest = 100,
}

monster.flags = {
	summonable = true,
	attackable = true,
	hostile = true,
	convinceable = true,
	pushable = false,
	rewardBoss = false,
	illusionable = true,
	canPushItems = true,
	canPushCreatures = false,
	staticAttackChance = 90,
	targetDistance = 1,
	runHealth = 10,
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
		text = "Stand still!",
		yell = false,
	},
	{
		text = "One more head for me!",
		yell = false,
	},
	{
		text = "Head off!",
		yell = false,
	},
}

monster.loot = {
	{
		id = 2389,
		chance = 60000,
		maxCount = 3,
	},
	{
		id = 2145,
		chance = 100,
	},
	{
		id = 2229,
		chance = 80000,
		maxCount = 2,
	},
	{
		id = 2674,
		chance = 7500,
		maxCount = 2,
	},
	{
		id = 2200,
		chance = 1100,
	},
	{
		id = 2463,
		chance = 800,
	},
	{
		id = 2666,
		chance = 30000,
		maxCount = 3,
	},
	{
		id = 2148,
		chance = 32000,
		maxCount = 12,
	},
	{
		id = 2387,
		chance = 400,
	},
	{
		id = 2379,
		chance = 25000,
	},
	{
		id = 2458,
		chance = 4000,
	},
	{
		id = 2464,
		chance = 10000,
	},
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -70 },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_PHYSICALDAMAGE, minDamage = 0, maxDamage = -50, range = 5, shootEffect = CONST_ANI_SPEAR, target = true },
}

monster.defenses = {
	defense = 12,
	armor = 12,
	mitigation = 0.36,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = -10 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 0 },
	{ type = COMBAT_EARTHDAMAGE, percent = 0 },
	{ type = COMBAT_FIREDAMAGE, percent = 10 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 10 },
	{ type = COMBAT_HOLYDAMAGE, percent = 5 },
	{ type = COMBAT_DEATHDAMAGE, percent = -5 },
}

monster.immunities = {
	{ type = "paralyze", condition = false },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = false },
	{ type = "bleed", condition = false },
}

mType:register(monster)
