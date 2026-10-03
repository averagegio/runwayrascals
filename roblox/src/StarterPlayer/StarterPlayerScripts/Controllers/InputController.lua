--!strict
local ContextActionService = game:GetService("ContextActionService")
local UserInputService = game:GetService("UserInputService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Remotes = require(ReplicatedStorage.Net.Remotes)

local InputController = {}

local function fire(action: string)
	Remotes.event(Remotes.Events.Input):FireServer(action)
end

function InputController.bind()
	-- Ride: context-aware mount/dismount (E key + on-screen button on touch).
	ContextActionService:BindAction("Ride", function(_, state, _)
		if state == Enum.UserInputState.Begin then
			fire("Ride")
		end
		return Enum.ContextActionResult.Sink
	end, true, Enum.KeyCode.E)
	ContextActionService:SetTitle("Ride", "RIDE")
	ContextActionService:SetPosition("Ride", UDim2.new(1, -90, 1, -170))
	UserInputService.InputBegan:Connect(function(input, processed)
		if processed then
			return
		end
		if input.KeyCode == Enum.KeyCode.A or input.KeyCode == Enum.KeyCode.Left then
			fire("Left")
		elseif input.KeyCode == Enum.KeyCode.D or input.KeyCode == Enum.KeyCode.Right then
			fire("Right")
		elseif input.KeyCode == Enum.KeyCode.W or input.KeyCode == Enum.KeyCode.Up or input.KeyCode == Enum.KeyCode.Space then
			fire("Jump")
		elseif input.KeyCode == Enum.KeyCode.S or input.KeyCode == Enum.KeyCode.Down then
			fire("Slide")
		end
	end)

	local touchStart: Vector3? = nil
	UserInputService.TouchStarted:Connect(function(touch, processed)
		if processed then
			return
		end
		touchStart = touch.Position
	end)
	UserInputService.TouchEnded:Connect(function(touch)
		if not touchStart then
			return
		end
		local delta = touch.Position - touchStart
		touchStart = nil
		if math.abs(delta.X) < 24 and math.abs(delta.Y) < 24 then
			return
		end
		if math.abs(delta.X) > math.abs(delta.Y) then
			fire(if delta.X < 0 then "Left" else "Right")
		else
			fire(if delta.Y < 0 then "Jump" else "Slide")
		end
	end)
end

return InputController
