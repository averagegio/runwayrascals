/**
 * Intro cinematic:
 * falling perspective road lines → camera turns onto a line →
 * Helvetica "RR" → slow glint reveal of RUNWAY RASCALS with camera flashes.
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

    const canvas = document.getElementById('introCanvas');
    const brand = splash.querySelector('.brand');
    const sub = splash.querySelector('.sub');
    const swipeHint = document.getElementById('introSwipeHint');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let w = 0;
    let h = 0;
    let dpr = 1;

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = window.innerWidth;
        h = window.innerHeight;
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    const LINE_COUNT = 18;
    const lines = [];
    for (let i = 0; i < LINE_COUNT; i++) {
        lines.push({
            x: (i / (LINE_COUNT - 1) - 0.5) * 1.6,
            z: Math.random() * 1.2,
            speed: 0.55 + Math.random() * 0.45
        });
    }

    let readyToSwipe = false;
    let dismissing = false;
    let flash = 0;
    let phase = 'rush'; // rush | turn | write | reveal | hold
    let t0 = performance.now();
    let camYaw = 0;
    let camPitch = 0.18;
    let targetYaw = 0;
    let rrProgress = 0;
    let titleProgress = 0;
    let focusLine = 0.12;

    const WRITE_START = 1600;
    const TURN_START = 1100;
    const REVEAL_START = 2800;
    const HOLD_START = 4200;
    const DONE_AT = 5200;

    function project(x, z, yaw) {
        const cos = Math.cos(yaw);
        const sin = Math.sin(yaw);
        const rx = x * cos - (z - 0.2) * sin;
        const rz = x * sin + (z - 0.2) * cos;
        const depth = Math.max(0.08, rz + 1.15);
        const scale = 1 / depth;
        return {
            x: w * 0.5 + rx * w * 0.55 * scale,
            y: h * (0.42 + camPitch) + h * 0.55 * (1 - scale * 0.85),
            s: scale
        };
    }

    function drawRoad(now) {
        const elapsed = now - t0;
        ctx.fillStyle = '#070708';
        ctx.fillRect(0, 0, w, h);

        // Atmosphere
        const glow = ctx.createRadialGradient(w * 0.5, h * 0.35, 10, w * 0.5, h * 0.45, h * 0.7);
        glow.addColorStop(0, 'rgba(201,165,106,0.18)');
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, w, h);

        const yaw = camYaw;
        // Horizon band
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(0, h * (0.34 + camPitch * 0.4), w, 2);

        for (const line of lines) {
            if (phase === 'rush' || phase === 'turn') {
                line.z -= line.speed * 0.016;
                if (line.z < -0.2) line.z += 1.4;
            }

            const a = project(line.x, line.z, yaw);
            const b = project(line.x, line.z + 0.18, yaw);
            const isFocus = Math.abs(line.x - focusLine) < 0.05;
            ctx.strokeStyle = isFocus
                ? `rgba(244,239,230,${0.55 + a.s * 0.4})`
                : `rgba(201,165,106,${0.12 + a.s * 0.35})`;
            ctx.lineWidth = Math.max(1.5, 6 * a.s * (isFocus ? 1.4 : 1));
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
        }

        // Vanishing dashes down the center
        for (let i = 0; i < 12; i++) {
            const z = ((elapsed * 0.0012) + i / 12) % 1;
            const p = project(0, z, yaw);
            ctx.fillStyle = `rgba(255,255,255,${0.08 + p.s * 0.25})`;
            ctx.fillRect(p.x - 2 * p.s, p.y, 4 * p.s, 10 * p.s);
        }
    }

    function drawRR(progress) {
        if (progress <= 0) return;
        const text = 'RR';
        ctx.save();
        ctx.font = `700 ${Math.floor(Math.min(w, h) * 0.28)}px Helvetica, Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.008);
        ctx.strokeStyle = '#f4efe6';
        ctx.fillStyle = '#f4efe6';

        // Clip reveal left→right for a "written by the road line" feel
        const tw = ctx.measureText(text).width;
        const x0 = w * 0.5 - tw * 0.5;
        ctx.beginPath();
        ctx.rect(x0 - 8, h * 0.28, (tw + 16) * progress, h * 0.4);
        ctx.clip();
        ctx.strokeText(text, w * 0.5, h * 0.42);
        ctx.globalAlpha = 0.92;
        ctx.fillText(text, w * 0.5, h * 0.42);
        ctx.restore();
    }

    function drawTitle(progress) {
        if (progress <= 0) return;
        ctx.save();
        ctx.globalAlpha = Math.min(1, progress);
        ctx.fillStyle = '#f4efe6';
        ctx.textAlign = 'center';
        ctx.font = `600 ${Math.floor(Math.min(w, h) * 0.045)}px Helvetica, Arial, sans-serif`;
        ctx.letterSpacing = '0.35em';
        // letterSpacing may not apply on all browsers — space manually
        const label = 'RUNWAY RASCALS';
        ctx.fillText(label, w * 0.5, h * 0.62);

        // Glint sweep
        const g = ctx.createLinearGradient(0, 0, w, 0);
        const u = (progress * 1.4) % 1.4;
        g.addColorStop(Math.max(0, u - 0.12), 'rgba(255,255,255,0)');
        g.addColorStop(Math.min(1, u), 'rgba(255,255,255,0.35)');
        g.addColorStop(Math.min(1, u + 0.12), 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(w * 0.18, h * 0.58, w * 0.64, h * 0.08);
        ctx.restore();
    }

    function finishIntro() {
        if (brand) brand.classList.add('is-in');
        if (sub) sub.classList.add('is-in');
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

    function frame(now) {
        const elapsed = now - t0;

        if (elapsed < TURN_START) phase = 'rush';
        else if (elapsed < WRITE_START) phase = 'turn';
        else if (elapsed < REVEAL_START) phase = 'write';
        else if (elapsed < HOLD_START) phase = 'reveal';
        else phase = 'hold';

        if (phase === 'turn' || phase === 'write') {
            targetYaw = -0.42;
            camYaw += (targetYaw - camYaw) * 0.06;
            camPitch += (0.06 - camPitch) * 0.05;
        } else if (phase === 'rush') {
            camYaw *= 0.96;
        }

        if (phase === 'write' || phase === 'reveal' || phase === 'hold') {
            rrProgress = Math.min(1, (elapsed - WRITE_START) / 900);
        }
        if (phase === 'reveal' || phase === 'hold') {
            titleProgress = Math.min(1, (elapsed - REVEAL_START) / 1100);
            if (Math.random() < 0.045) flash = 0.55;
        }

        drawRoad(now);
        drawRR(rrProgress);
        drawTitle(titleProgress);

        if (flash > 0) {
            ctx.fillStyle = `rgba(255,255,255,${flash})`;
            ctx.fillRect(0, 0, w, h);
            flash *= 0.82;
            if (flash < 0.02) flash = 0;
        }

        if (elapsed >= DONE_AT && !readyToSwipe) finishIntro();
        if (!dismissing) requestAnimationFrame(frame);
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
    splash.addEventListener('click', function () { dismissIntro(); });
    window.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowUp' || e.key === ' ' || e.key === 'Enter') dismissIntro();
    });

    requestAnimationFrame(frame);
})();
