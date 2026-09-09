/**
 * Rascal Runways â€” web â†” Roblox play link.
 * Keep PLACE_ID in sync with Config.PlaceId in roblox/src/ReplicatedStorage/Shared/Config.lua.
 */
(function (global) {
    'use strict';

    const PLACE_ID = 77428346462225;
    const SLUG = 'Rascal-Runways';

    function playUrl() {
        if (PLACE_ID > 0) {
            return `https://www.roblox.com/games/${PLACE_ID}/${SLUG}`;
        }
        return 'roblox.html';
    }

    function go() {
        const url = playUrl();
        if (PLACE_ID > 0) {
            global.open(url, '_blank', 'noopener,noreferrer');
            return;
        }
        global.location.href = url;
    }

    global.RascalRoblox = { PLACE_ID, playUrl, go };
})(window);
