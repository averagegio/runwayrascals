/**
 * Intro: slow cursive R → shoelace flourish → askew cursive R, then swipe-up.
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
    const pathLace = document.getElementById('rrPathLace');
    const pathR = document.getElementById('rrPathR');
    const pen = document.getElementById('introPen');
    const stage = document.getElementById('introWriteStage');
    const swipeHint = document.getElementById('introSwipeHint');
    const brand = splash.querySelector('.brand');
    const sub = splash.querySelector('.sub');
    const rule = splash.querySelector('.intro-rule');

    function pathLen(el) {
        try { return el.getTotalLength(); } catch (_) { return 400; }
    }

    function preparePath(el) {
        if (!el) return 0;
        const len = pathLen(el);
        el.style.strokeDasharray = String(len);
        el.style.strokeDashoffset = String(len);
        return len;
    }

    const lenL = preparePath(pathL);
    const lenLace = preparePath(pathLace);
    const lenR = preparePath(pathR);

    function placePen(pathEl, t, len) {
        if (!pen || !pathEl || !stage) return;
        const d = Math.max(0, Math.min(1, t)) * len;
        const pt = pathEl.getPointAtLength(d);
        // Account for nested transform on askew R by using getScreenCTM when available
        const svg = document.getElementById('rrMonogramSvg');
        const ctm = pathEl.getScreenCTM();
        const svgCtm = svg.getScreenCTM();
        if (ctm && svgCtm) {
            const ptDom = svg.createSVGPoint();
            ptDom.x = pt.x;
            ptDom.y = pt.y;
            const screen = ptDom.matrixTransform(ctm);
            const local = screen.matrixTransform(svgCtm.inverse());
            const box = svg.viewBox.baseVal;
            pen.style.left = (local.x / box.width) * 100 + '%';
            pen.style.top = (local.y / box.height) * 100 + '%';
        } else {
            const box = svg.viewBox.baseVal;
            pen.style.left = (pt.x / box.width) * 100 + '%';
            pen.style.top = (pt.y / box.height) * 100 + '%';
        }
        pen.classList.add('is-writing');
    }

    // Slow, deliberate cursive timing
    const WRITE1_MS = 3400;
    const LACE_MS = 1600;
    const WRITE2_MS = 3200;
    const HOLD_MS = 400;

    let readyToSwipe = false;
    let dismissing = false;

    function finishWrite() {
        if (pathL) pathL.style.strokeDashoffset = '0';
        if (pathLace) pathLace.style.strokeDashoffset = '0';
        if (pathR) pathR.style.strokeDashoffset = '0';
        if (pen) {
            pen.classList.remove('is-writing');
            pen.classList.add('is-done');
        }
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

    function easeInOut(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    const t0 = performance.now();
    function frame(now) {
        const elapsed = now - t0;

        if (elapsed < WRITE1_MS) {
            const t = easeInOut(elapsed / WRITE1_MS);
            if (pathL) pathL.style.strokeDashoffset = String(lenL * (1 - t));
            placePen(pathL, t, lenL);
            requestAnimationFrame(frame);
            return;
        }

        if (pathL) pathL.style.strokeDashoffset = '0';

        if (elapsed < WRITE1_MS + LACE_MS) {
            const t = easeInOut((elapsed - WRITE1_MS) / LACE_MS);
            if (pathLace) pathLace.style.strokeDashoffset = String(lenLace * (1 - t));
            placePen(pathLace, t, lenLace);
            requestAnimationFrame(frame);
            return;
        }

        if (pathLace) pathLace.style.strokeDashoffset = '0';

        if (elapsed < WRITE1_MS + LACE_MS + WRITE2_MS) {
            const t = easeInOut((elapsed - WRITE1_MS - LACE_MS) / WRITE2_MS);
            if (pathR) pathR.style.strokeDashoffset = String(lenR * (1 - t));
            placePen(pathR, t, lenR);
            requestAnimationFrame(frame);
            return;
        }

        if (elapsed < WRITE1_MS + LACE_MS + WRITE2_MS + HOLD_MS) {
            requestAnimationFrame(frame);
            return;
        }

        finishWrite();
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
