--!strict
--[[
	Play Solo / unpublished Studio: two house mannequins so vote is real.

	Live servers with 2+ players skip this. NPCs use negative userIds
	and never touch DataStores or MarketplaceService.
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Config = require(ReplicatedStorage.Shared.Config)
local LookVisuals = require(ReplicatedStorage.Shared.LookVisuals)

export type CastMember = {
	userId: number,
	name: string,
	lane: number,
	lookId: string,
	model: Model,
}

local StudioCastService = {}

local CAST = {
	{ userId = -9101, name = "Nightfall", lane = 0, lookId = "nightfall-tee", color = Color3.fromRGB(28, 24, 32) },
	{ userId = -9102, name = "Crest", lane = 2, lookId = "crest-polo", color = Color3.fromRGB(22, 90, 48) },
}

local function limb(parent: Model, name: string, size: Vector3, cf: CFrame, color: Color3): Part
	local p = Instance.new("Part")
	p.Name = name
	p.Size = size
	p.CFrame = cf
	p.Color = color
	p.Material = Enum.Material.SmoothPlastic
	p.Anchored = true
	p.CanCollide = false
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Parent = parent
	return p
end

local function dummy(def: any, origin: CFrame): Model
	local model = Instance.new("Model")
	model.Name = "Cast_" .. def.name
	model:SetAttribute("NpcUserId", def.userId)
	model:SetAttribute("LookId", def.lookId)

	local root = limb(model, "HumanoidRootPart", Vector3.new(2, 2, 1), origin, def.color)
	root.Transparency = 1
	limb(model, "Torso", Vector3.new(2, 2, 1), origin, def.color)
	limb(model, "Head", Vector3.new(1.2, 1.2, 1.2), origin * CFrame.new(0, 1.6, 0), Color3.fromRGB(232, 210, 190))
	limb(model, "Left Arm", Vector3.new(1, 2, 1), origin * CFrame.new(-1.5, 0, 0), def.color)
	limb(model, "Right Arm", Vector3.new(1, 2, 1), origin * CFrame.new(1.5, 0, 0), def.color)
	limb(model, "Left Leg", Vector3.new(1, 2, 1), origin * CFrame.new(-0.5, -2, 0), Color3.fromRGB(18, 16, 20))
	limb(model, "Right Leg", Vector3.new(1, 2, 1), origin * CFrame.new(0.5, -2, 0), Color3.fromRGB(18, 16, 20))

	local humanoid = Instance.new("Humanoid")
	humanoid.DisplayName = def.name
	humanoid.MaxHealth = 100
	humanoid.Health = 100
	humanoid.WalkSpeed = 0
	humanoid.Parent = model
	model.PrimaryPart = root
	LookVisuals.applyToModel(model, def.lookId)
	return model
end

function StudioCastService.enabled(): boolean
	if not RunService:IsStudio() then
		return false
	end
	return Config.StudioPlaytest.spawnCastNpcs == true
end

function StudioCastService.spawn(parent: Instance, origin: CFrame): { CastMember }
	local folder = parent:FindFirstChild("StudioCast")
	if folder then
		folder:Destroy()
	end
	folder = Instance.new("Folder")
	folder.Name = "StudioCast"
	folder.Parent = parent

	local members: { CastMember } = {}
	for i, def in CAST do
		local offset = CFrame.new((i - 1.5) * 4, 3, 0)
		local model = dummy(def, origin * offset)
		model.Parent = folder
		table.insert(members, {
			userId = def.userId,
			name = def.name,
			lane = def.lane,
			lookId = def.lookId,
			model = model,
		})
	end
	return members
end

return StudioCastService
