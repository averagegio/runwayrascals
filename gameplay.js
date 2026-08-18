(() => {
    const LANES = 3;
    const CLOTHING_TYPES = [
        { emoji: '👗', name: 'Dress', points: 25 },
        { emoji: '👠', name: 'Heels', points: 20 },
        { emoji: '👜', name: 'Bag', points: 30 },
        { emoji: '🕶️', name: 'Shades', points: 15 },
        { emoji: '👒', name: 'Hat', points: 20 },
        { emoji: '🧣', name: 'Scarf', points: 15 },
        { emoji: '🧥', name: 'Coat', points: 35 },
        { emoji: '💍', name: 'Ring', points: 40 }
    ];

    const MAP_THEMES = {
        newyork: {
            name: 'New York Fashion Week',
            skyTop: '#0f172a',
            skyBottom: '#1e293b',
            runway: '#1f1f1f',
            runwayEdge: '#F4C430',
            laneLine: 'rgba(244,196,48,0.55)',
            crowd: '#334155',
            accent: '#F4C430',
            city: 'ny'
        },
        milan: {
            name: 'Milan Fashion Week',
            skyTop: '#2c1810',
            skyBottom: '#5c3317',
            runway: '#3b2f2f',
            runwayEdge: '#c9a227',
            laneLine: 'rgba(201,162,39,0.5)',
            crowd: '#4a2c2a',
            accent: '#8B0000',
            city: 'milan'
        },
        london: {
            name: 'London Fashion Week',
            skyTop: '#0b1d36',
            skyBottom: '#1e3a5f',
            runway: '#1a1a1a',
            runwayEdge: '#C8102E',
            laneLine: 'rgba(200,16,46,0.45)',
            crowd: '#243447',
            accent: '#C8102E',
            city: 'london'
        },
        berlin: {
            name: 'Berlin Fashion Week',
            skyTop: '#111111',
            skyBottom: '#2a2a2a',
            runway: '#222222',
            runwayEdge: '#2ECC71',
            laneLine: 'rgba(46,204,113,0.45)',
            crowd: '#3a3a3a',
            accent: '#2ECC71',
            city: 'berlin'
        },
        miami: {
            name: 'Miami Fashion Week',
            skyTop: '#0369a1',
            skyBottom: '#fb923c',
            runway: '#1e1b4b',
            runwayEdge: '#FF6EC7',
            laneLine: 'rgba(255,110,199,0.55)',
            crowd: '#7c3aed',
            accent: '#FF6EC7',
            city: 'miami'
        }
    };

    let canvas, ctx;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let running = false;
    let gameOver = false;
    let rafId = 0;
    let lastTs = 0;

    let theme = MAP_THEMES.newyork;
    let characterImg = null;
    let cameraMode = 'back'; // 'back' = classic chase cam, 'front' = face the model

    let lane = 1;
    let targetLane = 1;
    let laneX = 0;
    let playerYOffset = 0;
    let jumpT = 0;
    let slideT = 0;
    let isJumping = false;
    let isSliding = false;

    let distance = 0;
    let score = 0;
    let looksCollected = 0;
    let speed = 280;
    let spawnTimer = 0;
    let flashTimer = 0;

    /** @type {Array<{kind:string,lane:number,z:number,w:number,h:number,type?:object,hit?:boolean}>} */
    let entities = [];

    // Swipe tracking
    let touchStartX = 0;
    let touchStartY = 0;
    let touchActive = false;

    function readOutfitImage() {
        try {
            const raw = localStorage.getItem('selectedOutfit');
            if (raw) {
                const outfit = JSON.parse(raw);
                if (outfit && outfit.image) return outfit.image;
            }
        } catch (_) { /* ignore */ }

        const character = localStorage.getItem('selectedCharacter');
        return character === 'male' ? 'chibibrodoll.png' : 'chibidoll2.png';
    }

    function readMapTheme() {
        try {
            const raw = localStorage.getItem('selectedMap');
            if (raw) {
                const map = JSON.parse(raw);
                if (map && map.id && MAP_THEMES[map.id]) return MAP_THEMES[map.id];
            }
        } catch (_) { /* ignore */ }
        return MAP_THEMES.newyork;
    }

    function resize() {
        const wrap = document.getElementById('gameWrapper');
        const rect = wrap.getBoundingClientRect();
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = Math.max(280, Math.floor(rect.width));
        height = Math.max(400, Math.floor(rect.height));
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        laneX = laneCenterX(lane);
    }

    function laneCenterX(laneIndex) {
        const runwayLeft = width * 0.18;
        const runwayRight = width * 0.82;
        const runwayW = runwayRight - runwayLeft;
        const laneW = runwayW / LANES;
        return runwayLeft + laneW * (laneIndex + 0.5);
    }

    function project(z, laneIndex) {
        // Perspective: z=0 near player, z increases into the distance
        const near = 0.55;
        const far = 0.12;
        const t = 1 / (1 + z * 0.0045);
        const scale = near * t + far * (1 - t);
        const horizonY = height * 0.28;
        const groundY = height * 0.88;
        const y = horizonY + (groundY - horizonY) * (1 - Math.pow(1 - t, 1.35));
        const center = width / 2;
        const laneXWorld = laneCenterX(laneIndex);
        const x = center + (laneXWorld - center) * (0.25 + 0.75 * t);
        return { x, y, scale, t };
    }

    function resetRun() {
        lane = 1;
        targetLane = 1;
        laneX = laneCenterX(1);
        playerYOffset = 0;
        jumpT = 0;
        slideT = 0;
        isJumping = false;
        isSliding = false;
        distance = 0;
        score = 0;
        looksCollected = 0;
        speed = 280;
        spawnTimer = 0;
        flashTimer = 0;
        entities = [];
        gameOver = false;
        running = true;
        lastTs = 0;
        updateHud();
        hideGameOver();
        seedStarterPack();
    }

    function seedStarterPack() {
        // A few easy collectibles to teach the loop
        for (let i = 0; i < 4; i++) {
            spawnClothing(180 + i * 160, i % LANES);
        }
        spawnObstacle(420, 0, 'barrier');
        spawnObstacle(620, 2, 'paparazzi');
    }

    function spawnClothing(z, laneIndex) {
        const type = CLOTHING_TYPES[Math.floor(Math.random() * CLOTHING_TYPES.length)];
        entities.push({
            kind: 'clothing',
            lane: laneIndex,
            z,
            w: 46,
            h: 46,
            type,
            hit: false
        });
    }

    function spawnObstacle(z, laneIndex, subtype) {
        const kinds = ['barrier', 'paparazzi', 'rope', 'flash'];
        const kind = subtype || kinds[Math.floor(Math.random() * kinds.length)];
        entities.push({
            kind: 'obstacle',
            subtype: kind,
            lane: laneIndex,
            z,
            w: kind === 'rope' ? 70 : 54,
            h: kind === 'paparazzi' ? 70 : 48,
            hit: false
        });
    }

    function trySpawn(dt) {
        spawnTimer -= dt;
        if (spawnTimer > 0) return;
        const gap = Math.max(0.55, 1.15 - distance / 4000);
        spawnTimer = gap;

        const z = 900 + Math.random() * 120;
        const lanePick = Math.floor(Math.random() * LANES);
        const roll = Math.random();

        if (roll < 0.55) {
            spawnClothing(z, lanePick);
            if (Math.random() < 0.35) {
                const other = (lanePick + 1 + Math.floor(Math.random() * 2)) % LANES;
                spawnClothing(z + 40, other);
            }
        } else {
            spawnObstacle(z, lanePick);
            // Rare double barrier forcing a lane change
            if (Math.random() < 0.25) {
                const other = (lanePick + 1 + Math.floor(Math.random() * 2)) % LANES;
                spawnObstacle(z + 30, other, 'barrier');
            }
        }
    }

    function updateHud() {
        const scoreEl = document.getElementById('scoreDisplay');
        const collectEl = document.getElementById('collectDisplay');
        const mapLabel = document.getElementById('mapLabel');
        if (scoreEl) scoreEl.textContent = String(Math.floor(score));
        if (collectEl) collectEl.textContent = `Looks: ${looksCollected}`;
        if (mapLabel) mapLabel.textContent = theme.name;
    }

    function setLane(next) {
        targetLane = Math.max(0, Math.min(LANES - 1, next));
    }

    function jump() {
        if (isJumping || isSliding || gameOver) return;
        isJumping = true;
        jumpT = 0;
    }

    function slide() {
        if (isJumping || isSliding || gameOver) return;
        isSliding = true;
        slideT = 0;
    }

    function toggleCamera() {
        cameraMode = cameraMode === 'back' ? 'front' : 'back';
        const label = document.getElementById('cameraToggleLabel');
        if (label) {
            label.textContent = cameraMode === 'back' ? 'Front Cam' : 'Back Cam';
        }
        const hint = document.getElementById('swipeHint');
        if (hint) {
            hint.textContent = cameraMode === 'front'
                ? 'Front cam · still swipe to dodge & collect'
                : 'Swipe ← → lanes · ↑ jump · ↓ slide';
        }
    }

    function updatePlayer(dt) {
        const targetX = laneCenterX(targetLane);
        laneX += (targetX - laneX) * Math.min(1, dt * 12);
        if (Math.abs(targetX - laneX) < 2) {
            lane = targetLane;
            laneX = targetX;
        }

        if (isJumping) {
            jumpT += dt;
            const dur = 0.55;
            const p = Math.min(1, jumpT / dur);
            playerYOffset = Math.sin(p * Math.PI) * 90;
            if (p >= 1) {
                isJumping = false;
                playerYOffset = 0;
            }
        } else if (isSliding) {
            slideT += dt;
            const dur = 0.45;
            if (slideT >= dur) {
                isSliding = false;
            }
        } else {
            playerYOffset = 0;
        }
    }

    function playerHitbox() {
        const baseY = height * 0.72 - playerYOffset;
        const scale = isSliding ? 0.55 : 1;
        const pw = 48;
        const ph = 78 * scale;
        return {
            x: laneX - pw / 2,
            y: baseY - ph,
            w: pw,
            h: ph,
            lane: targetLane,
            jumping: isJumping && playerYOffset > 30,
            sliding: isSliding
        };
    }

    function updateEntities(dt) {
        const move = speed * dt;
        distance += move * 0.08;
        score = Math.floor(distance) + looksCollected * 10;
        speed = Math.min(520, 280 + distance * 0.045);

        const hit = playerHitbox();

        for (let i = entities.length - 1; i >= 0; i--) {
            const e = entities[i];
            e.z -= move;

            if (e.z < -40) {
                entities.splice(i, 1);
                continue;
            }

            // Collision window near the player
            if (e.z > -10 && e.z < 55 && !e.hit) {
                const sameLane = e.lane === hit.lane || Math.abs(laneCenterX(e.lane) - laneX) < 28;
                if (!sameLane) continue;

                if (e.kind === 'clothing') {
                    e.hit = true;
                    looksCollected += 1;
                    score += e.type.points;
                    entities.splice(i, 1);
                    continue;
                }

                if (e.kind === 'obstacle') {
                    const canJump = e.subtype === 'rope' || e.subtype === 'barrier';
                    const canSlide = e.subtype === 'flash' || e.subtype === 'paparazzi';
                    if (canJump && hit.jumping) continue;
                    if (canSlide && hit.sliding) continue;
                    // Paparazzi barriers always hurt unless jumped/slid appropriately
                    e.hit = true;
                    endGame();
                    return;
                }
            }
        }

        trySpawn(dt);
        if (flashTimer > 0) flashTimer -= dt;
    }

    function endGame() {
        gameOver = true;
        running = false;
        updateHud();
        showGameOver();
    }

    function hideGameOver() {
        const el = document.querySelector('.game-over-screen');
        if (el) el.remove();
    }

    function showGameOver() {
        hideGameOver();
        const screen = document.createElement('div');
        screen.className = 'game-over-screen';
        screen.innerHTML = `
            <h2>Runway Wipeout</h2>
            <p>Score: ${Math.floor(score)}</p>
            <p class="game-over-meta">Looks collected: ${looksCollected}</p>
            <button id="restartBtn" class="game-btn">Walk Again</button>
            <a href="map-select.html" class="game-btn" style="margin-top:10px;display:inline-block;">Change City</a>
        `;
        document.getElementById('gameRoot').appendChild(screen);
        document.getElementById('restartBtn').addEventListener('click', () => {
            resetRun();
            lastTs = 0;
            running = true;
            loop(performance.now());
        });
    }

    function drawBackground() {
        const g = ctx.createLinearGradient(0, 0, 0, height);
        g.addColorStop(0, theme.skyTop);
        g.addColorStop(1, theme.skyBottom);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, width, height);

        // Soft city silhouettes
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        const horizon = height * 0.28;
        for (let i = 0; i < 12; i++) {
            const bx = (i / 12) * width + ((distance * 0.02) % 40);
            const bh = 40 + ((i * 37) % 90);
            const bw = 18 + (i % 3) * 10;
            ctx.fillRect(bx, horizon - bh, bw, bh);
        }

        // Crowds / stands flanking runway
        ctx.fillStyle = theme.crowd;
        ctx.beginPath();
        ctx.moveTo(0, height * 0.35);
        ctx.lineTo(width * 0.18, height * 0.88);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(width, height * 0.35);
        ctx.lineTo(width * 0.82, height * 0.88);
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();

        drawRunway();
        drawCityAccent();
    }

    function drawRunway() {
        const topL = width * 0.42;
        const topR = width * 0.58;
        const botL = width * 0.12;
        const botR = width * 0.88;
        const topY = height * 0.28;
        const botY = height * 0.92;

        ctx.fillStyle = theme.runway;
        ctx.beginPath();
        ctx.moveTo(topL, topY);
        ctx.lineTo(topR, topY);
        ctx.lineTo(botR, botY);
        ctx.lineTo(botL, botY);
        ctx.closePath();
        ctx.fill();

        // Edge glow
        ctx.strokeStyle = theme.runwayEdge;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(topL, topY);
        ctx.lineTo(botL, botY);
        ctx.moveTo(topR, topY);
        ctx.lineTo(botR, botY);
        ctx.stroke();

        // Lane dividers with scroll dashes
        ctx.strokeStyle = theme.laneLine;
        ctx.lineWidth = 2;
        ctx.setLineDash([18, 22]);
        ctx.lineDashOffset = -(distance * 2.2) % 40;
        for (let i = 1; i < LANES; i++) {
            const t = i / LANES;
            const xTop = topL + (topR - topL) * t;
            const xBot = botL + (botR - botL) * t;
            ctx.beginPath();
            ctx.moveTo(xTop, topY);
            ctx.lineTo(xBot, botY);
            ctx.stroke();
        }
        ctx.setLineDash([]);
    }

    function drawCityAccent() {
        ctx.save();
        ctx.fillStyle = theme.accent;
        ctx.globalAlpha = 0.85;
        ctx.font = `bold ${Math.floor(width * 0.045)}px Fredoka One, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(theme.name.toUpperCase(), width / 2, height * 0.08);
        ctx.restore();
    }

    function drawEntity(e) {
        const p = project(Math.max(0, e.z), e.lane);
        const size = Math.max(12, e.w * p.scale * 1.6);
        const x = p.x;
        const y = p.y - size * 0.35;

        if (e.kind === 'clothing') {
            ctx.save();
            ctx.translate(x, y - playerYOffset * 0.02);
            ctx.font = `${Math.floor(size)}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // Soft glow disc
            ctx.beginPath();
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.arc(0, 0, size * 0.55, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillText(e.type.emoji, 0, 0);
            ctx.restore();
            return;
        }

        // Obstacles
        ctx.save();
        const hw = size * 0.7;
        const hh = size * (e.subtype === 'paparazzi' ? 1.1 : 0.75);
        if (e.subtype === 'paparazzi') {
            // Barrier + camera flash guy
            ctx.fillStyle = '#111';
            ctx.fillRect(x - hw, y - hh, hw * 2, hh);
            ctx.fillStyle = theme.accent;
            ctx.fillRect(x - hw, y - hh, hw * 2, 6);
            ctx.font = `${Math.floor(size * 0.7)}px serif`;
            ctx.textAlign = 'center';
            ctx.fillText('📸', x, y - hh - 8);
            if (Math.random() < 0.08) flashTimer = 0.12;
        } else if (e.subtype === 'rope') {
            ctx.strokeStyle = '#7c2d12';
            ctx.lineWidth = 4 * p.scale * 3;
            ctx.beginPath();
            ctx.moveTo(x - hw, y);
            ctx.quadraticCurveTo(x, y - hh * 0.4, x + hw, y);
            ctx.stroke();
            ctx.fillStyle = '#111';
            ctx.fillRect(x - hw - 4, y - 8, 8, 20);
            ctx.fillRect(x + hw - 4, y - 8, 8, 20);
        } else if (e.subtype === 'flash') {
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.beginPath();
            ctx.arc(x, y - hh * 0.2, size * 0.35, 0, Math.PI * 2);
            ctx.fill();
            ctx.font = `${Math.floor(size * 0.55)}px serif`;
            ctx.textAlign = 'center';
            ctx.fillText('💥', x, y + 4);
        } else {
            // Velvet barrier
            ctx.fillStyle = '#111';
            ctx.fillRect(x - hw, y - hh * 0.35, hw * 2, hh * 0.55);
            ctx.fillStyle = '#9f1239';
            ctx.fillRect(x - hw, y - hh * 0.35, hw * 2, 8);
            ctx.fillStyle = '#eab308';
            ctx.font = `bold ${Math.floor(10 + size * 0.2)}px Fredoka One, sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('NO ENTRY', x, y + 4);
        }
        ctx.restore();
    }

    function drawPlayer() {
        const baseY = height * 0.72 - playerYOffset;
        const pw = isSliding ? 70 : 56;
        const ph = isSliding ? 42 : 96;
        const x = laneX;
        const y = baseY;

        ctx.save();
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(x, height * 0.74, pw * 0.35, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        if (cameraMode === 'front') {
            // Front-facing: mirror/flip vertically-ish by drawing larger face-on
            ctx.translate(x, y - ph * 0.55);
            ctx.scale(-1, 1); // face "toward" camera feel via horizontal flip + label
            if (characterImg && characterImg.complete) {
                ctx.drawImage(characterImg, -pw / 2, -ph / 2, pw, ph);
            } else {
                ctx.fillStyle = '#fff';
                ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
            }
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.fillStyle = theme.accent;
            ctx.font = `bold 12px Fredoka One, sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('FRONT CAM', x, y - ph - 8);
        } else {
            if (characterImg && characterImg.complete) {
                ctx.drawImage(characterImg, x - pw / 2, y - ph, pw, ph);
            } else {
                ctx.fillStyle = '#fff';
                ctx.fillRect(x - pw / 2, y - ph, pw, ph);
            }
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = `bold 11px Fredoka One, sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('BACK CAM', x, y - ph - 8);
        }

        if (isJumping) {
            ctx.fillStyle = theme.accent;
            ctx.font = '10px Fredoka One, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('JUMP', x, y - ph - 22);
        }
        if (isSliding) {
            ctx.fillStyle = theme.accent;
            ctx.font = '10px Fredoka One, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('SLIDE', x, y + 14);
        }
        ctx.restore();
    }

    function drawFlash() {
        if (flashTimer <= 0) return;
        ctx.fillStyle = `rgba(255,255,255,${Math.min(0.55, flashTimer * 4)})`;
        ctx.fillRect(0, 0, width, height);
    }

    function drawFrame() {
        drawBackground();

        // Sort far to near
        const sorted = entities.slice().sort((a, b) => b.z - a.z);
        for (const e of sorted) {
            if (e.z > 0) drawEntity(e);
        }

        drawPlayer();
        drawFlash();

        // Near entities (passed player) optional — skip
        updateHud();
    }

    function loop(ts) {
        if (!running) return;
        if (!lastTs) lastTs = ts;
        let dt = (ts - lastTs) / 1000;
        lastTs = ts;
        dt = Math.min(0.033, dt);

        updatePlayer(dt);
        if (!gameOver) updateEntities(dt);
        drawFrame();

        rafId = requestAnimationFrame(loop);
    }

    function onSwipe(dx, dy) {
        if (gameOver) return;
        const ax = Math.abs(dx);
        const ay = Math.abs(dy);
        if (ax < 24 && ay < 24) return;
        if (ax > ay) {
            if (dx < 0) setLane(targetLane - 1);
            else setLane(targetLane + 1);
        } else {
            if (dy < 0) jump();
            else slide();
        }
    }

    function setupInput() {
        const surface = canvas;

        surface.addEventListener('touchstart', (e) => {
            const t = e.changedTouches[0];
            touchActive = true;
            touchStartX = t.clientX;
            touchStartY = t.clientY;
        }, { passive: true });

        surface.addEventListener('touchend', (e) => {
            if (!touchActive) return;
            const t = e.changedTouches[0];
            onSwipe(t.clientX - touchStartX, t.clientY - touchStartY);
            touchActive = false;
        }, { passive: true });

        let mouseDown = false;
        let mx = 0;
        let my = 0;
        surface.addEventListener('mousedown', (e) => {
            mouseDown = true;
            mx = e.clientX;
            my = e.clientY;
        });
        window.addEventListener('mouseup', (e) => {
            if (!mouseDown) return;
            mouseDown = false;
            onSwipe(e.clientX - mx, e.clientY - my);
        });

        window.addEventListener('keydown', (e) => {
            if (gameOver) return;
            if (e.key === 'ArrowLeft' || e.key === 'a') setLane(targetLane - 1);
            if (e.key === 'ArrowRight' || e.key === 'd') setLane(targetLane + 1);
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') {
                e.preventDefault();
                jump();
            }
            if (e.key === 'ArrowDown' || e.key === 's') {
                e.preventDefault();
                slide();
            }
            if (e.key === 'c' || e.key === 'C') toggleCamera();
        });

        const left = document.getElementById('leftArrow');
        const right = document.getElementById('rightArrow');
        const up = document.getElementById('upArrow');
        const down = document.getElementById('downArrow');
        if (left) left.addEventListener('click', () => setLane(targetLane - 1));
        if (right) right.addEventListener('click', () => setLane(targetLane + 1));
        if (up) up.addEventListener('click', jump);
        if (down) down.addEventListener('click', slide);

        const camBtn = document.getElementById('cameraToggleBtn');
        if (camBtn) camBtn.addEventListener('click', toggleCamera);

        // Hide swipe hint after first input
        const hideHint = () => {
            const hint = document.getElementById('swipeHint');
            if (hint) hint.classList.add('hidden');
        };
        surface.addEventListener('pointerdown', hideHint, { once: true });
    }

    function loadCharacter() {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => {
                const fallback = new Image();
                fallback.onload = () => resolve(fallback);
                fallback.onerror = () => resolve(null);
                fallback.src = 'chibidoll2.png';
            };
            img.src = readOutfitImage();
        });
    }

    async function init() {
        canvas = document.getElementById('gameCanvas');
        ctx = canvas.getContext('2d');
        theme = readMapTheme();
        characterImg = await loadCharacter();

        resize();
        window.addEventListener('resize', resize);
        setupInput();
        resetRun();
        rafId = requestAnimationFrame(loop);
    }

    document.addEventListener('DOMContentLoaded', init);
})();
