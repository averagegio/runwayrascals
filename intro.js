/**
 * Intro: Bodoni RR slides apart like glass panes → runway fade → brand → swipe.
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
    const rrEl = document.getElementById('introRR');
    const bgEl = document.getElementById('introBg');
    const veilEl = document.getElementById('introSwipeVeil');

    const SPLIT_AT = 280;
    const BG_START = 1600;
    const BRAND_AT = 2300;
    const READY_AT = 2900;

    let readyToSwipe = false;
    let dismissing = false;
    let brandShown = false;
    let done = false;

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

    function frame(now) {
        const elapsed = now - t0;

        if (elapsed >= SPLIT_AT && rrEl && !rrEl.classList.contains('is-splitting')) {
            rrEl.classList.add('is-splitting');
        }

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
            done = true;
        }

        if (!done) requestAnimationFrame(frame);
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

    requestAnimationFrame(frame);
})();
