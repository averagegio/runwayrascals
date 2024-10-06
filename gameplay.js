document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.querySelector('.game-container');
    const character = document.querySelector('.game-character');
    const scoreDisplay = document.querySelector('.score-display');
    const levelDisplay = document.querySelector('.level-indicator');
    const navBtns = {
        leftBtn: document.getElementById('leftBtn'),
        rightBtn: document.getElementById('rightBtn'),
        upBtn: document.getElementById('upBtn')
    };

    // Load character image
    const selectedOutfit = JSON.parse(localStorage.getItem('selectedOutfit'));
    character.style.backgroundImage = `url('${selectedOutfit ? selectedOutfit.image : 'chibibrodoll.png'}')`;

    // Create dollar sign goal
    const dollarSign = document.createElement('div');
    dollarSign.classList.add('dollar-sign');
    dollarSign.style.backgroundImage = "url('gold-dollar-115264177387osogvgmtv.png')";
    dollarSign.style.position = 'absolute';
    dollarSign.style.top = '10%';
    dollarSign.style.left = '50%';
    dollarSign.style.transform = 'translateX(-50%)';
    dollarSign.style.width = '50px';
    dollarSign.style.height = '50px';
    dollarSign.style.backgroundSize = 'contain';
    dollarSign.style.backgroundRepeat = 'no-repeat';
    gameContainer.appendChild(dollarSign);

    let score = 0;
    let level = 1;
    let characterPosition = { x: 50, y: 20 }; // percentage
    let isGameOver = false;
    let gameSpeed = 0.5;
    let jetObstacle = null;
    let ufoObstacle = null;
    let isJumping = false;
    let jumpCount = 0;
    let isHoldingUp = false;
    let jumpInterval;

    function createJetObstacle() {
        if (jetObstacle) return;

        const obstacleElement = document.createElement('div');
        obstacleElement.classList.add('game-obstacle', 'horizontal-obstacle');
        obstacleElement.style.left = '-10%';
        obstacleElement.style.bottom = `${Math.random() * 60 + 20}%`;
        gameContainer.appendChild(obstacleElement);
        
        jetObstacle = {
            element: obstacleElement,
            x: -10,
        };
    }

    function createUfoObstacle() {
        if (ufoObstacle) return;

        const obstacleElement = document.createElement('div');
        obstacleElement.classList.add('game-obstacle', 'vertical-obstacle');
        obstacleElement.style.right = '10%';
        obstacleElement.style.bottom = '0%';
        gameContainer.appendChild(obstacleElement);
        
        ufoObstacle = {
            element: obstacleElement,
            y: 0,
            direction: 1
        };
    }

    function moveCharacter(direction) {
        const step = 5;
        if (direction === 'left' && characterPosition.x > 0) {
            characterPosition.x -= step;
        } else if (direction === 'right' && characterPosition.x < 100) {
            characterPosition.x += step;
        }
        updateCharacterPosition();
    }

    function jump() {
        if (jumpCount < 2) {
            jumpCount++;
            isJumping = true;
            clearInterval(jumpInterval);
            let jumpHeight = 0;
            jumpInterval = setInterval(() => {
                if (jumpHeight < 40 && isHoldingUp) {
                    jumpHeight += 2;
                    characterPosition.y += 2;
                    updateCharacterPosition();
                } else {
                    clearInterval(jumpInterval);
                    if (!isHoldingUp) {
                        fall();
                    }
                }
            }, 20);
        }
    }

    function fall() {
        isJumping = false;
        clearInterval(jumpInterval);
        jumpInterval = setInterval(() => {
            if (characterPosition.y > 20) {
                characterPosition.y -= 2;
                updateCharacterPosition();
            } else {
                clearInterval(jumpInterval);
                jumpCount = 0;
            }
        }, 20);
    }

    function startHoldJump() {
        isHoldingUp = true;
        if (!isJumping) {
            jump();
        }
    }

    function endHoldJump() {
        isHoldingUp = false;
        if (isJumping) {
            fall();
        }
    }

    function updateCharacterPosition() {
        character.style.left = `${characterPosition.x}%`;
        character.style.bottom = `${characterPosition.y}%`;
        checkWinCondition();
    }

    function checkWinCondition() {
        const characterRect = character.getBoundingClientRect();
        const dollarSignRect = dollarSign.getBoundingClientRect();
        if (
            characterRect.left < dollarSignRect.right &&
            characterRect.right > dollarSignRect.left &&
            characterRect.top < dollarSignRect.bottom &&
            characterRect.bottom > dollarSignRect.top
        ) {
            winLevel();
        }
    }

    function winLevel() {
        level++;
        alert(`Congratulations! You've completed level ${level - 1}!`);
        resetLevel();
    }

    function resetLevel() {
        characterPosition = { x: 50, y: 20 }; // Reset character to bottom
        jumpCount = 0;
        isJumping = false;
        isHoldingUp = false;
        clearInterval(jumpInterval);
        gameSpeed += 0.1; // Increase difficulty
        if (jetObstacle) {
            gameContainer.removeChild(jetObstacle.element);
            jetObstacle = null;
        }
        if (ufoObstacle) {
            gameContainer.removeChild(ufoObstacle.element);
            ufoObstacle = null;
        }
        updateCharacterPosition();
        levelDisplay.textContent = `Level ${level}`;
    }

    function moveObstacles() {
        if (jetObstacle) {
            jetObstacle.x += gameSpeed;
            jetObstacle.element.style.left = `${jetObstacle.x}%`;

            if (jetObstacle.x > 110) {
                gameContainer.removeChild(jetObstacle.element);
                jetObstacle = null;
            }
        }

        if (ufoObstacle) {
            ufoObstacle.y += gameSpeed * ufoObstacle.direction;
            ufoObstacle.element.style.bottom = `${ufoObstacle.y}%`;

            if (ufoObstacle.y <= 0 || ufoObstacle.y >= 80) {
                ufoObstacle.direction *= -1;
            }
        }

        if (!jetObstacle && Math.random() < 0.02) {
            createJetObstacle();
        }

        if (!ufoObstacle && Math.random() < 0.01) {
            createUfoObstacle();
        }
    }

    function checkCollisions() {
        const characterRect = character.getBoundingClientRect();
        
        if (jetObstacle) {
            const jetObstacleRect = jetObstacle.element.getBoundingClientRect();
            if (
                characterRect.left < jetObstacleRect.right &&
                characterRect.right > jetObstacleRect.left &&
                characterRect.top < jetObstacleRect.bottom &&
                characterRect.bottom > jetObstacleRect.top
            ) {
                gameOver();
            }
        }

        if (ufoObstacle) {
            const ufoObstacleRect = ufoObstacle.element.getBoundingClientRect();
            if (
                characterRect.left < ufoObstacleRect.right &&
                characterRect.right > ufoObstacleRect.left &&
                characterRect.top < ufoObstacleRect.bottom &&
                characterRect.bottom > ufoObstacleRect.top
            ) {
                gameOver();
            }
        }
    }

    function gameOver() {
        isGameOver = true;
        document.getElementById('finalScore').textContent = score;
        retryPopup.style.display = 'flex';
    }

    function resetGame() {
        score = 0;
        level = 1;
        characterPosition = { x: 50, y: 20 };
        isGameOver = false;
        gameSpeed = 0.5;
        jumpCount = 0;
        if (jetObstacle) {
            gameContainer.removeChild(jetObstacle.element);
            jetObstacle = null;
        }
        if (ufoObstacle) {
            gameContainer.removeChild(ufoObstacle.element);
            ufoObstacle = null;
        }
        updateCharacterPosition();
        scoreDisplay.textContent = `Score: ${score}`;
        levelDisplay.textContent = `Level ${level}`;
        retryPopup.style.display = 'none';
    }

    function updateScore() {
        if (!isGameOver) {
            score++;
            scoreDisplay.textContent = `Score: ${score}`;
        }
    }

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') moveCharacter('left');
        if (e.key === 'ArrowRight') moveCharacter('right');
        if (e.key === 'ArrowUp' && !isHoldingUp) startHoldJump();
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowUp') endHoldJump();
    });

    // Touch and mouse controls
    navBtns.leftBtn.addEventListener('mousedown', () => moveCharacter('left'));
    navBtns.rightBtn.addEventListener('mousedown', () => moveCharacter('right'));
    navBtns.upBtn.addEventListener('mousedown', startHoldJump);
    navBtns.upBtn.addEventListener('mouseup', endHoldJump);

    navBtns.leftBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        moveCharacter('left');
    });
    navBtns.rightBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        moveCharacter('right');
    });
    navBtns.upBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startHoldJump();
    });
    navBtns.upBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        endHoldJump();
    });

    // Create retry popup
    const retryPopup = document.createElement('div');
    retryPopup.classList.add('retry-popup');
    retryPopup.innerHTML = `
        <h2>Game Over!</h2>
        <p>Your score: <span id="finalScore"></span></p>
        <button id="retryBtn">Retry</button>
    `;
    gameContainer.appendChild(retryPopup);

    // Create restart button
    const restartBtn = document.createElement('button');
    restartBtn.classList.add('restart-btn');
    restartBtn.textContent = 'Restart';
    gameContainer.appendChild(restartBtn);

    // Event listeners for retry and restart buttons
    document.getElementById('retryBtn').addEventListener('click', resetGame);
    restartBtn.addEventListener('click', resetGame);

    // Game loop
    function gameLoop() {
        if (!isGameOver) {
            moveObstacles();
            checkCollisions();
            updateScore();
            checkWinCondition(); // Check if character has reached the dollar sign
        }
        requestAnimationFrame(gameLoop);
    }

    gameLoop();
});
