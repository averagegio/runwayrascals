/**
 * Intro: paparazzi snaps → Bodoni RR glint → brown runway fade → swipe with gradient veil.
 */
(function () {
    const splash = document.getElementById('introSplash');
    if (!splash) return;

    let seen = false;
    try {
        const params = new URLSearchParams(location.search);
        if (params.get('intro') === '1') sessionStorage.removeItem('rr_intro_seen');
        seen = sessionStorage.getItem('rr_intro_seen') === '1';
    } catch (_) { /* ignore */ }

    if (seen) {
        splash.classList.add('is-done');
        splash.setAttribute('aria-hidden', 'true');
        return;
    }

    const brand = splash.querySelector('.brand');
    const sub = splash.querySelector('.sub');
    const rule = splash.querySelector('.intro-rule');
    const swipeHint = document.getElementById('introSwipeHint');
    const flashEl = document.getElementById('introFlash');
    const rrEl = document.getElementById('introRR');
    const bgEl = document.getElementById('introBg');
    const veilEl = document.getElementById('introSwipeVeil');

    // Paparazzi burst → RR glint → runway bg → brand → swipe
    const PAPARAZZI = [
        { at: 180, strength: 0.88, hold: 55 },
        { at: 340, strength: 0.72, hold: 40 },
        { at: 520, strength: 0.95, hold: 60 },
        { at: 720, strength: 0.65, hold: 35 },
        { at: 910, strength: 0.9, hold: 50 }
    ];
    const GLINT_START = 1100;
    const BG_START = 2400;
    const BRAND_AT = 3200;
    const READY_AT = 3800;

    let readyToSwipe = false;
    let dismissing = false;
    let flashLevel = 0;
    let flashHoldMs = 0;
    let flashIdx = 0;
    let lastTick = 0;
    let brandShown = false;

    function triggerFlash(strength, holdMs) {
        flashLevel = Math.max(flashLevel, strength);
        flashHoldMs = Math.max(flashHoldMs, holdMs || 40);
        if (flashEl) {
            flashEl.style.opacity = String(flashLevel);
            flashEl.classList.add('is-on');
        }
        // Soft paparazzi — don't nuke the whole mark unless very bright
        if (strength >= 0.92) splash.classList.add('is-flashing');
    }

    function decayFlash(dtMs) {
        if (flashHoldMs > 0) {
            flashHoldMs -= dtMs;
            if (flashEl) flashEl.style.opacity = String(flashLevel);
            return;
        }
        splash.classList.remove('is-flashing');
        if (flashLevel <= 0.02) {
            flashLevel = 0;
            if (flashEl) {
                flashEl.style.opacity = '0';
                flashEl.classList.remove('is-on');
            }
            return;
        }
        flashLevel *= Math.pow(0.5, dtMs / 40);
        if (flashEl) flashEl.style.opacity = String(flashLevel);
    }

    function schedulePaparazzi(elapsed) {
        while (flashIdx < PAPARAZZI.length && elapsed >= PAPARAZZI[flashIdx].at) {
            const beat = PAPARAZZI[flashIdx];
            triggerFlash(beat.strength, beat.hold);
            flashIdx += 1;
        }
    }

    function dismissIntro() {
        if (!readyToSwipe || dismissing) return;
        dismissing = true;
        splash.classList.add('is-swipe-up');
        if (veilEl) veilEl.classList.add('is-on');
        if (swipeHint) swipeHint.classList.remove('is-visible');
        window.setTimeout(function () {
            splash.classList.add('is-done');
            splash.setAttribute('aria-hidden', 'true');
            try { sessionStorage.setItem('rr_intro_seen', '1'); } catch (_) { /* ignore */ }
        }, 900);
    }

    const t0 = performance.now();
    lastTick = t0;

    function frame(now) {
        const elapsed = now - t0;
        const dt = Math.min(50, now - lastTick);
        lastTick = now;

        schedulePaparazzi(elapsed);
        decayFlash(dt);

        // RR slowly glints into view
        if (elapsed >= GLINT_START && rrEl && !rrEl.classList.contains('is-glinting')) {
            rrEl.classList.add('is-glinting');
        }

        // Brown runway background fades in under the mark
        if (elapsed >= BG_START && bgEl && !bgEl.classList.contains('is-in')) {
            bgEl.classList.add('is-in');
            splash.classList.add('has-runway');
        }

        if (elapsed >= BRAND_AT && !brandShown) {
            brandShown = true;
            if (brand) brand.classList.add('is-in');
            if (sub) sub.classList.add('is-in');
            if (rule) rule.classList.add('is-in');
        }

        if (elapsed >= READY_AT && !readyToSwipe) {
            if (swipeHint) swipeHint.classList.add('is-visible');
            splash.classList.add('intro-ready');
            readyToSwipe = true;
        }

        if (!dismissing && (!readyToSwipe || flashLevel > 0 || flashHoldMs > 0)) {
            requestAnimationFrame(frame);
        } else if (!dismissing && readyToSwipe && flashLevel <= 0) {
            // keep idle — no loop needed
        }
    }

    let touchY0 = null;
    splash.addEventListener('touchstart', function (e) {
        if (!e.touches[0]) return;
        touchY0 = e.touches[0].clientY;
    }, { passive: true });
    splash.addEventListener('touchend', function (e) {
        if (touchY0 == null) return;
        const y1 = (e.changedTouches[0] && e.changedTouches[0].clientY) || touchY0;
        if (touchY0 - y1 > 48) dismissIntro();
        touchY0 = null;
    }, { passive: true });
    splash.addEventListener('wheel', function (e) {
        if (e.deltaY < -20) dismissIntro();
    }, { passive: true });

    if (swipeHint) {
        swipeHint.addEventListener('click', function (e) {
            e.stopPropagation();
            dismissIntro();
        });
    }
    splash.addEventListener('click', function () {
        if (readyToSwipe) dismissIntro();
    });
    window.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowUp' || e.key === ' ' || e.key === 'Enter') dismissIntro();
    });

    requestAnimationFrame(function () {
        requestAnimationFrame(frame);
    });
})();
