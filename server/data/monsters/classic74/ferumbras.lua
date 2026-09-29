local mType = Game.createMonsterType("Ferumbras")
local monster = {}

monster.name = "Ferumbras"

monster.experience = 9999
monster.outfit = {
	lookType = 130,
	lookHead = 57,
	lookBody = 113,
	lookLegs = 95,
	lookFeet = 113,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 3001

monster.health = 28000
monster.maxHealth = 28000
monster.race = "venom"
monster.corpse = 4240
monster.speed = 155
monster.manaCost = 0

monster.changeTarget = {
	interval = 4000,
	chance = 20,
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
	runHealth = 2500,
}

monster.summon = {
	maxSummons = 4,
	summons = {
		{
			name = "Demon",
			interval = 9000,
			chance = 100,
			count = 4,
		},
	},
}

monster.voices = {
	interval = 5000,
	chance = 10,
	{
		text = "NOONE WILL STOP ME THIS TIME!",
		yell = true,
	},
	{
		text = "THE POWER IS MINE!",
		yell = true,
	},
	{
		text = "I returned from death and you dream about defeating me?",
		yell = false,
	},
	{
		text = "Witness the first seconds of my eternal world domination!",
		yell = false,
	},
	{
		text = "The powers of darkness are with me!",
		yell = false,
	},
	{
		text = "Even in my weakened state I will crush you all!",
		yell = false,
	},
	{
		text = "I came, I see, I will win!",
		yell = false,
	},
}

monster.loot = {
	{
		id = 3026,
		chance = 12500,
		maxCount = 15,
	},
	{
		id = 3002,
		chance = 100,
	},
	{
		id = 3265,
		chance = 20000,
	},
	{
		id = 3309,
		chance = 13500,
	},
	{
		id = 2993,
		chance = 14500,
	},
	{
		id = 3034,
		chance = 14000,
		maxCount = 7,
	},
	{
		id = 3058,
		chance = 2500,
	},
	{
		id = 3081,
		chance = 4000,
	},
	{
		id = 3049,
		chance = 9500,
	},
	{
		id = 3029,
		chance = 13500,
		maxCount = 10,
	},
	{
		id = 3032,
		chance = 15500,
		maxCount = 10,
	},
	{
		id = 3028,
		chance = 9500,
		maxCount = 5,
	},
	{
		id = 3033,
		chance = 13500,
		maxCount = 20,
	},
	{
		id = 3324,
		chance = 5000,
	},
	{
		id = 3290,
		chance = 15500,
	},
	{
		id = 3054,
		chance = 13000,
	},
	{
		id = 3006,
		chance = 3500,
	},
	{
		id = 3098,
		chance = 13000,
	},
	{
		id = 2848,
		chance = 2600,
	},
	{
		id = 3084,
		chance = 4500,
	},
	{
		id = 3055,
		chance = 4500,
	},
	{
		id = 3060,
		chance = 12000,
	},
	{
		id = 3062,
		chance = 4000,
	},
	{
		id = 3048,
		chance = 5000,
	},
	{
		id = 3414,
		chance = 7500,
	},
	{
		id = 3366,
		chance = 3000,
	},
	{
		id = 3046,
		chance = 11500,
	},
	{
		id = 3061,
		chance = 1000,
	},
	{
		id = 3284,
		chance = 7500,
	},
	{
		id = 3038,
		chance = 1500,
	},
	{
		id = 3306,
		chance = 4500,
	},
	{
		id = 2903,
		chance = 7500,
	},
	{
		id = 3364,
		chance = 5000,
	},
	{
		id = 3063,
		chance = 8000,
	},
	{
		id = 3031,
		chance = 66600,
		maxCount = 100,
	},
	{
		id = 3031,
		chance = 77700,
		maxCount = 100,
	},
	{
		id = 3031,
		chance = 88800,
		maxCount = 100,
	},
	{
		id = 3031,
		chance = 99900,
		maxCount = 100,
	},
	{
		id = 3281,
		chance = 12500,
	},
	{
		id = 3320,
		chance = 17000,
	},
	{
		id = 3051,
		chance = 13500,
	},
	{
		id = 3322,
		chance = 4500,
	},
	{
		id = 3275,
		chance = 20000,
	},
	{
		id = 3356,
		chance = 11000,
	},
	{
		id = 3420,
		chance = 15500,
	},
	{
		id = 3007,
		chance = 5500,
	},
	{
		id = 3008,
		chance = 1500,
	},
	{
		id = 3076,
		chance = 2500,
	},
	{
		id = 3079,
		chance = 4000,
	},
	{
		id = 3041,
		chance = 1500,
	},
	{
		id = 3027,
		chance = 15000,
		maxCount = 15,
	},
	{
		id = 3025,
		chance = 3500,
	},
}

monster.attacks = {
	{
		name = "melee",
		interval = 2000,
		chance = 100,
		minDamage = 0,
		maxDamage = -155,
	},
	{
		name = "combat",
		interval = 12000,
		chance = 100,
		type = COMBAT_LIFEDRAIN,
		minDamage = -50,
		maxDamage = -850,
		effect = CONST_ME_HITAREA,
		length = 8,
		spread = 0,
	},
	{
		name = "combat",
		interval = 10000,
		chance = 100,
		type = COMBAT_LIFEDRAIN,
		minDamage = -200,
		maxDamage = -400,
		effect = CONST_ME_POFF,
		radius = 6,
		target = false,
	},
	{
		name = "combat",
		interval = 13000,
		chance = 100,
		type = COMBAT_MANADRAIN,
		minDamage = -125,
		maxDamage = -375,
		effect = CONST_ME_MAGIC_RED,
		radius = 6,
		target = false,
	},
	{
		name = "combat",
		interval = 9000,
		chance = 100,
		type = COMBAT_MANADRAIN,
		minDamage = -350,
		maxDamage = -650,
		effect = CONST_ME_MAGIC_RED,
		range = 7,
	},
}

monster.defenses = {
	defense = 110, armor = 90,
	{
		name = "combat",
		interval = 10000,
		chance = 100,
		type = COMBAT_HEALING,
		minDamage = 1400,
		maxDamage = 2600,
		effect = CONST_ME_MAGIC_GREEN,
	},
	{
		name = "combat",
		interval = 4000,
		chance = 100,
		type = COMBAT_HEALING,
		minDamage = 600,
		maxDamage = 1000,
		effect = CONST_ME_MAGIC_GREEN,
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
