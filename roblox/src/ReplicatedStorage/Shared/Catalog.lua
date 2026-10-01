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
	speedBoost: number?,
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
	-- SS27 Trend Drop: runway trends as original Rascal pieces.
	-- Web analog IDs document the inspiration; nothing here is sold
	-- as a third-party trademark on Roblox.
	{
		id = "nightfall-triple-belt",
		name = "Triple-Strap Belt",
		houseId = "nightfall",
		slot = "finale",
		rare = true,
		track = "robux",
		webAnalog = "gucci-triple-horsebit-belt",
		description = "Triple black straps, triple gold bit hardware. The season's it-belt.",
	},
	{
		id = "nightfall-sheer-skirt",
		name = "Sheer Layer Skirt",
		houseId = "nightfall",
		slot = "bottoms",
		track = "stylePoints",
		stylePointCost = 200,
		webAnalog = "ss27-sheer-layer-skirt",
		description = "Sheer overlay skirt — the day-sheer trend, Rascal dark.",
	},
	{
		id = "crest-cloud-knit",
		name = "Cloudspun Knit",
		houseId = "crest",
		slot = "top",
		earnInPlay = true,
		track = "stylePoints",
		stylePointCost = 180,
		webAnalog = "marni-chunky-knit",
		description = "Oversized cloud-soft knit. Slouch is the silhouette.",
	},
	{
		id = "crest-tied-cardi",
		name = "Shoulder-Tied Cardi",
		houseId = "crest",
		slot = "outer",
		track = "stylePoints",
		stylePointCost = 160,
		webAnalog = "ss27-tied-sweater",
		description = "Cardi knotted at the shoulder — the season's styling trick.",
	},
	{
		id = "concrete-fringe-top",
		name = "Fringe Motion Top",
		houseId = "concrete",
		slot = "top",
		track = "stylePoints",
		stylePointCost = 140,
		webAnalog = "ss27-fringe-top",
		description = "Fringe that moves when you move.",
	},
	{
		id = "concrete-argyle-vest",
		name = "Argyle Heritage Vest",
		houseId = "concrete",
		slot = "top",
		track = "stylePoints",
		stylePointCost = 120,
		webAnalog = "ss27-argyle-vest",
		description = "Preppy argyle diamonds, Rascal attitude.",
	},
	{
		id = "silk-scarf-belt",
		name = "Scarf-Wrap Belt",
		houseId = "silk",
		slot = "finale",
		track = "stylePoints",
		stylePointCost = 150,
		webAnalog = "ss27-scarf-belt",
		description = "Silk scarf tied at the waist — the soft belt.",
	},
	{
		id = "silk-atelier-shades",
		name = "Atelier Shades",
		houseId = "silk",
		slot = "finale",
		rare = true,
		track = "robux",
		webAnalog = "prada-geometric-shades",
		description = "Geometric statement shades. Paparazzi-proof.",
	},
	{
		id = "oblique-coin-belt",
		name = "Coin-Trim Belt",
		houseId = "oblique",
		slot = "finale",
		rare = true,
		earnInPlay = true,
		track = "stylePoints",
		stylePointCost = 220,
		webAnalog = "ss27-coin-belt",
		description = "Coin-trim waist belt. Rare runway drop.",
	},
	{
		id = "oblique-cummerbund",
		name = "Satin Cummerbund",
		houseId = "oblique",
		slot = "finale",
		track = "stylePoints",
		stylePointCost = 190,
		webAnalog = "ss27-cummerbund",
		description = "Borrowed-from-the-boys satin waistband.",
	},
	{
		id = "silk-jet-sneakers",
		name = "Jetsetter Sneakers",
		houseId = "silk",
		slot = "shoes",
		track = "stylePoints",
		stylePointCost = 150,
		speedBoost = 0.10,
		description = "+10% runway speed. Run like the gate closes in five.",
	},
	{
		id = "crest-tail-scarf",
		name = "Tailwind Scarf",
		houseId = "crest",
		slot = "outer",
		track = "stylePoints",
		stylePointCost = 300,
		speedBoost = 0.15,
		description = "+15% runway speed. It streams behind you.",
	},
	{
		id = "nightfall-first-bomber",
		name = "First-Class Bomber",
		houseId = "nightfall",
		slot = "outer",
		track = "stylePoints",
		stylePointCost = 600,
		speedBoost = 0.20,
		description = "+20% runway speed. Board first, always.",
	},
} :: { Look }

-- Curated SS27 Trend Drop wall order (hero piece first).
Catalog.TrendDrop = {
	"nightfall-triple-belt",
	"silk-atelier-shades",
	"crest-cloud-knit",
	"oblique-coin-belt",
	"concrete-fringe-top",
	"silk-scarf-belt",
	"crest-tied-cardi",
	"oblique-cummerbund",
	"concrete-argyle-vest",
	"nightfall-sheer-skirt",
} :: { string }

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
