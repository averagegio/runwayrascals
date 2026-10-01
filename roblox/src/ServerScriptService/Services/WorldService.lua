--!strict
--[[
	Rascal City — persistent fashion world around the Fashion Week venue.

	Layout (studs, XZ plane; see Config.World + docs/WORLD.md):
	  - Fashion Week Hall (the existing ArenaService runway) stays at origin.
	  - Grand Avenue runs south from the venue gate to Central Plaza.
	  - Central Plaza is the spawn + social heart: fountain, RR arch, selfie spot.
	  - Six districts ring the avenue, one per Config.Cities entry, each dressed
	    in its house accent color.
	  - The flagship Boutique sits on the plaza; BoutiqueService stocks it.

	Players spawn on the plaza, explore / shop / socialize, and walk to the
	venue when a show starts. RoundService is untouched: it already returns
	players to "LobbySpawn" after a show, and WorldService moves that spawn
	to the plaza (same name, new home), so the loop becomes city → show → city.
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)

local ArenaService = require(script.Parent.ArenaService)

local WorldService = {}

local GOLD = Color3.fromRGB(201, 165, 106)
local ASPHALT = Color3.fromRGB(22, 19, 26)
local SIDEWALK = Color3.fromRGB(38, 34, 44)

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
	gui.AlwaysOnTop = true
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

-- dy lifts the whole prop onto a raised surface (plaza disc top = 2, district platform top = 1.2).
local function lamp(parent: Instance, x: number, z: number, accent: Color3?, dy: number?)
	local lift = dy or 0
	local pole = part({
		Name = "StreetLamp",
		Size = Vector3.new(0.6, 14, 0.6),
		Position = Vector3.new(x, 8 + lift, z),
		Color = Color3.fromRGB(30, 26, 36),
		CanCollide = false,
	})
	pole.Parent = parent
	local bulb = part({
		Name = "LampBulb",
		Size = Vector3.new(1.8, 0.7, 1.8),
		Position = Vector3.new(x, 15.2 + lift, z),
		Color = accent or Color3.fromRGB(255, 214, 170),
		Material = Enum.Material.Neon,
		CanCollide = false,
	})
	bulb.Parent = parent
	local light = Instance.new("PointLight")
	light.Brightness = 2
	light.Range = 30
	light.Color = accent or Color3.fromRGB(255, 220, 180)
	light.Parent = bulb
end

local function bench(parent: Instance, x: number, z: number, rotY: number, dy: number?)
	local lift = dy or 0
	local seat = part({
		Name = "Bench",
		Size = Vector3.new(6, 0.6, 2),
		Position = Vector3.new(x, 1.6 + lift, z),
		Color = Color3.fromRGB(52, 40, 48),
		Material = Enum.Material.Wood,
	})
	seat.CFrame = CFrame.new(x, 1.6 + lift, z) * CFrame.Angles(0, math.rad(rotY), 0)
	seat.Parent = parent
	for _, dx in { -2.4, 2.4 } do
		local leg = part({
			Name = "BenchLeg",
			Size = Vector3.new(0.5, 1.3, 1.8),
			Position = (seat.CFrame * CFrame.new(dx, -1, 0)).Position,
			Color = Color3.fromRGB(30, 26, 34),
			CanCollide = false,
		})
		leg.Parent = parent
	end
end

local function planter(parent: Instance, x: number, z: number, dy: number?)
	local lift = dy or 0
	local box = part({
		Name = "Planter",
		Size = Vector3.new(3, 2, 3),
		Position = Vector3.new(x, 2 + lift, z),
		Color = Color3.fromRGB(44, 38, 46),
		Material = Enum.Material.Slate,
	})
	box.Parent = parent
	local bush = part({
		Name = "Bush",
		Shape = Enum.PartType.Ball,
		Size = Vector3.new(3.4, 3.4, 3.4),
		Position = Vector3.new(x, 4.2 + lift, z),
		Color = Color3.fromRGB(34, 84, 52),
		Material = Enum.Material.Grass,
		CanCollide = false,
	})
	bush.Parent = parent
end

local function arch(parent: Instance, x: number, z: number, width: number, height: number, text: string, accent: Color3)
	for _, side in { -1, 1 } do
		local pillar = part({
			Name = "ArchPillar",
			Size = Vector3.new(2, height, 2),
			Position = Vector3.new(x + side * width / 2, 1 + height / 2, z),
			Color = Color3.fromRGB(26, 22, 32),
			Material = Enum.Material.Marble,
		})
		pillar.Parent = parent
		local trim = part({
			Name = "ArchTrim",
			Size = Vector3.new(2.3, 1.2, 2.3),
			Position = Vector3.new(x + side * width / 2, 1 + height - 0.6, z),
			Color = accent,
			Material = Enum.Material.Neon,
			CanCollide = false,
		})
		trim.Parent = parent
	end
	local beam = part({
		Name = "ArchBeam",
		Size = Vector3.new(width + 2, 2.4, 2.4),
		Position = Vector3.new(x, 1 + height + 1.2, z),
		Color = Color3.fromRGB(26, 22, 32),
		Material = Enum.Material.Marble,
	})
	beam.Parent = parent
	billboard(beam, text, 0.4, 260)
end

local function building(parent: Instance, x: number, z: number, w: number, h: number, d: number, accent: Color3, name: string?)
	local body = part({
		Name = "Building",
		Size = Vector3.new(w, h, d),
		Position = Vector3.new(x, 1 + h / 2, z),
		Color = Color3.fromRGB(30, 26, 38),
		Material = Enum.Material.Concrete,
	})
	body.Parent = parent
	-- Neon window bands on the street-facing side.
	for i = 1, math.max(1, math.floor(h / 8)) do
		local band = part({
			Name = "Windows",
			Size = Vector3.new(w * 0.8, 1.1, 0.3),
			Position = Vector3.new(x, 1 + i * 8, z - d / 2 - 0.1),
			Color = accent,
			Material = Enum.Material.Neon,
			CanCollide = false,
		})
		band.Parent = parent
	end
	-- Accent cornice.
	local cornice = part({
		Name = "Cornice",
		Size = Vector3.new(w + 1, 0.8, d + 1),
		Position = Vector3.new(x, 1 + h + 0.4, z),
		Color = accent,
		Material = Enum.Material.Neon,
		CanCollide = false,
	})
	cornice.Parent = parent
	if name then
		billboard(body, name, h / 2 + 2, 220)
	end
	return body
end

local function buildDistrict(root: Folder, city: any, dx: number, dz: number)
	local house = (Config.Houses :: any)[city.houseId]
	local accent: Color3 = if house then house.accent else GOLD
	local size: number = Config.World.districtSize
	local half = size / 2

	local district = Instance.new("Folder")
	district.Name = "District_" .. city.id
	district.Parent = root

	-- Raised district platform in a house-tinted tone.
	local platform = part({
		Name = "DistrictPlatform",
		Size = Vector3.new(size, 1, size),
		Position = Vector3.new(dx, 0.7, dz),
		Color = Color3.fromRGB(30, 26, 36),
		Material = Enum.Material.Slate,
	})
	platform.Parent = district

	-- Three buildings around the block edges, heights vary for a skyline feel.
	local seeds = { 0.9, 1.25, 1.0 }
	for b = 1, 3 do
		local h = 14 + seeds[b] * 10
		local bx = dx + (b - 2) * (half - 8)
		local bz = dz - half + 9
		if b == 3 then
			bz = dz + half - 9
		end
		building(district, bx, bz, 13, h, 12, accent)
	end

	-- Gateway arch on the avenue-facing side.
	local gateX = dx + (if dx < 0 then half - 2 else -(half - 2))
	local showName = if house then house.showName else city.name
	arch(district, gateX, dz, 12, 10, string.upper(city.name) .. " · " .. string.upper(showName), accent)

	-- Lamps + greenery inside the block (lifted onto the platform).
	lamp(district, dx - 12, dz + 12, accent, 0.2)
	lamp(district, dx + 12, dz - 12, accent, 0.2)
	planter(district, dx - 14, dz - 14, 0.2)
	planter(district, dx + 14, dz + 14, 0.2)
	bench(district, dx, dz + 16, 0, 0.2)

	return district
end

local function buildPlaza(root: Folder, plaza: any)
	-- Circular stone plaza.
	local disc = part({
		Name = "CentralPlaza",
		Shape = Enum.PartType.Cylinder,
		Size = Vector3.new(2, plaza.radius * 2, plaza.radius * 2),
		Position = Vector3.new(plaza.x, 1, plaza.z),
		Color = Color3.fromRGB(44, 38, 52),
		Material = Enum.Material.Slate,
	})
	-- Cylinder axis is X; rotate so the disc lies flat.
	disc.CFrame = CFrame.new(plaza.x, 1, plaza.z) * CFrame.Angles(0, 0, math.rad(90))
	disc.Parent = root

	-- Gold inlay ring.
	local ring = part({
		Name = "PlazaRing",
		Shape = Enum.PartType.Cylinder,
		Size = Vector3.new(0.3, plaza.radius * 1.5, plaza.radius * 1.5),
		Position = Vector3.new(plaza.x, 2.1, plaza.z),
		Color = GOLD,
		Material = Enum.Material.Neon,
		CanCollide = false,
	})
	ring.CFrame = CFrame.new(plaza.x, 2.1, plaza.z) * CFrame.Angles(0, 0, math.rad(90))
	ring.Parent = root

	-- Tiered fountain at the center.
	local baseY = 2
	for tier, r in { 7, 5, 3 } do
		local t = part({
			Name = "FountainTier",
			Shape = Enum.PartType.Cylinder,
			Size = Vector3.new(1.2, r * 2, r * 2),
			Position = Vector3.new(plaza.x, baseY + tier * 1.6, plaza.z),
			Color = Color3.fromRGB(60, 54, 70),
			Material = Enum.Material.Marble,
		})
		t.CFrame = CFrame.new(plaza.x, baseY + tier * 1.6, plaza.z) * CFrame.Angles(0, 0, math.rad(90))
		t.Parent = root
	end
	local water = part({
		Name = "FountainWater",
		Shape = Enum.PartType.Cylinder,
		Size = Vector3.new(0.4, 12.6, 12.6),
		Position = Vector3.new(plaza.x, baseY + 1.8, plaza.z),
		Color = Color3.fromRGB(90, 180, 230),
		Material = Enum.Material.Neon,
		CanCollide = false,
	})
	water.CFrame = CFrame.new(plaza.x, baseY + 1.8, plaza.z) * CFrame.Angles(0, 0, math.rad(90))
	water.Parent = root
	local glow = Instance.new("PointLight")
	glow.Brightness = 2.5
	glow.Range = 36
	glow.Color = Color3.fromRGB(120, 200, 255)
	glow.Parent = water

	-- Grand RR arch at the plaza's north entrance (avenue side).
	arch(root, plaza.x, plaza.z - plaza.radius + 6, 16, 12, "RASCAL RUNWAYS", GOLD)

	-- Selfie spot platform.
	local spot = part({
		Name = "SelfieSpot",
		Size = Vector3.new(8, 0.6, 8),
		Position = Vector3.new(plaza.x + 18, 2.3, plaza.z + 14),
		Color = GOLD,
		Material = Enum.Material.Foil,
		CanCollide = true,
	})
	spot.Parent = root
	billboard(spot, "SELFIE SPOT", 4, 170)

	-- Lamp ring + benches around the plaza (lifted onto the disc, skipping the boutique).
	local shop = Config.World.boutique
	local function inShop(x: number, z: number): boolean
		return x > shop.x - shop.w / 2
			and x < shop.x + shop.w / 2
			and z > shop.z - shop.d / 2
			and z < shop.z + shop.d / 2
	end
	for i = 0, 7 do
		local a = (i / 8) * math.pi * 2
		local lx = plaza.x + math.cos(a) * (plaza.radius - 4)
		local lz = plaza.z + math.sin(a) * (plaza.radius - 4)
		if not inShop(lx, lz) then
			lamp(root, lx, lz, nil, 1)
		end
	end
	bench(root, plaza.x - 16, plaza.z - 10, 35, 1)
	bench(root, plaza.x + 16, plaza.z - 10, -35, 1)
	planter(root, plaza.x - 24, plaza.z + 18, 1)
	planter(root, plaza.x + 24, plaza.z + 18, 1)
end

local function buildBoutiqueShell(root: Folder, b: any)
	local shell = Instance.new("Folder")
	shell.Name = "Boutique"
	shell.Parent = root

	local wallT = 1.2
	-- Floor.
	local floor = part({
		Name = "BoutiqueFloor",
		Size = Vector3.new(b.w, 1, b.d),
		Position = Vector3.new(b.x, 1.5, b.z),
		Color = Color3.fromRGB(52, 44, 58),
		Material = Enum.Material.Marble,
	})
	floor.Parent = shell

	-- Walls: back + sides full, front (+x, plaza side) with a wide entrance gap.
	local function wall(name: string, w: number, d: number, x: number, z: number)
		local p = part({
			Name = name,
			Size = Vector3.new(w, b.h, d),
			Position = Vector3.new(x, 2 + b.h / 2, z),
			Color = Color3.fromRGB(34, 30, 42),
			Material = Enum.Material.Concrete,
		})
		p.Parent = shell
		return p
	end
	wall("BackWall", wallT, b.d, b.x - b.w / 2, b.z)
	wall("SideWallN", b.w, wallT, b.x, b.z - b.d / 2)
	wall("SideWallS", b.w, wallT, b.x, b.z + b.d / 2)
	-- Front wall (+x, plaza side) split into two segments leaving an 8-stud entrance.
	local segLen = (b.d - 8) / 2
	wall("FrontWallA", wallT, segLen, b.x + b.w / 2, b.z - b.d / 2 + segLen / 2)
	wall("FrontWallB", wallT, segLen, b.x + b.w / 2, b.z + b.d / 2 - segLen / 2)

	-- Roof + glowing sign band.
	local roof = part({
		Name = "BoutiqueRoof",
		Size = Vector3.new(b.w + 2, 1.4, b.d + 2),
		Position = Vector3.new(b.x, 2 + b.h + 0.7, b.z),
		Color = Color3.fromRGB(26, 22, 34),
		Material = Enum.Material.Slate,
	})
	roof.Parent = shell
	local signBand = part({
		Name = "BoutiqueSign",
		Size = Vector3.new(1, 3, 20),
		Position = Vector3.new(b.x + b.w / 2 + 0.6, 2 + b.h - 2, b.z),
		Color = GOLD,
		Material = Enum.Material.Neon,
		CanCollide = false,
	})
	signBand.Parent = shell
	billboard(signBand, "BOUTIQUE", 3.4, 220)

	-- Warm interior lights.
	for _, dz in { -b.d / 4, b.d / 4 } do
		local bulb = part({
			Name = "BoutiqueLight",
			Size = Vector3.new(6, 0.5, 2),
			Position = Vector3.new(b.x, 2 + b.h - 1, b.z + dz),
			Color = Color3.fromRGB(255, 220, 180),
			Material = Enum.Material.Neon,
			CanCollide = false,
		})
		bulb.Parent = shell
		local pl = Instance.new("PointLight")
		pl.Brightness = 2
		pl.Range = 30
		pl.Color = Color3.fromRGB(255, 220, 180)
		pl.Parent = bulb
	end

	return shell
end

local function publishDistricts()
	local folder = ReplicatedStorage:FindFirstChild("WorldDistricts")
	if folder then
		folder:Destroy()
	end
	folder = Instance.new("Folder")
	folder.Name = "WorldDistricts"
	local half: number = Config.World.districtSize / 2
	for i, city in Config.Cities do
		local d = Config.World.districts[i]
		if d then
			local house = (Config.Houses :: any)[city.houseId]
			local showName = if house then house.showName else city.houseId
			local v = Instance.new("StringValue")
			v.Name = city.id
			-- name|showName|cx|cz|half
			v.Value = string.format("%s|%s|%d|%d|%d", city.name, showName, d.x, d.z, half)
			v.Parent = folder
		end
	end
	folder.Parent = ReplicatedStorage
end

function WorldService.build(): Folder
	-- The Fashion Week venue (runway, seats, lights) stays exactly where the
	-- round loop expects it; the city grows around it.
	local arena = ArenaService.build()
	local worldCfg = Config.World

	-- City ground slab: top surface at y=1 to match the venue floor.
	-- Starts at z=50 so it never overlaps the venue's lobby plaza (z-fighting).
	local ground = part({
		Name = "CityGround",
		Size = Vector3.new(280, 1, 230),
		Position = Vector3.new(0, 0.5, 165),
		Color = ASPHALT,
		Material = Enum.Material.Asphalt,
	})
	ground.Parent = arena

	-- Grand Avenue: venue gate → plaza.
	local ave = worldCfg.avenue
	local road = part({
		Name = "GrandAvenue",
		Size = Vector3.new(ave.halfWidth * 2, 0.3, ave.z1 - ave.z0),
		Position = Vector3.new(ave.x, 1.1, (ave.z0 + ave.z1) / 2),
		Color = Color3.fromRGB(30, 26, 36),
		Material = Enum.Material.Asphalt,
		CanCollide = false,
	})
	road.Parent = arena
	for _, side in { -1, 1 } do
		local walk = part({
			Name = "Sidewalk",
			Size = Vector3.new(4, 0.35, ave.z1 - ave.z0),
			Position = Vector3.new(ave.x + side * (ave.halfWidth + 2), 1.12, (ave.z0 + ave.z1) / 2),
			Color = SIDEWALK,
			Material = Enum.Material.Concrete,
			CanCollide = false,
		})
		walk.Parent = arena
	end
	-- Avenue center dashes.
	for z = ave.z0 + 6, ave.z1 - 4, 12 do
		local dash = part({
			Name = "AveDash",
			Size = Vector3.new(0.6, 0.36, 4),
			Position = Vector3.new(ave.x, 1.14, z),
			Color = GOLD,
			Material = Enum.Material.Neon,
			CanCollide = false,
		})
		dash.Parent = arena
	end
	for z = ave.z0 + 8, ave.z1 - 6, 20 do
		lamp(arena, ave.x - ave.halfWidth - 1.5, z)
		lamp(arena, ave.x + ave.halfWidth + 1.5, z + 10)
	end

	-- Venue gate: the Fashion Week Hall entrance.
	arch(arena, worldCfg.venueGate.x, worldCfg.venueGate.z, 18, 12, "FASHION WEEK HALL", GOLD)

	-- Central plaza (spawn heart).
	buildPlaza(arena, worldCfg.plaza)

	-- Move the lobby spawn to the plaza. Same instance name, so RoundService
	-- (lobbyOrigin / releaseCharacter) keeps working with zero changes —
	-- players now spawn in the city and return here after every show.
	local spawn = arena:FindFirstChild("LobbySpawn")
	if spawn and spawn:IsA("BasePart") then
		spawn.Position = Vector3.new(worldCfg.plaza.x, 1.5, worldCfg.plaza.z - 20)
	end

	-- Six fashion districts.
	for i, city in Config.Cities do
		local d = worldCfg.districts[i]
		if d then
			buildDistrict(arena, city, d.x, d.z)
		end
	end

	-- Flagship boutique shell on the plaza (BoutiqueService stocks it).
	buildBoutiqueShell(arena, worldCfg.boutique)

	-- Cross streets connecting district rows to the avenue.
	-- Top at 1.33: above the district platforms (1.2), no z-fighting.
	for _, z in { 95, 160, 225 } do
		local cross = part({
			Name = "CrossStreet",
			Size = Vector3.new(150, 0.3, 10),
			Position = Vector3.new(0, 1.18, z),
			Color = Color3.fromRGB(28, 24, 34),
			Material = Enum.Material.Asphalt,
			CanCollide = false,
		})
		cross.Parent = arena
	end

	publishDistricts()

	return arena
end

function WorldService.cityCenter(): Vector3
	local p = Config.World.plaza
	return Vector3.new(p.x, 3, p.z)
end

return WorldService
