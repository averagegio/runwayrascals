const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game variables
let player = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    width: 50,
    height: 80,
    speed: 5
};

let dollars = [];
let rats = [];
let score = 0;

// Load images
const malePlayerImg = new Image();
malePlayerImg.src = 'male-character.png';

const femalePlayerImg = new Image();
femalePlayerImg.src = 'female-character.png';

const dollarImg = new Image();
dollarImg.src = 'dollar.png';

const ratImg = new Image();
ratImg.src = 'rat.png';

// Get selected character
const selectedCharacter = localStorage.getItem('selectedCharacter') || 'male';
const playerImg = selectedCharacter === 'male' ? malePlayerImg : femalePlayerImg;

// Game loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawRainbowRoad();
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);

    if (keys.ArrowLeft && player.x > 0) player.x -= player.speed;
    if (keys.ArrowRight && player.x < canvas.width - player.width) player.x += player.speed;

    updateDollars();
    updateRats();

    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: $${score}`, 10, 30);

    requestAnimationFrame(gameLoop);
}

// ... (keep other functions like drawRainbowRoad, updateDollars, updateRats, collision, resetGame) ...

// Keyboard input
let keys = {};
document.addEventListener('keydown', (e) => keys[e.code] = true);
document.addEventListener('keyup', (e) => keys[e.code] = false);

// Start the game
gameLoop();
