local mType = Game.createMonsterType("Orc Warlord")
local monster = {}

monster.name = "Orc Warlord"
monster.description = "an orc warlord"
monster.experience = 670
monster.outfit = {
	lookType = 2,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 2
monster.Bestiary = {
	class = "Humanoid",
	race = BESTY_RACE_HUMANOID,
	toKill = 1000,
	FirstUnlock = 50,
	SecondUnlock = 500,
	CharmsPoints = 25,
	Stars = 3,
	Occurrence = 0,
	Locations = "Orc Fortress, Foreigner Quarter, Zao Orc Land.",
}

monster.health = 950
monster.maxHealth = 950
monster.race = "blood"
monster.corpse = 2967
monster.speed = 77
monster.manaCost = 0

monster.changeTarget = {
	interval = 4000,
	chance = 10,
}

monster.strategiesTarget = {
	nearest = 70,
	health = 15,
	damage = 15,
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
	targetDistance = 1,
	runHealth = 0,
	healthHidden = false,
	isBlockable = false,
	canWalkOnEnergy = false,
	canWalkOnFire = true,
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
		text = "Ranat Ulderek!",
		yell = false,
	},
	{
		text = "Orc buta bana!",
		yell = false,
	},
	{
		text = "Ikem rambo zambo!",
		yell = false,
	},
	{
		text = "Futchi maruk buta!",
		yell = false,
	},
}

monster.loot = {
	{
		id = 2377,
		chance = 2000,
	},
	{
		id = 2399,
		chance = 30000,
		maxCount = 40,
	},
	{
		id = 2165,
		chance = 100,
	},
	{
		id = 2419,
		chance = 12000,
	},
	{
		id = 2200,
		chance = 2000,
	},
	{
		id = 2647,
		chance = 4000,
	},
	{
		id = 2463,
		chance = 6000,
	},
	{
		id = 2428,
		chance = 15000,
	},
	{
		id = 2666,
		chance = 20000,
		maxCount = 2,
	},
	{
		id = 2148,
		chance = 19000,
		maxCount = 45,
	},
	{
		id = 2667,
		chance = 10000,
		maxCount = 2,
	},
	{
		id = 2434,
		chance = 200,
	},
	{
		id = 2490,
		chance = 1500,
	},
	{
		id = 2497,
		chance = 200,
	},
	{
		id = 2478,
		chance = 10000,
	},
	{
		id = 2465,
		chance = 1000,
	},
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -250 },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_PHYSICALDAMAGE, minDamage = 0, maxDamage = -200, range = 7, shootEffect = CONST_ANI_THROWINGSTAR, target = true },
}

monster.defenses = {
	defense = 35,
	armor = 28,
	mitigation = 1.46,
	{ name = "invisible", interval = 2000, chance = 5, effect = CONST_ME_MAGIC_BLUE },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 20 },
	{ type = COMBAT_EARTHDAMAGE, percent = -10 },
	{ type = COMBAT_FIREDAMAGE, percent = 80 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
	{ type = COMBAT_HOLYDAMAGE, percent = 10 },
	{ type = COMBAT_DEATHDAMAGE, percent = -5 },
}

monster.immunities = {
	{ type = "paralyze", condition = false },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
