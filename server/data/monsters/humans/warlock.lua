local mType = Game.createMonsterType("Warlock")
local monster = {}

monster.description = "a warlock"
monster.experience = 4000
monster.outfit = {
	lookType = 130,
	lookHead = 0,
	lookBody = 52,
	lookLegs = 128,
	lookFeet = 95,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 10
monster.Bestiary = {
	class = "Human",
	race = BESTY_RACE_HUMAN,
	toKill = 1000,
	FirstUnlock = 50,
	SecondUnlock = 500,
	CharmsPoints = 25,
	Stars = 3,
	Occurrence = 0,
	Locations = "Demona, Ghostland (Banshee Quest area), Temple of Xayepocax, Oasis Tomb, Kharos, Magician Quarter, \z
		beneath Fenrock, The Arcanum.",
}

monster.health = 3200
monster.maxHealth = 3200
monster.race = "blood"
monster.corpse = 3058
monster.speed = 75
monster.manaCost = 0

monster.changeTarget = {
	interval = 4000,
	chance = 10,
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
	rewardBoss = false,
	illusionable = false,
	canPushItems = true,
	canPushCreatures = true,
	staticAttackChance = 90,
	targetDistance = 4,
	runHealth = 1000,
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
	maxSummons = 1,
	summons = {
		{
			name = "Stone Golem",
			interval = 10000,
			chance = 100,
			count = 1,
		},
	},
}

monster.voices = {
	interval = 5000,
	chance = 10,
	{
		text = "Learn the secret of our magic! YOUR death!",
		yell = false,
	},
	{
		text = "Even a rat is a better mage than you.",
		yell = false,
	},
	{
		text = "We don't like intruders!",
		yell = false,
	},
}

monster.loot = {
	{
		id = 2185,
		chance = 1,
	},
	{
		id = 2151,
		chance = 1100,
	},
	{
		id = 2197,
		chance = 500,
	},
	{
		id = 2146,
		chance = 1400,
	},
	{
		id = 2436,
		chance = 7000,
	},
	{
		id = 2123,
		chance = 200,
	},
	{
		id = 1986,
		chance = 400,
	},
	{
		id = 2411,
		chance = 10000,
	},
	{
		id = 2178,
		chance = 2500,
	},
	{
		id = 2600,
		chance = 13000,
	},
	{
		id = 2466,
		chance = 300,
	},
	{
		id = 2148,
		chance = 30000,
		maxCount = 80,
	},
	{
		id = 2167,
		chance = 3000,
	},
	{
		id = 2792,
		chance = 3000,
	},
	{
		id = 2124,
		chance = 1000,
	},
	{
		id = 2679,
		chance = 20000,
		maxCount = 4,
	},
	{
		id = 2047,
		chance = 15000,
	},
	{
		id = 2689,
		chance = 11000,
	},
	{
		id = 2656,
		chance = 2000,
	},
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -130 },
	{ name = "combat", interval = 2000, chance = 25, type = COMBAT_ENERGYDAMAGE, minDamage = -90, maxDamage = -180, range = 7, shootEffect = CONST_ANI_ENERGY, target = false },
	{ name = "warlock skill reducer", interval = 2000, chance = 5, range = 5, target = false },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_MANADRAIN, minDamage = 0, maxDamage = -120, range = 7, target = false },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_FIREDAMAGE, minDamage = -50, maxDamage = -180, range = 7, radius = 3, shootEffect = CONST_ANI_BURSTARROW, effect = CONST_ME_FIREAREA, target = true },
	{ name = "firefield", interval = 2000, chance = 10, range = 7, radius = 2, shootEffect = CONST_ANI_FIRE, target = true },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_ENERGYDAMAGE, minDamage = -150, maxDamage = -230, length = 8, spread = 0, effect = CONST_ME_BIGCLOUDS, target = false },
	{ name = "speed", interval = 2000, chance = 15, speedChange = -600, range = 7, effect = CONST_ME_MAGIC_RED, target = false, duration = 20000 },
}

monster.defenses = {
	defense = 20,
	armor = 33,
	mitigation = 1.32,
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_HEALING, minDamage = 100, maxDamage = 225, effect = CONST_ME_MAGIC_BLUE, target = false },
	{ name = "invisible", interval = 2000, chance = 20, effect = CONST_ME_MAGIC_BLUE },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = -5 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 100 },
	{ type = COMBAT_EARTHDAMAGE, percent = 95 },
	{ type = COMBAT_FIREDAMAGE, percent = 100 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 100 },
	{ type = COMBAT_HOLYDAMAGE, percent = -8 },
	{ type = COMBAT_DEATHDAMAGE, percent = 0 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
