/**
 * Wardrobe / boutique looks — logo pieces (open) + member-locked pieces.
 * Monogram marks are stylized game originals inspired by house aesthetics.
 */
window.LOGO_MARKS = {
    balenciaga: { id: 'balenciaga', label: 'B', monogram: 'bars', color: '#ffffff', bg: '#1e40af' },
    rick: { id: 'rick', label: 'RO', monogram: 'block', color: '#f5f0e6', bg: '#111111' },
    casablanca: { id: 'casablanca', label: 'CC', monogram: 'crest', color: '#1e3a5f', bg: '#f5f0e6' },
    ralph: { id: 'ralph', label: 'RL', monogram: 'crest', color: '#eab308', bg: '#16a34a' },
    dior: { id: 'dior', label: 'CD', monogram: 'oblique', color: '#f5f0e6', bg: '#1e3a5f' }
};

/** Free-to-try logo clothing + member-locked pieces for wardrobe */
window.WARDROBE_ITEMS = [
    {
        id: 'logo-blue-tee',
        designer: 'Balenciaga',
        name: 'Logo Blue Tee',
        tagline: 'Royal blue tee · white back bars',
        accent: '#1e40af',
        logo: 'balenciaga',
        membersOnly: false,
        storeId: 'balenciaga-logo-tee',
        city: 'berlin',
        showId: 'balenciaga',
        image: 'chibidollfashion.png',
        swatches: ['#1e40af', '#ffffff', '#3b82f6'],
        pieces: [
            { id: 'street', name: 'Nameless Street', slot: 'base', color: '#6b7280' },
            { id: 'baggy', name: 'Baggy Denim', slot: 'bottoms', color: '#3f3f46' },
            { id: 'logo-tee', name: 'Logo Blue Tee', slot: 'top', color: '#1e40af', logo: 'balenciaga' },
            { id: 'street-shoe', name: 'Court Shoe', slot: 'shoes', color: '#525252' }
        ]
    },
    {
        id: 'crest-polo',
        designer: 'Ralph Lauren',
        name: 'Crest Polo',
        tagline: 'Kelly green polo · crest mark',
        accent: '#16a34a',
        logo: 'ralph',
        membersOnly: false,
        storeId: 'ralph-crest-polo',
        city: 'newyork',
        showId: 'ralph-lauren',
        image: 'chibidoll2.png',
        swatches: ['#16a34a', '#1e3a5f', '#eab308'],
        pieces: [
            { id: 'street', name: 'Nameless Street', slot: 'base', color: '#6b7280' },
            { id: 'chinos', name: 'Tailored Chinos', slot: 'bottoms', color: '#92400e' },
            { id: 'polo', name: 'Crest Polo', slot: 'top', color: '#16a34a', logo: 'ralph' },
            { id: 'loafers', name: 'Calf Loafers', slot: 'shoes', color: '#78350f' }
        ]
    },
    {
        id: 'drkshdw-tee',
        designer: 'Rick Owens',
        name: 'DRKSHDW Tee',
        tagline: 'Black tee · RO mark',
        accent: '#e5e5e5',
        logo: 'rick',
        membersOnly: false,
        storeId: 'rick-drkshdw-tee',
        city: 'newyork',
        showId: 'rick-owens',
        image: 'chibibrodoll.png',
        swatches: ['#262626', '#111111', '#f5f0e6'],
        pieces: [
            { id: 'street', name: 'Nameless Street', slot: 'base', color: '#6b7280' },
            { id: 'pants', name: 'Slim Black Pant', slot: 'bottoms', color: '#1f1f1f' },
            { id: 'tee', name: 'DRKSHDW Tee', slot: 'top', color: '#262626', logo: 'rick' },
            { id: 'street-shoe', name: 'Black Trainer', slot: 'shoes', color: '#111111' }
        ]
    },
    {
        id: 'triple-s-locked',
        designer: 'Balenciaga',
        name: 'Triple-S',
        tagline: 'Chunky stack sneaker · members',
        accent: '#ef4444',
        logo: 'balenciaga',
        membersOnly: true,
        storeId: 'balenciaga-triple',
        city: 'berlin',
        showId: 'balenciaga',
        image: 'chibidollfashion.png',
        swatches: ['#ef4444', '#3b82f6', '#f5f5f4'],
        pieces: [
            { id: 'street', name: 'Nameless Street', slot: 'base', color: '#6b7280' },
            { id: 'baggy', name: 'Baggy Denim', slot: 'bottoms', color: '#3f3f46' },
            { id: 'logo-tee', name: 'Logo Blue Tee', slot: 'top', color: '#1e40af', logo: 'balenciaga' },
            { id: 'triple-s', name: 'Triple-S', slot: 'shoes', color: '#ef4444', logo: 'balenciaga', rare: true }
        ]
    },
    {
        id: 'ramones-locked',
        designer: 'Rick Owens',
        name: 'Ramones',
        tagline: 'Black high-top · cream sole · members',
        accent: '#111111',
        logo: 'rick',
        membersOnly: true,
        storeId: 'rick-ramones',
        city: 'newyork',
        showId: 'rick-owens',
        image: 'chibibrodoll.png',
        swatches: ['#111111', '#f5f0e6', '#0a0a0a'],
        pieces: [
            { id: 'street', name: 'Nameless Street', slot: 'base', color: '#6b7280' },
            { id: 'pants', name: 'Drop-Crotch Pants', slot: 'bottoms', color: '#0a0a0a' },
            { id: 'tee', name: 'DRKSHDW Tee', slot: 'top', color: '#262626', logo: 'rick' },
            { id: 'ramones', name: 'Ramones', slot: 'shoes', color: '#111111', logo: 'rick', rare: true }
        ]
    },
    {
        id: 'silk-locked',
        designer: 'Casablanca',
        name: 'Silk Club Shirt',
        tagline: 'Cream silk · CC crest · members',
        accent: '#0f3d2e',
        logo: 'casablanca',
        membersOnly: true,
        storeId: 'casablanca-silk',
        city: 'miami',
        showId: 'casablanca',
        image: 'chibidollfashion.png',
        swatches: ['#f5f0e6', '#1e3a5f', '#059669'],
        pieces: [
            { id: 'street', name: 'Nameless Street', slot: 'base', color: '#6b7280' },
            { id: 'trouser', name: 'Silk Trouser', slot: 'bottoms', color: '#14532d' },
            { id: 'shirt', name: 'Silk Club Shirt', slot: 'top', color: '#f5f0e6', logo: 'casablanca', rare: true },
            { id: 'sneaker', name: 'Court Sneaker', slot: 'shoes', color: '#fef3c7' }
        ]
    },
    {
        id: 'tote-locked',
        designer: 'Dior',
        name: 'Book Tote',
        tagline: 'Navy oblique tote · members',
        accent: '#1e3a5f',
        logo: 'dior',
        membersOnly: true,
        storeId: 'dior-book-tote',
        city: 'paris',
        showId: 'dior-paris',
        image: 'chibidoll3.png',
        swatches: ['#1e3a5f', '#f5f0e6', '#9f1239'],
        pieces: [
            { id: 'street', name: 'Nameless Street', slot: 'base', color: '#6b7280' },
            { id: 'midi', name: 'Midi Skirt', slot: 'bottoms', color: '#44403c' },
            { id: 'bodice', name: 'Structured Bodice', slot: 'top', color: '#f5f0e6' },
            { id: 'pump', name: 'Pointed Pump', slot: 'shoes', color: '#9f1239' },
            { id: 'tote', name: 'Book Tote', slot: 'finale', color: '#1e3a5f', logo: 'dior', rare: true }
        ]
    }
];

/** Full designer sets (shop packs) — kept for boutique / shows sync */
window.DESIGNER_SETS = [
    {
        id: 'balenciaga-concrete',
        designer: 'Balenciaga',
        name: 'Concrete Logo Set',
        tagline: 'Royal blue logo tee · Triple-S stack',
        accent: '#1d4ed8',
        logo: 'balenciaga',
        membersOnly: true,
        city: 'berlin',
        showId: 'balenciaga',
        storeId: 'set-balenciaga',
        image: 'chibidollfashion.png',
        swatches: ['#1e40af', '#ffffff', '#ef4444', '#3b82f6', '#f5f5f4'],
        pieces: [
            { id: 'street', name: 'Nameless Street', slot: 'base', color: '#6b7280' },
            { id: 'baggy', name: 'Baggy Denim', slot: 'bottoms', color: '#3f3f46' },
            { id: 'logo-tee', name: 'Logo Blue Tee', slot: 'top', color: '#1e40af', logo: 'balenciaga' },
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
        logo: 'rick',
        membersOnly: true,
        city: 'newyork',
        showId: 'rick-owens',
        storeId: 'set-rick',
        image: 'chibibrodoll.png',
        swatches: ['#0a0a0a', '#1f1f1f', '#f5f0e6', '#374151'],
        pieces: [
            { id: 'street', name: 'Nameless Street', slot: 'base', color: '#6b7280' },
            { id: 'pants', name: 'Drop-Crotch Pants', slot: 'bottoms', color: '#0a0a0a' },
            { id: 'tee', name: 'DRKSHDW Tee', slot: 'top', color: '#262626', logo: 'rick' },
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
        logo: 'casablanca',
        membersOnly: true,
        city: 'miami',
        showId: 'casablanca',
        storeId: 'set-casablanca',
        image: 'chibidollfashion.png',
        swatches: ['#f5f0e6', '#1e3a5f', '#059669', '#f472b6'],
        pieces: [
            { id: 'street', name: 'Nameless Street', slot: 'base', color: '#6b7280' },
            { id: 'trouser', name: 'Silk Trouser', slot: 'bottoms', color: '#14532d' },
            { id: 'shirt', name: 'Silk Club Shirt', slot: 'top', color: '#f5f0e6', logo: 'casablanca', rare: true },
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
        logo: 'ralph',
        membersOnly: true,
        city: 'newyork',
        showId: 'ralph-lauren',
        storeId: 'set-ralph',
        image: 'chibidoll2.png',
        swatches: ['#16a34a', '#1e3a5f', '#eab308', '#f8fafc'],
        pieces: [
            { id: 'street', name: 'Nameless Street', slot: 'base', color: '#6b7280' },
            { id: 'chinos', name: 'Tailored Chinos', slot: 'bottoms', color: '#92400e' },
            { id: 'polo', name: 'Crest Polo', slot: 'top', color: '#16a34a', logo: 'ralph', rare: true },
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
        logo: 'dior',
        membersOnly: true,
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
            { id: 'tote', name: 'Book Tote', slot: 'finale', color: '#1e3a5f', logo: 'dior', rare: true }
        ]
    }
];

window.getLogoMark = function getLogoMark(key) {
    return (window.LOGO_MARKS || {})[key] || null;
};

window.getDesignerSet = function getDesignerSet(id) {
    return (window.DESIGNER_SETS || []).find((s) => s.id === id) || null;
};

window.getDesignerSetByShow = function getDesignerSetByShow(showId) {
    return (window.DESIGNER_SETS || []).find((s) => s.showId === showId) || null;
};

window.getWardrobeItem = function getWardrobeItem(id) {
    return (window.WARDROBE_ITEMS || []).find((s) => s.id === id) || null;
};

/** Draw a stylized monogram into a 2D canvas context (centered). */
window.drawLogoMark = function drawLogoMark(ctx, markKey, size) {
    const mark = window.getLogoMark(markKey);
    if (!mark) return;
    const s = size || 24;
    ctx.save();
    ctx.fillStyle = mark.bg;
    if (mark.monogram === 'crest') {
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.48, 0, Math.PI * 2);
        ctx.fill();
    } else {
        const r = s * 0.12;
        const x = -s * 0.42;
        const y = -s * 0.42;
        const w = s * 0.84;
        const h = s * 0.84;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
        ctx.fill();
    }
    ctx.fillStyle = mark.color;
    if (mark.monogram === 'bars') {
        ctx.save();
        ctx.rotate(-0.35);
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(-s * 0.28, -s * 0.22 + i * s * 0.16, s * 0.56, s * 0.1);
        }
        ctx.restore();
    } else if (mark.monogram === 'oblique') {
        ctx.font = `700 ${Math.max(8, s * 0.42)}px Syne, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(mark.label, 0, 1);
        ctx.strokeStyle = mark.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-s * 0.28, s * 0.22);
        ctx.lineTo(s * 0.28, -s * 0.22);
        ctx.stroke();
    } else {
        ctx.font = `700 ${Math.max(8, s * 0.38)}px Syne, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(mark.label, 0, 1);
    }
    ctx.restore();
};
