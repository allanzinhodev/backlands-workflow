local mType = Game.createMonsterType("Lich")
local monster = {}

monster.name = "Lich"
monster.description = "a lich"
monster.experience = 900
monster.outfit = {
	lookType = 99,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 99
monster.Bestiary = {
	class = "Undead",
	race = BESTY_RACE_UNDEAD,
	toKill = 1000,
	FirstUnlock = 50,
	SecondUnlock = 500,
	CharmsPoints = 25,
	Stars = 3,
	Occurrence = 0,
	Locations = "Ankrahmun Library Tomb, Ancient Ruins Tomb, Oasis Tomb, Mountain Tomb, Drefia, Kharos, \z
		Pits of Inferno, Lich Hell in Ramoa, Cemetery Quarter in Yalahar, underground of Fenrock (on the way to Beregar). \z
		Can also be seen during an undead raid in Darashia or Carlin.",
}

monster.health = 880
monster.maxHealth = 880
monster.race = "undead"
monster.corpse = 3025
monster.speed = 65
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
	rewardBoss = false,
	illusionable = false,
	canPushItems = true,
	canPushCreatures = true,
	staticAttackChance = 80,
	targetDistance = 1,
	runHealth = 0,
	healthHidden = false,
	isBlockable = false,
	canWalkOnEnergy = true,
	canWalkOnFire = false,
	canWalkOnPoison = true,
}

monster.light = {
	level = 0,
	color = 0,
}

monster.summon = {
	maxSummons = 4,
	summons = {
		{
			name = "Bonebeast",
			interval = 6000,
			chance = 100,
			count = 4,
		},
	},
}

monster.voices = {
	interval = 5000,
	chance = 10,
	{
		text = "Death awaits all!",
		yell = false,
	},
	{
		text = "Doomed be the living!",
		yell = false,
	},
	{
		text = "Death and Decay!",
		yell = false,
	},
	{
		text = "You will endure agony beyond thy death!",
		yell = false,
	},
	{
		text = "Come to me my children!",
		yell = false,
	},
	{
		text = "Pain sweet pain!",
		yell = false,
	},
	{
		text = "Thy living flesh offends me!",
		yell = false,
	},
}

monster.loot = {
	{
		id = 2143,
		chance = 2500,
	},
	{
		id = 2479,
		chance = 500,
	},
	{
		id = 2401,
		chance = 60000,
	},
	{
		id = 2175,
		chance = 10000,
	},
	{
		id = 2214,
		chance = 1000,
	},
	{
		id = 2171,
		chance = 100,
	},
	{
		id = 2178,
		chance = 500,
	},
	{
		id = 2148,
		chance = 40000,
		maxCount = 40,
	},
	{
		id = 2148,
		chance = 30000,
		maxCount = 80,
	},
	{
		id = 2237,
		chance = 20000,
	},
	{
		id = 2535,
		chance = 200,
	},
	{
		id = 2656,
		chance = 100,
	},
	{
		id = 2144,
		chance = 5000,
	},
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -75 },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_LIFEDRAIN, minDamage = -140, maxDamage = -190, length = 7, spread = 0, effect = CONST_ME_MAGIC_RED, target = false }, -- poison
	{ name = "condition", interval = 2000, chance = 10, target = false, condition =
	{ type = CONDITION_POISON, minDamage = -300, maxDamage = -400, length = 7, spread = 0, effect = CONST_ME_HITBYPOISON } },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_LIFEDRAIN, minDamage = -200, maxDamage = -245, range = 1, effect = CONST_ME_MAGIC_RED, target = true },
	{ name = "speed", interval = 2000, chance = 15, speedChange = -300, range = 7, effect = CONST_ME_MAGIC_RED, target = false, duration = 30000 },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_LIFEDRAIN, minDamage = -130, maxDamage = -195, radius = 3, effect = CONST_ME_MAGIC_RED, target = false },
}

monster.defenses = {
	defense = 25,
	armor = 50,
	mitigation = 1.60,
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_HEALING, minDamage = 80, maxDamage = 100, effect = CONST_ME_MAGIC_BLUE, target = false },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 80 },
	{ type = COMBAT_EARTHDAMAGE, percent = 100 },
	{ type = COMBAT_FIREDAMAGE, percent = 0 },
	{ type = COMBAT_LIFEDRAIN, percent = 100 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
	{ type = COMBAT_HOLYDAMAGE, percent = -20 },
	{ type = COMBAT_DEATHDAMAGE, percent = 100 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
