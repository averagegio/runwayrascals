--!strict
--[[
	Scriptable cameras for Play Solo: plaza → follow the walk → finale pose.
	Returns to Custom in lobby / intermission so you can look around.
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local Workspace = game:GetService("Workspace")

local Config = require(ReplicatedStorage.Shared.Config)

local CameraController = {}

local player = Players.LocalPlayer
local conn: RBXScriptConnection? = nil
local phase = Config.Phases.Lobby

local function camera(): Camera
	return Workspace.CurrentCamera
end

local function arenaFolder(): Folder?
	local root = Workspace:FindFirstChild(Config.ARENA_NAME)
	if root and root:IsA("Folder") then
		return root
	end
	return nil
end

local function namedCam(name: string): CFrame?
	local root = arenaFolder()
	if not root then
		return nil
	end
	local folder = root:FindFirstChild("Cameras")
	if not folder then
		return nil
	end
	local part = folder:FindFirstChild(name)
	if part and part:IsA("BasePart") then
		return part.CFrame
	end
	return nil
end

local function followCFrame(): CFrame?
	local character = player.Character
	if not character then
		return nil
	end
	local root = character:FindFirstChild("HumanoidRootPart") :: BasePart?
	if not root then
		return nil
	end
	local pos = root.Position
	local camPos = pos + Vector3.new(0, 8, 16)
	return CFrame.lookAt(camPos, pos + Vector3.new(0, 2, -8))
end

local function apply()
	local cam = camera()
	if
		phase == Config.Phases.Run
		or phase == Config.Phases.Countdown
		or phase == Config.Phases.Pose
		or phase == Config.Phases.Vote
	then
		cam.CameraType = Enum.CameraType.Scriptable
		if phase == Config.Phases.Pose or phase == Config.Phases.Vote then
			local pose = namedCam("CamPose")
			if pose then
				cam.CFrame = pose
				return
			end
		end
		local follow = followCFrame()
		if follow then
			cam.CFrame = follow
		end
	else
		local lobby = namedCam("CamLobby")
		if lobby and (phase == Config.Phases.Lobby or phase == Config.Phases.Dress) then
			cam.CameraType = Enum.CameraType.Scriptable
			cam.CFrame = lobby
			return
		end
		if cam.CameraType == Enum.CameraType.Scriptable then
			cam.CameraType = Enum.CameraType.Custom
			local character = player.Character
			local humanoid = if character then character:FindFirstChildOfClass("Humanoid") else nil
			if humanoid then
				cam.CameraSubject = humanoid
			end
		end
	end
end

function CameraController.setRound(state: any)
	if typeof(state) ~= "table" then
		return
	end
	phase = state.phase or Config.Phases.Lobby
	apply()
end

function CameraController.bind()
	if conn then
		conn:Disconnect()
	end
	conn = RunService.RenderStepped:Connect(function()
		if
			phase == Config.Phases.Run
			or phase == Config.Phases.Countdown
			or phase == Config.Phases.Lobby
			or phase == Config.Phases.Dress
		then
			apply()
		end
	end)
	task.defer(apply)
end

return CameraController
