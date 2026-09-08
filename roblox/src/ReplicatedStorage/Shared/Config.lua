--!strict
--[[
	Rascal Runways — shared config for the Roblox experience.

	Product / Game Pass / Badge IDs are 0 until created in Creator Dashboard.
	Code treats 0 as "not configured" and never calls MarketplaceService prompts with it.
]]

export type GamePassDef = {
	id: number,
	name: string,
	priceHintRobux: number,
	blurb: string,
}

export type ProductDef = {
	id: number,
	name: string,
	priceHintRobux: number,
	coins: number?,
	lookId: string?,
	blurb: string,
}

local Config = {}

Config.DATASTORE_NAME = "RascalRunways_Player_v1"
Config.RECEIPT_STORE_NAME = "RascalRunways_Receipts_v1"
Config.REMOTES_FOLDER = "RascalRemotes"
Config.ARENA_NAME = "RascalArena"

-- Original Rascal houses (Roblox-safe IP). Web boutique still uses licensed-looking
-- designer labels; this experience must not sell third-party trademarks.
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
	{
		id = "newyork",
		name = "New York",
		event = "NYFW",
		houseId = "nightfall",
		unlockOrder = 1,
	},
	{
		id = "milan",
		name = "Milan",
		event = "Milan Fashion Week",
		houseId = "oblique",
		unlockOrder = 2,
	},
	{
		id = "paris",
		name = "Paris",
		event = "Paris Fashion Week",
		houseId = "oblique",
		unlockOrder = 3,
	},
	{
		id = "london",
		name = "London",
		event = "London Fashion Week",
		houseId = "crest",
		unlockOrder = 4,
	},
	{
		id = "berlin",
		name = "Berlin",
		event = "Berlin Fashion Week",
		houseId = "concrete",
		unlockOrder = 5,
	},
	{
		id = "miami",
		name = "Miami",
		event = "Miami Fashion Week",
		houseId = "silk",
		unlockOrder = 6,
	},
}

Config.DefaultLookId = "street-basics"
Config.OpenCastShowId = "open-cast"

--[[
	Create these in Creator Dashboard → Monetization, then paste numeric IDs.
	Until then, boutique UI still lists them; prompts are skipped.
]]
Config.GamePasses = {
	FrontRowVIP = {
		id = 0,
		name = "Front Row VIP",
		priceHintRobux = 399,
		blurb = "VIP lounge, gold nametag, extra daily coins, exclusive pose. No race advantage.",
	} :: GamePassDef,
	FastCast = {
		id = 0,
		name = "Fast Cast",
		priceHintRobux = 99,
		blurb = "Skip the Fashion Week queue. Same scoring as everyone else.",
	} :: GamePassDef,
	WalkInCloset = {
		id = 0,
		name = "Walk-In Closet",
		priceHintRobux = 199,
		blurb = "Save 8 outfit slots instead of 3. Cosmetics only.",
	} :: GamePassDef,
	DirectorCam = {
		id = 0,
		name = "Director Cam",
		priceHintRobux = 149,
		blurb = "Front-row spectate cameras + replay orbit. Flex, not power.",
	} :: GamePassDef,
}

Config.Products = {
	CoinsS = {
		id = 0,
		name = "Pocket Coins",
		priceHintRobux = 49,
		coins = 200,
		blurb = "200 Rascal Coins for boutique looks.",
	} :: ProductDef,
	CoinsM = {
		id = 0,
		name = "Atelier Coins",
		priceHintRobux = 129,
		coins = 600,
		blurb = "600 Rascal Coins.",
	} :: ProductDef,
	CoinsL = {
		id = 0,
		name = "Finale Coins",
		priceHintRobux = 249,
		coins = 1400,
		blurb = "1,400 Rascal Coins — best rate.",
	} :: ProductDef,
	SpotlightVfx = {
		id = 0,
		name = "Finale Spotlight",
		priceHintRobux = 75,
		blurb = "One-time share VFX burst on your pose. Cosmetic only.",
	} :: ProductDef,
	NightfallPack = {
		id = 0,
		name = "Nightfall Look Pack",
		priceHintRobux = 175,
		lookId = "nightfall-finale",
		blurb = "Listed items: cathedral boots + leather outer. Not random.",
	} :: ProductDef,
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
	Score = "Score",
	Intermission = "Intermission",
}

function Config.isConfiguredId(id: number): boolean
	return type(id) == "number" and id > 0
end

return Config
