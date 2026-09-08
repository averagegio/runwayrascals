--!strict
--[[
	In-experience HUD: phase, score, coins, rematch, invite, share, boutique.
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)
local Remotes = require(ReplicatedStorage.Net.Remotes)

local HUD = {}

local player = Players.LocalPlayer
local gui: ScreenGui
local phaseLabel: TextLabel
local hintLabel: TextLabel
local statsLabel: TextLabel
local toastLabel: TextLabel
local coinsLabel: TextLabel

local function mk(className: string, props: { [string]: any }, parent: Instance?): any
	local inst = Instance.new(className)
	for key, value in props do
		(inst :: any)[key] = value
	end
	if parent then
		inst.Parent = parent
	end
	return inst
end

local function pill(text: string, parent: Instance, order: number): TextButton
	return mk("TextButton", {
		Name = text,
		BackgroundColor3 = Color3.fromRGB(18, 16, 20),
		BackgroundTransparency = 0.2,
		TextColor3 = Color3.fromRGB(244, 239, 230),
		Font = Enum.Font.GothamMedium,
		Text = text,
		TextSize = 14,
		Size = UDim2.new(1, 0, 0, 36),
		LayoutOrder = order,
		AutoButtonColor = true,
	}, parent)
end

function HUD.mount()
	gui = mk("ScreenGui", {
		Name = "RascalHud",
		ResetOnSpawn = false,
		IgnoreGuiInset = true,
		ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
	}, player:WaitForChild("PlayerGui"))

	local top = mk("Frame", {
		BackgroundTransparency = 1,
		Size = UDim2.new(1, -24, 0, 96),
		Position = UDim2.fromOffset(12, 12),
	}, gui)

	phaseLabel = mk("TextLabel", {
		BackgroundTransparency = 1,
		Font = Enum.Font.GothamBold,
		Text = "OPEN CAST",
		TextColor3 = Color3.fromRGB(201, 165, 106),
		TextSize = 22,
		TextXAlignment = Enum.TextXAlignment.Left,
		Size = UDim2.new(1, 0, 0, 28),
	}, top)

	hintLabel = mk("TextLabel", {
		BackgroundTransparency = 1,
		Font = Enum.Font.Gotham,
		Text = "First win in under two minutes — collect looks, hit the pose.",
		TextColor3 = Color3.fromRGB(244, 239, 230),
		TextSize = 14,
		TextWrapped = true,
		TextXAlignment = Enum.TextXAlignment.Left,
		Position = UDim2.fromOffset(0, 30),
		Size = UDim2.new(0.7, 0, 0, 40),
	}, top)

	coinsLabel = mk("TextLabel", {
		BackgroundTransparency = 1,
		Font = Enum.Font.GothamBold,
		Text = "Coins 0",
		TextColor3 = Color3.fromRGB(244, 239, 230),
		TextSize = 16,
		TextXAlignment = Enum.TextXAlignment.Right,
		Size = UDim2.new(0.28, 0, 0, 28),
		Position = UDim2.new(0.72, 0, 0, 0),
		AnchorPoint = Vector2.new(0, 0),
	}, top)

	statsLabel = mk("TextLabel", {
		BackgroundTransparency = 1,
		Font = Enum.Font.GothamMedium,
		Text = "Looks 0  ·  Rares 0/1",
		TextColor3 = Color3.fromRGB(201, 165, 106),
		TextSize = 14,
		TextXAlignment = Enum.TextXAlignment.Right,
		Position = UDim2.new(0.72, 0, 0, 30),
		Size = UDim2.new(0.28, 0, 0, 24),
	}, top)

	toastLabel = mk("TextLabel", {
		BackgroundTransparency = 0.25,
		BackgroundColor3 = Color3.fromRGB(12, 10, 14),
		Font = Enum.Font.GothamMedium,
		Text = "",
		TextColor3 = Color3.fromRGB(244, 239, 230),
		TextSize = 16,
		Visible = false,
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0.18, 0),
		Size = UDim2.new(0.5, 0, 0, 36),
	}, gui)

	local actions = mk("Frame", {
		BackgroundTransparency = 1,
		AnchorPoint = Vector2.new(1, 1),
		Position = UDim2.new(1, -16, 1, -16),
		Size = UDim2.fromOffset(180, 220),
	}, gui)
	mk("UIListLayout", {
		Padding = UDim.new(0, 8),
		FillDirection = Enum.FillDirection.Vertical,
		HorizontalAlignment = Enum.HorizontalAlignment.Right,
		VerticalAlignment = Enum.VerticalAlignment.Bottom,
		SortOrder = Enum.SortOrder.LayoutOrder,
	}, actions)

	local rematch = pill("Rematch", actions, 1)
	local spectate = pill("Spectate", actions, 2)
	local invite = pill("Invite friends", actions, 3)
	local share = pill("Share moment", actions, 4)
	local boutique = pill("Boutique", actions, 5)

	rematch.MouseButton1Click:Connect(function()
		Remotes.event(Remotes.Events.RequestRematch):FireServer()
	end)
	spectate.MouseButton1Click:Connect(function()
		Remotes.event(Remotes.Events.RequestSpectate):FireServer()
	end)
	invite.MouseButton1Click:Connect(function()
		Remotes.event(Remotes.Events.RequestInvite):FireServer()
	end)
	share.MouseButton1Click:Connect(function()
		gui:SetAttribute("CaptureNow", true)
	end)
	boutique.MouseButton1Click:Connect(function()
		HUD.toggleBoutique()
	end)

	HUD.buildBoutique()
end

local boutiqueFrame: Frame?

function HUD.buildBoutique()
	boutiqueFrame = mk("Frame", {
		Name = "Boutique",
		Visible = false,
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.5),
		Size = UDim2.fromOffset(420, 460),
		BackgroundColor3 = Color3.fromRGB(12, 10, 14),
		BackgroundTransparency = 0.08,
	}, gui)
	mk("UICorner", { CornerRadius = UDim.new(0, 16) }, boutiqueFrame)
	mk("TextLabel", {
		BackgroundTransparency = 1,
		Font = Enum.Font.GothamBold,
		Text = "Rascal Boutique",
		TextColor3 = Color3.fromRGB(201, 165, 106),
		TextSize = 20,
		Size = UDim2.new(1, -24, 0, 36),
		Position = UDim2.fromOffset(12, 10),
		TextXAlignment = Enum.TextXAlignment.Left,
	}, boutiqueFrame)
	mk("TextLabel", {
		BackgroundTransparency = 1,
		Font = Enum.Font.Gotham,
		Text = "Cosmetics & convenience. No pay-to-win speed or score.",
		TextColor3 = Color3.fromRGB(244, 239, 230),
		TextSize = 13,
		TextWrapped = true,
		Size = UDim2.new(1, -24, 0, 36),
		Position = UDim2.fromOffset(12, 44),
		TextXAlignment = Enum.TextXAlignment.Left,
	}, boutiqueFrame)

	local list = mk("ScrollingFrame", {
		BackgroundTransparency = 1,
		Position = UDim2.fromOffset(12, 88),
		Size = UDim2.new(1, -24, 1, -100),
		CanvasSize = UDim2.fromOffset(0, 520),
		ScrollBarThickness = 4,
	}, boutiqueFrame)
	mk("UIListLayout", { Padding = UDim.new(0, 6), SortOrder = Enum.SortOrder.LayoutOrder }, list)

	local order = 0
	for key, def in Config.GamePasses do
		order += 1
		local btn = pill(def.name .. "  ·  Pass", list, order)
		btn.MouseButton1Click:Connect(function()
			Remotes.event(Remotes.Events.RequestPromptPass):FireServer(key)
		end)
	end
	for key, def in Config.Products do
		order += 1
		local btn = pill(def.name .. "  ·  Product", list, order)
		btn.MouseButton1Click:Connect(function()
			Remotes.event(Remotes.Events.RequestPromptProduct):FireServer(key)
		end)
	end
end

function HUD.toggleBoutique()
	if boutiqueFrame then
		boutiqueFrame.Visible = not boutiqueFrame.Visible
	end
end

function HUD.setCoins(n: number)
	if coinsLabel then
		coinsLabel.Text = "Coins " .. tostring(n)
	end
end

function HUD.setRound(state: any)
	if typeof(state) ~= "table" then
		return
	end
	local me
	for _, row in state.contestants or {} do
		if row.userId == player.UserId then
			me = row
			break
		end
	end
	local left = math.max(0, math.ceil((state.endsAt or 0) - Workspace:GetServerTimeNow()))
	phaseLabel.Text = string.format("%s  ·  %ds", string.upper(state.phase or "?"), left)
	local target = state.rareTarget or 1
	if me then
		statsLabel.Text = string.format("Looks %d  ·  Rares %d/%d", me.looks or 0, me.rares or 0, target)
	end
end

function HUD.setHint(text: string)
	hintLabel.Text = text
end

function HUD.toast(text: string)
	toastLabel.Text = text
	toastLabel.Visible = true
	toastLabel.TextTransparency = 0
	task.delay(2.4, function()
		local tw = TweenService:Create(toastLabel, TweenInfo.new(0.4), { TextTransparency = 1 })
		tw:Play()
		tw.Completed:Wait()
		toastLabel.Visible = false
	end)
end

function HUD.gui(): ScreenGui
	return gui
end

return HUD
