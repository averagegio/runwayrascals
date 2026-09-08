-- RR splash while the experience streams.
local Players = game:GetService("Players")
local ReplicatedFirst = game:GetService("ReplicatedFirst")
local TweenService = game:GetService("TweenService")

ReplicatedFirst:RemoveDefaultLoadingScreen()

local player = Players.LocalPlayer
local gui = Instance.new("ScreenGui")
gui.Name = "RascalSplash"
gui.IgnoreGuiInset = true
gui.ResetOnSpawn = false
gui.Parent = player:WaitForChild("PlayerGui")

local bg = Instance.new("Frame")
bg.Size = UDim2.fromScale(1, 1)
bg.BackgroundColor3 = Color3.fromRGB(7, 7, 8)
bg.Parent = gui

local title = Instance.new("TextLabel")
title.BackgroundTransparency = 1
title.AnchorPoint = Vector2.new(0.5, 0.5)
title.Position = UDim2.fromScale(0.5, 0.46)
title.Size = UDim2.fromOffset(480, 80)
title.Font = Enum.Font.GothamBlack
title.Text = "RR"
title.TextColor3 = Color3.fromRGB(244, 239, 230)
title.TextScaled = true
title.Parent = bg

local sub = Instance.new("TextLabel")
sub.BackgroundTransparency = 1
sub.AnchorPoint = Vector2.new(0.5, 0)
sub.Position = UDim2.new(0.5, 0, 0.46, 48)
sub.Size = UDim2.fromOffset(480, 28)
sub.Font = Enum.Font.Gotham
sub.Text = "Rascal Runways"
sub.TextColor3 = Color3.fromRGB(201, 165, 106)
sub.TextScaled = true
sub.Parent = bg

local hint = Instance.new("TextLabel")
hint.BackgroundTransparency = 1
hint.AnchorPoint = Vector2.new(0.5, 1)
hint.Position = UDim2.new(0.5, 0, 1, -40)
hint.Size = UDim2.fromOffset(420, 24)
hint.Font = Enum.Font.Gotham
hint.Text = "Open Cast starts in seconds — first win under two minutes"
hint.TextColor3 = Color3.fromRGB(244, 239, 230)
hint.TextScaled = true
hint.Parent = bg

task.delay(2.2, function()
	local tw = TweenService:Create(bg, TweenInfo.new(0.6), { BackgroundTransparency = 1 })
	TweenService:Create(title, TweenInfo.new(0.6), { TextTransparency = 1 }):Play()
	TweenService:Create(sub, TweenInfo.new(0.6), { TextTransparency = 1 }):Play()
	TweenService:Create(hint, TweenInfo.new(0.6), { TextTransparency = 1 }):Play()
	tw:Play()
	tw.Completed:Wait()
	gui:Destroy()
end)
