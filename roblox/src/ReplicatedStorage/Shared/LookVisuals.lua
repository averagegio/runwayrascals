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
		or character:FindFirstChild("HumanoidRootPart")
	if not torso or not torso:IsA("BasePart") then
		return
	end

	local slot = if look then look.slot else "base"
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

	local head = character:FindFirstChild("Head")
	if head and head:IsA("BasePart") then
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
