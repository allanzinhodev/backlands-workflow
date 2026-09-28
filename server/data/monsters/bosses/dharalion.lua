local mType = Game.createMonsterType("Dharalion")
local monster = {}

monster.description = "Dharalion"
monster.experience = 380
monster.outfit = {
	lookType = 203,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.bosstiary = {
	bossRaceId = 203,
	bossRace = RARITY_NEMESIS,
}

monster.health = 390
monster.maxHealth = 390
monster.race = "blood"
monster.corpse = 2979
monster.speed = 72
monster.manaCost = 0

monster.changeTarget = {
	interval = 5000,
	chance = 8,
}

monster.strategiesTarget = {
	nearest = 10,
	health = 10,
	damage = 20,
	random = 60,
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
			name = "Demon Skeleton",
			interval = 18000,
			chance = 100,
			count = 2,
		},
	},
}

monster.voices = {
	interval = 5000,
	chance = 10,
	{
		text = "You desecrated this temple!",
		yell = false,
	},
	{
		text = "Noone will stop my ascension!",
		yell = false,
	},
	{
		text = "My powers are divine!",
		yell = false,
	},
	{
		text = "Muahahaha!",
		yell = false,
	},
}

monster.loot = {
	{
		id = 2154,
		chance = 400,
	},
	{
		id = 2401,
		chance = 11000,
	},
	{
		id = 2802,
		chance = 7000,
	},
	{
		id = 1949,
		chance = 30000,
	},
	{
		id = 2642,
		chance = 9000,
	},
	{
		id = 2682,
		chance = 20000,
	},
	{
		id = 2177,
		chance = 1500,
	},
	{
		id = 2600,
		chance = 9000,
	},
	{
		id = 2652,
		chance = 9000,
	},
	{
		id = 2747,
		chance = 9000,
	},
	{
		id = 2198,
		chance = 2000,
	},
	{
		id = 2047,
		chance = 9000,
	},
	{
		id = 2689,
		chance = 14000,
	},
	{
		id = 2032,
		chance = 6500,
	},
	{
		id = 2260,
		chance = 18000,
	},
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, skill = 30, attack = 28 },
	{ name = "combat", interval = 1000, chance = 15, type = COMBAT_MANADRAIN, minDamage = -30, maxDamage = -60, range = 7, target = false },
	{ name = "combat", interval = 1000, chance = 13, type = COMBAT_ENERGYDAMAGE, minDamage = -70, maxDamage = -90, range = 7, shootEffect = CONST_ANI_ENERGY, effect = CONST_ME_ENERGYHIT, target = false },
	{ name = "combat", interval = 1000, chance = 10, type = COMBAT_PHYSICALDAMAGE, minDamage = -80, maxDamage = -151, range = 7, shootEffect = CONST_ANI_SUDDENDEATH, target = false },
	{ name = "effect", interval = 1000, chance = 13, range = 7, shootEffect = CONST_ANI_POISON, effect = CONST_ME_POISONAREA, target = false },
}

monster.defenses = {
	defense = 25,
	armor = 15,
	--	mitigation = ???,
	{ name = "combat", interval = 1000, chance = 20, type = COMBAT_HEALING, minDamage = 90, maxDamage = 120, effect = CONST_ME_MAGIC_BLUE, target = false },
	{ name = "speed", interval = 1000, chance = 7, speedChange = 300, effect = CONST_ME_MAGIC_RED, target = false, duration = 10000 },
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
	{ type = COMBAT_HOLYDAMAGE, percent = -10 },
	{ type = COMBAT_DEATHDAMAGE, percent = 0 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
