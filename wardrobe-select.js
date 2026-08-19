document.addEventListener('DOMContentLoaded', () => {
    const selectedCharacter = localStorage.getItem('selectedCharacter') || 'female';
    const characterDisplay = document.getElementById('selectedCharacter');
    const walkCanvas = document.getElementById('walkPreview');
    const walkLabel = document.getElementById('walkPreviewLabel');
    const outfitOptions = document.getElementById('outfitOptions') || document.querySelector('.outfit-options');
    const designerOptions = document.getElementById('designerOptions') || document.querySelector('.designer-options');
    const gaitOptions = document.getElementById('gaitOptions');
    const shopStatus = document.getElementById('shopStatus');
    const confirmOutfitBtn = document.getElementById('confirmOutfitBtn');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const subtitle = document.getElementById('wardrobeSubtitle');

    let selectedOutfit = null;
    let selectedGait = localStorage.getItem('selectedGait') || 'strut';
    let walkPreview = null;
    let walkRaf = 0;
    let lastWalkTs = 0;
    let activeTab = 'outfits';

    const characterImages = {
        male: 'chibibrodoll.png',
        female: 'chibidoll2.png',
        fashion: 'chibidollfashion.png',
        evening: 'chibidoll3.png'
    };

    characterDisplay.src = characterImages[selectedCharacter] || 'chibidoll2.png';

    const designerSets = window.DESIGNER_SETS || [];

    const gaits = [
        { id: 'strut', name: 'Strut', blurb: 'Classic runway pace + knee drive' },
        { id: 'model', name: 'Model Walk', blurb: 'Slow hip-led glide' },
        { id: 'power', name: 'Power Walk', blurb: 'Fast sharp arm swing' },
        { id: 'sashay', name: 'Sashay', blurb: 'Bounce, sway & skirt swish' }
    ];

    function fullOwnedSlots(pieces) {
        const owned = {};
        (pieces || []).forEach((p) => {
            if (p.slot) owned[p.slot] = true;
        });
        return owned;
    }

    function createSetElement(set) {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'outfit-option set-option';
        el.style.setProperty('--set-accent', set.accent);
        const swatches = (set.swatches || []).map((c) =>
            `<span class="set-swatch" style="background:${c}"></span>`
        ).join('');
        el.innerHTML = `
            <div class="set-swatch-row">${swatches}</div>
            <div class="outfit-info">
                <p class="set-designer">${set.designer}</p>
                <h3>${set.name}</h3>
                <p>${set.tagline}</p>
            </div>
        `;
        el.addEventListener('click', () => selectSet(el, set));
        return el;
    }

    function createShopElement(set) {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'designer-option shop-set-card';
        el.style.setProperty('--set-accent', set.accent);
        el.innerHTML = `
            <div class="set-swatch-row">${(set.swatches || []).slice(0, 4).map((c) =>
                `<span class="set-swatch" style="background:${c}"></span>`
            ).join('')}</div>
            <p class="set-designer">${set.designer}</p>
            <p class="shop-set-name">${set.name}</p>
            <span class="shop-cta">Checkout set</span>
        `;
        el.addEventListener('click', () => checkoutSet(set));
        return el;
    }

    function createGaitElement(gait) {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'gait-option' + (gait.id === selectedGait ? ' selected' : '');
        el.dataset.gait = gait.id;
        el.innerHTML = `
            <span class="gait-name">${gait.name}</span>
            <span class="gait-blurb">${gait.blurb}</span>
        `;
        el.addEventListener('click', () => {
            selectedGait = gait.id;
            localStorage.setItem('selectedGait', selectedGait);
            document.querySelectorAll('.gait-option').forEach((n) => n.classList.remove('selected'));
            el.classList.add('selected');
            if (walkPreview && walkPreview.avatar) {
                walkPreview.avatar.setGait(selectedGait);
            }
            if (subtitle) subtitle.textContent = `${gait.name} · walking in place`;
        });
        return el;
    }

    designerSets.forEach((set) => outfitOptions.appendChild(createSetElement(set)));
    designerSets.forEach((set) => designerOptions.appendChild(createShopElement(set)));
    if (gaitOptions) gaits.forEach((g) => gaitOptions.appendChild(createGaitElement(g)));

    function selectSet(element, set) {
        document.querySelectorAll('.outfit-option').forEach((opt) => opt.classList.remove('selected'));
        element.classList.add('selected');
        selectedOutfit = {
            id: set.id,
            name: set.name,
            designer: set.designer,
            image: set.image || characterImages[selectedCharacter],
            showId: set.showId,
            city: set.city,
            pieces: set.pieces,
            accent: set.accent,
            storeId: set.storeId
        };
        characterDisplay.src = selectedOutfit.image;
        applyWalkOutfit(set);
        if (subtitle) subtitle.textContent = `${set.designer} · ${set.name}`;
    }

    function applyWalkOutfit(set) {
        if (!walkPreview || !walkPreview.avatar || !set) return;
        const pieces = set.pieces || [];
        const owned = fullOwnedSlots(pieces);
        walkPreview.avatar.applyPieceColors(pieces, owned);
    }

    function ensureWalkPreview() {
        if (walkPreview || !window.THREE || !window.Runway3D || !walkCanvas) return;
        try {
            const w = 220;
            const h = 320;
            walkCanvas.width = w;
            walkCanvas.height = h;
            walkPreview = window.Runway3D.createRenderer(walkCanvas, window.THREE, {
                characterId: selectedCharacter
            });
            walkPreview.resize(w, h);
            walkPreview.setCameraMode('back');
            if (walkPreview.avatar.setGait) walkPreview.avatar.setGait(selectedGait);
            if (selectedOutfit && selectedOutfit.pieces) {
                applyWalkOutfit(selectedOutfit);
            } else if (designerSets[0]) {
                applyWalkOutfit(designerSets[0]);
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
        if (walkLabel) walkLabel.hidden = false;
        if (selectedOutfit && selectedOutfit.pieces) applyWalkOutfit(selectedOutfit);
        else if (designerSets[0]) applyWalkOutfit(designerSets[0]);
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

    async function checkoutSet(set) {
        if (!window.RunwayAuth || !RunwayAuth.getToken || !RunwayAuth.getToken()) {
            location.href = `login.html?next=${encodeURIComponent('store.html')}`;
            return;
        }
        const itemId = set.storeId || set.id;
        try {
            if (shopStatus) {
                shopStatus.hidden = false;
                shopStatus.textContent = `Opening checkout for ${set.name}…`;
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
                if (shopStatus) shopStatus.textContent = `Added ${set.name} to your closet.`;
                return;
            }
            if (data.url) {
                location.href = data.url.startsWith('http') ? data.url : data.url;
                return;
            }
            location.href = `store.html`;
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
        localStorage.setItem('selectedGait', selectedGait || 'strut');
        if (selectedOutfit) {
            localStorage.setItem('selectedOutfit', JSON.stringify(selectedOutfit));
            if (selectedOutfit.city) localStorage.setItem('selectedMap', selectedOutfit.city);
            if (selectedOutfit.showId) localStorage.setItem('selectedShow', selectedOutfit.showId);
            window.location.href = 'map-select.html';
        } else {
            alert('Please select a designer set before confirming.');
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

    // Prefill first set selection for faster confirm
    const firstSetBtn = outfitOptions.querySelector('.set-option');
    if (firstSetBtn && designerSets[0]) selectSet(firstSetBtn, designerSets[0]);
});
