local mType = Game.createMonsterType("Purple Butterfly")
local monster = {}

monster.name = "Purple Butterfly"
monster.description = "a butterfly"
monster.experience = 0
monster.outfit = {
	lookType = 213,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.raceId = 3007

monster.health = 2
monster.maxHealth = 2
monster.race = "venom"
monster.corpse = 4993
monster.speed = 120
monster.manaCost = 0

monster.changeTarget = {
	interval = 4000,
	chance = 10,
}

monster.strategiesTarget = {
	nearest = 60,
	health = 0,
	damage = 0,
	random = 40,
}

monster.flags = {
	summonable = false,
	illusionable = true,
	pushable = true,
	convinceable = false,
	canPushItems = false,
	canPushCreatures = false,
	targetDistance = 1,
	runHealth = 2,
}

monster.loot = {}

monster.attacks = {
	{
		name = "melee",
		interval = 2000,
		chance = 100,
		minDamage = 0,
		maxDamage = 0,
	},
}

monster.defenses = { defense = 14, armor = 0 }

monster.elements = {
	{
		type = COMBAT_PHYSICALDAMAGE,
		percent = 0,
	},
	{
		type = COMBAT_ENERGYDAMAGE,
		percent = 0,
	},
	{
		type = COMBAT_FIREDAMAGE,
		percent = 0,
	},
	{
		type = COMBAT_EARTHDAMAGE,
		percent = 0,
	},
	{
		type = COMBAT_LIFEDRAIN,
		percent = 0,
	},
}

monster.immunities = {
	{
		type = "paralyze",
		condition = false,
	},
	{
		type = "invisible",
		condition = false,
	},
	{
		type = "outfit",
		condition = false,
	},
}

mType:register(monster)
