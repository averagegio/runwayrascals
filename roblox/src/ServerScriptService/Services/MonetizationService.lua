--!strict
--[[
	MarketplaceService — Game Passes + Developer Products.

	Cosmetic VIP only. No vote/score/speed multipliers.
	Monthly VIP is a Dev Product that extends DataStore vipUntilUnix (30 days).
	Gifts: RequestGift sets a pending target, ProcessReceipt grants to that user.
	Passes/products must be created on THIS universe (cross-game sales ~May 2026).
	Do not sell Style Points for Robux. No donation/AFK hooks.
]]

local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Config = require(ReplicatedStorage.Shared.Config)
local Catalog = require(ReplicatedStorage.Shared.Catalog)
local Remotes = require(ReplicatedStorage.Net.Remotes)

local DataService = require(script.Parent.DataService)

local MonetizationService = {}

local pendingGiftTarget: { [number]: number } = {}
local studioPasses: { [number]: { [string]: boolean } } = {}

local function toast(player: Player, text: string)
	Remotes.event(Remotes.Events.Toast):FireClient(player, text)
end

local function studioMock(): boolean
	return RunService:IsStudio() and Config.StudioPlaytest.mockMarketplace == true
end

local function passId(key: string): number
	local def = (Config.GamePasses :: any)[key]
	if type(def) == "table" then
		return def.id
	end
	return 0
end

function MonetizationService.ownsPass(player: Player, key: string): boolean
	if studioMock() then
		local owned = studioPasses[player.UserId]
		if owned and owned[key] == true then
			return true
		end
	end
	local id = passId(key)
	if not Config.isConfiguredId(id) then
		return false
	end
	local ok, owns = pcall(function()
		return MarketplaceService:UserOwnsGamePassAsync(player.UserId, id)
	end)
	return ok and owns == true
end

function MonetizationService.isPremium(player: Player): boolean
	-- Readable for UX only. Must never multiply votes, score, or Style Points.
	return player.MembershipType == Enum.MembershipType.Premium
end

function MonetizationService.isVip(player: Player): boolean
	return MonetizationService.ownsPass(player, "FrontRowVIP") or DataService.hasMonthlyVip(player)
end

function MonetizationService.outfitSlots(player: Player): number
	if MonetizationService.isVip(player) or MonetizationService.ownsPass(player, "WalkInCloset") then
		return Catalog.vipOutfitSlots()
	end
	return Catalog.outfitSlots()
end

function MonetizationService.skipsQueue(player: Player): boolean
	if MonetizationService.ownsPass(player, "FastCast") then
		return true
	end
	return DataService.tryConsumeQueueSkip(player)
end

function MonetizationService.promptPass(player: Player, key: string)
	local id = passId(key)
	if not Config.isConfiguredId(id) then
		if studioMock() then
			studioPasses[player.UserId] = studioPasses[player.UserId] or {}
			studioPasses[player.UserId][key] = true
			if key == "FrontRowVIP" then
				DataService.extendVip(player, 30)
			end
			toast(player, "Studio mock: " .. key .. " (paste real IDs before publish).")
			Remotes.event(Remotes.Events.PlayerData):FireClient(player, DataService.get(player))
			return
		end
		toast(player, "Set Game Pass IDs in Config.lua (this universe only).")
		return
	end
	MarketplaceService:PromptGamePassPurchase(player, id)
end

function MonetizationService.promptProduct(player: Player, key: string)
	local def = (Config.Products :: any)[key]
	if type(def) ~= "table" then
		return
	end
	if type(def.stylePoints) == "number" then
		toast(player, "Style Points are earned in-round — not sold for Robux.")
		return
	end
	if not Config.isConfiguredId(def.id) then
		if studioMock() then
			MonetizationService.grantProductByKey(player, key)
			toast(player, "Studio mock: " .. def.name .. " (paste real IDs before publish).")
			return
		end
		toast(player, "Set Developer Product IDs in Config.lua (this universe only).")
		return
	end
	MarketplaceService:PromptProductPurchase(player, def.id)
end

local function productById(productId: number): (string?, any)
	for key, def in Config.Products do
		if def.id == productId then
			return key, def
		end
	end
	return nil, nil
end

local function grantLookPack(player: Player, lookId: string)
	DataService.grantLook(player, lookId)
	if lookId == "nightfall-finale" then
		DataService.grantLook(player, "nightfall-boots")
	end
end

local function applyDef(player: Player, buyer: Player, def: any): boolean
	local beneficiary = player
	if def.gift == true then
		local targetId = pendingGiftTarget[buyer.UserId]
		pendingGiftTarget[buyer.UserId] = nil
		if type(targetId) == "number" then
			local target = Players:GetPlayerByUserId(targetId)
			if target then
				beneficiary = target
			else
				toast(buyer, "Gift held — friend must be in this server. Retry while they're here.")
				return false
			end
		end
	end

	if type(def.vipDays) == "number" then
		DataService.extendVip(beneficiary, def.vipDays)
	end
	if type(def.lookId) == "string" then
		grantLookPack(beneficiary, def.lookId)
	end
	if type(def.queueSkipTickets) == "number" then
		DataService.addQueueSkipTickets(beneficiary, def.queueSkipTickets)
	end

	toast(buyer, "Unlocked: " .. def.name)
	if beneficiary ~= buyer then
		toast(beneficiary, buyer.DisplayName .. " sent you " .. def.name)
	end
	Remotes.event(Remotes.Events.PlayerData):FireClient(buyer, DataService.get(buyer))
	if beneficiary ~= buyer then
		Remotes.event(Remotes.Events.PlayerData):FireClient(beneficiary, DataService.get(beneficiary))
	end
	return true
end

function MonetizationService.grantProductByKey(player: Player, key: string): boolean
	local def = (Config.Products :: any)[key]
	if type(def) ~= "table" then
		return false
	end
	return applyDef(player, player, def)
end

function MonetizationService.grantProduct(player: Player, productId: number): boolean
	local _, def = productById(productId)
	if not def then
		warn("[Rascal] Unknown product", productId)
		return false
	end
	return applyDef(player, player, def)
end

function MonetizationService.processReceipt(receiptInfo: { [string]: any }): Enum.ProductPurchaseDecision
	local player = Players:GetPlayerByUserId(receiptInfo.PlayerId)
	if not player then
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end
	local purchaseId = receiptInfo.PurchaseId
	if type(purchaseId) ~= "string" then
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end
	local firstTime = DataService.markReceipt(player, purchaseId)
	if not firstTime then
		return Enum.ProductPurchaseDecision.PurchaseGranted
	end
	local ok = MonetizationService.grantProduct(player, receiptInfo.ProductId)
	if ok then
		DataService.save(player)
		return Enum.ProductPurchaseDecision.PurchaseGranted
	end
	return Enum.ProductPurchaseDecision.NotProcessedYet
end

function MonetizationService.bind()
	MarketplaceService.ProcessReceipt = MonetizationService.processReceipt

	MarketplaceService.PromptGamePassPurchaseFinished:Connect(function(player, _gamePassId, wasPurchased)
		if not wasPurchased then
			return
		end
		toast(player, "Unlocked — cosmetics only. Votes stay fair.")
		DataService.applyDailyAndStreak(player)
		Remotes.event(Remotes.Events.PlayerData):FireClient(player, DataService.get(player))
	end)

	Remotes.event(Remotes.Events.RequestPromptPass).OnServerEvent:Connect(function(player, key)
		if type(key) ~= "string" then
			return
		end
		MonetizationService.promptPass(player, key)
	end)

	Remotes.event(Remotes.Events.RequestPromptProduct).OnServerEvent:Connect(function(player, key)
		if type(key) ~= "string" then
			return
		end
		MonetizationService.promptProduct(player, key)
	end)

	Remotes.event(Remotes.Events.RequestGift).OnServerEvent:Connect(function(player, key, targetUserId)
		if type(key) ~= "string" or type(targetUserId) ~= "number" then
			return
		end
		if targetUserId == player.UserId then
			toast(player, "Pick a friend to gift.")
			return
		end
		pendingGiftTarget[player.UserId] = targetUserId
		MonetizationService.promptProduct(player, key)
	end)
end

return MonetizationService
