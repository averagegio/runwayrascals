/**
 * Low-poly Three.js runway avatar — jointed limbs, per-character flair,
 * fabric materials, and fashion gait cycles.
 */
(function (global) {
    const CHARACTER_LIBRARY = {
        male: {
            src: 'chibibrodoll.png', hair: 0x1a1a1a, skin: 0xe8b896, label: 'Devil Boy',
            trait: 'horns', lip: 0xc45c5c, eyeScale: 1.05
        },
        female: {
            src: 'chibidoll2.png', hair: 0x2d1b14, skin: 0xffdbac, label: 'Mouse Girl',
            trait: 'ears', lip: 0xe06b7a, eyeScale: 1.15
        },
        fashion: {
            src: 'chibidollfashion.png', hair: 0x111111, skin: 0xf5d0b0, label: 'Fashion Doll',
            trait: 'bob', lip: 0xd4546a, eyeScale: 1.1
        },
        evening: {
            src: 'chibidoll3.png', hair: 0x3b2118, skin: 0xffdbac, label: 'Evening Doll',
            trait: 'updo', lip: 0xb91c1c, eyeScale: 1.08
        }
    };

    // Fashion gait presets — richer params for runway personality
    const GAIT_PRESETS = {
        strut: {
            label: 'Strut', speed: 7.2, amp: 0.42, knee: 0.55, arm: 0.75,
            bounce: 0.035, hip: 0.06, torso: 0.05, shoulder: 0.08, head: 0.03, lean: 0.04
        },
        model: {
            label: 'Model Walk', speed: 4.8, amp: 0.28, knee: 0.35, arm: 0.38,
            bounce: 0.055, hip: 0.14, torso: 0.09, shoulder: 0.12, head: 0.045, lean: 0.02
        },
        power: {
            label: 'Power Walk', speed: 9.4, amp: 0.5, knee: 0.65, arm: 0.95,
            bounce: 0.02, hip: 0.035, torso: 0.04, shoulder: 0.06, head: 0.02, lean: 0.07
        },
        sashay: {
            label: 'Sashay', speed: 5.8, amp: 0.34, knee: 0.4, arm: 0.6,
            bounce: 0.08, hip: 0.18, torso: 0.12, shoulder: 0.14, head: 0.06, lean: 0.03
        }
    };

    function makeFabricTexture(THREE, baseHex, pattern) {
        const c = document.createElement('canvas');
        c.width = 128;
        c.height = 128;
        const g = c.getContext('2d');
        const col = new THREE.Color(baseHex);
        g.fillStyle = `#${col.getHexString()}`;
        g.fillRect(0, 0, 128, 128);

        g.globalAlpha = 0.18;
        for (let y = 0; y < 128; y += 3) {
            g.fillStyle = y % 6 === 0 ? '#fff' : '#000';
            g.fillRect(0, y, 128, 1);
        }
        g.globalAlpha = 0.12;
        for (let x = 0; x < 128; x += 4) {
            g.fillStyle = '#fff';
            g.fillRect(x, 0, 1, 128);
        }

        if (pattern === 'leather') {
            g.globalAlpha = 0.25;
            for (let i = 0; i < 40; i++) {
                g.beginPath();
                g.arc(Math.random() * 128, Math.random() * 128, 2 + Math.random() * 6, 0, Math.PI * 2);
                g.fillStyle = '#000';
                g.fill();
            }
        } else if (pattern === 'knit') {
            g.globalAlpha = 0.22;
            g.strokeStyle = '#fff';
            for (let y = 4; y < 128; y += 8) {
                g.beginPath();
                for (let x = 0; x < 128; x += 8) {
                    g.moveTo(x, y);
                    g.quadraticCurveTo(x + 4, y - 3, x + 8, y);
                }
                g.stroke();
            }
        } else if (pattern === 'silk') {
            const grad = g.createLinearGradient(0, 0, 128, 128);
            grad.addColorStop(0, 'rgba(255,255,255,0.35)');
            grad.addColorStop(0.5, 'rgba(255,255,255,0)');
            grad.addColorStop(1, 'rgba(0,0,0,0.2)');
            g.globalAlpha = 1;
            g.fillStyle = grad;
            g.fillRect(0, 0, 128, 128);
        } else if (pattern === 'denim') {
            g.globalAlpha = 0.2;
            for (let i = 0; i < 80; i++) {
                g.fillStyle = Math.random() > 0.5 ? '#fff' : '#000';
                g.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
            }
        }

        g.globalAlpha = 1;
        const tex = new THREE.CanvasTexture(c);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(2, 2);
        tex.needsUpdate = true;
        return tex;
    }

    function patternForSlot(slot, piece) {
        const name = ((piece && piece.name) || '').toLowerCase();
        if (slot === 'outer' || name.includes('leather')) return 'leather';
        if (name.includes('knit') || name.includes('tee') || name.includes('shirt')) return 'knit';
        if (name.includes('silk') || name.includes('gown') || name.includes('evening') || slot === 'finale') return 'silk';
        if (name.includes('jean') || name.includes('denim') || name.includes('chino')) return 'denim';
        if (slot === 'bottoms') return 'denim';
        if (slot === 'shoes') return 'leather';
        return 'knit';
    }

    function createAvatar(THREE, options) {
        options = options || {};
        const charId = options.characterId || 'female';
        const profile = CHARACTER_LIBRARY[charId] || CHARACTER_LIBRARY.female;

        const root = new THREE.Group();
        root.name = 'RunwayAvatar';

        const mats = {
            skin: new THREE.MeshStandardMaterial({ color: profile.skin, roughness: 0.55 }),
            hair: new THREE.MeshStandardMaterial({ color: profile.hair, roughness: 0.85 }),
            street: new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.85 }),
            bottoms: new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.75 }),
            top: new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.7 }),
            shoes: new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.4, metalness: 0.2 }),
            outer: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 }),
            accent: new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35, metalness: 0.35 })
        };

        function mesh(geo, mat) {
            const m = new THREE.Mesh(geo, mat);
            m.castShadow = true;
            return m;
        }

        // —— Body with joint pivots so limbs swing from hips/shoulders ——
        const hips = new THREE.Group();
        hips.position.y = 0.72;
        root.add(hips);

        const hipPad = mesh(new THREE.BoxGeometry(0.62, 0.18, 0.34), mats.street);
        hips.add(hipPad);

        const torsoGroup = new THREE.Group();
        torsoGroup.position.y = 0.3;
        hips.add(torsoGroup);

        const torso = mesh(new THREE.BoxGeometry(0.62, 0.48, 0.36), mats.top);
        torso.position.y = 0;
        torso.name = 'top';
        torsoGroup.add(torso);

        const sleeveL = mesh(new THREE.BoxGeometry(0.2, 0.36, 0.2), mats.top);
        sleeveL.position.set(-0.44, 0, 0);
        torsoGroup.add(sleeveL);
        const sleeveR = mesh(new THREE.BoxGeometry(0.2, 0.36, 0.2), mats.top);
        sleeveR.position.set(0.44, 0, 0);
        torsoGroup.add(sleeveR);

        const outer = mesh(new THREE.BoxGeometry(0.82, 0.58, 0.46), mats.outer);
        outer.position.y = -0.02;
        outer.visible = false;
        outer.name = 'outer';
        torsoGroup.add(outer);

        const collar = mesh(new THREE.BoxGeometry(0.52, 0.1, 0.4), mats.outer);
        collar.position.set(0, 0.26, 0.02);
        collar.visible = false;
        torsoGroup.add(collar);

        // Shoulder pivots
        const armL = new THREE.Group();
        armL.position.set(-0.44, 0.12, 0);
        torsoGroup.add(armL);
        const armLMesh = mesh(new THREE.BoxGeometry(0.16, 0.42, 0.16), mats.skin);
        armLMesh.position.y = -0.2;
        armL.add(armLMesh);
        const handL = mesh(new THREE.SphereGeometry(0.08, 8, 8), mats.skin);
        handL.position.y = -0.42;
        armL.add(handL);

        const armR = new THREE.Group();
        armR.position.set(0.44, 0.12, 0);
        torsoGroup.add(armR);
        const armRMesh = mesh(new THREE.BoxGeometry(0.16, 0.42, 0.16), mats.skin);
        armRMesh.position.y = -0.2;
        armR.add(armRMesh);
        const handR = mesh(new THREE.SphereGeometry(0.08, 8, 8), mats.skin);
        handR.position.y = -0.42;
        armR.add(handR);

        // Head group (bobs with gait)
        const headGroup = new THREE.Group();
        headGroup.position.y = 0.56;
        torsoGroup.add(headGroup);

        const head = mesh(new THREE.SphereGeometry(0.42, 22, 18), mats.skin);
        headGroup.add(head);

        const hair = mesh(new THREE.SphereGeometry(0.46, 16, 14), mats.hair);
        hair.scale.set(1.1, 0.78, 1.12);
        hair.position.set(0, 0.2, -0.04);
        headGroup.add(hair);

        const bangL = mesh(new THREE.SphereGeometry(0.14, 10, 8), mats.hair);
        bangL.position.set(-0.28, 0.06, 0.18);
        bangL.scale.set(0.75, 1.15, 0.7);
        headGroup.add(bangL);
        const bangR = mesh(new THREE.SphereGeometry(0.14, 10, 8), mats.hair);
        bangR.position.set(0.28, 0.06, 0.18);
        bangR.scale.set(0.75, 1.15, 0.7);
        headGroup.add(bangR);

        // Expressive face
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.35 });
        const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
        const lipMat = new THREE.MeshStandardMaterial({ color: profile.lip || 0xe06b7a, roughness: 0.4 });
        const browMat = new THREE.MeshStandardMaterial({ color: profile.hair, roughness: 0.9 });
        const es = profile.eyeScale || 1;

        const eyeL = new THREE.Group();
        eyeL.position.set(-0.14, 0.02, 0.36);
        headGroup.add(eyeL);
        const eyeR = new THREE.Group();
        eyeR.position.set(0.14, 0.02, 0.36);
        headGroup.add(eyeR);

        [eyeL, eyeR].forEach((eye) => {
            const white = mesh(new THREE.SphereGeometry(0.09 * es, 12, 10), whiteMat);
            white.scale.set(1.15, 1.2, 0.55);
            eye.add(white);
            const pupil = mesh(new THREE.SphereGeometry(0.045 * es, 10, 8), eyeMat);
            pupil.position.z = 0.04;
            eye.add(pupil);
            const shine = mesh(new THREE.SphereGeometry(0.018 * es, 6, 6), whiteMat);
            shine.position.set(-0.02, 0.025, 0.07);
            eye.add(shine);
            eye.userData.lid = white;
        });

        const browL = mesh(new THREE.BoxGeometry(0.14, 0.025, 0.03), browMat);
        browL.position.set(-0.14, 0.14, 0.38);
        browL.rotation.z = 0.15;
        headGroup.add(browL);
        const browR = mesh(new THREE.BoxGeometry(0.14, 0.025, 0.03), browMat);
        browR.position.set(0.14, 0.14, 0.38);
        browR.rotation.z = -0.15;
        headGroup.add(browR);

        const nose = mesh(new THREE.SphereGeometry(0.035, 8, 8), mats.skin);
        nose.position.set(0, -0.06, 0.4);
        nose.scale.set(0.7, 0.85, 0.75);
        headGroup.add(nose);

        const mouth = mesh(new THREE.BoxGeometry(0.12, 0.03, 0.025), lipMat);
        mouth.position.set(0, -0.16, 0.38);
        mouth.scale.set(1, 0.75, 1);
        headGroup.add(mouth);

        // Character-specific flair — bring each cast member to life
        if (profile.trait === 'horns') {
            const hornMat = new THREE.MeshStandardMaterial({ color: 0x2a1810, roughness: 0.7 });
            const hornL = mesh(new THREE.ConeGeometry(0.08, 0.28, 8), hornMat);
            hornL.position.set(-0.22, 0.38, -0.05);
            hornL.rotation.z = 0.35;
            headGroup.add(hornL);
            const hornR = mesh(new THREE.ConeGeometry(0.08, 0.28, 8), hornMat);
            hornR.position.set(0.22, 0.38, -0.05);
            hornR.rotation.z = -0.35;
            headGroup.add(hornR);
        } else if (profile.trait === 'ears') {
            const earL = mesh(new THREE.SphereGeometry(0.16, 10, 8), mats.skin);
            earL.position.set(-0.38, 0.22, 0);
            earL.scale.set(0.7, 1.1, 0.55);
            headGroup.add(earL);
            const earR = mesh(new THREE.SphereGeometry(0.16, 10, 8), mats.skin);
            earR.position.set(0.38, 0.22, 0);
            earR.scale.set(0.7, 1.1, 0.55);
            headGroup.add(earR);
            const innerL = mesh(new THREE.SphereGeometry(0.08, 8, 6), lipMat);
            innerL.position.set(-0.38, 0.2, 0.04);
            innerL.scale.set(0.5, 0.7, 0.3);
            headGroup.add(innerL);
            const innerR = mesh(new THREE.SphereGeometry(0.08, 8, 6), lipMat);
            innerR.position.set(0.38, 0.2, 0.04);
            innerR.scale.set(0.5, 0.7, 0.3);
            headGroup.add(innerR);
        } else if (profile.trait === 'bob') {
            hair.scale.set(1.25, 0.95, 1.2);
            hair.position.y = 0.12;
            bangL.scale.set(0.95, 1.35, 0.85);
            bangR.scale.set(0.95, 1.35, 0.85);
        } else if (profile.trait === 'updo') {
            const bun = mesh(new THREE.SphereGeometry(0.22, 12, 10), mats.hair);
            bun.position.set(0, 0.42, -0.08);
            headGroup.add(bun);
            const earringL = mesh(new THREE.SphereGeometry(0.04, 8, 8), mats.accent);
            earringL.position.set(-0.4, -0.08, 0.05);
            headGroup.add(earringL);
            const earringR = mesh(new THREE.SphereGeometry(0.04, 8, 8), mats.accent);
            earringR.position.set(0.4, -0.08, 0.05);
            headGroup.add(earringR);
        }

        // Hidden face cards (palette only)
        const faceGeo = new THREE.PlaneGeometry(0.72, 0.78);
        const faceMat = new THREE.MeshBasicMaterial({
            transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, visible: false
        });
        const faceFront = new THREE.Mesh(faceGeo, faceMat);
        faceFront.visible = false;
        headGroup.add(faceFront);
        const faceBack = new THREE.Mesh(faceGeo.clone(), faceMat.clone());
        faceBack.visible = false;
        headGroup.add(faceBack);

        const loader = new THREE.TextureLoader();
        loader.load(profile.src, () => {
            mats.hair.color.setHex(profile.hair);
            mats.skin.color.setHex(profile.skin);
            browMat.color.setHex(profile.hair);
        }, undefined, () => { /* keep defaults */ });

        const skirt = mesh(new THREE.CylinderGeometry(0.2, 0.48, 0.4, 10, 1, true), mats.bottoms.clone());
        skirt.position.y = -0.1;
        skirt.visible = false;
        skirt.name = 'skirt';
        hips.add(skirt);

        const bagProp = mesh(new THREE.BoxGeometry(0.2, 0.26, 0.08), mats.accent);
        bagProp.position.set(0.46, -0.1, 0.12);
        bagProp.visible = false;
        bagProp.name = 'bagProp';
        torsoGroup.add(bagProp);

        // Chest / back logo badge (canvas texture)
        const logoGeo = new THREE.PlaneGeometry(0.28, 0.28);
        const logoCanvas = document.createElement('canvas');
        logoCanvas.width = 128;
        logoCanvas.height = 128;
        const logoMat = new THREE.MeshBasicMaterial({
            map: new THREE.CanvasTexture(logoCanvas),
            transparent: true,
            opacity: 0,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        const logoBadge = new THREE.Mesh(logoGeo, logoMat);
        logoBadge.position.set(0, 0.08, 0.3);
        logoBadge.visible = false;
        logoBadge.name = 'logoBadge';
        torsoGroup.add(logoBadge);

        function paintLogo(markKey) {
            const g = logoCanvas.getContext('2d');
            g.clearRect(0, 0, 128, 128);
            if (!markKey || !global.drawLogoMark) {
                logoMat.opacity = 0;
                logoBadge.visible = false;
                logoMat.map.needsUpdate = true;
                return;
            }
            g.save();
            g.translate(64, 64);
            global.drawLogoMark(g, markKey, 88);
            g.restore();
            logoMat.map.needsUpdate = true;
            logoMat.opacity = 1;
            logoBadge.visible = true;
        }

        // Leg pivots at hips — shoes ride with legs
        const legL = new THREE.Group();
        legL.position.set(-0.17, 0, 0);
        hips.add(legL);
        const legLMesh = mesh(new THREE.BoxGeometry(0.24, 0.52, 0.26), mats.bottoms);
        legLMesh.position.y = -0.34;
        legLMesh.name = 'bottomsL';
        legL.add(legLMesh);
        const shoeL = mesh(new THREE.BoxGeometry(0.3, 0.2, 0.44), mats.shoes);
        shoeL.position.set(0, -0.62, 0.06);
        shoeL.name = 'shoesL';
        legL.add(shoeL);
        const heelL = mesh(new THREE.BoxGeometry(0.08, 0.18, 0.08), mats.shoes);
        heelL.position.set(0, -0.7, -0.12);
        heelL.visible = false;
        legL.add(heelL);

        const legR = new THREE.Group();
        legR.position.set(0.17, 0, 0);
        hips.add(legR);
        const legRMesh = mesh(new THREE.BoxGeometry(0.24, 0.52, 0.26), mats.bottoms);
        legRMesh.position.y = -0.34;
        legRMesh.name = 'bottomsR';
        legR.add(legRMesh);
        const shoeR = mesh(new THREE.BoxGeometry(0.3, 0.2, 0.44), mats.shoes);
        shoeR.position.set(0, -0.62, 0.06);
        shoeR.name = 'shoesR';
        legR.add(shoeR);
        const heelR = mesh(new THREE.BoxGeometry(0.08, 0.18, 0.08), mats.shoes);
        heelR.position.set(0, -0.7, -0.12);
        heelR.visible = false;
        legR.add(heelR);

        const finale = mesh(new THREE.BoxGeometry(0.4, 0.1, 0.14), mats.accent);
        finale.position.set(0, 0.2, 0.28);
        finale.visible = false;
        finale.name = 'finale';
        torsoGroup.add(finale);

        function dressMaterial(matKey, hex, pattern) {
            const mat = mats[matKey];
            if (!mat) return;
            const color = new THREE.Color(hex);
            const nextHex = color.getHex();
            if (mat.userData.dressed === nextHex && mat.userData.pattern === pattern && mat.map) {
                mat.color.copy(color);
                return;
            }
            mat.color.copy(color);
            if (mat.map) {
                mat.map.dispose();
                mat.map = null;
            }
            mat.map = makeFabricTexture(THREE, hex, pattern);
            mat.needsUpdate = true;
            mat.userData.dressed = nextHex;
            mat.userData.pattern = pattern;
        }

        function setOwnedSlots(ownedSlots) {
            const has = (s) => !!ownedSlots[s];
            if (!has('top')) {
                dressMaterial('top', 0x9ca3af, 'knit');
                sleeveL.material = mats.top;
                sleeveR.material = mats.top;
                paintLogo(null);
            }
            if (!has('bottoms')) dressMaterial('bottoms', 0x9ca3af, 'denim');
            outer.visible = has('outer');
            collar.visible = has('outer');
            finale.visible = has('finale');
            heelL.visible = has('shoes');
            heelR.visible = has('shoes');
            skirt.visible = has('bottoms') || has('finale');
            bagProp.visible = has('finale') || has('outer');
            if (!has('shoes')) dressMaterial('shoes', 0x6b7280, 'leather');
        }

        let lastOutfitKey = '';
        function applyPieceColors(pieces, ownedSlots) {
            const key = JSON.stringify({
                o: ownedSlots,
                p: (pieces || []).filter((x) => ownedSlots && ownedSlots[x.slot]).map((x) => [x.slot, x.color])
            });
            if (key === lastOutfitKey) return;
            lastOutfitKey = key;
            (pieces || []).forEach((p) => {
                if (!ownedSlots[p.slot]) return;
                const hex = new THREE.Color(p.color).getHex();
                const pat = patternForSlot(p.slot, p);
                if (p.slot === 'top') {
                    dressMaterial('top', hex, pat);
                    sleeveL.material = mats.top;
                    sleeveR.material = mats.top;
                    paintLogo(p.logo || null);
                }
                if (p.slot === 'bottoms') {
                    dressMaterial('bottoms', hex, pat);
                    if (!skirt.material || skirt.material === mats.bottoms) {
                        skirt.material = mats.bottoms.clone();
                        skirt.material.side = THREE.DoubleSide;
                    } else {
                        skirt.material.color.copy(mats.bottoms.color);
                        if (mats.bottoms.map) skirt.material.map = mats.bottoms.map;
                    }
                    skirt.visible = true;
                    skirt.scale.set(1.05, 1.05, 1.05);
                }
                if (p.slot === 'shoes') {
                    dressMaterial('shoes', hex, 'leather');
                    heelL.visible = true;
                    heelR.visible = true;
                }
                if (p.slot === 'outer') {
                    dressMaterial('outer', hex, pat);
                    outer.visible = true;
                    collar.visible = true;
                    outer.scale.set(1.08, 1.08, 1.08);
                    bagProp.visible = true;
                    bagProp.material.color.setHex(hex);
                }
                if (p.slot === 'finale') {
                    dressMaterial('accent', hex, 'silk');
                    finale.visible = true;
                    bagProp.visible = true;
                    skirt.visible = true;
                }
            });
            setOwnedSlots(ownedSlots);
        }

        function setCameraFacing() {
            faceFront.visible = false;
            faceBack.visible = false;
        }

        let walkT = 0;
        let lifeT = 0;
        let blinkT = 2.2 + Math.random();
        const BASE_SCALE = 1.0;
        let begT = 0;
        let begDur = 0;
        let gaitId = 'strut';
        let dressSnapT = 0;
        let dressSnapSlot = null;

        function setGait(id) {
            if (GAIT_PRESETS[id]) gaitId = id;
        }

        function playBeg(seconds) {
            begDur = Math.max(0.4, seconds || 1.1);
            begT = begDur;
        }

        function playDressSnap(slot) {
            dressSnapSlot = slot || 'top';
            dressSnapT = 0.9;
        }

        function updateBlink(dt) {
            blinkT -= dt;
            if (blinkT <= 0) {
                blinkT = 2.4 + Math.random() * 2.8;
            }
            const blinking = blinkT < 0.12;
            const lid = blinking ? 0.15 : 1;
            eyeL.scale.y = lid;
            eyeR.scale.y = lid;
        }

        function update(dt, state) {
            state = state || {};
            const { jumping, sliding, dressing, dying, deathT, dressSlot, jumpProgress } = state;
            if (state.gait && GAIT_PRESETS[state.gait]) gaitId = state.gait;
            const gait = GAIT_PRESETS[gaitId] || GAIT_PRESETS.strut;
            lifeT += dt;
            updateBlink(dt);

            if (dying) {
                const t = Math.min(1, (deathT || 0) / 1.15);
                root.rotation.z = t * Math.PI * 1.35;
                root.rotation.x = t * 0.9;
                root.position.y = Math.sin(t * Math.PI) * 0.35 - t * 0.55;
                root.position.x = Math.sin(t * 10) * 0.08;
                const s = Math.max(0.05, BASE_SCALE * (1 - t * 0.25));
                root.scale.set(s, Math.max(0.05, s * (1 - t * 0.35)), s);
                return;
            }

            if (begT > 0) {
                begT = Math.max(0, begT - dt);
                const u = 1 - begT / begDur;
                const bow = Math.sin(Math.min(1, u * 1.4) * Math.PI) * 0.55;
                root.rotation.x = 0;
                root.rotation.z = 0;
                root.position.y = 0;
                root.scale.set(BASE_SCALE, BASE_SCALE, BASE_SCALE);
                torsoGroup.rotation.x = bow;
                armL.rotation.x = -0.4 - bow * 0.5;
                armR.rotation.x = -0.4 - bow * 0.5;
                headGroup.rotation.x = -bow * 0.35;
                return;
            }

            // Jump pose — animate through the arc (never freeze mid-air)
            if (jumping) {
                const p = Math.max(0, Math.min(1, Number(jumpProgress) || 0));
                const lift = Math.sin(p * Math.PI);
                // Asymmetric phases: tuck on rise, extend on fall
                const rise = Math.sin(Math.min(1, p * 2) * Math.PI * 0.5);
                const fall = p > 0.5 ? Math.sin((p - 0.5) * 2 * Math.PI * 0.5) : 0;
                walkT += dt * 3.2;
                const flutter = Math.sin(walkT * 2.4) * 0.08 * lift;

                root.scale.set(BASE_SCALE, BASE_SCALE, BASE_SCALE);
                root.position.y = 0.06 + lift * 0.22;
                root.position.x = flutter * 0.15;
                root.rotation.x = -0.04 - lift * 0.06;
                root.rotation.z = flutter * 0.4;

                hips.rotation.set(0, flutter * 0.3, 0);
                torsoGroup.rotation.set(-0.1 - lift * 0.12, flutter * 0.2, 0);
                headGroup.rotation.set(0.06 * lift - fall * 0.05, 0, flutter * 0.15);

                // Lead leg tucks hard on rise; trail extends for landing
                legL.rotation.x = -0.2 - rise * 1.05 + fall * 0.35;
                legR.rotation.x = 0.15 + rise * 0.55 - fall * 0.45;
                shoeL.rotation.x = rise * 0.55 - fall * 0.2;
                shoeR.rotation.x = rise * 0.35 + fall * 0.15;

                // Arms pump up then settle for balance
                armL.rotation.set(-0.4 - lift * 0.85 + flutter, 0, 0.2 + lift * 0.35);
                armR.rotation.set(-0.3 - lift * 0.7 - flutter, 0, -(0.2 + lift * 0.35));
                sleeveL.rotation.x = armL.rotation.x * 0.4;
                sleeveR.rotation.x = armR.rotation.x * 0.4;

                if (skirt.visible) {
                    skirt.rotation.set(0, flutter * 0.5, -flutter * 0.3);
                }
                return;
            }

            // Getting dressed
            if ((dressing && dressing > 0) || dressSnapT > 0) {
                if (dressSnapT > 0) dressSnapT = Math.max(0, dressSnapT - dt);
                const slot = dressSlot || dressSnapSlot || 'top';
                const u = dressing > 0 ? 1 - Math.min(1, dressing / 0.9) : 1 - dressSnapT / 0.9;
                const ease = 1 - Math.pow(1 - Math.min(1, u), 3);
                const reach = Math.sin(Math.min(1, u) * Math.PI);

                root.rotation.z = 0;
                root.rotation.x = 0;
                root.position.x = 0;
                root.position.y = 0.04 * reach;
                root.scale.set(BASE_SCALE, BASE_SCALE, BASE_SCALE);
                hips.rotation.y = 0;
                torsoGroup.rotation.set(-0.08 * reach, 0, 0);
                headGroup.rotation.set(0.1 * reach, 0, 0);

                if (slot === 'shoes') {
                    armL.rotation.set(-0.2, 0, 0);
                    armR.rotation.set(-0.2, 0, 0);
                    legL.rotation.x = 0.4 * reach;
                    legR.rotation.x = -0.12;
                } else if (slot === 'bottoms') {
                    armL.rotation.set(-0.55 * reach, 0, 0);
                    armR.rotation.set(-0.55 * reach, 0, 0);
                    legL.rotation.x = 0.12;
                    legR.rotation.x = -0.12;
                    if (skirt.visible) {
                        const s = 0.25 + ease * 0.8;
                        skirt.scale.set(s, s, s);
                    }
                } else if (slot === 'outer') {
                    armL.rotation.set(-1.1 * reach, 0, 0.35 * reach);
                    armR.rotation.set(-1.1 * reach, 0, -0.35 * reach);
                    legL.rotation.x = 0;
                    legR.rotation.x = 0;
                    if (outer.visible) {
                        const s = 0.35 + ease * 0.7;
                        outer.scale.set(s, 0.5 + ease * 0.5, s);
                    }
                } else {
                    armL.rotation.set(-1.35 * reach, 0, 0.25 * reach);
                    armR.rotation.set(-1.35 * reach, 0, -0.25 * reach);
                    legL.rotation.x = 0;
                    legR.rotation.x = 0;
                }
                sleeveL.rotation.x = armL.rotation.x * 0.35;
                sleeveR.rotation.x = armR.rotation.x * 0.35;

                if ((!dressing || dressing <= 0.05) && dressSnapT <= 0) {
                    armL.rotation.z = 0;
                    armR.rotation.z = 0;
                    if (skirt.visible) skirt.scale.set(1, 1, 1);
                    if (outer.visible) outer.scale.set(1, 1, 1);
                }
                return;
            }

            if (skirt.visible) skirt.scale.set(1, 1, 1);
            if (outer.visible) outer.scale.set(1, 1, 1);

            // —— Fashion gait cycle ——
            const speed = sliding ? gait.speed * 0.28 : gait.speed;
            walkT += dt * speed;
            const phase = walkT;
            const swing = Math.sin(phase);
            const swing2 = Math.sin(phase * 2);
            const amp = sliding ? gait.amp * 0.35 : gait.amp;

            // Legs with knee-ish secondary bend via shoe pitch
            legL.rotation.x = swing * amp;
            legR.rotation.x = -swing * amp;
            shoeL.rotation.x = Math.max(0, -swing) * gait.knee * 0.35;
            shoeR.rotation.x = Math.max(0, swing) * gait.knee * 0.35;

            // Opposite arm swing + slight shoulder open
            armL.rotation.x = -swing * gait.arm;
            armR.rotation.x = swing * gait.arm;
            armL.rotation.z = 0.12 + Math.abs(swing) * gait.shoulder * 0.4;
            armR.rotation.z = -(0.12 + Math.abs(swing) * gait.shoulder * 0.4);
            sleeveL.rotation.x = armL.rotation.x * 0.4;
            sleeveR.rotation.x = armR.rotation.x * 0.4;

            // Hip sway + torso counter-rotate + lean
            hips.rotation.y = sliding ? 0 : swing * gait.hip;
            hips.rotation.z = sliding ? 0 : -swing * gait.hip * 0.35;
            torsoGroup.rotation.y = sliding ? 0 : -swing * gait.torso;
            torsoGroup.rotation.z = sliding ? 0 : swing * gait.shoulder * 0.5;
            torsoGroup.rotation.x = -gait.lean + swing2 * 0.02;

            // Head follows the walk with a soft bob / look
            headGroup.rotation.y = sliding ? 0 : -swing * gait.head * 1.2;
            headGroup.rotation.x = gait.head * 0.4 + Math.sin(lifeT * 1.7) * 0.015;
            headGroup.rotation.z = sliding ? 0 : swing * gait.head * 0.5;
            mouth.scale.y = 0.65 + Math.abs(Math.sin(lifeT * 2.1)) * 0.15;

            // Skirt swish
            if (skirt.visible && !sliding) {
                skirt.rotation.y = swing * gait.hip * 0.8;
                skirt.rotation.z = -swing * gait.hip * 0.25;
            } else {
                skirt.rotation.set(0, 0, 0);
            }

            if (sliding) {
                root.scale.set(BASE_SCALE * 1.15, BASE_SCALE * 0.55, BASE_SCALE * 1.1);
                root.position.y = 0;
                root.position.x = 0;
                legL.rotation.x = 0.15;
                legR.rotation.x = 0.15;
                armL.rotation.x = 0.4;
                armR.rotation.x = 0.4;
            } else {
                root.scale.set(BASE_SCALE, BASE_SCALE, BASE_SCALE);
                root.position.y = Math.abs(swing) * gait.bounce;
                root.position.x = swing * gait.hip * 0.04;
            }
            root.rotation.z = 0;
            root.rotation.x = 0;
        }

        dressMaterial('top', 0x9ca3af, 'knit');
        dressMaterial('bottoms', 0x9ca3af, 'denim');
        dressMaterial('shoes', 0x6b7280, 'leather');

        return {
            root,
            applyPieceColors,
            setOwnedSlots,
            setCameraFacing,
            setGait,
            playDressSnap,
            update,
            playBeg,
            mats,
            characterId: charId,
            profile,
            faceFront,
            faceBack
        };
    }

    function createRenderer(canvas, THREE, options) {
        const renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: false,
            preserveDrawingBuffer: false,
            powerPreference: 'high-performance'
        });
        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio(1);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
        camera.position.set(0, 1.15, 2.85);
        camera.lookAt(0, 1.15, 0);

        const hemi = new THREE.HemisphereLight(0xfff4e8, 0x4a4058, 1.15);
        scene.add(hemi);
        const key = new THREE.DirectionalLight(0xffffff, 1.05);
        key.position.set(2.0, 4.0, 2.8);
        scene.add(key);
        const rim = new THREE.DirectionalLight(0xffc060, 0.95);
        rim.position.set(-2.2, 2.4, -1.8);
        scene.add(rim);
        const fill = new THREE.PointLight(0xffe8d0, 0.45, 14);
        fill.position.set(0, 2.0, 2.2);
        scene.add(fill);
        const faceLight = new THREE.PointLight(0xfff0e0, 0.55, 6);
        faceLight.position.set(0, 1.75, 1.2);
        scene.add(faceLight);

        const avatar = createAvatar(THREE, options);
        scene.add(avatar.root);

        function resize(w, h) {
            renderer.setSize(w, h, false);
            camera.aspect = w / Math.max(1, h);
            camera.updateProjectionMatrix();
        }

        function setCameraMode(mode) {
            avatar.setCameraFacing(mode);
            camera.fov = mode === 'side' ? 34 : 36;
            if (mode === 'front') {
                camera.position.set(0, 1.05, 2.75);
                camera.lookAt(0, 1.0, 0);
                avatar.root.rotation.y = 0;
            } else if (mode === 'side') {
                // Camera on +X, character faces +Z → clear side silhouette for gait
                camera.position.set(3.05, 1.08, 0);
                camera.lookAt(0, 1.02, 0);
                avatar.root.rotation.y = 0;
            } else {
                camera.position.set(0, 1.05, 2.75);
                camera.lookAt(0, 1.0, 0);
                avatar.root.rotation.y = Math.PI;
            }
            camera.updateProjectionMatrix();
        }

        function render() {
            renderer.render(scene, camera);
        }

        return { renderer, scene, camera, avatar, resize, setCameraMode, render };
    }

    global.Runway3D = { createAvatar, createRenderer, CHARACTER_LIBRARY, GAIT_PRESETS };
})(window);
