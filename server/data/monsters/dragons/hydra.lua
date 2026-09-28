local mType = Game.createMonsterType("Hydra")
local monster = {}

monster.name = "Hydra"
monster.description = "a hydra"
monster.experience = 2100
monster.outfit = {
	lookType = 121,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 121
monster.Bestiary = {
	class = "Dragon",
	race = BESTY_RACE_DRAGON,
	toKill = 1000,
	FirstUnlock = 50,
	SecondUnlock = 500,
	CharmsPoints = 25,
	Stars = 3,
	Occurrence = 0,
	Locations = "Northern Hydra Mountain in east Tiquanda, southern Hydra Mountain, Hydra Egg Quest in Tiquanda \z
	north-east of the Elephant Tusk Quest, Forbidden Lands hydra cave, Deeper Banuta, Talahu surface, \z
	Ferumbras Citadel, Yalahar Arena and Zoo Quarter, Yalahar Foreigner Quarter (Crystal Lake), Oramond Hydra/Bog Raider Cave.",
}

monster.health = 2250
monster.maxHealth = 2250
monster.race = "blood"
monster.corpse = 4283
monster.speed = 60
monster.manaCost = 0

monster.changeTarget = {
	interval = 4000,
	chance = 10,
}

monster.strategiesTarget = {
	nearest = 70,
	health = 10,
	damage = 10,
	random = 10,
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
	runHealth = 300,
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

monster.voices = {
	interval = 5000,
	chance = 10,
	{
		text = "FCHHHHH",
		yell = true,
	},
	{
		text = "HISSSS",
		yell = true,
	},
}

monster.loot = {
	{
		id = 2475,
		chance = 1000,
	},
	{
		id = 2197,
		chance = 800,
	},
	{
		id = 2146,
		chance = 5000,
	},
	{
		id = 2498,
		chance = 200,
	},
	{
		id = 2214,
		chance = 1200,
	},
	{
		id = 2536,
		chance = 100,
	},
	{
		id = 2666,
		chance = 90000,
		maxCount = 4,
	},
	{
		id = 2177,
		chance = 600,
	},
	{
		id = 2476,
		chance = 1000,
	},
	{
		id = 4850,
		chance = 900,
	},
	{
		id = 2671,
		chance = 60000,
		maxCount = 3,
	},
	{
		id = 2148,
		chance = 40000,
		maxCount = 50,
	},
	{
		id = 2148,
		chance = 60000,
		maxCount = 100,
	},
	{
		id = 2148,
		chance = 80000,
		maxCount = 100,
	},
	{
		id = 2195,
		chance = 100,
	},
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -270 },
	{ name = "speed", interval = 2000, chance = 25, speedChange = -700, range = 7, radius = 4, shootEffect = CONST_ANI_POISON, effect = CONST_ME_GREEN_RINGS, target = true, duration = 15000 },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_ICEDAMAGE, minDamage = -100, maxDamage = -250, length = 8, spread = 3, effect = CONST_ME_LOSEENERGY, target = false },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_ICEDAMAGE, minDamage = -80, maxDamage = -155, shootEffect = CONST_ANI_SMALLICE, target = true },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_EARTHDAMAGE, minDamage = -66, maxDamage = -320, length = 8, spread = 3, effect = CONST_ME_CARNIPHILA, target = false },
}

monster.defenses = {
	defense = 35,
	armor = 27,
	mitigation = 1.18,
	{ name = "combat", interval = 2000, chance = 25, type = COMBAT_HEALING, minDamage = 260, maxDamage = 407, effect = CONST_ME_MAGIC_BLUE, target = false },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = -5 },
	{ type = COMBAT_ENERGYDAMAGE, percent = -10 },
	{ type = COMBAT_EARTHDAMAGE, percent = 100 },
	{ type = COMBAT_FIREDAMAGE, percent = 0 },
	{ type = COMBAT_LIFEDRAIN, percent = 100 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 50 },
	{ type = COMBAT_HOLYDAMAGE, percent = 30 },
	{ type = COMBAT_DEATHDAMAGE, percent = 0 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
