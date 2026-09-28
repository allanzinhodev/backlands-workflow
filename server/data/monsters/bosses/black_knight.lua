local mType = Game.createMonsterType("Black Knight")
local monster = {}

monster.name = "Black Knight"
monster.description = "Black Knight"
monster.experience = 1600
monster.outfit = {
	lookType = 131,
	lookHead = 95,
	lookBody = 95,
	lookLegs = 95,
	lookFeet = 95,
	lookAddons = 0,
	lookMount = 0,
}

monster.bosstiary = {
	bossRaceId = 46,
	bossRace = RARITY_BANE,
}

monster.health = 1800
monster.maxHealth = 1800
monster.race = "blood"
monster.corpse = 3058
monster.speed = 155
monster.manaCost = 0

monster.changeTarget = {
	interval = 4000,
	chance = 10,
}

monster.strategiesTarget = {
	nearest = 80,
	health = 10,
	damage = 10,
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
	canWalkOnEnergy = true,
	canWalkOnFire = true,
	canWalkOnPoison = true,
}

monster.light = {
	level = 0,
	color = 0,
}

monster.voices = {
	interval = 5000,
	chance = 10,
	{
		text = "MINE!",
		yell = true,
	},
	{
		text = "NO PRISONERS!",
		yell = true,
	},
	{
		text = "NO MERCY!",
		yell = true,
	},
	{
		text = "By Bolg's Blood!",
		yell = false,
	},
	{
		text = "You're no match for me!",
		yell = false,
	},
}

monster.loot = {
	{
		id = 2475,
		chance = 5000,
	},
	{
		id = 2377,
		chance = 10000,
	},
	{
		id = 2457,
		chance = 10000,
	},
	{
		id = 2389,
		chance = 30000,
		maxCount = 3,
	},
	{
		id = 2133,
		chance = 800,
	},
	{
		id = 2120,
		chance = 15000,
	},
	{
		id = 2463,
		chance = 10000,
	},
	{
		id = 2477,
		chance = 1000,
	},
	{
		id = 2430,
		chance = 2500,
	},
	{
		id = 2476,
		chance = 1000,
	},
	{
		id = 2381,
		chance = 13000,
	},
	{
		id = 2148,
		chance = 22200,
		maxCount = 90,
	},
	{
		id = 2148,
		chance = 33300,
		maxCount = 60,
	},
	{
		id = 2414,
		chance = 300,
	},
	{
		id = 2490,
		chance = 2000,
	},
	{
		id = 2489,
		chance = 2000,
	},
	{
		id = 2691,
		chance = 20000,
		maxCount = 2,
	},
	{
		id = 2478,
		chance = 13000,
	},
	{
		id = 2195,
		chance = 500,
	},
	{
		id = 2417,
		chance = 7000,
	},
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -300 },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_PHYSICALDAMAGE, minDamage = 0, maxDamage = -200, range = 7, shootEffect = CONST_ANI_SPEAR, target = true },
}

monster.defenses = {
	defense = 40,
	armor = 42,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 10 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 80 },
	{ type = COMBAT_EARTHDAMAGE, percent = 100 },
	{ type = COMBAT_FIREDAMAGE, percent = 95 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 100 },
	{ type = COMBAT_HOLYDAMAGE, percent = -8 },
	{ type = COMBAT_DEATHDAMAGE, percent = 20 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
