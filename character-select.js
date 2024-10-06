document.addEventListener('DOMContentLoaded', () => {
    const characterOptions = document.querySelectorAll('.character-option');
    const confirmCharacterBtn = document.getElementById('confirmCharacterBtn');
    let selectedCharacter = null;

    characterOptions.forEach(option => {
        option.addEventListener('click', () => {
            characterOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            selectedCharacter = option.dataset.character;
        });
    });

    confirmCharacterBtn.addEventListener('click', (e) => {
        if (!selectedCharacter) {
            e.preventDefault();
            alert('Please select a character before confirming.');
        } else {
            localStorage.setItem('selectedCharacter', selectedCharacter);
            window.location.href = 'wardrobe-select.html'; // Redirect to wardrobe selection
        }
    });

    // ... (add any additional animations or effects for this page) ...
});
