/**
 * Intro: dark hold → Vogue RR write-out → delayed single flash (Disney+-style) → brand → swipe up.
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

    const pathL = document.getElementById('rrPathL');
    const pathR = document.getElementById('rrPathR');
    const brand = splash.querySelector('.brand');
    const sub = splash.querySelector('.sub');
    const rule = splash.querySelector('.intro-rule');
    const swipeHint = document.getElementById('introSwipeHint');
    const flashEl = document.getElementById('introFlash');

    function pathLen(el) {
        try { return el.getTotalLength(); } catch (_) { return 600; }
    }

    function preparePath(el) {
        if (!el) return 0;
        const len = pathLen(el);
        el.style.strokeDasharray = String(len);
        el.style.strokeDashoffset = String(len);
        return len;
    }

    const lenL = preparePath(pathL);
    const lenR = preparePath(pathR);

    // Disney+-style: long dark void → draw RR → beat → one delayed flash → title
    const VOID_MS = 1700;
    const WRITE_L_MS = 1500;
    const GAP_MS = 160;
    const WRITE_R_MS = 1500;
    const POST_WRITE_BEAT_MS = 620;
    const FLASH_HOLD_MS = 100;
    const POST_FLASH_MS = 380;

    const WRITE_START = VOID_MS;
    const WRITE_L_END = WRITE_START + WRITE_L_MS;
    const WRITE_R_START = WRITE_L_END + GAP_MS;
    const WRITE_R_END = WRITE_R_START + WRITE_R_MS;
    const FLASH_AT_MS = WRITE_R_END + POST_WRITE_BEAT_MS;
    const REVEAL_AT_MS = FLASH_AT_MS + FLASH_HOLD_MS + POST_FLASH_MS;

    let readyToSwipe = false;
    let dismissing = false;
    let flashLevel = 0;
    let flashHoldMs = 0;
    let flashFired = false;
    let lastTick = 0;

    function triggerFlash(strength, holdMs) {
        flashLevel = Math.max(flashLevel, strength);
        flashHoldMs = Math.max(flashHoldMs, holdMs || 80);
        if (flashEl) {
            flashEl.style.opacity = String(flashLevel);
            flashEl.classList.add('is-on');
        }
        if (strength >= 0.8) splash.classList.add('is-flashing');
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
        flashLevel *= Math.pow(0.5, dtMs / 55);
        if (flashEl) flashEl.style.opacity = String(flashLevel);
    }

    function finishWrite() {
        if (pathL) pathL.style.strokeDashoffset = '0';
        if (pathR) pathR.style.strokeDashoffset = '0';
        if (brand) brand.classList.add('is-in');
        if (sub) sub.classList.add('is-in');
        if (rule) rule.classList.add('is-in');
        if (swipeHint) swipeHint.classList.add('is-visible');
        splash.classList.add('intro-ready');
        readyToSwipe = true;
    }

    function dismissIntro() {
        if (!readyToSwipe || dismissing) return;
        dismissing = true;
        splash.classList.add('is-swipe-up');
        if (swipeHint) swipeHint.classList.remove('is-visible');
        window.setTimeout(function () {
            splash.classList.add('is-done');
            splash.setAttribute('aria-hidden', 'true');
            try { sessionStorage.setItem('rr_intro_seen', '1'); } catch (_) { /* ignore */ }
        }, 780);
    }

    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    const t0 = performance.now();
    lastTick = t0;

    function frame(now) {
        const elapsed = now - t0;
        const dt = Math.min(50, now - lastTick);
        lastTick = now;

        // Delayed single sting — after void + full RR write + beat
        if (!flashFired && elapsed >= FLASH_AT_MS) {
            flashFired = true;
            triggerFlash(0.9, FLASH_HOLD_MS);
        }
        decayFlash(dt);

        if (elapsed < WRITE_START) {
            // Dark void — nothing drawn yet
            requestAnimationFrame(frame);
            return;
        }

        if (elapsed < WRITE_L_END) {
            const t = easeOutCubic((elapsed - WRITE_START) / WRITE_L_MS);
            if (pathL) pathL.style.strokeDashoffset = String(lenL * (1 - t));
            requestAnimationFrame(frame);
            return;
        }

        if (pathL) pathL.style.strokeDashoffset = '0';

        if (elapsed < WRITE_R_START) {
            requestAnimationFrame(frame);
            return;
        }

        if (elapsed < WRITE_R_END) {
            const t = easeOutCubic((elapsed - WRITE_R_START) / WRITE_R_MS);
            if (pathR) pathR.style.strokeDashoffset = String(lenR * (1 - t));
            requestAnimationFrame(frame);
            return;
        }

        if (pathR) pathR.style.strokeDashoffset = '0';

        if (elapsed < REVEAL_AT_MS) {
            // Post-write beat + flash + settle
            requestAnimationFrame(frame);
            return;
        }

        if (!readyToSwipe) finishWrite();
        if ((flashLevel > 0 || flashHoldMs > 0) && !dismissing) requestAnimationFrame(frame);
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
