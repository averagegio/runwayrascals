/** Shared Fashion Week show / designer data for Runway Rascals */
window.RUNWAY_SHOWS = {
    newyork: [
        {
            id: 'rick-owens',
            designer: 'Rick Owens',
            showName: 'DRKSHDW',
            tagline: 'Walk the dark cathedral',
            accent: '#d4d4d4',
            palette: ['#1a1a1a', '#4a4a4a', '#cfcfcf', '#8b5a2b'],
            boost: {
                id: 'geobasket-glide',
                name: 'Geobasket Glide',
                description: 'Higher jumps + soft clothing magnet',
                jumpMult: 1.35,
                magnet: 22,
                speedMult: 1.0
            },
            rareGoal: {
                id: 'ramones',
                label: 'RAMONES',
                fullName: 'Rick Owens Ramones',
                target: 3,
                color: '#111111',
                points: 120,
                slot: 'shoes'
            },
            pieces: [
                { id: 'street', name: 'Nameless Street', slot: 'base', color: '#6b7280' },
                { id: 'pants', name: 'Drop-Crotch Pants', slot: 'bottoms', color: '#1f1f1f' },
                { id: 'tee', name: 'DRKSHDW Tee', slot: 'top', color: '#374151' },
                { id: 'ramones', name: 'Ramones', slot: 'shoes', color: '#0a0a0a', rare: true },
                { id: 'leather', name: 'Leather Jacket', slot: 'outer', color: '#111111' },
                { id: 'finale', name: 'Full Owens Look', slot: 'finale', color: '#e5e5e5' }
            ]
        },
        {
            id: 'ralph-lauren',
            designer: 'Ralph Lauren',
            showName: 'Purple Label',
            tagline: 'Uptown polish',
            accent: '#6b21a8',
            palette: ['#1e3a5f', '#7c2d12', '#c4a574', '#f5f5f4'],
            boost: {
                id: 'polo-stride',
                name: 'Polo Stride',
                description: 'Steady speed boost on the runway',
                jumpMult: 1.05,
                magnet: 8,
                speedMult: 1.12
            },
            rareGoal: {
                id: 'polo-blazer',
                label: 'BLAZER',
                fullName: 'Purple Label Blazer',
                target: 3,
                color: '#4c1d95',
                points: 110,
                slot: 'outer'
            },
            pieces: [
                { id: 'street', name: 'Nameless Street', slot: 'base', color: '#6b7280' },
                { id: 'chinos', name: 'Tailored Chinos', slot: 'bottoms', color: '#92400e' },
                { id: 'oxford', name: 'Oxford Shirt', slot: 'top', color: '#f8fafc' },
                { id: 'loafers', name: 'Calf Loafers', slot: 'shoes', color: '#78350f' },
                { id: 'blazer', name: 'Purple Label Blazer', slot: 'outer', color: '#4c1d95', rare: true },
                { id: 'finale', name: 'Full Polo Look', slot: 'finale', color: '#6b21a8' }
            ]
        }
    ],
    milan: [
        {
            id: 'prada',
            designer: 'Prada',
            showName: 'Prada FW',
            tagline: 'Via Montenapoleone precision',
            accent: '#14532d',
            palette: ['#14532d', '#000000', '#f5f5f4', '#a8a29e'],
            boost: {
                id: 'triangle-focus',
                name: 'Triangle Focus',
                description: 'Wider collect hitbox',
                jumpMult: 1.1,
                magnet: 30,
                speedMult: 1.0
            },
            rareGoal: {
                id: 'prada-nylon',
                label: 'NYLON',
                fullName: 'Prada Nylon Bag',
                target: 3,
                color: '#166534',
                points: 115,
                slot: 'finale'
            },
            pieces: [
                { id: 'street', name: 'Nameless Street', slot: 'base', color: '#6b7280' },
                { id: 'trouser', name: 'Slim Trouser', slot: 'bottoms', color: '#111827' },
                { id: 'knit', name: 'Fine Knit', slot: 'top', color: '#f5f5f4' },
                { id: 'derby', name: 'Derby Shoe', slot: 'shoes', color: '#1c1917' },
                { id: 'coat', name: 'Nylon Coat', slot: 'outer', color: '#14532d' },
                { id: 'bag', name: 'Nylon Bag', slot: 'finale', color: '#166534', rare: true }
            ]
        },
        {
            id: 'versace-milan',
            designer: 'Versace',
            showName: 'Versace Atelier',
            tagline: 'Medusa heat',
            accent: '#d4af37',
            palette: ['#1d4ed8', '#d4af37', '#7f1d1d', '#000000'],
            boost: {
                id: 'medusa-flash',
                name: 'Medusa Flash',
                description: 'Brief invuln spark after a collect',
                jumpMult: 1.15,
                magnet: 12,
                speedMult: 1.05,
                collectShield: 0.7
            },
            rareGoal: {
                id: 'medusa-heels',
                label: 'MEDUSA',
                fullName: 'Medusa Heels',
                target: 3,
                color: '#d4af37',
                points: 125,
                slot: 'shoes'
            },
            pieces: [
                { id: 'street', name: 'Nameless Street', slot: 'base', color: '#6b7280' },
                { id: 'skirt', name: 'Baroque Skirt', slot: 'bottoms', color: '#1e3a8a' },
                { id: 'bodice', name: 'Gold Bodice', slot: 'top', color: '#d4af37' },
                { id: 'heels', name: 'Medusa Heels', slot: 'shoes', color: '#b45309', rare: true },
                { id: 'cape', name: 'Print Cape', slot: 'outer', color: '#7f1d1d' },
                { id: 'finale', name: 'Full Versace', slot: 'finale', color: '#d4af37' }
            ]
        }
    ],
    london: [
        {
            id: 'mcqueen',
            designer: 'Alexander McQueen',
            showName: 'McQueen',
            tagline: 'Savage beauty',
            accent: '#9f1239',
            palette: ['#111111', '#9f1239', '#e5e5e5', '#445'],
            boost: {
                id: 'savage-leap',
                name: 'Savage Leap',
                description: 'Powerful jumps over barriers',
                jumpMult: 1.45,
                magnet: 10,
                speedMult: 1.05
            },
            rareGoal: {
                id: 'skull-clutch',
                label: 'SKULL',
                fullName: 'Skull Clutch',
                target: 3,
                color: '#f8fafc',
                points: 130,
                slot: 'finale'
            },
            pieces: [
                { id: 'street', name: 'Nameless Street', slot: 'base', color: '#6b7280' },
                { id: 'tailored', name: 'Sharp Trouser', slot: 'bottoms', color: '#171717' },
                { id: 'blouse', name: 'Ruffled Blouse', slot: 'top', color: '#fafafa' },
                { id: 'boot', name: 'Armadillo Boot', slot: 'shoes', color: '#44403c' },
                { id: 'coat', name: 'Structured Coat', slot: 'outer', color: '#9f1239' },
                { id: 'clutch', name: 'Skull Clutch', slot: 'finale', color: '#e7e5e4', rare: true }
            ]
        },
        {
            id: 'burberry',
            designer: 'Burberry',
            showName: 'Burberry',
            tagline: 'Trench weather',
            accent: '#b45309',
            palette: ['#92400e', '#e7e5e4', '#1e3a5f', '#a8a29e'],
            boost: {
                id: 'trench-cover',
                name: 'Trench Cover',
                description: 'Slightly slower paparazzi spawn',
                jumpMult: 1.1,
                magnet: 14,
                speedMult: 1.0,
                obstacleBias: 0.85
            },
            rareGoal: {
                id: 'trench',
                label: 'TRENCH',
                fullName: 'Heritage Trench',
                target: 3,
                color: '#a16207',
                points: 115,
                slot: 'outer'
            },
            pieces: [
                { id: 'street', name: 'Nameless Street', slot: 'base', color: '#6b7280' },
                { id: 'check-pants', name: 'Check Trouser', slot: 'bottoms', color: '#78716c' },
                { id: 'knit', name: 'Cashmere Knit', slot: 'top', color: '#e7e5e4' },
                { id: 'boot', name: 'Chelsea Boot', slot: 'shoes', color: '#292524' },
                { id: 'trench', name: 'Heritage Trench', slot: 'outer', color: '#a16207', rare: true },
                { id: 'finale', name: 'Full Burberry', slot: 'finale', color: '#b45309' }
            ]
        }
    ],
    berlin: [
        {
            id: 'balenciaga',
            designer: 'Balenciaga',
            showName: 'Balenciaga',
            tagline: 'Concrete couture',
            accent: '#22c55e',
            palette: ['#171717', '#525252', '#22c55e', '#fafafa'],
            boost: {
                id: 'triple-s',
                name: 'Triple-S Push',
                description: 'Faster runway pace',
                jumpMult: 1.1,
                magnet: 10,
                speedMult: 1.18
            },
            rareGoal: {
                id: 'triple-s',
                label: 'TRIPLE-S',
                fullName: 'Triple-S Sneakers',
                target: 3,
                color: '#fafafa',
                points: 120,
                slot: 'shoes'
            },
            pieces: [
                { id: 'street', name: 'Nameless Street', slot: 'base', color: '#6b7280' },
                { id: 'baggy', name: 'Baggy Denim', slot: 'bottoms', color: '#3f3f46' },
                { id: 'hoodie', name: 'Oversized Hoodie', slot: 'top', color: '#18181b' },
                { id: 'sneaker', name: 'Triple-S', slot: 'shoes', color: '#f4f4f5', rare: true },
                { id: 'puffer', name: 'Hard Puffer', slot: 'outer', color: '#27272a' },
                { id: 'finale', name: 'Full Balenciaga', slot: 'finale', color: '#22c55e' }
            ]
        },
        {
            id: 'ann-d',
            designer: 'Ann Demeulemeester',
            showName: 'Ann D.',
            tagline: 'Poetic black',
            accent: '#e5e5e5',
            palette: ['#0a0a0a', '#262626', '#e5e5e5', '#737373'],
            boost: {
                id: 'poet-slide',
                name: 'Poet Slide',
                description: 'Longer slides under flashes',
                jumpMult: 1.05,
                magnet: 16,
                speedMult: 1.0,
                slideMult: 1.4
            },
            rareGoal: {
                id: 'poet-boots',
                label: 'BOOTS',
                fullName: 'Poet Boots',
                target: 3,
                color: '#0a0a0a',
                points: 118,
                slot: 'shoes'
            },
            pieces: [
                { id: 'street', name: 'Nameless Street', slot: 'base', color: '#6b7280' },
                { id: 'wide', name: 'Wide Black Pant', slot: 'bottoms', color: '#0a0a0a' },
                { id: 'wrap', name: 'Wrap Top', slot: 'top', color: '#262626' },
                { id: 'boots', name: 'Poet Boots', slot: 'shoes', color: '#171717', rare: true },
                { id: 'coat', name: 'Long Coat', slot: 'outer', color: '#404040' },
                { id: 'finale', name: 'Full Ann D.', slot: 'finale', color: '#e5e5e5' }
            ]
        }
    ],
    miami: [
        {
            id: 'versace-miami',
            designer: 'Versace',
            showName: 'Versace South Beach',
            tagline: 'Art Deco gold',
            accent: '#f59e0b',
            palette: ['#0ea5e9', '#f59e0b', '#db2777', '#fff7ed'],
            boost: {
                id: 'south-beach',
                name: 'South Beach Heat',
                description: 'Magnet + mild speed',
                jumpMult: 1.1,
                magnet: 24,
                speedMult: 1.08
            },
            rareGoal: {
                id: 'baroque-print',
                label: 'BAROQUE',
                fullName: 'Baroque Swim Print',
                target: 3,
                color: '#f59e0b',
                points: 110,
                slot: 'top'
            },
            pieces: [
                { id: 'street', name: 'Nameless Street', slot: 'base', color: '#6b7280' },
                { id: 'short', name: 'High-Cut Short', slot: 'bottoms', color: '#0ea5e9' },
                { id: 'print', name: 'Baroque Print', slot: 'top', color: '#f59e0b', rare: true },
                { id: 'sandal', name: 'Gold Sandal', slot: 'shoes', color: '#d97706' },
                { id: 'cover', name: 'Sheer Cover', slot: 'outer', color: '#fce7f3' },
                { id: 'finale', name: 'Full Beach Versace', slot: 'finale', color: '#db2777' }
            ]
        },
        {
            id: 'casablanca',
            designer: 'Casablanca',
            showName: 'Casablanca',
            tagline: 'Silk tennis club',
            accent: '#f472b6',
            palette: ['#f472b6', '#22d3ee', '#fef3c7', '#14532d'],
            boost: {
                id: 'silk-rally',
                name: 'Silk Rally',
                description: 'Extra score on every collect',
                jumpMult: 1.08,
                magnet: 14,
                speedMult: 1.06,
                scoreMult: 1.35
            },
            rareGoal: {
                id: 'silk-shirt',
                label: 'SILK',
                fullName: 'Silk Club Shirt',
                target: 3,
                color: '#f472b6',
                points: 115,
                slot: 'top'
            },
            pieces: [
                { id: 'street', name: 'Nameless Street', slot: 'base', color: '#6b7280' },
                { id: 'trouser', name: 'Silk Trouser', slot: 'bottoms', color: '#14532d' },
                { id: 'shirt', name: 'Silk Club Shirt', slot: 'top', color: '#f472b6', rare: true },
                { id: 'sneaker', name: 'Court Sneaker', slot: 'shoes', color: '#fef3c7' },
                { id: 'blazer', name: 'Club Blazer', slot: 'outer', color: '#22d3ee' },
                { id: 'finale', name: 'Full Casablanca', slot: 'finale', color: '#f472b6' }
            ]
        }
    ]
};

window.getShowsForCity = function getShowsForCity(cityId) {
    return window.RUNWAY_SHOWS[cityId] || window.RUNWAY_SHOWS.newyork;
};

window.getShowById = function getShowById(cityId, showId) {
    const list = window.getShowsForCity(cityId);
    return list.find((s) => s.id === showId) || list[0];
};
