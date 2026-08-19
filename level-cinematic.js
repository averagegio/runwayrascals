/**
 * Opening / closing cinematic overlays when levels unlock or complete.
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
                font-family: 'Fredoka One', cursive; padding: 16px;
                transform: scale(0.85); opacity: 0;
                transition: transform 0.5s ease, opacity 0.5s ease;
            }
            .cinematic-overlay.show .cinematic-copy { transform: scale(1); opacity: 1; }
            .cinematic-copy h2 {
                font-size: 28px; margin-bottom: 8px;
                text-shadow: 0 0 18px rgba(255,215,0,0.55);
            }
            .cinematic-copy p { font-size: 14px; opacity: 0.9; margin-bottom: 6px; }
            .cinematic-copy .tag {
                display: inline-block; margin-top: 10px; padding: 6px 14px;
                border-radius: 999px; background: linear-gradient(45deg,#FFD700,#FFA500);
                color: #111; font-size: 12px; letter-spacing: 0.06em;
            }
            .cinematic-sparks span {
                position: absolute; width: 6px; height: 6px; border-radius: 50%;
                background: #fbbf24; opacity: 0.9;
                animation: sparkFly 1.1s ease-out forwards;
            }
            @keyframes sparkFly {
                0% { transform: translate(0,0) scale(1); opacity: 1; }
                100% { transform: translate(var(--dx), var(--dy)) scale(0.2); opacity: 0; }
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
                <div class="cinematic-sparks"></div>
                <div class="cinematic-copy">
                    <h2>${title}</h2>
                    <p>${subtitle || ''}</p>
                    ${tag ? `<span class="tag">${tag}</span>` : ''}
                </div>
            `;
            (root || document.body).appendChild(overlay);

            const sparks = overlay.querySelector('.cinematic-sparks');
            for (let i = 0; i < 16; i++) {
                const s = document.createElement('span');
                const ang = (i / 16) * Math.PI * 2;
                s.style.setProperty('--dx', `${Math.cos(ang) * (60 + Math.random() * 80)}px`);
                s.style.setProperty('--dy', `${Math.sin(ang) * (60 + Math.random() * 80)}px`);
                s.style.left = '50%';
                s.style.top = '45%';
                s.style.animationDelay = `${Math.random() * 0.25}s`;
                sparks.appendChild(s);
            }

            requestAnimationFrame(() => {
                overlay.classList.add('show');
                if (mode === 'open') {
                    requestAnimationFrame(() => overlay.classList.add('open'));
                }
            });

            const hold = mode === 'close' ? 1600 : 2200;
            setTimeout(() => {
                overlay.classList.remove('show');
                setTimeout(() => {
                    overlay.remove();
                    resolve();
                }, 400);
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

    global.RunwayCinematic = { levelUnlocked, levelOpening, levelClosing, LEVEL_NAMES };
})(window);
