--!strict
--[[
	Original Rascal cosmetics for Roblox.

	Web analog IDs document how the HTML boutique maps over; they are not
	sold as third-party trademarks on Roblox.
]]

export type Slot = "base" | "bottoms" | "top" | "shoes" | "outer" | "finale"

export type Track = "free" | "stylePoints" | "robux" | "iec"

export type Look = {
	id: string,
	name: string,
	houseId: string,
	slot: Slot,
	rare: boolean?,
	earnInPlay: boolean?,
	track: Track?,
	stylePointCost: number?,
	webAnalog: string?,
	description: string,
}

local Catalog = {}

Catalog.Looks = {
	{
		id = "street-basics",
		name = "Nameless Street",
		houseId = "crest",
		slot = "base",
		earnInPlay = true,
		track = "free",
		webAnalog = "street-basics",
		description = "Starter street pack — every model starts here.",
	},
	{
		id = "nightfall-tee",
		name = "Cathedral Tee",
		houseId = "nightfall",
		slot = "top",
		earnInPlay = true,
		track = "stylePoints",
		stylePointCost = 80,
		webAnalog = "rick-drkshdw-tee",
		description = "Inky tee with RR night mark.",
	},
	{
		id = "nightfall-boots",
		name = "Cathedral Boots",
		houseId = "nightfall",
		slot = "shoes",
		rare = true,
		earnInPlay = true,
		track = "stylePoints",
		stylePointCost = 160,
		webAnalog = "rick-ramones",
		description = "High-top finale boot. Rare runway drop.",
	},
	{
		id = "nightfall-finale",
		name = "Full Nightfall",
		houseId = "nightfall",
		slot = "finale",
		track = "robux",
		webAnalog = "set-rick",
		description = "Complete Dark Cathedral look (listed pack, not a loot box).",
	},
	{
		id = "crest-polo",
		name = "Uptown Polo",
		houseId = "crest",
		slot = "top",
		rare = true,
		earnInPlay = true,
		track = "stylePoints",
		stylePointCost = 140,
		webAnalog = "ralph-crest-polo",
		description = "Kelly polo with Rascal crest.",
	},
	{
		id = "concrete-tee",
		name = "Logo Concrete Tee",
		houseId = "concrete",
		slot = "top",
		earnInPlay = true,
		track = "stylePoints",
		stylePointCost = 80,
		webAnalog = "balenciaga-logo-tee",
		description = "Royal blue tee, white RR bars.",
	},
	{
		id = "concrete-stack",
		name = "Stack Trainer",
		houseId = "concrete",
		slot = "shoes",
		rare = true,
		track = "robux",
		webAnalog = "balenciaga-triple",
		description = "Chunky stack sneaker. Members / pack.",
	},
	{
		id = "silk-club",
		name = "Club Silk Shirt",
		houseId = "silk",
		slot = "top",
		rare = true,
		track = "robux",
		webAnalog = "casablanca-silk",
		description = "Cream silk club shirt.",
	},
	{
		id = "oblique-tote",
		name = "Atelier Tote",
		houseId = "oblique",
		slot = "outer",
		rare = true,
		track = "iec",
		webAnalog = "dior-book-tote",
		description = "Navy tote for the finale walk.",
	},
} :: { Look }

function Catalog.getLook(id: string): Look?
	for _, look in Catalog.Looks do
		if look.id == id then
			return look
		end
	end
	return nil
end

function Catalog.starterOwned(): { string }
	return { "street-basics", "nightfall-tee", "concrete-tee" }
end

function Catalog.outfitSlots(): number
	return 3
end

function Catalog.vipOutfitSlots(): number
	return 8
end

return Catalog
