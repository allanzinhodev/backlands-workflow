local mType = Game.createMonsterType("Demodras")
local monster = {}

monster.name = "Demodras"
monster.description = "Demodras"
monster.experience = 4000
monster.outfit = {
	lookType = 204,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.health = 3750
monster.maxHealth = 3750
monster.race = "blood"
monster.corpse = 2881
monster.speed = 77
monster.manaCost = 0

monster.changeTarget = {
	interval = 5000,
	chance = 8,
}

monster.strategiesTarget = {
	nearest = 70,
	health = 10,
	damage = 10,
	random = 10,
}

monster.flags = {
	summonable = false,
	attackable = true,
	hostile = true,
	convinceable = false,
	pushable = false,
	rewardBoss = true,
	illusionable = true,
	canPushItems = true,
	canPushCreatures = true,
	staticAttackChance = 90,
	targetDistance = 1,
	runHealth = 300,
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

monster.summon = {
	maxSummons = 2,
	summons = {
		{
			name = "Dragon Lord",
			interval = 6000,
			chance = 100,
			count = 2,
		},
	},
}

monster.voices = {
	interval = 5000,
	chance = 10,
	{
		text = "ZCHHHHH",
		yell = true,
	},
	{
		text = "I WILL SET THE WORLD IN FIRE!",
		yell = true,
	},
	{
		text = "I WILL PROTECT MY BROOD!",
		yell = true,
	},
}

monster.loot = {
	{
		id = 2528,
		chance = 600,
	},
	{
		id = 2479,
		chance = 800,
	},
	{
		id = 2146,
		chance = 10000,
	},
	{
		id = 2498,
		chance = 400,
	},
	{
		id = 2547,
		chance = 16000,
	},
	{
		id = 2177,
		chance = 1200,
	},
	{
		id = 2796,
		chance = 24000,
		maxCount = 7,
	},
	{
		id = 2033,
		chance = 6000,
	},
	{
		id = 2148,
		chance = 55000,
		maxCount = 50,
	},
	{
		id = 2148,
		chance = 80000,
		maxCount = 100,
	},
	{
		id = 2148,
		chance = 95000,
		maxCount = 100,
	},
	{
		id = 2392,
		chance = 600,
	},
	{
		id = 2167,
		chance = 10000,
	},
	{
		id = 2492,
		chance = 300,
	},
	{
		id = 2672,
		chance = 75000,
		maxCount = 10,
	},
	{
		id = 1976,
		chance = 9000,
	},
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = -160, maxDamage = -600 },
	{ name = "combat", interval = 3000, chance = 20, type = COMBAT_FIREDAMAGE, minDamage = -250, maxDamage = -350, range = 7, radius = 4, shootEffect = CONST_ANI_FIRE, effect = CONST_ME_FIREAREA, target = true },
	{ name = "firefield", interval = 1000, chance = 10, range = 7, radius = 6, shootEffect = CONST_ANI_FIRE, target = true },
	{ name = "combat", interval = 4000, chance = 20, type = COMBAT_FIREDAMAGE, minDamage = -250, maxDamage = -550, length = 8, spread = 3, effect = CONST_ME_FIREAREA, target = false },
}

monster.defenses = {
	defense = 25,
	armor = 45,
	mitigation = 1.99,
	{ name = "combat", interval = 1000, chance = 25, type = COMBAT_HEALING, minDamage = 400, maxDamage = 700, effect = CONST_ME_MAGIC_BLUE, target = false },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 0 },
	{ type = COMBAT_EARTHDAMAGE, percent = 0 },
	{ type = COMBAT_FIREDAMAGE, percent = 100 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = 0 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
