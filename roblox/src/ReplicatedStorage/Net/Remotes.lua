--!strict
--[[
	RemoteEvent / RemoteFunction names. Server Bootstrap creates the instances;
	clients WaitForChild through this module.
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)

local Remotes = {}

Remotes.Events = {
	RoundState = "RoundState",
	Input = "Input",
	RequestJoin = "RequestJoin",
	RequestRematch = "RequestRematch",
	RequestSpectate = "RequestSpectate",
	RequestInvite = "RequestInvite",
	RequestShare = "RequestShare",
	RequestPromptPass = "RequestPromptPass",
	RequestPromptProduct = "RequestPromptProduct",
	RequestGift = "RequestGift",
	RequestVote = "RequestVote",
	RequestEquipLook = "RequestEquipLook",
	RequestBuyLook = "RequestBuyLook",
	PlayerData = "PlayerData",
	Toast = "Toast",
	Tutorial = "Tutorial",
}

Remotes.Functions = {
	GetPlayerData = "GetPlayerData",
}

local function folder(): Folder
	local existing = ReplicatedStorage:FindFirstChild(Config.REMOTES_FOLDER)
	if existing and existing:IsA("Folder") then
		return existing
	end
	local created = Instance.new("Folder")
	created.Name = Config.REMOTES_FOLDER
	created.Parent = ReplicatedStorage
	return created
end

function Remotes.ensure(): Folder
	local root = folder()
	for _, name in Remotes.Events do
		if not root:FindFirstChild(name) then
			local event = Instance.new("RemoteEvent")
			event.Name = name
			event.Parent = root
		end
	end
	for _, name in Remotes.Functions do
		if not root:FindFirstChild(name) then
			local fn = Instance.new("RemoteFunction")
			fn.Name = name
			fn.Parent = root
		end
	end
	return root
end

function Remotes.getFolder(): Folder
	return ReplicatedStorage:WaitForChild(Config.REMOTES_FOLDER) :: Folder
end

function Remotes.event(name: string): RemoteEvent
	return Remotes.getFolder():WaitForChild(name) :: RemoteEvent
end

function Remotes.fn(name: string): RemoteFunction
	return Remotes.getFolder():WaitForChild(name) :: RemoteFunction
end

return Remotes
