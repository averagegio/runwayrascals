/**
 * Stylized fashion runway pickups — inspired by classic show props
 * and designer set pieces. Original silhouettes for Rascal Runways.
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
    },
    {
        id: 'logo-blue-tee',
        name: 'Logo Blue Tee',
        label: 'TEE',
        shape: 'tee',
        color: '#1e40af',
        accent: '#ffffff',
        logo: 'balenciaga',
        points: 52,
        boostMs: 1.4,
        speedBurst: 1.2
    },
    {
        id: 'triple-s-sneaker',
        name: 'Triple-S',
        label: 'SNEAK',
        shape: 'sneaker',
        color: '#ef4444',
        accent: '#3b82f6',
        logo: 'balenciaga',
        points: 58,
        boostMs: 1.6,
        speedBurst: 1.28
    },
    {
        id: 'ramones-boot',
        name: 'Ramones',
        label: 'BOOT',
        shape: 'boot',
        color: '#111111',
        accent: '#f5f0e6',
        logo: 'rick',
        points: 55,
        boostMs: 1.5,
        speedBurst: 1.22
    },
    {
        id: 'drop-crotch',
        name: 'Drop Pants',
        label: 'PANT',
        shape: 'pants',
        color: '#0a0a0a',
        accent: '#f5f0e6',
        logo: 'rick',
        points: 44,
        boostMs: 1.25,
        speedBurst: 1.14
    },
    {
        id: 'casa-silk',
        name: 'Silk Club Shirt',
        label: 'SILK',
        shape: 'shirt',
        color: '#f5f0e6',
        accent: '#1e3a5f',
        logo: 'casablanca',
        points: 50,
        boostMs: 1.45,
        speedBurst: 1.18
    },
    {
        id: 'crest-polo',
        name: 'Crest Polo',
        label: 'POLO',
        shape: 'polo',
        color: '#16a34a',
        accent: '#eab308',
        logo: 'ralph',
        points: 48,
        boostMs: 1.35,
        speedBurst: 1.16
    },
    {
        id: 'book-tote',
        name: 'Book Tote',
        label: 'TOTE',
        shape: 'tote',
        color: '#1e3a5f',
        accent: '#f5f0e6',
        logo: 'dior',
        points: 60,
        boostMs: 1.65,
        speedBurst: 1.24
    }
];

window.pickFashionItem = function pickFashionItem() {
    const list = window.FASHION_ITEMS;
    return list[Math.floor(Math.random() * list.length)];
};
