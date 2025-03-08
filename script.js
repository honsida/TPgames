document.addEventListener('DOMContentLoaded', () => {
    // Game elements
    const gameArea = document.getElementById('game-area');
    const basket = document.getElementById('basket');
    const scoreElement = document.getElementById('score');
    const livesElement = document.getElementById('lives');
    const startButton = document.getElementById('start-button');
    const restartButton = document.getElementById('restart-button');
    const gameOverScreen = document.getElementById('game-over');
    const finalScoreElement = document.getElementById('final-score');

    // Game variables
    let score = 0;
    let lives = 3;
    let gameRunning = false;
    let gameSpeed = 2000; // Initial star spawn rate in ms
    let minSpeed = 500; // Fastest star spawn rate
    let starFallSpeed = 3; // Initial falling speed
    let maxStarFallSpeed = 8; // Maximum falling speed
    let basketPosition = 50; // Percentage from left
    let basketSpeed = 5; // Movement speed percentage
    let stars = []; // Array to store active stars
    let gameAreaWidth, gameAreaHeight;
    let animationFrameId;
    let spawnInterval;
    let touchStartX = 0;

    // Initialize game dimensions
    function updateGameDimensions() {
        gameAreaWidth = gameArea.clientWidth;
        gameAreaHeight = gameArea.clientHeight;
        
        // Update basket position based on new dimensions
        updateBasketPosition();
    }

    // Update basket position
    function updateBasketPosition() {
        basket.style.left = `${basketPosition}%`;
    }

    // Move basket left
    function moveBasketLeft() {
        if (basketPosition > 5) {
            basketPosition -= basketSpeed;
            updateBasketPosition();
        }
    }

    // Move basket right
    function moveBasketRight() {
        if (basketPosition < 95) {
            basketPosition += basketSpeed;
            updateBasketPosition();
        }
    }

    // Create a new star
    function createStar() {
        if (!gameRunning) return;

        const star = document.createElement('div');
        star.classList.add('star');
        
        // Random horizontal position (5-95% to keep within bounds)
        const starPosition = 5 + Math.random() * 90;
        star.style.left = `${starPosition}%`;
        star.style.top = '0px';
        
        // Random fall speed for this star
        const fallSpeed = starFallSpeed + Math.random() * 2;
        
        // Add star to game area and stars array
        gameArea.appendChild(star);
        stars.push({
            element: star,
            position: starPosition,
            speed: fallSpeed
        });
        
        // Increase difficulty over time
        if (gameSpeed > minSpeed) {
            gameSpeed -= 10;
        }
        if (starFallSpeed < maxStarFallSpeed) {
            starFallSpeed += 0.05;
        }
        
        // Schedule next star
        clearInterval(spawnInterval);
        spawnInterval = setTimeout(createStar, gameSpeed);
    }

    // Update star positions and check collisions
    function updateStars() {
        if (!gameRunning) return;
        
        const basketLeft = basketPosition - 5; // Basket width adjustment for collision
        const basketRight = basketPosition + 5;
        const basketTop = gameAreaHeight - 60; // Basket is 50px high, positioned 10px from bottom
        
        stars.forEach((star, index) => {
            // Move star down
            const starTop = parseFloat(star.element.style.top) + star.speed;
            star.element.style.top = `${starTop}px`;
            
            // Check if star is caught
            if (starTop >= basketTop && 
                star.position > basketLeft && 
                star.position < basketRight) {
                // Star caught
                gameArea.removeChild(star.element);
                stars.splice(index, 1);
                
                // Update score
                score += 10;
                scoreElement.textContent = score;
                
                // Play catch sound effect (simple beep for now)
                const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU' + Array(300).join('A'));
                audio.volume = 0.2;
                audio.play().catch(e => console.log('Audio play failed:', e));
            }
            // Check if star is missed
            else if (starTop > gameAreaHeight) {
                // Star missed
                gameArea.removeChild(star.element);
                stars.splice(index, 1);
                
                // Lose a life
                lives--;
                livesElement.textContent = lives;
                
                // Check game over
                if (lives <= 0) {
                    endGame();
                }
            }
        });
        
        // Continue animation loop
        animationFrameId = requestAnimationFrame(updateStars);
    }

    // Start the game
    function startGame() {
        // Reset game state
        score = 0;
        lives = 3;
        gameSpeed = 2000;
        starFallSpeed = 3;
        basketPosition = 50;
        gameRunning = true;
        
        // Clear any existing stars
        stars.forEach(star => {
            if (star.element.parentNode) {
                gameArea.removeChild(star.element);
            }
        });
        stars = [];
        
        // Update UI
        scoreElement.textContent = score;
        livesElement.textContent = lives;
        gameOverScreen.classList.add('hidden');
        startButton.disabled = true;
        
        // Start game loop
        updateGameDimensions();
        createStar();
        animationFrameId = requestAnimationFrame(updateStars);
    }

    // End the game
    function endGame() {
        gameRunning = false;
        clearInterval(spawnInterval);
        cancelAnimationFrame(animationFrameId);
        
        // Show game over screen
        finalScoreElement.textContent = score;
        gameOverScreen.classList.remove('hidden');
        startButton.disabled = false;
    }

    // Event listeners
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', startGame);

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (!gameRunning) return;
        
        if (e.key === 'ArrowLeft') {
            moveBasketLeft();
        } else if (e.key === 'ArrowRight') {
            moveBasketRight();
        }
    });

    // Touch controls for mobile
    gameArea.addEventListener('touchstart', (e) => {
        if (!gameRunning) return;
        touchStartX = e.touches[0].clientX;
        e.preventDefault(); // Prevent scrolling
    }, { passive: false });

    gameArea.addEventListener('touchmove', (e) => {
        if (!gameRunning || !touchStartX) return;
        
        const touchX = e.touches[0].clientX;
        const diffX = touchX - touchStartX;
        
        if (diffX > 10) {
            moveBasketRight();
        } else if (diffX < -10) {
            moveBasketLeft();
        }
        
        touchStartX = touchX;
        e.preventDefault(); // Prevent scrolling
    }, { passive: false });

    // Mouse controls
    gameArea.addEventListener('mousemove', (e) => {
        if (!gameRunning) return;
        
        const rect = gameArea.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        basketPosition = (mouseX / gameAreaWidth) * 100;
        
        // Keep basket within bounds
        if (basketPosition < 5) basketPosition = 5;
        if (basketPosition > 95) basketPosition = 95;
        
        updateBasketPosition();
    });

    // Handle window resize
    window.addEventListener('resize', updateGameDimensions);

    // Initialize game
    updateGameDimensions();
});
