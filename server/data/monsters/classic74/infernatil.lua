local mType = Game.createMonsterType("Infernatil")
local monster = {}

monster.name = "Infernatil"

monster.experience = 30000
monster.outfit = {
	lookType = 35,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 3004

monster.health = 110000
monster.maxHealth = 110000
monster.race = "fire"
monster.corpse = 2916
monster.speed = 210
monster.manaCost = 0

monster.changeTarget = {
	interval = 4000,
	chance = 15,
}

monster.strategiesTarget = {
	nearest = 60,
	health = 5,
	damage = 30,
	random = 5,
}

monster.flags = {
	summonable = false,
	illusionable = false,
	pushable = false,
	convinceable = false,
	canPushItems = true,
	canPushCreatures = true,
	targetDistance = 1,
	runHealth = 3000,
}

monster.summon = {
	maxSummons = 4,
	summons = {
		{
			name = "Demon",
			interval = 14000,
			chance = 100,
			count = 4,
		},
	},
}

monster.voices = {
	interval = 5000,
	chance = 10,
	{
		text = "BOW TO THE POWER OF THE RUTHLESS SEVEN!",
		yell = true,
	},
	{
		text = "THE DAY OF RECKONING IS AT HAND!",
		yell = true,
	},
	{
		text = "YOU ALL WILL BURN!",
		yell = true,
	},
	{
		text = "ASHES TO ASHES!",
		yell = true,
	},
}

monster.loot = {
	{
		id = 2143,
		chance = 12500,
		maxCount = 15,
	},
	{
		id = 3955,
		chance = 100,
	},
	{
		id = 2377,
		chance = 20000,
	},
	{
		id = 2421,
		chance = 13500,
	},
	{
		id = 2112,
		chance = 14500,
	},
	{
		id = 2151,
		chance = 14000,
		maxCount = 7,
	},
	{
		id = 2174,
		chance = 2500,
	},
	{
		id = 2197,
		chance = 4000,
	},
	{
		id = 2165,
		chance = 9500,
	},
	{
		id = 2146,
		chance = 13500,
		maxCount = 10,
	},
	{
		id = 2149,
		chance = 15500,
		maxCount = 10,
	},
	{
		id = 2145,
		chance = 9500,
		maxCount = 5,
	},
	{
		id = 2150,
		chance = 13500,
		maxCount = 20,
	},
	{
		id = 2436,
		chance = 5000,
	},
	{
		id = 2402,
		chance = 15500,
	},
	{
		id = 2170,
		chance = 13000,
	},
	{
		id = 2123,
		chance = 3500,
	},
	{
		id = 2214,
		chance = 13000,
	},
	{
		id = 1982,
		chance = 2600,
	},
	{
		id = 2200,
		chance = 4500,
	},
	{
		id = 2171,
		chance = 4500,
	},
	{
		id = 2176,
		chance = 12000,
	},
	{
		id = 2178,
		chance = 4000,
	},
	{
		id = 2164,
		chance = 5000,
	},
	{
		id = 2514,
		chance = 7500,
	},
	{
		id = 2472,
		chance = 3000,
	},
	{
		id = 2162,
		chance = 11500,
	},
	{
		id = 2177,
		chance = 1000,
	},
	{
		id = 2396,
		chance = 7500,
	},
	{
		id = 2155,
		chance = 1500,
	},
	{
		id = 2418,
		chance = 4500,
	},
	{
		id = 2033,
		chance = 7500,
	},
	{
		id = 2470,
		chance = 5000,
	},
	{
		id = 2179,
		chance = 8000,
	},
	{
		id = 2148,
		chance = 66600,
		maxCount = 100,
	},
	{
		id = 2148,
		chance = 77700,
		maxCount = 100,
	},
	{
		id = 2148,
		chance = 88800,
		maxCount = 100,
	},
	{
		id = 2148,
		chance = 99900,
		maxCount = 100,
	},
	{
		id = 2393,
		chance = 12500,
	},
	{
		id = 2432,
		chance = 17000,
	},
	{
		id = 2167,
		chance = 13500,
	},
	{
		id = 2434,
		chance = 4500,
	},
	{
		id = 2387,
		chance = 20000,
	},
	{
		id = 2462,
		chance = 11000,
	},
	{
		id = 2520,
		chance = 15500,
	},
	{
		id = 2124,
		chance = 5500,
	},
	{
		id = 2125,
		chance = 1500,
	},
	{
		id = 2192,
		chance = 2500,
	},
	{
		id = 2195,
		chance = 4000,
	},
	{
		id = 2158,
		chance = 1500,
	},
	{
		id = 2144,
		chance = 15000,
		maxCount = 15,
	},
	{
		id = 2231,
		chance = 9000,
	},
	{
		id = 2142,
		chance = 3500,
	},
}

monster.attacks = {
	{
		name = "melee",
		interval = 2000,
		chance = 100,
		minDamage = 0,
		maxDamage = -260,
	},
	{
		name = "combat",
		interval = 10000,
		chance = 100,
		type = COMBAT_FIREDAMAGE,
		minDamage = -300,
		maxDamage = -1500,
		effect = CONST_ME_FIREAREA,
		length = 8,
		spread = 3,
	},
	{
		name = "combat",
		interval = 8000,
		chance = 100,
		type = COMBAT_FIREDAMAGE,
		minDamage = -500,
		maxDamage = -1000,
		effect = CONST_ME_EXPLOSIONAREA,
		length = 8,
		spread = 0,
	},
	{
		name = "combat",
		interval = 3000,
		chance = 100,
		type = COMBAT_FIREDAMAGE,
		minDamage = -350,
		maxDamage = -850,
		shootEffect = CONST_ANI_FIRE,
		effect = CONST_ME_FIREAREA,
		range = 7,
		radius = 7,
		target = true,
	},
	{
		name = "combat",
		interval = 2000,
		chance = 100,
		type = COMBAT_FIREDAMAGE,
		minDamage = -200,
		maxDamage = -500,
		effect = CONST_ME_HITBYFIRE,
		radius = 5,
		target = false,
	},
	{
		name = "combat",
		interval = 15000,
		chance = 100,
		type = COMBAT_PHYSICALDAMAGE,
		minDamage = -250,
		maxDamage = -750,
		effect = CONST_ME_EXPLOSIONAREA,
		radius = 6,
		target = false,
	},
}

monster.defenses = {
	defense = 150, armor = 165,
	{
		name = "combat",
		interval = 4000,
		chance = 100,
		type = COMBAT_HEALING,
		minDamage = 2000,
		maxDamage = 3000,
		effect = CONST_ME_MAGIC_BLUE,
	},
	{
		name = "combat",
		interval = 7000,
		chance = 100,
		type = COMBAT_HEALING,
		minDamage = 5000,
		maxDamage = 10000,
		effect = CONST_ME_MAGIC_BLUE,
	},
}

monster.elements = {
	{
		type = COMBAT_PHYSICALDAMAGE,
		percent = 0,
	},
	{
		type = COMBAT_ENERGYDAMAGE,
		percent = 100,
	},
	{
		type = COMBAT_FIREDAMAGE,
		percent = 100,
	},
	{
		type = COMBAT_EARTHDAMAGE,
		percent = 100,
	},
	{
		type = COMBAT_LIFEDRAIN,
		percent = 100,
	},
}

monster.immunities = {
	{
		type = "paralyze",
		condition = true,
	},
	{
		type = "invisible",
		condition = true,
	},
	{
		type = "outfit",
		condition = true,
	},
}

mType:register(monster)
