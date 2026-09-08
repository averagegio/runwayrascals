document.addEventListener('DOMContentLoaded', async () => {
    const enterGameBtn = document.getElementById('enterGameBtn');
    const loginLink = document.getElementById('loginLink');
    const signupLink = document.getElementById('signupLink');
    const wardrobeLink = document.getElementById('wardrobeLink');
    const fashionWeekLink = document.getElementById('fashionWeekLink');
    const profileLink = document.getElementById('profileLink');
    const storeLink = document.getElementById('storeLink');
    const logoutBtn = document.getElementById('logoutBtn');
    const homeProfile = document.getElementById('homeProfile');
    const homeName = document.getElementById('homeName');
    const homeTag = document.getElementById('homeTag');
    const tagline = document.getElementById('homeTagline');
    const menuToggle = document.getElementById('menuToggle');
    const menuClose = document.getElementById('menuClose');
    const menuBackdrop = document.getElementById('menuBackdrop');
    const homeDrawer = document.getElementById('homeDrawer');

    function setMenuOpen(open) {
        if (!homeDrawer || !menuToggle) return;
        homeDrawer.hidden = !open;
        homeDrawer.setAttribute('aria-hidden', open ? 'false' : 'true');
        if (menuBackdrop) menuBackdrop.hidden = !open;
        menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        document.body.classList.toggle('menu-open', open);
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            const open = menuToggle.getAttribute('aria-expanded') !== 'true';
            setMenuOpen(open);
        });
    }
    if (menuClose) menuClose.addEventListener('click', () => setMenuOpen(false));
    if (menuBackdrop) menuBackdrop.addEventListener('click', () => setMenuOpen(false));
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') setMenuOpen(false);
    });

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
        if (loginLink) loginLink.hidden = true;
        if (signupLink) signupLink.hidden = true;
        if (profileLink) profileLink.hidden = false;
        if (logoutBtn) logoutBtn.hidden = false;
        if (homeProfile) homeProfile.hidden = false;
        if (homeName) homeName.textContent = user.characterName || user.displayName || 'Model';
        if (homeTag) homeTag.textContent = `@${String(user.gamerTag || 'model').replace(/^@/, '')}`;
        if (tagline) tagline.textContent = 'Signed in · hit the runway';
        if (wardrobeLink) wardrobeLink.hidden = false;
        if (fashionWeekLink) fashionWeekLink.hidden = false;
        if (storeLink) storeLink.hidden = false;
    } else {
        if (tagline) tagline.textContent = 'Play · sign up · wardrobe · Fashion Week';
        if (signupLink) signupLink.hidden = false;
        if (wardrobeLink) wardrobeLink.hidden = false;
        if (fashionWeekLink) fashionWeekLink.hidden = false;
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => RunwayAuth.logout());
    }

    const quickRunBtn = document.getElementById('quickRunBtn');
    if (quickRunBtn) {
        quickRunBtn.addEventListener('click', () => {
            if (window.RascalQuickRun) RascalQuickRun.go();
            else window.location.href = 'gameplay.html';
        });
    }

    const robloxPlayLink = document.getElementById('robloxPlayLink');
    const robloxDrawerLink = document.getElementById('robloxDrawerLink');
    if (window.RascalRoblox && RascalRoblox.PLACE_ID > 0) {
        const url = RascalRoblox.playUrl();
        [robloxPlayLink, robloxDrawerLink].forEach((el) => {
            if (!el) return;
            el.href = url;
            el.target = '_blank';
            el.rel = 'noopener noreferrer';
        });
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
