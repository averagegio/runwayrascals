--!strict
--[[
	Shareable moments — CaptureService:CaptureScreenshot (client API).
	Mirrors the web clip-share sheet: capture a still, then the player posts
	it from the Roblox capture UI / device share sheet to TikTok, IG, X.
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
