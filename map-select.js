document.addEventListener('DOMContentLoaded', async () => {
    const maps = [
        {
            id: 'newyork',
            name: 'New York',
            event: 'NYFW',
            tagline: 'Bryant Park energy',
            accent: '#F4C430',
            sky: ['#1a1a2e', '#16213e']
        },
        {
            id: 'milan',
            name: 'Milan',
            event: 'Milan Fashion Week',
            tagline: 'Via Montenapoleone glam',
            accent: '#8B0000',
            sky: ['#2c1810', '#4a2c2a']
        },
        {
            id: 'paris',
            name: 'Paris',
            event: 'Paris Fashion Week',
            tagline: 'Eiffel atelier light',
            accent: '#1d4ed8',
            sky: ['#1e3a5f', '#93c5fd']
        },
        {
            id: 'london',
            name: 'London',
            event: 'London Fashion Week',
            tagline: 'Somerset House chic',
            accent: '#C8102E',
            sky: ['#0b1d36', '#1e3a5f']
        },
        {
            id: 'berlin',
            name: 'Berlin',
            event: 'Berlin Fashion Week',
            tagline: 'Avant-garde concrete',
            accent: '#2ECC71',
            sky: ['#1c1c1c', '#3d3d3d']
        },
        {
            id: 'miami',
            name: 'Miami',
            event: 'Miami Fashion Week',
            tagline: 'Art Deco heat',
            accent: '#FF6EC7',
            sky: ['#0ea5e9', '#f97316']
        }
    ];

    let unlocked = ['newyork'];
    if (window.RunwayAuth && RunwayAuth.getToken()) {
        try {
            const data = await RunwayAuth.api('/api/levels');
            unlocked = data.unlocked || unlocked;
        } catch (_) {
            const user = RunwayAuth.getCachedUser();
            if (user && user.unlockedLevels) unlocked = user.unlockedLevels;
        }
    }

    const mapList = document.getElementById('mapList');
    const confirmBtn = document.getElementById('confirmMapBtn');
    let selectedMap = null;

    maps.forEach((map) => {
        const isUnlocked = unlocked.includes(map.id);
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'map-card';
        el.dataset.mapId = map.id;
        el.disabled = !isUnlocked;
        el.style.setProperty('--map-accent', map.accent);
        el.style.background = `linear-gradient(135deg, ${map.sky[0]}, ${map.sky[1]})`;
        el.innerHTML = `
            <span class="map-event">${map.event}</span>
            <span class="map-name">${map.name}</span>
            <span class="map-tagline">${map.tagline}</span>
            <span class="show-meta">${isUnlocked ? 'Unlocked' : 'Locked — finish previous city'}</span>
        `;
        if (!isUnlocked) el.classList.add('locked');
        el.addEventListener('click', () => {
            if (!isUnlocked) return;
            document.querySelectorAll('.map-card').forEach((c) => c.classList.remove('selected'));
            el.classList.add('selected');
            selectedMap = map;
        });
        mapList.appendChild(el);
    });

    const saved = localStorage.getItem('selectedMap');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            const match = mapList.querySelector(`[data-map-id="${parsed.id}"]`);
            if (match && !match.disabled) {
                match.classList.add('selected');
                selectedMap = maps.find((m) => m.id === parsed.id) || parsed;
            }
        } catch (_) { /* ignore */ }
    }

    confirmBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!selectedMap) {
            alert('Pick a Fashion Week runway first.');
            return;
        }
        localStorage.setItem('selectedMap', JSON.stringify(selectedMap));
        window.location.href = 'show-select.html';
    });
});
