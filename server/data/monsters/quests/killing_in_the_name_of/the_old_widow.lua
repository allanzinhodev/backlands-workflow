local mType = Game.createMonsterType("The Old Widow")
local monster = {}

monster.name = "The Old Widow"
monster.description = "The Old Widow"
monster.experience = 2800
monster.outfit = {
	lookType = 208,
	lookHead = 0,
	lookBody = 0,
	lookLegs = 0,
	lookFeet = 0,
	lookAddons = 0,
	lookMount = 0,
}

monster.health = 3550
monster.maxHealth = 3550
monster.race = "venom"
monster.corpse = 2857
monster.speed = 99
monster.manaCost = 0

monster.changeTarget = {
	interval = 5000,
	chance = 8,
}

monster.strategiesTarget = {
	nearest = 70,
	health = 20,
	random = 10,
}

monster.flags = {
	summonable = false,
	attackable = true,
	hostile = true,
	convinceable = false,
	pushable = false,
	rewardBoss = true,
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

monster.summon = {
	maxSummons = 2,
	summons = {
		{
			name = "Giant Spider",
			interval = 8000,
			chance = 100,
			count = 2,
		},
	},
}

monster.voices = {
	interval = 5000,
	chance = 10,
}

monster.loot = {
	{
		id = 2169,
		chance = 1400,
	},
	{
		id = 2457,
		chance = 10000,
	},
	{
		id = 2171,
		chance = 200,
	},
	{
		id = 2463,
		chance = 20000,
	},
	{
		id = 2477,
		chance = 600,
	},
	{
		id = 2476,
		chance = 600,
	},
	{
		id = 2148,
		chance = 99900,
		maxCount = 22,
	},
	{
		id = 2148,
		chance = 99900,
		maxCount = 66,
	},
	{
		id = 2148,
		chance = 66600,
		maxCount = 77,
	},
	{
		id = 2478,
		chance = 16000,
	},
}

monster.attacks = {
	{ name = "melee", interval = 2000, chance = 100, minDamage = -100, maxDamage = -500 },
	{ name = "combat", interval = 1000, chance = 15, type = COMBAT_EARTHDAMAGE, minDamage = -250, maxDamage = -300, range = 7, shootEffect = CONST_ANI_POISON, effect = CONST_ME_POISONAREA, target = true },
	{ name = "speed", interval = 1000, chance = 20, speedChange = -850, range = 7, shootEffect = CONST_ANI_POISON, effect = CONST_ME_POISONAREA, target = true, duration = 25000 },
	{ name = "poisonfield", interval = 1000, chance = 10, range = 7, radius = 4, shootEffect = CONST_ANI_POISON, target = true },
}

monster.defenses = {
	defense = 21,
	armor = 45,
	mitigation = 1.54,
	--
	{ name = "combat", interval = 1000, chance = 17, type = COMBAT_HEALING, minDamage = 225, maxDamage = 275, effect = CONST_ME_MAGIC_BLUE, target = false },
	{ name = "speed", interval = 1000, chance = 8, speedChange = 345, effect = CONST_ME_MAGIC_RED, target = false, duration = 6000 },
}

monster.elements = {
	{ type = COMBAT_PHYSICALDAMAGE, percent = 20 },
	{ type = COMBAT_ENERGYDAMAGE, percent = 10 },
	{ type = COMBAT_EARTHDAMAGE, percent = 100 },
	{ type = COMBAT_FIREDAMAGE, percent = 20 },
	{ type = COMBAT_LIFEDRAIN, percent = 0 },
	{ type = COMBAT_MANADRAIN, percent = 0 },
	{ type = COMBAT_DROWNDAMAGE, percent = 0 },
	{ type = COMBAT_ICEDAMAGE, percent = 0 },
	{ type = COMBAT_HOLYDAMAGE, percent = 0 },
	{ type = COMBAT_DEATHDAMAGE, percent = 0 },
}

monster.immunities = {
	{ type = "paralyze", condition = true },
	{ type = "outfit", condition = false },
	{ type = "invisible", condition = true },
	{ type = "bleed", condition = false },
}

mType.onDeath = function(monster, corpse, killer, mostDamageKiller, lastHitUnjustified, mostDamageUnjustified)
	monster:say("It seems this was just an illusion.", TALKTYPE_MONSTER_SAY)
	local mostDamagePlayer = mostDamageKiller:getPlayer()
	if mostDamagePlayer then mostDamagePlayer:addAchievement("Someone's Bored") end
end

mType:register(monster)
