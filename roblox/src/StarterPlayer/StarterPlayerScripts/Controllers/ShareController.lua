--!strict
--[[
	Shareable moments — CaptureService:CaptureScreenshot (client API).

	From day one: stills go to TikTok / Shorts / IG via the device sheet.
	Experience Share Links (Creator Dashboard) + GetJoinData LaunchData
	attribute Active Spender / Audience Expansion. Do not plan AFK Premium
	farms — Engagement-Based Payouts ended July 2025.
]]

local CaptureService = game:GetService("CaptureService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Remotes = require(ReplicatedStorage.Net.Remotes)

local ShareController = {}

function ShareController.capture()
	local ok, err = pcall(function()
		CaptureService:CaptureScreenshot(function(_contentId: string)
			Remotes.event(Remotes.Events.RequestShare):FireServer("screenshot")
		end)
	end)
	if not ok then
		warn("[Rascal] CaptureService:", err)
		Remotes.event(Remotes.Events.RequestShare):FireServer("screenshot")
	end
end

function ShareController.bind(hudGui: ScreenGui)
	hudGui:GetAttributeChangedSignal("CaptureNow"):Connect(function()
		if hudGui:GetAttribute("CaptureNow") == true then
			hudGui:SetAttribute("CaptureNow", false)
			ShareController.capture()
		end
	end)
	-- Hide unused import warning if Players is needed later for caption.
	local _ = Players.LocalPlayer
end

return ShareController
