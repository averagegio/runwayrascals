document.addEventListener('DOMContentLoaded', () => {
    const enterGameBtn = document.getElementById('enterGameBtn');

    enterGameBtn.addEventListener('click', (e) => {
        const selectedCharacter = localStorage.getItem('selectedCharacter');
        if (!selectedCharacter) {
            e.preventDefault();
            alert('Please customize your character before starting the game.');
        } else {
            window.location.href = 'gameplay.html';
        }
    });

    // ... (keep existing animation code) ...
});
