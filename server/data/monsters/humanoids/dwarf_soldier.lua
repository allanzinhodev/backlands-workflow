local mType = Game.createMonsterType("Dwarf Soldier")
local monster = {}

monster.name = "Dwarf Soldier"
monster.description = "a dwarf soldier"
monster.experience = 70
monster.outfit = {
	lookType = 71,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 71
monster.Bestiary = {
	class = "Humanoid",
	race = BESTY_RACE_HUMANOID,
	toKill = 500,
	FirstUnlock = 25,
	SecondUnlock = 250,
	CharmsPoints = 15,
	Stars = 2,
	Occurrence = 0,
	Locations = "Kazordoon Dwarf Mines, Cyclopolis, Dwacatra, Ferngrims Gate, Dwarf Bridge, \z
		Mount Sternum Undead Cave, Beregar, Tiquanda Dwarf Cave, Cormaya Dwarf Cave.",
}

monster.health = 135
monster.maxHealth = 135
monster.race = "blood"
monster.corpse = 2985
monster.speed = 48
monster.manaCost = 360

monster.changeTarget = {
	interval = 4000,
	chance = 10,
}

monster.strategiesTarget = {
	nearest = 100,
}

monster.flags = {
	summonable = true,
	attackable = true,
	hostile = true,
	convinceable = true,
	pushable = false,
	rewardBoss = false,
	illusionable = true,
	canPushItems = true,
	canPushCreatures = false,
	staticAttackChance = 90,
	targetDistance = 1,
	runHealth = 0,
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
		text = "Hail Durin!",
		yell = false,
	},
}

monster.loot = {
	{
		id = 2787,
		chance = 40000,
		maxCount = 2,
	},
	{
		id = 2481,
		chance = 12000,
	},
	{
		id = 2554,
		chance = 10000,
	},
	{
		id = 2148,
		chance = 35000,
		maxCount = 12,
	},
	{
		id = 2525,
		chance = 5000,
	},
	{
		id = 2455,
		chance = 4000,
	},
	{
		id = 2464,
		chance = 9000,
	},
	{
		id = 2543,
		chance = 40000,
		maxCount = 4,
	},
	{
		id = 2378,
		chance = 2500,
	},
	{
		id = 2208,
		chance = 100,
	},
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -70 },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_PHYSICALDAMAGE, minDamage = 0, maxDamage = -60, range = 7, shootEffect = CONST_ANI_BOLT, target = true },
}

monster.defenses = {
	defense = 15,
	armor = 9,
	mitigation = 0.51,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 0 },
	{ type = COMBAT_EARTHDAMAGE, percent = 10 },
	{ type = COMBAT_FIREDAMAGE, percent = -5 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = -5 },
}

monster.immunities = {
	{ type = "paralyze", condition = false },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = false },
	{ type = "bleed", condition = false },
}

mType:register(monster)
