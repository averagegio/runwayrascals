document.addEventListener('DOMContentLoaded', () => {
    const characterOptions = document.querySelectorAll('.character-option');
    const confirmButton = document.getElementById('confirmCharacterBtn');

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
            // Redirect to the wardrobe select screen
            window.location.href = 'wardrobe-select.html';
        } else {
            alert('Please select a character before confirming.');
        }
    });

    // ... (add any additional animations or effects for this page) ...
});
