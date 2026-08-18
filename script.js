document.addEventListener('DOMContentLoaded', () => {
    const enterGameBtn = document.getElementById('enterGameBtn');

    enterGameBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const hasCharacter = localStorage.getItem('selectedCharacter');
        const hasOutfit = localStorage.getItem('selectedOutfit');
        if (!hasCharacter) {
            window.location.href = 'character-select.html';
            return;
        }
        if (!hasOutfit) {
            window.location.href = 'wardrobe-select.html';
            return;
        }
        window.location.href = 'map-select.html';
    });
});
