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
	swayT: number?,
	npcStyle: string?,
	cart: BasePart,
	wantsRematch: boolean,
	spectatingUserId: number?,
	finished: boolean,
	place: number,
	poseQuality: number,
	votesReceived: number,
	votedFor: number?,
	boarded: boolean,
	boardDelay: number,
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
local boardingStarted = false

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

-- Airport rush: moving-walkway strips that carry contestants faster.
local travelatorZones: { { zTop: number, zBottom: number } } = {}

local function onTravelator(z: number): boolean
	for _, zone in travelatorZones do
		if z <= zone.zTop and z >= zone.zBottom then
			return true
		end
	end
	return false
end

local function equippedSpeedBoost(c: Contestant): number
	if c.isNpc or not c.player then
		return 0
	end
	local data = DataService.get(c.player)
	local look = Catalog.getLook(data.equippedLookId)
	if look and type(look.speedBoost) == "number" then
		return look.speedBoost
	end
	return 0
end

local function contestantSpeed(c: Contestant): number
	local base = if tutorialRound then Balance.movement.tutorialSpeed else Balance.movement.normalSpeed
	local mult = 1 + equippedSpeedBoost(c)
	if onTravelator(c.z) then
		mult *= 1.6
	end
	return base * mult
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
		boarding = boardingStarted,
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

local function buildTravelator(root: Instance)
	travelatorZones = {}
	local startZ = root:GetAttribute("StartZ") :: number
	local finishZ = root:GetAttribute("FinishZ") :: number
	local spans = { { 0.18, 0.38 }, { 0.58, 0.78 } }
	for _, span in spans do
		local zTop = startZ + (finishZ - startZ) * span[1]
		local zBottom = startZ + (finishZ - startZ) * span[2]
		table.insert(travelatorZones, { zTop = zTop, zBottom = zBottom })
		local midZ = (zTop + zBottom) / 2
		local len = math.abs(zTop - zBottom)
		local strip = Instance.new("Part")
		strip.Name = "Travelator"
		strip.Size = Vector3.new(13, 0.2, len)
		strip.Anchored = true
		strip.CanCollide = false
		strip.Transparency = 0.45
		strip.Material = Enum.Material.Neon
		strip.Color = Color3.fromRGB(64, 200, 255)
		strip.Position = Vector3.new(ArenaService.laneX(1), 2.05, midZ)
		strip.Parent = pickupFolder
		-- Chevron slats pointing toward the gate.
		for i = 1, 5 do
			local cz = zTop - (i - 0.5) * (len / 5)
			for _, sx in { -1, 1 } do
				local slat = Instance.new("Part")
				slat.Name = "Chevron"
				slat.Size = Vector3.new(3.2, 0.25, 1.1)
				slat.Anchored = true
				slat.CanCollide = false
				slat.Material = Enum.Material.Neon
				slat.Color = Color3.fromRGB(235, 250, 255)
				slat.CFrame = CFrame.new(ArenaService.laneX(1) + sx * 1.7, 2.2, cz)
					* CFrame.Angles(0, sx * 0.5, 0)
				slat.Parent = pickupFolder
			end
		end
		local sign = Instance.new("Part")
		sign.Name = "TravelatorSign"
		sign.Size = Vector3.new(6, 1, 0.5)
		sign.Anchored = true
		sign.CanCollide = false
		sign.Transparency = 1
		sign.Position = Vector3.new(ArenaService.laneX(1), 7.5, zTop + 2)
		sign.Parent = pickupFolder
		local gui = Instance.new("BillboardGui")
		gui.Size = UDim2.fromOffset(130, 26)
		gui.AlwaysOnTop = false
		gui.Adornee = sign
		gui.Parent = sign
		local label = Instance.new("TextLabel")
		label.Size = UDim2.fromScale(1, 1)
		label.BackgroundTransparency = 1
		label.Font = Enum.Font.GothamBold
		label.TextScaled = true
		label.TextColor3 = Color3.fromRGB(160, 230, 255)
		label.Text = "TRAVELATOR →"
		label.Parent = gui
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

local function boardContestant(c: Contestant)
	if c.boarded or not c.alive then
		return
	end
	local root = ArenaService.get()
	local startZ = root:GetAttribute("StartZ") :: number
	c.boarded = true
	c.z = startZ
	c.shield = timings().startShieldSeconds
	attachCharacter(c)
	placeCart(c)
	if c.player then
		toast(c.player, "You're boarded! Catch that flight!")
	end
	if not boardingStarted then
		boardingStarted = true
		phaseEndsAt = Workspace:GetServerTimeNow() + timings().boardingSeconds
		broadcast()
		for _, other in contestants do
			if other.player then
				toast(other.player, "✈ Boarding — flight leaves soon!")
			end
		end
	end
end

local function bindBoardingTrigger()
	local root = ArenaService.get()
	local trigger = root:FindFirstChild("BoardingTrigger", true)
	if not trigger or not trigger:IsA("BasePart") then
		return
	end
	trigger.Touched:Connect(function(hit)
		if phase ~= Config.Phases.Run then
			return
		end
		local character = hit:FindFirstAncestorOfClass("Model")
		local player = if character then Players:GetPlayerFromCharacter(character) else nil
		if not player then
			return
		end
		local c = contestants[player.UserId]
		if c and not c.boarded and c.alive then
			boardContestant(c)
		end
	end)
end

-- Terminal power-walkway: 1.6x WalkSpeed while riding the mall belt.
local terminalBoosted: { [number]: boolean } = {}

local function bindTerminalTravelator()
	local root = ArenaService.get()
	for _, strip in ipairs(root:GetDescendants()) do
		if strip:IsA("BasePart") and strip.Name == "TerminalTravelator" then
			strip.Touched:Connect(function(hit)
				local character = hit:FindFirstAncestorOfClass("Model")
				local player = if character then Players:GetPlayerFromCharacter(character) else nil
				local humanoid = if character then character:FindFirstChildOfClass("Humanoid") else nil
				if player and humanoid and humanoid.WalkSpeed == 16 then
					humanoid.WalkSpeed = 26
					terminalBoosted[player.UserId] = true
				end
			end)
			strip.TouchEnded:Connect(function(hit)
				local character = hit:FindFirstAncestorOfClass("Model")
				local player = if character then Players:GetPlayerFromCharacter(character) else nil
				local humanoid = if character then character:FindFirstChildOfClass("Humanoid") else nil
				if player and humanoid and terminalBoosted[player.UserId] and humanoid.WalkSpeed == 26 then
					humanoid.WalkSpeed = 16
				end
				if player then
					terminalBoosted[player.UserId] = nil
				end
			end)
		end
	end
end

-- Reaching the aircraft door: one-time style bonus per round.
local planeDoorClaimed: { [number]: boolean } = {}

local function bindPlaneDoor()
	local root = ArenaService.get()
	for _, door in ipairs(root:GetDescendants()) do
		if door:IsA("BasePart") and door.Name == "PlaneDoor" then
			door.Touched:Connect(function(hit)
				if phase ~= Config.Phases.Run then
					return
				end
				local character = hit:FindFirstAncestorOfClass("Model")
				local player = if character then Players:GetPlayerFromCharacter(character) else nil
				if not player or planeDoorClaimed[player.UserId] then
					return
				end
				local c = contestants[player.UserId]
				if c and c.boarded then
					return
				end
				planeDoorClaimed[player.UserId] = true
				DataService.addStylePoints(player, 25)
				toast(player, "You reached your aircraft! +25 Style Points")
			end)
		end
	end
end

-- Instant-equip pickups: touch a gold orb to wear the look immediately.
local function equipDisplayName(lookId: string): string
	local look = Catalog.getLook(lookId)
	if look and type(look.name) == "string" then
		return look.name :: string
	end
	return lookId
end

local function bindSingleEquipPickup(orb: BasePart)
	orb.Touched:Connect(function(hit)
		if orb:GetAttribute("Collected") then
			return
		end
		local character = hit:FindFirstAncestorOfClass("Model")
		local player = if character then Players:GetPlayerFromCharacter(character) else nil
		if not player then
			return
		end
		local lookId = orb:GetAttribute("LookId")
		if type(lookId) ~= "string" then
			return
		end
		orb:SetAttribute("Collected", true)
		DataService.grantLook(player, lookId)
		if DataService.equipLook(player, lookId) then
			LookVisuals.applyToPlayer(player, lookId)
			Remotes.event(Remotes.Events.PlayerData):FireClient(player, DataService.get(player))
			toast(player, "Wearing " .. equipDisplayName(lookId))
		end
		orb.Transparency = 1
	end)
end

local function bindEquipPickups()
	local root = ArenaService.get()
	root.DescendantAdded:Connect(function(inst)
		if inst:IsA("BasePart") and inst.Name == "EquipPickup" then
			bindSingleEquipPickup(inst)
		end
	end)
	for _, inst in ipairs(root:GetDescendants()) do
		if inst:IsA("BasePart") and inst.Name == "EquipPickup" then
			bindSingleEquipPickup(inst)
		end
	end
end

-- VELOCE Cabin Roller: touch to ride at 2x speed for 60 seconds.
local veloceActive: { [number]: boolean } = {}

local function bindSingleVeloce(roller: BasePart)
	roller.Touched:Connect(function(hit)
		if roller:GetAttribute("Collected") then
			return
		end
		local character = hit:FindFirstAncestorOfClass("Model")
		local player = if character then Players:GetPlayerFromCharacter(character) else nil
		if not player then
			return
		end
		if veloceActive[player.UserId] then
			return
		end
		local humanoid = if character then character:FindFirstChildOfClass("Humanoid") else nil
		if not humanoid then
			return
		end
		roller:SetAttribute("Collected", true)
		roller.Transparency = 1
		veloceActive[player.UserId] = true
		humanoid.WalkSpeed = 32
		toast(player, "VELOCE Roller — 60s first-class speed!")
		task.delay(60, function()
			veloceActive[player.UserId] = nil
			local char = player.Character
			local hum = if char then char:FindFirstChildOfClass("Humanoid") else nil
			if hum then
				hum.WalkSpeed = 16
			end
		end)
	end)
end

local function bindVeloceRoller()
	local root = ArenaService.get()
	root.DescendantAdded:Connect(function(inst)
		if inst:IsA("BasePart") and inst.Name == "VeloceRoller" then
			bindSingleVeloce(inst)
		end
	end)
	for _, inst in ipairs(root:GetDescendants()) do
		if inst:IsA("BasePart") and inst.Name == "VeloceRoller" then
			bindSingleVeloce(inst)
		end
	end
end

-- Ambient life: the terminal feels alive in every phase.
local ambientParts = nil
local ambientT = 0
local boardT = 0
local boardIdx = 1
local boardTexts = {
	"RR 27   NEW YORK      BOARDING\nRR 114  DENVER        ON TIME\nRR 208  CHICAGO       ON TIME\nRR 312  DALLAS        DELAYED\nRR 425  LOS ANGELES   BOARDING",
	"RR 118  MIAMI         ON TIME\nRR 27   NEW YORK      BOARDING\nRR 330  SEATTLE       ON TIME\nRR 114  DENVER        BOARDING\nRR 512  PHOENIX       ON TIME",
	"RR 208  CHICAGO       BOARDING\nRR 425  LOS ANGELES   ON TIME\nRR 312  DALLAS        BOARDING\nRR 118  MIAMI         DELAYED\nRR 27   NEW YORK      DEPARTED",
}

local function scanAmbient()
	local root = ArenaService.get()
	local ap = { liftCabs = {}, chevrons = {}, agentParts = {}, boards = {} }
	local agentIdx = 0
	for _, folder in ipairs(root:GetDescendants()) do
		if folder:IsA("Folder") and folder.Name == "Agent" then
			agentIdx += 1
			for _, q in ipairs(folder:GetDescendants()) do
				if q:IsA("BasePart") then
					table.insert(ap.agentParts, { part = q, baseY = q.Position.Y, phase = agentIdx * 1.7 })
				end
			end
		end
	end
	for _, d in ipairs(root:GetDescendants()) do
		if d:IsA("BasePart") then
			if d.Name == "LiftCab" then
				table.insert(ap.liftCabs, d)
			elseif d.Name == "BeltChevron" then
				table.insert(ap.chevrons, { part = d, base = d.CFrame, offset = 0 })
			end
		elseif d:IsA("TextLabel") and d.Parent and d.Parent.Name == "BoardSign" then
			table.insert(ap.boards, d)
		end
	end
	ambientParts = ap
end

local function tickAmbient(dt: number)
	if not ambientParts then
		scanAmbient()
	end
	local ap = ambientParts
	if not ap then
		return
	end
	ambientT += dt
	local t = ambientT
	for _, cab in ap.liftCabs do
		cab.Position = Vector3.new(cab.Position.X, 6.4 + 3.0 * math.sin(t * 0.7), cab.Position.Z)
	end
	for _, c in ap.chevrons do
		c.offset += 10 * dt
		if c.offset >= 30 then
			c.offset -= 30
		end
		local bp = c.base.Position
		local rot = c.base - c.base.Position
		c.part.CFrame = CFrame.new(bp.X, bp.Y, bp.Z - c.offset) * rot
	end
	for _, a in ap.agentParts do
		a.part.Position = Vector3.new(a.part.Position.X, a.baseY + 0.12 * math.sin(t * 2.2 + a.phase), a.part.Position.Z)
	end
	boardT += dt
	if boardT >= 4 then
		boardT = 0
		boardIdx = boardIdx % #boardTexts + 1
		for _, label in ap.boards do
			label.Text = boardTexts[boardIdx]
		end
	end
end

local function startRun()
	local root = ArenaService.get()
	local startZ = root:GetAttribute("StartZ") :: number
	spawnPickups(root)
	finishOrder = {}
	planeDoorClaimed = {}
	veloceActive = {}
	boardingStarted = false
	local origin = ArenaService.lobbyOrigin()
	local i = 0
	for _, c in contestants do
		i += 1
		c.z = startZ
		c.alive = true
		c.boarded = false
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
			-- NPCs wait at the walkway start, then "walk the terminal".
			c.boardDelay = 3 + math.random() * 10
			placeCart(c)
		elseif c.player then
			-- Everyone starts the terminal journey at Arrivals, on foot.
			releaseCharacter(c)
			local character = c.player.Character
			if character then
				character:PivotTo(origin * CFrame.new((i % 4 - 1.5) * 4, 0, 0))
			end
			Remotes.event(Remotes.Events.Tutorial):FireClient(c.player, {
				step = if tutorialRound then "run" else "live",
				hint = "Walk the terminal — shops are open! Cross the gates to board your flight",
			})
		end
	end
	for _, c in contestants do
		if c.player then
			toast(c.player, "✈ Head to your gate — the flight won't wait!")
		end
	end
	setPhase(Config.Phases.Run, timings().terminalSeconds)
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
			if c.slideT > 0 and (inst.Name == "Paparazzi" or inst.Name == "Luggage") then
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
		if c.player then
			DataService.addStylePoints(c.player, 50)
			toast(c.player, "Made the flight! +50 Style Points ✈ Hold a pose!")
		else
			toast(c.player, "Finale — hold a pose!")
		end
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
	local looks = { "nightfall-tee", "crest-polo", "concrete-tee", "nightfall-boots", "oblique-coin-belt" }
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
		-- Camera rig on top with a flash bulb that fires as a warning.
		local cam = Instance.new("Part")
		cam.Name = "Camera"
		cam.Size = Vector3.new(1.3, 0.9, 1.7)
		cam.Anchored = true
		cam.CanCollide = false
		cam.Color = Color3.fromRGB(12, 12, 16)
		cam.Position = barrier.Position + Vector3.new(0, 2.7, 0)
		cam.Parent = barrier
		local lens = Instance.new("Part")
		lens.Name = "Lens"
		lens.Shape = Enum.PartType.Cylinder
		lens.Size = Vector3.new(0.7, 0.7, 0.7)
		lens.Anchored = true
		lens.CanCollide = false
		lens.Color = Color3.fromRGB(150, 200, 255)
		lens.Material = Enum.Material.Neon
		lens.CFrame = cam.CFrame * CFrame.new(0, 0, -1.1) * CFrame.Angles(0, 0, math.pi / 2)
		lens.Parent = barrier
		local bulb = Instance.new("PointLight")
		bulb.Name = "FlashBulb"
		bulb.Enabled = false
		bulb.Brightness = 6
		bulb.Range = 22
		bulb.Color = Color3.fromRGB(255, 255, 255)
		bulb.Parent = cam
	end

	for i = 1, 4 do
		local z = startZ + (finishZ - startZ) * ((i + 0.25) / 6)
		local lane = (i * 2) % 3
		local lug = Instance.new("Part")
		lug.Name = "Luggage"
		lug.Size = Vector3.new(3, 2, 1.4)
		lug.Anchored = true
		lug.CanCollide = false
		lug.Color = Color3.fromRGB(122, 72, 40)
		lug.Material = Enum.Material.Fabric
		lug.Position = Vector3.new(ArenaService.laneX(lane), 2.6, z)
		lug:SetAttribute("Obstacle", true)
		lug:SetAttribute("Lane", lane)
		lug.Parent = folder
		local strap = Instance.new("Part")
		strap.Name = "Strap"
		strap.Size = Vector3.new(3.1, 0.35, 1.5)
		strap.Anchored = true
		strap.CanCollide = false
		strap.Color = Color3.fromRGB(201, 165, 106)
		strap.Material = Enum.Material.Neon
		strap.Position = lug.Position
		strap.Parent = folder
	end
	-- Instant-equip fashion pickups: touch to wear the look right away.
	local equipLooks: { { any } } = {
		{ "nightfall-first-bomber", 55 }, { "crest-tail-scarf", 38 },
		{ "silk-jet-sneakers", 22 }, { "silk-atelier-shades", 6 },
		{ "oblique-coin-belt", -10 }, { "crest-cloud-knit", -26 },
	}
	for i, entry in ipairs(equipLooks) do
		local lookId = entry[1] :: string
		local z = entry[2] :: number
		local px = ArenaService.laneX((i - 1) % 3)
		local ped = Instance.new("Part")
		ped.Name = "EquipPedestal"
		ped.Size = Vector3.new(2, 1.6, 2)
		ped.Anchored = true
		ped.CanCollide = false
		ped.Material = Enum.Material.Marble
		ped.Color = Color3.fromRGB(225, 220, 210)
		ped.Position = Vector3.new(px, 1.8, z)
		ped.Parent = folder
		local orb = Instance.new("Part")
		orb.Name = "EquipPickup"
		orb.Shape = Enum.PartType.Ball
		orb.Size = Vector3.new(2.4, 2.4, 2.4)
		orb.Anchored = true
		orb.CanCollide = false
		orb.Material = Enum.Material.Neon
		orb.Color = Color3.fromRGB(244, 196, 48)
		orb.Position = ped.Position + Vector3.new(0, 2.6, 0)
		orb:SetAttribute("LookId", lookId)
		orb.Parent = folder
	end

	-- VELOCE Cabin Roller: ride it for 60s of first-class speed.
	for _, vz in ipairs({ 30, -5 }) do
		local case = Instance.new("Part")
		case.Name = "VeloceRoller"
		case.Size = Vector3.new(1.6, 2.2, 1)
		case.Anchored = true
		case.CanCollide = false
		case.Material = Enum.Material.SmoothPlastic
		case.Color = Color3.fromRGB(212, 175, 105)
		case.Position = Vector3.new(0, 2.4, vz)
		case.Parent = folder
		local trim = Instance.new("Part")
		trim.Name = "VeloceTrim"
		trim.Size = Vector3.new(1.7, 0.3, 1.1)
		trim.Anchored = true
		trim.CanCollide = false
		trim.Material = Enum.Material.Neon
		trim.Color = Color3.fromRGB(255, 250, 240)
		trim.Position = case.Position + Vector3.new(0, 0.4, 0)
		trim.Parent = folder
		local handle = Instance.new("Part")
		handle.Name = "VeloceHandle"
		handle.Size = Vector3.new(0.25, 1.6, 0.25)
		handle.Anchored = true
		handle.CanCollide = false
		handle.Color = Color3.fromRGB(60, 60, 66)
		handle.Position = case.Position + Vector3.new(0, 1.9, 0)
		handle.Parent = folder
		for _, wx in ipairs({ -0.5, 0.5 }) do
			local wheel = Instance.new("Part")
			wheel.Name = "VeloceWheel"
			wheel.Shape = Enum.PartType.Ball
			wheel.Size = Vector3.new(0.6, 0.6, 0.6)
			wheel.Anchored = true
			wheel.CanCollide = false
			wheel.Color = Color3.fromRGB(25, 25, 28)
			wheel.Position = case.Position + Vector3.new(wx, -1.2, 0)
			wheel.Parent = folder
		end
		local vsign = Instance.new("Part")
		vsign.Name = "VeloceSign"
		vsign.Size = Vector3.new(2, 1, 0.3)
		vsign.Anchored = true
		vsign.CanCollide = false
		vsign.Transparency = 1
		vsign.Position = case.Position + Vector3.new(0, 3.6, 0)
		vsign.Parent = folder
		local gui = Instance.new("BillboardGui")
		gui.Size = UDim2.fromOffset(120, 24)
		gui.AlwaysOnTop = false
		gui.Adornee = vsign
		gui.Parent = vsign
		local label = Instance.new("TextLabel")
		label.Size = UDim2.fromScale(1, 1)
		label.BackgroundTransparency = 1
		label.Font = Enum.Font.GothamBold
		label.TextScaled = true
		label.TextColor3 = Color3.fromRGB(212, 175, 105)
		label.Text = "VELOCE"
		label.Parent = gui
	end
	buildTravelator(root)
end


local function paparazziFlash()
	if not pickupFolder then
		return
	end
	local now = os.clock()
	for _, inst in pickupFolder:GetChildren() do
		if not inst:IsA("BasePart") then
			continue
		end
		if inst.Name ~= "Paparazzi" then
			continue
		end
		local last = inst:GetAttribute("FlashAt") or 0
		if now - last < 2.5 then
			continue
		end
		for _, c in contestants do
			if not c.alive or c.isNpc then
				continue
			end
			if inst:GetAttribute("Lane") ~= c.lane then
				continue
			end
			local dz = c.z - inst.Position.Z
			if dz > 0 and dz < 26 then
				inst:SetAttribute("FlashAt", now)
				local cam = inst:FindFirstChild("Camera")
				local bulb = if cam then cam:FindFirstChild("FlashBulb") else nil
				if bulb and bulb:IsA("PointLight") then
					bulb.Enabled = true
					task.delay(0.22, function()
						bulb.Enabled = false
					end)
				end
				break
			end
		end
	end
end

-- Procedural walk styles: Sashay, Power Walk, Model Walk.
local WALK_STYLES = {
	model = { swayAmp = 0.22, swayHz = 2.2, bobAmp = 0.05, armAmp = 0.35, armHz = 2.2, lean = 0 },
	sashay = { swayAmp = 0.32, swayHz = 2.8, bobAmp = 0.14, armAmp = 0.5, armHz = 2.8, lean = -0.04 },
	power = { swayAmp = 0.08, swayHz = 3.4, bobAmp = 0.03, armAmp = 0.62, armHz = 3.4, lean = 0.1 },
}

local function applyWalkStyle(c: Contestant, dt: number)
	local model = c.model
	if not model then
		return
	end
	local styleId = "model"
	if c.player and not c.isNpc then
		styleId = DataService.get(c.player).walkStyle or "model"
	elseif c.isNpc then
		styleId = c.npcStyle or "model"
	end
	local st = WALK_STYLES[styleId] or WALK_STYLES.model
	c.swayT = (c.swayT or 0) + dt
	local t = c.swayT :: number
	local upper = model:FindFirstChild("UpperTorso")
	if not upper then
		return
	end
	local waist = upper:FindFirstChild("Waist")
	if waist and waist:IsA("Motor6D") then
		waist.Transform = CFrame.new(0, math.abs(math.sin(t * st.swayHz)) * st.bobAmp, 0)
			* CFrame.Angles(st.lean, 0, math.sin(t * st.swayHz) * st.swayAmp)
	end
	for _, side in { "Left", "Right" } do
		local shoulder = upper:FindFirstChild(side .. "Shoulder")
		if shoulder and shoulder:IsA("Motor6D") then
			local phase = if side == "Left" then 0 else math.pi
			shoulder.Transform = CFrame.Angles(math.sin(t * st.armHz + phase) * st.armAmp, 0, 0)
		end
	end
end

local function tickRun(dt: number)
	for _, c in contestants do
		if not c.alive then
			continue
		end
		if not c.boarded then
			-- Terminal stage: humans walk the terminal on foot; NPCs
			-- board on a timer that simulates the walk.
			if c.isNpc then
				c.boardDelay -= dt
				if c.boardDelay <= 0 then
					boardContestant(c)
				end
			end
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
		c.z -= contestantSpeed(c) * 8 * dt
		c.distance += contestantSpeed(c) * 8 * dt
		maybeCollect(c)
		checkFinish(c)
		placeCart(c)
		applyWalkStyle(c, dt)
	end
	paparazziFlash()
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
			npcStyle = ({ "model", "sashay", "power" })[math.random(1, 3)],
			cart = ensureCart(member.name),
			wantsRematch = false,
			spectatingUserId = nil,
			finished = false,
			place = 0,
			poseQuality = 0.5,
			votesReceived = 0,
			votedFor = nil,
			boarded = false,
			boardDelay = 5,
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
		boarded = false,
		boardDelay = 5,
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
	bindBoardingTrigger()
	bindTerminalTravelator()
	bindPlaneDoor()
	bindEquipPickups()
	bindVeloceRoller()

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
	Remotes.event(Remotes.Events.RequestWalkStyle).OnServerEvent:Connect(function(player, style)
		if type(style) ~= "string" then
			return
		end
		if DataService.setWalkStyle(player, style) then
			Remotes.event(Remotes.Events.PlayerData):FireClient(player, DataService.get(player))
			toast(player, "Walk style: " .. style)
		end
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
		tickAmbient(dt)
		nextPhaseIfDue()
	end)
	heartbeatConn = heartbeatConn
end

function RoundService.getPhase(): string
	return phase
end

return RoundService
