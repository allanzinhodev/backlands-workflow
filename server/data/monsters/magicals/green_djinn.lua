local mType = Game.createMonsterType("Green Djinn")
local monster = {}

monster.name = "Green Djinn"
monster.description = "a green djinn"
monster.experience = 190
monster.outfit = {
	lookType = 51,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 51
monster.Bestiary = {
	class = "Magical",
	race = BESTY_RACE_MAGICAL,
	toKill = 1000,
	FirstUnlock = 50,
	SecondUnlock = 500,
	CharmsPoints = 25,
	Stars = 3,
	Occurrence = 0,
	Locations = "Mal'ouquah, Oasis Tomb, under the Ankrahmun Library Tomb, \z
		Serpentine Tower last floor behind the Magic Walls, Deeper Banuta, Goroma underground, Magician Quarter.",
}

monster.health = 330
monster.maxHealth = 330
monster.race = "blood"
monster.corpse = 2989
monster.speed = 70
monster.manaCost = 0

monster.faction = FACTION_EFREET
monster.enemyFactions = { FACTION_PLAYER, FACTION_MARID }

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
	illusionable = false,
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
		text = "I grant you a deathwish!",
		yell = false,
	},
	{
		text = "Muhahahaha!",
		yell = false,
	},
	{
		text = "I wish you a merry trip to hell!",
		yell = false,
	},
	{
		text = "Tell me your last wish!",
		yell = false,
	},
	{
		text = "Good wishes are for fairytales",
		yell = false,
	},
}

monster.loot = {
	{
		id = 2063,
		chance = 7500,
	},
	{
		id = 2149,
		chance = 2700,
		maxCount = 4,
	},
	{
		id = 2663,
		chance = 100,
	},
	{
		id = 2747,
		chance = 10000,
	},
	{
		id = 2148,
		chance = 70000,
		maxCount = 50,
	},
	{
		id = 2696,
		chance = 25000,
	},
	{
		id = 1980,
		chance = 2500,
	},
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -110 },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_FIREDAMAGE, minDamage = -45, maxDamage = -80, range = 7, shootEffect = CONST_ANI_FIRE, target = true },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_DEATHDAMAGE, minDamage = -50, maxDamage = -105, range = 7, radius = 1, shootEffect = CONST_ANI_SUDDENDEATH, effect = CONST_ME_SMALLCLOUDS, target = true },
	{ name = "drunk", interval = 2000, chance = 10, range = 7, shootEffect = CONST_ANI_ENERGY, target = true, duration = 5000 },
	{ name = "outfit", interval = 2000, chance = 1, range = 7, effect = CONST_ME_MAGIC_BLUE, target = false, duration = 4000, outfitMonster = "rat" },
	{ name = "djinn electrify", interval = 2000, chance = 15, range = 5, target = false },
	{ name = "djinn cancel invisibility", interval = 2000, chance = 10, target = false },
}

monster.defenses = {
	defense = 15,
	armor = 15,
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 20 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 50 },
	{ type = COMBAT_EARTHDAMAGE, percent = 0 },
	{ type = COMBAT_FIREDAMAGE, percent = 80 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = -10 },
	{ type = COMBAT_HOLYDAMAGE, percent = -13 },
	{ type = COMBAT_DEATHDAMAGE, percent = 20 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
