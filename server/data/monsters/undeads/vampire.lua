local mType = Game.createMonsterType("Vampire")
local monster = {}

monster.name = "Vampire"
monster.description = "a vampire"
monster.experience = 290
monster.outfit = {
	lookType = 68,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 68
monster.Bestiary = {
	class = "Undead",
	race = BESTY_RACE_UNDEAD,
	toKill = 1000,
	FirstUnlock = 50,
	SecondUnlock = 500,
	CharmsPoints = 25,
	Stars = 3,
	Occurrence = 0,
	Locations = "Drefia, Ghost Ship between Venore and Darashia, some Ankrahmun Tombs, Lich Hell, \z
		Serpentine Tower (unreachable), Ghostlands (unreachable). House between Plains of Havoc and Dark Cathedral, \z
		Hellgate (only during Zevelon Duskbringer raid), Edron Undead Cave, Vengoth Castle (and mountains before door), \z
		Edron Vampire Crypt.",
}

monster.health = 450
monster.maxHealth = 450
monster.race = "undead"
monster.corpse = 2956
monster.speed = 70
monster.manaCost = 0

monster.changeTarget = {
	interval = 4000,
	chance = 10,
}

monster.strategiesTarget = {
	nearest = 70,
	health = 30,
}

monster.flags = {
	summonable = false,
	attackable = true,
	hostile = true,
	convinceable = false,
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
		text = "BLOOD!",
		yell = true,
	},
	{
		text = "Let me kiss your neck.",
		yell = false,
	},
	{
		text = "I smell warm blood.",
		yell = false,
	},
	{
		text = "I call you, my bats! Come!",
		yell = false,
	},
}

monster.loot = {
	{
		id = 2534,
		chance = 100,
	},
	{
		id = 2479,
		chance = 400,
	},
	{
		id = 2383,
		chance = 1000,
	},
	{
		id = 2229,
		chance = 10000,
	},
	{
		id = 2649,
		chance = 8000,
	},
	{
		id = 2412,
		chance = 15000,
	},
	{
		id = 2396,
		chance = 300,
	},
	{
		id = 2747,
		chance = 18000,
	},
	{
		id = 2148,
		chance = 15000,
		maxCount = 20,
	},
	{
		id = 2127,
		chance = 200,
	},
	{
		id = 2172,
		chance = 200,
	},
	{
		id = 2032,
		chance = 11000,
	},
	{
		id = 2144,
		chance = 1500,
	},
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -150 },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_LIFEDRAIN, minDamage = -50, maxDamage = -200, range = 1, effect = CONST_ME_SMALLCLOUDS, target = true },
	{ name = "speed", interval = 2000, chance = 15, speedChange = -400, range = 1, effect = CONST_ME_MAGIC_RED, target = true, duration = 60000 },
}

monster.defenses = {
	defense = 30,
	armor = 28,
	mitigation = 1.04,
	{ name = "outfit", interval = 4000, chance = 10, effect = CONST_ME_GROUNDSHAKER, target = false, duration = 5000, outfitMonster = "bat" },
	{ name = "speed", interval = 2000, chance = 15, speedChange = 300, effect = CONST_ME_MAGIC_RED, target = false, duration = 3000 },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_HEALING, minDamage = 15, maxDamage = 25, target = false },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 25 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 0 },
	{ type = COMBAT_EARTHDAMAGE, percent = 100 },
	{ type = COMBAT_FIREDAMAGE, percent = -10 },
	{ type = COMBAT_LIFEDRAIN, percent = 100 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 100 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
	{ type = COMBAT_HOLYDAMAGE, percent = -25 },
	{ type = COMBAT_DEATHDAMAGE, percent = 100 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
