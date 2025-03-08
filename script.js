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
    const instructionsOverlay = document.getElementById('instructions');
    const gotItButton = document.getElementById('got-it-button');

    // Game variables
    let score = 0;
    let lives = 3;
    let gameRunning = false;
    let gameSpeed = 3000; // Slower initial star spawn rate (was 2000)
    let minSpeed = 800; // Slower maximum spawn rate (was 500)
    let starFallSpeed = 2; // Slower initial falling speed (was 3)
    let maxStarFallSpeed = 5; // Lower maximum fall speed (was 8)
    let basketPosition = 50; // Percentage from left
    let basketSpeed = 8; // Faster movement speed (was 5)
    let stars = []; // Array to store active stars
    let gameAreaWidth, gameAreaHeight;
    let animationFrameId;
    let spawnInterval;
    let touchStartX = 0;
    let isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    let starTypes = ['gold', 'blue', 'red', 'purple', 'green']; // Different star types
    let evilStarChance = 0.15; // 15% chance of spawning an evil star
    let evilStarSpeedMultiplier = 1.5; // Evil stars fall faster
    let lastEvilStarTime = 0; // Track when the last evil star was spawned
    let evilStarCooldown = 5000; // Minimum time between evil stars (ms)

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

    // Move basket to specific position (for direct touch)
    function moveBasketTo(xPosition) {
        if (!gameRunning) return;
        
        const rect = gameArea.getBoundingClientRect();
        const relativeX = xPosition - rect.left;
        
        // Ensure we have valid coordinates
        if (isNaN(relativeX) || relativeX < 0 || relativeX > gameAreaWidth) {
            return;
        }
        
        // Calculate position as percentage
        basketPosition = (relativeX / gameAreaWidth) * 100;
        
        // Keep basket within bounds
        if (basketPosition < 5) basketPosition = 5;
        if (basketPosition > 95) basketPosition = 95;
        
        // Apply the position
        updateBasketPosition();
    }

    // Create a new star
    function createStar() {
        if (!gameRunning) return;

        const star = document.createElement('div');
        star.classList.add('star');
        
        // Determine if this will be an evil star
        const now = Date.now();
        const isEvil = Math.random() < evilStarChance && (now - lastEvilStarTime > evilStarCooldown);
        
        let starType;
        if (isEvil) {
            starType = 'evil';
            lastEvilStarTime = now;
            
            // Play evil star sound
            const evilSound = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU' + Array(100).join('B'));
            evilSound.volume = 0.3;
            evilSound.play().catch(e => console.log('Audio play failed:', e));
        } else {
            // Choose a random regular star type
            starType = starTypes[Math.floor(Math.random() * starTypes.length)];
        }
        
        star.classList.add(`star-${starType}`);
        
        // Random horizontal position (5-95% to keep within bounds)
        const starPosition = 5 + Math.random() * 90;
        star.style.left = `${starPosition}%`;
        star.style.top = '0px';
        
        // Random size variation (80-120% of original size)
        const sizeVariation = 0.8 + Math.random() * 0.4;
        star.style.transform = `scale(${sizeVariation})`;
        
        // Random fall speed for this star - evil stars fall faster
        let fallSpeed = starFallSpeed + Math.random() * 1.5;
        if (isEvil) {
            fallSpeed *= evilStarSpeedMultiplier;
        }
        
        // Add star to game area and stars array
        gameArea.appendChild(star);
        stars.push({
            element: star,
            position: starPosition,
            speed: fallSpeed,
            type: starType,
            size: sizeVariation,
            isEvil: isEvil
        });
        
        // Increase difficulty over time but more gradually
        if (gameSpeed > minSpeed && score > 50) {
            gameSpeed -= 5; // Slower difficulty increase (was 10)
        }
        if (starFallSpeed < maxStarFallSpeed && score > 100) {
            starFallSpeed += 0.02; // Slower speed increase (was 0.05)
        }
        
        // Increase evil star chance as score increases
        if (score > 200) {
            evilStarChance = Math.min(0.25, 0.15 + (score - 200) / 1000);
        }
        
        // Schedule next star
        clearInterval(spawnInterval);
        spawnInterval = setTimeout(createStar, gameSpeed);
    }

    // Update star positions and check collisions
    function updateStars() {
        if (!gameRunning) return;
        
        // Make the basket hitbox larger for easier catching
        const basketLeft = basketPosition - 8; // Was 5
        const basketRight = basketPosition + 8; // Was 5
        const basketTop = gameAreaHeight - 60; // Basket is 50px high, positioned 10px from bottom
        
        stars.forEach((star, index) => {
            // Move star down
            const starTop = parseFloat(star.element.style.top) + star.speed;
            star.element.style.top = `${starTop}px`;
            
            // Add a slight wobble effect to stars
            const wobble = Math.sin(starTop / 20) * 2;
            star.element.style.marginLeft = `${wobble}px`;
            
            // Check if star is caught
            if (starTop >= basketTop && 
                star.position > basketLeft && 
                star.position < basketRight) {
                
                // Remove star from game
                gameArea.removeChild(star.element);
                stars.splice(index, 1);
                
                if (star.isEvil) {
                    // Evil star caught - lose a life!
                    lives--;
                    livesElement.textContent = lives;
                    
                    // Visual feedback for catching evil star
                    basket.style.filter = 'brightness(0.5) sepia(1) hue-rotate(-50deg) saturate(5)';
                    setTimeout(() => {
                        basket.style.filter = 'drop-shadow(0 5px 5px rgba(0,0,0,0.5))';
                    }, 300);
                    
                    // Play evil catch sound
                    const badSound = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU' + Array(500).join('C'));
                    badSound.volume = 0.4;
                    badSound.play().catch(e => console.log('Audio play failed:', e));
                    
                    // Check game over
                    if (lives <= 0) {
                        endGame();
                    }
                } else {
                    // Regular star caught - add points
                    let points = 10;
                    if (star.type === 'blue') points = 15;
                    if (star.type === 'purple') points = 20;
                    if (star.type === 'red') points = 25;
                    if (star.type === 'green') points = 30;
                    
                    score += points;
                    scoreElement.textContent = score;
                    
                    // Play catch sound effect (simple beep for now)
                    const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU' + Array(300).join('A'));
                    audio.volume = 0.2;
                    audio.play().catch(e => console.log('Audio play failed:', e));
                }
            }
            // Check if star is missed
            else if (starTop > gameAreaHeight) {
                // Star missed
                gameArea.removeChild(star.element);
                stars.splice(index, 1);
                
                // Only lose a life if it's a regular star
                if (!star.isEvil) {
                    // Lose a life
                    lives--;
                    livesElement.textContent = lives;
                    
                    // Check game over
                    if (lives <= 0) {
                        endGame();
                    }
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
        gameSpeed = 3000; // Slower initial speed
        starFallSpeed = 2; // Slower initial falling
        basketPosition = 50;
        gameRunning = true;
        evilStarChance = 0.15;
        lastEvilStarTime = 0;
        
        // Reset basket appearance
        basket.style.filter = 'drop-shadow(0 5px 5px rgba(0,0,0,0.5))';
        
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

    // Hide instructions and show game
    function hideInstructions() {
        instructionsOverlay.classList.add('hidden');
    }

    // Event listeners
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', startGame);
    gotItButton.addEventListener('click', hideInstructions);

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (!gameRunning) return;
        
        if (e.key === 'ArrowLeft') {
            moveBasketLeft();
        } else if (e.key === 'ArrowRight') {
            moveBasketRight();
        }
    });

    // Touch controls for mobile - improved for iPhone
    gameArea.addEventListener('touchstart', (e) => {
        if (!gameRunning) return;
        
        // Store initial touch position
        touchStartX = e.touches[0].clientX;
        
        // Direct positioning on tap (move basket directly to touch position)
        moveBasketTo(touchStartX);
        
        // Prevent default behavior but in a way that works on iOS Chrome
        if (e.cancelable) {
            e.preventDefault();
        }
    }, { passive: false });

    gameArea.addEventListener('touchmove', (e) => {
        if (!gameRunning) return;
        
        // Get current touch position
        const touchX = e.touches[0].clientX;
        
        // Direct positioning (move basket directly to where finger is)
        moveBasketTo(touchX);
        
        // Update the reference point for smoother movement
        touchStartX = touchX;
        
        // Prevent default behavior but in a way that works on iOS Chrome
        if (e.cancelable) {
            e.preventDefault();
        }
    }, { passive: false });

    // Add touchend event to ensure smooth movement
    gameArea.addEventListener('touchend', (e) => {
        touchStartX = 0;
    });

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

    // Add a click/tap event for more reliable touch control on iOS
    gameArea.addEventListener('click', (e) => {
        if (!gameRunning) return;
        moveBasketTo(e.clientX);
    });

    // Handle window resize
    window.addEventListener('resize', updateGameDimensions);

    // Initialize game
    updateGameDimensions();
    
    // Show mobile-specific instructions if on mobile
    if (isMobileDevice) {
        document.querySelector('.controls-section').style.backgroundColor = 'rgba(76, 175, 80, 0.3)';
    }
    
    // Force a redraw on iOS devices to ensure proper rendering
    if (isMobileDevice) {
        document.body.style.webkitTransform = 'scale(1)';
    }
});
