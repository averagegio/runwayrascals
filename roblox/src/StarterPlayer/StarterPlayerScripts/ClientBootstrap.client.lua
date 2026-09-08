-- Client bootstrap: HUD, input, share, spectate, join Open Cast.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Remotes = require(ReplicatedStorage:WaitForChild("Net"):WaitForChild("Remotes"))

local HUD = require(script.Parent.Controllers.HUDController)
local InputController = require(script.Parent.Controllers.InputController)
local ShareController = require(script.Parent.Controllers.ShareController)
local SpectateController = require(script.Parent.Controllers.SpectateController)

HUD.mount()
InputController.bind()
ShareController.bind(HUD.gui())

local player = Players.LocalPlayer

task.spawn(function()
	local data = Remotes.fn(Remotes.Functions.GetPlayerData):InvokeServer()
	if type(data) == "table" and type(data.coins) == "number" then
		HUD.setCoins(data.coins)
	end
	Remotes.event(Remotes.Events.RequestJoin):FireServer()
end)

Remotes.event(Remotes.Events.PlayerData).OnClientEvent:Connect(function(data)
	if type(data) == "table" and type(data.coins) == "number" then
		HUD.setCoins(data.coins)
	end
end)

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
	if type(state) == "table" then
		for _, row in state.contestants or {} do
			if row.userId == player.UserId and row.spectatingUserId then
				SpectateController.follow(row.spectatingUserId)
			end
		end
	end
end)
