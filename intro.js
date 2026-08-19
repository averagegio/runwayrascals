/**
 * Intro: feather pen writes interlocking RR, then swipe-up reveals home.
 */
(function () {
    const splash = document.getElementById('introSplash');
    if (!splash) return;

    let seen = false;
    try {
        const params = new URLSearchParams(location.search);
        if (params.get('intro') === '1') {
            sessionStorage.removeItem('rr_intro_seen');
        }
        seen = sessionStorage.getItem('rr_intro_seen') === '1';
    } catch (_) { /* ignore */ }

    if (seen) {
        splash.classList.add('is-done');
        splash.setAttribute('aria-hidden', 'true');
        return;
    }

    const pathL = document.getElementById('rrPathL');
    const pathR = document.getElementById('rrPathR');
    const pen = document.getElementById('introPen');
    const stage = document.getElementById('introWriteStage');
    const cast = document.getElementById('introCast');
    const swipeHint = document.getElementById('introSwipeHint');
    const brand = splash.querySelector('.brand');
    const sub = splash.querySelector('.sub');
    const rule = splash.querySelector('.intro-rule');

    function pathLen(el) {
        try { return el.getTotalLength(); } catch (_) { return 420; }
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

    function placePen(pathEl, t, len) {
        if (!pen || !pathEl || !stage) return;
        const d = Math.max(0, Math.min(1, t)) * len;
        const pt = pathEl.getPointAtLength(d);
        const svg = document.getElementById('rrMonogramSvg');
        const box = svg.viewBox.baseVal;
        pen.style.left = (pt.x / box.width) * 100 + '%';
        pen.style.top = (pt.y / box.height) * 100 + '%';
        pen.classList.add('is-writing');
    }

    const WRITE_MS = 2400;
    const GAP_MS = 200;
    let readyToSwipe = false;
    let dismissing = false;

    function finishWrite() {
        if (pathL) pathL.style.strokeDashoffset = '0';
        if (pathR) pathR.style.strokeDashoffset = '0';
        if (pen) {
            pen.classList.remove('is-writing');
            pen.classList.add('is-done');
        }
        if (brand) brand.classList.add('is-in');
        if (sub) sub.classList.add('is-in');
        if (rule) rule.classList.add('is-in');
        if (cast) cast.classList.add('is-visible');
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

    const t0 = performance.now();
    function frame(now) {
        const elapsed = now - t0;
        if (elapsed < WRITE_MS) {
            const t = elapsed / WRITE_MS;
            if (pathL) pathL.style.strokeDashoffset = String(lenL * (1 - t));
            placePen(pathL, t, lenL);
            requestAnimationFrame(frame);
            return;
        }
        if (elapsed < WRITE_MS + GAP_MS) {
            if (pathL) pathL.style.strokeDashoffset = '0';
            requestAnimationFrame(frame);
            return;
        }
        const t2 = (elapsed - WRITE_MS - GAP_MS) / WRITE_MS;
        if (t2 < 1) {
            if (pathR) pathR.style.strokeDashoffset = String(lenR * (1 - t2));
            placePen(pathR, t2, lenR);
            requestAnimationFrame(frame);
            return;
        }
        finishWrite();
    }

    // Swipe / wheel / click to enter
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
    splash.addEventListener('click', function () {
        dismissIntro();
    });
    window.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowUp' || e.key === ' ' || e.key === 'Enter') dismissIntro();
    });

    requestAnimationFrame(function () {
        requestAnimationFrame(frame);
    });
})();
