/**
 * Set-style designer looks for wardrobe, boutique, and runway dressing.
 * Colors / silhouettes inspired by fashion-week references — game originals.
 */
window.DESIGNER_SETS = [
    {
        id: 'balenciaga-concrete',
        designer: 'Balenciaga',
        name: 'Concrete Logo Set',
        tagline: 'Royal blue logo tee · Triple-S stack',
        accent: '#1d4ed8',
        city: 'berlin',
        showId: 'balenciaga',
        storeId: 'set-balenciaga',
        image: 'chibidollfashion.png',
        swatches: ['#1e40af', '#ffffff', '#ef4444', '#3b82f6', '#f5f5f4'],
        pieces: [
            { id: 'street', name: 'Nameless Street', slot: 'base', color: '#6b7280' },
            { id: 'baggy', name: 'Baggy Denim', slot: 'bottoms', color: '#3f3f46' },
            { id: 'logo-tee', name: 'Logo Blue Tee', slot: 'top', color: '#1e40af' },
            { id: 'triple-s', name: 'Triple-S', slot: 'shoes', color: '#ef4444', rare: true },
            { id: 'puffer', name: 'Hard Puffer', slot: 'outer', color: '#171717' },
            { id: 'finale', name: 'Full Balenciaga', slot: 'finale', color: '#1d4ed8' }
        ]
    },
    {
        id: 'rick-drkshdw',
        designer: 'Rick Owens',
        name: 'DRKSHDW Set',
        tagline: 'Drop-crotch black · Ramones cream sole',
        accent: '#e5e5e5',
        city: 'newyork',
        showId: 'rick-owens',
        storeId: 'set-rick',
        image: 'chibibrodoll.png',
        swatches: ['#0a0a0a', '#1f1f1f', '#f5f0e6', '#374151'],
        pieces: [
            { id: 'street', name: 'Nameless Street', slot: 'base', color: '#6b7280' },
            { id: 'pants', name: 'Drop-Crotch Pants', slot: 'bottoms', color: '#0a0a0a' },
            { id: 'tee', name: 'DRKSHDW Tee', slot: 'top', color: '#262626' },
            { id: 'ramones', name: 'Ramones', slot: 'shoes', color: '#111111', rare: true },
            { id: 'leather', name: 'Leather Jacket', slot: 'outer', color: '#111111' },
            { id: 'finale', name: 'Full Owens Look', slot: 'finale', color: '#e5e5e5' }
        ]
    },
    {
        id: 'casablanca-silk',
        designer: 'Casablanca',
        name: 'Silk Club Set',
        tagline: 'Cream silk shirt · navy & emerald trim',
        accent: '#0f3d2e',
        city: 'miami',
        showId: 'casablanca',
        storeId: 'set-casablanca',
        image: 'chibidollfashion.png',
        swatches: ['#f5f0e6', '#1e3a5f', '#059669', '#f472b6'],
        pieces: [
            { id: 'street', name: 'Nameless Street', slot: 'base', color: '#6b7280' },
            { id: 'trouser', name: 'Silk Trouser', slot: 'bottoms', color: '#14532d' },
            { id: 'shirt', name: 'Silk Club Shirt', slot: 'top', color: '#f5f0e6', rare: true },
            { id: 'sneaker', name: 'Court Sneaker', slot: 'shoes', color: '#fef3c7' },
            { id: 'blazer', name: 'Club Blazer', slot: 'outer', color: '#1e3a5f' },
            { id: 'finale', name: 'Full Casablanca', slot: 'finale', color: '#059669' }
        ]
    },
    {
        id: 'ralph-polo-green',
        designer: 'Ralph Lauren',
        name: 'Polo Crest Set',
        tagline: 'Kelly green polo · navy & yellow slash',
        accent: '#16a34a',
        city: 'newyork',
        showId: 'ralph-lauren',
        storeId: 'set-ralph',
        image: 'chibidoll2.png',
        swatches: ['#16a34a', '#1e3a5f', '#eab308', '#f8fafc'],
        pieces: [
            { id: 'street', name: 'Nameless Street', slot: 'base', color: '#6b7280' },
            { id: 'chinos', name: 'Tailored Chinos', slot: 'bottoms', color: '#92400e' },
            { id: 'polo', name: 'Crest Polo', slot: 'top', color: '#16a34a', rare: true },
            { id: 'loafers', name: 'Calf Loafers', slot: 'shoes', color: '#78350f' },
            { id: 'blazer', name: 'Purple Label Blazer', slot: 'outer', color: '#1e3a5f' },
            { id: 'finale', name: 'Full Polo Look', slot: 'finale', color: '#16a34a' }
        ]
    },
    {
        id: 'dior-book-tote',
        designer: 'Dior',
        name: 'Book Tote Set',
        tagline: 'Navy oblique tote · bar jacket polish',
        accent: '#1e3a5f',
        city: 'paris',
        showId: 'dior-paris',
        storeId: 'set-dior',
        image: 'chibidoll3.png',
        swatches: ['#1e3a5f', '#f5f0e6', '#9f1239', '#44403c'],
        pieces: [
            { id: 'street', name: 'Nameless Street', slot: 'base', color: '#6b7280' },
            { id: 'midi', name: 'Midi Skirt', slot: 'bottoms', color: '#44403c' },
            { id: 'bodice', name: 'Structured Bodice', slot: 'top', color: '#f5f0e6' },
            { id: 'pump', name: 'Pointed Pump', slot: 'shoes', color: '#9f1239' },
            { id: 'jacket', name: 'Bar Jacket', slot: 'outer', color: '#9f1239' },
            { id: 'tote', name: 'Book Tote', slot: 'finale', color: '#1e3a5f', rare: true }
        ]
    }
];

window.getDesignerSet = function getDesignerSet(id) {
    return (window.DESIGNER_SETS || []).find((s) => s.id === id) || null;
};

window.getDesignerSetByShow = function getDesignerSetByShow(showId) {
    return (window.DESIGNER_SETS || []).find((s) => s.showId === showId) || null;
};
