document.addEventListener('DOMContentLoaded', () => {
    const enterGameBtn = document.getElementById('enterGameBtn');

    enterGameBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Redirect directly to the gameplay page
        window.location.href = 'gameplay.html';
    });
});
