--!strict
local Players = game:GetService("Players")
local Workspace = game:GetService("Workspace")

local SpectateController = {}

local camera = Workspace.CurrentCamera
local player = Players.LocalPlayer

function SpectateController.follow(userId: number?)
	if not camera then
		return
	end
	local target = player
	if type(userId) == "number" then
		local other = Players:GetPlayerByUserId(userId)
		if other then
			target = other
		end
	end
	local character = target.Character
	local humanoid = character and character:FindFirstChildOfClass("Humanoid")
	if humanoid then
		camera.CameraType = Enum.CameraType.Custom
		camera.CameraSubject = humanoid
	end
end

return SpectateController
