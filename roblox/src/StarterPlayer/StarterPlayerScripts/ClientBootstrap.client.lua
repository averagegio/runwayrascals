-- Client bootstrap: HUD, input, share, spectate, join Open Cast.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Remotes = require(ReplicatedStorage:WaitForChild("Net"):WaitForChild("Remotes"))

local HUD = require(script.Parent.Controllers.HUDController)
local InputController = require(script.Parent.Controllers.InputController)
local ShareController = require(script.Parent.Controllers.ShareController)
local SpectateController = require(script.Parent.Controllers.SpectateController)
local CameraController = require(script.Parent.Controllers.CameraController)

HUD.mount()
InputController.bind()
ShareController.bind(HUD.gui())
CameraController.bind()

local player = Players.LocalPlayer

local function applyData(data: any)
	HUD.setData(data)
end

task.spawn(function()
	local data = Remotes.fn(Remotes.Functions.GetPlayerData):InvokeServer()
	applyData(data)
	Remotes.event(Remotes.Events.RequestJoin):FireServer()
end)

Remotes.event(Remotes.Events.PlayerData).OnClientEvent:Connect(applyData)

Remotes.event(Remotes.Events.Toast).OnClientEvent:Connect(function(text)
	if type(text) == "string" then
		HUD.toast(text)
	end
end)

Remotes.event(Remotes.Events.Tutorial).OnClientEvent:Connect(function(payload)
	if type(payload) == "table" and type(payload.hint) == "string" then
		HUD.setHint(payload.hint)
	end
end)

Remotes.event(Remotes.Events.RoundState).OnClientEvent:Connect(function(state)
	HUD.setRound(state)
	CameraController.setRound(state)
	if type(state) == "table" then
		for _, row in state.contestants or {} do
			if row.userId == player.UserId and row.spectatingUserId then
				SpectateController.follow(row.spectatingUserId)
			end
		end
	end
end)
