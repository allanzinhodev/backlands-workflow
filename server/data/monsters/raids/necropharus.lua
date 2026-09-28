local mType = Game.createMonsterType("Necropharus")
local monster = {}

monster.name = "Necropharus"
monster.description = "Necropharus"
monster.experience = 700
monster.outfit = {
	lookType = 209,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.health = 750
monster.maxHealth = 750
monster.race = "blood"
monster.corpse = 3058
monster.speed = 60
monster.manaCost = 0

monster.changeTarget = {
	interval = 5000,
	chance = 8,
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
	targetDistance = 4,
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

monster.summon = {
	maxSummons = 2,
	summons = {
		{
			name = "Mummy",
			interval = 7000,
			chance = 100,
			count = 1,
		},
		{
			name = "Ghost",
			interval = 6000,
			chance = 100,
			count = 1,
		},
		{
			name = "Ghoul",
			interval = 5000,
			chance = 100,
			count = 2,
		},
	},
}

monster.voices = {
	interval = 5000,
	chance = 10,
	{
		text = "You will rise as my servant!",
		yell = false,
	},
	{
		text = "Praise to my master Urgith!",
		yell = false,
	},
}

monster.loot = {
	{
		id = 2436,
		chance = 400,
	},
	{
		id = 2229,
		chance = 16000,
	},
	{
		id = 2406,
		chance = 8600,
	},
	{
		id = 2483,
		chance = 8500,
	},
	{
		id = 2663,
		chance = 1800,
	},
	{
		id = 2796,
		chance = 22500,
	},
	{
		id = 2148,
		chance = 67300,
		maxCount = 99,
	},
	{
		id = 2423,
		chance = 5700,
	},
	{
		id = 2195,
		chance = 200,
	},
	{
		id = 2541,
		chance = 7500,
	},
	{
		id = 2449,
		chance = 19900,
	},
	{
		id = 2230,
		chance = 30000,
	},
	{
		id = 2231,
		chance = 6000,
	},
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -80, condition = { type = CONDITION_POISON, totalDamage = 8, interval = 4000 } },
	{ name = "combat", interval = 3000, chance = 70, type = COMBAT_PHYSICALDAMAGE, minDamage = -60, maxDamage = -217, range = 5, shootEffect = CONST_ANI_SUDDENDEATH, effect = CONST_ME_MORTAREA, target = true },
	{ name = "combat", interval = 1000, chance = 20, type = COMBAT_LIFEDRAIN, minDamage = -80, maxDamage = -120, range = 1, target = false },
	{ name = "combat", interval = 1000, chance = 17, type = COMBAT_FIREDAMAGE, minDamage = -50, maxDamage = -140, range = 7, shootEffect = CONST_ANI_FIRE, effect = CONST_ME_HITBYFIRE, target = true },
	{ name = "combat", interval = 1000, chance = 17, type = COMBAT_ENERGYDAMAGE, minDamage = -50, maxDamage = -140, range = 7, shootEffect = CONST_ANI_ENERGY, effect = CONST_ME_ENERGYHIT, target = true },
}

monster.defenses = {
	defense = 25,
	armor = 25,
	mitigation = 1.18,
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_HEALING, minDamage = 0, maxDamage = 300, effect = CONST_ME_MAGIC_BLUE, target = false },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 0 },
	{ type = COMBAT_EARTHDAMAGE, percent = 0 },
	{ type = COMBAT_FIREDAMAGE, percent = 0 },
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
