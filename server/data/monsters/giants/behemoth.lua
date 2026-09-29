local mType = Game.createMonsterType("Behemoth")
local monster = {}

monster.name = "Behemoth"
monster.description = "a behemoth"
monster.experience = 2500
monster.outfit = {
	lookType = 55,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 55
monster.Bestiary = {
	class = "Giant",
	race = BESTY_RACE_GIANT,
	toKill = 1000,
	FirstUnlock = 50,
	SecondUnlock = 500,
	CharmsPoints = 25,
	Stars = 3,
	Occurrence = 0,
	Locations = "Cyclopolis, deepest part of Tarpit Tomb after the flame, Forbidden Lands, Vandura Mountain, \z
		Deeper Banuta, Serpentine Tower (unreachable), deep into the Formorgar Mines, Arena and Zoo Quarter, \z
		The Dark Path, Lower Spike, Chyllfroest, Medusa Tower and Underground Glooth Factory (west side).",
}

monster.health = 4000
monster.maxHealth = 4000
monster.race = "blood"
monster.corpse = 4112
monster.speed = 130
monster.manaCost = 0

monster.changeTarget = {
	interval = 4000,
	chance = 10,
}

monster.strategiesTarget = {
	nearest = 70,
	damage = 30,
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
	staticAttackChance = 70,
	targetDistance = 1,
	runHealth = 0,
	healthHidden = false,
	isBlockable = false,
	canWalkOnEnergy = false,
	canWalkOnFire = true,
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
		text = "You're so little!",
		yell = false,
	},
	{
		text = "Human flesh - delicious!",
		yell = false,
	},
	{
		text = "Crush the intruders!",
		yell = true,
	},
}

monster.loot = {
	{
		id = 3072,
		chance = 1,
	},
	{
		id = 3265,
		chance = 4000,
	},
	{
		id = 3058,
		chance = 800,
	},
	{
		id = 3554,
		chance = 400,
	},
	{
		id = 3033,
		chance = 4000,
		maxCount = 2,
	},
	{
		id = 3357,
		chance = 2000,
	},
	{
		id = 3456,
		chance = 6000,
	},
	{
		id = 3577,
		chance = 40000,
		maxCount = 6,
	},
	{
		id = 3031,
		chance = 50000,
		maxCount = 80,
	},
	{
		id = 3031,
		chance = 70000,
		maxCount = 60,
	},
	{
		id = 3281,
		chance = 1000,
	},
	{
		id = 3275,
		chance = 10000,
	},
	{
		id = 3383,
		chance = 3000,
	},
	{
		id = 3008,
		chance = 300,
	},
	{
		id = 3304,
		chance = 15000,
	},
	{
		id = 3116,
		chance = 7000,
	},
	{
		id = 2893,
		chance = 11000,
	},
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -450 },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_PHYSICALDAMAGE, minDamage = 0, maxDamage = -200, range = 7, shootEffect = CONST_ANI_LARGEROCK, target = true },
}

monster.defenses = {
	defense = 45,
	armor = 50,
	mitigation = 1.74,
	{ name = "speed", interval = 2000, chance = 15, speedChange = 300, effect = CONST_ME_MAGIC_RED, target = false, duration = 5000 },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 10 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 10 },
	{ type = COMBAT_EARTHDAMAGE, percent = 80 },
	{ type = COMBAT_FIREDAMAGE, percent = 30 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = -10 },
	{ type = COMBAT_HOLYDAMAGE, percent = 30 },
	{ type = COMBAT_DEATHDAMAGE, percent = -5 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
