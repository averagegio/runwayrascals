document.addEventListener('DOMContentLoaded', () => {
    const characterOptions = document.querySelectorAll('.character-option');
    const confirmButton = document.getElementById('confirmCharacterBtn');
    const subtitle = document.getElementById('charSubtitle');

    const defaultImages = {
        male: 'chibibrodoll.png',
        female: 'chibidoll2.png',
        fashion: 'chibidollfashion.png',
        evening: 'chibidoll3.png'
    };

    const user = (window.RunwayAuth && RunwayAuth.getCachedUser()) || {};
    const name = localStorage.getItem('characterName') || user.characterName || user.displayName;
    const tag = localStorage.getItem('gamerTag') || user.gamerTag;
    if (subtitle && (name || tag)) {
        subtitle.textContent = `${name || 'Model'}${tag ? ' · @' + String(tag).replace(/^@/, '') : ''} · pick a base look`;
    }

    characterOptions.forEach(option => {
        option.addEventListener('click', () => {
            characterOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
        });
    });

    confirmButton.addEventListener('click', (e) => {
        e.preventDefault();
        const selectedCharacter = document.querySelector('.character-option.selected');
        if (selectedCharacter) {
            const characterType = selectedCharacter.dataset.character;
            localStorage.setItem('selectedCharacter', characterType);
            localStorage.setItem('selectedCharacterImage', defaultImages[characterType] || 'chibidoll2.png');
            window.location.href = 'character-create.html';
        } else {
            alert('Please select a character before confirming.');
        }
    });
});
