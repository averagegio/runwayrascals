--!strict
--[[
	District + season announcements for Rascal City.

	Polls the local character's position against the district bounds that
	WorldService publishes in ReplicatedStorage.WorldDistricts and toasts
	when the player crosses into a new district. Also announces the season
	when the server broadcasts SeasonChanged.
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Remotes = require(ReplicatedStorage:WaitForChild("Net"):WaitForChild("Remotes"))
local HUD = require(script.Parent.HUDController)

type District = {
	id: string,
	name: string,
	houseName: string,
	cx: number,
	cz: number,
	half: number,
}

local DistrictController = {}

local districts: { District } = {}
local currentId: string? = nil
local player = Players.LocalPlayer

local function loadDistricts()
	-- No city, no districts: the terminal is one building.
	local folder = ReplicatedStorage:FindFirstChild("WorldDistricts")
	if not folder then
		return
	end
	for _, child in folder:GetChildren() do
		if child:IsA("StringValue") then
			-- "name|showName|cx|cz|half"
			local parts = string.split(child.Value, "|")
			if #parts == 5 then
				table.insert(districts, {
					id = child.Name,
					name = parts[1],
					houseName = parts[2],
					cx = tonumber(parts[3]) or 0,
					cz = tonumber(parts[4]) or 0,
					half = tonumber(parts[5]) or 0,
				})
			end
		end
	end
end

local function districtAt(x: number, z: number): District?
	for _, d in districts do
		if math.abs(x - d.cx) <= d.half and math.abs(z - d.cz) <= d.half then
			return d
		end
	end
	return nil
end

function DistrictController.bind()
	loadDistricts()

	Remotes.event(Remotes.Events.SeasonChanged).OnClientEvent:Connect(function(payload)
		if type(payload) == "table" and type(payload.seasonName) == "string" then
			HUD.toast(payload.seasonName .. " has arrived in Rascal City")
		end
	end)

	task.spawn(function()
		while true do
			task.wait(0.6)
			local ok, pos = pcall(function()
				local char = player.Character
				local root = if char then char:FindFirstChild("HumanoidRootPart") else nil
				return if root and root:IsA("BasePart") then root.Position else nil
			end)
			if ok and pos then
				local d = districtAt(pos.X, pos.Z)
				local id = if d then d.id else nil
				if id ~= currentId then
					currentId = id
					if d then
						HUD.toast("— " .. string.upper(d.name) .. " · " .. d.houseName .. " —")
					end
				end
			end
		end
	end)
end

return DistrictController
