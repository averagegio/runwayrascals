document.addEventListener('DOMContentLoaded', () => {
    const characterDisplay = document.getElementById('selectedCharacter');
    const walkCanvas = document.getElementById('walkPreview');
    const walkLabel = document.getElementById('walkPreviewLabel');
    const outfitOptions = document.getElementById('outfitOptions');
    const designerOptions = document.getElementById('designerOptions');
    const gaitOptions = document.getElementById('gaitOptions');
    const shopStatus = document.getElementById('shopStatus');
    const confirmOutfitBtn = document.getElementById('confirmOutfitBtn');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const subtitle = document.getElementById('wardrobeSubtitle');
    const modelToggle = document.getElementById('walkModelToggle');

    let selectedOutfit = null;
    let selectedGait = localStorage.getItem('selectedGait') || 'strut';
    let walkModel = localStorage.getItem('walkPreviewModel')
        || (localStorage.getItem('selectedCharacter') === 'male' ? 'male' : 'female');
    if (walkModel !== 'male' && walkModel !== 'female') walkModel = 'female';

    let walkPreview = null;
    let walkRaf = 0;
    let lastWalkTs = 0;
    let activeTab = 'outfits';

    const isMember = () => Boolean(window.RunwayAuth && RunwayAuth.getToken && RunwayAuth.getToken());

    const characterImages = {
        male: 'chibibrodoll.png',
        female: 'chibidoll2.png',
        fashion: 'chibidollfashion.png',
        evening: 'chibidoll3.png'
    };

    characterDisplay.src = characterImages[localStorage.getItem('selectedCharacter') || 'female'] || 'chibidoll2.png';

    const wardrobeItems = window.WARDROBE_ITEMS || [];
    const shopPacks = (window.DESIGNER_SETS || []).filter((s) => s.membersOnly);

    const gaits = [
        { id: 'strut', name: 'Strut', blurb: 'Classic runway pace', membersOnly: false },
        { id: 'model', name: 'Model Walk', blurb: 'Slow hip-led glide', membersOnly: false },
        { id: 'power', name: 'Power Walk', blurb: 'Members · sharp arm swing', membersOnly: true },
        { id: 'sashay', name: 'Sashay', blurb: 'Members · bounce & sway', membersOnly: true }
    ];

    function logoBadgeHtml(logoKey) {
        const mark = window.getLogoMark && window.getLogoMark(logoKey);
        if (!mark) return '';
        return `<span class="logo-badge logo-${mark.monogram}" style="--logo-bg:${mark.bg};--logo-fg:${mark.color}" aria-hidden="true">${mark.label}</span>`;
    }

    function fullOwnedSlots(pieces) {
        const owned = {};
        (pieces || []).forEach((p) => {
            if (p.slot) owned[p.slot] = true;
        });
        return owned;
    }

    function goSignup(next) {
        const dest = next || 'wardrobe-select.html';
        location.href = `signup.html?next=${encodeURIComponent(dest)}`;
    }

    function createItemElement(item) {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'outfit-option set-option' + (item.membersOnly ? ' is-locked' : '');
        el.style.setProperty('--set-accent', item.accent);
        const swatches = (item.swatches || []).map((c) =>
            `<span class="set-swatch" style="background:${c}"></span>`
        ).join('');
        const lock = item.membersOnly
            ? '<span class="lock-pill">Members</span>'
            : '<span class="open-pill">Open</span>';
        el.innerHTML = `
            <div class="set-card-top">
                ${logoBadgeHtml(item.logo)}
                ${lock}
            </div>
            <div class="set-swatch-row">${swatches}</div>
            <div class="outfit-info">
                <p class="set-designer">${item.designer}</p>
                <h3>${item.name}</h3>
                <p>${item.tagline}</p>
            </div>
        `;
        el.addEventListener('click', () => {
            if (item.membersOnly && !isMember()) {
                goSignup('wardrobe-select.html');
                return;
            }
            selectItem(el, item);
        });
        return el;
    }

    function createShopElement(pack) {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'designer-option shop-set-card' + (pack.membersOnly ? ' is-locked' : '');
        el.style.setProperty('--set-accent', pack.accent);
        el.innerHTML = `
            <div class="set-card-top">
                ${logoBadgeHtml(pack.logo)}
                <span class="lock-pill">Members</span>
            </div>
            <div class="set-swatch-row">${(pack.swatches || []).slice(0, 4).map((c) =>
                `<span class="set-swatch" style="background:${c}"></span>`
            ).join('')}</div>
            <p class="set-designer">${pack.designer}</p>
            <p class="shop-set-name">${pack.name}</p>
            <span class="shop-cta">${isMember() ? 'Checkout' : 'Sign up to unlock'}</span>
        `;
        el.addEventListener('click', () => {
            if (!isMember()) {
                goSignup('store.html');
                return;
            }
            checkoutPack(pack);
        });
        return el;
    }

    function createGaitElement(gait) {
        const locked = gait.membersOnly && !isMember();
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'gait-option'
            + (gait.id === selectedGait ? ' selected' : '')
            + (locked ? ' is-locked' : '');
        el.dataset.gait = gait.id;
        el.innerHTML = `
            <span class="gait-name">${gait.name}${locked ? ' · 🔒' : ''}</span>
            <span class="gait-blurb">${gait.blurb}</span>
        `;
        el.addEventListener('click', () => {
            if (gait.membersOnly && !isMember()) {
                goSignup('wardrobe-select.html');
                return;
            }
            selectedGait = gait.id;
            localStorage.setItem('selectedGait', selectedGait);
            document.querySelectorAll('.gait-option').forEach((n) => n.classList.remove('selected'));
            el.classList.add('selected');
            if (walkPreview && walkPreview.avatar) {
                walkPreview.avatar.setGait(selectedGait);
                walkPreview.setCameraMode('side');
            }
            if (subtitle) subtitle.textContent = `${gait.name} · side profile`;
            if (walkLabel) walkLabel.textContent = `${walkModel === 'male' ? 'Male' : 'Female'} · ${gait.name}`;
        });
        return el;
    }

    wardrobeItems.forEach((item) => outfitOptions.appendChild(createItemElement(item)));
    shopPacks.forEach((pack) => designerOptions.appendChild(createShopElement(pack)));
    if (gaitOptions) {
        // If saved gait is locked and guest, fall back to strut
        const saved = gaits.find((g) => g.id === selectedGait);
        if (saved && saved.membersOnly && !isMember()) {
            selectedGait = 'strut';
            localStorage.setItem('selectedGait', 'strut');
        }
        gaits.forEach((g) => gaitOptions.appendChild(createGaitElement(g)));
    }

    if (modelToggle) {
        modelToggle.querySelectorAll('.model-toggle-btn').forEach((btn) => {
            btn.classList.toggle('selected', btn.dataset.model === walkModel);
            btn.addEventListener('click', () => {
                walkModel = btn.dataset.model;
                localStorage.setItem('walkPreviewModel', walkModel);
                modelToggle.querySelectorAll('.model-toggle-btn').forEach((b) => {
                    b.classList.toggle('selected', b.dataset.model === walkModel);
                });
                rebuildWalkPreview();
                if (walkLabel) walkLabel.textContent = `${walkModel === 'male' ? 'Male' : 'Female'} · ${selectedGait}`;
            });
        });
    }

    function selectItem(element, item) {
        document.querySelectorAll('.outfit-option').forEach((opt) => opt.classList.remove('selected'));
        element.classList.add('selected');
        selectedOutfit = {
            id: item.id,
            name: item.name,
            designer: item.designer,
            image: item.image || characterImages.female,
            showId: item.showId,
            city: item.city,
            pieces: item.pieces,
            accent: item.accent,
            storeId: item.storeId,
            logo: item.logo,
            membersOnly: !!item.membersOnly
        };
        characterDisplay.src = selectedOutfit.image;
        applyWalkOutfit(item);
        if (subtitle) subtitle.textContent = `${item.designer} · ${item.name}`;
    }

    function applyWalkOutfit(item) {
        if (!walkPreview || !walkPreview.avatar || !item) return;
        const pieces = item.pieces || [];
        walkPreview.avatar.applyPieceColors(pieces, fullOwnedSlots(pieces));
    }

    function disposeWalkPreview() {
        cancelAnimationFrame(walkRaf);
        walkRaf = 0;
        if (walkPreview && walkPreview.renderer) {
            try { walkPreview.renderer.dispose(); } catch (_) { /* ignore */ }
        }
        walkPreview = null;
    }

    function rebuildWalkPreview() {
        disposeWalkPreview();
        ensureWalkPreview();
        if (activeTab === 'walk') startWalkLoop();
    }

    function ensureWalkPreview() {
        if (walkPreview || !window.THREE || !window.Runway3D || !walkCanvas) return;
        try {
            const w = 220;
            const h = 320;
            walkCanvas.width = w;
            walkCanvas.height = h;
            walkPreview = window.Runway3D.createRenderer(walkCanvas, window.THREE, {
                characterId: walkModel
            });
            walkPreview.resize(w, h);
            walkPreview.setCameraMode('side');
            if (walkPreview.avatar.setGait) walkPreview.avatar.setGait(selectedGait);
            if (selectedOutfit && selectedOutfit.pieces) applyWalkOutfit(selectedOutfit);
            else {
                const open = wardrobeItems.find((i) => !i.membersOnly) || wardrobeItems[0];
                if (open) applyWalkOutfit(open);
            }
        } catch (err) {
            console.warn('Walk preview unavailable', err);
            walkPreview = null;
        }
    }

    function startWalkLoop() {
        ensureWalkPreview();
        if (!walkPreview) return;
        characterDisplay.hidden = true;
        characterDisplay.style.display = 'none';
        walkCanvas.hidden = false;
        walkCanvas.style.display = 'block';
        if (walkLabel) {
            walkLabel.hidden = false;
            walkLabel.textContent = `${walkModel === 'male' ? 'Male' : 'Female'} · ${selectedGait}`;
        }
        walkPreview.setCameraMode('side');
        if (selectedOutfit && selectedOutfit.pieces) applyWalkOutfit(selectedOutfit);
        cancelAnimationFrame(walkRaf);
        lastWalkTs = performance.now();

        function tick(now) {
            if (activeTab !== 'walk') return;
            const dt = Math.min(0.05, (now - lastWalkTs) / 1000);
            lastWalkTs = now;
            try {
                walkPreview.avatar.update(dt, {
                    jumping: false,
                    sliding: false,
                    dressing: 0,
                    gait: selectedGait,
                    dying: false
                });
                walkPreview.render();
            } catch (err) {
                console.warn('walk preview frame', err);
            }
            walkRaf = requestAnimationFrame(tick);
        }
        walkRaf = requestAnimationFrame(tick);
    }

    function stopWalkLoop() {
        cancelAnimationFrame(walkRaf);
        walkRaf = 0;
        characterDisplay.hidden = false;
        characterDisplay.style.display = '';
        if (walkCanvas) {
            walkCanvas.hidden = true;
            walkCanvas.style.display = 'none';
        }
        if (walkLabel) walkLabel.hidden = true;
    }

    async function checkoutPack(pack) {
        const itemId = pack.storeId || pack.id;
        try {
            if (shopStatus) {
                shopStatus.hidden = false;
                shopStatus.textContent = `Opening checkout for ${pack.name}…`;
                shopStatus.classList.remove('err');
                shopStatus.classList.add('ok');
            }
            const successUrl = `${location.origin}/store.html?success=1&item=${encodeURIComponent(itemId)}`;
            const cancelUrl = `${location.origin}/wardrobe-select.html`;
            const data = await RunwayAuth.api('/api/store/checkout', {
                method: 'POST',
                body: JSON.stringify({ itemId, successUrl, cancelUrl })
            });
            if (data.free) {
                if (shopStatus) shopStatus.textContent = `Added ${pack.name} to your closet.`;
                return;
            }
            if (data.url) {
                location.href = data.url.startsWith('http') ? data.url : data.url;
                return;
            }
            location.href = 'store.html';
        } catch (ex) {
            if (shopStatus) {
                shopStatus.hidden = false;
                shopStatus.textContent = ex.message || 'Checkout failed — open Boutique.';
                shopStatus.classList.add('err');
                shopStatus.classList.remove('ok');
            }
            setTimeout(() => { location.href = 'store.html'; }, 900);
        }
    }

    confirmOutfitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (selectedOutfit && selectedOutfit.membersOnly && !isMember()) {
            goSignup('wardrobe-select.html');
            return;
        }
        const gaitMeta = gaits.find((g) => g.id === selectedGait);
        if (gaitMeta && gaitMeta.membersOnly && !isMember()) {
            selectedGait = 'strut';
        }
        localStorage.setItem('selectedGait', selectedGait || 'strut');
        localStorage.setItem('walkPreviewModel', walkModel);
        if (selectedOutfit) {
            localStorage.setItem('selectedOutfit', JSON.stringify(selectedOutfit));
            if (selectedOutfit.city) localStorage.setItem('selectedMap', selectedOutfit.city);
            if (selectedOutfit.showId) localStorage.setItem('selectedShow', selectedOutfit.showId);
            window.location.href = 'map-select.html';
        } else {
            alert('Please select a look before confirming.');
        }
    });

    tabBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            activeTab = tabName;
            document.querySelectorAll('.tab-content').forEach((content) => content.classList.remove('active'));
            document.getElementById(tabName).classList.add('active');
            tabBtns.forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            if (tabName === 'walk') startWalkLoop();
            else stopWalkLoop();
        });
    });

    const firstOpen = wardrobeItems.find((i) => !i.membersOnly) || wardrobeItems[0];
    const firstBtn = outfitOptions.querySelector('.set-option:not(.is-locked)') || outfitOptions.querySelector('.set-option');
    if (firstBtn && firstOpen) selectItem(firstBtn, firstOpen);
});
