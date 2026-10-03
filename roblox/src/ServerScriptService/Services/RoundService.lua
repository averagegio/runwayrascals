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
	s: number,
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

-- ONE route: the cart race follows this waypoint polyline (x, z) from the
-- boarding arch, down the runway, through the curve and neon tube tunnel,
-- to Gate 27. s = distance travelled along the route in studs.
local ROUTE = {
	Vector3.new(0, 0, -40),
	Vector3.new(0, 0, -125),
	Vector3.new(1.46, 0, -140.85),
	Vector3.new(5.76, 0, -154.09),
	Vector3.new(12.72, 0, -166.15),
	Vector3.new(22.03, 0, -176.50),
	Vector3.new(27.24, 0, -181.18),
	Vector3.new(44.56, 0, -191.18),
	Vector3.new(61.88, 0, -201.18),
	Vector3.new(62, 0, -210),
}
local routeCum = { 0 } -- cumulative segment lengths
local routeTotal = 0
for i = 2, #ROUTE do
	routeTotal += (ROUTE[i] - ROUTE[i - 1]).Magnitude
	routeCum[i] = routeTotal
end
local function routePoint(s: number): (Vector3, Vector3)
	s = math.clamp(s, 0, routeTotal)
	local i = 1
	while i < #ROUTE and routeCum[i + 1] < s do
		i += 1
	end
	local a, b = ROUTE[i], ROUTE[i + 1]
	local segLen = (b - a).Magnitude
	local t = if segLen > 0 then (s - routeCum[i]) / segLen else 0
	local pos = a:Lerp(b, t)
	local dir = if segLen > 0 then (b - a).Unit else Vector3.new(0, 0, -1)
	return pos, dir
end

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
	local spans = { { 0.02, 0.2 }, { 0.3, 0.5 } }
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
	local pos, dir = routePoint(c.s)
	local perp = Vector3.new(-dir.Z, 0, dir.X)
	local p = pos + perp * ArenaService.laneX(c.lane)
	c.cart.CFrame = CFrame.lookAt(Vector3.new(p.X, y, p.Z), Vector3.new(p.X, y, p.Z) + dir)
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

-- Suitcase Rush: remove the event suitcase and pay the packing bonus once.
local function settleSuitcase(c: Contestant)
	local player = c.player
	local char = if player then player.Character else c.model
	if char then
		local mini = char:FindFirstChild("EventSuitcase")
		if mini then
			mini:Destroy()
		end
	end
	if player and not player:GetAttribute("SuitcaseBonusPaid") then
		player:SetAttribute("SuitcaseBonusPaid", true)
		local raw = player:GetAttribute("SuitcaseRares")
		local n = if type(raw) == "number" then raw else 0
		if n > 0 then
			DataService.addStylePoints(player, n * 60)
			toast(player, "Suitcase bonus +" .. (n * 60) .. " Style Points")
		end
	end
end

local function boardContestant(c: Contestant)
	if c.boarded or not c.alive then
		return
	end
	local root = ArenaService.get()
	c.s = 0
	local rp = routePoint(c.s)
	c.z = rp.Z
	c.boarded = true
	-- Drop any VELOCE roller tool so the cart race looks clean.
	local rider = c.player and c.player.Character or c.model
	if rider then
		local oldTool = rider:FindFirstChild("VELOCE Roller")
		if oldTool then
			oldTool:Destroy()
		end
	end
	if c.player then
		local oldPack = c.player.Backpack:FindFirstChild("VELOCE Roller")
		if oldPack then
			oldPack:Destroy()
		end
		c.player:SetAttribute("HasVeloce", nil)
	end
	-- Suitcase Rush settles when you board: bonus paid, suitcase off.
	settleSuitcase(c)
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

-- VELOCE Cabin Roller: touch a display case to equip a rolling suitcase Tool.
-- While the roller is held out, you roll at 2x speed for 60 seconds.
local veloceActive: { [number]: boolean } = {}

local function makeVeloceTool(): Tool
	local tool = Instance.new("Tool")
	tool.Name = "VELOCE Roller"
	tool.RequiresHandle = true
	tool.CanBeDropped = false
	tool.GripForward = Vector3.new(0, 0, 1)
	tool.GripPos = Vector3.new(0, -0.9, 0)
	local silver = Color3.fromRGB(200, 205, 215)
	local groove = Color3.fromRGB(140, 145, 155)
	local dark = Color3.fromRGB(30, 30, 34)
	local handle = Instance.new("Part")
	handle.Name = "Handle"
	handle.Size = Vector3.new(1.1, 1.5, 0.7)
	handle.Color = silver
	handle.Material = Enum.Material.SmoothPlastic
	handle.CanCollide = false
	handle.TopSurface = Enum.SurfaceType.Smooth
	handle.BottomSurface = Enum.SurfaceType.Smooth
	handle.Parent = tool
	for _, gy in ipairs({ -0.35, 0.35 }) do
		local strip = Instance.new("Part")
		strip.Name = "Groove"
		strip.Size = Vector3.new(1.15, 0.1, 0.75)
		strip.Color = groove
		strip.Material = Enum.Material.SmoothPlastic
		strip.CanCollide = false
		strip.TopSurface = Enum.SurfaceType.Smooth
		strip.BottomSurface = Enum.SurfaceType.Smooth
		strip.CFrame = CFrame.new(0, gy, 0)
		strip.Parent = tool
		local w = Instance.new("WeldConstraint")
		w.Part0 = handle
		w.Part1 = strip
		w.Parent = handle
	end
	local grip = Instance.new("Part")
	grip.Name = "GripBar"
	grip.Size = Vector3.new(0.7, 0.12, 0.12)
	grip.Color = dark
	grip.Material = Enum.Material.Metal
	grip.CanCollide = false
	grip.TopSurface = Enum.SurfaceType.Smooth
	grip.BottomSurface = Enum.SurfaceType.Smooth
	grip.CFrame = CFrame.new(0, 1.05, 0)
	grip.Parent = tool
	local w2 = Instance.new("WeldConstraint")
	w2.Part0 = handle
	w2.Part1 = grip
	w2.Parent = handle
	return tool
end

local function bindSingleVeloce(roller: BasePart)
	roller.Touched:Connect(function(hit)
		local character = hit:FindFirstAncestorOfClass("Model")
		local player = if character then Players:GetPlayerFromCharacter(character) else nil
		if not player then
			return
		end
		if player:GetAttribute("HasVeloce") then
			return
		end
		local humanoid = if character then character:FindFirstChildOfClass("Humanoid") else nil
		if not humanoid then
			return
		end
		player:SetAttribute("HasVeloce", true)
		veloceActive[player.UserId] = true
		local tool = makeVeloceTool()
		tool.Equipped:Connect(function()
			local char = player.Character
			local hum = if char then char:FindFirstChildOfClass("Humanoid") else nil
			if hum then
				hum.WalkSpeed = 32
			end
		end)
		tool.Unequipped:Connect(function()
			local char = player.Character
			local hum = if char then char:FindFirstChildOfClass("Humanoid") else nil
			if hum and hum.WalkSpeed == 32 then
				hum.WalkSpeed = 16
			end
		end)
		tool.Parent = player.Backpack
		humanoid:EquipTool(tool)
		toast(player, "VELOCE Roller equipped — rolling at 2x speed for 60s!")
		task.delay(60, function()
			veloceActive[player.UserId] = nil
			player:SetAttribute("HasVeloce", nil)
			local pack = player.Backpack:FindFirstChild("VELOCE Roller")
			if pack then
				pack:Destroy()
			end
			local char = player.Character
			if char then
				local held = char:FindFirstChild("VELOCE Roller")
				if held then
					held:Destroy()
				end
			end
			local hum = if char then char:FindFirstChildOfClass("Humanoid") else nil
			if hum and hum.WalkSpeed == 32 then
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

-- Suitcase Rush: touch a purple orb to pack the rare look into your suitcase.
local function bindSingleRarePickup(orb: BasePart)
	orb.Touched:Connect(function(hit)
		if phase ~= Config.Phases.Run then
			return
		end
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
		local raw = player:GetAttribute("SuitcaseRares")
		local n = (if type(raw) == "number" then raw else 0) + 1
		player:SetAttribute("SuitcaseRares", n)
		orb.Transparency = 1
		for _, child in ipairs(orb:GetChildren()) do
			if child:IsA("PointLight") then
				child.Enabled = false
			end
		end
		toast(player, "Packed " .. equipDisplayName(lookId) .. " (" .. n .. "/8)")
	end)
end

local function bindRarePickups()
	local root = ArenaService.get()
	root.DescendantAdded:Connect(function(inst)
		if inst:IsA("BasePart") and inst.Name == "RarePickup" then
			bindSingleRarePickup(inst)
		end
	end)
	for _, inst in ipairs(root:GetDescendants()) do
		if inst:IsA("BasePart") and inst.Name == "RarePickup" then
			bindSingleRarePickup(inst)
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
	"RR 118  MIAMI         ON TIME\nRR 27   NEW YORK      BOARDING\nRR 330  SEATTLE       ON TIME\nRR 114  DENVER        BOARDING\nRR 512  DENVER        ON TIME",
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
	for _, p in ipairs(Players:GetPlayers()) do
		p:SetAttribute("HasVeloce", nil)
		local oldPack = p.Backpack:FindFirstChild("VELOCE Roller")
		if oldPack then
			oldPack:Destroy()
		end
		local ch = p.Character
		if ch then
			local oldHeld = ch:FindFirstChild("VELOCE Roller")
			if oldHeld then
				oldHeld:Destroy()
			end
		end
	end
	boardingStarted = false
	local origin = ArenaService.lobbyOrigin()
	local i = 0
	for _, c in contestants do
		i += 1
		c.s = 0
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
				-- Suitcase Rush: strap the event suitcase on for the terminal walk.
				local hrp = character:FindFirstChild("HumanoidRootPart")
				if hrp and hrp:IsA("BasePart") then
					local mini = Instance.new("Part")
					mini.Name = "EventSuitcase"
					mini.Size = Vector3.new(1.1, 1.5, 0.7)
					mini.Color = Color3.fromRGB(120, 80, 50)
					mini.Material = Enum.Material.Leather
					mini.CanCollide = false
					mini.Anchored = false
					mini.CFrame = hrp.CFrame * CFrame.new(1.4, -0.5, 0)
					mini.Parent = character
					local w = Instance.new("WeldConstraint")
					w.Part0 = hrp
					w.Part1 = mini
					w.Parent = mini
				end
			end
			c.player:SetAttribute("SuitcaseRares", 0)
			c.player:SetAttribute("SuitcaseBonusPaid", false)
			Remotes.event(Remotes.Events.Tutorial):FireClient(c.player, {
				step = if tutorialRound then "run" else "live",
				hint = "Walk the terminal — shops are open! Cross the gates to board your flight",
			})
		end
	end
	for _, c in contestants do
		if c.player then
			toast(c.player, "✈ Head to your gate — the flight won't wait!")
			toast(c.player, "SUITCASE RUSH — pack 8 rare looks across the terminal!")
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
		local cartPos = c.cart.Position
		if (inst.Position - cartPos).Magnitude > 4.5 then
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
	if c.s >= routeTotal - 3 and c.alive and not c.finished then
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

	-- Pickups ride the waypoint route: s = studs from the boarding arch.
	local looks = { "nightfall-tee", "crest-polo", "concrete-tee", "nightfall-boots", "oblique-coin-belt" }
	for i = 1, 10 do
		local s = 12 + (i - 1) * ((routeTotal - 30) / 9)
		local rpos, rdir = routePoint(s)
		local rperp = Vector3.new(-rdir.Z, 0, rdir.X)
		local lane = (i % 3)
		local rp3 = rpos + rperp * ArenaService.laneX(lane)
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
		p.Position = Vector3.new(rp3.X, 4, rp3.Z)
		p:SetAttribute("LookId", lookId)
		p:SetAttribute("Rare", look ~= nil and look.rare == true)
		p:SetAttribute("Lane", lane)
		p.Parent = folder
	end

	for i = 1, 6 do
		local s = 30 + (i - 1) * 24
		local rpos, rdir = routePoint(s)
		local rperp = Vector3.new(-rdir.Z, 0, rdir.X)
		local lane = (i + 1) % 3
		local rp3 = rpos + rperp * ArenaService.laneX(lane)
		local barrier = Instance.new("Part")
		barrier.Name = "Paparazzi"
		barrier.Size = Vector3.new(3, 4, 1.2)
		barrier.Anchored = true
		barrier.CanCollide = false
		barrier.Color = Color3.fromRGB(30, 30, 30)
		barrier.Position = Vector3.new(rp3.X, 3.2, rp3.Z)
		barrier:SetAttribute("Obstacle", true)
		barrier:SetAttribute("Lane", lane)
		barrier:SetAttribute("RouteS", s)
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
		local s = 45 + (i - 1) * 32
		local rpos, rdir = routePoint(s)
		local rperp = Vector3.new(-rdir.Z, 0, rdir.X)
		local lane = (i * 2) % 3
		local rp3 = rpos + rperp * ArenaService.laneX(lane)
		local lug = Instance.new("Part")
		lug.Name = "Luggage"
		lug.Size = Vector3.new(3, 2, 1.4)
		lug.Anchored = true
		lug.CanCollide = false
		lug.Color = Color3.fromRGB(122, 72, 40)
		lug.Material = Enum.Material.Fabric
		lug.Position = Vector3.new(rp3.X, 2.6, rp3.Z)
		lug:SetAttribute("Obstacle", true)
		lug:SetAttribute("Lane", lane)
		lug:SetAttribute("RouteS", s)
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

	-- Suitcase Rush: 8 rare looks scattered across the on-foot terminal.
	local rareSpots = {
		{ 0, 66 }, { -12, 46 }, { 12, 40 }, { -18, 20 },
		{ 18, 12 }, { -8, -11 }, { 10, -25 }, { 20, -2 },
	}
	local rareLooks = {
		"nightfall-boots", "crest-polo", "concrete-stack", "silk-club",
		"oblique-tote", "nightfall-triple-belt", "silk-atelier-shades", "oblique-coin-belt",
	}
	for i, spot in ipairs(rareSpots) do
		local orb = Instance.new("Part")
		orb.Name = "RarePickup"
		orb.Shape = Enum.PartType.Ball
		orb.Size = Vector3.new(1.8, 1.8, 1.8)
		orb.Anchored = true
		orb.CanCollide = false
		orb.Material = Enum.Material.Neon
		orb.Color = Color3.fromRGB(170, 80, 255)
		orb.Position = Vector3.new(spot[1], 3.2, spot[2])
		orb:SetAttribute("LookId", rareLooks[i])
		orb.Parent = folder
		local glow = Instance.new("PointLight")
		glow.Color = Color3.fromRGB(170, 80, 255)
		glow.Brightness = 2
		glow.Range = 10
		glow.Parent = orb
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
			local ps = inst:GetAttribute("RouteS")
			if type(ps) ~= "number" then
				continue
			end
			local ds = (ps :: number) - c.s
			if ds > 0 and ds < 26 then
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
		-- Stepping onto the runway boards you: race + timer start at the arch.
		if not c.boarded and not c.isNpc and phase == Config.Phases.Run then
			local character = c.player and c.player.Character
			local hrp = character and character:FindFirstChild("HumanoidRootPart") :: BasePart?
			if hrp and hrp.Position.Z < -33 then
				boardContestant(c)
			end
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
		local adv = contestantSpeed(c) * 8 * dt
		c.s = math.min(c.s + adv, routeTotal)
		c.distance += adv
		local rp = routePoint(c.s)
		c.z = rp.Z
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
			for _, c in contestants do
				settleSuitcase(c)
			end
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
		for _, c in contestants do
			settleSuitcase(c)
		end
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
			s = 0,
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
		s = 0,
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
	bindRarePickups()

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
