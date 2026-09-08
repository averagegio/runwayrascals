--!strict
--[[
	In-experience HUD: phase, Style Points, vote, rematch, invite, share, boutique.

	Boutique is an intermission button, not a gate. VIP copy is cosmetic-only.
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)
local Catalog = require(ReplicatedStorage.Shared.Catalog)
local Remotes = require(ReplicatedStorage.Net.Remotes)

local HUD = {}

local player = Players.LocalPlayer
local gui: ScreenGui
local phaseLabel: TextLabel
local hintLabel: TextLabel
local statsLabel: TextLabel
local toastLabel: TextLabel
local stylePointsLabel: TextLabel
local voteFrame: Frame
local voteList: Frame
local dressFrame: Frame
local dressList: Frame
local giftFrame: Frame?
local boutiqueFrame: Frame?
local lastData: any = nil

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

local function otherPlayers(): { Player }
	local list = {}
	for _, p in Players:GetPlayers() do
		if p ~= player then
			table.insert(list, p)
		end
	end
	return list
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
		Text = "Theme → dress → runway → vote. First win under two minutes.",
		TextColor3 = Color3.fromRGB(244, 239, 230),
		TextSize = 14,
		TextWrapped = true,
		TextXAlignment = Enum.TextXAlignment.Left,
		Position = UDim2.fromOffset(0, 30),
		Size = UDim2.new(0.7, 0, 0, 40),
	}, top)

	stylePointsLabel = mk("TextLabel", {
		BackgroundTransparency = 1,
		Font = Enum.Font.GothamBold,
		Text = "Style Points 0",
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

	voteFrame = mk("Frame", {
		Name = "VotePanel",
		Visible = false,
		BackgroundTransparency = 0.15,
		BackgroundColor3 = Color3.fromRGB(12, 10, 14),
		AnchorPoint = Vector2.new(0, 1),
		Position = UDim2.new(0, 16, 1, -16),
		Size = UDim2.fromOffset(240, 220),
	}, gui)
	mk("UICorner", { CornerRadius = UDim.new(0, 12) }, voteFrame)
	mk("TextLabel", {
		Name = "VoteTitle",
		BackgroundTransparency = 1,
		Font = Enum.Font.GothamBold,
		Text = "Vote a look",
		TextColor3 = Color3.fromRGB(201, 165, 106),
		TextSize = 14,
		Size = UDim2.new(1, -16, 0, 28),
		Position = UDim2.fromOffset(8, 6),
		TextXAlignment = Enum.TextXAlignment.Left,
	}, voteFrame)
	voteList = mk("Frame", {
		Name = "VoteList",
		BackgroundTransparency = 1,
		Position = UDim2.fromOffset(8, 36),
		Size = UDim2.new(1, -16, 1, -44),
	}, voteFrame)
	mk("UIListLayout", {
		Padding = UDim.new(0, 6),
		FillDirection = Enum.FillDirection.Vertical,
		HorizontalAlignment = Enum.HorizontalAlignment.Center,
		VerticalAlignment = Enum.VerticalAlignment.Top,
		SortOrder = Enum.SortOrder.LayoutOrder,
	}, voteList)

	dressFrame = mk("Frame", {
		Name = "DressPanel",
		Visible = false,
		BackgroundTransparency = 0.12,
		BackgroundColor3 = Color3.fromRGB(12, 10, 14),
		AnchorPoint = Vector2.new(0, 1),
		Position = UDim2.new(0, 16, 1, -16),
		Size = UDim2.fromOffset(280, 280),
	}, gui)
	mk("UICorner", { CornerRadius = UDim.new(0, 12) }, dressFrame)
	mk("TextLabel", {
		Name = "DressTitle",
		BackgroundTransparency = 1,
		Font = Enum.Font.GothamBold,
		Text = "Dress the look",
		TextColor3 = Color3.fromRGB(201, 165, 106),
		TextSize = 14,
		Size = UDim2.new(1, -16, 0, 28),
		Position = UDim2.fromOffset(8, 6),
		TextXAlignment = Enum.TextXAlignment.Left,
	}, dressFrame)
	dressList = mk("ScrollingFrame", {
		Name = "DressList",
		BackgroundTransparency = 1,
		Position = UDim2.fromOffset(8, 36),
		Size = UDim2.new(1, -16, 1, -44),
		CanvasSize = UDim2.fromOffset(0, 420),
		ScrollBarThickness = 4,
	}, dressFrame)
	mk("UIListLayout", {
		Padding = UDim.new(0, 6),
		SortOrder = Enum.SortOrder.LayoutOrder,
	}, dressList)

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

local function hideGiftPicker()
	if giftFrame then
		giftFrame:Destroy()
		giftFrame = nil
	end
end

local function promptGift(key: string)
	hideGiftPicker()
	local others = otherPlayers()
	if #others == 0 then
		HUD.toast("Gift needs a friend in this server.")
		return
	end
	if #others == 1 then
		Remotes.event(Remotes.Events.RequestGift):FireServer(key, others[1].UserId)
		return
	end
	giftFrame = mk("Frame", {
		Name = "GiftPicker",
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.5),
		Size = UDim2.fromOffset(280, 220),
		BackgroundColor3 = Color3.fromRGB(12, 10, 14),
		ZIndex = 20,
	}, gui)
	mk("UICorner", { CornerRadius = UDim.new(0, 12) }, giftFrame)
	mk("TextLabel", {
		BackgroundTransparency = 1,
		Font = Enum.Font.GothamBold,
		Text = "Gift to",
		TextColor3 = Color3.fromRGB(201, 165, 106),
		TextSize = 16,
		Size = UDim2.new(1, -16, 0, 28),
		Position = UDim2.fromOffset(8, 8),
		TextXAlignment = Enum.TextXAlignment.Left,
		ZIndex = 21,
	}, giftFrame)
	local list = mk("ScrollingFrame", {
		BackgroundTransparency = 1,
		Position = UDim2.fromOffset(8, 40),
		Size = UDim2.new(1, -16, 1, -48),
		CanvasSize = UDim2.fromOffset(0, 36 * #others),
		ScrollBarThickness = 4,
		ZIndex = 21,
	}, giftFrame)
	mk("UIListLayout", { Padding = UDim.new(0, 6), SortOrder = Enum.SortOrder.LayoutOrder }, list)
	for i, other in others do
		local btn = pill(other.DisplayName, list, i)
		btn.ZIndex = 22
		btn.MouseButton1Click:Connect(function()
			Remotes.event(Remotes.Events.RequestGift):FireServer(key, other.UserId)
			hideGiftPicker()
		end)
	end
end

function HUD.buildBoutique()
	boutiqueFrame = mk("Frame", {
		Name = "Boutique",
		Visible = false,
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.5),
		Size = UDim2.fromOffset(440, 500),
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
		Text = "Cosmetic VIP only — closet, makeup, poses, tags. No vote or score multipliers. Style Points are earned, never sold.",
		TextColor3 = Color3.fromRGB(244, 239, 230),
		TextSize = 13,
		TextWrapped = true,
		Size = UDim2.new(1, -24, 0, 48),
		Position = UDim2.fromOffset(12, 44),
		TextXAlignment = Enum.TextXAlignment.Left,
	}, boutiqueFrame)

	local list = mk("ScrollingFrame", {
		BackgroundTransparency = 1,
		Position = UDim2.fromOffset(12, 100),
		Size = UDim2.new(1, -24, 1, -112),
		CanvasSize = UDim2.fromOffset(0, 720),
		ScrollBarThickness = 4,
	}, boutiqueFrame)
	mk("UIListLayout", { Padding = UDim.new(0, 6), SortOrder = Enum.SortOrder.LayoutOrder }, list)

	local order = 0
	for key, def in Config.GamePasses do
		order += 1
		local btn = pill(string.format("%s  ·  %d R$ pass", def.name, def.priceHintRobux), list, order)
		btn.MouseButton1Click:Connect(function()
			Remotes.event(Remotes.Events.RequestPromptPass):FireServer(key)
		end)
	end
	for key, def in Config.Products do
		order += 1
		local suffix = if def.gift then "gift" else "product"
		local btn = pill(string.format("%s  ·  %d R$ %s", def.name, def.priceHintRobux, suffix), list, order)
		btn.MouseButton1Click:Connect(function()
			if def.gift == true then
				promptGift(key)
			else
				Remotes.event(Remotes.Events.RequestPromptProduct):FireServer(key)
			end
		end)
	end
end

function HUD.toggleBoutique()
	if boutiqueFrame then
		boutiqueFrame.Visible = not boutiqueFrame.Visible
		if not boutiqueFrame.Visible then
			hideGiftPicker()
		end
	end
end

function HUD.setStylePoints(n: number)
	if stylePointsLabel then
		stylePointsLabel.Text = "Style Points " .. tostring(n)
	end
end

function HUD.setData(data: any)
	if typeof(data) ~= "table" then
		return
	end
	lastData = data
	local sp = data.stylePoints
	if type(sp) ~= "number" then
		sp = data.coins
	end
	if type(sp) == "number" then
		HUD.setStylePoints(sp)
	end
	HUD.rebuildDress()
end

-- Back-compat alias (old clients sent "coins").
function HUD.setCoins(n: number)
	HUD.setStylePoints(n)
end

local function rebuildVotes(state: any)
	for _, child in voteList:GetChildren() do
		if child:IsA("TextButton") then
			child:Destroy()
		end
	end
	local isVote = state.phase == Config.Phases.Vote
	voteFrame.Visible = isVote
	if not isVote then
		return
	end
	local order = 0
	for _, row in state.contestants or {} do
		if row.userId ~= player.UserId then
			order += 1
			local label = string.format("%s  ·  %d", row.name or "Model", row.votesReceived or 0)
			local btn = pill(label, voteList, order)
			local targetId = row.userId
			btn.MouseButton1Click:Connect(function()
				Remotes.event(Remotes.Events.RequestVote):FireServer(targetId)
			end)
		end
	end
	if order == 0 then
		voteFrame.Visible = false
	end
end

function HUD.rebuildDress()
	if not dressList then
		return
	end
	for _, child in dressList:GetChildren() do
		if child:IsA("TextButton") then
			child:Destroy()
		end
	end
	local owned = if lastData and type(lastData.ownedLooks) == "table" then lastData.ownedLooks else Catalog.starterOwned()
	local equipped = if lastData then lastData.equippedLookId else Config.DefaultLookId
	local points = if lastData and type(lastData.stylePoints) == "number" then lastData.stylePoints else 0
	local order = 0
	for _, look in Catalog.Looks do
		order += 1
		local has = table.find(owned, look.id) ~= nil
		local suffix
		if has and look.id == equipped then
			suffix = "on"
		elseif has then
			suffix = "equip"
		elseif look.track == "stylePoints" then
			suffix = tostring(look.stylePointCost or 0) .. " SP"
		else
			suffix = "Robux"
		end
		local btn = pill(string.format("%s  ·  %s", look.name, suffix), dressList, order)
		local lookId = look.id
		btn.MouseButton1Click:Connect(function()
			if has then
				Remotes.event(Remotes.Events.RequestEquipLook):FireServer(lookId)
			elseif look.track == "stylePoints" then
				if points < (look.stylePointCost or 0) then
					HUD.toast("Need more Style Points — walk first.")
					return
				end
				Remotes.event(Remotes.Events.RequestBuyLook):FireServer(lookId)
			else
				HUD.toast("Robux / IEC looks live in Boutique.")
			end
		end)
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
	local themeName = if type(state.theme) == "table" then state.theme.name else nil
	local phaseName = string.upper(state.phase or "?")
	if themeName then
		phaseLabel.Text = string.format("%s  ·  %s  ·  %ds", phaseName, themeName, left)
	else
		phaseLabel.Text = string.format("%s  ·  %ds", phaseName, left)
	end
	local target = state.rareTarget or 1
	if me then
		statsLabel.Text = string.format(
			"Looks %d  ·  Rares %d/%d  ·  Votes %d",
			me.looks or 0,
			me.rares or 0,
			target,
			me.votesReceived or 0
		)
	end
	rebuildVotes(state)
	local isDress = state.phase == Config.Phases.Dress
	if dressFrame then
		dressFrame.Visible = isDress
		if isDress then
			voteFrame.Visible = false
			HUD.rebuildDress()
		end
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
