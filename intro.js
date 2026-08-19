/**
 * Intro: feather-pen writes interlocking RR (Rolls-Royce–style),
 * then reveals the game's character cast.
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

    function pathLen(el) {
        try {
            return el.getTotalLength();
        } catch (_) {
            return 420;
        }
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

    function pointAlong(pathEl, t, len) {
        const d = Math.max(0, Math.min(1, t)) * len;
        const pt = pathEl.getPointAtLength(d);
        return pt;
    }

    function placePen(pathEl, t, len) {
        if (!pen || !pathEl || !stage) return;
        const pt = pointAlong(pathEl, t, len);
        const svg = document.getElementById('rrMonogramSvg');
        const box = svg.viewBox.baseVal;
        // Map SVG user space → % of stage
        const xPct = (pt.x / box.width) * 100;
        const yPct = (pt.y / box.height) * 100;
        pen.style.left = xPct + '%';
        pen.style.top = yPct + '%';
        pen.classList.add('is-writing');
    }

    const WRITE_MS = 2200;
    const GAP_MS = 180;
    const CAST_MS = 900;
    const HOLD_MS = 1100;
    const FADE_MS = 900;

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

        if (pathR) pathR.style.strokeDashoffset = '0';
        if (pen) {
            pen.classList.add('is-done');
            pen.classList.remove('is-writing');
        }

        const afterWrite = elapsed - (WRITE_MS * 2 + GAP_MS);
        if (afterWrite < CAST_MS) {
            if (cast && !cast.classList.contains('is-visible')) {
                cast.classList.add('is-visible');
                splash.classList.add('intro-show-cast');
            }
            requestAnimationFrame(frame);
            return;
        }

        if (afterWrite < CAST_MS + HOLD_MS) {
            requestAnimationFrame(frame);
            return;
        }

        splash.classList.add('is-leaving');
        window.setTimeout(function () {
            splash.classList.add('is-done');
            splash.setAttribute('aria-hidden', 'true');
            try {
                sessionStorage.setItem('rr_intro_seen', '1');
            } catch (_) { /* ignore */ }
        }, FADE_MS);
    }

    // Kick after fonts paint
    requestAnimationFrame(function () {
        requestAnimationFrame(frame);
    });
})();
