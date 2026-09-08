--!strict
--[[
	Weekly theme from UTC week index. Honest calendar — no fake scarcity timers.
]]

export type Theme = {
	id: string,
	name: string,
	tagline: string,
	seasonalLookId: string,
}

local THEMES: { Theme } = {
	{ id = "open-cast", name = "Open Cast", tagline = "Street to finale", seasonalLookId = "street-basics" },
	{ id = "night-gala", name = "Night Gala", tagline = "Cathedral black", seasonalLookId = "nightfall-boots" },
	{ id = "uptown", name = "Uptown Polo", tagline = "Crest & polish", seasonalLookId = "crest-polo" },
	{ id = "concrete", name = "Concrete Logo", tagline = "City street", seasonalLookId = "concrete-tee" },
	{ id = "silk-club", name = "Silk Club", tagline = "Club night", seasonalLookId = "silk-club" },
	{ id = "atelier", name = "Atelier Finale", tagline = "Tote & bar", seasonalLookId = "oblique-tote" },
}

local LiveOps = {}

function LiveOps.utcWeekKey(unix: number?): string
	local t = os.date("!*t", unix or os.time())
	local week = math.floor((t.yday - 1) / 7) + 1
	return string.format("%04d-W%02d", t.year, week)
end

function LiveOps.theme(unix: number?): Theme
	local t = os.date("!*t", unix or os.time())
	local week = math.floor((t.yday - 1) / 7)
	local theme = THEMES[(week % #THEMES) + 1]
	return theme
end

function LiveOps.themes(): { Theme }
	return THEMES
end

return LiveOps
