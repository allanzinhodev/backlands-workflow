local mType = Game.createMonsterType("Hero")
local monster = {}

monster.name = "Hero"
monster.description = "a hero"
monster.experience = 1200
monster.outfit = {
	lookType = 73,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 73
monster.Bestiary = {
	class = "Human",
	race = BESTY_RACE_HUMAN,
	toKill = 1000,
	FirstUnlock = 50,
	SecondUnlock = 500,
	CharmsPoints = 25,
	Stars = 3,
	Occurrence = 0,
	Locations = "In Hero Cave in Edron, it has many rooms with many kinds of monsters and different amounts of Heroes. \z
		Also in Magician Quarter, accompanied by other monsters. Old Fortress.",
}

monster.health = 1400
monster.maxHealth = 1400
monster.race = "blood"
monster.corpse = 4240
monster.speed = 100
monster.manaCost = 0

monster.changeTarget = {
	interval = 4000,
	chance = 10,
}

monster.strategiesTarget = {
	nearest = 80,
	health = 10,
	damage = 10,
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
	canWalkOnEnergy = true,
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
		text = "Let's have a fight!",
		yell = false,
	},
	{
		text = "Welcome to my battleground.",
		yell = false,
	},
	{
		text = "Have you seen princess Lumelia?",
		yell = false,
	},
	{
		text = "I will sing a tune at your grave.",
		yell = false,
	},
}

monster.loot = {
	{
		id = 3004,
		chance = 5000,
	},
	{
		id = 3279,
		chance = 1000,
	},
	{
		id = 3265,
		chance = 1500,
	},
	{
		id = 2815,
		chance = 45000,
	},
	{
		id = 3572,
		chance = 12000,
	},
	{
		id = 3003,
		chance = 20000,
	},
	{
		id = 3658,
		chance = 20000,
	},
	{
		id = 3048,
		chance = 500,
	},
	{
		id = 3577,
		chance = 18000,
		maxCount = 2,
	},
	{
		id = 2949,
		chance = 15000,
	},
	{
		id = 3563,
		chance = 8000,
	},
	{
		id = 3592,
		chance = 20000,
	},
	{
		id = 3031,
		chance = 60000,
		maxCount = 100,
	},
	{
		id = 3280,
		chance = 500,
	},
	{
		id = 3419,
		chance = 400,
	},
	{
		id = 3382,
		chance = 500,
	},
	{
		id = 3385,
		chance = 500,
	},
	{
		id = 3381,
		chance = 600,
	},
	{
		id = 3350,
		chance = 13000,
	},
	{
		id = 3447,
		chance = 27000,
		maxCount = 13,
	},
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -240 },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_PHYSICALDAMAGE, minDamage = 0, maxDamage = -120, range = 7, shootEffect = CONST_ANI_ARROW, target = true },
}

monster.defenses = {
	defense = 40,
	armor = 35,
	mitigation = 1.32,
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_HEALING, minDamage = 200, maxDamage = 250, effect = CONST_ME_MAGIC_BLUE, target = false },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 10 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 40 },
	{ type = COMBAT_EARTHDAMAGE, percent = 50 },
	{ type = COMBAT_FIREDAMAGE, percent = 30 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 10 },
	{ type = COMBAT_HOLYDAMAGE, percent = 50 },
	{ type = COMBAT_DEATHDAMAGE, percent = -20 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
