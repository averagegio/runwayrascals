/**
 * Low-poly Three.js runway avatar with character-library textures
 * and fabric materials that update as outfit pieces unlock.
 */
(function (global) {
    const CHARACTER_LIBRARY = {
        male: { src: 'chibibrodoll.png', hair: 0x1a1a1a, skin: 0xe8b896, label: 'Devil Boy' },
        female: { src: 'chibidoll2.png', hair: 0x2d1b14, skin: 0xffdbac, label: 'Mouse Girl' },
        fashion: { src: 'chibidollfashion.png', hair: 0x111111, skin: 0xf5d0b0, label: 'Fashion Doll' },
        evening: { src: 'chibidoll3.png', hair: 0x3b2118, skin: 0xffdbac, label: 'Evening Doll' }
    };

    function makeFabricTexture(THREE, baseHex, pattern) {
        const c = document.createElement('canvas');
        c.width = 128;
        c.height = 128;
        const g = c.getContext('2d');
        const col = new THREE.Color(baseHex);
        g.fillStyle = `#${col.getHexString()}`;
        g.fillRect(0, 0, 128, 128);

        // Weave / couture grain
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

        // Subway Surfers–inspired chibi proportions: big head, short body, chunky shoes
        const hips = mesh(new THREE.BoxGeometry(0.62, 0.18, 0.34), mats.street);
        hips.position.y = 0.72;
        root.add(hips);

        const torso = mesh(new THREE.BoxGeometry(0.62, 0.48, 0.36), mats.top);
        torso.position.y = 1.02;
        torso.name = 'top';
        root.add(torso);

        const sleeveL = mesh(new THREE.BoxGeometry(0.2, 0.36, 0.2), mats.top);
        sleeveL.position.set(-0.44, 1.02, 0);
        root.add(sleeveL);
        const sleeveR = mesh(new THREE.BoxGeometry(0.2, 0.36, 0.2), mats.top);
        sleeveR.position.set(0.44, 1.02, 0);
        root.add(sleeveR);

        const outer = mesh(new THREE.BoxGeometry(0.82, 0.58, 0.46), mats.outer);
        outer.position.y = 1.0;
        outer.visible = false;
        outer.name = 'outer';
        root.add(outer);

        const collar = mesh(new THREE.BoxGeometry(0.52, 0.1, 0.4), mats.outer);
        collar.position.set(0, 1.28, 0.02);
        collar.visible = false;
        root.add(collar);

        // Oversized expressive head
        const head = mesh(new THREE.SphereGeometry(0.42, 22, 18), mats.skin);
        head.position.y = 1.58;
        root.add(head);

        const hair = mesh(new THREE.SphereGeometry(0.46, 16, 14), mats.hair);
        hair.scale.set(1.1, 0.78, 1.12);
        hair.position.set(0, 1.78, -0.04);
        root.add(hair);

        const bangL = mesh(new THREE.SphereGeometry(0.14, 10, 8), mats.hair);
        bangL.position.set(-0.28, 1.64, 0.18);
        bangL.scale.set(0.75, 1.15, 0.7);
        root.add(bangL);
        const bangR = mesh(new THREE.SphereGeometry(0.14, 10, 8), mats.hair);
        bangR.position.set(0.28, 1.64, 0.18);
        bangR.scale.set(0.75, 1.15, 0.7);
        root.add(bangR);

        // Big expressive eyes (SS-style readability)
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.35 });
        const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
        const lipMat = new THREE.MeshStandardMaterial({ color: 0xe06b7a, roughness: 0.4 });
        const browMat = new THREE.MeshStandardMaterial({ color: profile.hair, roughness: 0.9 });

        [[-0.14, 1.6, 0.36], [0.14, 1.6, 0.36]].forEach((pos) => {
            const white = mesh(new THREE.SphereGeometry(0.09, 12, 10), whiteMat);
            white.position.set(pos[0], pos[1], pos[2]);
            white.scale.set(1.15, 1.2, 0.55);
            root.add(white);
            const pupil = mesh(new THREE.SphereGeometry(0.045, 10, 8), eyeMat);
            pupil.position.set(pos[0], pos[1], pos[2] + 0.04);
            root.add(pupil);
            const shine = mesh(new THREE.SphereGeometry(0.018, 6, 6), whiteMat);
            shine.position.set(pos[0] - 0.02, pos[1] + 0.025, pos[2] + 0.07);
            root.add(shine);
        });

        const browL = mesh(new THREE.BoxGeometry(0.14, 0.025, 0.03), browMat);
        browL.position.set(-0.14, 1.72, 0.38);
        browL.rotation.z = 0.15;
        root.add(browL);
        const browR = mesh(new THREE.BoxGeometry(0.14, 0.025, 0.03), browMat);
        browR.position.set(0.14, 1.72, 0.38);
        browR.rotation.z = -0.15;
        root.add(browR);

        const nose = mesh(new THREE.SphereGeometry(0.035, 8, 8), mats.skin);
        nose.position.set(0, 1.52, 0.4);
        nose.scale.set(0.7, 0.85, 0.75);
        root.add(nose);

        const mouth = mesh(new THREE.BoxGeometry(0.12, 0.03, 0.025), lipMat);
        mouth.position.set(0, 1.42, 0.38);
        mouth.scale.set(1, 0.75, 1);
        root.add(mouth);

        // Face cards kept but hidden — front cam uses sculpted features, not the library PNG
        const faceGeo = new THREE.PlaneGeometry(0.72, 0.78);
        const faceMat = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            depthWrite: false,
            side: THREE.DoubleSide,
            visible: false
        });
        const faceFront = new THREE.Mesh(faceGeo, faceMat);
        faceFront.position.set(0, 1.58, 0.42);
        faceFront.name = 'faceFront';
        faceFront.visible = false;
        root.add(faceFront);
        const faceBack = new THREE.Mesh(faceGeo.clone(), faceMat.clone());
        faceBack.position.set(0, 1.58, -0.42);
        faceBack.rotation.y = Math.PI;
        faceBack.name = 'faceBack';
        faceBack.visible = false;
        root.add(faceBack);

        const loader = new THREE.TextureLoader();
        loader.load(profile.src, (tex) => {
            // Pull palette from character art without pasting the full pic onto the head
            mats.hair.color.setHex(profile.hair);
            mats.skin.color.setHex(profile.skin);
            browMat.color.setHex(profile.hair);
            faceFront.visible = false;
            faceBack.visible = false;
        }, undefined, () => {
            faceFront.visible = false;
            faceBack.visible = false;
        });

        // Extra garment volume that “snaps on” when collected
        const skirt = mesh(new THREE.CylinderGeometry(0.2, 0.48, 0.4, 10, 1, true), mats.bottoms.clone());
        skirt.position.y = 0.62;
        skirt.visible = false;
        skirt.name = 'skirt';
        root.add(skirt);

        const bagProp = mesh(new THREE.BoxGeometry(0.2, 0.26, 0.08), mats.accent);
        bagProp.position.set(0.46, 0.92, 0.12);
        bagProp.visible = false;
        bagProp.name = 'bagProp';
        root.add(bagProp);

        const armL = mesh(new THREE.BoxGeometry(0.16, 0.42, 0.16), mats.skin);
        armL.position.set(-0.44, 0.78, 0);
        root.add(armL);
        const armR = mesh(new THREE.BoxGeometry(0.16, 0.42, 0.16), mats.skin);
        armR.position.set(0.44, 0.78, 0);
        root.add(armR);

        const legL = mesh(new THREE.BoxGeometry(0.24, 0.52, 0.26), mats.bottoms);
        legL.position.set(-0.17, 0.38, 0);
        legL.name = 'bottomsL';
        root.add(legL);
        const legR = mesh(new THREE.BoxGeometry(0.24, 0.52, 0.26), mats.bottoms);
        legR.position.set(0.17, 0.38, 0);
        legR.name = 'bottomsR';
        root.add(legR);

        // Chunky SS-style sneakers
        const shoeL = mesh(new THREE.BoxGeometry(0.3, 0.2, 0.44), mats.shoes);
        shoeL.position.set(-0.17, 0.1, 0.06);
        shoeL.name = 'shoesL';
        root.add(shoeL);
        const shoeR = mesh(new THREE.BoxGeometry(0.3, 0.2, 0.44), mats.shoes);
        shoeR.position.set(0.17, 0.1, 0.06);
        shoeR.name = 'shoesR';
        root.add(shoeR);

        const heelL = mesh(new THREE.BoxGeometry(0.08, 0.18, 0.08), mats.shoes);
        heelL.position.set(-0.17, 0.02, -0.12);
        heelL.visible = false;
        root.add(heelL);
        const heelR = mesh(new THREE.BoxGeometry(0.08, 0.18, 0.08), mats.shoes);
        heelR.position.set(0.17, 0.02, -0.12);
        heelR.visible = false;
        root.add(heelR);

        const finale = mesh(new THREE.BoxGeometry(0.4, 0.1, 0.14), mats.accent);
        finale.position.set(0, 1.22, 0.28);
        finale.visible = false;
        finale.name = 'finale';
        root.add(finale);

        function dressMaterial(matKey, hex, pattern) {
            const mat = mats[matKey];
            if (!mat) return;
            const color = new THREE.Color(hex);
            const nextHex = color.getHex();
            // Skip rebuild if already dressed this color/pattern (avoids per-frame GC / WebGL crash)
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

        function setCameraFacing(mode) {
            // Always use sculpted 3D face — never the library PNG billboard
            faceFront.visible = false;
            faceBack.visible = false;
        }

        let walkT = 0;
        const BASE_SCALE = 1.0;
        let begT = 0;
        let begDur = 0;

        function playBeg(seconds) {
            begDur = Math.max(0.4, seconds || 1.1);
            begT = begDur;
        }

        function update(dt, state) {
            state = state || {};
            const { jumping, sliding, dressing, dying, deathT } = state;
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
                // Courteous runway beg / bow before the walk
                const bow = Math.sin(Math.min(1, u * 1.4) * Math.PI) * 0.55;
                root.rotation.x = bow;
                root.rotation.z = 0;
                root.position.y = 0;
                root.scale.set(BASE_SCALE, BASE_SCALE, BASE_SCALE);
                armL.rotation.x = -0.4 - bow * 0.4;
                armR.rotation.x = -0.4 - bow * 0.4;
                return;
            }

            root.rotation.z = 0;
            root.rotation.x = 0;
            root.position.x = 0;
            walkT += dt * (sliding ? 2 : 8);
            // Keep jump pose simple — no limb swing (avoids hitch mid-air)
            const swing = jumping ? 0 : Math.sin(walkT) * (sliding ? 0.15 : 0.35);
            legL.rotation.x = swing;
            legR.rotation.x = -swing;
            armL.rotation.x = -swing * 0.7;
            armR.rotation.x = swing * 0.7;
            sleeveL.rotation.x = armL.rotation.x * 0.5;
            sleeveR.rotation.x = armR.rotation.x * 0.5;

            // Always reset scale each frame so jump/dress never compounds
            if (sliding) {
                root.scale.set(BASE_SCALE * 1.15, BASE_SCALE * 0.55, BASE_SCALE * 1.1);
                root.position.y = 0;
            } else if (jumping) {
                root.scale.set(BASE_SCALE, BASE_SCALE, BASE_SCALE);
                root.position.y = 0.18;
            } else {
                root.scale.set(BASE_SCALE, BASE_SCALE, BASE_SCALE);
                root.position.y = 0;
            }
            if (dressing) {
                const pulse = 1 + Math.sin(dressing * 20) * 0.06;
                root.scale.multiplyScalar(pulse);
            }
        }

        // Street default fabrics
        dressMaterial('top', 0x9ca3af, 'knit');
        dressMaterial('bottoms', 0x9ca3af, 'denim');
        dressMaterial('shoes', 0x6b7280, 'leather');

        return {
            root,
            applyPieceColors,
            setOwnedSlots,
            setCameraFacing,
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
            // Same distance/fov for both cams so on-screen blit size stays consistent
            camera.fov = 36;
            camera.position.set(0, 1.05, 2.75);
            camera.lookAt(0, 1.0, 0);
            if (mode === 'front') {
                // Face toward camera (+Z)
                avatar.root.rotation.y = 0;
            } else {
                // Run into the runway — camera sees the back
                avatar.root.rotation.y = Math.PI;
            }
            camera.updateProjectionMatrix();
        }

        function render() {
            renderer.render(scene, camera);
        }

        return { renderer, scene, camera, avatar, resize, setCameraMode, render };
    }

    global.Runway3D = { createAvatar, createRenderer, CHARACTER_LIBRARY };
})(window);
