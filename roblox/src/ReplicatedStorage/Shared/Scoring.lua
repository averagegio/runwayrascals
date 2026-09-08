--!strict
--[[
	Pure scoring — no Roblox instances. Keep in sync with Balance.json.

	Fair play: never multiply by Game Pass, monthly VIP, or Premium.
	Engagement-Based Payouts ended July 2025; Premium is not an economy lever.
]]

export type Breakdown = {
	style: number,
	race: number,
	pose: number,
	vote: number,
	finish: number,
	total: number,
	stylePoints: number,
}

local Scoring = {}

function Scoring.distanceFloor(distanceStuds: number): number
	return math.floor(math.max(0, distanceStuds))
end

function Scoring.styleScore(balance: any, looks: number, rares: number, pickups: number): number
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

function Scoring.voteScore(balance: any, votesReceived: number): number
	return math.max(0, math.floor(votesReceived)) * (balance.scoring.votePoints :: number)
end

function Scoring.stylePointsForScore(balance: any, total: number): number
	return math.floor(total / (balance.scoring.stylePointsDivisor :: number))
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
		votesReceived: number,
		finished: boolean,
	}
): Breakdown
	local style = Scoring.styleScore(balance, args.looks, args.rares, args.pickups)
	local race = Scoring.racePoints(balance, args.distanceStuds, args.looks, args.rares, args.place)
	local pose = Scoring.posePoints(balance, args.poseQuality01)
	local vote = Scoring.voteScore(balance, args.votesReceived)
	local finish = if args.finished then balance.scoring.finishBonus else 0
	local total = style + race + pose + vote + finish
	return {
		style = style,
		race = race,
		pose = pose,
		vote = vote,
		finish = finish,
		total = total,
		stylePoints = Scoring.stylePointsForScore(balance, total),
	}
end

return Scoring
