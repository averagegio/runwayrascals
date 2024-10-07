document.addEventListener('DOMContentLoaded', () => {
    let gameCanvas, ctx, character, obstacles, gameLoop, score, gameOver;
    let upArrow, leftArrow, rightArrow;
    let characterImage, jetImage, saucerImage;

    function initGame() {
        gameCanvas = document.getElementById('gameCanvas');
        ctx = gameCanvas.getContext('2d');

        gameCanvas.width = gameCanvas.offsetWidth;
        gameCanvas.height = gameCanvas.offsetHeight;

        loadImages().then(() => {
            const characterSize = Math.min(gameCanvas.width, gameCanvas.height) * 0.11;
            character = new Character(gameCanvas.width / 2 - characterSize / 2, gameCanvas.height - characterSize, characterSize, characterSize);
            obstacles = [];
            score = 0;
            gameOver = false;

            setupControls();

            document.addEventListener('keydown', handleKeyPress);
            document.addEventListener('keyup', handleKeyRelease);

            gameLoop = setInterval(updateGame, 20);
        });
    }

    function loadImages() {
        return new Promise((resolve) => {
            characterImage = new Image();
            characterImage.src = JSON.parse(localStorage.getItem('selectedOutfit')).image;

            jetImage = new Image();
            jetImage.src = 'jet1.png';

            saucerImage = new Image();
            saucerImage.src = 'spaceship-flying-saucer.png';

            Promise.all([
                new Promise(r => characterImage.onload = r),
                new Promise(r => jetImage.onload = r),
                new Promise(r => saucerImage.onload = r)
            ]).then(resolve);
        });
    }

    function setupControls() {
        upArrow = document.getElementById('upArrow');
        leftArrow = document.getElementById('leftArrow');
        rightArrow = document.getElementById('rightArrow');

        [upArrow, leftArrow, rightArrow].forEach(arrow => {
            arrow.addEventListener('touchstart', handleArrowTouch);
            arrow.addEventListener('touchend', handleArrowTouchEnd);
            arrow.addEventListener('mousedown', handleArrowTouch);
            arrow.addEventListener('mouseup', handleArrowTouchEnd);
        });
    }

    function handleArrowTouch(e) {
        e.preventDefault();
        moveCharacter(e.target.id);
        e.target.classList.add('active');
    }

    function handleArrowTouchEnd(e) {
        e.preventDefault();
        stopCharacter(e.target.id);
        e.target.classList.remove('active');
    }

    function moveCharacter(arrowId) {
        if (!character || gameOver) return;

        switch (arrowId) {
            case 'upArrow':
                character.jump();
                break;
            case 'leftArrow':
                character.startMovingLeft();
                break;
            case 'rightArrow':
                character.startMovingRight();
                break;
        }
    }

    function stopCharacter(arrowId) {
        if (!character || gameOver) return;

        switch (arrowId) {
            case 'leftArrow':
            case 'rightArrow':
                character.stopMoving();
                break;
        }
    }

    function updateGame() {
        if (!ctx || gameOver) return;

        ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

        // Update and draw character
        character.update();
        character.draw(ctx);

        // Update and draw obstacles
        updateObstacles();

        // Spawn new obstacles
        if (Math.random() < 0.02 && obstacles.length < 5) {
            if (Math.random() < 0.5) {
                obstacles.push(new JetObstacle(-50, Math.random() * (gameCanvas.height - 100), 50, 30));
            } else {
                obstacles.push(new SaucerObstacle(Math.random() * (gameCanvas.width - 30), -30, 30, 30));
            }
        }

        // Draw score
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText('Score: ' + score, gameCanvas.width - 10, 10);
    }

    function updateObstacles() {
        for (let i = obstacles.length - 1; i >= 0; i--) {
            obstacles[i].update();
            obstacles[i].draw(ctx);

            if (obstacles[i].collidesWith(character)) {
                gameOver = true;
                clearInterval(gameLoop);
                showGameOver();
            }

            if (obstacles[i].isOffScreen()) {
                obstacles.splice(i, 1);
                score++;
            }
        }
    }

    function showGameOver() {
        const gameOverScreen = document.createElement('div');
        gameOverScreen.classList.add('game-over-screen');
        gameOverScreen.innerHTML = `
            <h2>Game Over</h2>
            <p>Your score: ${score}</p>
            <button id="restartBtn" class="game-btn">Restart</button>
        `;
        document.querySelector('.app-container').appendChild(gameOverScreen);
        document.getElementById('restartBtn').addEventListener('click', restartGame);
    }

    function restartGame() {
        const gameOverScreen = document.querySelector('.game-over-screen');
        if (gameOverScreen) {
            gameOverScreen.remove();
        }
        clearInterval(gameLoop);
        initGame();
    }

    class Character {
        constructor(x, y, width, height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.velocityY = 0;
            this.velocityX = 0;
            this.jumping = false;
            this.gravity = 0.8;
            this.jumpStrength = -15;
            this.moveSpeed = 5;
        }

        update() {
            this.x += this.velocityX;
            if (this.x < 0) this.x = 0;
            if (this.x + this.width > gameCanvas.width) this.x = gameCanvas.width - this.width;

            if (this.jumping) {
                this.velocityY += this.gravity;
                this.y += this.velocityY;

                if (this.y > gameCanvas.height - this.height) {
                    this.y = gameCanvas.height - this.height;
                    this.jumping = false;
                    this.velocityY = 0;
                }
            }
        }

        draw(ctx) {
            if (characterImage.complete) {
                ctx.drawImage(characterImage, this.x, this.y, this.width, this.height);
            }
        }

        jump() {
            if (!this.jumping) {
                this.jumping = true;
                this.velocityY = this.jumpStrength;
            }
        }

        startMovingLeft() {
            this.velocityX = -this.moveSpeed;
        }

        startMovingRight() {
            this.velocityX = this.moveSpeed;
        }

        stopMoving() {
            this.velocityX = 0;
        }
    }

    class JetObstacle {
        constructor(x, y, width, height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.speed = 3 + Math.random() * 2;
        }

        update() {
            this.x += this.speed;
        }

        draw(ctx) {
            if (jetImage.complete) {
                ctx.drawImage(jetImage, this.x, this.y, this.width, this.height);
            }
        }

        collidesWith(character) {
            return (
                this.x < character.x + character.width &&
                this.x + this.width > character.x &&
                this.y < character.y + character.height &&
                this.y + this.height > character.y
            );
        }

        isOffScreen() {
            return this.x > gameCanvas.width;
        }
    }

    class SaucerObstacle {
        constructor(x, y, width, height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.speed = 2 + Math.random() * 2;
        }

        update() {
            this.y += this.speed;
        }

        draw(ctx) {
            if (saucerImage.complete) {
                ctx.drawImage(saucerImage, this.x, this.y, this.width, this.height);
            }
        }

        collidesWith(character) {
            return (
                this.x < character.x + character.width &&
                this.x + this.width > character.x &&
                this.y < character.y + character.height &&
                this.y + this.height > character.y
            );
        }

        isOffScreen() {
            return this.y > gameCanvas.height;
        }
    }

    function handleKeyPress(e) {
        if (gameOver) return;

        switch (e.key) {
            case 'ArrowUp':
                character.jump();
                break;
            case 'ArrowLeft':
                character.startMovingLeft();
                break;
            case 'ArrowRight':
                character.startMovingRight();
                break;
        }
    }

    function handleKeyRelease(e) {
        if (gameOver) return;

        switch (e.key) {
            case 'ArrowLeft':
            case 'ArrowRight':
                character.stopMoving();
                break;
        }
    }

    initGame();
});
