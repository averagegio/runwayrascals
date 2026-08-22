/**
 * Rascal Runways — in-game screenshot / clip capture + share to X, TikTok, IG.
 * Uses canvas capture, MediaRecorder rolling buffer, Web Share API, and platform fallbacks.
 */
(function (global) {
    'use strict';

    const BRAND = 'Rascal Runways';
    const SITE = 'https://rascalrunways.com';
    const HASHTAGS = 'RascalRunways,FashionGame';
    const MAX_CLIP_MS = 15000;
    const TIMESLICE_MS = 500;

    /** @type {MediaRecorder|null} */
    let recorder = null;
    /** @type {Blob[]} */
    let chunks = [];
    let recording = false;
    let stream = null;
    /** @type {HTMLCanvasElement|null} */
    let sourceCanvas = null;
    let flashEl = null;

    function canRecord() {
        return !!(
            global.MediaRecorder &&
            HTMLCanvasElement.prototype.captureStream
        );
    }

    function canNativeShareFiles() {
        try {
            return !!(
                navigator.share &&
                navigator.canShare &&
                navigator.canShare({
                    files: [new File(['x'], 't.txt', { type: 'text/plain' })]
                })
            );
        } catch (_) {
            return false;
        }
    }

    function pickMime() {
        const types = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm',
            'video/mp4'
        ];
        for (const t of types) {
            if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) return t;
        }
        return '';
    }

    function ensureFlash() {
        if (flashEl) return flashEl;
        flashEl = document.createElement('div');
        flashEl.className = 'clip-share-flash';
        flashEl.setAttribute('aria-hidden', 'true');
        document.body.appendChild(flashEl);
        return flashEl;
    }

    function shutterFlash() {
        const el = ensureFlash();
        el.classList.remove('is-on');
        // Force reflow so animation retriggers
        void el.offsetWidth;
        el.classList.add('is-on');
        setTimeout(() => el.classList.remove('is-on'), 280);
    }

    /**
     * @param {HTMLCanvasElement} canvas
     */
    function attach(canvas) {
        sourceCanvas = canvas;
    }

    function detach() {
        stopRecording(true);
        sourceCanvas = null;
    }

    function startRecording() {
        if (!canRecord() || !sourceCanvas || recording) return false;
        try {
            stream = sourceCanvas.captureStream(30);
            const mime = pickMime();
            const opts = mime ? { mimeType: mime, videoBitsPerSecond: 2500000 } : { videoBitsPerSecond: 2500000 };
            recorder = new MediaRecorder(stream, opts);
            chunks = [];
            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) chunks.push(e.data);
                const maxChunks = Math.ceil(MAX_CLIP_MS / TIMESLICE_MS) + 2;
                while (chunks.length > maxChunks) chunks.shift();
            };
            recorder.onerror = () => {
                recording = false;
            };
            recorder.start(TIMESLICE_MS);
            recording = true;
            return true;
        } catch (_) {
            recording = false;
            recorder = null;
            stream = null;
            return false;
        }
    }

    function stopRecording(discard) {
        return new Promise((resolve) => {
            if (!recorder || recorder.state === 'inactive') {
                recording = false;
                if (stream) {
                    stream.getTracks().forEach((t) => t.stop());
                    stream = null;
                }
                resolve(discard ? null : blobFromChunks());
                return;
            }
            const rec = recorder;
            rec.onstop = () => {
                recording = false;
                if (stream) {
                    stream.getTracks().forEach((t) => t.stop());
                    stream = null;
                }
                recorder = null;
                resolve(discard ? null : blobFromChunks());
            };
            try {
                if (rec.state === 'recording') rec.requestData();
                rec.stop();
            } catch (_) {
                recording = false;
                resolve(discard ? null : blobFromChunks());
            }
        });
    }

    function blobFromChunks() {
        if (!chunks.length) return null;
        const type = (chunks[0] && chunks[0].type) || 'video/webm';
        return new Blob(chunks.slice(), { type });
    }

    /** Pause rolling recorder without discarding (game pause). */
    function pauseRecording() {
        if (recorder && recorder.state === 'recording') {
            try { recorder.pause(); } catch (_) { /* ok */ }
        }
    }

    function resumeRecording() {
        if (recorder && recorder.state === 'paused') {
            try { recorder.resume(); } catch (_) { /* ok */ }
        }
    }

    function isRecording() {
        return recording && !!(recorder && recorder.state === 'recording');
    }

    /**
     * Snapshot the live game canvas (CSS pixels → bitmap).
     * @returns {Promise<Blob|null>}
     */
    function captureScreenshot() {
        return new Promise((resolve) => {
            if (!sourceCanvas) {
                resolve(null);
                return;
            }
            shutterFlash();
            try {
                sourceCanvas.toBlob(
                    (blob) => resolve(blob),
                    'image/png'
                );
            } catch (_) {
                try {
                    const data = sourceCanvas.toDataURL('image/png');
                    resolve(dataUrlToBlob(data));
                } catch (err) {
                    resolve(null);
                }
            }
        });
    }

    function dataUrlToBlob(dataUrl) {
        const parts = dataUrl.split(',');
        const mime = (parts[0].match(/:(.*?);/) || [])[1] || 'image/png';
        const bin = atob(parts[1]);
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        return new Blob([arr], { type: mime });
    }

    /**
     * Build a vertical 9:16 share card with brand + run stats.
     * @param {Blob} shotBlob
     * @param {{tag?:string,character?:string,score?:number,look?:string,designer?:string,city?:string,won?:boolean,difficulty?:string}} meta
     * @returns {Promise<Blob|null>}
     */
    async function buildShareCard(shotBlob, meta) {
        meta = meta || {};
        const W = 1080;
        const H = 1920;
        const card = document.createElement('canvas');
        card.width = W;
        card.height = H;
        const c = card.getContext('2d');
        if (!c) return null;

        // Atmosphere
        const bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#1a1410');
        bg.addColorStop(0.45, '#0c0c0e');
        bg.addColorStop(1, '#070708');
        c.fillStyle = bg;
        c.fillRect(0, 0, W, H);

        // Champagne rim light
        const rim = c.createLinearGradient(0, 0, W, 0);
        rim.addColorStop(0, 'rgba(201,165,106,0)');
        rim.addColorStop(0.5, 'rgba(201,165,106,0.35)');
        rim.addColorStop(1, 'rgba(201,165,106,0)');
        c.fillStyle = rim;
        c.fillRect(0, 0, W, 6);

        // Brand
        c.fillStyle = '#f4efe6';
        c.font = '600 72px "Bodoni Moda", Georgia, serif';
        c.textAlign = 'center';
        c.fillText(BRAND, W / 2, 140);
        c.fillStyle = 'rgba(201,165,106,0.95)';
        c.font = '500 28px Syne, Avenir Next, sans-serif';
        c.letterSpacing = '0.18em';
        c.fillText(meta.won ? 'SHOW COMPLETE' : 'RUNWAY MOMENT', W / 2, 190);

        // Game frame
        let img = null;
        try {
            img = await createImageBitmap(shotBlob);
        } catch (_) {
            img = await blobToImage(shotBlob);
        }
        if (img) {
            const frameTop = 240;
            const frameH = 1180;
            const frameW = W - 96;
            const frameX = 48;
            const frameY = frameTop;
            // Soft frame
            c.fillStyle = 'rgba(255,255,255,0.06)';
            roundRect(c, frameX - 4, frameY - 4, frameW + 8, frameH + 8, 28);
            c.fill();

            const iw = img.width;
            const ih = img.height;
            const scale = Math.max(frameW / iw, frameH / ih);
            const dw = iw * scale;
            const dh = ih * scale;
            const dx = frameX + (frameW - dw) / 2;
            const dy = frameY + (frameH - dh) / 2;
            c.save();
            roundRect(c, frameX, frameY, frameW, frameH, 24);
            c.clip();
            c.drawImage(img, dx, dy, dw, dh);
            c.restore();
            if (img.close) try { img.close(); } catch (_) { /* ok */ }
        }

        // Meta band
        const bandY = 1480;
        c.fillStyle = 'rgba(244,239,230,0.92)';
        c.font = '600 44px "Bodoni Moda", Georgia, serif';
        c.textAlign = 'center';
        const handle = meta.tag ? '@' + String(meta.tag).replace(/^@/, '') : '@model';
        c.fillText(handle, W / 2, bandY);

        c.fillStyle = 'rgba(244,239,230,0.7)';
        c.font = '500 30px Syne, Avenir Next, sans-serif';
        const line2 = [
            meta.character || 'Model',
            meta.city || '',
            meta.look ? 'Look · ' + meta.look : ''
        ].filter(Boolean).join('  ·  ');
        c.fillText(line2.slice(0, 48), W / 2, bandY + 56);

        c.fillStyle = '#c9a56a';
        c.font = '700 56px "Bodoni Moda", Georgia, serif';
        c.fillText(String(Math.floor(meta.score || 0)), W / 2, bandY + 130);
        c.fillStyle = 'rgba(244,239,230,0.55)';
        c.font = '500 22px Syne, Avenir Next, sans-serif';
        c.fillText(
            (meta.designer ? meta.designer + '  ·  ' : '') + (meta.difficulty || '') + '  ·  ' + SITE.replace('https://', ''),
            W / 2,
            bandY + 175
        );

        return new Promise((resolve) => {
            card.toBlob((b) => resolve(b), 'image/png', 0.95);
        });
    }

    function roundRect(c, x, y, w, h, r) {
        const rr = Math.min(r, w / 2, h / 2);
        c.beginPath();
        c.moveTo(x + rr, y);
        c.arcTo(x + w, y, x + w, y + h, rr);
        c.arcTo(x + w, y + h, x, y + h, rr);
        c.arcTo(x, y + h, x, y, rr);
        c.arcTo(x, y, x + w, y, rr);
        c.closePath();
    }

    function blobToImage(blob) {
        return new Promise((resolve) => {
            const url = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve(img);
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                resolve(null);
            };
            img.src = url;
        });
    }

    function shareCaption(meta) {
        meta = meta || {};
        const handle = meta.tag ? '@' + String(meta.tag).replace(/^@/, '') : '';
        const look = meta.look ? ' in ' + meta.look : '';
        const city = meta.city ? ' · ' + meta.city : '';
        const verb = meta.won ? 'closed the show' : 'hit the runway';
        return `${handle || 'A rascal'} ${verb}${look}${city} — score ${Math.floor(meta.score || 0)}. Play ${BRAND} ${SITE} #${HASHTAGS.split(',').join(' #')}`;
    }

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
    }

    async function shareNative(file, text) {
        if (!navigator.share) return false;
        try {
            const data = { title: BRAND, text };
            if (file && canNativeShareFiles()) {
                data.files = [file];
                if (!navigator.canShare(data)) {
                    delete data.files;
                }
            }
            await navigator.share(data);
            return true;
        } catch (err) {
            if (err && err.name === 'AbortError') return true;
            return false;
        }
    }

    /**
     * @param {'x'|'tiktok'|'instagram'|'native'|'download'} platform
     * @param {{imageBlob?:Blob|null, videoBlob?:Blob|null, meta?:object}} payload
     */
    async function shareTo(platform, payload) {
        payload = payload || {};
        const meta = payload.meta || {};
        const text = shareCaption(meta);
        const isVideo = !!(payload.videoBlob && payload.videoBlob.size);
        const blob = isVideo ? payload.videoBlob : payload.imageBlob;
        if (!blob) throw new Error('Nothing to share');

        const ext = isVideo
            ? (blob.type.includes('mp4') ? 'mp4' : 'webm')
            : 'png';
        const filename = `rascal-runways-${isVideo ? 'clip' : 'look'}-${Date.now()}.${ext}`;
        const file = new File([blob], filename, { type: blob.type || (isVideo ? 'video/webm' : 'image/png') });

        if (platform === 'download') {
            downloadBlob(blob, filename);
            return { ok: true, via: 'download' };
        }

        if (platform === 'native') {
            const ok = await shareNative(file, text);
            if (!ok) downloadBlob(blob, filename);
            return { ok: true, via: ok ? 'native' : 'download' };
        }

        // Prefer OS share sheet (puts IG / TikTok / X in the sheet on phones)
        if (canNativeShareFiles()) {
            const ok = await shareNative(file, text);
            if (ok) return { ok: true, via: 'native-sheet' };
        }

        // Always save the media so the user can attach it in-app
        downloadBlob(blob, filename);

        if (platform === 'x') {
            const intent = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text);
            global.open(intent, '_blank', 'noopener,noreferrer');
            return { ok: true, via: 'x-intent', downloaded: true };
        }
        if (platform === 'tiktok') {
            global.open('https://www.tiktok.com/upload', '_blank', 'noopener,noreferrer');
            return { ok: true, via: 'tiktok-upload', downloaded: true };
        }
        if (platform === 'instagram') {
            // IG has no web media intent — open app / site; file already downloaded
            global.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
            return { ok: true, via: 'instagram', downloaded: true };
        }

        return { ok: true, via: 'download' };
    }

    /**
     * Open the share sheet UI over the game.
     * @param {HTMLElement} root
     * @param {{imageBlob?:Blob|null, videoBlob?:Blob|null, meta?:object, previewUrl?:string}} opts
     */
    function openShareSheet(root, opts) {
        opts = opts || {};
        closeShareSheet(root);

        const meta = opts.meta || {};
        const hasVideo = !!(opts.videoBlob && opts.videoBlob.size);
        const previewSrc = opts.previewUrl || (opts.imageBlob ? URL.createObjectURL(opts.imageBlob) : '');

        const sheet = document.createElement('div');
        sheet.id = 'clipShareSheet';
        sheet.className = 'clip-share-sheet';
        sheet.setAttribute('role', 'dialog');
        sheet.setAttribute('aria-label', 'Share runway moment');
        sheet.innerHTML = `
            <div class="clip-share-panel">
                <button type="button" class="clip-share-close" id="clipShareClose" aria-label="Close share">×</button>
                <p class="clip-share-kicker">Share your look</p>
                <h2 class="clip-share-title">${BRAND}</h2>
                <div class="clip-share-preview-wrap">
                    ${previewSrc
                        ? `<img class="clip-share-preview" id="clipSharePreview" alt="Share preview" src="${previewSrc}" />`
                        : `<div class="clip-share-preview clip-share-preview--empty">Clip ready</div>`}
                    ${hasVideo ? '<span class="clip-share-badge">Clip · ~15s</span>' : '<span class="clip-share-badge">Still</span>'}
                </div>
                <p class="clip-share-caption">${escapeHtml(shareCaption(meta).slice(0, 120))}…</p>
                <div class="clip-share-actions" role="group" aria-label="Share destinations">
                    <button type="button" class="clip-share-btn clip-share-btn--x" data-share="x" aria-label="Share to X">
                        <span class="clip-share-ico">𝕏</span>
                        <span>X</span>
                    </button>
                    <button type="button" class="clip-share-btn clip-share-btn--tt" data-share="tiktok" aria-label="Share to TikTok">
                        <span class="clip-share-ico">♪</span>
                        <span>TikTok</span>
                    </button>
                    <button type="button" class="clip-share-btn clip-share-btn--ig" data-share="instagram" aria-label="Share to Instagram">
                        <span class="clip-share-ico">◎</span>
                        <span>IG</span>
                    </button>
                </div>
                <div class="clip-share-secondary">
                    ${canNativeShareFiles() || navigator.share
                        ? '<button type="button" class="game-btn clip-share-native" data-share="native">Share sheet</button>'
                        : ''}
                    <button type="button" class="game-btn clip-share-save" data-share="download">Save ${hasVideo ? 'clip' : 'photo'}</button>
                </div>
                <p class="clip-share-hint" id="clipShareHint">On phone, pick IG / TikTok / X from the share sheet. Desktop saves the file first.</p>
            </div>
        `;

        (root || document.body).appendChild(sheet);

        const setHint = (msg) => {
            const h = document.getElementById('clipShareHint');
            if (h) h.textContent = msg;
        };

        const onShare = async (platform) => {
            setHint('Opening…');
            try {
                const result = await shareTo(platform, {
                    imageBlob: opts.imageBlob,
                    videoBlob: opts.videoBlob,
                    meta
                });
                if (result.downloaded) {
                    setHint('Saved to downloads — attach it in the app that opened.');
                } else if (result.via === 'native' || result.via === 'native-sheet') {
                    setHint('Shared.');
                } else {
                    setHint('Done.');
                }
            } catch (_) {
                setHint('Could not share — try Save instead.');
            }
        };

        sheet.querySelectorAll('[data-share]').forEach((btn) => {
            btn.addEventListener('click', () => onShare(btn.getAttribute('data-share')));
        });
        document.getElementById('clipShareClose').addEventListener('click', () => {
            if (previewSrc && opts.imageBlob) URL.revokeObjectURL(previewSrc);
            closeShareSheet(root);
            try {
                root && root.dispatchEvent(new CustomEvent('clip-share-closed'));
            } catch (_) { /* ok */ }
        });

        requestAnimationFrame(() => sheet.classList.add('is-open'));
        return sheet;
    }

    function closeShareSheet(root) {
        const scope = root || document;
        const el = (scope.querySelector && scope.querySelector('#clipShareSheet')) || document.getElementById('clipShareSheet');
        if (el) el.remove();
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /**
     * One-shot: screenshot → branded card → share sheet.
     */
    async function captureAndShare(root, meta) {
        const shot = await captureScreenshot();
        if (!shot) throw new Error('Screenshot failed');
        const card = await buildShareCard(shot, meta);
        const imageBlob = card || shot;
        const previewUrl = URL.createObjectURL(imageBlob);
        let videoBlob = null;
        if (recording || chunks.length) {
            // Snapshot rolling buffer without stopping forever — restart after
            const wasRec = recording;
            videoBlob = await stopRecording(false);
            if (wasRec) startRecording();
        }
        openShareSheet(root, { imageBlob, videoBlob, meta, previewUrl });
        return { imageBlob, videoBlob };
    }

    /**
     * Finalize run clip + optional still for end overlay.
     */
    async function finalizeRunShare(root, meta, options) {
        options = options || {};
        const shot = options.shotBlob || (await captureScreenshot());
        const card = shot ? await buildShareCard(shot, meta) : null;
        const imageBlob = card || shot;
        const previewUrl = imageBlob ? URL.createObjectURL(imageBlob) : '';
        let videoBlob = null;
        if (options.includeClip !== false) {
            videoBlob = await stopRecording(false);
        }
        openShareSheet(root, { imageBlob, videoBlob, meta, previewUrl });
        return { imageBlob, videoBlob };
    }

    global.RunwayClipShare = {
        attach,
        detach,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        isRecording,
        canRecord,
        canNativeShareFiles,
        captureScreenshot,
        buildShareCard,
        captureAndShare,
        finalizeRunShare,
        openShareSheet,
        closeShareSheet,
        shareTo,
        shareCaption,
        MAX_CLIP_MS
    };
})(typeof window !== 'undefined' ? window : globalThis);
