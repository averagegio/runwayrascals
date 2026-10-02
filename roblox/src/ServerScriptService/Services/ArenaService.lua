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

	-- The world sits on the ground: one big slab under everything.
	pp({ Name = "Ground", Size = Vector3.new(600, 1, 600),
		Position = Vector3.new(40, -0.5, -60), Color = Color3.fromRGB(116, 113, 108),
		Material = Enum.Material.Concrete, CanCollide = true })

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
	glassWallX(22, -14, 0)
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
	local z = -34
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
	-- Gate-agent characters (simple blocky NPCs behind counters).
	local skinTones = {
		Color3.fromRGB(200, 160, 130), Color3.fromRGB(150, 110, 85),
		Color3.fromRGB(120, 85, 60), Color3.fromRGB(220, 180, 150),
	}
	local function agent(x: number, z: number, dx: number, dz: number, shirt: Color3, pants: Color3, skin: Color3, tag: string)
		local f = Instance.new("Folder")
		f.Name = "Agent"
		f.Parent = root
		local function ap(props: { [string]: any }): Part
			local q = part(props)
			q.CanCollide = false
			q.Parent = f
			return q
		end
		local sx, sz = -dz, dx
		ap({ Name = "LegL", Size = Vector3.new(0.7, 1.6, 0.7),
			Position = Vector3.new(x + sx * 0.35, 1.8, z + sz * 0.35), Color = pants })
		ap({ Name = "LegR", Size = Vector3.new(0.7, 1.6, 0.7),
			Position = Vector3.new(x - sx * 0.35, 1.8, z - sz * 0.35), Color = pants })
		ap({ Name = "Torso", Size = Vector3.new(1.1, 1.8, 1.1),
			Position = Vector3.new(x, 3.5, z), Color = shirt })
		ap({ Name = "ArmL", Size = Vector3.new(0.5, 1.6, 0.5),
			Position = Vector3.new(x + sx * 0.85, 3.4, z + sz * 0.85), Color = shirt })
		ap({ Name = "ArmR", Size = Vector3.new(0.5, 1.6, 0.5),
			Position = Vector3.new(x - sx * 0.85, 3.4, z - sz * 0.85), Color = shirt })
		local head = ap({ Name = "Head", Shape = Enum.PartType.Ball,
			Size = Vector3.new(1.3, 1.3, 1.3), Position = Vector3.new(x, 4.95, z), Color = skin })
		billboard(head, tag, 1.5, 190, Color3.fromRGB(255, 255, 255))
	end

	-- Airline check-in counters down both sides of Arrivals, each with an agent.
	local airlines = {
		{ "RASCAL AIR", Color3.fromRGB(200, 160, 60) },
		{ "CANYON AIR", Color3.fromRGB(180, 90, 60) },
		{ "MESA AIR", Color3.fromRGB(60, 150, 150) },
		{ "COPPERLINE", Color3.fromRGB(180, 120, 80) },
		{ "SAGUARO AIR", Color3.fromRGB(80, 150, 90) },
		{ "DESERT SUN", Color3.fromRGB(220, 130, 50) },
	}
	for i, al in ipairs(airlines) do
		local name = al[1] :: string
		local brand = al[2] :: Color3
		local side = if i <= 3 then -1 else 1
		local z = 62 + ((i - 1) % 3) * 7
		local x = side * 19
		pp({ Name = "AirlineCounter", Size = Vector3.new(2, 2.6, 4.5),
			Position = Vector3.new(x, 2.3, z), Color = Color3.fromRGB(225, 220, 210),
			Material = Enum.Material.Marble, CanCollide = true })
		pp({ Name = "AirlinePole", Size = Vector3.new(0.25, 2.8, 0.25),
			Position = Vector3.new(x, 4.2, z), Color = BRONZE,
			Material = Enum.Material.Metal, CanCollide = false })
		local sign = pp({ Name = "AirlineSign", Size = Vector3.new(0.5, 1.5, 5),
			Position = Vector3.new(x, 5.6, z), Color = brand,
			Material = Enum.Material.SmoothPlastic, CanCollide = false })
		billboard(sign, name, 0, 260, Color3.fromRGB(255, 255, 255))
		agent(x + side * 1.9, z, -side, 0,
			Color3.fromRGB(40, 50, 90), Color3.fromRGB(30, 30, 34),
			skinTones[(i % 4) + 1], "GATE AGENT")
	end

	-- Bag-check queue maze: chrome posts + navy belts guiding to the arches.
	local function beltPost(x: number, z: number)
		pp({ Name = "BeltBase", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.3, 1, 1),
			CFrame = CFrame.new(x, 1.15, z) * CFrame.Angles(0, 0, math.pi / 2),
			Color = Color3.fromRGB(160, 160, 165), Material = Enum.Material.Metal, CanCollide = false })
		pp({ Name = "BeltPost", Shape = Enum.PartType.Cylinder, Size = Vector3.new(2.6, 0.44, 0.44),
			CFrame = CFrame.new(x, 2.6, z) * CFrame.Angles(0, 0, math.pi / 2),
			Color = Color3.fromRGB(160, 160, 165), Material = Enum.Material.Metal, CanCollide = false })
	end
	local function belt(x1: number, z1: number, x2: number, z2: number)
		local dx, dz = x2 - x1, z2 - z1
		local len = math.sqrt(dx * dx + dz * dz)
		pp({ Name = "Belt", Size = Vector3.new(0.18, 0.55, len),
			CFrame = CFrame.new((x1 + x2) / 2, 2.75, (z1 + z2) / 2)
				* CFrame.Angles(0, math.atan2(dx, dz), 0),
			Color = Color3.fromRGB(25, 35, 90), Material = Enum.Material.Fabric, CanCollide = false })
	end
	for _, rx in ipairs({ -8, 0, 8 }) do
		local z = 47
		while z <= 53 do
			beltPost(rx, z)
			z += 3
		end
		belt(rx, 47, rx, 53)
	end
	belt(-8, 53, 0, 53)
	belt(0, 47, 8, 47)

	-- Gold guide chevrons: one singular route through the terminal.
	for _, cz in ipairs({ 74, 67, 60, 44, 40, 33, 26, 19, 12, 5, -2, -9, -16, -23, -28 }) do
		for _, qx in ipairs({ -1, 1 }) do
			pp({ Name = "GuideChevron", Size = Vector3.new(2.2, 0.15, 0.8),
				CFrame = CFrame.new(qx * 1.1, 1.12, cz) * CFrame.Angles(0, qx * 0.5, 0),
				Color = Color3.fromRGB(220, 170, 60), Material = Enum.Material.Neon, CanCollide = false })
		end
	end

	-- VALISE: luxury luggage house (west strip) with checker facade.
	pp({ Name = "ValiseBack", Size = Vector3.new(1, 8, 14),
		Position = Vector3.new(-37, 5, 20), Color = Color3.fromRGB(50, 35, 25),
		Material = Enum.Material.Concrete, CanCollide = true })
	pp({ Name = "ValiseSideN", Size = Vector3.new(8, 8, 1),
		Position = Vector3.new(-33.5, 5, 13.5), Color = Color3.fromRGB(50, 35, 25),
		Material = Enum.Material.Concrete, CanCollide = true })
	pp({ Name = "ValiseSideS", Size = Vector3.new(8, 8, 1),
		Position = Vector3.new(-33.5, 5, 26.5), Color = Color3.fromRGB(50, 35, 25),
		Material = Enum.Material.Concrete, CanCollide = true })
	for _, seg in ipairs({ {14, 18}, {22, 26} }) do
		local z0, z1 = seg[1], seg[2]
		pp({ Name = "ValiseFront", Size = Vector3.new(1, 7, z1 - z0),
			Position = Vector3.new(-30, 4.5, (z0 + z1) / 2), Color = Color3.fromRGB(60, 40, 28),
			Material = Enum.Material.Wood, CanCollide = true })
		for r = 0, 2 do
			for c = 0, 1 do
				local chk = (r + c) % 2 == 0
				pp({ Name = "ValiseCheck", Size = Vector3.new(0.15, 1.7, 1.7),
					Position = Vector3.new(-29.4, 2.6 + r * 1.9, z0 + 1 + c * 2),
					Color = if chk then Color3.fromRGB(110, 70, 40) else Color3.fromRGB(200, 170, 90),
					Material = Enum.Material.SmoothPlastic, CanCollide = false })
			end
		end
	end
	local vsign = pp({ Name = "ValiseSign", Size = Vector3.new(0.5, 1.6, 12),
		Position = Vector3.new(-29.5, 8.4, 20), Color = Color3.fromRGB(200, 170, 90),
		Material = Enum.Material.SmoothPlastic, CanCollide = false })
	billboard(vsign, "VALISE", 0, 300, Color3.fromRGB(60, 40, 20))
	for _, pz in ipairs({ 16, 20, 24 }) do
		pp({ Name = "ValisePed", Size = Vector3.new(1.6, 2.2, 1.6),
			Position = Vector3.new(-34, 2.1, pz), Color = Color3.fromRGB(225, 220, 210),
			Material = Enum.Material.Marble, CanCollide = true })
		pp({ Name = "ValiseBag", Size = Vector3.new(0.9, 1.1, 0.5),
			Position = Vector3.new(-34, 3.8, pz), Color = Color3.fromRGB(110, 70, 40),
			Material = Enum.Material.Leather, CanCollide = false })
	end

	-- NOUVELLE: couture house (west strip, north of VALISE).
	pp({ Name = "NouvBack", Size = Vector3.new(1, 8, 12),
		Position = Vector3.new(-37, 5, 33.5), Color = Color3.fromRGB(205, 200, 190),
		Material = Enum.Material.Concrete, CanCollide = true })
	pp({ Name = "NouvSideN", Size = Vector3.new(8, 8, 1),
		Position = Vector3.new(-33.5, 5, 28), Color = Color3.fromRGB(205, 200, 190),
		Material = Enum.Material.Concrete, CanCollide = true })
	pp({ Name = "NouvSideS", Size = Vector3.new(8, 8, 1),
		Position = Vector3.new(-33.5, 5, 39), Color = Color3.fromRGB(205, 200, 190),
		Material = Enum.Material.Concrete, CanCollide = true })
	for _, seg in ipairs({ {28.5, 31.5}, {35.5, 38.5} }) do
		local z0, z1 = seg[1], seg[2]
		pp({ Name = "NouvFront", Size = Vector3.new(1, 7, z1 - z0),
			Position = Vector3.new(-30, 4.5, (z0 + z1) / 2), Color = Color3.fromRGB(210, 205, 195),
			Material = Enum.Material.Marble, CanCollide = true })
	end
	local nsign = pp({ Name = "NouvSign", Size = Vector3.new(0.5, 1.6, 10),
		Position = Vector3.new(-29.5, 8.4, 33.5), Color = Color3.fromRGB(90, 85, 95),
		Material = Enum.Material.SmoothPlastic, CanCollide = false })
	billboard(nsign, "NOUVELLE", 0, 280, Color3.fromRGB(255, 255, 255))
	for _, pz in ipairs({ 31, 36 }) do
		pp({ Name = "NouvPed", Size = Vector3.new(1.4, 1, 1.4),
			Position = Vector3.new(-34, 1.5, pz), Color = Color3.fromRGB(225, 220, 210),
			Material = Enum.Material.Marble, CanCollide = true })
		pp({ Name = "NouvGown", Size = Vector3.new(1, 2.6, 0.8),
			Position = Vector3.new(-34, 3.3, pz), Color = Color3.fromRGB(220, 170, 180),
			Material = Enum.Material.Fabric, CanCollide = false })
	end

	-- Mezzanine overlook + walkable escalator (mall north end).
	pp({ Name = "MezzFloor", Size = Vector3.new(32, 1, 6),
		Position = Vector3.new(0, 7, 37), Color = TERRAZZO,
		Material = Enum.Material.Marble, CanCollide = true })
	for _, mx in ipairs({ -16, 16 }) do
		for _, mz in ipairs({ 35, 39 }) do
			pp({ Name = "MezzPost", Size = Vector3.new(1, 7, 1),
				Position = Vector3.new(mx, 4.5, mz), Color = BRONZE,
				Material = Enum.Material.Metal, CanCollide = true })
		end
	end
	pp({ Name = "MezzGlass", Size = Vector3.new(32, 2.2, 0.3),
		Position = Vector3.new(0, 9.35, 34), Color = Color3.fromRGB(170, 200, 215),
		Transparency = 0.5, Material = Enum.Material.Glass, CanCollide = false })
	pp({ Name = "MezzRail", Size = Vector3.new(32, 0.35, 0.5),
		Position = Vector3.new(0, 10.6, 34), Color = BRONZE,
		Material = Enum.Material.Metal, CanCollide = false })
	for i = 0, 12 do
		pp({ Name = "EscStep", Size = Vector3.new(3, 0.5, 0.75),
			Position = Vector3.new(-8, 1.25 + i * 0.5, 26.3 + i * 0.615),
			Color = Color3.fromRGB(140, 140, 145), Material = Enum.Material.Metal, CanCollide = true })
	end
	for _, ex in ipairs({ -9.7, -6.3 }) do
		pp({ Name = "EscGlass", Size = Vector3.new(0.3, 3, 10.8),
			CFrame = CFrame.new(ex, 5.75, 30) * CFrame.Angles(-0.68, 0, 0),
			Color = Color3.fromRGB(170, 200, 215), Transparency = 0.45,
			Material = Enum.Material.Glass, CanCollide = false })
		pp({ Name = "EscRail", Size = Vector3.new(0.4, 0.4, 10.8),
			CFrame = CFrame.new(ex, 7.4, 30) * CFrame.Angles(-0.68, 0, 0),
			Color = Color3.fromRGB(40, 40, 45), Material = Enum.Material.SmoothPlastic, CanCollide = false })
	end

	-- Glass elevator.
	for _, w in ipairs({ {24, 34.2, 4, 0.3}, {24, 37.8, 4, 0.3} }) do
		pp({ Name = "LiftGlass", Size = Vector3.new(w[3], 12, w[4]),
			Position = Vector3.new(w[1], 7, w[2]), Color = Color3.fromRGB(170, 200, 215),
			Transparency = 0.45, Material = Enum.Material.Glass, CanCollide = false })
	end
	for _, w in ipairs({ {22.2, 36}, {25.8, 36} }) do
		pp({ Name = "LiftGlass", Size = Vector3.new(0.3, 12, 4),
			Position = Vector3.new(w[1], 7, w[2]), Color = Color3.fromRGB(170, 200, 215),
			Transparency = 0.45, Material = Enum.Material.Glass, CanCollide = false })
	end
	pp({ Name = "LiftCab", Size = Vector3.new(3, 4.5, 3),
		Position = Vector3.new(24, 3.25, 36), Color = Color3.fromRGB(150, 150, 155),
		Material = Enum.Material.Metal, CanCollide = true })
	pp({ Name = "LiftDoorL", Size = Vector3.new(1.4, 4, 0.15),
		Position = Vector3.new(23.3, 3.2, 34.35), Color = Color3.fromRGB(110, 110, 115),
		Material = Enum.Material.Metal, CanCollide = false })
	pp({ Name = "LiftDoorR", Size = Vector3.new(1.4, 4, 0.15),
		Position = Vector3.new(24.7, 3.2, 34.35), Color = Color3.fromRGB(110, 110, 115),
		Material = Enum.Material.Metal, CanCollide = false })
	pp({ Name = "LiftCap", Size = Vector3.new(4.6, 0.6, 4.6),
		Position = Vector3.new(24, 13.3, 36), Color = BRONZE,
		Material = Enum.Material.Metal, CanCollide = false })
	local lsign = pp({ Name = "LiftSign", Size = Vector3.new(3, 1, 0.4),
		Position = Vector3.new(24, 10.5, 34.1), Color = PHXBLUE, CanCollide = false })
	billboard(lsign, "LIFT", 0, 150, Color3.fromRGB(255, 255, 255))

	-- Photo booth (gates area).
	pp({ Name = "BoothPad", Size = Vector3.new(3.5, 0.2, 3.5),
		Position = Vector3.new(-15, 1.1, -25), Color = Color3.fromRGB(90, 85, 95),
		Material = Enum.Material.Carpet, CanCollide = false })
	pp({ Name = "BoothBack", Size = Vector3.new(3.5, 5, 0.3),
		Position = Vector3.new(-15, 3.5, -26.5), Color = Color3.fromRGB(220, 170, 180),
		Material = Enum.Material.Fabric, CanCollide = true })
	pp({ Name = "BoothSideL", Size = Vector3.new(0.3, 5, 3.5),
		Position = Vector3.new(-16.6, 3.5, -25), Color = Color3.fromRGB(220, 170, 180),
		Material = Enum.Material.Fabric, CanCollide = true })
	pp({ Name = "BoothSideR", Size = Vector3.new(0.3, 5, 3.5),
		Position = Vector3.new(-13.4, 3.5, -25), Color = Color3.fromRGB(220, 170, 180),
		Material = Enum.Material.Fabric, CanCollide = true })
	for c = 0, 4 do
		pp({ Name = "BoothCurtain", Size = Vector3.new(0.62, 4.2, 0.15),
			Position = Vector3.new(-16.25 + c * 0.65, 3.1, -23.4),
			Color = if c % 2 == 0 then Color3.fromRGB(220, 170, 180) else Color3.fromRGB(245, 240, 235),
			Material = Enum.Material.Fabric, CanCollide = false })
	end
	pp({ Name = "BoothRoof", Size = Vector3.new(3.8, 0.3, 3.8),
		Position = Vector3.new(-15, 6.1, -25), Color = Color3.fromRGB(90, 85, 95),
		Material = Enum.Material.SmoothPlastic, CanCollide = false })
	local bsign = pp({ Name = "BoothSign", Size = Vector3.new(3.4, 1, 0.4),
		Position = Vector3.new(-15, 6.9, -23.4), Color = PHXBLUE, CanCollide = false })
	billboard(bsign, "PHOTOS", 0, 200, Color3.fromRGB(255, 255, 255))
	pp({ Name = "BoothBench", Size = Vector3.new(2, 1, 1),
		Position = Vector3.new(-15, 1.6, -25.8), Color = Color3.fromRGB(60, 55, 70),
		Material = Enum.Material.Fabric, CanCollide = true })
	pp({ Name = "BoothCam", Size = Vector3.new(0.8, 0.6, 0.8),
		Position = Vector3.new(-15, 3.6, -24.2), Color = Color3.fromRGB(30, 30, 35),
		Material = Enum.Material.SmoothPlastic, CanCollide = false })
	pp({ Name = "BoothFlash", Size = Vector3.new(0.5, 0.5, 0.2),
		Position = Vector3.new(-15, 3.6, -23.75), Color = Color3.fromRGB(255, 255, 255),
		Material = Enum.Material.Neon, CanCollide = false })

	-- Mall power walkway (speeds up terminal walkers).
	local beltPart = pp({ Name = "TerminalTravelator", Size = Vector3.new(6, 0.25, 34),
		Position = Vector3.new(12, 1.15, 21), Color = Color3.fromRGB(30, 30, 36),
		Material = Enum.Material.SmoothPlastic, CanCollide = false })
	beltPart.TopSurface = Enum.SurfaceType.Smooth
	for _, ex in ipairs({ 9.2, 14.8 }) do
		pp({ Name = "BeltEdge", Size = Vector3.new(0.3, 0.3, 34),
			Position = Vector3.new(ex, 1.2, 21), Color = Color3.fromRGB(220, 180, 60),
			Material = Enum.Material.Neon, CanCollide = false })
	end
	for i = 1, 5 do
		local cz = 36 - (i - 0.5) * (32 / 5)
		for _, qx in ipairs({ -1, 1 }) do
			pp({ Name = "BeltChevron", Size = Vector3.new(2.4, 0.28, 0.9),
				CFrame = CFrame.new(12 + qx * 1.3, 1.32, cz) * CFrame.Angles(0, qx * 0.5, 0),
				Color = Color3.fromRGB(235, 250, 255), Material = Enum.Material.Neon, CanCollide = false })
		end
	end
	local tsign = pp({ Name = "TravelatorSign", Size = Vector3.new(8, 1.6, 0.5),
		Position = Vector3.new(12, 6.5, 2.5), Color = PHXBLUE, CanCollide = false })
	billboard(tsign, "POWER WALKWAY >>", 0, 320, Color3.fromRGB(255, 255, 255))

	-- Gate 27 lounge: the route now reaches the aircraft.
	pp({ Name = "LoungeFloor", Size = Vector3.new(30, 1, 18),
		Position = Vector3.new(37, 0.5, -23), Color = TERRAZZO,
		Material = Enum.Material.Marble, CanCollide = true })
	for _, wz in ipairs({ -14, -32 }) do
		pp({ Name = "LoungeWallLow", Size = Vector3.new(30, 4, 1),
			Position = Vector3.new(37, 3, wz), Color = Color3.fromRGB(178, 168, 152),
			Material = Enum.Material.Concrete, CanCollide = true })
		pp({ Name = "LoungeGlass", Size = Vector3.new(30, 5, 0.6),
			Position = Vector3.new(37, 7.5, wz), Color = Color3.fromRGB(170, 200, 215),
			Transparency = 0.5, Material = Enum.Material.Glass, CanCollide = false })
	end
	pp({ Name = "LoungeWallE1", Size = Vector3.new(1, 10, 5),
		Position = Vector3.new(52, 6, -29.5), Color = Color3.fromRGB(178, 168, 152),
		Material = Enum.Material.Concrete, CanCollide = true })
	pp({ Name = "LoungeWallE2", Size = Vector3.new(1, 10, 5),
		Position = Vector3.new(52, 6, -16.5), Color = Color3.fromRGB(178, 168, 152),
		Material = Enum.Material.Concrete, CanCollide = true })
	waySign("GATE 27", 37, -23, 14)
	gateSeats(38, -18)
	gateSeats(38, -28)
	depBoard(46, -16)
	pp({ Name = "GatePodium", Size = Vector3.new(2, 3.5, 1.2),
		Position = Vector3.new(26, 2.75, -17), Color = Color3.fromRGB(225, 220, 210),
		Material = Enum.Material.Marble, CanCollide = true })
	agent(26, -18.6, 0, 1, Color3.fromRGB(40, 50, 90), Color3.fromRGB(30, 30, 34),
		skinTones[2], "GATE AGENT")

	-- Jet bridge to the aircraft.
	pp({ Name = "BridgeFloor", Size = Vector3.new(25, 0.6, 4),
		Position = Vector3.new(64.5, 1.3, -24), Color = Color3.fromRGB(120, 118, 115),
		Material = Enum.Material.Concrete, CanCollide = true })
	pp({ Name = "BridgeRoof", Size = Vector3.new(25, 0.5, 4),
		Position = Vector3.new(64.5, 5.2, -24), Color = Color3.fromRGB(90, 88, 86),
		Material = Enum.Material.Metal, CanCollide = false })
	for _, bz in ipairs({ -26, -22 }) do
		pp({ Name = "BridgeWall", Size = Vector3.new(25, 2, 0.4),
			Position = Vector3.new(64.5, 2.6, bz), Color = Color3.fromRGB(150, 148, 144),
			Material = Enum.Material.Metal, CanCollide = true })
		pp({ Name = "BridgeGlass", Size = Vector3.new(25, 1.6, 0.3),
			Position = Vector3.new(64.5, 4.4, bz), Color = Color3.fromRGB(170, 200, 215),
			Transparency = 0.45, Material = Enum.Material.Glass, CanCollide = false })
	end
	pp({ Name = "BridgeBellows", Size = Vector3.new(2.5, 5, 5),
		Position = Vector3.new(76.8, 3.5, -24), Color = Color3.fromRGB(30, 30, 35),
		Material = Enum.Material.Fabric, CanCollide = false })
	pp({ Name = "BridgeWheels", Size = Vector3.new(2, 1, 3),
		Position = Vector3.new(70, 1, -24), Color = Color3.fromRGB(40, 40, 45),
		Material = Enum.Material.Metal, CanCollide = false })

	-- The aircraft at the gate (nose north, bridge meets the forward door).
	plane(80, -32, 1)
	pp({ Name = "AircraftDoor", Size = Vector3.new(0.3, 5, 3),
		Position = Vector3.new(77.6, 4, -24), Color = Color3.fromRGB(20, 24, 32),
		Material = Enum.Material.SmoothPlastic, CanCollide = false })
	pp({ Name = "PlaneDoor", Size = Vector3.new(3, 7, 5),
		Position = Vector3.new(76.5, 4.5, -24), Transparency = 1, CanCollide = false })

	-- Gate 27 at the END of the runway: the run connects to the aircraft.
	pp({ Name = "ArrivalHall", Size = Vector3.new(44, 1, 20),
		Position = Vector3.new(0, 0.5, -210), Color = TERRAZZO,
		Material = Enum.Material.Marble, CanCollide = true })
	waySign("GATE 27", 0, -208, 14)
	pp({ Name = "GateBridgeFloor", Size = Vector3.new(5, 0.6, 12),
		Position = Vector3.new(8, 1.0, -224), Color = Color3.fromRGB(120, 118, 115),
		Material = Enum.Material.Concrete, CanCollide = true })
	pp({ Name = "GateBridgeRoof", Size = Vector3.new(5.6, 0.5, 12),
		Position = Vector3.new(8, 5.85, -224), Color = Color3.fromRGB(90, 88, 86),
		Material = Enum.Material.Metal, CanCollide = false })
	for _, bx in ipairs({ 5.5, 10.5 }) do
		pp({ Name = "GateBridgeWall", Size = Vector3.new(0.4, 3, 12),
			Position = Vector3.new(bx, 2.8, -224), Color = Color3.fromRGB(150, 148, 144),
			Material = Enum.Material.Metal, CanCollide = true })
		pp({ Name = "GateBridgeGlass", Size = Vector3.new(0.3, 1.4, 12),
			Position = Vector3.new(bx, 5.0, -224), Color = Color3.fromRGB(170, 200, 215),
			Transparency = 0.45, Material = Enum.Material.Glass, CanCollide = false })
	end
	pp({ Name = "GateBellows", Size = Vector3.new(5, 5, 2.5),
		Position = Vector3.new(8, 3.5, -229.5), Color = Color3.fromRGB(30, 30, 35),
		Material = Enum.Material.Fabric, CanCollide = false })
	local white = Color3.fromRGB(235, 235, 240)
	pp({ Name = "GateFuselage", Shape = Enum.PartType.Cylinder, Size = Vector3.new(26, 4.4, 4.4),
		Position = Vector3.new(0, 6.5, -232), Color = white,
		Material = Enum.Material.SmoothPlastic, CanCollide = false })
	pp({ Name = "GateNose", Shape = Enum.PartType.Ball, Size = Vector3.new(4.4, 4.4, 4.4),
		Position = Vector3.new(13, 6.5, -232), Color = white,
		Material = Enum.Material.SmoothPlastic, CanCollide = false })
	pp({ Name = "GateStripe", Size = Vector3.new(24, 0.9, 4.7),
		Position = Vector3.new(0, 6.5, -232), Color = PLANEBLUE,
		Material = Enum.Material.SmoothPlastic, CanCollide = false })
	pp({ Name = "GateWing", Size = Vector3.new(5.5, 0.6, 30),
		Position = Vector3.new(0, 6, -232), Color = white,
		Material = Enum.Material.SmoothPlastic, CanCollide = false })
	pp({ Name = "GateTailfin", Size = Vector3.new(4.5, 7, 0.8),
		Position = Vector3.new(-11, 10.5, -232), Color = PLANEBLUE,
		Material = Enum.Material.SmoothPlastic, CanCollide = false })
	pp({ Name = "GateHStab", Size = Vector3.new(3, 0.5, 11),
		Position = Vector3.new(-11.5, 7.5, -232), Color = white,
		Material = Enum.Material.SmoothPlastic, CanCollide = false })
	for _, ez in ipairs({ -239, -225 }) do
		pp({ Name = "GateEngine", Shape = Enum.PartType.Cylinder, Size = Vector3.new(4.5, 2.2, 2.2),
			Position = Vector3.new(0, 4.4, ez), Color = white,
			Material = Enum.Material.SmoothPlastic, CanCollide = false })
	end
	pp({ Name = "GateAircraftDoor", Size = Vector3.new(3, 5, 0.3),
		Position = Vector3.new(8, 4, -229.7), Color = Color3.fromRGB(20, 24, 32),
		Material = Enum.Material.SmoothPlastic, CanCollide = false })
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
			Position = Vector3.new(-70 + i * 22, 12, finishZ - 64),
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
