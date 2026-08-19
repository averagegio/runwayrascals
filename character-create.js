document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('createPreview');
    const subtitle = document.getElementById('createSubtitle');
    const animLabel = document.getElementById('createAnimLabel');
    const status = document.getElementById('scanStatus');
    const urlInput = document.getElementById('scanUrl');
    const fileInput = document.getElementById('scanFile');
    const applyBtn = document.getElementById('scanApplyBtn');
    const continueBtn = document.getElementById('createContinueBtn');

    let characterId = localStorage.getItem('selectedCharacter') || 'female';
    let faceSrc = localStorage.getItem('selectedCharacterImage')
        || ({
            male: 'chibibrodoll.png',
            female: 'chibidoll2.png',
            fashion: 'chibidollfashion.png',
            evening: 'chibidoll3.png'
        })[characterId];

    let scans = {};
    try {
        scans = JSON.parse(localStorage.getItem('characterScans') || '{}') || {};
    } catch (_) {
        scans = {};
    }

    let scanSlot = 'top';
    let preview = null;
    let raf = 0;
    let lastTs = performance.now();

    function showStatus(msg, ok) {
        if (!status) return;
        status.hidden = false;
        status.textContent = msg;
        status.classList.toggle('ok', !!ok);
        status.classList.toggle('err', !ok);
    }

    function loadScansForPreview() {
        if (!preview || !preview.avatar || !preview.avatar.applySavedScans) return;
        preview.avatar.applySavedScans(scans);
    }

    function rebuild() {
        cancelAnimationFrame(raf);
        if (preview && preview.renderer) {
            try { preview.renderer.dispose(); } catch (_) { /* ignore */ }
        }
        preview = window.Runway3D.createRenderer(canvas, window.THREE, {
            characterId,
            faceSrc,
            scans
        });
        const w = canvas.clientWidth || 260;
        const h = canvas.clientHeight || 360;
        canvas.width = w;
        canvas.height = h;
        preview.resize(w, h);
        preview.setOrbitYaw(25);
        if (preview.avatar.setGait) preview.avatar.setGait('strut');
        loadScansForPreview();
        lastTs = performance.now();
        tick(lastTs);
    }

    function tick(now) {
        const dt = Math.min(0.05, (now - lastTs) / 1000);
        lastTs = now;
        if (preview) {
            try {
                preview.avatar.update(dt, {
                    jumping: false,
                    sliding: false,
                    dressing: 0,
                    gait: 'strut',
                    dying: false
                });
                preview.render();
            } catch (err) {
                console.warn('create preview', err);
            }
        }
        raf = requestAnimationFrame(tick);
    }

    document.querySelectorAll('.create-base-btn').forEach((btn) => {
        btn.classList.toggle('selected', btn.dataset.character === characterId);
        btn.addEventListener('click', () => {
            characterId = btn.dataset.character;
            faceSrc = btn.dataset.img;
            document.querySelectorAll('.create-base-btn').forEach((b) => {
                b.classList.toggle('selected', b.dataset.character === characterId);
            });
            if (subtitle) subtitle.textContent = `${btn.querySelector('span').textContent} · scan wardrobe onto 3D`;
            rebuild();
        });
    });

    document.querySelectorAll('.scan-slot-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            scanSlot = btn.dataset.slot;
            document.querySelectorAll('.scan-slot-btn').forEach((b) => {
                b.classList.toggle('selected', b.dataset.slot === scanSlot);
            });
        });
    });

    async function impose(source) {
        if (!preview || !preview.avatar) return;
        try {
            showStatus('Imposing look…', true);
            await preview.avatar.applyScanTexture(scanSlot, source);
            scans[scanSlot] = source;
            // Keep data URLs for uploads; URLs for remote
            try {
                localStorage.setItem('characterScans', JSON.stringify(scans));
            } catch (_) {
                // Quota — keep in-memory only
                showStatus('Look applied (session only — storage full)', true);
                return;
            }
            showStatus(`Applied to ${scanSlot}`, true);
        } catch (ex) {
            showStatus(ex.message || 'Could not impose look', false);
        }
    }

    applyBtn.addEventListener('click', () => {
        const url = (urlInput.value || '').trim();
        if (!url) {
            showStatus('Paste an image URL or upload a photo', false);
            return;
        }
        impose(url);
    });

    fileInput.addEventListener('change', () => {
        const file = fileInput.files && fileInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => impose(reader.result);
        reader.onerror = () => showStatus('Could not read file', false);
        reader.readAsDataURL(file);
    });

    continueBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.setItem('selectedCharacter', characterId);
        localStorage.setItem('selectedCharacterImage', faceSrc);
        localStorage.setItem('walkPreviewModel', characterId === 'male' ? 'male' : 'female');
        try {
            localStorage.setItem('characterScans', JSON.stringify(scans));
        } catch (_) { /* ignore */ }
        window.location.href = 'wardrobe-select.html';
    });

    if (!window.THREE || !window.Runway3D) {
        showStatus('3D engine failed to load', false);
        return;
    }
    rebuild();
});
