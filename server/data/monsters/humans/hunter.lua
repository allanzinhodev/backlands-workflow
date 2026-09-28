local mType = Game.createMonsterType("Hunter")
local monster = {}

monster.name = "Hunter"
monster.description = "a hunter"
monster.experience = 150
monster.outfit = {
	lookType = 129,
	lookHead = 95,
	lookBody = 116,
	lookLegs = 120,
	lookFeet = 115,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 11
monster.Bestiary = {
	class = "Human",
	race = BESTY_RACE_HUMAN,
	toKill = 500,
	FirstUnlock = 25,
	SecondUnlock = 250,
	CharmsPoints = 15,
	Stars = 2,
	Occurrence = 0,
	Locations = "North of Mount Sternum, Plains of Havoc, Outlaw Camp, Dark Cathedral, Femor Hills, \z
		Maze of Lost Souls, north of the Amazon Camp, at the entrance and in the Hero Cave, \z
		a castle tower at Elvenbane, Trade Quarter, Smuggler camp on Tyrsung, Formorgar Mines.",
}

monster.health = 150
monster.maxHealth = 150
monster.race = "blood"
monster.corpse = 3058
monster.speed = 65
monster.manaCost = 530

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
	convinceable = true,
	pushable = false,
	rewardBoss = false,
	illusionable = true,
	canPushItems = true,
	canPushCreatures = false,
	staticAttackChance = 90,
	targetDistance = 4,
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
		text = "Guess who we are hunting, hahaha!",
		yell = false,
	},
}

monster.loot = {
	{
		id = 2050,
		chance = 5000,
	},
	{
		id = 2147,
		chance = 200,
	},
	{
		id = 2690,
		chance = 11000,
		maxCount = 2,
	},
	{
		id = 2675,
		chance = 20000,
		maxCount = 2,
	},
	{
		id = 2649,
		chance = 14000,
	},
	{
		id = 2461,
		chance = 10000,
	},
	{
		id = 2201,
		chance = 3000,
	},
	{
		id = 2546,
		chance = 5000,
		maxCount = 3,
	},
	{
		id = 2460,
		chance = 5000,
	},
	{
		id = 2465,
		chance = 5000,
	},
	{
		id = 2456,
		chance = 30000,
	},
	{
		id = 2544,
		chance = 40000,
		maxCount = 12,
	},
	{
		id = 2544,
		chance = 70000,
		maxCount = 10,
	},
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -20 },
	{ name = "combat", interval = 2000, chance = 50, type = COMBAT_PHYSICALDAMAGE, minDamage = 0, maxDamage = -100, range = 7, shootEffect = CONST_ANI_ARROW, target = true },
}

monster.defenses = {
	defense = 15,
	armor = 8,
	mitigation = 0.25,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = -5 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 0 },
	{ type = COMBAT_EARTHDAMAGE, percent = 0 },
	{ type = COMBAT_FIREDAMAGE, percent = 0 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
	{ type = COMBAT_HOLYDAMAGE, percent = 20 },
	{ type = COMBAT_DEATHDAMAGE, percent = 0 },
}

monster.immunities = {
	{ type = "paralyze", condition = false },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = false },
	{ type = "bleed", condition = false },
}

mType:register(monster)
