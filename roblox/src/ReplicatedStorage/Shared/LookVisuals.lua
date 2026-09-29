--!strict
--[[
	Visible cosmetics for Play Solo before real Accessories land.

	Applies BodyColors + simple welded props from a Catalog look id.
	Swap this for layered clothing / Accessory when Studio art is imported.
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Catalog = require(ReplicatedStorage.Shared.Catalog)
local Config = require(ReplicatedStorage.Shared.Config)

local LookVisuals = {}

local FOLDER = "RascalLook"

local HOUSE_PALETTE: { [string]: { primary: Color3, secondary: Color3, accent: Color3 } } = {
	nightfall = {
		primary = Color3.fromRGB(22, 20, 24),
		secondary = Color3.fromRGB(48, 44, 52),
		accent = Color3.fromRGB(229, 229, 229),
	},
	crest = {
		primary = Color3.fromRGB(18, 72, 38),
		secondary = Color3.fromRGB(244, 239, 230),
		accent = Color3.fromRGB(201, 165, 106),
	},
	concrete = {
		primary = Color3.fromRGB(28, 56, 140),
		secondary = Color3.fromRGB(236, 236, 240),
		accent = Color3.fromRGB(37, 99, 235),
	},
	silk = {
		primary = Color3.fromRGB(48, 92, 72),
		secondary = Color3.fromRGB(245, 232, 210),
		accent = Color3.fromRGB(201, 165, 106),
	},
	oblique = {
		primary = Color3.fromRGB(24, 40, 72),
		secondary = Color3.fromRGB(244, 239, 230),
		accent = Color3.fromRGB(30, 58, 95),
	},
}

local function paletteFor(lookId: string): { primary: Color3, secondary: Color3, accent: Color3 }
	local look = Catalog.getLook(lookId)
	local houseId = if look then look.houseId else "crest"
	return HOUSE_PALETTE[houseId] or HOUSE_PALETTE.crest
end

local function clear(character: Model)
	local old = character:FindFirstChild(FOLDER)
	if old then
		old:Destroy()
	end
end

local function weldTo(part: BasePart, parent: BasePart)
	part.Anchored = false
	part.CanCollide = false
	part.Massless = true
	local weld = Instance.new("WeldConstraint")
	weld.Part0 = parent
	weld.Part1 = part
	weld.Parent = part
end

local GOLD = Color3.fromRGB(201, 165, 106)

local function box(
	folder: Folder,
	parent: BasePart,
	name: string,
	size: Vector3,
	color: Color3,
	material: Enum.Material,
	offset: CFrame,
	transparency: number?
): Part
	local p = Instance.new("Part")
	p.Name = name
	p.Size = size
	p.Color = color
	p.Material = material
	p.Transparency = transparency or 0
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.CFrame = parent.CFrame * offset
	p.Parent = folder
	weldTo(p, parent)
	return p
end

-- Hero props for the SS27 Trend Drop. Returns true when the look got a
-- custom build (generic slot props are skipped in that case).
-- isDummy: single-part boutique mannequin (torso doubles as the mount).
local function buildTrendProp(
	lookId: string,
	folder: Folder,
	torso: BasePart,
	head: BasePart?,
	pal: { primary: Color3, secondary: Color3, accent: Color3 },
	isDummy: boolean
): boolean
	if lookId == "silk-atelier-shades" then
		local mount = if not isDummy and head then head else torso
		local y = if not isDummy and head then 0.1 else 1.7
		box(folder, mount, "Shades", Vector3.new(1.7, 0.4, 0.6),
			Color3.fromRGB(15, 15, 20), Enum.Material.SmoothPlastic, CFrame.new(0, y, -0.55))
		return true
	elseif lookId == "nightfall-triple-belt" then
		for _, dy in { -0.55, -0.95, -1.35 } do
			box(folder, torso, "BeltStrap", Vector3.new(2.15, 0.22, 1.25),
				Color3.fromRGB(25, 22, 28), Enum.Material.Leather, CFrame.new(0, dy, 0))
		end
		box(folder, torso, "BitHardware", Vector3.new(0.9, 0.5, 0.2),
			GOLD, Enum.Material.Metal, CFrame.new(0, -0.95, -0.65))
		return true
	elseif lookId == "oblique-coin-belt" then
		box(folder, torso, "CoinBelt", Vector3.new(2.15, 0.35, 1.25),
			Color3.fromRGB(60, 45, 30), Enum.Material.Leather, CFrame.new(0, -0.9, 0))
		for i = 1, 5 do
			local x = -0.8 + (i - 1) * 0.4
			box(folder, torso, "Coin", Vector3.new(0.22, 0.22, 0.1),
				GOLD, Enum.Material.Metal, CFrame.new(x, -0.9, -0.65))
		end
		return true
	elseif lookId == "oblique-cummerbund" then
		box(folder, torso, "Cummerbund", Vector3.new(2.2, 0.85, 1.3),
			pal.secondary, Enum.Material.Fabric, CFrame.new(0, -0.9, 0))
		return true
	elseif lookId == "silk-scarf-belt" then
		box(folder, torso, "ScarfBelt", Vector3.new(2.15, 0.3, 1.25),
			pal.accent, Enum.Material.Fabric, CFrame.new(0, -0.9, 0))
		box(folder, torso, "ScarfKnot", Vector3.new(0.5, 0.5, 0.4),
			pal.accent, Enum.Material.Fabric, CFrame.new(0.9, -1.1, -0.4))
		return true
	elseif lookId == "concrete-fringe-top" then
		for i = 1, 6 do
			local x = -1.0 + (i - 1) * 0.4
			box(folder, torso, "Fringe", Vector3.new(0.22, 1.1, 0.15),
				pal.accent, Enum.Material.Fabric, CFrame.new(x, -1.6, -0.55))
		end
		return true
	elseif lookId == "nightfall-sheer-skirt" then
		box(folder, torso, "SheerSkirt", Vector3.new(2.4, 1.7, 1.35),
			pal.primary, Enum.Material.Glass, CFrame.new(0, -1.9, 0), 0.45)
		return true
	end
	return false
end

local function bodyColors(character: Model, pal: { primary: Color3, secondary: Color3, accent: Color3 })
	local colors = character:FindFirstChildOfClass("BodyColors")
	if not colors then
		colors = Instance.new("BodyColors")
		colors.Parent = character
	end
	colors.HeadColor3 = pal.secondary
	colors.TorsoColor3 = pal.primary
	colors.LeftArmColor3 = pal.secondary
	colors.RightArmColor3 = pal.secondary
	colors.LeftLegColor3 = pal.primary
	colors.RightLegColor3 = pal.primary

	for _, inst in character:GetDescendants() do
		if inst:IsA("BasePart") and inst.Name ~= "HumanoidRootPart" then
			if inst.Name == "Head" then
				inst.Color = pal.secondary
			elseif string.find(string.lower(inst.Name), "leg") or string.find(string.lower(inst.Name), "torso") then
				inst.Color = pal.primary
			end
		end
	end
end

function LookVisuals.applyToModel(character: Model, lookId: string)
	clear(character)
	local look = Catalog.getLook(lookId)
	local pal = paletteFor(lookId)
	bodyColors(character, pal)

	local folder = Instance.new("Folder")
	folder.Name = FOLDER
	folder.Parent = character

	local torso = character:FindFirstChild("UpperTorso")
		or character:FindFirstChild("Torso")
	local head = character:FindFirstChild("Head")
	-- Boutique mannequins are a single part: mount everything on it.
	local isDummy = false
	if not torso then
		if character:IsA("BasePart") then
			torso = character
			head = character
			isDummy = true
		else
			torso = character:FindFirstChild("HumanoidRootPart")
		end
	end
	if not torso or not torso:IsA("BasePart") then
		return
	end

	local slot = if look then look.slot else "base"
	local lookId = if look then look.id else ""
	if not buildTrendProp(lookId, folder, torso, head, pal, isDummy) then
		if slot == "top" or slot == "finale" or slot == "base" then
			local sash = Instance.new("Part")
			sash.Name = "Sash"
			sash.Size = Vector3.new(2.05, 0.28, 1.15)
			sash.Material = Enum.Material.Fabric
			sash.Color = pal.accent
			sash.CFrame = torso.CFrame * CFrame.new(0, 0.35, -0.55)
			sash.Parent = folder
			weldTo(sash, torso)
		end
		if slot == "shoes" or slot == "finale" then
			local boot = Instance.new("Part")
			boot.Name = "BootCue"
			boot.Size = Vector3.new(0.7, 0.45, 1.4)
			boot.Material = Enum.Material.Leather
			boot.Color = pal.accent
			boot.CFrame = torso.CFrame * CFrame.new(0, -2.4, 0.2)
			boot.Parent = folder
			weldTo(boot, torso)
		end
		if slot == "outer" or lookId == "oblique-tote" then
			local tote = Instance.new("Part")
			tote.Name = "Tote"
			tote.Size = Vector3.new(1.1, 1.4, 0.35)
			tote.Material = Enum.Material.Fabric
			tote.Color = pal.accent
			tote.CFrame = torso.CFrame * CFrame.new(1.3, -0.2, 0)
			tote.Parent = folder
			weldTo(tote, torso)
		end
	end

	if head and head:IsA("BasePart") and not isDummy then
		local tag = Instance.new("BillboardGui")
		tag.Name = "LookTag"
		tag.Size = UDim2.fromOffset(140, 22)
		tag.StudsOffset = Vector3.new(0, 2.4, 0)
		tag.AlwaysOnTop = true
		tag.Parent = folder
		tag.Adornee = head
		local label = Instance.new("TextLabel")
		label.BackgroundTransparency = 1
		label.Size = UDim2.fromScale(1, 1)
		label.Font = Enum.Font.GothamBold
		label.TextScaled = true
		label.TextColor3 = pal.accent
		label.Text = if look then look.name else Config.Houses.crest.name
		label.Parent = tag
	end
end

function LookVisuals.applyToPlayer(player: Player, lookId: string)
	local character = player.Character
	if character then
		LookVisuals.applyToModel(character, lookId)
	end
end

return LookVisuals
