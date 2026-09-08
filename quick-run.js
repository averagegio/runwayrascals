/**
 * Rascal Runways — skip the character/wardrobe/map funnel for a first win.
 * Seeds Easy NY Open Cast so a guest can be on the runway in one tap.
 */
(function (global) {
    'use strict';

    const STREET = {
        id: 'street-open-cast',
        name: 'Nameless Street',
        city: 'newyork',
        showId: 'rick-owens',
        designer: 'House Nightfall analog'
    };

    function seed() {
        try {
            if (!localStorage.getItem('selectedCharacter')) {
                localStorage.setItem('selectedCharacter', 'fashion');
                localStorage.setItem('selectedCharacterImage', 'chibidollfashion.png');
            }
            if (!localStorage.getItem('selectedGait')) {
                localStorage.setItem('selectedGait', 'strut');
            }
            if (!localStorage.getItem('walkPreviewModel')) {
                localStorage.setItem('walkPreviewModel', 'female');
            }
            if (!localStorage.getItem('selectedOutfit')) {
                localStorage.setItem('selectedOutfit', JSON.stringify(STREET));
            }
            localStorage.setItem(
                'selectedMap',
                JSON.stringify({ id: 'newyork', name: 'New York', event: 'NYFW' })
            );
            localStorage.setItem(
                'selectedShow',
                JSON.stringify({
                    id: 'rick-owens',
                    cityId: 'newyork',
                    designer: 'Rick Owens',
                    showName: 'DRKSHDW'
                })
            );
            localStorage.setItem('selectedDifficulty', 'easy');
            localStorage.setItem('rr_quick_run', '1');
        } catch (_) {
            /* private mode */
        }
    }

    function go() {
        seed();
        global.location.href = 'gameplay.html';
    }

    global.RascalQuickRun = { seed, go };
})(window);
