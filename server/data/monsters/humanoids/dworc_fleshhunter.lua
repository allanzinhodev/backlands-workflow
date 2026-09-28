local mType = Game.createMonsterType("Dworc Fleshhunter")
local monster = {}

monster.name = "Dworc Fleshhunter"
monster.description = "a dworc fleshhunter"
monster.experience = 35
monster.outfit = {
	lookType = 215,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 215
monster.Bestiary = {
	class = "Humanoid",
	race = BESTY_RACE_HUMANOID,
	toKill = 500,
	FirstUnlock = 25,
	SecondUnlock = 250,
	CharmsPoints = 15,
	Stars = 2,
	Occurrence = 0,
	Locations = "South of Port Hope (Trapwood) on ground level and underground.",
}

monster.health = 85
monster.maxHealth = 85
monster.race = "blood"
monster.corpse = 4307
monster.speed = 34
monster.manaCost = 300

monster.changeTarget = {
	interval = 4000,
	chance = 0,
}

monster.strategiesTarget = {
	nearest = 100,
}

monster.flags = {
	summonable = false,
	attackable = true,
	hostile = true,
	convinceable = true,
	pushable = true,
	rewardBoss = false,
	illusionable = true,
	canPushItems = false,
	canPushCreatures = false,
	staticAttackChance = 90,
	targetDistance = 1,
	runHealth = 8,
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
		text = "Grak brrretz!",
		yell = false,
	},
	{
		text = "Grow truk grrrrr.",
		yell = false,
	},
	{
		text = "Prek tars, dekklep zurk.",
		yell = false,
	},
}

monster.loot = {
	{
		id = 3967,
		chance = 500,
	},
	{
		id = 2050,
		chance = 5500,
	},
	{
		id = 2229,
		chance = 3000,
		maxCount = 3,
	},
	{
		id = 3964,
		chance = 100,
	},
	{
		id = 2411,
		chance = 2000,
	},
	{
		id = 2467,
		chance = 11000,
	},
	{
		id = 3965,
		chance = 500,
	},
	{
		id = 2148,
		chance = 80000,
		maxCount = 10,
	},
	{
		id = 2568,
		chance = 9000,
	},
	{
		id = 2541,
		chance = 1000,
	},
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -25, condition = { type = CONDITION_POISON, totalDamage = 20, interval = 4000 } },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_PHYSICALDAMAGE, minDamage = 0, maxDamage = -15, range = 7, shootEffect = CONST_ANI_THROWINGKNIFE, target = true },
}

monster.defenses = {
	defense = 10,
	armor = 3,
	mitigation = 0.20,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 0 },
	{ type = COMBAT_EARTHDAMAGE, percent = 100 },
	{ type = COMBAT_FIREDAMAGE, percent = -8 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = -10 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = -13 },
}

monster.immunities = {
	{ type = "paralyze", condition = false },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = false },
	{ type = "bleed", condition = false },
}

mType:register(monster)
