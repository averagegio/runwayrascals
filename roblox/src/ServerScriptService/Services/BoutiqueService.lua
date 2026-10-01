--!strict
--[[
	Flagship Boutique — in-world shopping inside the boutique shell that
	WorldService builds on Central Plaza.

	Each fashion house gets display stands: a mannequin wearing the look,
	a price sign, and two ProximityPrompts — Try On (free, temporary) and Buy.
	Buying follows the same rules as the rest of the game:
	  - stylePoints track → DataService.buyLookWithStylePoints (earned, never sold)
	  - robux track → MonetizationService.promptProduct (this universe's IDs only)
	  - free / earn-in-play → toast pointing at Fashion Week shows
	Cosmetic only: nothing here touches votes, score, or speed.
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)
local Catalog = require(ReplicatedStorage.Shared.Catalog)
local LiveOps = require(ReplicatedStorage.Shared.LiveOps)
local LookVisuals = require(ReplicatedStorage.Shared.LookVisuals)
local Remotes = require(ReplicatedStorage.Net.Remotes)

local DataService = require(script.Parent.DataService)
local MonetizationService = require(script.Parent.MonetizationService)

local BoutiqueService = {}

local GOLD = Color3.fromRGB(201, 165, 106)

local function part(props: { [string]: any }): Part
	local p = Instance.new("Part")
	p.Anchored = true
	p.CanCollide = true
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Material = Enum.Material.SmoothPlastic
	for key, value in props do
		(p :: any)[key] = value
	end
	return p
end

local function billboard(adornee: BasePart, text: string, offsetY: number, width: number?)
	local gui = Instance.new("BillboardGui")
	gui.Name = "Sign"
	gui.Size = UDim2.fromOffset((width or 180) * 0.55, 22)
	gui.StudsOffset = Vector3.new(0, offsetY, 0)
	gui.AlwaysOnTop = false
	gui.Adornee = adornee
	gui.Parent = adornee
	local label = Instance.new("TextLabel")
	label.BackgroundTransparency = 1
	label.Size = UDim2.fromScale(1, 1)
	label.Font = Enum.Font.GothamBold
	label.Text = text
	label.TextColor3 = Color3.fromRGB(244, 239, 230)
	label.TextScaled = true
	label.Parent = gui
end

local function toast(player: Player, text: string)
	Remotes.event(Remotes.Events.Toast):FireClient(player, text)
end

local function priceText(look: any): string
	local track = look.track or "free"
	if track == "stylePoints" then
		return string.format("%d Style Points", look.stylePointCost or 0)
	elseif track == "robux" then
		return "Robux"
	elseif track == "iec" then
		return "Collector"
	elseif look.earnInPlay then
		return "Earn in shows"
	end
	return "Free"
end

local function productKeyForLook(lookId: string): string?
	for key, def in Config.Products do
		if type(def) == "table" and (def :: any).lookId == lookId then
			return key
		end
	end
	return nil
end

local function tryOn(player: Player, look: any)
	local ok = pcall(function()
		LookVisuals.applyToPlayer(player, look.id)
	end)
	if ok then
		toast(player, "Trying on " .. look.name .. " — buy it to keep it.")
	else
		toast(player, "Couldn't try that on right now.")
	end
end

local function buy(player: Player, look: any)
	local track = look.track or "free"
	if track == "stylePoints" then
		local ok, msg = DataService.buyLookWithStylePoints(player, look.id)
		toast(player, msg)
		if ok then
			DataService.equipLook(player, look.id)
			pcall(function()
				LookVisuals.applyToPlayer(player, look.id)
			end)
			Remotes.event(Remotes.Events.PlayerData):FireClient(player, DataService.get(player))
		end
	elseif track == "robux" then
		local key = productKeyForLook(look.id)
		if key then
			MonetizationService.promptProduct(player, key)
		else
			toast(player, look.name .. " arrives in the boutique soon.")
		end
	elseif track == "iec" then
		toast(player, look.name .. " is a collector piece — grab it at rascalrunways.com.")
	elseif look.earnInPlay then
		toast(player, look.name .. " is earned in Fashion Week shows — walk to the Hall.")
	else
		local ok, msg = DataService.buyLookWithStylePoints(player, look.id)
		if not ok then
			DataService.grantLook(player, look.id)
			DataService.equipLook(player, look.id)
			toast(player, look.name .. " added to your closet.")
			Remotes.event(Remotes.Events.PlayerData):FireClient(player, DataService.get(player))
		else
			toast(player, msg)
		end
	end
end

-- One representative look per house: the earnable style-points piece, the
-- Robux finale piece, and the collector (IEC) piece when the catalog has one.
local function displayLooks(): { any }
	local byHouse: { [string]: { any } } = {}
	for _, look in Catalog.Looks do
		local list = byHouse[look.houseId]
		if not list then
			list = {}
			byHouse[look.houseId] = list
		end
		table.insert(list, look)
	end
	local picks: { any } = {}
	for _, list in byHouse do
		local sp, robux, iec
		for _, look in list do
			if look.track == "stylePoints" and not sp then
				sp = look
			elseif look.track == "robux" and not robux then
				robux = look
			elseif look.track == "iec" and not iec then
				iec = look
			end
		end
		if sp then
			table.insert(picks, sp)
		end
		if robux then
			table.insert(picks, robux)
		end
		if iec then
			table.insert(picks, iec)
		end
	end
	return picks
end

local function stand(parent: Instance, look: any, x: number, z: number, accent: Color3)
	local platform = part({
		Name = "DisplayStand",
		Size = Vector3.new(4, 0.5, 4),
		Position = Vector3.new(x, 2.2, z),
		Color = Color3.fromRGB(44, 38, 52),
		Material = Enum.Material.Marble,
	})
	platform.Parent = parent

	local trim = part({
		Name = "StandTrim",
		Size = Vector3.new(4.2, 0.25, 4.2),
		Position = Vector3.new(x, 2.5, z),
		Color = accent,
		Material = Enum.Material.Neon,
		CanCollide = false,
	})
	trim.Parent = parent

	-- Mannequin wearing the look's palette (same dummy style as the venue).
	local dummy = part({
		Name = "Mannequin",
		Size = Vector3.new(1.6, 4.4, 1.2),
		Position = Vector3.new(x, 4.65, z),
		Color = Color3.fromRGB(232, 210, 190),
		Material = Enum.Material.SmoothPlastic,
		CanCollide = false,
	})
	dummy.Parent = parent
	pcall(function()
		LookVisuals.applyToModel(dummy, look.id)
	end)

	billboard(platform, look.name, 6.5, 230)

	local function prompt(actionText: string, objectText: string): ProximityPrompt
		local pr = Instance.new("ProximityPrompt")
		pr.ActionText = actionText
		pr.ObjectText = objectText
		pr.HoldDuration = 0
		pr.MaxActivationDistance = 12
		pr.RequiresLineOfSight = false
		pr.Parent = platform
		return pr
	end

	prompt("Try On", look.name).Triggered:Connect(function(player)
		tryOn(player, look)
	end)
	prompt("Buy (" .. priceText(look) .. ")", look.name).Triggered:Connect(function(player)
		buy(player, look)
	end)
end

function BoutiqueService.build(worldRoot: Folder)
	local shell = worldRoot:FindFirstChild("Boutique")
	if not shell then
		warn("[BoutiqueService] Boutique shell missing — WorldService.build() must run first.")
		return
	end

	local b = Config.World.boutique
	local looks = displayLooks()

	-- Stands in rows of four across the shop floor.
	local perRow = 4
	for i, look in looks do
		local row = math.floor((i - 1) / perRow)
		local col = (i - 1) % perRow
		local house = (Config.Houses :: any)[look.houseId]
		local accent: Color3 = if house then house.accent else GOLD
		local x = b.x - 12 + col * 8
		local z = b.z - 5 + row * 10
		stand(shell, look, x, z, accent)
	end

	-- SS27 Trend Drop wall: two rows of five hugging the side walls,
	-- clear of the house rows (z 165/175) and the checkout counter.
	local trendLooks: { any } = {}
	for _, id in Catalog.TrendDrop do
		local look = Catalog.getLook(id)
		if look then
			table.insert(trendLooks, look)
		end
	end
	for i, look in trendLooks do
		local row = math.floor((i - 1) / 5)
		local col = (i - 1) % 5
		local house = (Config.Houses :: any)[look.houseId]
		local accent: Color3 = if house then house.accent else GOLD
		local x = b.x - 12 + col * 6
		local z = if row == 0 then b.z - 10 else b.z + 10
		stand(shell, look, x, z, accent)
	end

	-- Trend Drop header sign on the north wall.
	local dropSign = part({
		Name = "TrendDropSign",
		Size = Vector3.new(24, 2.5, 0.8),
		Position = Vector3.new(b.x, 9, b.z - b.d / 2 + 1),
		Color = Color3.fromRGB(20, 16, 24),
		Material = Enum.Material.SmoothPlastic,
		CanCollide = false,
	})
	dropSign.Parent = shell
	billboard(dropSign, "SS27 TREND DROP — NEW THIS SEASON", 2.6, 420)

	-- Checkout counter at the back.
	local counter = part({
		Name = "Checkout",
		Size = Vector3.new(10, 3, 2.5),
		Position = Vector3.new(b.x - b.w / 2 + 4, 3.5, b.z),
		Color = Color3.fromRGB(60, 50, 64),
		Material = Enum.Material.Wood,
	})
	counter.Parent = shell
	billboard(counter, "CHECKOUT — Style Points & Robux", 3.4, 260)

	-- This week's drop sign (honest weekly theme, same as the venue banner).
	local theme = LiveOps.theme()
	local dropLook = Catalog.getLook(theme.seasonalLookId)
	local dropName = if dropLook then dropLook.name else theme.name
	local sign = part({
		Name = "WeeklyDrop",
		Size = Vector3.new(0.6, 5, 12),
		Position = Vector3.new(b.x + b.w / 2 - 2, 6.5, b.z),
		Color = Color3.fromRGB(20, 16, 24),
		Material = Enum.Material.SmoothPlastic,
		CanCollide = false,
	})
	sign.Parent = shell
	billboard(sign, "THIS WEEK: " .. string.upper(dropName), 3.6, 280)

	print(string.format(
		"[Rascal Runways] Boutique stocked: %d house looks + %d trend drop looks on display.",
		#looks,
		#trendLooks
	))
end

return BoutiqueService
