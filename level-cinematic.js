/**
 * Opening / closing cinematic overlays + pre-run beg & countdown.
 */
(function (global) {
    const LEVEL_NAMES = {
        newyork: 'New York Fashion Week',
        milan: 'Milan Fashion Week',
        paris: 'Paris Fashion Week',
        london: 'London Fashion Week',
        berlin: 'Berlin Fashion Week',
        miami: 'Miami Fashion Week'
    };

    function ensureStyles() {
        if (document.getElementById('cinematic-styles')) return;
        const style = document.createElement('style');
        style.id = 'cinematic-styles';
        style.textContent = `
            .cinematic-overlay {
                position: absolute; inset: 0; z-index: 80;
                display: flex; align-items: center; justify-content: center;
                flex-direction: column; pointer-events: all;
                background: radial-gradient(circle at 50% 40%, rgba(20,20,30,0.2), rgba(0,0,0,0.92));
                opacity: 0; transition: opacity 0.35s ease;
            }
            .cinematic-overlay.show { opacity: 1; }
            .cinematic-curtain {
                position: absolute; left: 0; right: 0; height: 50%;
                background: #0a0a0a; transition: transform 0.9s cubic-bezier(.2,.8,.2,1);
                z-index: 1;
            }
            .cinematic-curtain.top { top: 0; transform: translateY(0); }
            .cinematic-curtain.bottom { bottom: 0; transform: translateY(0); }
            .cinematic-overlay.open .cinematic-curtain.top { transform: translateY(-105%); }
            .cinematic-overlay.open .cinematic-curtain.bottom { transform: translateY(105%); }
            .cinematic-overlay.closing .cinematic-curtain.top { transform: translateY(0); }
            .cinematic-overlay.closing .cinematic-curtain.bottom { transform: translateY(0); }
            .cinematic-copy {
                position: relative; z-index: 2; text-align: center; color: #fff;
                font-family: Helvetica, Arial, sans-serif; padding: 16px;
                transform: scale(0.85); opacity: 0;
                transition: transform 0.5s ease, opacity 0.5s ease;
            }
            .cinematic-overlay.show .cinematic-copy { transform: scale(1); opacity: 1; }
            .cinematic-copy h2 {
                font-size: 26px; font-weight: 700; letter-spacing: 0.08em;
                text-transform: uppercase; margin-bottom: 8px;
            }
            .cinematic-copy p { font-size: 13px; opacity: 0.85; margin-bottom: 6px; letter-spacing: 0.12em; text-transform: uppercase; }
            .cinematic-copy .tag {
                display: inline-block; margin-top: 10px; padding: 6px 14px;
                border: 1px solid rgba(201,165,106,0.7); color: #c9a56a;
                font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
            }
            .countdown-overlay {
                position: absolute; inset: 0; z-index: 85;
                display: flex; align-items: center; justify-content: center;
                flex-direction: column; pointer-events: none;
                background: rgba(0,0,0,0.25);
            }
            .countdown-num {
                font-family: Helvetica, Arial, sans-serif;
                font-size: clamp(4rem, 22vw, 7rem);
                font-weight: 700; color: #fff;
                letter-spacing: -0.04em;
                text-shadow: 0 0 40px rgba(201,165,106,0.55);
                animation: countPop 0.85s cubic-bezier(.2,.8,.2,1) both;
            }
            .countdown-caption {
                margin-top: 12px;
                font-family: Helvetica, Arial, sans-serif;
                font-size: 0.75rem; letter-spacing: 0.35em;
                text-transform: uppercase; color: #c9a56a;
            }
            @keyframes countPop {
                0% { transform: scale(0.4); opacity: 0; }
                35% { transform: scale(1.12); opacity: 1; }
                100% { transform: scale(1); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    function play({ root, title, subtitle, tag, mode }) {
        ensureStyles();
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = `cinematic-overlay ${mode === 'close' ? 'closing' : ''}`;
            overlay.innerHTML = `
                <div class="cinematic-curtain top"></div>
                <div class="cinematic-curtain bottom"></div>
                <div class="cinematic-copy">
                    <h2>${title}</h2>
                    <p>${subtitle || ''}</p>
                    ${tag ? `<span class="tag">${tag}</span>` : ''}
                </div>
            `;
            (root || document.body).appendChild(overlay);

            requestAnimationFrame(() => {
                overlay.classList.add('show');
                if (mode === 'open') {
                    requestAnimationFrame(() => overlay.classList.add('open'));
                }
            });

            const hold = mode === 'close' ? 1400 : 1800;
            setTimeout(() => {
                overlay.classList.remove('show');
                setTimeout(() => {
                    overlay.remove();
                    resolve();
                }, 350);
            }, hold);
        });
    }

    function levelUnlocked(root, levelId, gamerTag) {
        const name = LEVEL_NAMES[levelId] || levelId;
        return play({
            root,
            mode: 'open',
            title: 'Level Unlocked',
            subtitle: name,
            tag: gamerTag ? `@${String(gamerTag).replace(/^@/, '')}` : 'NEW CITY'
        });
    }

    function levelOpening(root, levelId, characterName) {
        const name = LEVEL_NAMES[levelId] || levelId;
        return play({
            root,
            mode: 'open',
            title: name,
            subtitle: characterName ? `${characterName} takes the runway` : 'Show opening',
            tag: 'LIGHTS UP'
        });
    }

    /** Model bows / “begs” the runway, then 3-2-1-GO countdown. */
    function runwayCountdown(root, avatarApi) {
        ensureStyles();
        return new Promise((resolve) => {
            if (avatarApi && avatarApi.playBeg) {
                try { avatarApi.playBeg(1.1); } catch (_) { /* ignore */ }
            }

            const overlay = document.createElement('div');
            overlay.className = 'countdown-overlay';
            overlay.innerHTML = `
                <div class="countdown-num" id="countdownNum">3</div>
                <div class="countdown-caption" id="countdownCap">Strike a pose</div>
            `;
            (root || document.body).appendChild(overlay);

            const steps = [
                { n: '3', cap: 'Strike a pose', wait: 900 },
                { n: '2', cap: 'Lights', wait: 850 },
                { n: '1', cap: 'Camera', wait: 850 },
                { n: 'GO', cap: 'Walk', wait: 700 }
            ];
            let i = 0;
            const num = () => document.getElementById('countdownNum');
            const cap = () => document.getElementById('countdownCap');

            function tick() {
                if (i >= steps.length) {
                    overlay.remove();
                    resolve();
                    return;
                }
                const step = steps[i++];
                const el = num();
                const c = cap();
                if (el) {
                    el.textContent = step.n;
                    el.style.animation = 'none';
                    // reflow to restart pop
                    void el.offsetWidth;
                    el.style.animation = '';
                }
                if (c) c.textContent = step.cap;
                setTimeout(tick, step.wait);
            }
            tick();
        });
    }

    function levelClosing(root, levelId, won) {
        const name = LEVEL_NAMES[levelId] || levelId;
        return play({
            root,
            mode: 'close',
            title: won ? 'Show Closed' : 'Walk Cut Short',
            subtitle: name,
            tag: won ? 'CURTAIN' : 'WIPEOUT'
        });
    }

    global.RunwayCinematic = {
        levelUnlocked,
        levelOpening,
        levelClosing,
        runwayCountdown,
        LEVEL_NAMES
    };
})(window);
