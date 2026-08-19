/**
 * Intro: paparazzi flashes from the start → Vogue-style RR written out → brand → swipe up.
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
    const pen = document.getElementById('introPen');
    const brand = splash.querySelector('.brand');
    const sub = splash.querySelector('.sub');
    const rule = splash.querySelector('.intro-rule');
    const swipeHint = document.getElementById('introSwipeHint');
    const flashEl = document.getElementById('introFlash');
    const svg = document.getElementById('rrMonogramSvg');

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

    // Timing: flashes open → write left R → write right R → hold → swipe
    const FLASH_INTRO_MS = 900;
    const WRITE_L_MS = 1600;
    const GAP_MS = 180;
    const WRITE_R_MS = 1600;
    const HOLD_MS = 320;

    let readyToSwipe = false;
    let dismissing = false;
    let flashLevel = 0;
    let nextFlashAt = 0;

    function triggerFlash(strength) {
        flashLevel = Math.max(flashLevel, strength);
        if (flashEl) {
            flashEl.style.opacity = String(flashLevel);
            flashEl.classList.add('is-on');
        }
    }

    function decayFlash() {
        if (flashLevel <= 0.01) {
            flashLevel = 0;
            if (flashEl) {
                flashEl.style.opacity = '0';
                flashEl.classList.remove('is-on');
            }
            return;
        }
        flashLevel *= 0.78;
        if (flashEl) flashEl.style.opacity = String(flashLevel);
    }

    function scheduleBursts(elapsed) {
        // Opening paparazzi burst — several pops before / as writing starts
        if (elapsed < FLASH_INTRO_MS) {
            if (elapsed >= nextFlashAt) {
                triggerFlash(0.55 + Math.random() * 0.4);
                nextFlashAt = elapsed + 90 + Math.random() * 160;
            }
            return;
        }
        // Occasional flashes while writing
        if (elapsed >= nextFlashAt && Math.random() < 0.035) {
            triggerFlash(0.35 + Math.random() * 0.35);
            nextFlashAt = elapsed + 220 + Math.random() * 400;
        }
    }

    function finishWrite() {
        if (pathL) pathL.style.strokeDashoffset = '0';
        if (pathR) pathR.style.strokeDashoffset = '0';
        if (pen) {
            pen.classList.remove('is-writing');
            pen.classList.add('is-done');
        }
        triggerFlash(0.7);
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
    // Kick a first flash immediately
    triggerFlash(0.85);
    nextFlashAt = 120;

    function frame(now) {
        const elapsed = now - t0;
        scheduleBursts(elapsed);
        decayFlash();

        const writeStart = FLASH_INTRO_MS;
        const writeLEnd = writeStart + WRITE_L_MS;
        const writeRStart = writeLEnd + GAP_MS;
        const writeREnd = writeRStart + WRITE_R_MS;
        const doneAt = writeREnd + HOLD_MS;

        if (elapsed < writeStart) {
            // Flashes only — keep paths hidden
            requestAnimationFrame(frame);
            return;
        }

        if (elapsed < writeLEnd) {
            const t = easeOutCubic((elapsed - writeStart) / WRITE_L_MS);
            if (pathL) pathL.style.strokeDashoffset = String(lenL * (1 - t));
            placePen(pathL, t, lenL);
            requestAnimationFrame(frame);
            return;
        }

        if (pathL) pathL.style.strokeDashoffset = '0';

        if (elapsed < writeRStart) {
            requestAnimationFrame(frame);
            return;
        }

        if (elapsed < writeREnd) {
            const t = easeOutCubic((elapsed - writeRStart) / WRITE_R_MS);
            if (pathR) pathR.style.strokeDashoffset = String(lenR * (1 - t));
            placePen(pathR, t, lenR);
            requestAnimationFrame(frame);
            return;
        }

        if (pathR) pathR.style.strokeDashoffset = '0';

        if (elapsed < doneAt) {
            if (pen) {
                pen.classList.remove('is-writing');
                pen.classList.add('is-done');
            }
            requestAnimationFrame(frame);
            return;
        }

        if (!readyToSwipe) finishWrite();
        // Keep decaying residual flashes a bit after ready
        if (flashLevel > 0 && !dismissing) requestAnimationFrame(frame);
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

    // Swipe hint button + upward gesture / keys only (not random tap-to-skip mid-write)
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
