/**
 * Stylized fashion runway pickups — inspired by classic show props
 * (heels, clutches, sunglasses, perfume, scarves) drawn procedurally in-game.
 * Not product replicas; original silhouettes for Runway Rascals.
 */
window.FASHION_ITEMS = [
    {
        id: 'stiletto',
        name: 'Runway Stiletto',
        label: 'HEEL',
        shape: 'heel',
        color: '#1a1a1a',
        accent: '#c9a56a',
        points: 40,
        boostMs: 1.4,
        speedBurst: 1.22
    },
    {
        id: 'lucite-clutch',
        name: 'Lucite Clutch',
        label: 'CLUTCH',
        shape: 'clutch',
        color: '#0f172a',
        accent: '#e8e0d4',
        points: 45,
        boostMs: 1.5,
        speedBurst: 1.18
    },
    {
        id: 'cat-eye',
        name: 'Cat-Eye Shades',
        label: 'SHADES',
        shape: 'shades',
        color: '#111827',
        accent: '#f4c430',
        points: 35,
        boostMs: 1.2,
        speedBurst: 1.15
    },
    {
        id: 'atomizer',
        name: 'Parfum Atomizer',
        label: 'SCENT',
        shape: 'perfume',
        color: '#7c2d12',
        accent: '#fde68a',
        points: 38,
        boostMs: 1.3,
        speedBurst: 1.2
    },
    {
        id: 'silk-scarf',
        name: 'Silk Square',
        label: 'SCARF',
        shape: 'scarf',
        color: '#9f1239',
        accent: '#fef3c7',
        points: 32,
        boostMs: 1.15,
        speedBurst: 1.12
    },
    {
        id: 'mini-backpack',
        name: 'Safety-Pin Mini',
        label: 'BAG',
        shape: 'bag',
        color: '#1e3a5f',
        accent: '#d4af37',
        points: 48,
        boostMs: 1.55,
        speedBurst: 1.25
    },
    {
        id: 'crystal-cuff',
        name: 'Crystal Cuff',
        label: 'CUFF',
        shape: 'cuff',
        color: '#312e81',
        accent: '#e0e7ff',
        points: 42,
        boostMs: 1.35,
        speedBurst: 1.16
    }
];

window.pickFashionItem = function pickFashionItem() {
    const list = window.FASHION_ITEMS;
    return list[Math.floor(Math.random() * list.length)];
};
