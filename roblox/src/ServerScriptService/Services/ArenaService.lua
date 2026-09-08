--!strict
--[[
	Builds a playable lobby + 3-lane catwalk at runtime so Studio Play works
	before any map art is imported.
]]

local Lighting = game:GetService("Lighting")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)
local Balance = require(ReplicatedStorage.Shared.Balance)

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

function ArenaService.get(): Folder
	local existing = Workspace:FindFirstChild(Config.ARENA_NAME)
	if existing and existing:IsA("Folder") then
		return existing
	end
	error("Arena missing")
end

function ArenaService.build(): Folder
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
			Color = Color3.fromRGB(201, 165, 106),
			CanCollide = false,
		})
		stripe.Parent = root
	end

	local lobby = part({
		Name = "LobbyPlaza",
		Size = Vector3.new(48, 1, 36),
		Position = Vector3.new(0, 0.5, 28),
		Color = Color3.fromRGB(28, 24, 32),
		Material = Enum.Material.Slate,
	})
	lobby.Parent = root

	local spawn = Instance.new("SpawnLocation")
	spawn.Name = "LobbySpawn"
	spawn.Anchored = true
	spawn.Size = Vector3.new(8, 1, 8)
	spawn.Position = Vector3.new(0, 1.5, 28)
	spawn.Neutral = true
	spawn.Duration = 0
	spawn.Color = Color3.fromRGB(201, 165, 106)
	spawn.Parent = root

	local pose = part({
		Name = "PosePlatform",
		Size = Vector3.new(18, 1.4, 14),
		Position = Vector3.new(0, 1.2, finishZ - 4),
		Color = Color3.fromRGB(201, 165, 106),
		Material = Enum.Material.Foil,
	})
	pose.Parent = root

	local vip = part({
		Name = "VipLounge",
		Size = Vector3.new(16, 1, 16),
		Position = Vector3.new(28, 1, 20),
		Color = Color3.fromRGB(90, 70, 40),
		Material = Enum.Material.Metal,
	})
	vip.Parent = root
	local vipSign = Instance.new("BillboardGui")
	vipSign.Name = "VipSign"
	vipSign.Size = UDim2.fromOffset(160, 40)
	vipSign.StudsOffset = Vector3.new(0, 4, 0)
	vipSign.Adornee = vip
	vipSign.Parent = vip
	local label = Instance.new("TextLabel")
	label.BackgroundTransparency = 1
	label.Size = UDim2.fromScale(1, 1)
	label.Font = Enum.Font.GothamBold
	label.Text = "FRONT ROW VIP"
	label.TextColor3 = Color3.fromRGB(244, 239, 230)
	label.TextScaled = true
	label.Parent = vipSign

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

	local attrs = Instance.new("Folder")
	attrs.Name = "Meta"
	attrs.Parent = root
	root:SetAttribute("StartZ", startZ)
	root:SetAttribute("FinishZ", finishZ)
	root:SetAttribute("LaneSpacing", laneSpacing)
	root:SetAttribute("Length", length)

	root.Parent = Workspace

	Lighting.ClockTime = 20.35
	Lighting.Brightness = 2.2

	local bloom = Lighting:FindFirstChildOfClass("BloomEffect")
	if not bloom then
		bloom = Instance.new("BloomEffect")
		bloom.Intensity = 0.35
		bloom.Size = 18
		bloom.Threshold = 0.9
		bloom.Parent = Lighting
	end

	return root
end

function ArenaService.laneX(laneIndex: number): number
	-- 0, 1, 2 → -spacing, 0, +spacing
	return (laneIndex - 1) * Balance.laneSpacingStuds
end

return ArenaService
