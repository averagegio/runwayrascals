--!strict
--[[
	Friends invite + shareable moments.

	Uses SocialService:CanSendGameInviteAsync / PromptGameInvite (not a fake API)
	and CaptureService on the client. This module only handles server-side invites
	and records that a share was requested (for retention analytics later).
]]

local Players = game:GetService("Players")
local SocialService = game:GetService("SocialService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Remotes = require(ReplicatedStorage.Net.Remotes)

local SocialHookService = {}

function SocialHookService.promptInvite(player: Player)
	local ok, can = pcall(function()
		return SocialService:CanSendGameInviteAsync(player)
	end)
	if not ok or not can then
		Remotes.event(Remotes.Events.Toast):FireClient(player, "Invites unavailable on this platform.")
		return
	end
	local options = Instance.new("ExperienceInviteOptions")
	options.PromptMessage = "Walk this Fashion Week with me — Rascal Runways"
	local prompted = pcall(function()
		SocialService:PromptGameInvite(player, options)
	end)
	if not prompted then
		pcall(function()
			SocialService:PromptGameInvite(player)
		end)
	end
end

function SocialHookService.onlineFriends(player: Player): { { id: number, name: string } }
	local list = {}
	local ok, pages = pcall(function()
		return Players:GetFriendsAsync(player.UserId)
	end)
	if not ok or not pages then
		return list
	end
	while true do
		for _, item in pages:GetCurrentPage() do
			table.insert(list, { id = item.Id, name = item.Username or item.DisplayName or "?" })
		end
		if pages.IsFinished then
			break
		end
		pages:AdvanceToNextPageAsync()
		if #list > 40 then
			break
		end
	end
	return list
end

function SocialHookService.bind()
	Remotes.event(Remotes.Events.RequestInvite).OnServerEvent:Connect(function(player)
		SocialHookService.promptInvite(player)
	end)

	Remotes.event(Remotes.Events.RequestShare).OnServerEvent:Connect(function(player, kind)
		if type(kind) ~= "string" then
			return
		end
		-- Client captures via CaptureService; server just acknowledges for future telemetry.
		Remotes.event(Remotes.Events.Toast):FireClient(
			player,
			if kind == "screenshot"
				then "Moment saved — post to TikTok / Shorts. Share Links attribute Creator Rewards."
				else "Share ready"
		)
	end)
end

return SocialHookService
