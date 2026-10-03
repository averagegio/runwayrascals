-- ProximitySigns: building / people labels stay hidden until you walk up to them.
local Players = game:GetService("Players")

local player = Players.LocalPlayer
local SHOW_DISTANCE = 30
local REFRESH_SIGNS_EVERY = 5

local function signPosition(gui: BillboardGui): Vector3?
	local adornee = gui.Adornee
	if adornee and adornee:IsA("BasePart") then
		return adornee.Position
	end
	local parent = gui.Parent
	if parent and parent:IsA("BasePart") then
		return parent.Position
	end
	return nil
end

local signs: { BillboardGui } = {}
local function refreshSigns()
	table.clear(signs)
	for _, gui in ipairs(workspace:GetDescendants()) do
		if gui:IsA("BillboardGui") then
			table.insert(signs, gui)
		end
	end
end
refreshSigns()

local tick = 0
while true do
	tick += 1
	if tick % (REFRESH_SIGNS_EVERY * 3) == 0 then
		refreshSigns()
	end
	local character = player.Character
	local root = if character then character:FindFirstChild("HumanoidRootPart") else nil
	if root and root:IsA("BasePart") then
		local rp = root.Position
		for _, gui in ipairs(signs) do
			if gui.Parent then
				local pos = signPosition(gui)
				gui.Enabled = (pos ~= nil) and ((pos - rp).Magnitude <= SHOW_DISTANCE)
			end
		end
	end
	task.wait(0.35)
end
