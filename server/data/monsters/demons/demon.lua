local mType = Game.createMonsterType("Demon")
local monster = {}

monster.description = "a demon"
monster.experience = 6000
monster.outfit = {
	lookType = 35,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 35
monster.Bestiary = {
	class = "Demon",
	race = BESTY_RACE_DEMON,
	toKill = 2500,
	FirstUnlock = 100,
	SecondUnlock = 1000,
	CharmsPoints = 50,
	Stars = 4,
	Occurrence = 0,
	Locations = "Hero Cave, Ferumbras' Citadel, Goroma, Ghostlands Warlock area unreachable, Liberty Bay hidden underground passage unreachable, Razachai, deep in Pits of Inferno (found in every throneroom except Verminor's), deep Formorgar Mines, Demon Forge, Alchemist Quarter, Magician Quarter, Chyllfroest, Oramond Dungeon, Abandoned Sewers, Hell Hub and Halls of Ascension.",
}

monster.health = 8200
monster.maxHealth = 8200
monster.race = "fire"
monster.corpse = 2916
monster.speed = 80
monster.manaCost = 0

monster.changeTarget = {
	interval = 4000,
	chance = 20,
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
	illusionable = false,
	canPushItems = true,
	canPushCreatures = true,
	staticAttackChance = 70,
	targetDistance = 1,
	runHealth = 0,
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

monster.summon = {
	maxSummons = 1,
	summons = {
		{
			name = "Fire Elemental",
			interval = 12000,
			chance = 100,
			count = 1,
		},
	},
}

monster.voices = {
	interval = 5000,
	chance = 10,
	{
		text = "MUHAHAHAHA!",
		yell = true,
	},
	{
		text = "I SMELL FEEEEEAAAR!",
		yell = true,
	},
	{
		text = "CHAMEK ATH UTHUL ARAK!",
		yell = true,
	},
	{
		text = "Your resistance is futile!",
		yell = false,
	},
	{
		text = "Your soul will be mine!",
		yell = true,
	},
}

monster.loot = {
	{
		id = 2151,
		chance = 3500,
	},
	{
		id = 2165,
		chance = 1400,
	},
	{
		id = 2149,
		chance = 11000,
	},
	{
		id = 2214,
		chance = 500,
	},
	{
		id = 1982,
		chance = 1300,
	},
	{
		id = 2171,
		chance = 700,
	},
	{
		id = 2176,
		chance = 3000,
	},
	{
		id = 2164,
		chance = 200,
	},
	{
		id = 2514,
		chance = 500,
	},
	{
		id = 2472,
		chance = 100,
	},
	{
		id = 2396,
		chance = 600,
	},
	{
		id = 2418,
		chance = 1500,
	},
	{
		id = 2470,
		chance = 400,
	},
	{
		id = 2179,
		chance = 1100,
	},
	{
		id = 2148,
		chance = 40000,
		maxCount = 100,
	},
	{
		id = 2148,
		chance = 50000,
		maxCount = 100,
	},
	{
		id = 2148,
		chance = 60000,
		maxCount = 100,
	},
	{
		id = 2148,
		chance = 70000,
		maxCount = 100,
	},
	{
		id = 2393,
		chance = 2000,
	},
	{
		id = 2795,
		chance = 20000,
		maxCount = 6,
	},
	{
		id = 2432,
		chance = 4000,
	},
	{
		id = 2387,
		chance = 20000,
	},
	{
		id = 2462,
		chance = 1200,
	},
	{
		id = 2520,
		chance = 700,
	},
	{
		id = 2678,
		chance = 45000,
		maxCount = 6,
	},
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -520 },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_MANADRAIN, minDamage = 0, maxDamage = -120, range = 7, target = false },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_FIREDAMAGE, minDamage = -150, maxDamage = -250, range = 7, radius = 7, shootEffect = CONST_ANI_FIRE, effect = CONST_ME_FIREAREA, target = true },
	{ name = "firefield", interval = 2000, chance = 10, range = 7, radius = 1, shootEffect = CONST_ANI_FIRE, target = true },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_LIFEDRAIN, minDamage = -300, maxDamage = -490, length = 8, spread = 0, effect = CONST_ME_PURPLEENERGY, target = false },
	{ name = "combat", interval = 2000, chance = 10, type = COMBAT_ENERGYDAMAGE, minDamage = -210, maxDamage = -300, range = 1, shootEffect = CONST_ANI_ENERGY, target = true },
	{ name = "speed", interval = 2000, chance = 15, speedChange = -700, radius = 1, effect = CONST_ME_MAGIC_RED, target = true, duration = 30000 },
}

monster.defenses = {
	defense = 55,
	armor = 44,
	mitigation = 1.74,
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_HEALING, minDamage = 180, maxDamage = 250, effect = CONST_ME_MAGIC_BLUE, target = false },
	{ name = "speed", interval = 2000, chance = 15, speedChange = 320, effect = CONST_ME_MAGIC_RED, target = false, duration = 5000 },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 25 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 50 },
	{ type = COMBAT_EARTHDAMAGE, percent = 40 },
	{ type = COMBAT_FIREDAMAGE, percent = 100 },
	{ type = COMBAT_LIFEDRAIN, percent = 100 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 100 },
	{ type = COMBAT_ICEDAMAGE, percent = -12 },
	{ type = COMBAT_HOLYDAMAGE, percent = -12 },
	{ type = COMBAT_DEATHDAMAGE, percent = 20 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
