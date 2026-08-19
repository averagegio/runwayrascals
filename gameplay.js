(() => {
    const LANES = 3;

    const MAP_THEMES = {
        newyork: {
            name: 'New York Fashion Week',
            wallTop: '#ffe9a0',
            wallBot: '#e8b020',
            floor: '#1f1a12',
            catwalk: '#1a1410',
            catwalkSheen: 'rgba(255,220,120,0.28)',
            seat: '#fff8e8',
            seatEdge: '#f0d89a',
            crowd: '#2a2a2a',
            accent: '#F4C430',
            light: 'rgba(255,230,140,0.65)',
            wash: 'rgba(244,196,48,0.3)',
            city: 'ny',
            skyline: 'ny'
        },
        milan: {
            name: 'Milan Fashion Week',
            wallTop: '#ffc8b8',
            wallBot: '#e07060',
            floor: '#221816',
            catwalk: '#1c1210',
            catwalkSheen: 'rgba(220,80,60,0.25)',
            seat: '#fff5f0',
            seatEdge: '#f0c8b8',
            crowd: '#292524',
            accent: '#C41E3A',
            light: 'rgba(255,190,170,0.6)',
            wash: 'rgba(196,30,58,0.28)',
            city: 'milan',
            skyline: 'milan'
        },
        paris: {
            name: 'Paris Fashion Week',
            wallTop: '#b8d4ff',
            wallBot: '#6a9ae8',
            floor: '#141820',
            catwalk: '#10141c',
            catwalkSheen: 'rgba(120,170,255,0.28)',
            seat: '#f4f8ff',
            seatEdge: '#c8d8f5',
            crowd: '#292524',
            accent: '#3B82F6',
            light: 'rgba(180,210,255,0.65)',
            wash: 'rgba(59,130,246,0.32)',
            city: 'paris',
            skyline: 'paris',
            backdrop: 'eiffel-tower.jpg'
        },
        london: {
            name: 'London Fashion Week',
            wallTop: '#ffb8c8',
            wallBot: '#e05070',
            floor: '#1a1214',
            catwalk: '#161012',
            catwalkSheen: 'rgba(220,40,70,0.25)',
            seat: '#fff0f2',
            seatEdge: '#f0c0c8',
            crowd: '#27272a',
            accent: '#E11D48',
            light: 'rgba(255,180,195,0.6)',
            wash: 'rgba(200,16,46,0.28)',
            city: 'london',
            skyline: 'london',
            wet: true
        },
        berlin: {
            name: 'Berlin Fashion Week',
            wallTop: '#b8ffc8',
            wallBot: '#40c070',
            floor: '#101612',
            catwalk: '#0c1410',
            catwalkSheen: 'rgba(80,220,140,0.25)',
            seat: '#f0fff4',
            seatEdge: '#b8e8c8',
            crowd: '#171717',
            accent: '#22C55E',
            light: 'rgba(160,255,200,0.6)',
            wash: 'rgba(46,204,113,0.28)',
            city: 'berlin',
            skyline: 'berlin'
        },
        miami: {
            name: 'Miami Fashion Week',
            wallTop: '#ffc0e8',
            wallBot: '#ff60b8',
            floor: '#1a1030',
            catwalk: '#161028',
            catwalkSheen: 'rgba(255,120,200,0.3)',
            seat: '#fff0fa',
            seatEdge: '#ffc0e0',
            crowd: '#4c1d95',
            accent: '#FF4DB8',
            light: 'rgba(255,160,220,0.65)',
            wash: 'rgba(255,110,199,0.32)',
            city: 'miami',
            skyline: 'miami'
        }
    };

    let canvas, ctx;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let running = false;
    let gameOver = false;
    let levelComplete = false;
    let dying = false;
    let deathT = 0;
    let paused = false;
    let rafId = 0;
    let lastTs = 0;

    let theme = MAP_THEMES.newyork;
    let show = null;
    let cameraMode = 'back';
    let avatar3d = null;
    let avatarCanvas = null;
    let characterName = 'Model';
    let gamerTag = 'model';
    let cityId = 'newyork';
    let lastFrameDt = 0.016;
    let difficulty = null;
    let backdropImg = null;
    let backdropReady = false;

    const DIFFICULTY_SCALES = {
        easy: {
            id: 'easy',
            label: 'Easy',
            baseSpeed: 170,
            maxSpeed: 320,
            accel: 0.022,
            spawnGapMult: 1.35,
            obstacleBias: 0.75,
            scoreMult: 0.8
        },
        medium: {
            id: 'medium',
            label: 'Medium',
            baseSpeed: 230,
            maxSpeed: 420,
            accel: 0.035,
            spawnGapMult: 1.05,
            obstacleBias: 0.95,
            scoreMult: 1
        },
        hard: {
            id: 'hard',
            label: 'Hard',
            baseSpeed: 300,
            maxSpeed: 560,
            accel: 0.055,
            spawnGapMult: 0.85,
            obstacleBias: 1.15,
            scoreMult: 1.35
        },
        impossible: {
            id: 'impossible',
            label: 'Impossible',
            baseSpeed: 380,
            maxSpeed: 720,
            accel: 0.085,
            spawnGapMult: 0.65,
            obstacleBias: 1.35,
            scoreMult: 1.75
        }
    };

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
    let itemBoostTimer = 0;
    let itemBoostMult = 1;

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

    function readDifficulty() {
        try {
            const id = localStorage.getItem('selectedDifficulty') || 'medium';
            return DIFFICULTY_SCALES[id] || DIFFICULTY_SCALES.medium;
        } catch (_) {
            return DIFFICULTY_SCALES.medium;
        }
    }

    function readPlayerIdentity() {
        const user = (window.RunwayAuth && RunwayAuth.getCachedUser()) || {};
        characterName = localStorage.getItem('characterName')
            || user.characterName
            || user.displayName
            || 'Model';
        gamerTag = String(localStorage.getItem('gamerTag') || user.gamerTag || 'model').replace(/^@/, '');
    }

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

    function readMapTheme() {
        const id = readCityId();
        return MAP_THEMES[id] || MAP_THEMES.newyork;
    }

    function loadBackdrop() {
        backdropImg = null;
        backdropReady = false;
        if (!theme || !theme.backdrop) return;
        const img = new Image();
        img.onload = () => {
            backdropImg = img;
            backdropReady = true;
        };
        img.src = theme.backdrop;
    }

    function boost() {
        const b = (show && show.boost) || {
            jumpMult: 1, magnet: 0, speedMult: 1, scoreMult: 1, slideMult: 1, obstacleBias: 1, collectShield: 0
        };
        const d = difficulty || DIFFICULTY_SCALES.medium;
        return Object.assign({}, b, {
            speedMult: (b.speedMult || 1),
            scoreMult: (b.scoreMult || 1) * (d.scoreMult || 1),
            obstacleBias: (b.obstacleBias || 1) * (d.obstacleBias || 1)
        });
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

    function curveAt(worldZ) {
        // Realistic winding catwalk: long S-bends + soft banking turns
        const w = distance * 0.055 + worldZ * 0.0028;
        const main = Math.sin(w * 0.65) * 0.32;
        const secondary = Math.sin(w * 0.27 + 1.35) * 0.14;
        const kink = Math.sin(w * 1.1 + 0.4) * 0.04;
        return main + secondary + kink;
    }

    function curveDeriv(worldZ) {
        const eps = 8;
        return (curveAt(worldZ + eps) - curveAt(worldZ - eps)) / (2 * eps);
    }

    function laneCenterX(laneIndex, z) {
        const zz = z == null ? 0 : z;
        const curve = curveAt(zz);
        const runwayLeft = width * (0.12 + curve * 0.32);
        const runwayRight = width * (0.88 + curve * 0.32);
        const runwayW = runwayRight - runwayLeft;
        const laneW = runwayW / LANES;
        return runwayLeft + laneW * (laneIndex + 0.5);
    }

    function project(z, laneIndex) {
        // Close chase cam — steep falloff so near field fills the frame
        const near = 1.2;
        const far = 0.35;
        const t = 1 / (1 + z * 0.0095);
        const scale = near * t + far * (1 - t);
        const horizonY = height * 0.50;
        const groundY = height * 0.95;
        const y = horizonY + (groundY - horizonY) * (1 - Math.pow(1 - t, 1.1));
        const center = width / 2 + curveAt(z) * width * 0.32 * (0.3 + 0.7 * t);
        const laneXWorld = laneCenterX(laneIndex, z);
        const x = center + (laneXWorld - center) * (0.35 + 0.65 * t);
        return { x, y, scale, t, curve: curveAt(z) };
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
        const d = difficulty || DIFFICULTY_SCALES.medium;
        speed = d.baseSpeed * boost().speedMult;
        spawnTimer = 0;
        flashTimer = 0;
        shieldTimer = 0;
        itemBoostTimer = 0;
        itemBoostMult = 1;
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
        dying = false;
        deathT = 0;
        paused = false;
        running = true;
        lastTs = 0;
        updateHud();
        hideOverlay();
        hidePauseMenu();
        seedStarterPack();
        pushFloat('Street clothes · get dressed!', '#fff', laneX, height * 0.55);
    }

    function seedStarterPack() {
        const next = nextDressPiece();
        if (next && !next.rare) spawnPiece(200, 1, next, false);
        spawnFashionPickup(280, 1);
        spawnPiece(360, 0, pickCommonPiece(), false);
        spawnFashionPickup(450, 2);
        spawnPiece(520, 2, pickCommonPiece(), false);
        spawnObstacle(900, 0, 'barrier');
        spawnObstacle(1100, 2, 'paparazzi');
        // Brief runway entrance shield so the first beats read clearly
        shieldTimer = 3.5;
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

    function spawnFashionPickup(z, laneIndex, item) {
        const it = item || (window.pickFashionItem && window.pickFashionItem()) || {
            id: 'stiletto', name: 'Runway Stiletto', label: 'HEEL', shape: 'heel',
            color: '#111', accent: '#c9a56a', points: 40, boostMs: 1.3, speedBurst: 1.2
        };
        entities.push({
            kind: 'pickup',
            lane: laneIndex,
            z,
            w: 48,
            h: 48,
            item: it,
            hit: false
        });
    }

    function applyItemBoost(mult, seconds) {
        itemBoostMult = Math.max(itemBoostMult, mult || 1.15);
        itemBoostTimer = Math.max(itemBoostTimer, seconds || 1.2);
        shieldTimer = Math.max(shieldTimer, Math.min(0.45, (seconds || 1.2) * 0.25));
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
        const d = difficulty || DIFFICULTY_SCALES.medium;
        const gap = Math.max(0.35, (1.1 - distance / 4200) * (d.spawnGapMult || 1));
        spawnTimer = gap;

        const z = 900 + Math.random() * 140;
        const lanePick = Math.floor(Math.random() * LANES);
        const obstacleBias = boost().obstacleBias || 1;
        const roll = Math.random();

        if (roll < 0.42) {
            if (Math.random() < rareSpawnChance()) {
                spawnPiece(z, lanePick, show.rareGoal, true);
            } else {
                const next = nextDressPiece();
                if (next && !next.rare && Math.random() < 0.55) {
                    spawnPiece(z, lanePick, next, false);
                } else {
                    spawnPiece(z, lanePick, pickCommonPiece(), false);
                }
            }
            if (Math.random() < 0.28) {
                const other = (lanePick + 1 + Math.floor(Math.random() * 2)) % LANES;
                spawnPiece(z + 50, other, pickCommonPiece(), false);
            }
        } else if (roll < 0.72) {
            // Fashion props — always boost on collect, never wipeout
            spawnFashionPickup(z, lanePick);
            if (Math.random() < 0.35) {
                const other = (lanePick + 1 + Math.floor(Math.random() * 2)) % LANES;
                spawnFashionPickup(z + 40, other);
            }
        } else if (Math.random() < obstacleBias * 0.85) {
            spawnObstacle(z, lanePick);
            if (Math.random() < 0.18) {
                const other = (lanePick + 1 + Math.floor(Math.random() * 2)) % LANES;
                spawnObstacle(z + 30, other, 'barrier');
            }
        } else {
            spawnFashionPickup(z, lanePick);
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
        if (boostEl && show) {
            const dLabel = (difficulty && difficulty.label) || 'Medium';
            boostEl.textContent = `${show.boost.name} · ${dLabel}`;
        }
        const tagEl = document.getElementById('playerTag');
        if (tagEl) tagEl.textContent = `${characterName} · @${gamerTag}`;
        const diffEl = document.getElementById('difficultyDisplay');
        if (diffEl && difficulty) {
            diffEl.textContent = difficulty.label;
            diffEl.dataset.level = difficulty.id;
        }
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
            const visibleIndex = show.pieces.filter((p) => p.slot !== 'base').indexOf(piece) + 1;
            chip.textContent = piece.rare ? '★' : String(visibleIndex);
            chip.title = piece.name;
            track.appendChild(chip);
        });
    }

    function setLane(next) {
        if (dying || paused || gameOver || levelComplete) return;
        targetLane = Math.max(0, Math.min(LANES - 1, next));
    }

    function jump() {
        if (isJumping || isSliding || gameOver || levelComplete || dying || paused) return;
        isJumping = true;
        jumpT = 0;
    }

    function slide() {
        if (isJumping || isSliding || gameOver || levelComplete || dying || paused) return;
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
        const baseY = height * 0.86 - playerYOffset * 0.2;
        burst(laneX, baseY - 70, piece.color || show.accent);
        pushFloat(`+${piece.name}`, piece.color || '#fff', laneX, baseY - 120);
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
        } else {
            pushFloat('STRUT!', type.color || '#f4efe6', laneX, height * 0.5);
        }

        grantOutfitPiece(type);
        applyItemBoost(1.18, 1.15);

        if (boost().collectShield) {
            shieldTimer = Math.max(shieldTimer, boost().collectShield);
        }

        if (show && rareCollected >= show.rareGoal.target) {
            completeLevel();
        }
    }

    function onCollectPickup(item) {
        if (!item) return;
        const scoreMult = boost().scoreMult || 1;
        looksCollected += 1;
        score += Math.floor((item.points || 30) * scoreMult);
        applyItemBoost(item.speedBurst || 1.2, item.boostMs || 1.3);
        pushFloat(`+${item.name}`, item.accent || item.color || '#c9a56a', laneX, height * 0.48);
        burst(laneX, height * 0.62, item.accent || item.color || '#c9a56a');
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
            playerYOffset = Math.sin(p * Math.PI) * Math.min(72, height * 0.09) * jumpMult;
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

        // Soft magnet toward nearby clothing + fashion pickups
        const mag = boost().magnet || 0;
        if (mag > 0) {
            for (const e of entities) {
                if ((e.kind !== 'clothing' && e.kind !== 'pickup') || e.z > 90 || e.z < 0) continue;
                const dx = laneX - laneCenterX(e.lane, e.z);
                if (Math.abs(dx) < mag + 40 && Math.abs(dx) > 4) {
                    if (Math.abs(dx) < mag + 10 && e.lane !== targetLane && Math.random() < dt * 3) {
                        e.lane = targetLane;
                    }
                }
            }
        }
    }

    function playerHitbox() {
        const footY = height * 0.92 - (isJumping ? playerYOffset * 0.85 : playerYOffset * 0.15);
        const scale = isSliding ? 0.55 : 1;
        const mag = (boost().magnet || 0) * height * 0.03;
        const ph = height * 0.30 * scale;
        const pw = ph * 0.55 + mag;
        return {
            x: laneX - pw / 2,
            y: footY - ph,
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
        const d = difficulty || DIFFICULTY_SCALES.medium;
        speed = Math.min(
            d.maxSpeed * (itemBoostTimer > 0 ? 1.08 : 1),
            (d.baseSpeed + distance * d.accel) * boost().speedMult * (itemBoostTimer > 0 ? itemBoostMult : 1)
        );

        const hit = playerHitbox();

        if (itemBoostTimer > 0) {
            itemBoostTimer -= dt;
            if (itemBoostTimer <= 0) {
                itemBoostTimer = 0;
                itemBoostMult = 1;
            }
        }

        for (let i = entities.length - 1; i >= 0; i--) {
            const e = entities[i];
            e.z -= move;

            if (e.z < -40) {
                entities.splice(i, 1);
                continue;
            }

            if (e.z > -10 && e.z < 58 && !e.hit) {
                const sameLane = e.lane === hit.lane || Math.abs(laneCenterX(e.lane, e.z) - laneX) < 28 + (boost().magnet || 0) * 0.25;
                if (!sameLane) continue;

                if (e.kind === 'clothing') {
                    e.hit = true;
                    onCollectClothing(e.type);
                    burst(laneX, height * 0.62, e.type.color);
                    entities.splice(i, 1);
                    continue;
                }

                if (e.kind === 'pickup') {
                    e.hit = true;
                    onCollectPickup(e.item);
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
                    startDeath();
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

    function startDeath() {
        if (dying || gameOver || levelComplete) return;
        dying = true;
        deathT = 0;
        isJumping = false;
        isSliding = false;
        burst(laneX, height * 0.62, '#ef4444');
        burst(laneX, height * 0.58, '#fbbf24');
        pushFloat('CRASH!', '#ef4444', laneX, height * 0.5);
        flashTimer = 0.35;
    }

    function updateDeath(dt) {
        if (!dying) return;
        deathT += dt;
        // Keep particles alive during tumble
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.life -= dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 220 * dt;
            if (p.life <= 0) particles.splice(i, 1);
        }
        for (let i = floatTexts.length - 1; i >= 0; i--) {
            const f = floatTexts[i];
            f.life -= dt;
            f.y += f.vy * dt;
            if (f.life <= 0) floatTexts.splice(i, 1);
        }
        if (flashTimer > 0) flashTimer -= dt;
        if (deathT >= 1.15) {
            dying = false;
            finishDeath();
        }
    }

    function finishDeath() {
        gameOver = true;
        running = false;
        updateHud();
        showOverlay(false);
    }

    function endGame() {
        // Legacy path — prefer animated death
        startDeath();
    }

    function completeLevel() {
        if (levelComplete) return;
        levelComplete = true;
        running = false;
        score += 500;
        updateHud();
        const root = document.getElementById('gameRoot');

        const finish = async () => {
            let newlyUnlocked = null;
            if (window.RunwayAuth && RunwayAuth.getToken()) {
                try {
                    const data = await RunwayAuth.api('/api/levels/unlock-next', {
                        method: 'POST',
                        body: JSON.stringify({ completedLevelId: cityId })
                    });
                    newlyUnlocked = data.newlyUnlocked;
                    if (data.user) RunwayAuth.setSession(RunwayAuth.getToken(), data.user);
                } catch (_) { /* offline ok */ }
            }
            if (newlyUnlocked && window.RunwayCinematic) {
                await RunwayCinematic.levelUnlocked(root, newlyUnlocked, gamerTag);
            }
            showOverlay(true, newlyUnlocked);
        };

        if (window.RunwayCinematic) {
            RunwayCinematic.levelClosing(root, cityId, true).then(finish);
        } else {
            finish();
        }
    }

    function hideOverlay() {
        const el = document.querySelector('.game-over-screen');
        if (el) el.remove();
    }

    function hidePauseMenu() {
        const el = document.getElementById('pauseMenu');
        if (el) el.remove();
    }

    function restartRun() {
        hideOverlay();
        hidePauseMenu();
        if (rafId) cancelAnimationFrame(rafId);
        resetRun();
        lastTs = 0;
        running = true;
        paused = false;
        rafId = requestAnimationFrame(loop);
    }

    function exitToMenu() {
        hideOverlay();
        hidePauseMenu();
        running = false;
        paused = false;
        window.location.href = 'show-select.html';
    }

    function togglePauseMenu() {
        if (dying || gameOver || levelComplete) return;
        if (paused) {
            resumeGame();
            return;
        }
        paused = true;
        running = false;
        hidePauseMenu();
        const menu = document.createElement('div');
        menu.id = 'pauseMenu';
        menu.className = 'game-over-screen pause-menu';
        menu.innerHTML = `
            <h2>Paused</h2>
            <p class="game-over-meta">Exit mid-walk or keep going</p>
            <button id="resumeBtn" class="game-btn">Resume</button>
            <button id="pauseRestartBtn" class="game-btn restart-btn" style="margin-top:10px;">Restart</button>
            <button id="pauseExitBtn" class="game-btn exit-btn" style="margin-top:10px;">Exit to Menu</button>
        `;
        document.getElementById('gameRoot').appendChild(menu);
        document.getElementById('resumeBtn').addEventListener('click', resumeGame);
        document.getElementById('pauseRestartBtn').addEventListener('click', restartRun);
        document.getElementById('pauseExitBtn').addEventListener('click', exitToMenu);
    }

    function resumeGame() {
        hidePauseMenu();
        if (gameOver || levelComplete || dying) return;
        paused = false;
        running = true;
        lastTs = 0;
        rafId = requestAnimationFrame(loop);
    }

    function showOverlay(won, newlyUnlocked) {
        hideOverlay();
        hidePauseMenu();
        const screen = document.createElement('div');
        screen.className = 'game-over-screen';
        const lookName = show?.pieces[Math.min(outfitStage, show.pieces.length - 1)]?.name || 'Street';
        const unlockLine = newlyUnlocked
            ? `<p class="game-over-meta unlock-line">Unlocked: ${RunwayCinematic.LEVEL_NAMES[newlyUnlocked] || newlyUnlocked}</p>`
            : '';
        if (won) {
            screen.innerHTML = `
                <h2>Show Complete</h2>
                <p>${characterName} · @${gamerTag}</p>
                <p>Walked for ${show.designer}</p>
                <p class="game-over-meta">${show.rareGoal.fullName}: ${rareCollected}/${show.rareGoal.target}</p>
                <p class="game-over-meta">Final look: ${lookName}</p>
                ${unlockLine}
                <p>Score: ${Math.floor(score)}</p>
                <p class="game-over-meta">Difficulty: ${(difficulty && difficulty.label) || 'Medium'}</p>
                <button id="restartBtn" class="game-btn restart-btn">Restart</button>
                <a href="show-select.html" class="game-btn exit-btn" style="margin-top:10px;display:inline-block;">Exit to Menu</a>
            `;
        } else {
            screen.innerHTML = `
                <h2>Runway Wipeout</h2>
                <p>${characterName} · @${gamerTag}</p>
                <p>Score: ${Math.floor(score)}</p>
                <p class="game-over-meta">${show ? show.designer : 'Show'}: ${rareCollected}/${show?.rareGoal?.target || 0} rares</p>
                <p class="game-over-meta">Dressed: ${lookName}</p>
                <button id="restartBtn" class="game-btn restart-btn">Restart</button>
                <a href="show-select.html" class="game-btn exit-btn" style="margin-top:10px;display:inline-block;">Exit to Menu</a>
            `;
        }
        document.getElementById('gameRoot').appendChild(screen);
        document.getElementById('restartBtn').addEventListener('click', restartRun);
    }

    function drawShowroomWalls() {
        // Vibrant fashion-show room — saturated walls fill the upper frame
        const wall = ctx.createLinearGradient(0, 0, 0, height * 0.5);
        wall.addColorStop(0, theme.wallTop || '#fff4d6');
        wall.addColorStop(0.7, theme.wallBot || '#f0c96a');
        wall.addColorStop(1, theme.wallBot || '#f0c96a');
        ctx.fillStyle = wall;
        ctx.fillRect(0, 0, width, height * 0.5);

        // City accent wash across the walls
        const wash = ctx.createRadialGradient(width * 0.5, height * 0.12, 10, width * 0.5, height * 0.28, width * 0.75);
        wash.addColorStop(0, theme.wash || 'rgba(255,200,100,0.28)');
        wash.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = wash;
        ctx.fillRect(0, 0, width, height * 0.5);

        // Soft ceiling glow
        const ceil = ctx.createLinearGradient(0, 0, 0, height * 0.22);
        ceil.addColorStop(0, 'rgba(255,255,255,0.55)');
        ceil.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = ceil;
        ctx.fillRect(0, 0, width, height * 0.22);

        // Side curtains / drapes for venue depth
        for (let side = -1; side <= 1; side += 2) {
            const gx = side < 0 ? 0 : width * 0.8;
            const drape = ctx.createLinearGradient(gx, 0, gx + width * 0.2, 0);
            drape.addColorStop(0, side < 0 ? 'rgba(0,0,0,0.22)' : 'rgba(0,0,0,0)');
            drape.addColorStop(0.5, theme.wash || 'rgba(255,200,100,0.18)');
            drape.addColorStop(1, side < 0 ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,0.22)');
            ctx.fillStyle = drape;
            ctx.fillRect(gx, 0, width * 0.2, height * 0.5);
        }

        // Floor flanking the runway (starts at horizon so walls stay colorful)
        const floorTop = height * 0.50;
        const floorGrad = ctx.createLinearGradient(0, floorTop, 0, height);
        floorGrad.addColorStop(0, theme.floor || '#161616');
        floorGrad.addColorStop(1, '#050505');
        ctx.fillStyle = floorGrad;
        ctx.fillRect(0, floorTop, width, height - floorTop);
    }

    function drawFarBackdrop() {
        const horizon = height * 0.50;
        const portalW = width * 0.55;
        const portalX = width / 2 - portalW / 2;
        const portalH = height * 0.28;

        // Bright entry portal with accent rim
        const portalGrad = ctx.createLinearGradient(portalX, horizon - portalH, portalX, horizon);
        portalGrad.addColorStop(0, '#ffffff');
        portalGrad.addColorStop(1, theme.wallTop || '#fff8e8');
        ctx.fillStyle = portalGrad;
        ctx.fillRect(portalX, horizon - portalH, portalW, portalH);

        ctx.strokeStyle = theme.accent || '#F4C430';
        ctx.lineWidth = 4;
        ctx.strokeRect(portalX + 2, horizon - portalH + 2, portalW - 4, portalH - 4);

        // Steps into the portal
        ctx.fillStyle = '#0a0a0a';
        for (let i = 0; i < 4; i++) {
            const y = horizon - 3 - i * 8;
            const inset = i * 10;
            ctx.fillRect(portalX + portalW * 0.18 + inset, y, portalW * 0.64 - inset * 2, 7);
        }

        if (theme.skyline === 'paris' && backdropReady && backdropImg) {
            const iw = portalW * 0.98;
            const ih = portalH * 1.45;
            ctx.save();
            ctx.beginPath();
            ctx.rect(portalX, horizon - ih * 0.88, portalW, ih * 0.88);
            ctx.clip();
            ctx.globalAlpha = 1;
            ctx.drawImage(backdropImg, portalX + (portalW - iw) / 2, horizon - ih * 0.92, iw, ih);
            ctx.restore();
            const vg = ctx.createLinearGradient(portalX, horizon - portalH, portalX, horizon);
            vg.addColorStop(0, 'rgba(255,255,255,0.05)');
            vg.addColorStop(1, 'rgba(20,30,50,0.2)');
            ctx.fillStyle = vg;
            ctx.fillRect(portalX, horizon - portalH, portalW, portalH);
        } else {
            drawSkylineSilhouette(horizon, portalX, portalW, portalH);
        }
    }

    function drawSkylineSilhouette(horizon, portalX, portalW, portalH) {
        const kind = theme.skyline || 'ny';
        ctx.save();
        ctx.beginPath();
        ctx.rect(portalX, horizon - portalH, portalW, portalH);
        ctx.clip();

        const sky = ctx.createLinearGradient(portalX, horizon - portalH, portalX, horizon);
        if (kind === 'ny') {
            sky.addColorStop(0, '#1a2744');
            sky.addColorStop(1, '#f0a060');
        } else if (kind === 'milan') {
            sky.addColorStop(0, '#c8d8e8');
            sky.addColorStop(1, '#f5e6d3');
        } else if (kind === 'london') {
            sky.addColorStop(0, '#6a7a8a');
            sky.addColorStop(1, '#c5cdd6');
        } else if (kind === 'berlin') {
            sky.addColorStop(0, '#2a2a32');
            sky.addColorStop(1, '#5a6a5a');
        } else if (kind === 'miami') {
            sky.addColorStop(0, '#ff6eb4');
            sky.addColorStop(0.45, '#ffb347');
            sky.addColorStop(1, '#6ec8ff');
        } else {
            sky.addColorStop(0, '#a8c4f0');
            sky.addColorStop(1, '#ffe0b0');
        }
        ctx.fillStyle = sky;
        ctx.fillRect(portalX, horizon - portalH, portalW, portalH);

        if (kind === 'ny') {
            for (let i = 0; i < 14; i++) {
                const bx = portalX + 4 + i * (portalW / 14);
                const bh = portalH * (0.35 + ((i * 37) % 5) * 0.12);
                ctx.fillStyle = i % 3 === 0 ? '#0e1420' : '#161e2e';
                ctx.fillRect(bx, horizon - bh, portalW / 16, bh);
                ctx.fillStyle = 'rgba(255,220,100,0.55)';
                for (let wy = 6; wy < bh - 8; wy += 10) {
                    for (let wx = 2; wx < portalW / 16 - 3; wx += 5) {
                        if ((i + wy + wx) % 3 !== 0) ctx.fillRect(bx + wx, horizon - bh + wy, 2.5, 2.5);
                    }
                }
            }
            ctx.fillStyle = '#0a1018';
            ctx.fillRect(portalX + portalW * 0.46, horizon - portalH * 0.98, 10, portalH * 0.98);
            ctx.beginPath();
            ctx.moveTo(portalX + portalW * 0.46, horizon - portalH * 0.98);
            ctx.lineTo(portalX + portalW * 0.46 + 5, horizon - portalH * 1.08);
            ctx.lineTo(portalX + portalW * 0.46 + 10, horizon - portalH * 0.98);
            ctx.fill();
        } else if (kind === 'milan') {
            ctx.fillStyle = '#8a9098';
            ctx.beginPath();
            ctx.moveTo(portalX + portalW * 0.12, horizon);
            for (let i = 0; i < 11; i++) {
                const x = portalX + portalW * (0.15 + i * 0.07);
                const peak = horizon - portalH * (0.45 + (i % 2) * 0.25 + (i === 5 ? 0.4 : 0));
                ctx.lineTo(x, peak);
                ctx.lineTo(x + portalW * 0.03, horizon - portalH * 0.35);
            }
            ctx.lineTo(portalX + portalW * 0.92, horizon);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#b8c0c8';
            ctx.beginPath();
            ctx.moveTo(width * 0.46, horizon - portalH * 0.55);
            ctx.lineTo(width * 0.5, horizon - portalH * 0.98);
            ctx.lineTo(width * 0.54, horizon - portalH * 0.55);
            ctx.fill();
        } else if (kind === 'london') {
            ctx.fillStyle = '#3a4048';
            for (let i = 0; i < 9; i++) {
                const bx = portalX + 10 + i * (portalW / 9);
                const bh = portalH * (0.28 + (i % 4) * 0.1);
                ctx.fillRect(bx, horizon - bh, 18, bh);
            }
            ctx.fillStyle = '#2a3038';
            ctx.fillRect(width * 0.47, horizon - portalH * 0.92, 14, portalH * 0.92);
            ctx.fillRect(width * 0.455, horizon - portalH * 0.98, 36, 12);
            ctx.fillStyle = '#c8102e';
            ctx.fillRect(width * 0.475, horizon - portalH * 0.72, 6, 6);
            ctx.fillStyle = 'rgba(140,170,200,0.25)';
            ctx.fillRect(portalX, horizon - 8, portalW, 8);
        } else if (kind === 'berlin') {
            ctx.fillStyle = '#1e2220';
            for (let i = 0; i < 7; i++) {
                const bx = portalX + 16 + i * (portalW / 7);
                ctx.fillRect(bx, horizon - portalH * (0.3 + (i % 3) * 0.12), 28, portalH * (0.3 + (i % 3) * 0.12));
            }
            ctx.fillStyle = theme.accent || '#22C55E';
            ctx.fillRect(width * 0.495, horizon - portalH * 0.95, 5, portalH * 0.95);
            ctx.beginPath();
            ctx.arc(width * 0.4975, horizon - portalH * 0.55, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#e8e8e8';
            ctx.beginPath();
            ctx.arc(width * 0.4975, horizon - portalH * 0.55, 7, 0, Math.PI * 2);
            ctx.fill();
        } else if (kind === 'miami') {
            for (let i = 0; i < 6; i++) {
                const bx = portalX + 18 + i * (portalW / 6.2);
                const bh = portalH * (0.4 + (i % 3) * 0.18);
                ctx.fillStyle = i % 2 ? 'rgba(255,80,180,0.75)' : 'rgba(80,200,255,0.7)';
                ctx.fillRect(bx, horizon - bh, 30, bh);
                ctx.fillStyle = 'rgba(255,255,255,0.35)';
                ctx.fillRect(bx + 4, horizon - bh + 6, 22, 4);
            }
            ctx.strokeStyle = 'rgba(20,80,40,0.7)';
            ctx.lineWidth = 3;
            for (let i = 0; i < 4; i++) {
                const px = portalX + 30 + i * 50;
                ctx.beginPath();
                ctx.moveTo(px, horizon);
                ctx.quadraticCurveTo(px - 18, horizon - 40, px + 8, horizon - 70);
                ctx.stroke();
            }
        }
        ctx.restore();
    }

    function drawGuest(x, y, scale, side, seed) {
        const s = Math.max(18, scale * height * 0.072);
        const skins = ['#f0c8a8', '#d4a07a', '#ffdbac', '#a0673a', '#ffc8a0', '#c68642'];
        const dresses = ['#111', '#fff0e8', '#9f1239', '#1e3a8a', '#f59e0b', '#7c3aed', theme.accent || '#c9a56a', '#ec4899'];
        const skin = skins[seed % skins.length];
        const dress = dresses[seed % dresses.length];

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(side < 0 ? 1 : -1, 1);

        ctx.fillStyle = theme.seat || '#fff8e8';
        ctx.fillRect(-s * 0.42, s * 0.28, s * 0.84, s * 0.18);
        ctx.fillStyle = theme.seatEdge || '#ddd';
        ctx.fillRect(-s * 0.45, s * 0.2, s * 0.12, s * 0.38);

        ctx.fillStyle = dress;
        ctx.beginPath();
        ctx.ellipse(0, s * 0.1, s * 0.3, s * 0.34, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-s * 0.28, s * 0.26, s * 0.56, s * 0.14);

        ctx.fillStyle = skin;
        ctx.beginPath();
        ctx.arc(0, -s * 0.26, s * 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = seed % 3 === 0 ? '#1a1a1a' : seed % 3 === 1 ? '#4a2c1a' : '#8B4513';
        ctx.beginPath();
        ctx.ellipse(0, -s * 0.36, s * 0.22, s * 0.14, 0, Math.PI, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.ellipse(-s * 0.07, -s * 0.28, s * 0.03, s * 0.04, 0, 0, Math.PI * 2);
        ctx.ellipse(s * 0.07, -s * 0.28, s * 0.03, s * 0.04, 0, 0, Math.PI * 2);
        ctx.fill();

        if (seed % 3 !== 2) {
            ctx.fillStyle = '#111';
            ctx.fillRect(s * 0.12, -s * 0.58, s * 0.14, s * 0.22);
            ctx.fillStyle = theme.accent || '#fff';
            ctx.globalAlpha = 0.65;
            ctx.fillRect(s * 0.14, -s * 0.54, s * 0.1, s * 0.1);
            ctx.globalAlpha = 1;
        }
        ctx.restore();
    }

    function drawAudienceBanks() {
        const seatSpacing = 42;
        const rows = 6;
        const ahead = 28;
        const startSlot = Math.floor(distance / seatSpacing) - 1;

        for (let row = 0; row < rows; row++) {
            for (let side = -1; side <= 1; side += 2) {
                const near = project(12, side < 0 ? 0 : 2);
                const far = project(460, side < 0 ? 0 : 2);
                const latN = (42 + row * 18) * (0.55 + 0.45 * near.t);
                const latF = (42 + row * 18) * (0.55 + 0.45 * far.t);
                ctx.fillStyle = row % 2 ? (theme.seat || '#f4f1ea') : (theme.seatEdge || '#e5dfd4');
                ctx.beginPath();
                ctx.moveTo(near.x + side * latN * 0.8, near.y + 6);
                ctx.lineTo(far.x + side * latF * 0.8, far.y + 3);
                ctx.lineTo(far.x + side * (latF + 18), far.y + 3);
                ctx.lineTo(near.x + side * (latN + 28), near.y + 8);
                ctx.closePath();
                ctx.fill();
            }
        }

        for (let slot = startSlot; slot < startSlot + ahead; slot++) {
            const worldZ = slot * seatSpacing - (distance % seatSpacing);
            if (worldZ < -30 || worldZ > 500) continue;
            for (let row = 0; row < rows; row++) {
                for (let side = -1; side <= 1; side += 2) {
                    const stagger = ((slot + row * 3) % 2) * 10;
                    const p = project(Math.max(0, worldZ + row * 5 + stagger), side < 0 ? 0 : 2);
                    const lateral = (48 + row * 17) * (0.55 + 0.45 * p.t);
                    const x = p.x + side * lateral;
                    const y = p.y + 2 + row * 2;
                    if (y < height * 0.42 || y > height * 0.97) continue;
                    const seed = Math.abs((slot * 47 + row * 13 + side * 9) % 97);
                    if (seed % 8 === 0) continue;
                    drawGuest(x, y, p.scale * (1.05 - row * 0.04), side, seed);
                }
            }
        }
    }

    function drawSpotlights() {
        for (let i = 0; i < 5; i++) {
            const bend = curveAt(i * 100) * width * 0.15;
            const x = width * (0.18 + i * 0.16) + bend;
            const g = ctx.createRadialGradient(x, height * 0.06, 2, x, height * 0.58, height * 0.5);
            g.addColorStop(0, theme.light || 'rgba(255,255,255,0.5)');
            g.addColorStop(0.45, theme.wash || 'rgba(255,200,100,0.12)');
            g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(x - 14, height * 0.04);
            ctx.lineTo(x + 14, height * 0.04);
            ctx.lineTo(x + width * 0.12, height * 0.92);
            ctx.lineTo(x - width * 0.12, height * 0.92);
            ctx.closePath();
            ctx.fill();
        }
    }

    function drawBackground() {
        drawShowroomWalls();
        drawFarBackdrop();
        drawSpotlights();
        drawCatwalk();
        drawAudienceBanks();
    }

    function catwalkEdgeX(z, side) {
        const t = 1 / (1 + z * 0.0095);
        const halfNear = width * 0.42;
        const halfFar = width * 0.16;
        const half = halfFar + (halfNear - halfFar) * t;
        const bend = curveAt(z) * width * 0.32 * (0.25 + 0.75 * t);
        const bank = curveDeriv(z) * width * 0.22 * side * t;
        const cx = width / 2 + bend;
        return cx + side * half + bank * 0.12;
    }

    function drawCatwalk() {
        // Wide polished runway — fills the near field so the player feels close
        const topY = height * 0.50;
        const botY = height * 0.99;
        const steps = 36;

        const left = [];
        const right = [];
        for (let i = 0; i <= steps; i++) {
            const u = i / steps;
            const z = (1 - u) * 520;
            const y = topY + (botY - topY) * u;
            left.push({ x: catwalkEdgeX(z, -1), y, z });
            right.push({ x: catwalkEdgeX(z, 1), y, z });
        }

        // Main dark deck
        ctx.fillStyle = theme.catwalk || '#121212';
        ctx.beginPath();
        ctx.moveTo(left[0].x, left[0].y);
        for (let i = 1; i <= steps; i++) ctx.lineTo(left[i].x, left[i].y);
        for (let i = steps; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);
        ctx.closePath();
        ctx.fill();

        // Gloss / reflection sheen
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(left[0].x, left[0].y);
        for (let i = 1; i <= steps; i++) ctx.lineTo(left[i].x, left[i].y);
        for (let i = steps; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);
        ctx.closePath();
        ctx.clip();
        const sheen = ctx.createLinearGradient(width * 0.3, topY, width * 0.7, botY);
        sheen.addColorStop(0, 'rgba(255,255,255,0)');
        sheen.addColorStop(0.4, theme.catwalkSheen || 'rgba(255,255,255,0.18)');
        sheen.addColorStop(0.7, 'rgba(255,255,255,0.06)');
        sheen.addColorStop(1, 'rgba(255,255,255,0.12)');
        ctx.fillStyle = sheen;
        ctx.fillRect(0, topY, width, botY - topY);

        // Accent LED edges
        ctx.strokeStyle = theme.accent || '#F4C430';
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(left[0].x, left[0].y);
        for (let i = 1; i <= steps; i++) ctx.lineTo(left[i].x, left[i].y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(right[0].x, right[0].y);
        for (let i = 1; i <= steps; i++) ctx.lineTo(right[i].x, right[i].y);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Panel seams
        ctx.strokeStyle = 'rgba(255,255,255,0.07)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            const t = ((i / 8) + (distance * 0.004) % 1) % 1;
            const z = (1 - t) * 520;
            const y = topY + (botY - topY) * t;
            ctx.beginPath();
            ctx.moveTo(catwalkEdgeX(z, -1) + 2, y);
            ctx.lineTo(catwalkEdgeX(z, 1) - 2, y);
            ctx.stroke();
        }
        ctx.restore();

        if (theme.wet) {
            ctx.fillStyle = 'rgba(140,170,210,0.12)';
            const mid = project(80, 1);
            ctx.beginPath();
            ctx.ellipse(mid.x, mid.y, width * 0.1, 12, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Soft edge join
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(left[0].x, left[0].y);
        for (let i = 1; i <= steps; i++) ctx.lineTo(left[i].x, left[i].y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(right[0].x, right[0].y);
        for (let i = 1; i <= steps; i++) ctx.lineTo(right[i].x, right[i].y);
        ctx.stroke();

        // Accent carpet runners between seats and catwalk (venue color)
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = theme.accent || '#F4C430';
        for (let side = -1; side <= 1; side += 2) {
            ctx.beginPath();
            ctx.moveTo(left[0].x + side * 8, left[0].y);
            for (let i = 1; i <= steps; i++) {
                const edge = side < 0 ? left[i] : right[i];
                ctx.lineTo(edge.x + side * (18 + i * 0.4), edge.y);
            }
            for (let i = steps; i >= 0; i--) {
                const edge = side < 0 ? left[i] : right[i];
                ctx.lineTo(edge.x + side * 4, edge.y);
            }
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }

    function drawFashionShape(ctx, shape, size, color, accent) {
        const s = size;
        ctx.save();
        if (shape === 'heel') {
            ctx.fillStyle = color;
            ctx.fillRect(-s * 0.08, -s * 0.35, s * 0.16, s * 0.7);
            ctx.beginPath();
            ctx.moveTo(-s * 0.35, -s * 0.15);
            ctx.lineTo(s * 0.4, -s * 0.2);
            ctx.lineTo(s * 0.45, -s * 0.05);
            ctx.lineTo(-s * 0.2, 0);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = accent;
            ctx.fillRect(-s * 0.1, s * 0.28, s * 0.2, s * 0.08);
        } else if (shape === 'clutch') {
            ctx.fillStyle = color;
            roundRect(ctx, -s * 0.4, -s * 0.22, s * 0.8, s * 0.44, 6);
            ctx.fill();
            ctx.strokeStyle = accent;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = accent;
            ctx.fillRect(-s * 0.08, -s * 0.06, s * 0.16, s * 0.12);
        } else if (shape === 'shades') {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.ellipse(-s * 0.22, 0, s * 0.2, s * 0.16, 0, 0, Math.PI * 2);
            ctx.ellipse(s * 0.22, 0, s * 0.2, s * 0.16, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = accent;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-s * 0.02, -s * 0.02);
            ctx.lineTo(s * 0.02, -s * 0.02);
            ctx.moveTo(-s * 0.42, -s * 0.02);
            ctx.lineTo(-s * 0.55, -s * 0.08);
            ctx.moveTo(s * 0.42, -s * 0.02);
            ctx.lineTo(s * 0.55, -s * 0.08);
            ctx.stroke();
        } else if (shape === 'perfume') {
            ctx.fillStyle = accent;
            ctx.fillRect(-s * 0.08, -s * 0.42, s * 0.16, s * 0.14);
            ctx.fillStyle = color;
            roundRect(ctx, -s * 0.22, -s * 0.28, s * 0.44, s * 0.6, 8);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.fillRect(-s * 0.12, -s * 0.18, s * 0.1, s * 0.35);
        } else if (shape === 'scarf') {
            ctx.strokeStyle = color;
            ctx.lineWidth = Math.max(3, s * 0.12);
            ctx.beginPath();
            ctx.moveTo(-s * 0.35, -s * 0.25);
            ctx.quadraticCurveTo(0, s * 0.35, s * 0.35, -s * 0.1);
            ctx.stroke();
            ctx.fillStyle = accent;
            ctx.beginPath();
            ctx.arc(0, 0, s * 0.12, 0, Math.PI * 2);
            ctx.fill();
        } else if (shape === 'bag') {
            ctx.fillStyle = color;
            roundRect(ctx, -s * 0.32, -s * 0.1, s * 0.64, s * 0.45, 8);
            ctx.fill();
            ctx.strokeStyle = accent;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, -s * 0.1, s * 0.22, Math.PI, 0);
            ctx.stroke();
            ctx.fillStyle = accent;
            ctx.beginPath();
            ctx.arc(0, s * 0.05, s * 0.06, 0, Math.PI * 2);
            ctx.fill();
        } else if (shape === 'cuff') {
            ctx.strokeStyle = color;
            ctx.lineWidth = Math.max(5, s * 0.16);
            ctx.beginPath();
            ctx.arc(0, 0, s * 0.32, 0.2, Math.PI * 1.8);
            ctx.stroke();
            ctx.fillStyle = accent;
            for (let i = 0; i < 5; i++) {
                const a = (i / 5) * Math.PI * 1.5 + 0.4;
                ctx.beginPath();
                ctx.arc(Math.cos(a) * s * 0.32, Math.sin(a) * s * 0.32, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(0, 0, s * 0.35, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    function roundRect(ctx, x, y, w, h, r) {
        const rr = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + rr, y);
        ctx.arcTo(x + w, y, x + w, y + h, rr);
        ctx.arcTo(x + w, y + h, x, y + h, rr);
        ctx.arcTo(x, y + h, x, y, rr);
        ctx.arcTo(x, y, x + w, y, rr);
        ctx.closePath();
    }

    function drawEntity(e) {
        const p = project(Math.max(0, e.z), e.lane);
        const size = Math.max(12, e.w * p.scale * 1.6);
        const x = p.x;
        const y = p.y - size * 0.35;

        if (e.kind === 'clothing' || e.kind === 'pickup') {
            ctx.save();
            ctx.translate(x, y);
            const r = size * (e.kind === 'clothing' && e.type && e.type.rare ? 0.52 : 0.45);
            ctx.beginPath();
            ctx.fillStyle = 'rgba(255,255,255,0.18)';
            ctx.arc(0, 0, r * 1.35, 0, Math.PI * 2);
            ctx.fill();

            if (e.kind === 'pickup' && e.item) {
                drawFashionShape(ctx, e.item.shape, size * 0.9, e.item.color, e.item.accent);
                ctx.fillStyle = e.item.accent || '#c9a56a';
                ctx.font = `600 ${Math.max(7, Math.floor(size * 0.18))}px Syne, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(e.item.label || 'ITEM', 0, r + 12);
            } else {
                ctx.beginPath();
                ctx.fillStyle = e.type.color;
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = e.type.rare ? '#fbbf24' : '#fff';
                ctx.lineWidth = Math.max(1.5, 2.2 * p.scale);
                ctx.stroke();
                ctx.fillStyle = '#fff';
                ctx.font = `600 ${Math.max(7, Math.floor(size * 0.22))}px Syne, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(e.type.label, 0, 0);
                if (e.type.rare) {
                    ctx.fillStyle = '#fbbf24';
                    ctx.font = `600 ${Math.max(7, Math.floor(size * 0.16))}px Syne, sans-serif`;
                    ctx.fillText('RARE', 0, r + 10);
                }
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
            ctx.font = `600 ${Math.max(8, Math.floor(size * 0.2))}px Syne, sans-serif`;
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
            ctx.font = `600 ${Math.max(8, Math.floor(size * 0.2))}px Syne, sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('FLASH', x, y + 10);
        } else {
            ctx.fillStyle = '#111';
            ctx.fillRect(x - hw, y - hh * 0.35, hw * 2, hh * 0.55);
            ctx.fillStyle = '#9f1239';
            ctx.fillRect(x - hw, y - hh * 0.35, hw * 2, 8);
            ctx.fillStyle = '#eab308';
            ctx.font = `600 ${Math.floor(10 + size * 0.18)}px Syne, sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('NO ENTRY', x, y + 4);
        }
        ctx.restore();
    }

    function drawPlayer() {
        const deathProg = dying ? Math.min(1, deathT / 1.15) : 0;
        const tumbleY = dying ? Math.sin(deathProg * Math.PI) * 40 - deathProg * 70 : 0;
        const tumbleX = dying ? Math.sin(deathT * 14) * 18 * deathProg : 0;
        // Stable near-field size — large enough to read, small enough to jump safely
        const footY = height * 0.92 - (isJumping ? playerYOffset * 0.85 : playerYOffset * 0.15) + tumbleY;
        const pulse = 1 + dressPulse * 0.08;
        const ph = height * (isSliding && !dying ? 0.26 : 0.38) * pulse;
        const pw = ph * (isSliding && !dying ? 0.72 : 0.55);
        const x = laneX + tumbleX;
        const lean = curveDeriv(0) * width * 0.08;

        ctx.save();
        // Contact shadow on the deck
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(laneX, footY + 2, pw * 0.32 * (1 - deathProg * 0.5), 9, 0, 0, Math.PI * 2);
        ctx.fill();

        if (shieldTimer > 0 && !dying) {
            ctx.strokeStyle = `rgba(255,255,255,${0.35 + shieldTimer})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(x, footY - ph * 0.45, pw * 0.7, ph * 0.55, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        if (avatar3d && avatarCanvas) {
            if (show) avatar3d.avatar.applyPieceColors(show.pieces, ownedSlots);
            avatar3d.setCameraMode(cameraMode);
            avatar3d.avatar.update(lastFrameDt, {
                jumping: isJumping && !dying,
                sliding: isSliding && !dying,
                dressing: dressAnimT,
                dying,
                deathT
            });
            avatar3d.render();
            if (dying) {
                ctx.save();
                ctx.translate(x, footY - ph * 0.5);
                ctx.rotate(deathProg * Math.PI * 1.2);
                ctx.globalAlpha = 1 - deathProg * 0.35;
                ctx.drawImage(avatarCanvas, -pw / 2, -ph / 2, pw, ph);
                ctx.restore();
            } else {
                ctx.save();
                ctx.translate(x, footY);
                ctx.rotate(lean * 0.15);
                // Feet at footY — image bottom sits on the runway
                ctx.drawImage(avatarCanvas, -pw / 2, -ph + 4, pw, ph);
                ctx.restore();
            }
        } else if (dying) {
            ctx.save();
            ctx.translate(x, footY - ph * 0.5);
            ctx.rotate(deathProg * Math.PI);
            ctx.globalAlpha = 1 - deathProg * 0.4;
            ctx.fillStyle = '#c4a484';
            ctx.fillRect(-pw * 0.25, -ph * 0.45, pw * 0.5, ph * 0.28);
            ctx.fillStyle = '#9ca3af';
            ctx.fillRect(-pw * 0.35, -ph * 0.2, pw * 0.7, ph * 0.55);
            ctx.restore();
        } else {
            ctx.fillStyle = '#c4a484';
            ctx.fillRect(x - pw * 0.25, footY - ph * 0.95, pw * 0.5, ph * 0.28);
            ctx.fillStyle = ownedSlots.top ? (show?.pieces.find(p => p.slot === 'top')?.color || '#666') : '#9ca3af';
            ctx.fillRect(x - pw * 0.35, footY - ph * 0.7, pw * 0.7, ph * 0.35);
            ctx.fillStyle = ownedSlots.bottoms ? (show?.pieces.find(p => p.slot === 'bottoms')?.color || '#444') : '#9ca3af';
            ctx.fillRect(x - pw * 0.3, footY - ph * 0.38, pw * 0.6, ph * 0.35);
        }

        // Dress-up fly-in — piece snaps onto the body slot
        if (dressAnimT > 0 && dressAnimPiece && !dying) {
            const t = 1 - dressAnimT / 0.85;
            const ease = 1 - Math.pow(1 - t, 3);
            const slot = dressAnimPiece.slot || 'top';
            const slotY = slot === 'shoes' ? footY - ph * 0.12
                : slot === 'bottoms' ? footY - ph * 0.35
                : slot === 'outer' || slot === 'top' ? footY - ph * 0.62
                : footY - ph * 0.55;
            const fromY = footY - ph - 90;
            const py = fromY + (slotY - fromY) * ease;
            const scale = 1.55 - ease * 0.7;
            ctx.globalAlpha = 1 - t * 0.25;
            ctx.fillStyle = dressAnimPiece.color || '#fff';
            ctx.beginPath();
            ctx.arc(x, py, 18 * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#111';
            ctx.font = `600 ${Math.floor(10 * scale)}px Syne, sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText((dressAnimPiece.name || '').split(' ').pop().toUpperCase(), x, py + 3);
            ctx.globalAlpha = 1;
        }

        if (dying) {
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 18px Fredoka One, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('CRASH!', laneX, height * 0.42);
            ctx.restore();
            return;
        }

        // Name + @tag over the 3D model
        ctx.fillStyle = '#fff';
        ctx.font = '700 15px Syne, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(characterName, x, footY - ph - 28);
        ctx.fillStyle = show?.accent || theme.accent;
        ctx.font = '600 13px Syne, sans-serif';
        ctx.fillText(`@${gamerTag}`, x, footY - ph - 10);
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = '600 11px Syne, sans-serif';
        ctx.fillText(cameraMode === 'front' ? 'FRONT CAM' : 'BACK CAM', x, footY - ph - 44);

        if (isJumping) {
            ctx.fillStyle = theme.accent;
            ctx.fillText('JUMP', x, y - ph - 48);
        }
        if (isSliding) {
            ctx.fillStyle = theme.accent;
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
        lastFrameDt = dt;

        if (dying) {
            updateDeath(dt);
        } else if (!gameOver && !levelComplete && !paused) {
            updatePlayer(dt);
            updateEntities(dt);
        }
        drawFrame();
        if (running) rafId = requestAnimationFrame(loop);
    }

    function onSwipe(dx, dy) {
        if (gameOver || levelComplete || dying || paused) return;
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
            if (e.key === 'Escape') {
                e.preventDefault();
                togglePauseMenu();
                return;
            }
            if (gameOver || levelComplete || dying || paused) return;
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
        bind('leftArrow', () => { if (!dying && !paused && !gameOver) setLane(targetLane - 1); });
        bind('rightArrow', () => { if (!dying && !paused && !gameOver) setLane(targetLane + 1); });
        bind('upArrow', () => { if (!dying && !paused && !gameOver) jump(); });
        bind('downArrow', () => { if (!dying && !paused && !gameOver) slide(); });
        bind('cameraToggleBtn', toggleCamera);
        bind('exitGameBtn', togglePauseMenu);

        surface.addEventListener('pointerdown', () => {
            const hint = document.getElementById('swipeHint');
            if (hint) hint.classList.add('hidden');
        }, { once: true });
    }

    async function init() {
        canvas = document.getElementById('gameCanvas');
        ctx = canvas.getContext('2d');
        avatarCanvas = document.getElementById('avatar3d');
        readPlayerIdentity();
        cityId = readCityId();
        difficulty = readDifficulty();
        theme = readMapTheme();
        loadBackdrop();
        show = readShow();
        if (!show) {
            window.location.href = 'show-select.html';
            return;
        }

        if (window.THREE && window.Runway3D && avatarCanvas) {
            const characterId = localStorage.getItem('selectedCharacter') || 'female';
            avatar3d = Runway3D.createRenderer(avatarCanvas, THREE, { characterId });
            avatar3d.resize(360, 540);
            if (show) avatar3d.avatar.applyPieceColors(show.pieces, { base: true });
        }

        resize();
        window.addEventListener('resize', resize);
        setupInput();
        resetRun();

        const root = document.getElementById('gameRoot');
        if (window.RunwayCinematic) {
            await RunwayCinematic.levelOpening(root, cityId, characterName);
        }

        running = true;
        lastTs = 0;
        rafId = requestAnimationFrame(loop);
    }

    document.addEventListener('DOMContentLoaded', init);
})();
