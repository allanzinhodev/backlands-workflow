local mType = Game.createMonsterType("Priestess")
local monster = {}

monster.name = "Priestess"
monster.description = "a priestess"
monster.experience = 420
monster.outfit = {
	lookType = 58,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 58
monster.Bestiary = {
	class = "Human",
	race = BESTY_RACE_HUMAN,
	toKill = 1000,
	FirstUnlock = 50,
	SecondUnlock = 500,
	CharmsPoints = 25,
	Stars = 3,
	Occurrence = 0,
	Locations = "Hero Cave, Drefia ruins, Lich Hell, Tombs, Magician Quarter in Yalahar, Vengoth Castle.",
}

monster.health = 390
monster.maxHealth = 390
monster.race = "blood"
monster.corpse = 4247
monster.speed = 45
monster.manaCost = 0

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
	illusionable = true,
	canPushItems = true,
	canPushCreatures = true,
	staticAttackChance = 90,
	targetDistance = 4,
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

monster.summon = {
	maxSummons = 2,
	summons = {
		{
			name = "Ghoul",
			interval = 13000,
			chance = 100,
			count = 2,
		},
	},
}

monster.voices = {
	interval = 5000,
	chance = 10,
	{
		text = "Your energy is mine.",
		yell = false,
	},
	{
		text = "Now, your life has come to an end, hahahha!",
		yell = false,
	},
	{
		text = "Throw the soul on the altar!",
		yell = false,
	},
}

monster.loot = {
	{
		id = 2948,
		chance = 1400,
	},
	{
		id = 3727,
		chance = 3500,
	},
	{
		id = 3034,
		chance = 700,
	},
	{
		id = 3738,
		chance = 14000,
	},
	{
		id = 3585,
		chance = 7500,
		maxCount = 2,
	},
	{
		id = 3739,
		chance = 6000,
	},
	{
		id = 3674,
		chance = 12000,
	},
	{
		id = 3267,
		chance = 23000,
	},
	{
		id = 3008,
		chance = 600,
	},
	{
		id = 3076,
		chance = 1200,
	},
	{
		id = 3311,
		chance = 1500,
	},
	{
		id = 2902,
		chance = 20000,
	},
	{
		id = 2843,
		chance = 7000,
	},
	{
		id = 3429,
		chance = 200,
	},
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = 0, maxDamage = -75 },
	{ name = "combat", interval = 2000, chance = 20, type = COMBAT_DEATHDAMAGE, minDamage = -55, maxDamage = -120, range = 7, shootEffect = CONST_ANI_SUDDENDEATH, effect = CONST_ME_MORTAREA, target = true },
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_MANADRAIN, minDamage = -2, maxDamage = -170, range = 7, target = false },
	-- poison
	{ name = "condition", interval = 2000, chance = 15, target = false, condition =
	{ type = CONDITION_POISON, minDamage = -150, maxDamage = -200, range = 7, shootEffect = CONST_ANI_POISON } },
}

monster.defenses = {
	defense = 15,
	armor = 30,
	mitigation = 1.32,
	{ name = "combat", interval = 2000, chance = 15, type = COMBAT_HEALING, minDamage = 50, maxDamage = 80, effect = CONST_ME_MAGIC_BLUE, target = false },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = -10 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 0 },
	{ type = COMBAT_EARTHDAMAGE, percent = 70 },
	{ type = COMBAT_FIREDAMAGE, percent = 40 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
	{ type = COMBAT_HOLYDAMAGE, percent = -10 },
	{ type = COMBAT_DEATHDAMAGE, percent = 10 },
}

monster.immunities = {
	{ type = "paralyze", condition = false },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType:register(monster)
