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
	gui.Size = UDim2.fromOffset(width or 180, 40)
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
	Lighting.ClockTime = 20.35
	Lighting.Brightness = 2.4
	Lighting.Ambient = Color3.fromRGB(46, 40, 52)
	Lighting.OutdoorAmbient = Color3.fromRGB(56, 48, 64)
	Lighting.EnvironmentDiffuseScale = 0.4
	Lighting.EnvironmentSpecularScale = 0.55
	Lighting.GlobalShadows = true
	Lighting.FogColor = Color3.fromRGB(28, 18, 32)
	Lighting.FogStart = 80
	Lighting.FogEnd = 420

	if not Lighting:FindFirstChildOfClass("Atmosphere") then
		local atm = Instance.new("Atmosphere")
		atm.Density = 0.26
		atm.Offset = 0.12
		atm.Color = Color3.fromRGB(48, 28, 52)
		atm.Decay = Color3.fromRGB(90, 42, 28)
		atm.Glare = 0.22
		atm.Haze = 1.3
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
	local startZ = 0
	local finishZ = -length
	local gold = Color3.fromRGB(201, 165, 106)

	local floor = part({
		Name = "RunwayFloor",
		Size = Vector3.new(width, 1, length + 40),
		Position = Vector3.new(0, 0.5, startZ - length / 2),
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

	local lobby = part({
		Name = "LobbyPlaza",
		Size = Vector3.new(52, 1, 40),
		Position = Vector3.new(0, 0.5, 30),
		Color = Color3.fromRGB(28, 24, 32),
		Material = Enum.Material.Slate,
	})
	lobby.Parent = root

	local spawn = Instance.new("SpawnLocation")
	spawn.Name = "LobbySpawn"
	spawn.Anchored = true
	spawn.Size = Vector3.new(8, 1, 8)
	spawn.Position = Vector3.new(0, 1.5, 30)
	spawn.Neutral = true
	spawn.Duration = 0
	spawn.Color = gold
	spawn.Parent = root

	local pose = part({
		Name = "PosePlatform",
		Size = Vector3.new(18, 1.4, 14),
		Position = Vector3.new(0, 1.2, finishZ - 4),
		Color = gold,
		Material = Enum.Material.Foil,
	})
	pose.Parent = root
	billboard(pose, "FINALE", 6, 160)

	local dress = part({
		Name = "DressingRoom",
		Size = Vector3.new(22, 1, 16),
		Position = Vector3.new(-22, 1, 38),
		Color = Color3.fromRGB(36, 28, 40),
		Material = Enum.Material.WoodPlanks,
	})
	dress.Parent = root
	billboard(dress, "DRESSING ROOM", 5, 200)

	for m = 1, 3 do
		local stand = part({
			Name = "MannequinStand",
			Size = Vector3.new(2.4, 0.4, 2.4),
			Position = Vector3.new(-28 + m * 5, 1.4, 38),
			Color = gold,
			CanCollide = false,
		})
		stand.Parent = root
		local dummy = part({
			Name = "Mannequin",
			Size = Vector3.new(1.4, 4.2, 1.1),
			Position = Vector3.new(-28 + m * 5, 3.7, 38),
			Color = Color3.fromRGB(232, 210, 190),
			CanCollide = false,
			Material = Enum.Material.SmoothPlastic,
		})
		dummy.Parent = root
	end

	local vip = part({
		Name = "VipLounge",
		Size = Vector3.new(16, 1, 16),
		Position = Vector3.new(28, 1, 20),
		Color = Color3.fromRGB(90, 70, 40),
		Material = Enum.Material.Metal,
	})
	vip.Parent = root
	billboard(vip, "FRONT ROW VIP", 4, 180)

	-- Audience blocks (paparazzi / seats)
	for side = -1, 1, 2 do
		for n = 1, 10 do
			local seat = part({
				Name = "Seat",
				Size = Vector3.new(3, 4, 3),
				Position = Vector3.new(side * 16, 2.5, -n * 14),
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
		Position = Vector3.new(0, 8, 48),
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
	camPart("CamLobby", Vector3.new(0, 16, 58), Vector3.new(0, 3, -20))
	camPart("CamRunway", Vector3.new(0, 10, 18), Vector3.new(0, 4, -40))
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
