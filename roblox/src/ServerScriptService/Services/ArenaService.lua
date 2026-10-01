--!strict
--[[
	Builds a playable lobby + 3-lane catwalk at runtime so Studio Play works
	before any map art is imported.

	Clears the default Baseplate spawn so Rojo → Connect → Play Solo starts
	on the plaza, not the green plate.
]]

local Lighting = game:GetService("Lighting")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)
local Balance = require(ReplicatedStorage.Shared.Balance)
local LiveOps = require(ReplicatedStorage.Shared.LiveOps)

local ArenaService = {}

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

local function clearDefaultMap()
	for _, child in Workspace:GetChildren() do
		if child.Name == "Baseplate" or child:IsA("SpawnLocation") then
			child:Destroy()
		end
	end
	pcall(function()
		(Workspace :: any).FallenPartsDestroyHeight = -250
	end)
end

local function styleLighting()
	Lighting.ClockTime = 14.5
	Lighting.Brightness = 3
	Lighting.Ambient = Color3.fromRGB(115, 110, 120)
	Lighting.OutdoorAmbient = Color3.fromRGB(135, 130, 145)
	Lighting.EnvironmentDiffuseScale = 0.7
	Lighting.EnvironmentSpecularScale = 0.55
	Lighting.GlobalShadows = true
	Lighting.FogColor = Color3.fromRGB(176, 168, 188)
	Lighting.FogStart = 160
	Lighting.FogEnd = 700

	if not Lighting:FindFirstChildOfClass("Atmosphere") then
		local atm = Instance.new("Atmosphere")
		atm.Density = 0.22
		atm.Offset = 0.12
		atm.Color = Color3.fromRGB(140, 130, 150)
		atm.Decay = Color3.fromRGB(180, 160, 170)
		atm.Glare = 0.15
		atm.Haze = 0.6
		atm.Parent = Lighting
	end

	local bloom = Lighting:FindFirstChildOfClass("BloomEffect")
	if not bloom then
		bloom = Instance.new("BloomEffect")
		bloom.Parent = Lighting
	end
	bloom.Intensity = 0.4
	bloom.Size = 20
	bloom.Threshold = 0.85

	local cc = Lighting:FindFirstChildOfClass("ColorCorrectionEffect")
	if not cc then
		cc = Instance.new("ColorCorrectionEffect")
		cc.Parent = Lighting
	end
	cc.Saturation = 0.12
	cc.Contrast = 0.1
	cc.TintColor = Color3.fromRGB(255, 236, 220)
end

function ArenaService.get(): Folder
	local existing = Workspace:FindFirstChild(Config.ARENA_NAME)
	if existing and existing:IsA("Folder") then
		return existing
	end
	error("Arena missing")
end

function ArenaService.build(): Folder
	clearDefaultMap()

	local old = Workspace:FindFirstChild(Config.ARENA_NAME)
	if old then
		old:Destroy()
	end

	local root = Instance.new("Folder")
	root.Name = Config.ARENA_NAME

	local length = 160
	local width = 28
	local laneSpacing = Balance.laneSpacingStuds
	-- The terminal: arrivals → bag check → mall → food court → gates,
	-- then the power walkways run to Gate 27.
	local startZ = -40
	local finishZ = startZ - length
	local gold = Color3.fromRGB(201, 165, 106)

	local floor = part({
		Name = "RunwayFloor",
		Size = Vector3.new(width, 1, length + 12),
		Position = Vector3.new(0, 0.5, startZ - length / 2 + 6),
		Color = Color3.fromRGB(18, 14, 16),
		Material = Enum.Material.Marble,
	})
	floor.Parent = root

	local sheen = part({
		Name = "CatwalkSheen",
		Size = Vector3.new(16, 0.2, length),
		Position = Vector3.new(0, 1.05, startZ - length / 2),
		Color = Color3.fromRGB(42, 32, 28),
		Material = Enum.Material.Glacier,
		CanCollide = false,
	})
	sheen.Parent = root

	for i = 0, 2 do
		local x = (i - 1) * laneSpacing
		local stripe = part({
			Name = "Lane_" .. i,
			Size = Vector3.new(0.4, 0.15, length),
			Position = Vector3.new(x, 1.12, startZ - length / 2),
			Color = gold,
			CanCollide = false,
		})
		stripe.Parent = root
	end

	-- ARRIVALS: spawn hall.
	local arrivals = part({
		Name = "ArrivalsHall",
		Size = Vector3.new(44, 1, 28),
		Position = Vector3.new(0, 0.5, 66),
		Color = Color3.fromRGB(30, 30, 38),
		Material = Enum.Material.Marble,
	})
	arrivals.Parent = root
	billboard(arrivals, "ARRIVALS", 6, 200)

	local spawn = Instance.new("SpawnLocation")
	spawn.Name = "LobbySpawn"
	spawn.Anchored = true
	spawn.Size = Vector3.new(8, 1, 8)
	spawn.Position = Vector3.new(0, 1.5, 69)
	spawn.Neutral = true
	spawn.Duration = 0
	spawn.Color = gold
	spawn.Parent = root

	-- BAG CHECK: security arches + conveyor.
	local bagcheck = part({
		Name = "BagCheck",
		Size = Vector3.new(44, 1, 12),
		Position = Vector3.new(0, 0.5, 46),
		Color = Color3.fromRGB(26, 28, 34),
		Material = Enum.Material.Slate,
	})
	bagcheck.Parent = root
	billboard(bagcheck, "BAG CHECK · SECURITY", 6, 260)
	for _, ax in { -10, 0, 10 } do
		for _, px in { -2.4, 2.4 } do
			local post = part({
				Name = "SecurityPost",
				Size = Vector3.new(0.7, 7, 0.7),
				Position = Vector3.new(ax + px, 4.5, 46),
				Color = Color3.fromRGB(60, 70, 90),
				Material = Enum.Material.Metal,
				CanCollide = false,
			})
			post.Parent = root
		end
		local beam = part({
			Name = "SecurityBeam",
			Size = Vector3.new(5.5, 1, 1),
			Position = Vector3.new(ax, 8.2, 46),
			Color = Color3.fromRGB(90, 200, 255),
			Material = Enum.Material.Neon,
			CanCollide = false,
		})
		beam.Parent = root
	end
	local belt = part({
		Name = "BagBelt",
		Size = Vector3.new(10, 1.4, 3),
		Position = Vector3.new(17, 1.7, 46),
		Color = Color3.fromRGB(40, 40, 48),
		Material = Enum.Material.Metal,
	})
	belt.Parent = root

	-- SHOPPING MALL: concourse with store fronts; the boutique anchor
	-- store is built on the west side by WorldService.
	local mall = part({
		Name = "ShoppingMall",
		Size = Vector3.new(60, 1, 40),
		Position = Vector3.new(0, 0.5, 20),
		Color = Color3.fromRGB(36, 30, 40),
		Material = Enum.Material.Marble,
	})
	mall.Parent = root
	billboard(mall, "SHOPPING MALL", 9, 260)
	local storeNames = { "SILK ATELIER", "CREST", "NIGHTFALL", "OBLIQUE", "CONCRETE" }
	for i, storeName in storeNames do
		local sz = 40 - i * 8
		local front = part({
			Name = "StoreFront",
			Size = Vector3.new(2, 9, 8),
			Position = Vector3.new(29, 5.5, sz),
			Color = Color3.fromRGB(46, 38, 54),
			Material = Enum.Material.Concrete,
		})
		front.Parent = root
		billboard(front, storeName, 6, 160)
	end

	-- FOOD COURT.
	local food = part({
		Name = "FoodCourt",
		Size = Vector3.new(44, 1, 22),
		Position = Vector3.new(0, 0.5, -11),
		Color = Color3.fromRGB(40, 34, 30),
		Material = Enum.Material.WoodPlanks,
	})
	food.Parent = root
	billboard(food, "FOOD COURT", 6, 220)
	for _, tx in { -12, 0, 12 } do
		for _, tz in { -6, -16 } do
			local top = part({
				Name = "FoodTable",
				Size = Vector3.new(4, 0.4, 4),
				Position = Vector3.new(tx, 3.2, tz),
				Color = Color3.fromRGB(70, 58, 44),
				Material = Enum.Material.Wood,
				CanCollide = false,
			})
			top.Parent = root
			local leg = part({
				Name = "TableLeg",
				Size = Vector3.new(0.6, 2.4, 0.6),
				Position = Vector3.new(tx, 1.8, tz),
				Color = Color3.fromRGB(40, 36, 32),
				CanCollide = false,
			})
			leg.Parent = root
		end
	end

	-- WALKWAY GATES + the boarding trigger: crossing it starts the
	-- flight countdown.
	local gates = part({
		Name = "WalkwayGates",
		Size = Vector3.new(30, 1, 6),
		Position = Vector3.new(0, 0.5, -25),
		Color = Color3.fromRGB(28, 30, 38),
		Material = Enum.Material.Slate,
	})
	gates.Parent = root
	billboard(gates, "GATES · ALL FLIGHTS →", 7, 300)
	for _, gx in { -7, 7 } do
		for _, px in { -2.6, 2.6 } do
			local post = part({
				Name = "GatePost",
				Size = Vector3.new(0.8, 8, 0.8),
				Position = Vector3.new(gx + px, 5, -31),
				Color = gold,
				Material = Enum.Material.Metal,
				CanCollide = false,
			})
			post.Parent = root
		end
		local beam = part({
			Name = "GateBeam",
			Size = Vector3.new(6, 1.2, 1),
			Position = Vector3.new(gx, 9.4, -31),
			Color = gold,
			Material = Enum.Material.Neon,
			CanCollide = false,
		})
		beam.Parent = root
		billboard(beam, "GATE " .. (if gx < 0 then "26" else "27"), 2.4, 120)
	end
	local trigger = part({
		Name = "BoardingTrigger",
		Size = Vector3.new(28, 9, 5),
		Position = Vector3.new(0, 5, -33),
		Transparency = 1,
		CanCollide = false,
	})
	trigger.Parent = root

	local pose = part({
		Name = "PosePlatform",
		Size = Vector3.new(18, 1.4, 14),
		Position = Vector3.new(0, 1.2, finishZ - 4),
		Color = gold,
		Material = Enum.Material.Foil,
	})
	pose.Parent = root
	billboard(pose, "GATE 27 · BOARDING", 6, 160)

	-- Audience blocks (paparazzi / seats) along the power walkways.
	for side = -1, 1, 2 do
		for n = 1, 10 do
			local seat = part({
				Name = "Seat",
				Size = Vector3.new(3, 4, 3),
				Position = Vector3.new(side * 16, 2.5, startZ - n * 14),
				Color = Color3.fromRGB(40, 36, 44),
				CanCollide = false,
			})
			seat.Parent = root
		end
	end

	-- Runway spots
	for i = 1, 8 do
		local z = startZ - i * 18
		local pole = part({
			Name = "LightPole",
			Size = Vector3.new(0.5, 16, 0.5),
			Position = Vector3.new(13.5, 8.5, z),
			Color = Color3.fromRGB(32, 28, 36),
			CanCollide = false,
		})
		pole.Parent = root
		local bulb = part({
			Name = "Spot",
			Size = Vector3.new(1.6, 0.6, 1.6),
			Position = Vector3.new(11.5, 16, z),
			Color = Color3.fromRGB(255, 214, 170),
			Material = Enum.Material.Neon,
			CanCollide = false,
		})
		bulb.Parent = root
		local light = Instance.new("SpotLight")
		light.Brightness = 6
		light.Range = 48
		light.Angle = 42
		light.Face = Enum.NormalId.Bottom
		light.Color = Color3.fromRGB(255, 220, 180)
		light.Parent = bulb
	end

	-- Distant skyline silhouettes
	for i = 1, 7 do
		local block = part({
			Name = "Skyline",
			Size = Vector3.new(10 + i % 3 * 4, 18 + (i % 4) * 10, 8),
			Position = Vector3.new(-70 + i * 22, 12, finishZ - 48),
			Color = Color3.fromRGB(16, 12, 22),
			CanCollide = false,
			Material = Enum.Material.Slate,
		})
		block.Parent = root
	end

	local theme = LiveOps.theme()
	local banner = part({
		Name = "ThemeBanner",
		Size = Vector3.new(18, 8, 0.4),
		Position = Vector3.new(0, 10, 76),
		Color = Color3.fromRGB(12, 10, 14),
		CanCollide = false,
		Material = Enum.Material.SmoothPlastic,
	})
	banner.Parent = root
	billboard(banner, string.upper(theme.name), 0.2, 220)

	local cams = Instance.new("Folder")
	cams.Name = "Cameras"
	cams.Parent = root
	local function camPart(name: string, position: Vector3, lookAt: Vector3)
		local c = part({
			Name = name,
			Size = Vector3.new(1, 1, 2),
			Position = position,
			Transparency = 1,
			CanCollide = false,
			Anchored = true,
		})
		c.CFrame = CFrame.lookAt(position, lookAt)
		c.Parent = cams
	end
	camPart("CamLobby", Vector3.new(0, 16, 78), Vector3.new(0, 3, 20))
	camPart("CamRunway", Vector3.new(0, 10, -18), Vector3.new(0, 4, -80))
	camPart("CamPose", Vector3.new(18, 10, finishZ + 8), Vector3.new(0, 4, finishZ - 4))

	root:SetAttribute("StartZ", startZ)
	root:SetAttribute("FinishZ", finishZ)
	root:SetAttribute("LaneSpacing", laneSpacing)
	root:SetAttribute("Length", length)

	root.Parent = Workspace
	styleLighting()

	return root
end

function ArenaService.laneX(laneIndex: number): number
	-- 0, 1, 2 → -spacing, 0, +spacing
	return (laneIndex - 1) * Balance.laneSpacingStuds
end

function ArenaService.lobbyOrigin(): CFrame
	local spawn = ArenaService.get():FindFirstChild("LobbySpawn")
	if spawn and spawn:IsA("BasePart") then
		return spawn.CFrame + Vector3.new(0, 3, 0)
	end
	return CFrame.new(0, 4, 30)
end

return ArenaService
