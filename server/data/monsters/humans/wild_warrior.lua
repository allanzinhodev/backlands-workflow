local mType = Game.createMonsterType("Wild Warrior")
local monster = {}

monster.name = "Wild Warrior"
monster.description = "a wild warrior"
monster.experience = 60
monster.outfit = {
	lookType = 131,
	lookHead = 38,
	lookBody = 38,
	lookLegs = 38,
	lookFeet = 38,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 47
monster.Bestiary = {
	class = "Human",
	race = BESTY_RACE_HUMAN,
	toKill = 500,
	FirstUnlock = 25,
	SecondUnlock = 250,
	CharmsPoints = 15,
	Stars = 2,
	Occurrence = 0,
	Locations = "Dark Cathedral, Outlaw Camp, North of Thais, Cyclopolis, in Edron Hero Cave and around it, \z
		the small camp near Femor Hills, in Ghostlands disguised as a statue.",
}

monster.health = 135
monster.maxHealth = 135
monster.race = "blood"
monster.corpse = 3058
monster.speed = 55
monster.manaCost = 420

monster.changeTarget = {
	interval = 4000,
	chance = 0,
}

monster.strategiesTarget = {
	nearest = 100,
}

monster.flags = {
	summonable = true,
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
		text = "An enemy!",
		yell = false,
	},
	{
		text = "Gimme your money!",
		yell = false,
	},
}

monster.loot = {
	{
		id = 2391,
		chance = 100,
	},
	{
		id = 2509,
		chance = 1000,
	},
	{
		id = 2666,
		chance = 40000,
	},
	{
		id = 2398,
		chance = 10000,
	},
	{
		id = 2649,
		chance = 15000,
	},
	{
		id = 2459,
		chance = 500,
	},
	{
		id = 2148,
		chance = 15000,
		maxCount = 10,
	},
	{
		id = 2148,
		chance = 40000,
		maxCount = 20,
	},
	{
		id = 2110,
		chance = 500,
	},
	{
		id = 2458,
		chance = 5000,
	},
	{
		id = 2511,
		chance = 17000,
	},
	{
		id = 2465,
		chance = 2500,
	},
	{
		id = 2386,
		chance = 30000,
	},
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -70 },
}

monster.defenses = {
	defense = 20,
	armor = 8,
	mitigation = 0.46,
	{ name = "speed", interval = 2000, chance = 15, speedChange = 200, effect = CONST_ME_MAGIC_RED, target = false, duration = 5000 },
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
	{ type = COMBAT_HOLYDAMAGE, percent = 10 },
	{ type = COMBAT_DEATHDAMAGE, percent = -5 },
}

monster.immunities = {
	{ type = "paralyze", condition = false },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = false },
	{ type = "bleed", condition = false },
}

mType:register(monster)
