(() => {
    const LANES = 3;

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
    let levelComplete = false;
    let rafId = 0;
    let lastTs = 0;

    let theme = MAP_THEMES.newyork;
    let show = null;
    let characterImg = null;
    let finaleImg = null;
    let cameraMode = 'back';

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
    let rareCollected = 0;
    let speed = 280;
    let spawnTimer = 0;
    let flashTimer = 0;
    let shieldTimer = 0;

    // Outfit progression: index into show.pieces (0 = nameless street)
    let outfitStage = 0;
    let ownedSlots = { base: true };
    /** @type {Array<{text:string,color:string,life:number,x:number,y:number,vy:number}>} */
    let floatTexts = [];
    /** @type {Array<{x:number,y:number,vx:number,vy:number,life:number,color:string,r:number}>} */
    let particles = [];
    let dressAnimT = 0;
    let dressAnimPiece = null;
    let dressPulse = 0;

    /** @type {Array<object>} */
    let entities = [];

    let touchStartX = 0;
    let touchStartY = 0;
    let touchActive = false;

    function readCityId() {
        try {
            const map = JSON.parse(localStorage.getItem('selectedMap') || 'null');
            if (map && map.id) return map.id;
        } catch (_) { /* ignore */ }
        return 'newyork';
    }

    function readShow() {
        const cityId = readCityId();
        let showId = null;
        try {
            const raw = JSON.parse(localStorage.getItem('selectedShow') || 'null');
            if (raw && raw.id) showId = raw.id;
        } catch (_) { /* ignore */ }
        if (window.getShowById) return window.getShowById(cityId, showId);
        return null;
    }

    function readFinaleImage() {
        try {
            const raw = localStorage.getItem('selectedOutfit');
            if (raw) {
                const outfit = JSON.parse(raw);
                if (outfit && outfit.image) return outfit.image;
            }
        } catch (_) { /* ignore */ }
        const character = localStorage.getItem('selectedCharacter');
        return character === 'male' ? 'chibibrodoll2.png' : 'chibidollfashion.png';
    }

    function readStreetImage() {
        const character = localStorage.getItem('selectedCharacter');
        if (character === 'male') return 'chibibrodoll.png';
        if (character === 'evening') return 'chibidoll3.png';
        return 'chibidoll2.png';
    }

    function readMapTheme() {
        const id = readCityId();
        return MAP_THEMES[id] || MAP_THEMES.newyork;
    }

    function boost() {
        return (show && show.boost) || {
            jumpMult: 1, magnet: 0, speedMult: 1, scoreMult: 1, slideMult: 1, obstacleBias: 1, collectShield: 0
        };
    }

    function nextDressPiece() {
        if (!show) return null;
        for (let i = 1; i < show.pieces.length; i++) {
            const p = show.pieces[i];
            if (!ownedSlots[p.slot]) return p;
        }
        return null;
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
        rareCollected = 0;
        speed = 280 * boost().speedMult;
        spawnTimer = 0;
        flashTimer = 0;
        shieldTimer = 0;
        outfitStage = 0;
        ownedSlots = { base: true };
        floatTexts = [];
        particles = [];
        dressAnimT = 0;
        dressAnimPiece = null;
        dressPulse = 0;
        entities = [];
        gameOver = false;
        levelComplete = false;
        running = true;
        lastTs = 0;
        updateHud();
        hideOverlay();
        seedStarterPack();
        pushFloat('Street clothes · get dressed!', '#fff', laneX, height * 0.55);
    }

    function seedStarterPack() {
        const next = nextDressPiece();
        if (next && !next.rare) spawnPiece(200, 1, next, false);
        spawnPiece(360, 0, pickCommonPiece(), false);
        spawnPiece(520, 2, pickCommonPiece(), false);
        spawnObstacle(640, 0, 'barrier');
        spawnObstacle(820, 2, 'paparazzi');
    }

    function pickCommonPiece() {
        if (!show) return { id: 'tee', name: 'Top', slot: 'top', color: '#888', label: 'TOP' };
        const commons = show.pieces.filter((p) => p.slot !== 'base' && !p.rare);
        return commons[Math.floor(Math.random() * commons.length)] || show.pieces[1];
    }

    function spawnPiece(z, laneIndex, piece, isRare) {
        const p = piece || (isRare ? show.rareGoal : pickCommonPiece());
        const rare = !!(isRare || (p && p.rare) || (show && p && p.id === show.rareGoal.id));
        entities.push({
            kind: 'clothing',
            lane: laneIndex,
            z,
            w: rare ? 54 : 46,
            h: rare ? 54 : 46,
            type: {
                id: p.id || show.rareGoal.id,
                label: rare ? (show.rareGoal.label) : (p.name || p.label || 'LOOK').split(' ').pop().toUpperCase().slice(0, 8),
                name: rare ? show.rareGoal.fullName : (p.name || 'Look'),
                color: rare ? show.rareGoal.color : (p.color || '#ec4899'),
                points: rare ? show.rareGoal.points : 25,
                slot: p.slot || show.rareGoal.slot,
                rare
            },
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

    function rareSpawnChance() {
        // Rares drop more as the level progresses
        const progress = Math.min(1, distance / 2500);
        const base = 0.08 + progress * 0.42;
        if (rareCollected >= (show?.rareGoal?.target || 3)) return base * 0.35;
        return base;
    }

    function trySpawn(dt) {
        spawnTimer -= dt;
        if (spawnTimer > 0) return;
        const gap = Math.max(0.5, 1.1 - distance / 4200);
        spawnTimer = gap;

        const z = 900 + Math.random() * 140;
        const lanePick = Math.floor(Math.random() * LANES);
        const obstacleBias = boost().obstacleBias || 1;
        const roll = Math.random();

        if (roll < 0.58) {
            if (Math.random() < rareSpawnChance()) {
                spawnPiece(z, lanePick, show.rareGoal, true);
            } else {
                const next = nextDressPiece();
                // Bias toward the next missing wardrobe piece so dress-up feels intentional
                if (next && !next.rare && Math.random() < 0.55) {
                    spawnPiece(z, lanePick, next, false);
                } else {
                    spawnPiece(z, lanePick, pickCommonPiece(), false);
                }
            }
            if (Math.random() < 0.3) {
                const other = (lanePick + 1 + Math.floor(Math.random() * 2)) % LANES;
                spawnPiece(z + 50, other, pickCommonPiece(), false);
            }
        } else if (Math.random() < obstacleBias) {
            spawnObstacle(z, lanePick);
            if (Math.random() < 0.22) {
                const other = (lanePick + 1 + Math.floor(Math.random() * 2)) % LANES;
                spawnObstacle(z + 30, other, 'barrier');
            }
        } else {
            spawnPiece(z, lanePick, pickCommonPiece(), false);
        }
    }

    function updateHud() {
        const scoreEl = document.getElementById('scoreDisplay');
        const collectEl = document.getElementById('collectDisplay');
        const mapLabel = document.getElementById('mapLabel');
        const showLabel = document.getElementById('showLabel');
        const goalEl = document.getElementById('goalDisplay');
        const outfitEl = document.getElementById('outfitDisplay');
        const boostEl = document.getElementById('boostDisplay');

        if (scoreEl) scoreEl.textContent = String(Math.floor(score));
        if (collectEl) collectEl.textContent = `Looks: ${looksCollected}`;
        if (mapLabel) mapLabel.textContent = theme.name;
        if (showLabel && show) showLabel.textContent = `Walking for ${show.designer}`;
        if (goalEl && show) {
            goalEl.textContent = `${show.rareGoal.label}: ${rareCollected}/${show.rareGoal.target}`;
            goalEl.classList.toggle('goal-done', rareCollected >= show.rareGoal.target);
        }
        if (outfitEl && show) {
            const piece = show.pieces[Math.min(outfitStage, show.pieces.length - 1)];
            outfitEl.textContent = piece ? piece.name : 'Nameless Street';
        }
        if (boostEl && show) boostEl.textContent = show.boost.name;
        renderWardrobeTrack();
    }

    function renderWardrobeTrack() {
        const track = document.getElementById('wardrobeTrack');
        if (!track || !show) return;
        track.innerHTML = '';
        show.pieces.forEach((piece, idx) => {
            if (piece.slot === 'base') return;
            const chip = document.createElement('div');
            chip.className = 'wardrobe-chip';
            const owned = !!ownedSlots[piece.slot];
            if (owned) chip.classList.add('owned');
            if (dressAnimPiece && dressAnimPiece.slot === piece.slot && dressAnimT > 0) chip.classList.add('flash');
            if (piece.rare) chip.classList.add('rare');
            chip.style.setProperty('--chip-color', piece.color);
            chip.textContent = piece.rare ? '★' : String(idx);
            // clearer 1..N after skipping base
            const visibleIndex = show.pieces.filter((p) => p.slot !== 'base').indexOf(piece) + 1;
            chip.textContent = piece.rare ? '★' : String(visibleIndex);
            chip.title = piece.name;
            track.appendChild(chip);
        });
    }

    function setLane(next) {
        targetLane = Math.max(0, Math.min(LANES - 1, next));
    }

    function jump() {
        if (isJumping || isSliding || gameOver || levelComplete) return;
        isJumping = true;
        jumpT = 0;
    }

    function slide() {
        if (isJumping || isSliding || gameOver || levelComplete) return;
        isSliding = true;
        slideT = 0;
    }

    function toggleCamera() {
        cameraMode = cameraMode === 'back' ? 'front' : 'back';
        const label = document.getElementById('cameraToggleLabel');
        if (label) label.textContent = cameraMode === 'back' ? 'Front Cam' : 'Back Cam';
        const hint = document.getElementById('swipeHint');
        if (hint) {
            hint.textContent = cameraMode === 'front'
                ? 'Front cam · collect looks to get dressed'
                : 'Swipe ← → · dress up as you collect';
        }
    }

    function pushFloat(text, color, x, y) {
        floatTexts.push({ text, color, life: 1.1, x, y, vy: -42 });
    }

    function burst(x, y, color) {
        for (let i = 0; i < 18; i++) {
            const a = Math.random() * Math.PI * 2;
            const sp = 40 + Math.random() * 120;
            particles.push({
                x, y,
                vx: Math.cos(a) * sp,
                vy: Math.sin(a) * sp - 40,
                life: 0.45 + Math.random() * 0.35,
                color,
                r: 2 + Math.random() * 3
            });
        }
    }

    function triggerDressAnimation(piece) {
        dressAnimPiece = piece;
        dressAnimT = 0.85;
        dressPulse = 1;
        const baseY = height * 0.72 - playerYOffset;
        burst(laneX, baseY - 50, piece.color || show.accent);
        pushFloat(`+${piece.name}`, piece.color || '#fff', laneX, baseY - 100);
    }

    function grantOutfitPiece(pieceLike) {
        if (!show || !pieceLike) return false;
        const slot = pieceLike.slot;
        if (!slot || slot === 'base') return false;
        if (ownedSlots[slot]) return false;

        // Only unlock if it's the next sequential piece OR it's a rare that matches its slot when prior pieces owned
        const next = nextDressPiece();
        const piece = show.pieces.find((p) => p.slot === slot) || pieceLike;
        if (next && next.slot !== slot) {
            // Allow rare goal pieces to fill their slot early only if all earlier non-rare slots are owned
            const idx = show.pieces.findIndex((p) => p.slot === slot);
            for (let i = 1; i < idx; i++) {
                if (!ownedSlots[show.pieces[i].slot]) return false;
            }
        }

        ownedSlots[slot] = true;
        let stage = 0;
        for (let i = 0; i < show.pieces.length; i++) {
            if (show.pieces[i].slot === 'base' || ownedSlots[show.pieces[i].slot]) stage = i;
            else break;
        }
        outfitStage = stage;
        triggerDressAnimation(piece);
        return true;
    }

    function onCollectClothing(type) {
        const scoreMult = boost().scoreMult || 1;
        looksCollected += 1;
        score += Math.floor(type.points * scoreMult);

        if (type.rare) {
            rareCollected += 1;
            pushFloat(`${type.name}!`, type.color, laneX, height * 0.48);
        }

        grantOutfitPiece(type);

        if (boost().collectShield) {
            shieldTimer = Math.max(shieldTimer, boost().collectShield);
        }

        if (show && rareCollected >= show.rareGoal.target) {
            completeLevel();
        }
    }

    function updatePlayer(dt) {
        const targetX = laneCenterX(targetLane);
        laneX += (targetX - laneX) * Math.min(1, dt * 12);
        if (Math.abs(targetX - laneX) < 2) {
            lane = targetLane;
            laneX = targetX;
        }

        const jumpMult = boost().jumpMult || 1;
        const slideMult = boost().slideMult || 1;

        if (isJumping) {
            jumpT += dt;
            const dur = 0.55;
            const p = Math.min(1, jumpT / dur);
            playerYOffset = Math.sin(p * Math.PI) * (90 * jumpMult);
            if (p >= 1) {
                isJumping = false;
                playerYOffset = 0;
            }
        } else if (isSliding) {
            slideT += dt;
            const dur = 0.45 * slideMult;
            if (slideT >= dur) isSliding = false;
        } else {
            playerYOffset = 0;
        }

        if (dressAnimT > 0) dressAnimT = Math.max(0, dressAnimT - dt);
        if (dressPulse > 0) dressPulse = Math.max(0, dressPulse - dt * 1.8);
        if (shieldTimer > 0) shieldTimer = Math.max(0, shieldTimer - dt);

        // Soft magnet toward nearby clothing
        const mag = boost().magnet || 0;
        if (mag > 0) {
            for (const e of entities) {
                if (e.kind !== 'clothing' || e.z > 90 || e.z < 0) continue;
                const dx = laneX - laneCenterX(e.lane);
                if (Math.abs(dx) < mag + 40 && Math.abs(dx) > 4) {
                    // Nudge entity lane toward player by shifting projected lane gradually via z-side pull on lane index
                    if (Math.abs(dx) < mag + 10 && e.lane !== targetLane && Math.random() < dt * 3) {
                        e.lane = targetLane;
                    }
                }
            }
        }
    }

    function playerHitbox() {
        const baseY = height * 0.72 - playerYOffset;
        const scale = isSliding ? 0.55 : 1;
        const mag = (boost().magnet || 0) * 0.35;
        const pw = 48 + mag;
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
        score = Math.max(score, Math.floor(distance) + looksCollected * 10 + rareCollected * 50);
        speed = Math.min(560, (280 + distance * 0.045) * boost().speedMult);

        const hit = playerHitbox();

        for (let i = entities.length - 1; i >= 0; i--) {
            const e = entities[i];
            e.z -= move;

            if (e.z < -40) {
                entities.splice(i, 1);
                continue;
            }

            if (e.z > -10 && e.z < 58 && !e.hit) {
                const sameLane = e.lane === hit.lane || Math.abs(laneCenterX(e.lane) - laneX) < 28 + (boost().magnet || 0) * 0.25;
                if (!sameLane) continue;

                if (e.kind === 'clothing') {
                    e.hit = true;
                    onCollectClothing(e.type);
                    burst(laneX, height * 0.62, e.type.color);
                    entities.splice(i, 1);
                    continue;
                }

                if (e.kind === 'obstacle') {
                    if (shieldTimer > 0) continue;
                    const canJump = e.subtype === 'rope' || e.subtype === 'barrier';
                    const canSlide = e.subtype === 'flash' || e.subtype === 'paparazzi';
                    if (canJump && hit.jumping) continue;
                    if (canSlide && hit.sliding) continue;
                    e.hit = true;
                    endGame();
                    return;
                }
            }
        }

        trySpawn(dt);
        if (flashTimer > 0) flashTimer -= dt;

        for (let i = floatTexts.length - 1; i >= 0; i--) {
            const f = floatTexts[i];
            f.life -= dt;
            f.y += f.vy * dt;
            if (f.life <= 0) floatTexts.splice(i, 1);
        }
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.life -= dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 180 * dt;
            if (p.life <= 0) particles.splice(i, 1);
        }
    }

    function endGame() {
        gameOver = true;
        running = false;
        updateHud();
        showOverlay(false);
    }

    function completeLevel() {
        if (levelComplete) return;
        levelComplete = true;
        running = false;
        score += 500;
        updateHud();
        showOverlay(true);
    }

    function hideOverlay() {
        const el = document.querySelector('.game-over-screen');
        if (el) el.remove();
    }

    function showOverlay(won) {
        hideOverlay();
        const screen = document.createElement('div');
        screen.className = 'game-over-screen';
        const lookName = show?.pieces[Math.min(outfitStage, show.pieces.length - 1)]?.name || 'Street';
        if (won) {
            screen.innerHTML = `
                <h2>Show Complete</h2>
                <p>Walked for ${show.designer}</p>
                <p class="game-over-meta">${show.rareGoal.fullName}: ${rareCollected}/${show.rareGoal.target}</p>
                <p class="game-over-meta">Final look: ${lookName}</p>
                <p>Score: ${Math.floor(score)}</p>
                <button id="restartBtn" class="game-btn">Walk Again</button>
                <a href="show-select.html" class="game-btn" style="margin-top:10px;display:inline-block;">Change Show</a>
            `;
        } else {
            screen.innerHTML = `
                <h2>Runway Wipeout</h2>
                <p>Score: ${Math.floor(score)}</p>
                <p class="game-over-meta">${show ? show.designer : 'Show'}: ${rareCollected}/${show?.rareGoal?.target || 0} rares</p>
                <p class="game-over-meta">Dressed: ${lookName}</p>
                <button id="restartBtn" class="game-btn">Walk Again</button>
                <a href="show-select.html" class="game-btn" style="margin-top:10px;display:inline-block;">Change Show</a>
            `;
        }
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

        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        const horizon = height * 0.28;
        for (let i = 0; i < 12; i++) {
            const bx = (i / 12) * width + ((distance * 0.02) % 40);
            const bh = 40 + ((i * 37) % 90);
            const bw = 18 + (i % 3) * 10;
            ctx.fillRect(bx, horizon - bh, bw, bh);
        }

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

        ctx.strokeStyle = show?.accent || theme.runwayEdge;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(topL, topY);
        ctx.lineTo(botL, botY);
        ctx.moveTo(topR, topY);
        ctx.lineTo(botR, botY);
        ctx.stroke();

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

    function drawEntity(e) {
        const p = project(Math.max(0, e.z), e.lane);
        const size = Math.max(12, e.w * p.scale * 1.6);
        const x = p.x;
        const y = p.y - size * 0.35;

        if (e.kind === 'clothing') {
            ctx.save();
            ctx.translate(x, y);
            const r = size * (e.type.rare ? 0.52 : 0.45);
            ctx.beginPath();
            ctx.fillStyle = e.type.rare ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.22)';
            ctx.arc(0, 0, r * 1.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.fillStyle = e.type.color;
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = e.type.rare ? '#fbbf24' : '#fff';
            ctx.lineWidth = Math.max(1.5, 2.2 * p.scale);
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${Math.max(7, Math.floor(size * 0.24))}px Fredoka One, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(e.type.label, 0, 0);
            if (e.type.rare) {
                ctx.fillStyle = '#fbbf24';
                ctx.font = `bold ${Math.max(7, Math.floor(size * 0.18))}px Fredoka One, sans-serif`;
                ctx.fillText('RARE', 0, r + 10);
            }
            ctx.restore();
            return;
        }

        ctx.save();
        const hw = size * 0.7;
        const hh = size * (e.subtype === 'paparazzi' ? 1.1 : 0.75);
        if (e.subtype === 'paparazzi') {
            ctx.fillStyle = '#111';
            ctx.fillRect(x - hw, y - hh, hw * 2, hh);
            ctx.fillStyle = theme.accent;
            ctx.fillRect(x - hw, y - hh, hw * 2, 6);
            ctx.fillStyle = '#222';
            ctx.fillRect(x - size * 0.25, y - hh - size * 0.45, size * 0.5, size * 0.35);
            ctx.fillStyle = '#111';
            ctx.beginPath();
            ctx.arc(x, y - hh - size * 0.28, size * 0.14, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${Math.max(8, Math.floor(size * 0.22))}px Fredoka One, sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('PAPS', x, y - hh - size * 0.55);
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
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.beginPath();
            ctx.arc(x, y - hh * 0.2, size * 0.35, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI * 2;
                const r1 = size * 0.18;
                const r2 = size * 0.4;
                const px = x + Math.cos(a) * (i % 2 ? r1 : r2);
                const py = y - hh * 0.2 + Math.sin(a) * (i % 2 ? r1 : r2);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#111';
            ctx.font = `bold ${Math.max(8, Math.floor(size * 0.22))}px Fredoka One, sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('FLASH', x, y + 10);
        } else {
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

    function drawOutfitLayers(x, y, pw, ph, facingFront) {
        if (!show) return;
        const pieces = show.pieces;
        ctx.save();
        if (facingFront) {
            ctx.translate(x, y);
            ctx.scale(-1, 1);
            x = 0;
            y = 0;
        }

        // Progressive clothing overlays that "dress" the model
        const drawSlot = (slot, rect) => {
            if (!ownedSlots[slot]) return;
            const piece = pieces.find((p) => p.slot === slot);
            if (!piece) return;
            ctx.globalAlpha = 0.72;
            ctx.fillStyle = piece.color;
            ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
            ctx.globalAlpha = 1;
            ctx.strokeStyle = 'rgba(255,255,255,0.35)';
            ctx.lineWidth = 1;
            ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
        };

        // Street base wash
        ctx.globalAlpha = outfitStage === 0 ? 0.35 : 0.12;
        ctx.fillStyle = '#9ca3af';
        ctx.fillRect(x - pw * 0.42, y - ph * 0.92, pw * 0.84, ph * 0.9);
        ctx.globalAlpha = 1;

        drawSlot('bottoms', { x: x - pw * 0.38, y: y - ph * 0.42, w: pw * 0.76, h: ph * 0.4 });
        drawSlot('top', { x: x - pw * 0.4, y: y - ph * 0.78, w: pw * 0.8, h: ph * 0.38 });
        drawSlot('shoes', { x: x - pw * 0.4, y: y - ph * 0.08, w: pw * 0.8, h: ph * 0.12 });
        drawSlot('outer', { x: x - pw * 0.48, y: y - ph * 0.82, w: pw * 0.96, h: ph * 0.55 });
        drawSlot('finale', { x: x - pw * 0.2, y: y - ph * 0.95, w: pw * 0.4, h: ph * 0.12 });

        // Dress-up flying piece animation
        if (dressAnimT > 0 && dressAnimPiece) {
            const t = 1 - dressAnimT / 0.85;
            const ease = 1 - Math.pow(1 - t, 3);
            const fromY = y - ph - 80;
            const toY = y - ph * 0.55;
            const py = fromY + (toY - fromY) * ease;
            const scale = 1.4 - ease * 0.5;
            ctx.globalAlpha = 1 - t * 0.3;
            ctx.fillStyle = dressAnimPiece.color || '#fff';
            ctx.beginPath();
            ctx.arc(x, py, 16 * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${Math.floor(10 * scale)}px Fredoka One, sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText((dressAnimPiece.name || '').split(' ').pop().toUpperCase(), x, py + 3);
            ctx.globalAlpha = 1;
        }

        ctx.restore();
    }

    function drawPlayer() {
        const baseY = height * 0.72 - playerYOffset;
        const pulse = 1 + dressPulse * 0.15;
        const pw = (isSliding ? 70 : 56) * pulse;
        const ph = (isSliding ? 42 : 96) * pulse;
        const x = laneX;
        const y = baseY;
        const useFinale = outfitStage >= (show?.pieces.length || 1) - 1 && finaleImg;
        const img = useFinale ? finaleImg : characterImg;

        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(x, height * 0.74, pw * 0.35, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        if (shieldTimer > 0) {
            ctx.strokeStyle = `rgba(255,255,255,${0.35 + shieldTimer})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(x, y - ph * 0.45, pw * 0.7, ph * 0.55, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        if (cameraMode === 'front') {
            ctx.save();
            ctx.translate(x, y - ph * 0.55);
            ctx.scale(-1, 1);
            if (img && img.complete) ctx.drawImage(img, -pw / 2, -ph / 2, pw, ph);
            else {
                ctx.fillStyle = '#fff';
                ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
            }
            ctx.restore();
            drawOutfitLayers(x, y, pw, ph, false);
            ctx.fillStyle = show?.accent || theme.accent;
            ctx.font = 'bold 12px Fredoka One, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('FRONT CAM', x, y - ph - 8);
        } else {
            if (img && img.complete) ctx.drawImage(img, x - pw / 2, y - ph, pw, ph);
            else {
                ctx.fillStyle = '#fff';
                ctx.fillRect(x - pw / 2, y - ph, pw, ph);
            }
            drawOutfitLayers(x, y, pw, ph, false);
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = 'bold 11px Fredoka One, sans-serif';
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

    function drawFx() {
        for (const p of particles) {
            ctx.globalAlpha = Math.max(0, p.life * 2);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        for (const f of floatTexts) {
            ctx.globalAlpha = Math.max(0, f.life);
            ctx.fillStyle = f.color;
            ctx.font = 'bold 14px Fredoka One, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(f.text, f.x, f.y);
            ctx.globalAlpha = 1;
        }
        if (flashTimer > 0) {
            ctx.fillStyle = `rgba(255,255,255,${Math.min(0.55, flashTimer * 4)})`;
            ctx.fillRect(0, 0, width, height);
        }
    }

    function drawFrame() {
        drawBackground();
        const sorted = entities.slice().sort((a, b) => b.z - a.z);
        for (const e of sorted) {
            if (e.z > 0) drawEntity(e);
        }
        drawPlayer();
        drawFx();
        updateHud();
    }

    function loop(ts) {
        if (!running) return;
        if (!lastTs) lastTs = ts;
        let dt = (ts - lastTs) / 1000;
        lastTs = ts;
        dt = Math.min(0.033, dt);

        updatePlayer(dt);
        if (!gameOver && !levelComplete) updateEntities(dt);
        drawFrame();
        rafId = requestAnimationFrame(loop);
    }

    function onSwipe(dx, dy) {
        if (gameOver || levelComplete) return;
        const ax = Math.abs(dx);
        const ay = Math.abs(dy);
        if (ax < 24 && ay < 24) return;
        if (ax > ay) {
            if (dx < 0) setLane(targetLane - 1);
            else setLane(targetLane + 1);
        } else if (dy < 0) jump();
        else slide();
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
            if (gameOver || levelComplete) return;
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

        const bind = (id, fn) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('click', fn);
        };
        bind('leftArrow', () => setLane(targetLane - 1));
        bind('rightArrow', () => setLane(targetLane + 1));
        bind('upArrow', jump);
        bind('downArrow', slide);
        bind('cameraToggleBtn', toggleCamera);

        surface.addEventListener('pointerdown', () => {
            const hint = document.getElementById('swipeHint');
            if (hint) hint.classList.add('hidden');
        }, { once: true });
    }

    function loadImage(src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = src;
        });
    }

    async function init() {
        canvas = document.getElementById('gameCanvas');
        ctx = canvas.getContext('2d');
        theme = readMapTheme();
        show = readShow();
        if (!show) {
            window.location.href = 'show-select.html';
            return;
        }

        characterImg = await loadImage(readStreetImage());
        finaleImg = await loadImage(readFinaleImage());

        resize();
        window.addEventListener('resize', resize);
        setupInput();
        resetRun();
        rafId = requestAnimationFrame(loop);
    }

    document.addEventListener('DOMContentLoaded', init);
})();
