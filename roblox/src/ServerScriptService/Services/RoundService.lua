--!strict
--[[
	Fashion Week round loop:
	Lobby → (Dress) → Countdown → Run → Pose → Vote → Score → Intermission.

	Fun before funnel. Votes are one-each, no VIP/Premium extra ballots.
	Server is authority for score, crash, collect, vote, and finish.

	Studio Play Solo spawns house NPCs so vote has a target, and runs a
	short dress beat on the tutorial when Config.StudioPlaytest is on.
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local Workspace = game:GetService("Workspace")
local BadgeService = game:GetService("BadgeService")

local Config = require(ReplicatedStorage.Shared.Config)
local Catalog = require(ReplicatedStorage.Shared.Catalog)
local Scoring = require(ReplicatedStorage.Shared.Scoring)
local Balance = require(ReplicatedStorage.Shared.Balance)
local LiveOps = require(ReplicatedStorage.Shared.LiveOps)
local Remotes = require(ReplicatedStorage.Net.Remotes)
local LookVisuals = require(ReplicatedStorage.Shared.LookVisuals)

local ArenaService = require(script.Parent.ArenaService)
local DataService = require(script.Parent.DataService)
local MonetizationService = require(script.Parent.MonetizationService)
local StudioCastService = require(script.Parent.StudioCastService)

export type Contestant = {
	userId: number,
	name: string,
	player: Player?,
	model: Model?,
	isNpc: boolean,
	lane: number,
	z: number,
	alive: boolean,
	lives: number,
	looks: number,
	rares: number,
	pickups: number,
	distance: number,
	shield: number,
	jumpT: number,
	slideT: number,
	cart: BasePart,
	wantsRematch: boolean,
	spectatingUserId: number?,
	finished: boolean,
	place: number,
	poseQuality: number,
	votesReceived: number,
	votedFor: number?,
}

local RoundService = {}

local contestants: { [number]: Contestant } = {}
local phase = Config.Phases.Lobby
local phaseEndsAt = Workspace:GetServerTimeNow() + 6
local roundId = 0
local tutorialRound = true
local heartbeatConn: RBXScriptConnection? = nil
local pickupFolder: Folder? = nil
local finishOrder: { number } = {}

local function toast(player: Player?, text: string)
	if not player then
		return
	end
	Remotes.event(Remotes.Events.Toast):FireClient(player, text)
end

local function timings()
	if tutorialRound then
		return Balance.tutorial
	end
	return Balance.normal
end

local function speed(): number
	if tutorialRound then
		return Balance.movement.tutorialSpeed
	end
	return Balance.movement.normalSpeed
end

local function humanCount(): number
	local n = 0
	for _, c in contestants do
		if not c.isNpc then
			n += 1
		end
	end
	return n
end

local function snapshot()
	local list = {}
	for userId, c in contestants do
		table.insert(list, {
			userId = userId,
			name = c.name,
			lane = c.lane,
			z = c.z,
			alive = c.alive,
			looks = c.looks,
			rares = c.rares,
			votesReceived = c.votesReceived,
			scoreHint = c.looks * Balance.scoring.lookPoints + c.rares * Balance.scoring.rarePoints,
			finished = c.finished,
			spectatingUserId = c.spectatingUserId,
			isNpc = c.isNpc,
		})
	end
	local theme = LiveOps.theme()
	return {
		roundId = roundId,
		phase = phase,
		endsAt = phaseEndsAt,
		tutorial = tutorialRound,
		house = Config.Houses.nightfall,
		city = "newyork",
		showId = Config.OpenCastShowId,
		theme = theme,
		themeWeek = LiveOps.utcWeekKey(),
		contestants = list,
		rareTarget = timings().rareTarget,
		studioPlaytest = RunService:IsStudio(),
	}
end

local function broadcast()
	Remotes.event(Remotes.Events.RoundState):FireAllClients(snapshot())
end

local function clearPickups()
	if pickupFolder then
		pickupFolder:Destroy()
		pickupFolder = nil
	end
end

local function spawnPickups(root: Folder)
	clearPickups()
	local folder = Instance.new("Folder")
	folder.Name = "Pickups"
	folder.Parent = root
	pickupFolder = folder

	local finishZ = root:GetAttribute("FinishZ") :: number
	local startZ = root:GetAttribute("StartZ") :: number
	local looks = { "nightfall-tee", "crest-polo", "concrete-tee", "nightfall-boots" }
	for i = 1, 10 do
		local alpha = i / 11
		local z = startZ + (finishZ - startZ) * alpha
		local lane = (i % 3)
		local lookId = looks[((i - 1) % #looks) + 1]
		local look = Catalog.getLook(lookId)
		local p = Instance.new("Part")
		p.Name = lookId
		p.Shape = Enum.PartType.Ball
		p.Size = Vector3.new(2.4, 2.4, 2.4)
		p.Anchored = true
		p.CanCollide = false
		p.Material = Enum.Material.Neon
		p.Color = if look and look.rare then Color3.fromRGB(244, 196, 48) else Color3.fromRGB(236, 72, 153)
		p.Position = Vector3.new(ArenaService.laneX(lane), 4, z)
		p:SetAttribute("LookId", lookId)
		p:SetAttribute("Rare", look ~= nil and look.rare == true)
		p:SetAttribute("Lane", lane)
		p.Parent = folder
	end

	for i = 1, 6 do
		local z = startZ + (finishZ - startZ) * ((i + 0.5) / 8)
		local lane = (i + 1) % 3
		local barrier = Instance.new("Part")
		barrier.Name = "Paparazzi"
		barrier.Size = Vector3.new(3, 4, 1.2)
		barrier.Anchored = true
		barrier.CanCollide = false
		barrier.Color = Color3.fromRGB(30, 30, 30)
		barrier.Position = Vector3.new(ArenaService.laneX(lane), 3.2, z)
		barrier:SetAttribute("Obstacle", true)
		barrier:SetAttribute("Lane", lane)
		barrier.Parent = folder
	end
end

local function ensureCart(name: string): BasePart
	local cart = Instance.new("Part")
	cart.Name = "RunwayCart_" .. name
	cart.Size = Vector3.new(4, 1, 4)
	cart.Transparency = 1
	cart.Anchored = true
	cart.CanCollide = false
	cart.Parent = Workspace
	return cart
end

local function rootPart(c: Contestant): BasePart?
	if c.player then
		local character = c.player.Character
		if character then
			return character:FindFirstChild("HumanoidRootPart") :: BasePart?
		end
	end
	if c.model then
		return (c.model.PrimaryPart or c.model:FindFirstChild("HumanoidRootPart")) :: BasePart?
	end
	return nil
end

local function attachCharacter(c: Contestant)
	if c.player then
		local character = c.player.Character
		if not character then
			return
		end
		local root = character:FindFirstChild("HumanoidRootPart") :: BasePart?
		local humanoid = character:FindFirstChildOfClass("Humanoid")
		if humanoid then
			humanoid.WalkSpeed = 0
			humanoid.JumpPower = 0
			humanoid.AutoRotate = false
			humanoid.PlatformStand = true
		end
		if root then
			root.Anchored = true
		end
	end
end

local function placeCart(c: Contestant)
	local y = 3.2
	if c.jumpT > 0 then
		y += 4 * math.sin(math.pi * (1 - c.jumpT / Balance.movement.jumpSeconds))
	end
	if c.slideT > 0 then
		y -= 1.1
	end
	local x = ArenaService.laneX(c.lane)
	c.cart.CFrame = CFrame.new(x, y, c.z) * CFrame.Angles(0, math.pi, 0)
	if c.model then
		c.model:PivotTo(c.cart.CFrame * CFrame.new(0, 2.2, 0))
		return
	end
	local root = rootPart(c)
	if root then
		root.CFrame = c.cart.CFrame * CFrame.new(0, 2.2, 0)
	end
end

local function setPhase(nextPhase: string, seconds: number)
	phase = nextPhase
	phaseEndsAt = Workspace:GetServerTimeNow() + seconds
	if nextPhase == Config.Phases.Vote then
		for _, c in contestants do
			if c.player then
				Remotes.event(Remotes.Events.Tutorial):FireClient(c.player, {
					step = "vote",
					hint = "Vote another model — one vote. VIP never adds votes.",
				})
			end
		end
	elseif nextPhase == Config.Phases.Dress then
		local theme = LiveOps.theme()
		for _, c in contestants do
			if c.player then
				Remotes.event(Remotes.Events.Tutorial):FireClient(c.player, {
					step = "dress",
					hint = "This week: " .. theme.name .. " — layer looks. Style Points buy street; Robux is exclusive.",
				})
			end
		end
	end
	broadcast()
end

local function remaining(): number
	return math.max(0, phaseEndsAt - Workspace:GetServerTimeNow())
end

local function releaseCharacter(c: Contestant)
	if c.isNpc then
		local origin = ArenaService.lobbyOrigin()
		if c.model then
			c.model:PivotTo(origin * CFrame.new((c.lane - 1) * 4, 0, 0))
		end
		return
	end
	local player = c.player
	if not player then
		return
	end
	local character = player.Character
	if not character then
		return
	end
	local root = character:FindFirstChild("HumanoidRootPart") :: BasePart?
	local humanoid = character:FindFirstChildOfClass("Humanoid")
	if root then
		root.Anchored = false
	end
	if humanoid then
		humanoid.PlatformStand = false
		humanoid.WalkSpeed = 16
		humanoid.JumpPower = 50
		humanoid.AutoRotate = true
	end
	local arena = Workspace:FindFirstChild(Config.ARENA_NAME)
	if arena then
		local spawn = arena:FindFirstChild("LobbySpawn")
		if spawn and spawn:IsA("BasePart") and root then
			root.CFrame = spawn.CFrame + Vector3.new(0, 3, 0)
		end
	end
end

local function awardBadge(player: Player, badgeId: number)
	if not Config.isConfiguredId(badgeId) then
		return
	end
	pcall(function()
		BadgeService:AwardBadge(player.UserId, badgeId)
	end)
end

local function scoreContestant(c: Contestant, place: number)
	if c.isNpc or not c.player then
		return
	end
	local result = Scoring.breakdown(Balance, {
		looks = c.looks,
		rares = c.rares,
		pickups = c.pickups,
		distanceStuds = math.abs(c.distance),
		place = place,
		poseQuality01 = c.poseQuality,
		votesReceived = c.votesReceived,
		finished = c.finished,
	})
	DataService.addStylePoints(c.player, result.stylePoints)
	DataService.recordShow(c.player, result.total, c.rares, c.finished)
	if c.finished then
		awardBadge(c.player, Config.Badges.FirstWalk)
		awardBadge(c.player, Config.Badges.ShowComplete)
		local data = DataService.get(c.player)
		if data.streak.days >= Balance.retention.d7StreakDays then
			awardBadge(c.player, Config.Badges.SevenDayStreak)
		end
	end
	Remotes.event(Remotes.Events.PlayerData):FireClient(c.player, DataService.get(c.player))
	toast(
		c.player,
		string.format(
			"Show %d · +%d Style Points · %d votes%s",
			result.total,
			result.stylePoints,
			c.votesReceived,
			c.finished and " · FIRST WIN" or ""
		)
	)
	return result
end

local function startRun()
	local root = ArenaService.get()
	local startZ = root:GetAttribute("StartZ") :: number
	spawnPickups(root)
	finishOrder = {}
	for _, c in contestants do
		c.z = startZ
		c.alive = true
		c.finished = false
		c.looks = 0
		c.rares = 0
		c.pickups = 0
		c.distance = 0
		c.shield = timings().startShieldSeconds
		c.jumpT = 0
		c.slideT = 0
		c.place = 0
		c.poseQuality = 0.6
		c.votesReceived = 0
		c.votedFor = nil
		c.spectatingUserId = nil
		if c.isNpc then
			c.shield = 99
		end
		attachCharacter(c)
		placeCart(c)
		if c.player then
			Remotes.event(Remotes.Events.Tutorial):FireClient(c.player, {
				step = if tutorialRound then "run" else "live",
				hint = "Swipe / A-D lanes · W jump · S slide · collect neon looks",
			})
		end
	end
	setPhase(Config.Phases.Run, timings().runSeconds)
end

local function maybeCollect(c: Contestant)
	if not pickupFolder then
		return
	end
	for _, inst in pickupFolder:GetChildren() do
		if not inst:IsA("BasePart") then
			continue
		end
		if inst:GetAttribute("Collected") then
			continue
		end
		local lane = inst:GetAttribute("Lane")
		if lane ~= c.lane then
			continue
		end
		if math.abs(inst.Position.Z - c.z) > 3.2 then
			continue
		end
		if inst:GetAttribute("Obstacle") then
			if c.isNpc then
				continue
			end
			if c.shield > 0 or c.jumpT > 0 then
				continue
			end
			if c.slideT > 0 and inst.Name == "Paparazzi" then
				continue
			end
			if tutorialRound and c.lives > 0 then
				c.lives -= 1
				c.shield = 2
				toast(c.player, "Flash! Tutorial extra life")
				inst:SetAttribute("Collected", true)
				inst.Transparency = 1
			else
				c.alive = false
				toast(c.player, "Runway wipeout")
			end
			continue
		end
		inst:SetAttribute("Collected", true)
		inst.Transparency = 1
		c.looks += 1
		c.pickups += 1
		if inst:GetAttribute("Rare") then
			c.rares += 1
			local lookId = inst:GetAttribute("LookId")
			if type(lookId) == "string" and c.player then
				DataService.grantLook(c.player, lookId)
				LookVisuals.applyToPlayer(c.player, lookId)
			end
		end
	end
end

local function checkFinish(c: Contestant)
	local root = ArenaService.get()
	local finishZ = root:GetAttribute("FinishZ") :: number
	if c.z <= finishZ and c.alive and not c.finished then
		c.finished = true
		c.alive = false
		table.insert(finishOrder, c.userId)
		c.place = #finishOrder
		toast(c.player, "Finale — hold a pose!")
	end
end

local function tickRun(dt: number)
	for _, c in contestants do
		if not c.alive then
			continue
		end
		if c.shield > 0 then
			c.shield -= dt
		end
		if c.jumpT > 0 then
			c.jumpT -= dt
		end
		if c.slideT > 0 then
			c.slideT -= dt
		end
		c.z -= speed() * 8 * dt
		c.distance += speed() * 8 * dt
		maybeCollect(c)
		checkFinish(c)
		placeCart(c)
	end
end

local function allDone(): boolean
	for _, c in contestants do
		if c.alive then
			return false
		end
	end
	return true
end

local function beginScore()
	local place = 0
	for _, userId in finishOrder do
		place += 1
		local c = contestants[userId]
		if c then
			c.place = place
			scoreContestant(c, place)
		end
	end
	for _, c in contestants do
		if c.place == 0 then
			scoreContestant(c, #finishOrder + 1)
		end
	end
	setPhase(Config.Phases.Score, 6)
end

local function shouldDressOnTutorial(): boolean
	return RunService:IsStudio() and Config.StudioPlaytest.dressOnTutorial == true
end

local function nextPhaseIfDue()
	if remaining() > 0 then
		if phase == Config.Phases.Run and allDone() then
			setPhase(Config.Phases.Pose, timings().poseSeconds)
		end
		return
	end

	if phase == Config.Phases.Lobby then
		if humanCount() < Balance.match.minPlayers then
			phaseEndsAt = Workspace:GetServerTimeNow() + 4
			broadcast()
			return
		end
		if tutorialRound and not shouldDressOnTutorial() then
			setPhase(Config.Phases.Countdown, timings().countdownSeconds)
		else
			local dressSeconds = if tutorialRound
				then Config.StudioPlaytest.tutorialDressSeconds
				else Balance.normal.dressSeconds
			setPhase(Config.Phases.Dress, dressSeconds)
		end
	elseif phase == Config.Phases.Dress then
		setPhase(Config.Phases.Countdown, timings().countdownSeconds)
	elseif phase == Config.Phases.Countdown then
		startRun()
	elseif phase == Config.Phases.Run then
		setPhase(Config.Phases.Pose, timings().poseSeconds)
	elseif phase == Config.Phases.Pose then
		for _, c in contestants do
			if c.finished then
				c.poseQuality = math.clamp(0.55 + c.looks * 0.08, 0, 1)
			end
		end
		setPhase(Config.Phases.Vote, timings().voteSeconds)
	elseif phase == Config.Phases.Vote then
		beginScore()
	elseif phase == Config.Phases.Score then
		for _, c in contestants do
			releaseCharacter(c)
			c.wantsRematch = false
		end
		setPhase(Config.Phases.Intermission, Balance.normal.intermissionSeconds)
	elseif phase == Config.Phases.Intermission then
		local rematch = false
		for _, c in contestants do
			if c.wantsRematch then
				rematch = true
			end
		end
		tutorialRound = false
		if rematch then
			setPhase(Config.Phases.Lobby, 4)
		else
			setPhase(Config.Phases.Lobby, timings().lobbySeconds)
		end
	end
end

function RoundService.ensureStudioCast()
	if not StudioCastService.enabled() then
		return
	end
	if humanCount() >= 2 then
		return
	end
	for _, c in contestants do
		if c.isNpc then
			return
		end
	end
	local members = StudioCastService.spawn(ArenaService.get(), ArenaService.lobbyOrigin())
	for _, member in members do
		contestants[member.userId] = {
			userId = member.userId,
			name = member.name,
			player = nil,
			model = member.model,
			isNpc = true,
			lane = member.lane,
			z = 0,
			alive = false,
			lives = 0,
			looks = 0,
			rares = 0,
			pickups = 0,
			distance = 0,
			shield = 0,
			jumpT = 0,
			slideT = 0,
			cart = ensureCart(member.name),
			wantsRematch = false,
			spectatingUserId = nil,
			finished = false,
			place = 0,
			poseQuality = 0.5,
			votesReceived = 0,
			votedFor = nil,
		}
	end
	broadcast()
end

function RoundService.join(player: Player)
	if contestants[player.UserId] then
		broadcast()
		return
	end
	local cart = ensureCart(player.Name)
	local lives = if tutorialRound then timings().lives else 0
	contestants[player.UserId] = {
		userId = player.UserId,
		name = player.DisplayName,
		player = player,
		model = nil,
		isNpc = false,
		lane = 1,
		z = 0,
		alive = false,
		lives = lives,
		looks = 0,
		rares = 0,
		pickups = 0,
		distance = 0,
		shield = 0,
		jumpT = 0,
		slideT = 0,
		cart = cart,
		wantsRematch = false,
		spectatingUserId = nil,
		finished = false,
		place = 0,
		poseQuality = 0.5,
		votesReceived = 0,
		votedFor = nil,
	}
	local data = DataService.get(player)
	LookVisuals.applyToPlayer(player, data.equippedLookId)
	if phase == Config.Phases.Lobby and MonetizationService.skipsQueue(player) then
		phaseEndsAt = Workspace:GetServerTimeNow() + 1
		toast(player, "Fast Cast — walking on.")
	end
	RoundService.ensureStudioCast()
	broadcast()
end

function RoundService.leave(player: Player)
	local c = contestants[player.UserId]
	if not c then
		return
	end
	if c.cart then
		c.cart:Destroy()
	end
	contestants[player.UserId] = nil
	broadcast()
end

function RoundService.castVote(player: Player, targetUserId: number)
	if phase ~= Config.Phases.Vote then
		return
	end
	local voter = contestants[player.UserId]
	local target = contestants[targetUserId]
	if not voter or not target then
		return
	end
	if targetUserId == player.UserId then
		toast(player, "Vote for another model.")
		return
	end
	if voter.votedFor ~= nil then
		toast(player, "Already voted this show.")
		return
	end
	-- One vote each. VIP / Premium never add extra votes.
	voter.votedFor = targetUserId
	target.votesReceived += 1
	broadcast()
	toast(player, "Vote locked — skill & layering, not Robux.")
end

function RoundService.input(player: Player, action: string)
	local c = contestants[player.UserId]
	if not c then
		return
	end
	if action == "Rematch" then
		c.wantsRematch = true
		toast(player, "Rematch locked in")
		return
	end
	if action == "SpectateNext" then
		for userId, other in contestants do
			if userId ~= player.UserId and other.alive then
				c.spectatingUserId = userId
				broadcast()
				return
			end
		end
		return
	end
	if phase ~= Config.Phases.Run or not c.alive then
		return
	end
	if action == "Left" then
		c.lane = math.max(0, c.lane - 1)
	elseif action == "Right" then
		c.lane = math.min(2, c.lane + 1)
	elseif action == "Jump" then
		if c.jumpT <= 0 and c.slideT <= 0 then
			c.jumpT = Balance.movement.jumpSeconds
		end
	elseif action == "Slide" then
		if c.jumpT <= 0 and c.slideT <= 0 then
			c.slideT = Balance.movement.slideSeconds
		end
	end
end

function RoundService.bind()
	roundId = 1
	tutorialRound = true
	setPhase(Config.Phases.Lobby, Balance.tutorial.lobbySeconds)

	Remotes.event(Remotes.Events.RequestJoin).OnServerEvent:Connect(function(player)
		RoundService.join(player)
	end)
	Remotes.event(Remotes.Events.RequestRematch).OnServerEvent:Connect(function(player)
		RoundService.input(player, "Rematch")
	end)
	Remotes.event(Remotes.Events.RequestSpectate).OnServerEvent:Connect(function(player)
		RoundService.input(player, "SpectateNext")
	end)
	Remotes.event(Remotes.Events.RequestVote).OnServerEvent:Connect(function(player, targetUserId)
		if type(targetUserId) ~= "number" then
			return
		end
		RoundService.castVote(player, targetUserId)
	end)
	Remotes.event(Remotes.Events.Input).OnServerEvent:Connect(function(player, action)
		if type(action) ~= "string" then
			return
		end
		RoundService.input(player, action)
	end)
	Remotes.event(Remotes.Events.RequestEquipLook).OnServerEvent:Connect(function(player, lookId)
		if type(lookId) ~= "string" then
			return
		end
		if DataService.equipLook(player, lookId) then
			LookVisuals.applyToPlayer(player, lookId)
			Remotes.event(Remotes.Events.PlayerData):FireClient(player, DataService.get(player))
			toast(player, "Wearing " .. lookId)
		else
			toast(player, "Own that look first.")
		end
	end)
	Remotes.event(Remotes.Events.RequestBuyLook).OnServerEvent:Connect(function(player, lookId)
		if type(lookId) ~= "string" then
			return
		end
		local ok, msg = DataService.buyLookWithStylePoints(player, lookId)
		toast(player, msg)
		if ok then
			DataService.equipLook(player, lookId)
			LookVisuals.applyToPlayer(player, lookId)
			Remotes.event(Remotes.Events.PlayerData):FireClient(player, DataService.get(player))
		end
	end)

	Players.PlayerRemoving:Connect(function(player)
		RoundService.leave(player)
	end)

	heartbeatConn = RunService.Heartbeat:Connect(function(dt)
		if phase == Config.Phases.Run then
			tickRun(dt)
		end
		nextPhaseIfDue()
	end)
	heartbeatConn = heartbeatConn
end

function RoundService.getPhase(): string
	return phase
end

return RoundService
