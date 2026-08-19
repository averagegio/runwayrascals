document.addEventListener('DOMContentLoaded', () => {
    let cityId = 'newyork';
    let cityName = 'New York';
    try {
        const map = JSON.parse(localStorage.getItem('selectedMap') || 'null');
        if (map && map.id) {
            cityId = map.id;
            cityName = map.name || map.id;
        }
    } catch (_) { /* ignore */ }

    const subtitle = document.getElementById('citySubtitle');
    if (subtitle) subtitle.textContent = `${cityName} · pick your designer show`;

    const shows = window.getShowsForCity(cityId);
    const list = document.getElementById('showList');
    const confirmBtn = document.getElementById('confirmShowBtn');
    let selected = null;

    shows.forEach((show) => {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'map-card show-card';
        el.dataset.showId = show.id;
        el.style.setProperty('--map-accent', show.accent);
        el.style.background = `linear-gradient(135deg, #111 0%, ${show.accent}55 100%)`;
        el.innerHTML = `
            <span class="map-event">${show.showName}</span>
            <span class="map-name">${show.designer}</span>
            <span class="map-tagline">${show.tagline}</span>
            <span class="show-meta">Boost: ${show.boost.name}</span>
            <span class="show-meta rare">Goal: collect ${show.rareGoal.target}× ${show.rareGoal.fullName}</span>
        `;
        el.addEventListener('click', () => {
            document.querySelectorAll('.show-card').forEach((c) => c.classList.remove('selected'));
            el.classList.add('selected');
            selected = show;
        });
        list.appendChild(el);
    });

    try {
        const saved = JSON.parse(localStorage.getItem('selectedShow') || 'null');
        if (saved && saved.id) {
            const match = list.querySelector(`[data-show-id="${saved.id}"]`);
            if (match) {
                match.classList.add('selected');
                selected = shows.find((s) => s.id === saved.id) || saved;
            }
        }
    } catch (_) { /* ignore */ }

    confirmBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!selected) {
            alert('Pick a designer show to walk for.');
            return;
        }
        localStorage.setItem('selectedShow', JSON.stringify({
            id: selected.id,
            cityId,
            designer: selected.designer,
            showName: selected.showName
        }));
        window.location.href = 'gameplay.html';
    });
});
