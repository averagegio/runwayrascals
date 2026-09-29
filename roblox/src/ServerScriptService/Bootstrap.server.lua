-- Server bootstrap: remotes, world, data, monetization, rounds.
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

local Remotes = require(ReplicatedStorage.Net.Remotes)
Remotes.ensure()

local WorldService = require(script.Parent.Services.WorldService)
local SeasonService = require(script.Parent.Services.SeasonService)
local BoutiqueService = require(script.Parent.Services.BoutiqueService)
local DataService = require(script.Parent.Services.DataService)
local MonetizationService = require(script.Parent.Services.MonetizationService)
local RoundService = require(script.Parent.Services.RoundService)
local SocialHookService = require(script.Parent.Services.SocialHookService)
local LookVisuals = require(ReplicatedStorage.Shared.LookVisuals)

local worldRoot = WorldService.build()
DataService.init()
DataService.bind()
MonetizationService.bind()
SocialHookService.bind()
RoundService.bind()
SeasonService.apply(worldRoot)
BoutiqueService.build(worldRoot)

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
	SeasonService.sendTo(player)
	Remotes.event(Remotes.Events.Tutorial):FireClient(player, {
		step = if data.tutorialComplete then "lobby" else "welcome",
		hint = if data.tutorialComplete
			then "Theme → dress → runway → vote. Invite a friend."
			else "Welcome to Open Cast — theme, dress, runway, vote. First win under two minutes.",
	})
	local function paint(character)
		LookVisuals.applyToModel(character, DataService.get(player).equippedLookId)
	end
	player.CharacterAdded:Connect(paint)
	if player.Character then
		paint(player.Character)
	end
end

Players.PlayerAdded:Connect(onPlayerAdded)
for _, player in Players:GetPlayers() do
	task.spawn(onPlayerAdded, player)
end

print("[Rascal Runways] Server ready — Rascal City is live.")
