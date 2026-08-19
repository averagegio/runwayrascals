document.addEventListener('DOMContentLoaded', async () => {
    if (!RunwayAuth.requireAuth()) return;

    const list = document.getElementById('storeList');
    const status = document.getElementById('storeStatus');
    const subtitle = document.getElementById('storeSubtitle');
    const params = new URLSearchParams(location.search);

    function showStatus(msg, ok) {
        status.hidden = false;
        status.textContent = msg;
        status.classList.toggle('ok', !!ok);
        status.classList.toggle('err', !ok);
    }

    if (params.get('success') === '1') {
        showStatus(`Purchase complete${params.get('item') ? `: ${params.get('item')}` : ''}. Check your wardrobe.`, true);
    } else if (params.get('canceled') === '1') {
        showStatus('Checkout canceled.', false);
    }

    let catalog = { items: [], stripe: {} };
    let user = RunwayAuth.getCachedUser();

    try {
        catalog = await RunwayAuth.api('/api/store');
        user = await RunwayAuth.me();
        subtitle.textContent = catalog.stripe.configured
            ? 'Member boutique · Stripe Checkout'
            : (catalog.stripe.paymentLink ? 'Member boutique · Payment Link' : 'Member boutique · Checkout');
    } catch (ex) {
        showStatus(`Store offline: ${ex.message}. Start the API server in /server`, false);
        return;
    }

    const owned = new Set(user.ownedItems || []);

    function logoHtml(logoKey) {
        if (!logoKey || !window.getLogoMark) return '';
        const mark = window.getLogoMark(logoKey);
        if (!mark) return '';
        return `<span class="logo-badge logo-${mark.monogram}" style="--logo-bg:${mark.bg};--logo-fg:${mark.color}">${mark.label}</span>`;
    }

    catalog.items.forEach((item) => {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'map-card store-card' + (item.membersOnly ? ' is-locked' : '');
        el.style.setProperty('--map-accent', item.color);
        el.style.background = `linear-gradient(135deg, #111, ${item.color}66)`;
        const price = item.free ? 'FREE' : `$${(item.priceCents / 100).toFixed(2)}`;
        const ownedLabel = owned.has(item.id)
            ? 'Owned'
            : (item.membersOnly ? 'Members · Buy' : 'Buy');
        el.innerHTML = `
            <div class="store-card-top">${logoHtml(item.logo)}${item.membersOnly ? '<span class="lock-pill">Members</span>' : ''}</div>
            <span class="map-event">${item.designer}</span>
            <span class="map-name">${item.name}</span>
            <span class="map-tagline">${item.description}</span>
            <span class="show-meta">${price}</span>
            <span class="show-meta rare">${ownedLabel}</span>
        `;
        if (owned.has(item.id)) {
            el.classList.add('owned');
            el.disabled = true;
        } else {
            el.addEventListener('click', () => checkout(item));
        }
        list.appendChild(el);
    });

    async function checkout(item) {
        try {
            const successUrl = `${location.origin}/store.html?success=1&item=${encodeURIComponent(item.id)}`;
            const cancelUrl = `${location.origin}/store.html?canceled=1`;
            const data = await RunwayAuth.api('/api/store/checkout', {
                method: 'POST',
                body: JSON.stringify({ itemId: item.id, successUrl, cancelUrl })
            });
            if (data.free) {
                showStatus(`Added ${item.name} to your closet.`, true);
                setTimeout(() => location.reload(), 700);
                return;
            }
            if (data.url) {
                if (data.url.startsWith('http')) location.href = data.url;
                else location.href = data.url;
                return;
            }
            showStatus('No checkout URL returned.', false);
        } catch (ex) {
            showStatus(ex.message, false);
        }
    }
});
