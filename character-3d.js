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

        const hips = mesh(new THREE.BoxGeometry(0.55, 0.2, 0.3), mats.street);
        hips.position.y = 0.85;
        root.add(hips);

        const torso = mesh(new THREE.BoxGeometry(0.58, 0.55, 0.32), mats.top);
        torso.position.y = 1.2;
        torso.name = 'top';
        root.add(torso);

        // Sleeve cuffs (read as garment volume)
        const sleeveL = mesh(new THREE.BoxGeometry(0.18, 0.42, 0.18), mats.top);
        sleeveL.position.set(-0.42, 1.22, 0);
        root.add(sleeveL);
        const sleeveR = mesh(new THREE.BoxGeometry(0.18, 0.42, 0.18), mats.top);
        sleeveR.position.set(0.42, 1.22, 0);
        root.add(sleeveR);

        const outer = mesh(new THREE.BoxGeometry(0.78, 0.7, 0.42), mats.outer);
        outer.position.y = 1.16;
        outer.visible = false;
        outer.name = 'outer';
        root.add(outer);

        const collar = mesh(new THREE.BoxGeometry(0.5, 0.1, 0.36), mats.outer);
        collar.position.set(0, 1.48, 0.02);
        collar.visible = false;
        root.add(collar);

        const head = mesh(new THREE.SphereGeometry(0.3, 20, 16), mats.skin);
        head.position.y = 1.72;
        root.add(head);

        const hair = mesh(new THREE.SphereGeometry(0.34, 16, 14), mats.hair);
        hair.scale.set(1.08, 0.78, 1.12);
        hair.position.set(0, 1.88, -0.02);
        root.add(hair);

        // Side bangs for silhouette
        const bangL = mesh(new THREE.SphereGeometry(0.12, 10, 8), mats.hair);
        bangL.position.set(-0.22, 1.78, 0.12);
        bangL.scale.set(0.7, 1.1, 0.7);
        root.add(bangL);
        const bangR = mesh(new THREE.SphereGeometry(0.12, 10, 8), mats.hair);
        bangR.position.set(0.22, 1.78, 0.12);
        bangR.scale.set(0.7, 1.1, 0.7);
        root.add(bangR);

        // Built-in face features (always readable at gameplay scale)
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4 });
        const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 });
        const lipMat = new THREE.MeshStandardMaterial({ color: 0xc45c6a, roughness: 0.45 });
        const browMat = new THREE.MeshStandardMaterial({ color: profile.hair, roughness: 0.9 });

        [[-0.09, 1.74, 0.26], [0.09, 1.74, 0.26]].forEach((pos) => {
            const white = mesh(new THREE.SphereGeometry(0.045, 10, 8), whiteMat);
            white.position.set(pos[0], pos[1], pos[2]);
            white.scale.set(1.15, 1, 0.6);
            root.add(white);
            const pupil = mesh(new THREE.SphereGeometry(0.024, 8, 8), eyeMat);
            pupil.position.set(pos[0], pos[1], pos[2] + 0.03);
            root.add(pupil);
            const shine = mesh(new THREE.SphereGeometry(0.01, 6, 6), whiteMat);
            shine.position.set(pos[0] - 0.01, pos[1] + 0.01, pos[2] + 0.045);
            root.add(shine);
        });

        const browL = mesh(new THREE.BoxGeometry(0.1, 0.018, 0.02), browMat);
        browL.position.set(-0.09, 1.8, 0.27);
        browL.rotation.z = 0.12;
        root.add(browL);
        const browR = mesh(new THREE.BoxGeometry(0.1, 0.018, 0.02), browMat);
        browR.position.set(0.09, 1.8, 0.27);
        browR.rotation.z = -0.12;
        root.add(browR);

        const nose = mesh(new THREE.SphereGeometry(0.028, 8, 8), mats.skin);
        nose.position.set(0, 1.7, 0.29);
        nose.scale.set(0.7, 0.9, 0.8);
        root.add(nose);

        const mouth = mesh(new THREE.BoxGeometry(0.09, 0.025, 0.02), lipMat);
        mouth.position.set(0, 1.63, 0.28);
        mouth.scale.set(1, 0.7, 1);
        root.add(mouth);

        // Face cards — library art sits over procedural features
        const faceGeo = new THREE.PlaneGeometry(0.58, 0.66);
        const faceMat = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        const faceFront = new THREE.Mesh(faceGeo, faceMat);
        faceFront.position.set(0, 1.74, 0.31);
        faceFront.name = 'faceFront';
        root.add(faceFront);
        const faceBack = new THREE.Mesh(faceGeo.clone(), faceMat.clone());
        faceBack.position.set(0, 1.74, -0.31);
        faceBack.rotation.y = Math.PI;
        faceBack.name = 'faceBack';
        root.add(faceBack);

        const loader = new THREE.TextureLoader();
        loader.load(profile.src, (tex) => {
            tex.minFilter = THREE.LinearFilter;
            tex.magFilter = THREE.LinearFilter;
            [faceFront, faceBack].forEach((f) => {
                f.material.map = tex;
                f.material.opacity = 1;
                f.material.needsUpdate = true;
            });
            mats.hair.color.setHex(profile.hair);
            mats.skin.color.setHex(profile.skin);
            browMat.color.setHex(profile.hair);
        }, undefined, () => {
            // Keep procedural features if library art fails
            faceFront.visible = false;
            faceBack.visible = false;
        });

        // Extra garment volume that “snaps on” when collected
        const skirt = mesh(new THREE.CylinderGeometry(0.18, 0.42, 0.45, 10, 1, true), mats.bottoms.clone());
        skirt.position.y = 0.72;
        skirt.visible = false;
        skirt.name = 'skirt';
        root.add(skirt);

        const bagProp = mesh(new THREE.BoxGeometry(0.2, 0.26, 0.08), mats.accent);
        bagProp.position.set(0.42, 1.05, 0.12);
        bagProp.visible = false;
        bagProp.name = 'bagProp';
        root.add(bagProp);

        const armL = mesh(new THREE.BoxGeometry(0.14, 0.5, 0.14), mats.skin);
        armL.position.set(-0.42, 0.95, 0);
        root.add(armL);
        const armR = mesh(new THREE.BoxGeometry(0.14, 0.5, 0.14), mats.skin);
        armR.position.set(0.42, 0.95, 0);
        root.add(armR);

        const legL = mesh(new THREE.BoxGeometry(0.22, 0.72, 0.24), mats.bottoms);
        legL.position.set(-0.16, 0.45, 0);
        legL.name = 'bottomsL';
        root.add(legL);
        const legR = mesh(new THREE.BoxGeometry(0.22, 0.72, 0.24), mats.bottoms);
        legR.position.set(0.16, 0.45, 0);
        legR.name = 'bottomsR';
        root.add(legR);

        const shoeL = mesh(new THREE.BoxGeometry(0.26, 0.16, 0.4), mats.shoes);
        shoeL.position.set(-0.16, 0.08, 0.05);
        shoeL.name = 'shoesL';
        root.add(shoeL);
        const shoeR = mesh(new THREE.BoxGeometry(0.26, 0.16, 0.4), mats.shoes);
        shoeR.position.set(0.16, 0.08, 0.05);
        shoeR.name = 'shoesR';
        root.add(shoeR);

        const heelL = mesh(new THREE.BoxGeometry(0.08, 0.18, 0.08), mats.shoes);
        heelL.position.set(-0.16, 0.02, -0.12);
        heelL.visible = false;
        root.add(heelL);
        const heelR = mesh(new THREE.BoxGeometry(0.08, 0.18, 0.08), mats.shoes);
        heelR.position.set(0.16, 0.02, -0.12);
        heelR.visible = false;
        root.add(heelR);

        const finale = mesh(new THREE.BoxGeometry(0.4, 0.1, 0.14), mats.accent);
        finale.position.set(0, 1.42, 0.24);
        finale.visible = false;
        finale.name = 'finale';
        root.add(finale);

        function dressMaterial(matKey, hex, pattern) {
            const mat = mats[matKey];
            if (!mat) return;
            const color = new THREE.Color(hex);
            mat.color.copy(color);
            if (mat.map) {
                mat.map.dispose();
                mat.map = null;
            }
            mat.map = makeFabricTexture(THREE, hex, pattern);
            mat.needsUpdate = true;
            mat.userData.dressed = color.getHex();
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

        function applyPieceColors(pieces, ownedSlots) {
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
                    skirt.material = mats.bottoms.clone();
                    skirt.material.side = THREE.DoubleSide;
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
            // Library face always faces the gameplay camera so features stay readable
            const hasFace = !!faceFront.material.map;
            faceFront.visible = hasFace;
            faceBack.visible = false;
            if (mode === 'back') {
                // Billboard on the rear so chase-cam still sees the face card
                faceFront.position.set(0, 1.74, -0.34);
                faceFront.rotation.y = Math.PI;
            } else {
                faceFront.position.set(0, 1.74, 0.32);
                faceFront.rotation.y = 0;
            }
        }

        let walkT = 0;
        const BASE_SCALE = 1.55;
        function update(dt, state) {
            state = state || {};
            const { jumping, sliding, dressing, dying, deathT } = state;
            if (dying) {
                const t = Math.min(1, (deathT || 0) / 1.15);
                root.rotation.z = t * Math.PI * 1.35;
                root.rotation.x = t * 0.9;
                root.position.y = Math.sin(t * Math.PI) * 0.35 - t * 0.55;
                root.position.x = Math.sin(t * 10) * 0.08;
                const s = BASE_SCALE * (1 - t * 0.25);
                root.scale.set(s, s * (1 - t * 0.35), s);
                return;
            }
            root.rotation.z = 0;
            root.rotation.x = 0;
            root.position.x = 0;
            walkT += dt * (sliding ? 2 : 8);
            const swing = Math.sin(walkT) * (jumping ? 0.05 : 0.35);
            legL.rotation.x = swing;
            legR.rotation.x = -swing;
            armL.rotation.x = -swing * 0.7;
            armR.rotation.x = swing * 0.7;
            sleeveL.rotation.x = armL.rotation.x * 0.5;
            sleeveR.rotation.x = armR.rotation.x * 0.5;
            if (jumping) root.position.y = 0.25;
            else if (sliding) {
                root.scale.set(BASE_SCALE * 1.15, BASE_SCALE * 0.55, BASE_SCALE * 1.1);
                root.position.y = 0;
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
            antialias: true,
            preserveDrawingBuffer: true
        });
        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

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
            if (mode === 'front') {
                avatar.root.rotation.y = 0;
                camera.position.set(0, 1.7, 1.15);
                camera.lookAt(0, 1.68, 0);
                camera.fov = 38;
            } else {
                avatar.root.rotation.y = 0;
                camera.position.set(0, 0.95, 1.75);
                camera.lookAt(0, 0.95, 0);
                camera.fov = 48;
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
