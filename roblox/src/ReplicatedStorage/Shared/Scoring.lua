--!strict
--[[
	Pure scoring — no Roblox instances. Keep in sync with Balance.json.
	Fair play: callers must not multiply these by Game Pass / Dev Product flags.
]]

export type Breakdown = {
	style: number,
	race: number,
	pose: number,
	finish: number,
	total: number,
	coins: number,
}

local Scoring = {}

function Scoring.distanceFloor(distanceStuds: number): number
	return math.floor(math.max(0, distanceStuds))
end

function Scoring.stylePoints(balance: any, looks: number, rares: number, pickups: number): number
	local s = balance.scoring
	return looks * s.lookPoints + rares * s.rarePoints + pickups * s.pickupPoints
end

function Scoring.racePoints(balance: any, distanceStuds: number, looks: number, rares: number, place: number): number
	local s = balance.scoring
	local placePts = 0
	if place >= 1 and place <= #s.placePoints then
		placePts = s.placePoints[place]
	end
	return Scoring.distanceFloor(distanceStuds) + looks * s.lookStyleBonus + rares * s.rareStyleBonus + placePts
end

function Scoring.posePoints(balance: any, poseQuality01: number): number
	local q = math.clamp(poseQuality01, 0, 1)
	return math.floor((balance.scoring.poseMax :: number) * q)
end

function Scoring.total(balance: any, parts: { style: number, race: number, pose: number, finished: boolean }): number
	local finish = if parts.finished then balance.scoring.finishBonus else 0
	return parts.style + parts.race + parts.pose + finish
end

function Scoring.coinsForScore(balance: any, total: number, isPremium: boolean): number
	local s = balance.scoring
	local coins = math.floor(total / s.coinsDivisor)
	if isPremium then
		coins = math.floor(coins * (1 + s.premiumCoinBonus))
	end
	return coins
end

function Scoring.breakdown(
	balance: any,
	args: {
		looks: number,
		rares: number,
		pickups: number,
		distanceStuds: number,
		place: number,
		poseQuality01: number,
		finished: boolean,
		isPremium: boolean,
	}
): Breakdown
	local style = Scoring.stylePoints(balance, args.looks, args.rares, args.pickups)
	local race = Scoring.racePoints(balance, args.distanceStuds, args.looks, args.rares, args.place)
	local pose = Scoring.posePoints(balance, args.poseQuality01)
	local finish = if args.finished then balance.scoring.finishBonus else 0
	local total = style + race + pose + finish
	return {
		style = style,
		race = race,
		pose = pose,
		finish = finish,
		total = total,
		coins = Scoring.coinsForScore(balance, total, args.isPremium),
	}
end

return Scoring
