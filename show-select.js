document.addEventListener('DOMContentLoaded', () => {
    const DIFFICULTIES = [
        {
            id: 'easy',
            label: 'Easy',
            hint: 'Easy — slower runway, more time to dodge',
            accent: '#22c55e'
        },
        {
            id: 'medium',
            label: 'Medium',
            hint: 'Medium — balanced runway pace',
            accent: '#eab308'
        },
        {
            id: 'hard',
            label: 'Hard',
            hint: 'Hard — faster walk, denser barriers',
            accent: '#f97316'
        },
        {
            id: 'impossible',
            label: 'Impossible',
            hint: 'Impossible — blistering speed that keeps climbing',
            accent: '#ef4444'
        }
    ];

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
    const diffRoot = document.getElementById('difficultyOptions');
    const diffHint = document.getElementById('difficultyHint');
    let selected = null;
    let selectedDifficulty = 'medium';

    try {
        const savedDiff = localStorage.getItem('selectedDifficulty');
        if (savedDiff && DIFFICULTIES.some((d) => d.id === savedDiff)) {
            selectedDifficulty = savedDiff;
        }
    } catch (_) { /* ignore */ }

    DIFFICULTIES.forEach((diff) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'difficulty-btn';
        btn.dataset.difficulty = diff.id;
        btn.style.setProperty('--diff-accent', diff.accent);
        btn.textContent = diff.label;
        if (diff.id === selectedDifficulty) btn.classList.add('selected');
        btn.addEventListener('click', () => {
            selectedDifficulty = diff.id;
            diffRoot.querySelectorAll('.difficulty-btn').forEach((b) => b.classList.remove('selected'));
            btn.classList.add('selected');
            if (diffHint) diffHint.textContent = diff.hint;
        });
        diffRoot.appendChild(btn);
    });
    const initial = DIFFICULTIES.find((d) => d.id === selectedDifficulty);
    if (diffHint && initial) diffHint.textContent = initial.hint;

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
        localStorage.setItem('selectedDifficulty', selectedDifficulty);
        localStorage.setItem('selectedShow', JSON.stringify({
            id: selected.id,
            cityId,
            designer: selected.designer,
            showName: selected.showName
        }));
        window.location.href = 'gameplay.html';
    });
});
