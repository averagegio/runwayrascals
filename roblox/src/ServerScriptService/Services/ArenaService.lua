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

local function billboard(adornee: BasePart, text: string, offsetY: number, width: number?, textColor: Color3?)
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
	label.TextColor3 = textColor or Color3.fromRGB(244, 239, 230)
	label.TextScaled = true
	label.Parent = gui
end

-- Small multiline board text (departure boards): left-aligned, fixed size.
local function boardText(adornee: BasePart, text: string, offsetY: number, width: number, height: number)
	local gui = Instance.new("BillboardGui")
	gui.Name = "BoardSign"
	gui.Size = UDim2.fromOffset(width, height)
	gui.StudsOffset = Vector3.new(0, offsetY, 0)
	gui.AlwaysOnTop = false
	gui.Adornee = adornee
	gui.Parent = adornee
	local label = Instance.new("TextLabel")
	label.BackgroundTransparency = 1
	label.Size = UDim2.fromScale(1, 1)
	label.Font = Enum.Font.Code
	label.TextSize = 18
	label.TextXAlignment = Enum.TextXAlignment.Left
	label.TextYAlignment = Enum.TextYAlignment.Top
	label.TextColor3 = Color3.fromRGB(130, 225, 255)
	label.Text = text
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
	Lighting.Brightness = 3.5
	Lighting.Ambient = Color3.fromRGB(152, 147, 152)
	Lighting.OutdoorAmbient = Color3.fromRGB(165, 158, 168)
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

-- ---------------------------------------------------------------------------
-- PHX Terminal 4 interior: glass curtain wall over the airfield, slatted wood
-- wave ceiling, bronze columns, blue wayfinding, gate seating, saguaros.
-- ---------------------------------------------------------------------------
local TERRAZZO = Color3.fromRGB(206, 200, 188)
local BRONZE = Color3.fromRGB(62, 52, 46)
local WOODSLAT = Color3.fromRGB(148, 108, 72)
local PHXBLUE = Color3.fromRGB(16, 66, 148)
local PLANEBLUE = Color3.fromRGB(30, 90, 180)
local CACTUS = Color3.fromRGB(74, 140, 82)

local function buildPhxTerminal(root: Folder)
	local function pp(props: { [string]: any }): Part
		local q = part(props)
		q.Parent = root
		return q
	end

	-- Glass curtain wall with bronze mullions, sill and header.
	local function glassWallX(x: number, z0: number, z1: number)
		local len = z1 - z0
		local mid = (z0 + z1) / 2
		pp({ Name = "GlassWall", Size = Vector3.new(0.4, 11, len),
			Position = Vector3.new(x, 7, mid),
			Color = Color3.fromRGB(170, 200, 215), Transparency = 0.55,
			Material = Enum.Material.Glass, CanCollide = false })
		local z = z0
		while z <= z1 + 0.01 do
			pp({ Name = "Mullion", Size = Vector3.new(0.7, 12, 0.7),
				Position = Vector3.new(x, 7, z), Color = BRONZE,
				Material = Enum.Material.Metal, CanCollide = false })
			z += 8
		end
		pp({ Name = "GlassSill", Size = Vector3.new(1, 1, len),
			Position = Vector3.new(x, 1.5, mid), Color = BRONZE,
			Material = Enum.Material.Metal, CanCollide = false })
		pp({ Name = "GlassHeader", Size = Vector3.new(1, 1, len),
			Position = Vector3.new(x, 12.6, mid), Color = BRONZE,
			Material = Enum.Material.Metal, CanCollide = false })
	end
	local function glassWallZ(z: number, x0: number, x1: number)
		local len = x1 - x0
		local mid = (x0 + x1) / 2
		pp({ Name = "GlassWall", Size = Vector3.new(len, 11, 0.4),
			Position = Vector3.new(mid, 7, z),
			Color = Color3.fromRGB(170, 200, 215), Transparency = 0.55,
			Material = Enum.Material.Glass, CanCollide = false })
		local x = x0
		while x <= x1 + 0.01 do
			pp({ Name = "Mullion", Size = Vector3.new(0.7, 12, 0.7),
				Position = Vector3.new(x, 7, z), Color = BRONZE,
				Material = Enum.Material.Metal, CanCollide = false })
			x += 8
		end
	end
	glassWallX(22, -28, 0)
	glassWallX(38, 0, 40)
	glassWallX(22, 40, 80)
	glassWallZ(0, 22, 38)
	glassWallZ(40, 22, 38)

	-- Airfield outside the glass.
	pp({ Name = "Tarmac", Size = Vector3.new(130, 0.5, 200),
		Position = Vector3.new(100, 0.25, 20), Color = Color3.fromRGB(42, 42, 48),
		Material = Enum.Material.Asphalt, CanCollide = false })
	for i = 0, 10 do
		pp({ Name = "TaxiLine", Size = Vector3.new(0.6, 0.6, 6),
			Position = Vector3.new(62, 0.55, -70 + i * 16),
			Color = Color3.fromRGB(220, 180, 60), CanCollide = false })
	end

	local function plane(px: number, pz: number, dir: number)
		local f = Instance.new("Folder")
		f.Name = "Plane"
		f.Parent = root
		local function ap(props: { [string]: any }): Part
			local q = part(props)
			q.Parent = f
			return q
		end
		local white = Color3.fromRGB(235, 235, 240)
		ap({ Name = "Fuselage", Shape = Enum.PartType.Cylinder, Size = Vector3.new(26, 4.4, 4.4),
			CFrame = CFrame.new(px, 6.5, pz) * CFrame.Angles(0, math.pi / 2, 0),
			Color = white, Material = Enum.Material.SmoothPlastic, CanCollide = false })
		ap({ Name = "Nose", Shape = Enum.PartType.Ball, Size = Vector3.new(4.4, 4.4, 4.4),
			Position = Vector3.new(px, 6.5, pz + dir * 13),
			Color = white, Material = Enum.Material.SmoothPlastic, CanCollide = false })
		ap({ Name = "Stripe", Size = Vector3.new(4.7, 0.9, 24),
			Position = Vector3.new(px, 6.5, pz), Color = PLANEBLUE,
			Material = Enum.Material.SmoothPlastic, CanCollide = false })
		ap({ Name = "Wing", Size = Vector3.new(30, 0.6, 5.5),
			Position = Vector3.new(px, 6, pz), Color = white,
			Material = Enum.Material.SmoothPlastic, CanCollide = false })
		ap({ Name = "Tailfin", Size = Vector3.new(0.8, 7, 4.5),
			Position = Vector3.new(px, 10.5, pz - dir * 11), Color = PLANEBLUE,
			Material = Enum.Material.SmoothPlastic, CanCollide = false })
		ap({ Name = "HStab", Size = Vector3.new(11, 0.5, 3),
			Position = Vector3.new(px, 7.5, pz - dir * 11.5), Color = white,
			Material = Enum.Material.SmoothPlastic, CanCollide = false })
		for _, ex in ipairs({ -7, 7 }) do
			ap({ Name = "Engine", Shape = Enum.PartType.Cylinder, Size = Vector3.new(4.5, 2.2, 2.2),
				CFrame = CFrame.new(px + ex, 4.4, pz + dir) * CFrame.Angles(0, math.pi / 2, 0),
				Color = white, Material = Enum.Material.SmoothPlastic, CanCollide = false })
		end
	end
	plane(72, 32, -1)
	plane(88, -18, 1)

	-- Control tower.
	pp({ Name = "TowerShaft", Size = Vector3.new(6, 36, 6),
		Position = Vector3.new(66, 18, 66), Color = Color3.fromRGB(180, 175, 170),
		Material = Enum.Material.Concrete, CanCollide = false })
	pp({ Name = "TowerCab", Size = Vector3.new(11, 5, 11),
		Position = Vector3.new(66, 38, 66), Color = Color3.fromRGB(150, 190, 210),
		Transparency = 0.3, Material = Enum.Material.Glass, CanCollide = false })
	pp({ Name = "TowerRoof", Size = Vector3.new(12, 1, 12),
		Position = Vector3.new(66, 41, 66), Color = BRONZE, CanCollide = false })

	-- Desert mesas on the horizon.
	local ridge = Color3.fromRGB(128, 102, 118)
	for _, m in ipairs({ {175, 95, 42, 30, 70}, {205, 35, 52, 38, 90}, {185, -35, 38, 26, 62}, {215, -75, 46, 32, 80} }) do
		pp({ Name = "Mesa", Size = Vector3.new(m[3], m[4], m[5]),
			Position = Vector3.new(m[1], m[4] * 0.32, m[2]), Color = ridge,
			Material = Enum.Material.SmoothPlastic, CanCollide = false })
	end

	-- Slatted wood wave ceiling (the Terminal 4 signature).
	local z = -28
	while z <= 80 do
		local y = 14 + 1.6 * math.sin(z * 0.12)
		pp({ Name = "CeilSlat", Size = Vector3.new(48, 0.5, 1.7),
			Position = Vector3.new(0, y, z), Color = WOODSLAT,
			Material = Enum.Material.Wood, CanCollide = false })
		z += 2.3
	end

	-- Bronze columns.
	local function column(x: number, cz: number)
		pp({ Name = "Column", Shape = Enum.PartType.Cylinder, Size = Vector3.new(13, 2.2, 2.2),
			CFrame = CFrame.new(x, 7.5, cz) * CFrame.Angles(0, 0, math.pi / 2),
			Color = BRONZE, Material = Enum.Material.Metal, CanCollide = true })
		pp({ Name = "ColumnBase", Shape = Enum.PartType.Cylinder, Size = Vector3.new(1.5, 3.4, 3.4),
			CFrame = CFrame.new(x, 1.25, cz) * CFrame.Angles(0, 0, math.pi / 2),
			Color = BRONZE, Material = Enum.Material.Metal, CanCollide = true })
	end
	for _, c in ipairs({ {-16, 70}, {16, 70}, {-16, 56}, {16, 56}, {-16, 46}, {16, 46},
		{20, 30}, {20, 14}, {20, 34}, {-16, -8}, {16, -8}, {-16, -18}, {16, -18} }) do
		column(c[1], c[2])
	end

	-- Blue backlit wayfinding signs.
	local function waySign(text: string, x: number, sz: number, w: number)
		local box = pp({ Name = "WaySign", Size = Vector3.new(w, 2.2, 0.7),
			Position = Vector3.new(x, 10.5, sz), Color = PHXBLUE,
			Material = Enum.Material.SmoothPlastic, CanCollide = false })
		pp({ Name = "WayHanger", Size = Vector3.new(0.3, 3.5, 0.3),
			Position = Vector3.new(x - w / 3, 13.2, sz), Color = BRONZE, CanCollide = false })
		pp({ Name = "WayHanger", Size = Vector3.new(0.3, 3.5, 0.3),
			Position = Vector3.new(x + w / 3, 13.2, sz), Color = BRONZE, CanCollide = false })
		billboard(box, text, 0, w * 25, Color3.fromRGB(255, 255, 255))
	end
	waySign("TERMINAL 4 · PHX", 0, 74, 18)
	waySign("SECURITY · BAG CHECK", 0, 52, 20)
	waySign("SHOPS · DINING", 0, 38, 18)
	waySign("GATES 26 – 27", 0, -20, 18)

	-- Departure boards.
	local function depBoard(x: number, bz: number)
		pp({ Name = "DepPost", Size = Vector3.new(0.6, 5, 0.6),
			Position = Vector3.new(x, 3, bz), Color = BRONZE, Material = Enum.Material.Metal })
		local board = pp({ Name = "DepBoard", Size = Vector3.new(10, 6, 0.6),
			Position = Vector3.new(x, 8, bz), Color = Color3.fromRGB(8, 12, 18),
			Material = Enum.Material.SmoothPlastic, CanCollide = false })
		boardText(board,
			"RR 27   NEW YORK      BOARDING\nRR 114  DENVER        ON TIME\nRR 208  CHICAGO       ON TIME\nRR 312  DALLAS        DELAYED\nRR 425  LOS ANGELES   BOARDING",
			0, 340, 150)
	end
	depBoard(-10, 76)
	depBoard(12, -22)

	-- "Terminal 4" accent wall at arrivals.
	local twall = pp({ Name = "T4Wall", Size = Vector3.new(26, 9, 1),
		Position = Vector3.new(0, 5.5, 79), Color = Color3.fromRGB(24, 24, 30),
		Material = Enum.Material.SmoothPlastic, CanCollide = false })
	billboard(twall, "Terminal 4", 0, 500, Color3.fromRGB(255, 255, 255))

	-- Check-in counters.
	for _, cx in ipairs({ -12, -4, 4, 12 }) do
		pp({ Name = "CheckIn", Size = Vector3.new(4.5, 2.6, 1.8),
			Position = Vector3.new(cx, 2.3, 74), Color = Color3.fromRGB(225, 220, 210),
			Material = Enum.Material.Marble, CanCollide = true })
		local cs = pp({ Name = "CheckInSign", Size = Vector3.new(4.5, 1.2, 0.4),
			Position = Vector3.new(cx, 4.6, 74), Color = PHXBLUE, CanCollide = false })
		billboard(cs, "CHECK-IN", 0, 220, Color3.fromRGB(255, 255, 255))
	end

	-- Gate seating (black beam seats).
	local function gateSeats(x: number, gz: number)
		pp({ Name = "SeatBeam", Size = Vector3.new(10, 0.5, 1.2),
			Position = Vector3.new(x, 1.6, gz), Color = Color3.fromRGB(22, 22, 26),
			Material = Enum.Material.Metal, CanCollide = true })
		for i = -1.5, 1.5, 1 do
			local sx = x + i * 2.4
			pp({ Name = "SeatPad", Size = Vector3.new(2, 0.35, 1.6),
				Position = Vector3.new(sx, 1.95, gz), Color = Color3.fromRGB(25, 25, 30),
				Material = Enum.Material.Fabric, CanCollide = false })
			pp({ Name = "SeatBack", Size = Vector3.new(2, 1.8, 0.35),
				Position = Vector3.new(sx, 2.9, gz - 0.8), Color = Color3.fromRGB(25, 25, 30),
				Material = Enum.Material.Fabric, CanCollide = false })
			pp({ Name = "SeatLeg", Size = Vector3.new(0.3, 1.6, 0.3),
				Position = Vector3.new(sx, 0.8, gz), Color = Color3.fromRGB(60, 60, 66),
				Material = Enum.Material.Metal, CanCollide = false })
		end
	end
	gateSeats(-7, -24)
	gateSeats(7, -24)

	-- Saguaros in planters.
	local function saguaro(x: number, sz2: number)
		pp({ Name = "Planter", Size = Vector3.new(2.6, 1.2, 2.6),
			Position = Vector3.new(x, 1.6, sz2), Color = Color3.fromRGB(150, 90, 60),
			Material = Enum.Material.Concrete, CanCollide = true })
		pp({ Name = "Cactus", Shape = Enum.PartType.Cylinder, Size = Vector3.new(5, 0.9, 0.9),
			CFrame = CFrame.new(x, 4.7, sz2) * CFrame.Angles(0, 0, math.pi / 2),
			Color = CACTUS, Material = Enum.Material.SmoothPlastic, CanCollide = false })
		pp({ Name = "CactusArm", Shape = Enum.PartType.Cylinder, Size = Vector3.new(2.2, 0.6, 0.6),
			CFrame = CFrame.new(x + 0.85, 4.4, sz2) * CFrame.Angles(0, 0, math.pi / 2),
			Color = CACTUS, Material = Enum.Material.SmoothPlastic, CanCollide = false })
		pp({ Name = "CactusArm", Shape = Enum.PartType.Cylinder, Size = Vector3.new(2.2, 0.6, 0.6),
			CFrame = CFrame.new(x - 0.85, 5.8, sz2) * CFrame.Angles(0, 0, math.pi / 2),
			Color = CACTUS, Material = Enum.Material.SmoothPlastic, CanCollide = false })
	end
	saguaro(18, 66)
	saguaro(-18, -6)
	saguaro(18, -14)
	saguaro(25, 20)
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
		Color = Color3.fromRGB(206, 200, 188),
		Material = Enum.Material.Marble,
	})
	arrivals.Parent = root
	billboard(arrivals, "TERMINAL 4 \u{c2}· PHX", 6, 260)

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
		Color = Color3.fromRGB(202, 196, 184),
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
		Size = Vector3.new(76, 1, 40),
		Position = Vector3.new(0, 0.5, 20),
		Color = Color3.fromRGB(206, 200, 188),
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
		Color = Color3.fromRGB(198, 190, 176),
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
		Size = Vector3.new(44, 1, 6),
		Position = Vector3.new(0, 0.5, -25),
		Color = Color3.fromRGB(202, 196, 184),
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
	buildPhxTerminal(root)

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
