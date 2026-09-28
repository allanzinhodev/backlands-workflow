local mType = Game.createMonsterType("Carniphila")
local monster = {}

monster.name = "Carniphila"
monster.description = "a carniphila"
monster.experience = 150
monster.outfit = {
	lookType = 120,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 120
monster.Bestiary = {
	class = "Plant",
	race = BESTY_RACE_PLANT,
	toKill = 1000,
	FirstUnlock = 50,
	SecondUnlock = 500,
	CharmsPoints = 25,
	Stars = 3,
	Occurrence = 0,
	Locations = "Deep inside the Tiquanda Jungle including Tiquanda Laboratory and a small cave, \z
		Forbidden Lands, Deeper Banuta, Arena and Zoo quarter in Yalahar.",
}

monster.health = 255
monster.maxHealth = 255
monster.race = "venom"
monster.corpse = 4280
monster.speed = 15
monster.manaCost = 490

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
}

monster.loot = {
	{
		id = 2802,
		chance = 500,
	},
	{
		id = 2802,
		chance = 500,
	},
	{
		id = 2804,
		chance = 1000,
	},
	{
		id = 2666,
		chance = 70000,
		maxCount = 2,
	},
	{
		id = 2671,
		chance = 40000,
	},
	{
		id = 2747,
		chance = 500,
	},
	{
		id = 2148,
		chance = 40000,
		maxCount = 10,
	},
	{
		id = 2148,
		chance = 80000,
		maxCount = 30,
	},
	{
		id = 2792,
		chance = 8000,
	},
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -100, condition = { type = CONDITION_POISON, totalDamage = 100, interval = 4000 } },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_EARTHDAMAGE, minDamage = -60, maxDamage = -95, range = 7, shootEffect = CONST_ANI_POISON, effect = CONST_ME_GREEN_RINGS, target = true },
	{ name = "speed", interval = 2000, chance = 15, speedChange = -800, range = 7, shootEffect = CONST_ANI_POISON, effect = CONST_ME_GREEN_RINGS, target = true, duration = 30000 },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_EARTHDAMAGE, minDamage = -40, maxDamage = -130, radius = 3, effect = CONST_ME_POISONAREA, target = false },
}

monster.defenses = {
	defense = 15,
	armor = 22,
	mitigation = 0.51,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 0 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 10 },
	{ type = COMBAT_EARTHDAMAGE, percent = 100 },
	{ type = COMBAT_FIREDAMAGE, percent = -20 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 20 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = 0 },
}

monster.immunities = {
	{ type = "paralyze", condition = false },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
