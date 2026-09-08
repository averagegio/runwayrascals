--!strict
--[[
	Rascal Runways — shared config for the Roblox experience.

	Product / Game Pass IDs are 0 until created on THIS universe in Creator Dashboard.
	Cross-game pass sales are disabled (~May 2026) — do not reuse IDs from other places.
	Config.isConfiguredId skips MarketplaceService prompts while id == 0.
]]

export type GamePassDef = {
	id: number,
	name: string,
	priceHintRobux: number,
	blurb: string,
	cosmeticOnly: boolean,
}

export type ProductDef = {
	id: number,
	name: string,
	priceHintRobux: number,
	lookId: string?,
	vipDays: number?,
	gift: boolean?,
	queueSkipTickets: number?,
	blurb: string,
}

local Config = {}

Config.DATASTORE_NAME = "RascalRunways_Player_v2"
Config.RECEIPT_STORE_NAME = "RascalRunways_Receipts_v1"
Config.REMOTES_FOLDER = "RascalRemotes"
Config.ARENA_NAME = "RascalArena"

Config.Policy = {
	cosmeticVipOnly = true,
	noVoteMultipliers = true,
	noPremiumStylePointBonus = true,
	noStylePointsForRobux = true,
	nativeUniverseProductsOnly = true,
	noDonationOrAfk = true,
	engagementBasedPayoutsEnded = "2025-07",
	iecOwnerCutHint = 0.40,
}

-- Original Rascal houses (Roblox-safe IP).
Config.Houses = {
	nightfall = {
		id = "nightfall",
		name = "House Nightfall",
		showName = "Dark Cathedral",
		webAnalog = "rick-owens",
		accent = Color3.fromRGB(229, 229, 229),
		tagline = "Walk the dark cathedral",
	},
	crest = {
		id = "crest",
		name = "House Crest",
		showName = "Uptown Polo",
		webAnalog = "ralph-lauren",
		accent = Color3.fromRGB(22, 163, 74),
		tagline = "Uptown polish",
	},
	concrete = {
		id = "concrete",
		name = "House Concrete",
		showName = "Logo Street",
		webAnalog = "balenciaga",
		accent = Color3.fromRGB(37, 99, 235),
		tagline = "Concrete logo energy",
	},
	silk = {
		id = "silk",
		name = "House Silk",
		showName = "Club Silk",
		webAnalog = "casablanca",
		accent = Color3.fromRGB(15, 61, 46),
		tagline = "Cream silk, night club",
	},
	oblique = {
		id = "oblique",
		name = "House Oblique",
		showName = "Book Tote Finale",
		webAnalog = "dior-paris",
		accent = Color3.fromRGB(30, 58, 95),
		tagline = "Navy oblique polish",
	},
}

Config.Cities = {
	{ id = "newyork", name = "New York", event = "NYFW", houseId = "nightfall", unlockOrder = 1 },
	{ id = "milan", name = "Milan", event = "Milan Fashion Week", houseId = "oblique", unlockOrder = 2 },
	{ id = "paris", name = "Paris", event = "Paris Fashion Week", houseId = "oblique", unlockOrder = 3 },
	{ id = "london", name = "London", event = "London Fashion Week", houseId = "crest", unlockOrder = 4 },
	{ id = "berlin", name = "Berlin", event = "Berlin Fashion Week", houseId = "concrete", unlockOrder = 5 },
	{ id = "miami", name = "Miami", event = "Miami Fashion Week", houseId = "silk", unlockOrder = 6 },
}

Config.DefaultLookId = "street-basics"
Config.OpenCastShowId = "open-cast"

--[[
	DTI-style ladder is a reference, not a contract: ~799 permanent / ~299 monthly.
	Create these ON this universe only.
]]
Config.GamePasses = {
	FrontRowVIP = {
		id = 0,
		name = "Front Row VIP",
		priceHintRobux = 799,
		cosmeticOnly = true,
		blurb = "Permanent: closet, makeup, poses, gold tag. No extra votes or score.",
	} :: GamePassDef,
	WalkInCloset = {
		id = 0,
		name = "Walk-In Closet",
		priceHintRobux = 199,
		cosmeticOnly = true,
		blurb = "Extra outfit slots only.",
	} :: GamePassDef,
	DirectorCam = {
		id = 0,
		name = "Director Cam",
		priceHintRobux = 149,
		cosmeticOnly = true,
		blurb = "Spectate / replay cameras. Flex, not power.",
	} :: GamePassDef,
	FastCast = {
		id = 0,
		name = "Fast Cast",
		priceHintRobux = 99,
		cosmeticOnly = true,
		blurb = "Skip the queue. Same votes as everyone else.",
	} :: GamePassDef,
}

Config.Products = {
	VipMonthly = {
		id = 0,
		name = "Front Row Monthly",
		priceHintRobux = 299,
		vipDays = 30,
		blurb = "30 days of VIP cosmetics (closet / makeup / poses / tag). Not a vote buff.",
	} :: ProductDef,
	GiftVipMonthly = {
		id = 0,
		name = "Gift Front Row Monthly",
		priceHintRobux = 299,
		vipDays = 30,
		gift = true,
		blurb = "Gift 30 days of VIP cosmetics to a friend.",
	} :: ProductDef,
	GiftPropClutch = {
		id = 0,
		name = "Gift Runway Clutch",
		priceHintRobux = 75,
		gift = true,
		lookId = "oblique-tote",
		blurb = "Giftable clutch prop. Cosmetic.",
	} :: ProductDef,
	SeasonalLook = {
		id = 0,
		name = "This Week's Drop",
		priceHintRobux = 175,
		lookId = "silk-club",
		blurb = "Listed seasonal look for the current UTC week. No fake countdown.",
	} :: ProductDef,
	FastCastTicket = {
		id = 0,
		name = "Fast Cast Ticket",
		priceHintRobux = 25,
		queueSkipTickets = 1,
		blurb = "One queue skip. Time-saver.",
	} :: ProductDef,
	SpotlightVfx = {
		id = 0,
		name = "Finale Spotlight",
		priceHintRobux = 75,
		blurb = "Pose share VFX. Cosmetic only.",
	} :: ProductDef,
	NightfallPack = {
		id = 0,
		name = "Nightfall Look Pack",
		priceHintRobux = 175,
		lookId = "nightfall-finale",
		blurb = "Listed exclusive (Robux track). Not random.",
	} :: ProductDef,
}

-- In-experience catalog assets (paste numeric IDs). Prompt from this experience only.
Config.Iec = {
	enabled = false,
	ownerCutHint = 0.40,
	assets = {
		Clutch = 0,
		Glasses = 0,
	},
}

Config.Badges = {
	FirstWalk = 0,
	ShowComplete = 0,
	SevenDayStreak = 0,
}

Config.Phases = {
	Lobby = "Lobby",
	Dress = "Dress",
	Countdown = "Countdown",
	Run = "Run",
	Pose = "Pose",
	Vote = "Vote",
	Score = "Score",
	Intermission = "Intermission",
}

Config.Vip = {
	closetSlots = 8,
	freeClosetSlots = 3,
	makeupSlots = 6,
	poseNames = { "FrontRow", "FinaleHold", "GoldTagIdle" },
}

-- Share Links from day one → Creator Rewards (Active Spender / Audience Expansion).
-- Engagement-Based Payouts ended July 2025 — do not farm AFK Premium time.
Config.CreatorRewards = {
	shareLinksFromDayOne = true,
	activeSpender = true,
	audienceExpansion = true,
	engagementBasedPayoutsEnded = "2025-07",
}

--[[
	Play Solo on an unpublished place. Live servers ignore these flags
	because RunService:IsStudio() is false. Mock grants never persist
	to a published universe.
]]
Config.StudioPlaytest = {
	spawnCastNpcs = true,
	mockMarketplace = true,
	dressOnTutorial = true,
	tutorialDressSeconds = 8,
	npcUserIds = { -9101, -9102 },
}

function Config.isConfiguredId(id: number): boolean
	return type(id) == "number" and id > 0
end

return Config
