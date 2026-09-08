--!strict
--[[
	Player persistence via DataStoreService.GetDataStore / UpdateAsync.
	Studio unpublished places often fail DataStores — session memory still works.
]]

local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Shared.Config)
local Catalog = require(ReplicatedStorage.Shared.Catalog)
local Balance = require(ReplicatedStorage.Shared.Balance)

export type PlayerData = {
	coins: number,
	xp: number,
	ownedLooks: { string },
	unlockedCities: { string },
	savedOutfits: { { [string]: string } },
	stats: {
		showsCompleted: number,
		bestScore: number,
		raresCollected: number,
		minutesPlayed: number,
		firstWinUnix: number?,
	},
	streak: { days: number, lastDay: string },
	tutorialComplete: boolean,
	receipts: { [string]: boolean },
	daily: { lastGrant: string, coinsGranted: number },
}

local DataService = {}

local cache: { [number]: PlayerData } = {}
local store: GlobalDataStore? = nil

local function utcDayKey(unix: number?): string
	local t = os.date("!*t", unix or os.time())
	return string.format("%04d-%02d-%02d", t.year, t.month, t.day)
end

local function defaultData(): PlayerData
	return {
		coins = 0,
		xp = 0,
		ownedLooks = Catalog.starterOwned(),
		unlockedCities = { "newyork" },
		savedOutfits = {},
		stats = {
			showsCompleted = 0,
			bestScore = 0,
			raresCollected = 0,
			minutesPlayed = 0,
			firstWinUnix = nil,
		},
		streak = { days = 0, lastDay = "" },
		tutorialComplete = false,
		receipts = {},
		daily = { lastGrant = "", coinsGranted = 0 },
	}
end

local function merge(saved: any): PlayerData
	local data = defaultData()
	if typeof(saved) ~= "table" then
		return data
	end
	if type(saved.coins) == "number" then
		data.coins = saved.coins
	end
	if type(saved.xp) == "number" then
		data.xp = saved.xp
	end
	if type(saved.ownedLooks) == "table" then
		data.ownedLooks = saved.ownedLooks
	end
	if type(saved.unlockedCities) == "table" then
		data.unlockedCities = saved.unlockedCities
	end
	if type(saved.savedOutfits) == "table" then
		data.savedOutfits = saved.savedOutfits
	end
	if type(saved.stats) == "table" then
		for key, value in saved.stats do
			(data.stats :: any)[key] = value
		end
	end
	if type(saved.streak) == "table" then
		data.streak = saved.streak
	end
	if type(saved.tutorialComplete) == "boolean" then
		data.tutorialComplete = saved.tutorialComplete
	end
	if type(saved.receipts) == "table" then
		data.receipts = saved.receipts
	end
	if type(saved.daily) == "table" then
		data.daily = saved.daily
	end
	return data
end

function DataService.init()
	local ok, result = pcall(function()
		return DataStoreService:GetDataStore(Config.DATASTORE_NAME)
	end)
	if ok then
		store = result
	else
		warn("[Rascal] DataStore unavailable (expected in unpublished Studio):", result)
	end
end

function DataService.get(player: Player): PlayerData
	local existing = cache[player.UserId]
	if existing then
		return existing
	end
	return DataService.load(player)
end

function DataService.load(player: Player): PlayerData
	local data = defaultData()
	if store then
		local ok, saved = pcall(function()
			return (store :: GlobalDataStore):GetAsync("u_" .. player.UserId)
		end)
		if ok then
			data = merge(saved)
		else
			warn("[Rascal] GetAsync failed:", saved)
		end
	end
	cache[player.UserId] = data
	return data
end

function DataService.save(player: Player)
	local data = cache[player.UserId]
	if not data or not store then
		return
	end
	local ok, err = pcall(function()
		(store :: GlobalDataStore):UpdateAsync("u_" .. player.UserId, function()
			return data
		end)
	end)
	if not ok then
		warn("[Rascal] UpdateAsync failed:", err)
	end
end

function DataService.grantLook(player: Player, lookId: string)
	local data = DataService.get(player)
	if table.find(data.ownedLooks, lookId) then
		return
	end
	table.insert(data.ownedLooks, lookId)
end

function DataService.addCoins(player: Player, amount: number)
	local data = DataService.get(player)
	data.coins = math.max(0, data.coins + math.floor(amount))
end

function DataService.markReceipt(player: Player, purchaseId: string): boolean
	local data = DataService.get(player)
	if data.receipts[purchaseId] then
		return false
	end
	data.receipts[purchaseId] = true
	return true
end

function DataService.applyDailyAndStreak(player: Player, isVip: boolean, isPremium: boolean)
	local data = DataService.get(player)
	local today = utcDayKey()
	if data.daily.lastGrant == today then
		return
	end

	local grant = Balance.scoring.dailyCoins
	if isVip then
		grant += Balance.scoring.vipDailyCoins
	end
	if isPremium then
		grant = math.floor(grant * (1 + Balance.scoring.premiumCoinBonus))
	end

	local last = data.streak.lastDay
	if last == "" then
		data.streak.days = 1
	else
		-- Consecutive if lastDay is yesterday (simple string compare via os.time offset).
		local yesterday = utcDayKey(os.time() - 24 * 3600)
		if last == yesterday then
			data.streak.days += 1
		elseif last ~= today then
			data.streak.days = 1
		end
	end
	data.streak.lastDay = today
	if data.streak.days == Balance.retention.d7StreakDays then
		grant += Balance.scoring.streakDay7Coins
	end

	data.daily.lastGrant = today
	data.daily.coinsGranted = grant
	DataService.addCoins(player, grant)
end

function DataService.recordShow(player: Player, score: number, rares: number, finished: boolean)
	local data = DataService.get(player)
	if finished then
		data.stats.showsCompleted += 1
		if not data.stats.firstWinUnix then
			data.stats.firstWinUnix = os.time()
		end
		data.tutorialComplete = true
	end
	data.stats.raresCollected += rares
	if score > data.stats.bestScore then
		data.stats.bestScore = score
	end
end

function DataService.onPlayerRemoving(player: Player)
	DataService.save(player)
	cache[player.UserId] = nil
end

function DataService.bind()
	Players.PlayerRemoving:Connect(DataService.onPlayerRemoving)
	game:BindToClose(function()
		for _, player in Players:GetPlayers() do
			DataService.save(player)
		end
	end)
end

return DataService
