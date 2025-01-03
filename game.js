// Game configuration constants
const BOARD_SIZE = 9;  // 3x3 board
const AI_MOVE_DELAY = 500;  // 500ms delay for AI moves to make them visible

class TicTacToe {
    constructor() {
        // Initialize game state variables
        this.board = Array(BOARD_SIZE).fill('');  // Empty board array
        this.currentPlayer = 'X';  // X starts first
        this.gameOver = false;
        this.moveHistory = [];  // Array to store move history
        this.playerXScore = 0;
        this.playerOScore = 0;
        this.playerNames = { X: 'X', O: 'O' };  // Default player names
        this.timerRunning = false;
        this.timeElapsed = 0;
        this.singlePlayerMode = false;  // Two-player mode by default
        this.moves = 0;  // Counter for number of moves made

        // Cache for AI minimax algorithm optimization
        this.minimaxCache = new Map();
        this.MAX_CACHE_SIZE = 1000;

        // Get and store DOM element references
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
        
        // Scoreboard element references
        this.xScoreDisplay = document.getElementById('x-score');
        this.oScoreDisplay = document.getElementById('o-score');

        // Utility function for input debouncing
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

        // Initialize game components
        this.setupEventListeners();
        this.updateScoreDisplay();
        this.startTimer();

        // Initially disable reset button until first move
        this.resetStatsButton.disabled = true;

        // Timer animation frame ID for cleanup
        this.timerFrameId = null;
    }

    // Set up all event listeners for game interactions
    setupEventListeners() {
        // Optimize board click handling with event delegation
        const gameBoard = document.querySelector('.game-board');
        gameBoard.addEventListener('click', (event) => {
            const cell = event.target.closest('.cell');
            if (cell) {
                this.handleMove(parseInt(cell.dataset.index));
            }
        });

        // Control buttons event delegation
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

        // Player name input handling with debouncing
        const updatePlayerName = this.debounce((player, input) => {
            const name = this.sanitizeInput(input.value.trim()) || player;
            this.playerNames[player] = name;
            this.updateScoreDisplay();
            this.updateCurrentPlayerDisplay();
        }, 250);

        // Add input listeners for player names
        this.playerXInput.addEventListener('input', () => updatePlayerName('X', this.playerXInput));
        this.playerOInput.addEventListener('input', () => updatePlayerName('O', this.playerOInput));

        // Game mode toggle listener
        this.modeSwitch.addEventListener('change', () => this.toggleGameMode());
    }

    // Update scoreboard display with current scores and player names
    updateScoreDisplay() {
        const xName = this.playerNames.X || 'X';
        const oName = this.playerNames.O || 'O';
        this.xScoreDisplay.parentElement.innerHTML = `${xName}: <span id="x-score">${this.playerXScore}</span>`;
        this.oScoreDisplay.parentElement.innerHTML = `${oName}: <span id="o-score">${this.playerOScore}</span>`;
        
        // Re-cache score display elements after innerHTML update
        this.xScoreDisplay = document.getElementById('x-score');
        this.oScoreDisplay = document.getElementById('o-score');
    }

    // Update current player display with name and turn indicator
    updateCurrentPlayerDisplay() {
        this.currentPlayerDisplay.textContent = `Current Player: ${this.playerNames[this.currentPlayer]}`;
        this.currentPlayerDisplay.classList.remove('x-turn', 'o-turn');
        this.currentPlayerDisplay.classList.add(this.currentPlayer.toLowerCase() + '-turn');
    }

    // Handle player move on cell click
    handleMove(index) {
        if (this.board[index] === '' && !this.checkWinner() && !this.gameOver) {
            // Start timer on first move
            if (!this.timerRunning) {
                this.timerRunning = true;
                this.startTime = Date.now();
                this.updateTimer();
            }

            // Make the player's move
            this.makeMove(index);

            // Handle AI move in single player mode
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

    // Process a move at the given index
    makeMove(index) {
        this.updateBoard(index);
        this.updateMoveHistory(index);
        this.checkGameState();

        // Enable reset button after first move
        this.resetStatsButton.disabled = false;
    }

    // Update the game board with the current move
    updateBoard(index) {
        this.board[index] = this.currentPlayer;
        const cell = this.cells[index];
        cell.textContent = this.currentPlayer;
        cell.classList.add(this.currentPlayer.toLowerCase());

        // Update move counter
        this.moves++;
        this.movesDisplay.textContent = `Moves: ${this.moves}`;
    }

    // Record move in history and update display
    updateMoveHistory(index) {
        const row = Math.floor(index / 3) + 1;
        const col = (index % 3) + 1;
        const moveTime = this.timerDisplay.textContent.replace('Time: ', '');
        const playerName = this.playerNames[this.currentPlayer];
        const moveText = `[${moveTime}] ${playerName}: (${row},${col})\n`;
        this.historyText.textContent += moveText;
        this.historyText.scrollTop = this.historyText.scrollHeight;

        // Store move for undo functionality
        this.moveHistory.push({ index, player: this.currentPlayer });
        this.undoMoveButton.disabled = false;
    }

    // Check game state after each move
    checkGameState() {
        if (this.checkWinner()) {
            this.handleWin();
        } else if (!this.board.includes('')) {
            this.handleDraw();
        } else {
            this.switchPlayer();
        }
    }

    // Switch to the next player
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        this.updateCurrentPlayerDisplay();
    }

    // AI move calculation and execution
    makeAIMove() {
        const move = this.findBestMove();
        if (move !== null) {
            this.makeMove(move);
        }
    }

    // Find the best move using minimax algorithm with improved evaluation
    findBestMove() {
        let bestScore = -Infinity;
        let bestMoves = [];
        let alpha = -Infinity;
        let beta = Infinity;

        // First two moves strategy
        if (this.moveHistory.length === 0) {
            // First move: Take center or corner
            return 4; // Always take center first
        } else if (this.moveHistory.length === 2) {
            // Second move: If center is taken, take corner. If corner is taken, take center
            if (this.board[4] === 'X') {
                const corners = [0, 2, 6, 8];
                return corners[Math.floor(Math.random() * corners.length)];
            } else {
                return 4;
            }
        }

        // Try each available move
        for (let i = 0; i < 9; i++) {
            if (this.board[i] === '') {
                this.board[i] = 'O';
                let score = this.minimax(this.board, 0, false, alpha, beta) + this.evaluatePosition(i);
                this.board[i] = '';

                if (score > bestScore) {
                    bestScore = score;
                    bestMoves = [i];
                } else if (score === bestScore) {
                    bestMoves.push(i);
                }
                alpha = Math.max(alpha, bestScore);
            }
        }

        // If we can win immediately, do it
        for (const move of bestMoves) {
            this.board[move] = 'O';
            if (this.checkWinnerForMinimax() === 'O') {
                this.board[move] = '';
                return move;
            }
            this.board[move] = '';
        }

        // If opponent can win next move, block it
        for (let i = 0; i < 9; i++) {
            if (this.board[i] === '') {
                this.board[i] = 'X';
                if (this.checkWinnerForMinimax() === 'X') {
                    this.board[i] = '';
                    return i;
                }
                this.board[i] = '';
            }
        }

        // Choose randomly from best moves for less predictability
        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }

    // Evaluate the strategic value of a position
    evaluatePosition(index) {
        let score = 0;
        const board = this.board;

        // Strategic position values
        const positionValues = [
            5, 3, 5, // Corners are highly valued
            3, 8, 3, // Center is most valuable
            5, 3, 5  // Corners are highly valued
        ];
        score += positionValues[index] * 0.5;

        // Check for potential fork opportunities
        if (this.canCreateFork(index, 'O')) {
            score += 50;
        }

        // Block opponent's fork opportunities
        if (this.canCreateFork(index, 'X')) {
            score += 40;
        }

        // Evaluate lines (rows, columns, diagonals)
        score += this.evaluateLines(index);

        return score;
    }

    // Check if a move can create a fork (two winning opportunities)
    canCreateFork(index, player) {
        if (this.board[index] !== '') return false;
        
        this.board[index] = player;
        let winningLines = 0;
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6] // diagonals
        ];

        for (const line of lines) {
            let playerCount = 0;
            let emptyCount = 0;
            for (const pos of line) {
                if (this.board[pos] === player) playerCount++;
                if (this.board[pos] === '') emptyCount++;
            }
            if (playerCount === 2 && emptyCount === 1) winningLines++;
        }

        this.board[index] = '';
        return winningLines >= 2;
    }

    // Evaluate potential lines (rows, columns, diagonals)
    evaluateLines(index) {
        let score = 0;
        const lines = this.getLinesForPosition(index);

        for (const line of lines) {
            let oCount = 0;
            let xCount = 0;
            let emptyCount = 0;

            for (const pos of line) {
                if (this.board[pos] === 'O') oCount++;
                else if (this.board[pos] === 'X') xCount++;
                else emptyCount++;
            }

            // Evaluate line potential
            if (oCount === 2 && emptyCount === 1) score += 30; // Near win
            if (xCount === 2 && emptyCount === 1) score += 25; // Block opponent
            if (oCount === 1 && emptyCount === 2) score += 5;  // Potential line
            if (xCount === 1 && emptyCount === 2) score += 3;  // Block potential line
        }

        return score;
    }

    // Get all lines that contain the given position
    getLinesForPosition(index) {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6] // diagonals
        ];

        return lines.filter(line => line.includes(index));
    }

    // Enhanced minimax algorithm with strategic position evaluation
    minimax(board, depth, isMaximizing, alpha, beta) {
        const boardKey = board.join('');
        
        if (this.minimaxCache.has(boardKey)) {
            return this.minimaxCache.get(boardKey);
        }

        let result = this.checkWinnerForMinimax();
        if (result !== null) {
            const score = result === 'O' ? 1000 - depth : depth - 1000; // Much higher stakes
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

    // Enhanced win checking for minimax
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