(function () {
    const scoreEl = document.getElementById("score");
    const hscoreEl = document.getElementById("hscore");
    const timeEl = document.getElementById("time");
    const board = document.getElementById("board");

    // UI Overlays
    const startScreen = document.getElementById("start-screen");
    const startBtn = document.getElementById("start-btn");
    const gameOverScreen = document.getElementById("game-over-screen");
    const finalScoreDisplay = document.getElementById("final-score-display");
    const finalHscoreDisplay = document.getElementById("final-hscore-display");
    const restartBtn = document.getElementById("restart-btn");

    // Audio SFX
    const eatSound = new Audio("mixkit-hungry-man-eating-2252.wav");
    eatSound.volume = 0.6;

    // ---------------- Responsive Board Configuration ----------------------
    let rows = 0;
    let cols = 0;
    let blocks = [];
    let currentBlockSize = 40;

    /**
     * Returns the board border width based on current viewport.
     * Mirrors the CSS media query breakpoints.
     */
    function getBoardBorderWidth() {
        const w = window.innerWidth;
        if (w <= 360) return 5;
        if (w <= 480) return 6;
        if (w <= 768) return 8;
        return 12;
    }

    /**
     * Dynamically calculates the optimal block size so the board
     * fits within the available viewport space on any device.
     */
    function calculateBlockSize() {
        const borderW = getBoardBorderWidth();
        const infoEl = document.querySelector('.infos');
        const swipeHintEl = document.querySelector('.swipe-hint');

        // Available width: viewport width minus some breathing room
        const availWidth = window.innerWidth - 16;
        // Available height: viewport height minus info bar, hint, gaps, and safe area
        const infoHeight = infoEl ? infoEl.offsetHeight : 50;
        const hintHeight = (swipeHintEl && window.innerWidth <= 768) ? 22 : 0;
        const availHeight = window.innerHeight - infoHeight - hintHeight - 40;

        // Target ~16-20 columns and ~14-18 rows for a good gameplay experience
        const targetCols = 18;
        const targetRows = 16;

        let bsFromWidth = Math.floor((availWidth - 2 * borderW) / targetCols);
        let bsFromHeight = Math.floor((availHeight - 2 * borderW) / targetRows);

        let blockSize = Math.min(bsFromWidth, bsFromHeight);

        // Clamp using CSS variable equivalents
        const minBS = parseInt(getComputedStyle(document.documentElement).getPropertyValue(
            '--block-size-min').trim()) || 22;
        const maxBS = parseInt(getComputedStyle(document.documentElement).getPropertyValue(
            '--block-size-max').trim()) || 50;

        blockSize = Math.max(minBS, Math.min(maxBS, blockSize));

        return blockSize;
    }

    function buildBoard() {
        board.innerHTML = "";
        blocks = [];

        currentBlockSize = calculateBlockSize();
        const borderW = getBoardBorderWidth();

        // Calculate available space
        const infoEl = document.querySelector('.infos');
        const swipeHintEl = document.querySelector('.swipe-hint');
        const infoHeight = infoEl ? infoEl.offsetHeight : 50;
        const hintHeight = (swipeHintEl && window.innerWidth <= 768) ? 22 : 0;
        const availWidth = window.innerWidth - 16;
        const availHeight = window.innerHeight - infoHeight - hintHeight - 40;

        // Determine grid dimensions
        cols = Math.floor((availWidth - 2 * borderW) / currentBlockSize);
        rows = Math.floor((availHeight - 2 * borderW) / currentBlockSize);

        // Enforce minimum playable grid
        cols = Math.max(6, cols);
        rows = Math.max(6, rows);

        // Content dimensions
        const contentW = cols * currentBlockSize;
        const contentH = rows * currentBlockSize;

        // Set board styles (border-box accounts for border)
        board.style.width = (contentW + 2 * borderW) + 'px';
        board.style.height = (contentH + 2 * borderW) + 'px';
        board.style.gridTemplateColumns = `repeat(${cols}, ${currentBlockSize}px)`;
        board.style.gridTemplateRows = `repeat(${rows}, ${currentBlockSize}px)`;

        // Create block elements
        const fragment = document.createDocumentFragment();
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const block = document.createElement("div");
                block.classList.add("block", (r + c) % 2 === 0 ? "block1" : "block2");
                fragment.appendChild(block);
                blocks.push(block);
            }
        }
        board.appendChild(fragment);

        resetGame();
    }

    // ---------------- Game State & 30 FPS Loop ----------------------
    const DIRS = [
        { r: -1, c: 0 }, // 0: UP
        { r: 0, c: 1 }, // 1: RIGHT
        { r: 1, c: 0 }, // 2: DOWN
        { r: 0, c: -1 } // 3: LEFT
    ];

    let snake = [];
    let currentDir = 1;
    let nextDir = 1;
    let food = null;
    let score = 0;
    let highScore = parseInt(localStorage.getItem("snake_hscore")) || 0;
    hscoreEl.textContent = highScore;

    let gameInterval = null;
    let timerInterval = null;
    let secondsElapsed = 0;
    let isGameOver = false;
    let moveCounter = 0;
    let movesPerSecond = 5;
    let ticksPerMove = Math.round(30 / movesPerSecond);

    // ---------------- Keyboard Controls ----------------------
    window.addEventListener("keydown", (e) => {
        const key = e.key.toLowerCase();
        const code = e.code;

        // Prevent scrolling for game keys
        const gameKeys = ['w', 'a', 's', 'd', 'r', ' ', 'arrowup', 'arrowdown', 'arrowleft',
            'arrowright'
        ];
        const gameCodes = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyR', 'Space'];
        if (gameKeys.includes(key) || gameCodes.includes(code)) {
            e.preventDefault();
        }

        if (isGameOver) {
            if (gameKeys.includes(key) || key === 'enter') {
                gameOverScreen.classList.add("hidden");
                resetGame();
            }
            return;
        }

        // Handle start screen
        if (!startScreen.classList.contains("hidden") && !gameInterval) {
            if (key === " " || key === "enter") {
                startScreen.classList.add("hidden");
                resetGame();
            }
            return;
        }

        // Direction changes (prevent 180° reversals)
        if ((key === 'w' || code === 'KeyW' || key === 'arrowup') && currentDir !== 2) {
            nextDir = 0;
        } else if ((key === 's' || code === 'KeyS' || key === 'arrowdown') && currentDir !== 0) {
            nextDir = 2;
        } else if ((key === 'a' || code === 'KeyA' || key === 'arrowleft') && currentDir !== 1) {
            nextDir = 3;
        } else if ((key === 'd' || code === 'KeyD' || key === 'r' || code === 'KeyR' || key ===
            'arrowright') && currentDir !== 3) {
            nextDir = 1;
        }
    });

    // ---------------- Touch / Swipe Controls ----------------------
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    const SWIPE_THRESHOLD = 25; // minimum px to count as swipe

    board.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
        }
        // Don't prevent default here to allow scrolling on overlays
    }, { passive: true });

    board.addEventListener('touchend', (e) => {
        if (isGameOver) {
            // Any swipe on game over triggers restart
            gameOverScreen.classList.add("hidden");
            resetGame();
            return;
        }
        if (!startScreen.classList.contains("hidden") && !gameInterval) {
            startScreen.classList.add("hidden");
            resetGame();
            return;
        }

        const dx = (e.changedTouches[0]?.clientX || touchStartX) - touchStartX;
        const dy = (e.changedTouches[0]?.clientY || touchStartY) - touchStartY;
        const dt = Date.now() - touchStartTime;

        // Ignore very long presses (likely not swipes)
        if (dt > 800) return;

        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        if (Math.max(absDx, absDy) < SWIPE_THRESHOLD) return;

        if (absDx > absDy) {
            // Horizontal swipe
            if (dx > 0 && currentDir !== 3) {
                nextDir = 1; // RIGHT
            } else if (dx < 0 && currentDir !== 1) {
                nextDir = 3; // LEFT
            }
        } else {
            // Vertical swipe
            if (dy > 0 && currentDir !== 0) {
                nextDir = 2; // DOWN
            } else if (dy < 0 && currentDir !== 2) {
                nextDir = 0; // UP
            }
        }
    });

    // Also allow swipes on the whole section for easier mobile play
    const sectionEl = document.querySelector('section');
    sectionEl.addEventListener('touchstart', (e) => {
        if (e.target === board || board.contains(e.target)) return; // handled by board listener
        if (e.touches.length === 1) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
        }
    }, { passive: true });

    sectionEl.addEventListener('touchend', (e) => {
        if (e.target === board || board.contains(e.target)) return;
        if (isGameOver) {
            gameOverScreen.classList.add("hidden");
            resetGame();
            return;
        }
        if (!startScreen.classList.contains("hidden") && !gameInterval) {
            startScreen.classList.add("hidden");
            resetGame();
            return;
        }

        const dx = (e.changedTouches[0]?.clientX || touchStartX) - touchStartX;
        const dy = (e.changedTouches[0]?.clientY || touchStartY) - touchStartY;
        const dt = Date.now() - touchStartTime;
        if (dt > 800) return;

        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        if (Math.max(absDx, absDy) < SWIPE_THRESHOLD) return;

        if (absDx > absDy) {
            if (dx > 0 && currentDir !== 3) nextDir = 1;
            else if (dx < 0 && currentDir !== 1) nextDir = 3;
        } else {
            if (dy > 0 && currentDir !== 0) nextDir = 2;
            else if (dy < 0 && currentDir !== 2) nextDir = 0;
        }
    });

    // ---------------- Game Logic ----------------------
    function spawnFood() {
        const emptyIndices = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const isSnake = snake.some(segment => segment.r === r && segment.c === c);
                if (!isSnake) {
                    emptyIndices.push({ r, c });
                }
            }
        }
        if (emptyIndices.length > 0) {
            food = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        } else {
            food = null; // Player wins! (snake fills entire board)
        }
    }

    function resetGame() {
        clearInterval(gameInterval);
        clearInterval(timerInterval);
        gameInterval = null;
        timerInterval = null;

        isGameOver = false;
        score = 0;
        scoreEl.textContent = score;
        secondsElapsed = 0;
        updateTimerDisplay();

        const startR = Math.floor(rows / 2);
        const startC = Math.floor(cols / 2);
        snake = [
            { r: startR, c: startC },
            { r: startR, c: startC - 1 },
            { r: startR, c: startC - 2 }
        ];
        currentDir = 1;
        nextDir = 1;
        moveCounter = 0;
        movesPerSecond = 5;
        ticksPerMove = Math.round(30 / movesPerSecond);

        spawnFood();
        render();
        startGame();
    }

    function startGame() {
        if (gameInterval) return;
        gameInterval = setInterval(gameTick, 1000 / 30);
        timerInterval = setInterval(() => {
            if (!isGameOver) {
                secondsElapsed++;
                updateTimerDisplay();
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        const mins = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
        const secs = String(secondsElapsed % 60).padStart(2, '0');
        timeEl.textContent = `${mins}-${secs}`;
    }

    function gameTick() {
        moveCounter++;
        if (moveCounter >= ticksPerMove) {
            moveCounter = 0;
            updateSnake();
        }
        render();
    }

    function updateSnake() {
        currentDir = nextDir;
        const dir = DIRS[currentDir];
        const head = snake[0];
        const newHead = { r: head.r + dir.r, c: head.c + dir.c };

        // Wall Collision
        if (newHead.r < 0 || newHead.r >= rows || newHead.c < 0 || newHead.c >= cols) {
            gameOver();
            return;
        }

        // Self Collision
        if (snake.some(seg => seg.r === newHead.r && seg.c === newHead.c)) {
            gameOver();
            return;
        }

        snake.unshift(newHead);

        // Food Collision
        if (food && newHead.r === food.r && newHead.c === food.c) {
            score += 10;
            scoreEl.textContent = score;
            movesPerSecond += 1;
            ticksPerMove = Math.max(1, Math.round(30 / movesPerSecond));

            // Play eating SFX
            eatSound.currentTime = 0;
            eatSound.play().catch(() => { });

            if (score > highScore) {
                highScore = score;
                localStorage.setItem("snake_hscore", highScore);
                hscoreEl.textContent = highScore;
            }
            spawnFood();

            // Check win condition
            if (!food) {
                // Snake fills the board — player wins! Treat as game over with a twist.
                gameOver();
            }
        } else {
            snake.pop();
        }
    }

    function gameOver() {
        isGameOver = true;
        clearInterval(gameInterval);
        clearInterval(timerInterval);
        gameInterval = null;
        timerInterval = null;

        finalScoreDisplay.textContent = score;
        finalHscoreDisplay.textContent = highScore;
        gameOverScreen.classList.remove("hidden");
    }

    function render() {
        if (blocks.length === 0) return;

        // Clear previous styling
        for (let i = 0; i < blocks.length; i++) {
            blocks[i].classList.remove("snake", "snake-head", "snake-tail",
                "head-up", "head-right", "head-down", "head-left", "food");
        }

        // Render Food
        if (food) {
            const foodIdx = food.r * cols + food.c;
            if (foodIdx >= 0 && foodIdx < blocks.length) {
                blocks[foodIdx].classList.add("food");
            }
        }

        // Render Snake
        const dirNames = ["head-up", "head-right", "head-down", "head-left"];
        for (let i = 0; i < snake.length; i++) {
            const segment = snake[i];
            const idx = segment.r * cols + segment.c;
            if (idx >= 0 && idx < blocks.length) {
                blocks[idx].classList.add("snake");
                if (i === 0) {
                    blocks[idx].classList.add("snake-head", dirNames[currentDir]);
                } else if (i === snake.length - 1) {
                    blocks[idx].classList.add("snake-tail");
                }
            }
        }
    }

    // ---------------- Button Event Listeners ----------------------
    startBtn.addEventListener("click", () => {
        startScreen.classList.add("hidden");
        resetGame();
    });

    restartBtn.addEventListener("click", () => {
        gameOverScreen.classList.add("hidden");
        resetGame();
    });

    // ---------------- Initialization ----------------------
    buildBoard();
    // Immediately pause because the start screen is visible
    clearInterval(gameInterval);
    clearInterval(timerInterval);
    gameInterval = null;
    timerInterval = null;

    // ---------------- Responsive Resize Handling ----------------------
    let resizeTimer;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const wasRunning = !!gameInterval && !isGameOver;
            // Stop current game loops
            clearInterval(gameInterval);
            clearInterval(timerInterval);
            gameInterval = null;
            timerInterval = null;
            // Rebuild the board for the new viewport
            buildBoard();
            if (!wasRunning) {
                // If game wasn't running (e.g., start screen or game over), pause again
                clearInterval(gameInterval);
                clearInterval(timerInterval);
                gameInterval = null;
                timerInterval = null;
            }
            // If the game over screen is visible, keep it visible but update layout
            if (!gameOverScreen.classList.contains("hidden")) {
                finalScoreDisplay.textContent = score;
                finalHscoreDisplay.textContent = highScore;
            }
        }, 250);
    });

    // ---------------- Orientation Change Handling ----------------------
    window.addEventListener("orientationchange", () => {
        // Small delay to let the browser finish orientation change
        setTimeout(() => {
            const wasRunning = !!gameInterval && !isGameOver;
            clearInterval(gameInterval);
            clearInterval(timerInterval);
            gameInterval = null;
            timerInterval = null;
            buildBoard();
            if (!wasRunning) {
                clearInterval(gameInterval);
                clearInterval(timerInterval);
                gameInterval = null;
                timerInterval = null;
            }
            if (!gameOverScreen.classList.contains("hidden")) {
                finalScoreDisplay.textContent = score;
                finalHscoreDisplay.textContent = highScore;
            }
        }, 300);
    });

    // ---------------- Overlay Particles (decorative) ----------------------
    const particlesCanvas = document.getElementById('overlay-particles');
    if (particlesCanvas) {
        const pCtx = particlesCanvas.getContext('2d');
        let particles = [];
        let pAnimId = null;

        function resizeParticlesCanvas() {
            const overlay = particlesCanvas.parentElement;
            particlesCanvas.width = overlay.offsetWidth;
            particlesCanvas.height = overlay.offsetHeight;
        }

        function createParticles() {
            particles = [];
            const count = Math.floor((particlesCanvas.width * particlesCanvas.height) / 8000);
            for (let i = 0; i < Math.min(count, 60); i++) {
                particles.push({
                    x: Math.random() * particlesCanvas.width,
                    y: Math.random() * particlesCanvas.height,
                    r: Math.random() * 2 + 1,
                    speedX: (Math.random() - 0.5) * 0.6,
                    speedY: (Math.random() - 0.5) * 0.6,
                    alpha: Math.random() * 0.5 + 0.2,
                });
            }
        }

        function animateParticles() {
            if (!particlesCanvas || particlesCanvas.width === 0) return;
            pCtx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);
            for (const p of particles) {
                p.x += p.speedX;
                p.y += p.speedY;
                if (p.x < -5) p.x = particlesCanvas.width + 5;
                if (p.x > particlesCanvas.width + 5) p.x = -5;
                if (p.y < -5) p.y = particlesCanvas.height + 5;
                if (p.y > particlesCanvas.height + 5) p.y = -5;
                pCtx.beginPath();
                pCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                pCtx.fillStyle = `rgba(254,255,241,${p.alpha})`;
                pCtx.fill();
            }
            pAnimId = requestAnimationFrame(animateParticles);
        }

        function initParticles() {
            resizeParticlesCanvas();
            createParticles();
            if (pAnimId) cancelAnimationFrame(pAnimId);
            animateParticles();
        }

        // Observe overlay visibility
        const observer = new MutationObserver(() => {
            if (!startScreen.classList.contains('hidden')) {
                initParticles();
            } else if (pAnimId) {
                cancelAnimationFrame(pAnimId);
                pAnimId = null;
            }
        });
        observer.observe(startScreen, { attributes: true, attributeFilter: ['class'] });

        window.addEventListener('resize', () => {
            if (!startScreen.classList.contains('hidden')) {
                resizeParticlesCanvas();
                createParticles();
            }
        });

        if (!startScreen.classList.contains('hidden')) {
            initParticles();
        }
    }

    console.log('Snake Game ready — responsive & touch-enabled');
})();