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
	stylePoints: number,
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
	daily: { lastGrant: string, stylePointsGranted: number },
	vipUntilUnix: number,
	queueSkipTickets: number,
	attributedShareCode: string,
	referredByUserId: number,
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
		stylePoints = 0,
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
		daily = { lastGrant = "", stylePointsGranted = 0 },
		vipUntilUnix = 0,
		queueSkipTickets = 0,
		attributedShareCode = "",
		referredByUserId = 0,
	}
end

local function merge(saved: any): PlayerData
	local data = defaultData()
	if typeof(saved) ~= "table" then
		return data
	end
	if type(saved.coins) == "number" and type(saved.stylePoints) ~= "number" then
		data.stylePoints = saved.coins
	end
	if type(saved.stylePoints) == "number" then
		data.stylePoints = saved.stylePoints
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
		data.daily.lastGrant = saved.daily.lastGrant or data.daily.lastGrant
		local granted = saved.daily.stylePointsGranted or saved.daily.coinsGranted
		if type(granted) == "number" then
			data.daily.stylePointsGranted = granted
		end
	end
	if type(saved.vipUntilUnix) == "number" then
		data.vipUntilUnix = saved.vipUntilUnix
	end
	if type(saved.queueSkipTickets) == "number" then
		data.queueSkipTickets = saved.queueSkipTickets
	end
	if type(saved.attributedShareCode) == "string" then
		data.attributedShareCode = saved.attributedShareCode
	end
	if type(saved.referredByUserId) == "number" then
		data.referredByUserId = saved.referredByUserId
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

function DataService.addStylePoints(player: Player, amount: number)
	local data = DataService.get(player)
	data.stylePoints = math.max(0, data.stylePoints + math.floor(amount))
end

-- Back-compat alias for older call sites.
function DataService.addCoins(player: Player, amount: number)
	DataService.addStylePoints(player, amount)
end

function DataService.extendVip(player: Player, days: number)
	local data = DataService.get(player)
	local now = os.time()
	local base = math.max(data.vipUntilUnix, now)
	data.vipUntilUnix = base + math.max(0, math.floor(days)) * 86400
end

function DataService.hasMonthlyVip(player: Player): boolean
	return DataService.get(player).vipUntilUnix > os.time()
end

function DataService.addQueueSkipTickets(player: Player, n: number)
	local data = DataService.get(player)
	data.queueSkipTickets = math.max(0, data.queueSkipTickets + math.floor(n))
end

function DataService.tryConsumeQueueSkip(player: Player): boolean
	local data = DataService.get(player)
	if data.queueSkipTickets <= 0 then
		return false
	end
	data.queueSkipTickets -= 1
	return true
end

function DataService.captureShareAttribution(player: Player)
	local data = DataService.get(player)
	if data.attributedShareCode ~= "" or data.referredByUserId ~= 0 then
		return
	end
	local join = player:GetJoinData()
	if type(join.ReferredByPlayerId) == "number" and join.ReferredByPlayerId > 0 then
		data.referredByUserId = join.ReferredByPlayerId
	end
	local launch = join.LaunchData
	if type(launch) == "string" and launch ~= "" then
		data.attributedShareCode = string.sub(launch, 1, 64)
	end
end

function DataService.markReceipt(player: Player, purchaseId: string): boolean
	local data = DataService.get(player)
	if data.receipts[purchaseId] then
		return false
	end
	data.receipts[purchaseId] = true
	return true
end

function DataService.applyDailyAndStreak(player: Player)
	local data = DataService.get(player)
	local today = utcDayKey()
	if data.daily.lastGrant == today then
		return
	end

	-- Same grant for everyone. No Premium/VIP Style Point multiplier
	-- (Engagement-Based Payouts ended July 2025; VIP is cosmetic only).
	local grant = Balance.scoring.dailyStylePoints

	local last = data.streak.lastDay
	if last == "" then
		data.streak.days = 1
	else
		local yesterday = utcDayKey(os.time() - 24 * 3600)
		if last == yesterday then
			data.streak.days += 1
		elseif last ~= today then
			data.streak.days = 1
		end
	end
	data.streak.lastDay = today
	if data.streak.days == Balance.retention.d7StreakDays then
		grant += Balance.scoring.streakDay7StylePoints
	end

	data.daily.lastGrant = today
	data.daily.stylePointsGranted = grant
	DataService.addStylePoints(player, grant)
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
