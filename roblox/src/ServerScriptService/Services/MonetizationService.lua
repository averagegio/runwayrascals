--!strict
--[[
	MarketplaceService — Game Passes (UserOwnsGamePassAsync / PromptGamePassPurchase)
	and Developer Products (PromptProductPurchase / ProcessReceipt).

	Fair play: grants cosmetics, coins, queue skip, extra closet slots — never
	run speed, rare rate, or score multipliers.
]]

local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)
local Catalog = require(ReplicatedStorage.Shared.Catalog)
local Remotes = require(ReplicatedStorage.Net.Remotes)

local DataService = require(script.Parent.DataService)

local MonetizationService = {}

local function toast(player: Player, text: string)
	Remotes.event(Remotes.Events.Toast):FireClient(player, text)
end

local function passId(key: string): number
	local def = (Config.GamePasses :: any)[key]
	if type(def) == "table" then
		return def.id
	end
	return 0
end

function MonetizationService.ownsPass(player: Player, key: string): boolean
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
	return player.MembershipType == Enum.MembershipType.Premium
end

function MonetizationService.outfitSlots(player: Player): number
	if MonetizationService.ownsPass(player, "WalkInCloset") or MonetizationService.ownsPass(player, "FrontRowVIP") then
		return Catalog.vipOutfitSlots()
	end
	return Catalog.outfitSlots()
end

function MonetizationService.skipsQueue(player: Player): boolean
	return MonetizationService.ownsPass(player, "FastCast") or MonetizationService.ownsPass(player, "FrontRowVIP")
end

function MonetizationService.promptPass(player: Player, key: string)
	local id = passId(key)
	if not Config.isConfiguredId(id) then
		toast(player, "Set Game Pass IDs in Config.lua (Creator Dashboard).")
		return
	end
	MarketplaceService:PromptGamePassPurchase(player, id)
end

function MonetizationService.promptProduct(player: Player, key: string)
	local def = (Config.Products :: any)[key]
	if type(def) ~= "table" or not Config.isConfiguredId(def.id) then
		toast(player, "Set Developer Product IDs in Config.lua (Creator Dashboard).")
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

function MonetizationService.grantProduct(player: Player, productId: number): boolean
	local _, def = productById(productId)
	if not def then
		warn("[Rascal] Unknown product", productId)
		return false
	end
	if type(def.coins) == "number" then
		DataService.addCoins(player, def.coins)
	end
	if type(def.lookId) == "string" then
		DataService.grantLook(player, def.lookId)
		if def.lookId == "nightfall-finale" then
			DataService.grantLook(player, "nightfall-boots")
		end
	end
	toast(player, "Unlocked: " .. def.name)
	Remotes.event(Remotes.Events.PlayerData):FireClient(player, DataService.get(player))
	return true
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

	MarketplaceService.PromptGamePassPurchaseFinished:Connect(function(player, gamePassId, wasPurchased)
		if not wasPurchased then
			return
		end
		toast(player, "Game Pass unlocked — cosmetics & convenience only.")
		DataService.applyDailyAndStreak(
			player,
			MonetizationService.ownsPass(player, "FrontRowVIP"),
			MonetizationService.isPremium(player)
		)
		Remotes.event(Remotes.Events.PlayerData):FireClient(player, DataService.get(player))
		local _passId = gamePassId
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
end

return MonetizationService
