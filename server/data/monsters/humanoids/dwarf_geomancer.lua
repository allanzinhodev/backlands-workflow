local mType = Game.createMonsterType("Dwarf Geomancer")
local monster = {}

monster.name = "Dwarf Geomancer"
monster.description = "a dwarf geomancer"
monster.experience = 245
monster.outfit = {
	lookType = 66,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 66
monster.Bestiary = {
	class = "Humanoid",
	race = BESTY_RACE_HUMANOID,
	toKill = 1000,
	FirstUnlock = 50,
	SecondUnlock = 500,
	CharmsPoints = 25,
	Stars = 3,
	Occurrence = 0,
	Locations = "Mount Sternum Undead Cave, Dwarf Mines, Circle Room in Kazordoon, Triangle Tower, \z
		Tiquanda Dwarf Cave, Cormaya Dwarven Cave, Beregar Mines.",
}

monster.health = 380
monster.maxHealth = 380
monster.race = "blood"
monster.corpse = 2987
monster.speed = 60
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
	illusionable = true,
	canPushItems = true,
	canPushCreatures = true,
	staticAttackChance = 70,
	targetDistance = 4,
	runHealth = 150,
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
		text = "Hail Durin!",
		yell = false,
	},
	{
		text = "Earth is the strongest element.",
		yell = false,
	},
	{
		text = "Dust to dust.",
		yell = false,
	},
}

monster.loot = {
	{
		id = 2787,
		chance = 60000,
		maxCount = 2,
	},
	{
		id = 2468,
		chance = 20000,
	},
	{
		id = 2175,
		chance = 400,
	},
	{
		id = 2481,
		chance = 8000,
	},
	{
		id = 2146,
		chance = 100,
	},
	{
		id = 2673,
		chance = 18000,
		maxCount = 2,
	},
	{
		id = 2162,
		chance = 12000,
	},
	{
		id = 2643,
		chance = 40000,
	},
	{
		id = 2148,
		chance = 70000,
		maxCount = 30,
	},
	{
		id = 2213,
		chance = 300,
	},
	{
		id = 2423,
		chance = 1000,
	},
	{
		id = 2260,
		chance = 10000,
	},
	{
		id = 1987,
		chance = 50000,
	},
}

monster.attacks = {
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_EARTHDAMAGE, minDamage = -50, maxDamage = -110, range = 7, shootEffect = CONST_ANI_SMALLEARTH, effect = CONST_ME_GREEN_RINGS, target = true },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_MANADRAIN, minDamage = -50, maxDamage = -80, range = 7, target = false },
}

monster.defenses = {
	defense = 15,
	armor = 15,
	mitigation = 0.91,
	{ name = "combat", interval = 2000, chance = 40, type = COMBAT_HEALING, minDamage = 75, maxDamage = 125, effect = CONST_ME_MAGIC_BLUE, target = false },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 10 },
	{ type = COMBAT_EARTHDAMAGE, percent = 20 },
	{ type = COMBAT_FIREDAMAGE, percent = 60 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = -5 },
	{ type = COMBAT_HOLYDAMAGE, percent = 10 },
	{ type = COMBAT_DEATHDAMAGE, percent = -10 },
}

monster.immunities = {
	{ type = "paralyze", condition = false },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
