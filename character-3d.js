/**
 * Low-poly Three.js runway avatar (3D, not a flat PNG).
 * Clothing layers tint mesh parts as the player dresses up.
 */
(function (global) {
    function createAvatar(THREE) {
        const root = new THREE.Group();
        root.name = 'RunwayAvatar';

        const skin = 0xffdbac;
        const mats = {
            skin: new THREE.MeshStandardMaterial({ color: skin, roughness: 0.65 }),
            hair: new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.8 }),
            street: new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.85 }),
            bottoms: new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.8 }),
            top: new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.75 }),
            shoes: new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.55 }),
            outer: new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.7 }),
            accent: new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.4, metalness: 0.2 })
        };

        function mesh(geo, mat) {
            const m = new THREE.Mesh(geo, mat);
            m.castShadow = true;
            return m;
        }

        // Body
        const hips = mesh(new THREE.BoxGeometry(0.55, 0.2, 0.3), mats.street);
        hips.position.y = 0.85;
        root.add(hips);

        const torso = mesh(new THREE.BoxGeometry(0.58, 0.55, 0.32), mats.top);
        torso.position.y = 1.2;
        torso.name = 'top';
        root.add(torso);

        const outer = mesh(new THREE.BoxGeometry(0.72, 0.62, 0.4), mats.outer);
        outer.position.y = 1.18;
        outer.visible = false;
        outer.name = 'outer';
        root.add(outer);

        const head = mesh(new THREE.SphereGeometry(0.28, 16, 12), mats.skin);
        head.position.y = 1.72;
        root.add(head);

        const hair = mesh(new THREE.SphereGeometry(0.3, 12, 10), mats.hair);
        hair.scale.set(1, 0.7, 1.05);
        hair.position.set(0, 1.82, 0);
        root.add(hair);

        // Arms
        const armL = mesh(new THREE.BoxGeometry(0.16, 0.55, 0.16), mats.skin);
        armL.position.set(-0.42, 1.15, 0);
        root.add(armL);
        const armR = mesh(new THREE.BoxGeometry(0.16, 0.55, 0.16), mats.skin);
        armR.position.set(0.42, 1.15, 0);
        root.add(armR);

        // Legs / bottoms
        const legL = mesh(new THREE.BoxGeometry(0.2, 0.7, 0.22), mats.bottoms);
        legL.position.set(-0.16, 0.45, 0);
        legL.name = 'bottomsL';
        root.add(legL);
        const legR = mesh(new THREE.BoxGeometry(0.2, 0.7, 0.22), mats.bottoms);
        legR.position.set(0.16, 0.45, 0);
        legR.name = 'bottomsR';
        root.add(legR);

        const shoeL = mesh(new THREE.BoxGeometry(0.24, 0.14, 0.36), mats.shoes);
        shoeL.position.set(-0.16, 0.08, 0.04);
        shoeL.name = 'shoesL';
        root.add(shoeL);
        const shoeR = mesh(new THREE.BoxGeometry(0.24, 0.14, 0.36), mats.shoes);
        shoeR.position.set(0.16, 0.08, 0.04);
        shoeR.name = 'shoesR';
        root.add(shoeR);

        const finale = mesh(new THREE.BoxGeometry(0.35, 0.08, 0.12), mats.accent);
        finale.position.set(0, 1.45, 0.22);
        finale.visible = false;
        finale.name = 'finale';
        root.add(finale);

        const parts = { torso, outer, legL, legR, shoeL, shoeR, finale, mats, hips };

        function setOwnedSlots(ownedSlots) {
            const has = (s) => !!ownedSlots[s];
            // Street default colors until pieces unlock
            mats.top.color.setHex(has('top') ? mats.top.userData.dressed || 0x6b7280 : 0x9ca3af);
            mats.bottoms.color.setHex(has('bottoms') ? (mats.bottoms.userData.dressed || 0x4b5563) : 0x9ca3af);
            outer.visible = has('outer');
            finale.visible = has('finale');
            if (!has('shoes')) {
                mats.shoes.color.setHex(0x6b7280);
            }
        }

        function applyPieceColors(pieces, ownedSlots) {
            (pieces || []).forEach((p) => {
                if (!ownedSlots[p.slot]) return;
                const hex = new THREE.Color(p.color).getHex();
                if (p.slot === 'top') {
                    mats.top.userData.dressed = hex;
                    mats.top.color.setHex(hex);
                }
                if (p.slot === 'bottoms') {
                    mats.bottoms.userData.dressed = hex;
                    mats.bottoms.color.setHex(hex);
                }
                if (p.slot === 'shoes') mats.shoes.color.setHex(hex);
                if (p.slot === 'outer') {
                    mats.outer.color.setHex(hex);
                    outer.visible = true;
                }
                if (p.slot === 'finale') {
                    mats.accent.color.setHex(hex);
                    finale.visible = true;
                }
            });
            setOwnedSlots(ownedSlots);
        }

        let walkT = 0;
        function update(dt, { jumping, sliding, dressing }) {
            walkT += dt * (sliding ? 2 : 8);
            const swing = Math.sin(walkT) * (jumping ? 0.05 : 0.35);
            legL.rotation.x = swing;
            legR.rotation.x = -swing;
            armL.rotation.x = -swing * 0.7;
            armR.rotation.x = swing * 0.7;
            if (jumping) root.position.y = 0.25;
            else if (sliding) {
                root.scale.set(1.15, 0.55, 1.1);
                root.position.y = 0;
            } else {
                root.scale.set(1, 1, 1);
                root.position.y = 0;
            }
            if (dressing) {
                const pulse = 1 + Math.sin(dressing * 20) * 0.06;
                root.scale.multiplyScalar(pulse);
            }
        }

        return { root, applyPieceColors, setOwnedSlots, update, mats };
    }

    function createRenderer(canvas, THREE) {
        const renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true,
            preserveDrawingBuffer: true
        });
        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
        camera.position.set(0, 1.3, 4.2);
        camera.lookAt(0, 1.1, 0);

        const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.1);
        scene.add(hemi);
        const key = new THREE.DirectionalLight(0xffffff, 0.9);
        key.position.set(2, 4, 3);
        scene.add(key);

        const avatar = createAvatar(THREE);
        scene.add(avatar.root);

        function resize(w, h) {
            renderer.setSize(w, h, false);
            camera.aspect = w / Math.max(1, h);
            camera.updateProjectionMatrix();
        }

        function setCameraMode(mode) {
            if (mode === 'front') {
                camera.position.set(0, 1.35, -3.6);
                avatar.root.rotation.y = Math.PI;
            } else {
                camera.position.set(0, 1.3, 4.2);
                avatar.root.rotation.y = 0;
            }
            camera.lookAt(0, 1.1, 0);
        }

        function render() {
            renderer.render(scene, camera);
        }

        return { renderer, scene, camera, avatar, resize, setCameraMode, render };
    }

    global.Runway3D = { createAvatar, createRenderer };
})(window);
