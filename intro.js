/**
 * Intro: one continuous swift RR monogram stroke, then swipe-up.
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

    const pathRR = document.getElementById('rrPath');
    const pen = document.getElementById('introPen');
    const brand = splash.querySelector('.brand');
    const sub = splash.querySelector('.sub');
    const rule = splash.querySelector('.intro-rule');
    const swipeHint = document.getElementById('introSwipeHint');
    const svg = document.getElementById('rrMonogramSvg');

    function pathLen(el) {
        try { return el.getTotalLength(); } catch (_) { return 900; }
    }

    function preparePath(el) {
        if (!el) return 0;
        const len = pathLen(el);
        el.style.strokeDasharray = String(len);
        el.style.strokeDashoffset = String(len);
        return len;
    }

    const lenRR = preparePath(pathRR);

    function placePen(pathEl, t, len) {
        if (!pen || !pathEl || !svg) return;
        const d = Math.max(0, Math.min(1, t)) * len;
        const pt = pathEl.getPointAtLength(d);
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

    // One continuous swift stroke
    const WRITE_MS = 2100;
    const HOLD_MS = 280;

    let readyToSwipe = false;
    let dismissing = false;

    function finishWrite() {
        if (pathRR) pathRR.style.strokeDashoffset = '0';
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

    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    const t0 = performance.now();
    function frame(now) {
        const elapsed = now - t0;

        if (elapsed < WRITE_MS) {
            const t = easeOutCubic(elapsed / WRITE_MS);
            if (pathRR) pathRR.style.strokeDashoffset = String(lenRR * (1 - t));
            placePen(pathRR, t, lenRR);
            requestAnimationFrame(frame);
            return;
        }

        if (pathRR) pathRR.style.strokeDashoffset = '0';

        if (elapsed < WRITE_MS + HOLD_MS) {
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
