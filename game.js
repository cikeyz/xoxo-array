// Constants
const BOARD_SIZE = 9;
const AI_MOVE_DELAY = 500;

// Theme Toggle Functionality
const themeToggle = document.getElementById('theme-toggle');

// Check for system color scheme preference
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

// Function to update theme based on preference
function updateTheme(isDark) {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    themeToggle.checked = isDark;
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Check for saved theme preference or use system preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    updateTheme(savedTheme === 'dark');
} else {
    updateTheme(prefersDarkScheme.matches);
}

// Listen for system theme changes
prefersDarkScheme.addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
        updateTheme(e.matches);
    }
});

// Theme toggle event listener
themeToggle.addEventListener('change', () => {
    updateTheme(themeToggle.checked);
});

class TicTacToe {
    constructor() {
        // Initialize game state
        this.board = Array(BOARD_SIZE).fill('');
        this.currentPlayer = 'X';
        this.gameOver = false;
        this.moveHistory = [];
        this.playerXScore = 0;
        this.playerOScore = 0;
        this.playerNames = { X: 'X', O: 'O' };
        this.timerRunning = false;
        this.timeElapsed = 0;
        this.singlePlayerMode = false;
        this.moves = 0;

        // Improved cache with size limit
        this.minimaxCache = new Map();
        this.MAX_CACHE_SIZE = 1000;

        // Get DOM elements
        this.cells = Array.from(document.querySelectorAll('.cell'));
        this.newGameButton = document.getElementById('new-game');
        this.undoMoveButton = document.getElementById('undo-move');
        this.resetStatsButton = document.getElementById('reset-stats');
        this.modeSwitch = document.getElementById('single-player-mode');
        this.playerXInput = document.getElementById('player-x');
        this.playerOInput = document.getElementById('player-o');
        this.currentPlayerDisplay = document.getElementById('current-player');
        this.timerDisplay = document.getElementById('timer');
        this.movesDisplay = document.getElementById('moves');
        this.historyText = document.querySelector('.history-container');
        
        // Scoreboard elements
        this.xScoreDisplay = document.getElementById('x-score');
        this.oScoreDisplay = document.getElementById('o-score');

        // Add debounce function
        this.debounce = (func, wait) => {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        };

        // Initialize the game
        this.setupEventListeners();
        this.updateScoreDisplay();
        this.startTimer();

        // Disable reset button initially
        this.resetStatsButton.disabled = true;

        // Add timer frame ID for cancellation
        this.timerFrameId = null;
    }

    setupEventListeners() {
        // Optimize board click handling with single event listener
        const gameBoard = document.querySelector('.game-board');
        gameBoard.addEventListener('click', (event) => {
            const cell = event.target.closest('.cell');
            if (cell) {
                this.handleMove(parseInt(cell.dataset.index));
            }
        });

        // Optimize control buttons with event delegation
        const controlButtons = document.querySelector('.control-buttons');
        controlButtons.addEventListener('click', (event) => {
            const button = event.target.closest('.control-btn');
            if (!button || button.disabled) return;

            switch (button.id) {
                case 'new-game':
                    this.resetBoard();
                    break;
                case 'undo-move':
                    this.undoMove();
                    break;
                case 'reset-stats':
                    this.resetStats();
                    break;
            }
        });

        // Debounce player name input events
        const updatePlayerName = this.debounce((player, input) => {
            const name = this.sanitizeInput(input.value.trim()) || player;
            this.playerNames[player] = name;
            this.updateScoreDisplay();
            this.updateCurrentPlayerDisplay();
        }, 250);

        this.playerXInput.addEventListener('input', () => updatePlayerName('X', this.playerXInput));
        this.playerOInput.addEventListener('input', () => updatePlayerName('O', this.playerOInput));

        // Mode switches
        this.modeSwitch.addEventListener('change', () => this.toggleGameMode());
    }

    updateScoreDisplay() {
        // Update score display text with player names
        const xName = this.playerNames.X || 'X';
        const oName = this.playerNames.O || 'O';
        this.xScoreDisplay.parentElement.innerHTML = `${xName}: <span id="x-score">${this.playerXScore}</span>`;
        this.oScoreDisplay.parentElement.innerHTML = `${oName}: <span id="o-score">${this.playerOScore}</span>`;
        
        // Re-assign score display elements after innerHTML update
        this.xScoreDisplay = document.getElementById('x-score');
        this.oScoreDisplay = document.getElementById('o-score');
    }

    updateCurrentPlayerDisplay() {
        this.currentPlayerDisplay.textContent = `Current Player: ${this.playerNames[this.currentPlayer]}`;
        // Remove both classes first
        this.currentPlayerDisplay.classList.remove('x-turn', 'o-turn');
        // Add the appropriate class
        this.currentPlayerDisplay.classList.add(this.currentPlayer.toLowerCase() + '-turn');
    }

    handleMove(index) {
        if (this.board[index] === '' && !this.checkWinner() && !this.gameOver) {
            // Start timer on first move
            if (!this.timerRunning) {
                this.timerRunning = true;
                this.startTime = Date.now();
                this.updateTimer();
            }

            // Make the move
            this.makeMove(index);

            // If in single player mode and game isn't over, make AI move
            if (this.singlePlayerMode && 
                this.currentPlayer === 'O' && 
                !this.checkWinner() && 
                this.board.includes('') &&
                !this.gameOver) {
                setTimeout(() => {
                    if (!this.gameOver) {
                        this.makeAIMove();
                    }
                }, AI_MOVE_DELAY);
            }
        }
    }

    makeMove(index) {
        this.updateBoard(index);
        this.updateMoveHistory(index);
        this.checkGameState();

        // Enable reset button when a move is made
        this.resetStatsButton.disabled = false;
    }

    updateBoard(index) {
        this.board[index] = this.currentPlayer;
        const cell = this.cells[index];
        cell.textContent = this.currentPlayer;
        cell.classList.add(this.currentPlayer.toLowerCase());

        // Update moves counter
        this.moves++;
        this.movesDisplay.textContent = `Moves: ${this.moves}`;
    }

    updateMoveHistory(index) {
        const row = Math.floor(index / 3) + 1;
        const col = (index % 3) + 1;
        const moveTime = this.timerDisplay.textContent.replace('Time: ', '');
        const playerName = this.playerNames[this.currentPlayer];
        const moveText = `[${moveTime}] ${playerName}: (${row},${col})\n`;
        this.historyText.textContent += moveText;
        this.historyText.scrollTop = this.historyText.scrollHeight;

        // Add to move history
        this.moveHistory.push({ index, player: this.currentPlayer });
        this.undoMoveButton.disabled = false;
    }

    checkGameState() {
        if (this.checkWinner()) {
            this.handleWin();
        } else if (!this.board.includes('')) {
            this.handleDraw();
        } else {
            this.switchPlayer();
        }
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        this.updateCurrentPlayerDisplay();
    }

    makeAIMove() {
        const move = this.findBestMove();
        if (move !== null) {
            this.makeMove(move);
        }
    }

    findBestMove() {
        let bestScore = -Infinity;
        let bestMove = null;
        let alpha = -Infinity;
        let beta = Infinity;

        // Try each available move
        for (let i = 0; i < 9; i++) {
            if (this.board[i] === '') {
                this.board[i] = 'O';
                let score = this.minimax(this.board, 0, false, alpha, beta);
                this.board[i] = '';

                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
                alpha = Math.max(alpha, bestScore);
            }
        }

        return bestMove;
    }

    minimax(board, depth, isMaximizing, alpha, beta) {
        const boardKey = board.join('');
        
        // Check cache first
        if (this.minimaxCache.has(boardKey)) {
            return this.minimaxCache.get(boardKey);
        }

        // Check terminal states
        let result = this.checkWinnerForMinimax();
        if (result !== null) {
            const score = result === 'O' ? 10 - depth : depth - 10;
            this.minimaxCache.set(boardKey, score);
            return score;
        }
        if (!board.includes('')) {
            this.minimaxCache.set(boardKey, 0);
            return 0;
        }

        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < BOARD_SIZE; i++) {
                if (board[i] === '') {
                    board[i] = 'O';
                    let score = this.minimax(board, depth + 1, false, alpha, beta);
                    board[i] = '';
                    bestScore = Math.max(score, bestScore);
                    alpha = Math.max(alpha, bestScore);
                    if (beta <= alpha) break;
                }
            }
            this.minimaxCache.set(boardKey, bestScore);
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < BOARD_SIZE; i++) {
                if (board[i] === '') {
                    board[i] = 'X';
                    let score = this.minimax(board, depth + 1, true, alpha, beta);
                    board[i] = '';
                    bestScore = Math.min(score, bestScore);
                    beta = Math.min(beta, bestScore);
                    if (beta <= alpha) break;
                }
            }
            this.minimaxCache.set(boardKey, bestScore);
            return bestScore;
        }
    }

    checkWinnerForMinimax() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6] // diagonals
        ];

        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (this.board[a] && 
                this.board[a] === this.board[b] && 
                this.board[a] === this.board[c]) {
                return this.board[a];
            }
        }

        return null;
    }

    checkWinner() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6] // diagonals
        ];

        return winPatterns.some(pattern => {
            const [a, b, c] = pattern;
            return this.board[a] &&
                this.board[a] === this.board[b] &&
                this.board[a] === this.board[c];
        });
    }

    handleWin() {
        this.stopTimer();
        const winnerName = this.playerNames[this.currentPlayer];
        const totalTime = this.timerDisplay.textContent.replace('Time: ', '');
        const summaryText = `\n${winnerName} wins!\nTotal Moves: ${this.moves}, Total Time: ${totalTime}\n`;
        this.historyText.textContent += summaryText;

        // Update score
        if (this.currentPlayer === 'X') {
            this.playerXScore++;
        } else {
            this.playerOScore++;
        }
        
        // Update scoreboard display
        this.updateScoreDisplay();

        // Highlight winning combination
        this.highlightWinningCombination();

        // Show win message
        setTimeout(() => {
            alert(`${winnerName} wins!`);
            this.resetBoard();
        }, 100);
    }

    highlightWinningCombination() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6] // diagonals
        ];

        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (this.board[a] && 
                this.board[a] === this.board[b] && 
                this.board[a] === this.board[c]) {
                // Highlight winning cells
                pattern.forEach(index => {
                    this.cells[index].style.backgroundColor = 
                        this.currentPlayer === 'O' ? 'var(--o-color)' : 'var(--x-color)';
                    this.cells[index].style.color = 'var(--frame-color)';
                });
                break;
            }
        }
    }

    handleDraw() {
        this.stopTimer();
        const totalTime = this.timerDisplay.textContent.replace('Time: ', '');
        const summaryText = `\nGame Draw!\nTotal Moves: ${this.moves}, Total Time: ${totalTime}\n`;
        this.historyText.textContent += summaryText;
        setTimeout(() => {
            alert("It's a Draw!");
            this.resetBoard();
        }, 100);
    }

    undoMove() {
        if (this.moveHistory.length > 0) {
            const lastMove = this.moveHistory.pop();
            this.board[lastMove.index] = '';
            const cell = this.cells[lastMove.index];
            cell.textContent = '';
            cell.classList.remove('x', 'o');
            cell.style.backgroundColor = '';
            cell.style.color = '';

            // Update moves counter
            this.moves--;
            this.movesDisplay.textContent = `Moves: ${this.moves}`;

            this.currentPlayer = lastMove.player;
            this.updateCurrentPlayerDisplay();

            this.historyText.textContent += "Move undone\n";
            this.historyText.scrollTop = this.historyText.scrollHeight;

            if (this.moveHistory.length === 0) {
                this.undoMoveButton.disabled = true;
                this.stopTimer();
                this.startTime = null;
                this.timerDisplay.textContent = "Time: 00:00:00";

                // Disable reset button if no moves are left
                this.resetStatsButton.disabled = true;
            }
        }
    }

    updateTimer() {
        if (this.timerRunning && this.startTime) {
            const updateTimerDisplay = () => {
                const elapsed = Date.now() - this.startTime;
                const minutes = Math.floor(elapsed / 60000);
                const seconds = Math.floor((elapsed % 60000) / 1000);
                const milliseconds = Math.floor((elapsed % 1000) / 10);
                this.timerDisplay.textContent = 
                    `Time: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`;
                
                if (this.timerRunning) {
                    this.timerFrameId = requestAnimationFrame(updateTimerDisplay);
                }
            };
            
            this.timerFrameId = requestAnimationFrame(updateTimerDisplay);
        }
    }

    stopTimer() {
        this.timerRunning = false;
        if (this.timerFrameId) {
            cancelAnimationFrame(this.timerFrameId);
            this.timerFrameId = null;
        }
    }

    toggleGameMode() {
        this.singlePlayerMode = this.modeSwitch.checked;
        if (this.singlePlayerMode) {
            this.playerOInput.value = "AI";
            this.playerOInput.disabled = true;
            this.playerNames.O = "AI";
        } else {
            this.playerOInput.value = "O";
            this.playerOInput.disabled = false;
            this.playerNames.O = "O";
        }
    }

    resetBoard() {
        this.board = Array(BOARD_SIZE).fill('');
        this.currentPlayer = 'X';
        this.moveHistory = [];
        this.stopTimer();
        this.startTime = null;
        this.timerDisplay.textContent = "Time: 00:00:00";
        this.undoMoveButton.disabled = true;
        
        // Reset moves counter
        this.moves = 0;
        this.movesDisplay.textContent = "Moves: 0";

        // Update current player display
        this.updateCurrentPlayerDisplay();

        // Update player names and scoreboard
        this.playerNames.X = this.playerXInput.value.trim() || 'X';
        this.playerNames.O = this.singlePlayerMode ? 'AI' : (this.playerOInput.value.trim() || 'O');
        this.updateScoreDisplay();

        // Reset cells
        this.cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('x', 'o');
            cell.style.backgroundColor = '';
            cell.style.color = '';
        });

        // Add reset message to history with player names
        this.historyText.textContent += `\n=== New Game: ${this.playerNames.X} vs ${this.playerNames.O} ===\n`;
        this.historyText.scrollTop = this.historyText.scrollHeight;

        // Clear minimax cache on new game
        this.clearMinimaxCache();
    }

    resetStats() {
        // Reset scores
        this.playerXScore = 0;
        this.playerOScore = 0;
        this.updateScoreDisplay();

        // Reset timer
        this.stopTimer();
        this.timeElapsed = 0;
        this.startTime = null;
        this.timerDisplay.textContent = "Time: 0:00";

        // Reset moves
        this.moves = 0;
        this.movesDisplay.textContent = "Moves: 0";

        // Clear move history
        this.historyText.textContent = "=== Game Stats Reset ===\n";
        this.historyText.scrollTop = this.historyText.scrollHeight;

        // Disable reset button after reset
        this.resetStatsButton.disabled = true;

        // Reset the board
        this.resetBoard();
    }

    sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    clearMinimaxCache() {
        if (this.minimaxCache.size > this.MAX_CACHE_SIZE) {
            this.minimaxCache.clear();
        }
    }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TicTacToe();
});