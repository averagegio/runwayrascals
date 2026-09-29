--!strict
--[[
	Real seasons for Rascal City. The season comes from the calendar month —
	an honest clock, no fake scarcity. SeasonService.apply() dresses the world
	built by WorldService: one decor folder per season (only the current one
	visible), seasonal particles, and a lighting tint shift. Clients learn the
	season through the SeasonChanged remote for the HUD badge.
]]

local Lighting = game:GetService("Lighting")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)
local LiveOps = require(ReplicatedStorage.Shared.LiveOps)
local Remotes = require(ReplicatedStorage.Net.Remotes)

local SeasonService = {}

local function part(props: { [string]: any }): Part
	local p = Instance.new("Part")
	p.Anchored = true
	p.CanCollide = false
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Material = Enum.Material.SmoothPlastic
	for key, value in props do
		(p :: any)[key] = value
	end
	return p
end

function SeasonService.current(month: number?): string
	local m = month or os.date("*t").month
	for _, s in Config.Seasons do
		for _, sm in s.months do
			if sm == m then
				return s.id
			end
		end
	end
	return "spring"
end

function SeasonService.seasonName(id: string): string
	for _, s in Config.Seasons do
		if s.id == id then
			return s.name
		end
	end
	return id
end

local function tree(parent: Instance, x: number, z: number, canopyColor: Color3, y0: number?)
	local base = y0 or 1
	local trunk = part({
		Name = "TreeTrunk",
		Size = Vector3.new(1.2, 7, 1.2),
		Position = Vector3.new(x, base + 3.5, z),
		Color = Color3.fromRGB(58, 42, 34),
		Material = Enum.Material.Wood,
		CanCollide = true,
	})
	trunk.Parent = parent
	local canopy = part({
		Name = "TreeCanopy",
		Shape = Enum.PartType.Ball,
		Size = Vector3.new(8, 7, 8),
		Position = Vector3.new(x, base + 8.5, z),
		Color = canopyColor,
		Material = Enum.Material.Grass,
	})
	canopy.Parent = parent
end

local function umbrella(parent: Instance, x: number, z: number, color: Color3, y0: number?)
	local base = y0 or 2
	local pole = part({
		Name = "UmbrellaPole",
		Size = Vector3.new(0.5, 7, 0.5),
		Position = Vector3.new(x, base + 3.5, z),
		Color = Color3.fromRGB(240, 240, 240),
		CanCollide = false,
	})
	pole.Parent = parent
	-- Cone canopy, tilted for a beach feel.
	local canopy = part({
		Name = "UmbrellaCanopy",
		Shape = Enum.PartType.Cylinder,
		Size = Vector3.new(7, 0.6, 7),
		Position = Vector3.new(x, base + 7, z),
		Color = color,
		Material = Enum.Material.Fabric,
	})
	canopy.CFrame = CFrame.new(x, base + 7, z) * CFrame.Angles(0, 0, math.rad(90))
	canopy.Parent = parent
end

local function emitter(parent: Instance, x: number, y: number, z: number, color: Color3, rate: number, size: number, speed: number)
	local anchor = part({
		Name = "SeasonEmitter",
		Size = Vector3.new(1, 1, 1),
		Position = Vector3.new(x, y, z),
		Transparency = 1,
	})
	anchor.Parent = parent
	local pe = Instance.new("ParticleEmitter")
	pe.Rate = rate
	pe.Lifetime = NumberRange.new(4, 7)
	pe.Speed = NumberRange.new(speed * 0.7, speed)
	pe.Size = NumberSequence.new(size)
	pe.Color = ColorSequence.new(color)
	pe.Transparency = NumberSequence.new(0.15)
	pe.SpreadAngle = Vector2.new(30, 30)
	pe.EmissionDirection = Enum.NormalId.Bottom
	pe.Parent = anchor
end

local function buildSpring(parent: Instance, plaza: any)
	local pink = Color3.fromRGB(244, 170, 200)
	for i = 0, 5 do
		local a = (i / 6) * math.pi * 2 + 0.3
		tree(parent, plaza.x + math.cos(a) * (plaza.radius + 8), plaza.z + math.sin(a) * (plaza.radius + 8), pink, 1)
	end
	tree(parent, -30, 120, pink, 1)
	tree(parent, 30, 120, pink, 1)
	emitter(parent, plaza.x, 26, plaza.z, Color3.fromRGB(250, 190, 215), 24, 0.5, 3)
end

local function buildSummer(parent: Instance, plaza: any)
	local colors = {
		Color3.fromRGB(255, 120, 140),
		Color3.fromRGB(120, 200, 255),
		Color3.fromRGB(255, 210, 120),
	}
	for i = 0, 5 do
		local a = (i / 6) * math.pi * 2
		umbrella(parent, plaza.x + math.cos(a) * (plaza.radius - 10), plaza.z + math.sin(a) * (plaza.radius - 10), colors[(i % 3) + 1], 2)
	end
end

local function buildAutumn(parent: Instance, plaza: any)
	local amber = Color3.fromRGB(214, 130, 40)
	local rust = Color3.fromRGB(178, 84, 32)
	for i = 0, 5 do
		local a = (i / 6) * math.pi * 2 + 0.15
		tree(parent, plaza.x + math.cos(a) * (plaza.radius + 8), plaza.z + math.sin(a) * (plaza.radius + 8), if i % 2 == 0 then amber else rust, 1)
	end
	-- Leaf piles.
	for i = 0, 4 do
		local a = (i / 5) * math.pi * 2
		local pile = part({
			Name = "LeafPile",
			Shape = Enum.PartType.Cylinder,
			Size = Vector3.new(0.8, 4, 4),
			Position = Vector3.new(plaza.x + math.cos(a) * 20, 2.4, plaza.z + math.sin(a) * 20),
			Color = rust,
			Material = Enum.Material.Grass,
		})
		pile.CFrame = CFrame.new(plaza.x + math.cos(a) * 20, 2.4, plaza.z + math.sin(a) * 20)
			* CFrame.Angles(0, 0, math.rad(90))
		pile.Parent = parent
	end
	emitter(parent, plaza.x, 26, plaza.z, Color3.fromRGB(220, 140, 50), 20, 0.6, 4)
end

local function buildWinter(parent: Instance, plaza: any)
	-- Snow blanket discs on the plaza.
	for i = 0, 3 do
		local a = (i / 4) * math.pi * 2 + 0.4
		local drift = part({
			Name = "SnowDrift",
			Shape = Enum.PartType.Cylinder,
			Size = Vector3.new(0.5, 14, 14),
			Position = Vector3.new(plaza.x + math.cos(a) * 22, 2.3, plaza.z + math.sin(a) * 22),
			Color = Color3.fromRGB(232, 238, 248),
			Material = Enum.Material.Snow,
		})
		drift.CFrame = CFrame.new(plaza.x + math.cos(a) * 22, 2.3, plaza.z + math.sin(a) * 22)
			* CFrame.Angles(0, 0, math.rad(90))
		drift.Parent = parent
	end
	-- Snowfall over plaza, avenue, and venue forecourt.
	emitter(parent, plaza.x, 34, plaza.z, Color3.fromRGB(245, 248, 255), 40, 0.45, 6)
	emitter(parent, 0, 30, 100, Color3.fromRGB(245, 248, 255), 25, 0.45, 6)
	emitter(parent, 0, 30, 40, Color3.fromRGB(245, 248, 255), 20, 0.45, 6)
	-- String lights: neon garland strips on the plaza lamp ring
	-- (skipping spans that would cross the boutique).
	local shop = Config.World.boutique
	local function inShop(x: number, z: number): boolean
		return x > shop.x - shop.w / 2
			and x < shop.x + shop.w / 2
			and z > shop.z - shop.d / 2
			and z < shop.z + shop.d / 2
	end
	for i = 0, 7 do
		local a = (i / 8) * math.pi * 2
		local a2 = ((i + 1) / 8) * math.pi * 2
		local x1 = plaza.x + math.cos(a) * (plaza.radius - 4)
		local z1 = plaza.z + math.sin(a) * (plaza.radius - 4)
		local x2 = plaza.x + math.cos(a2) * (plaza.radius - 4)
		local z2 = plaza.z + math.sin(a2) * (plaza.radius - 4)
		if inShop(x1, z1) or inShop(x2, z2) then
			continue
		end
		local mx, mz = (x1 + x2) / 2, (z1 + z2) / 2
		local len = math.sqrt((x2 - x1) ^ 2 + (z2 - z1) ^ 2)
		local strip = part({
			Name = "StringLights",
			Size = Vector3.new(len, 0.3, 0.3),
			Position = Vector3.new(mx, 13.5, mz),
			Color = Color3.fromRGB(255, 240, 200),
			Material = Enum.Material.Neon,
		})
		strip.CFrame = CFrame.new(mx, 13.5, mz) * CFrame.Angles(0, -math.atan2(z2 - z1, x2 - x1), 0)
		strip.Parent = parent
	end
end

local SEASON_TINT = {
	spring = { fog = Color3.fromRGB(30, 20, 34), ambient = Color3.fromRGB(48, 42, 54) },
	summer = { fog = Color3.fromRGB(36, 24, 30), ambient = Color3.fromRGB(54, 46, 52) },
	autumn = { fog = Color3.fromRGB(34, 22, 26), ambient = Color3.fromRGB(52, 44, 48) },
	winter = { fog = Color3.fromRGB(24, 26, 40), ambient = Color3.fromRGB(44, 46, 60) },
}

function SeasonService.apply(worldRoot: Folder): string
	local season = SeasonService.current()
	local plaza = Config.World.plaza

	local old = worldRoot:FindFirstChild("SeasonDecor")
	if old then
		old:Destroy()
	end
	local decor = Instance.new("Folder")
	decor.Name = "SeasonDecor"
	decor.Parent = worldRoot

	local builders = {
		spring = buildSpring,
		summer = buildSummer,
		autumn = buildAutumn,
		winter = buildWinter,
	}
	local build = builders[season]
	if build then
		build(decor, plaza)
	end

	-- Subtle lighting tint per season (night aesthetic stays).
	local tint = SEASON_TINT[season]
	if tint then
		Lighting.FogColor = tint.fog
		Lighting.Ambient = tint.ambient
	end

	-- Tell clients: season badge + this week's theme for the boutique sign.
	local theme = LiveOps.theme()
	Remotes.event(Remotes.Events.SeasonChanged):FireAllClients({
		seasonId = season,
		seasonName = SeasonService.seasonName(season),
		themeId = theme.id,
		themeName = theme.name,
	})

	print(string.format("[Rascal Runways] Season applied: %s (theme: %s)", season, theme.name))
	return season
end

-- Re-apply on player join is unnecessary (decor replicates); this is for
-- late-joining clients that missed the FireAllClients broadcast.
function SeasonService.sendTo(player: Player)
	local theme = LiveOps.theme()
	local season = SeasonService.current()
	Remotes.event(Remotes.Events.SeasonChanged):FireClient(player, {
		seasonId = season,
		seasonName = SeasonService.seasonName(season),
		themeId = theme.id,
		themeName = theme.name,
	})
end

return SeasonService
