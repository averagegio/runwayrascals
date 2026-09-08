-- Server bootstrap: remotes, arena, data, monetization, rounds.
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

local Remotes = require(ReplicatedStorage.Net.Remotes)
Remotes.ensure()

local ArenaService = require(script.Parent.Services.ArenaService)
local DataService = require(script.Parent.Services.DataService)
local MonetizationService = require(script.Parent.Services.MonetizationService)
local RoundService = require(script.Parent.Services.RoundService)
local SocialHookService = require(script.Parent.Services.SocialHookService)

ArenaService.build()
DataService.init()
DataService.bind()
MonetizationService.bind()
SocialHookService.bind()
RoundService.bind()

Remotes.fn(Remotes.Functions.GetPlayerData).OnServerInvoke = function(player)
	DataService.load(player)
	DataService.captureShareAttribution(player)
	DataService.applyDailyAndStreak(player)
	return DataService.get(player)
end

local function onPlayerAdded(player)
	DataService.load(player)
	DataService.captureShareAttribution(player)
	DataService.applyDailyAndStreak(player)
	local data = DataService.get(player)
	Remotes.event(Remotes.Events.PlayerData):FireClient(player, data)
	Remotes.event(Remotes.Events.Tutorial):FireClient(player, {
		step = if data.tutorialComplete then "lobby" else "welcome",
		hint = if data.tutorialComplete
			then "Theme → dress → runway → vote. Invite a friend."
			else "Welcome to Open Cast — theme, dress, runway, vote. First win under two minutes.",
	})
end

Players.PlayerAdded:Connect(onPlayerAdded)
for _, player in Players:GetPlayers() do
	task.spawn(onPlayerAdded, player)
end

print("[Rascal Runways] Server ready — Open Cast lobby is live.")
