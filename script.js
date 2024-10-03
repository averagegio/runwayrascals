document.addEventListener('DOMContentLoaded', () => {
    const enterGameBtn = document.getElementById('enterGameBtn');
    
    // Remove the click event listener that was showing an alert

    // Add a simple pulsing animation to the game title
    const gameTitle = document.querySelector('.game-title');
    let scale = 1;
    let growing = true;

    function animateTitle() {
        if (growing) {
            scale += 0.001;
            if (scale >= 1.05) growing = false;
        } else {
            scale -= 0.001;
            if (scale <= 1) growing = true;
        }
        gameTitle.style.transform = `scale(${scale})`;
        requestAnimationFrame(animateTitle);
    }

    animateTitle();

    // Add touch ripple effect
    enterGameBtn.addEventListener('touchstart', createRipple);
    enterGameBtn.addEventListener('mousedown', createRipple);

    function createRipple(event) {
        const button = event.currentTarget;
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        ripple.classList.add('ripple');
        
        button.appendChild(ripple);
        
        ripple.addEventListener('animationend', () => {
            ripple.remove();
        });
    }
});
