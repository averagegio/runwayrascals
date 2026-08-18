document.addEventListener('DOMContentLoaded', () => {
    const selectedCharacter = localStorage.getItem('selectedCharacter') || 'female';
    const characterDisplay = document.getElementById('selectedCharacter');
    const outfitOptions = document.querySelector('.outfit-options');
    const designerOptions = document.querySelector('.designer-options');
    const confirmOutfitBtn = document.getElementById('confirmOutfitBtn');
    const tabBtns = document.querySelectorAll('.tab-btn');
    let selectedOutfit = null;

    const characterImages = {
        male: 'chibibrodoll.png',
        female: 'chibidoll2.png',
        fashion: 'chibidollfashion.png',
        evening: 'chibidoll3.png'
    };

    characterDisplay.src = characterImages[selectedCharacter] || 'chibidoll2.png';

    const outfitsByCharacter = {
        male: [
            { name: 'Devil Boy Classic', image: 'chibibrodoll.png', designer: 'Runway Rascals' },
            { name: 'Casual Cool', image: 'chibibrodoll2.png', designer: 'StreetWear Co.' }
        ],
        female: [
            { name: 'Mouse Girl Classic', image: 'chibidoll2.png', designer: 'Runway Rascals' },
            { name: 'Boho Chic', image: 'chibidollfashion.png', designer: 'FreeSoul Fashion' },
            { name: 'Elegant Evening', image: 'chibidoll3.png', designer: 'Glamour Gowns' }
        ],
        fashion: [
            { name: 'Runway Ready', image: 'chibidollfashion.png', designer: 'FreeSoul Fashion' },
            { name: 'Evening Switch', image: 'chibidoll3.png', designer: 'Glamour Gowns' }
        ],
        evening: [
            { name: 'Gala Glow', image: 'chibidoll3.png', designer: 'Glamour Gowns' },
            { name: 'Boho Remix', image: 'chibidollfashion.png', designer: 'FreeSoul Fashion' }
        ]
    };

    const outfits = outfitsByCharacter[selectedCharacter] || outfitsByCharacter.female;

    const designers = [
        { name: 'NYFW Atelier', image: 'chibidollfashion.png' },
        { name: 'Milan House', image: 'chibidoll3.png' },
        { name: 'London Label', image: 'chibibrodoll2.png' },
        { name: 'Berlin Collective', image: 'chibibrodoll.png' },
        { name: 'Miami Swim', image: 'chibidoll2.png' }
    ];

    function createOutfitElement(outfit) {
        const outfitElement = document.createElement('div');
        outfitElement.classList.add('outfit-option');
        outfitElement.innerHTML = `
            <img src="${outfit.image}" alt="${outfit.name}">
            <div class="outfit-info">
                <h3>${outfit.name}</h3>
                <p>Designer: ${outfit.designer}</p>
            </div>
        `;
        outfitElement.addEventListener('click', () => selectOutfit(outfitElement, outfit));
        return outfitElement;
    }

    function createDesignerElement(designer) {
        const designerElement = document.createElement('div');
        designerElement.classList.add('designer-option');
        designerElement.innerHTML = `
            <img src="${designer.image}" alt="${designer.name}">
            <p>${designer.name}</p>
        `;
        return designerElement;
    }

    outfits.forEach(outfit => outfitOptions.appendChild(createOutfitElement(outfit)));
    designers.forEach(designer => designerOptions.appendChild(createDesignerElement(designer)));

    function selectOutfit(element, outfit) {
        document.querySelectorAll('.outfit-option').forEach(opt => opt.classList.remove('selected'));
        element.classList.add('selected');
        selectedOutfit = outfit;
        characterDisplay.src = outfit.image;
    }

    confirmOutfitBtn.addEventListener('click', () => {
        if (selectedOutfit) {
            localStorage.setItem('selectedOutfit', JSON.stringify(selectedOutfit));
            window.location.href = 'map-select.html';
        } else {
            alert('Please select an outfit before confirming.');
        }
    });

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById(tabName).classList.add('active');
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
});
