document.addEventListener('DOMContentLoaded', () => {
    const selectedCharacter = localStorage.getItem('selectedCharacter');
    const characterDisplay = document.getElementById('selectedCharacter');
    const outfitOptions = document.querySelector('.outfit-options');
    const designerOptions = document.querySelector('.designer-options');
    const confirmOutfitBtn = document.getElementById('confirmOutfitBtn');
    const tabBtns = document.querySelectorAll('.tab-btn');
    let selectedOutfit = null;

    characterDisplay.src = selectedCharacter === 'male' ? 'chibibrodoll.png' : 'chibidoll2.png';

    const outfits = selectedCharacter === 'male' ? 
        [
            { name: 'Casual Cool', image: 'chibibrodoll2.png', designer: 'StreetWear Co.' },
            { name: 'Formal Flair', image: 'male-outfit2.png', designer: 'Luxe Designs' },
            { name: 'Sporty Chic', image: 'male-outfit3.png', designer: 'AthleticWear' },
            { name: 'Punk Rock', image: 'male-outfit4.png', designer: 'Rebel Styles' },
            { name: 'Beachwear', image: 'male-outfit5.png', designer: 'Coastal Couture' }
        ] : 
        [
            { name: 'Boho Chic', image: 'chibidollfashion.png', designer: 'FreeSoul Fashion' },
            { name: 'Elegant Evening', image: 'chibidoll3.png', designer: 'Glamour Gowns' },
            { name: 'Casual Cute', image: 'female-outfit3.png', designer: 'Comfy Couture' },
            { name: 'Business Boss', image: 'female-outfit4.png', designer: 'Power Suits' },
            { name: 'Retro Vibes', image: 'female-outfit5.png', designer: 'Vintage Vogue' }
        ];

    const designers = [
        { name: 'Chanel', image: 'chanel-logo.png' },
        { name: 'Gucci', image: 'gucci-logo.png' },
        { name: 'Prada', image: 'prada-logo.png' },
        { name: 'Versace', image: 'versace-logo.png' },
        { name: 'Dior', image: 'dior-logo.png' }
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

    function loadMoreOutfits() {
        outfits.forEach(outfit => {
            outfitOptions.appendChild(createOutfitElement(outfit));
        });
    }

    function loadMoreDesigners() {
        designers.forEach(designer => {
            designerOptions.appendChild(createDesignerElement(designer));
        });
    }

    loadMoreOutfits();
    loadMoreDesigners();

    function selectOutfit(element, outfit) {
        document.querySelectorAll('.outfit-option').forEach(opt => opt.classList.remove('selected'));
        element.classList.add('selected');
        selectedOutfit = outfit;
    }

    confirmOutfitBtn.addEventListener('click', () => {
        if (selectedOutfit) {
            localStorage.setItem('selectedOutfit', JSON.stringify(selectedOutfit));
            window.location.href = 'index.html';
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

    // Infinite scroll
    const outfitsTab = document.getElementById('outfits');
    const designersTab = document.getElementById('designers');

    outfitsTab.addEventListener('scroll', () => {
        if (outfitsTab.scrollTop + outfitsTab.clientHeight >= outfitsTab.scrollHeight - 20) {
            loadMoreOutfits();
        }
    });

    designersTab.addEventListener('scroll', () => {
        if (designersTab.scrollTop + designersTab.clientHeight >= designersTab.scrollHeight - 20) {
            loadMoreDesigners();
        }
    });
});
