// Game elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const levelElement = document.getElementById('level');
const livesElement = document.getElementById('lives');
const scoreElement = document.getElementById('score');

// Game state
let gameState = {
    level: 1,
    lives: 3,
    score: 0,
    highScore: localStorage.getItem('breakoutHighScore') || 0,
    gameOver: false,
    levelComplete: false
};

// Paddle properties
const paddle = {
    x: canvas.width / 2 - 50,
    y: canvas.height - 20,
    width: 100,
    height: 10,
    speed: 8,
    dx: 0
};

// Ball properties
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 8,
    speed: 5,
    dx: 3,
    dy: -3
};

// Brick properties
let bricks = [];
const brickConfig = {
    rowCount: 5,
    columnCount: 10,
    width: 70,
    height: 20,
    padding: 10,
    offsetTop: 50,
    offsetLeft: 35
};

// Power-ups
const powerUps = [];
const powerUpTypes = [
    { type: 'extraLife', color: '#00ff00', effect: 'Extra Life' },
    { type: 'widerPaddle', color: '#ff00ff', effect: 'Wider Paddle' },
    { type: 'fasterBall', color: '#ffff00', effect: 'Faster Ball' },
    { type: 'multiBall', color: '#00ffff', effect: 'Multi Ball' }
];

// Player upgrades (roguelike permanent upgrades)
let upgrades = {
    extraLives: 0,
    paddleWidth: 0,
    ballSpeed: 0
};

// Initialize game
function init() {
    createBricks();
    resetBall();
    draw();
}

// Create bricks with randomized properties
function createBricks() {
    bricks = [];
    for (let c = 0; c < brickConfig.columnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickConfig.rowCount; r++) {
            // Roguelike element: random brick toughness
            const toughness = Math.floor(Math.random() * 3) + 1;
            const colors = ['#ff0000', '#ff7700', '#ffff00'];
            
            bricks[c][r] = {
                x: c * (brickConfig.width + brickConfig.padding) + brickConfig.offsetLeft,
                y: r * (brickConfig.height + brickConfig.padding) + brickConfig.offsetTop,
                status: toughness,
                color: colors[toughness - 1]
            };
        }
    }
}

// Draw paddle
function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddle.x, paddle.y, paddle.width + upgrades.paddleWidth * 20, paddle.height);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.closePath();
}

// Draw ball
function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.closePath();
}

// Draw bricks
function drawBricks() {
    for (let c = 0; c < brickConfig.columnCount; c++) {
        for (let r = 0; r < brickConfig.rowCount; r++) {
            const brick = bricks[c][r];
            if (brick.status > 0) {
                ctx.beginPath();
                ctx.rect(brick.x, brick.y, brickConfig.width, brickConfig.height);
                ctx.fillStyle = brick.color;
                ctx.fill();
                ctx.closePath();
                
                // Draw brick toughness indicator
                ctx.fillStyle = '#000';
                ctx.font = '12px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText(brick.status, brick.x + brickConfig.width/2, brick.y + brickConfig.height/2 + 4);
            }
        }
    }
}

// Draw power-ups
function drawPowerUps() {
    powerUps.forEach(powerUp => {
        ctx.beginPath();
        ctx.rect(powerUp.x, powerUp.y, 15, 15);
        ctx.fillStyle = powerUp.color;
        ctx.fill();
        ctx.closePath();
    });
}

// Move paddle
function movePaddle() {
    paddle.x += paddle.dx;
    
    // Wall collision
    if (paddle.x < 0) {
        paddle.x = 0;
    }
    if (paddle.x + paddle.width + upgrades.paddleWidth * 20 > canvas.width) {
        paddle.x = canvas.width - (paddle.width + upgrades.paddleWidth * 20);
    }
}

// Move ball
function moveBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;
    
    // Wall collision (left/right)
    if (ball.x + ball.dx > canvas.width - ball.radius || ball.x + ball.dx < ball.radius) {
        ball.dx = -ball.dx;
    }
    
    // Wall collision (top)
    if (ball.y + ball.dy < ball.radius) {
        ball.dy = -ball.dy;
    }
    
    // Paddle collision
    if (
        ball.y + ball.dy > canvas.height - ball.radius - paddle.height &&
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.width + upgrades.paddleWidth * 20
    ) {
        // Change ball direction based on where it hits the paddle
        const hitPosition = (ball.x - paddle.x) / (paddle.width + upgrades.paddleWidth * 20);
        const angle = hitPosition * Math.PI - Math.PI / 2;
        ball.dx = Math.sin(angle) * (ball.speed + upgrades.ballSpeed);
        ball.dy = -Math.cos(angle) * (ball.speed + upgrades.ballSpeed);
    }
    
    // Bottom wall (lose life)
    if (ball.y + ball.dy > canvas.height - ball.radius) {
        if (gameState.lives > 1) {
            gameState.lives--;
            resetBall();
        } else {
            gameOver();
        }
    }
    
    // Brick collision
    bricks.forEach(column => {
        column.forEach(brick => {
            if (brick.status > 0) {
                if (
                    ball.x > brick.x &&
                    ball.x < brick.x + brickConfig.width &&
                    ball.y > brick.y &&
                    ball.y < brick.y + brickConfig.height
                ) {
                    ball.dy = -ball.dy;
                    brick.status--;
                    gameState.score += 10;
                    
                    // Roguelike element: chance to drop power-up when brick is destroyed
                    if (brick.status === 0 && Math.random() < 0.3) {
                        const powerUpType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
                        powerUps.push({
                            x: brick.x + brickConfig.width / 2 - 7.5,
                            y: brick.y,
                            type: powerUpType.type,
                            color: powerUpType.color,
                            effect: powerUpType.effect
                        });
                    }
                }
            }
        });
    });
    
    // Move power-ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
        powerUps[i].y += 2;
        
        // Paddle catches power-up
        if (
            powerUps[i].y + 15 > paddle.y &&
            powerUps[i].y < paddle.y + paddle.height &&
            powerUps[i].x > paddle.x &&
            powerUps[i].x < paddle.x + paddle.width + upgrades.paddleWidth * 20
        ) {
            applyPowerUp(powerUps[i].type);
            powerUps.splice(i, 1);
        }
        
        // Remove power-ups that fall off screen
        if (powerUps[i].y > canvas.height) {
            powerUps.splice(i, 1);
        }
    }
    
    // Check if level is complete
    let levelComplete = true;
    bricks.forEach(column => {
        column.forEach(brick => {
            if (brick.status > 0) levelComplete = false;
        });
    });
    
    if (levelComplete) {
        nextLevel();
    }
}

// Apply power-up effects
function applyPowerUp(type) {
    switch (type) {
        case 'extraLife':
            gameState.lives++;
            break;
        case 'widerPaddle':
            upgrades.paddleWidth++;
            break;
        case 'fasterBall':
            upgrades.ballSpeed++;
            ball.speed += 1;
            break;
        case 'multiBall':
            // Create additional balls
            for (let i = 0; i < 2; i++) {
                // For simplicity, just add to score since multi-ball logic would be complex
                gameState.score += 50;
            }
            break;
    }
    gameState.score += 20;
}

// Reset ball position
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    
    // Random direction
    const angle = (Math.random() * Math.PI / 2) + Math.PI / 4;
    ball.dx = Math.sin(angle) * (ball.speed + upgrades.ballSpeed) * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = -Math.cos(angle) * (ball.speed + upgrades.ballSpeed);
}

// Advance to next level
function nextLevel() {
    gameState.level++;
    gameState.levelComplete = true;
    createBricks();
    resetBall();
}

// Game over
function gameOver() {
    gameState.gameOver = true;
    
    // Save high score
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('breakoutHighScore', gameState.highScore);
    }
}

// Draw game elements
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw game objects
    drawBricks();
    drawPaddle();
    drawBall();
    drawPowerUps();
    
    // Update stats
    levelElement.textContent = gameState.level;
    livesElement.textContent = gameState.lives;
    scoreElement.textContent = gameState.score;
    
    // Game over screen
    if (gameState.gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = '36px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);
        
        ctx.font = '24px Courier New';
        ctx.fillText(`Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2 + 10);
        ctx.fillText(`High Score: ${gameState.highScore}`, canvas.width / 2, canvas.height / 2 + 40);
        ctx.fillText('Press SPACE to restart', canvas.width / 2, canvas.height / 2 + 80);
        return;
    }
    
    // Move objects
    movePaddle();
    moveBall();
    
    // Continue game loop
    requestAnimationFrame(draw);
}

// Keyboard event handlers
function keyDown(e) {
    if (e.key === 'ArrowRight' || e.key === 'Right') {
        paddle.dx = paddle.speed;
    } else if (e.key === 'ArrowLeft' || e.key === 'Left') {
        paddle.dx = -paddle.speed;
    } else if (e.key === ' ' && gameState.gameOver) {
        // Restart game
        gameState = {
            level: 1,
            lives: 3 + upgrades.extraLives,
            score: 0,
            highScore: gameState.highScore,
            gameOver: false,
            levelComplete: false
        };
        paddle.width = 100;
        ball.speed = 5;
        powerUps.length = 0;
        createBricks();
        resetBall();
        draw();
    }
}

function keyUp(e) {
    if (e.key === 'ArrowRight' || e.key === 'Right' || e.key === 'ArrowLeft' || e.key === 'Left') {
        paddle.dx = 0;
    }
}

// Event listeners
document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);

// Start the game
init();