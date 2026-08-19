document.addEventListener('DOMContentLoaded', async () => {
    const enterGameBtn = document.getElementById('enterGameBtn');
    const loginLink = document.getElementById('loginLink');
    const signupLink = document.getElementById('signupLink');
    const profileLink = document.getElementById('profileLink');
    const storeLink = document.getElementById('storeLink');
    const customizeLink = document.getElementById('customizeLink');
    const logoutBtn = document.getElementById('logoutBtn');
    const homeProfile = document.getElementById('homeProfile');
    const homeName = document.getElementById('homeName');
    const homeTag = document.getElementById('homeTag');
    const tagline = document.getElementById('homeTagline');

    let user = RunwayAuth.getCachedUser();
    const token = RunwayAuth.getToken();

    if (token) {
        try {
            user = await RunwayAuth.me();
        } catch (_) {
            // API may be down — keep cached session for offline browse
        }
    }

    if (user && token) {
        loginLink.hidden = true;
        signupLink.hidden = true;
        profileLink.hidden = false;
        storeLink.hidden = false;
        customizeLink.hidden = false;
        enterGameBtn.hidden = false;
        logoutBtn.hidden = false;
        homeProfile.hidden = false;
        homeName.textContent = user.characterName || user.displayName || 'Model';
        homeTag.textContent = `@${String(user.gamerTag || 'model').replace(/^@/, '')}`;
        tagline.textContent = 'Signed in · hit the runway';
    } else {
        tagline.textContent = 'Sign up to name your 3D model & shop looks';
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => RunwayAuth.logout());
    }

    if (enterGameBtn) {
        enterGameBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const hasCharacter = localStorage.getItem('selectedCharacter');
            const hasOutfit = localStorage.getItem('selectedOutfit');
            const hasName = localStorage.getItem('characterName') || (user && user.characterName);

            // Guests can play the full-bleed runner; account pages stay optional.
            if (RunwayAuth.getToken() && !hasName) {
                window.location.href = 'profile-setup.html';
                return;
            }
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
    }
});
