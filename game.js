// Theme Toggle Functionality
const themeToggle = document.getElementById('theme-toggle');

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggle.checked = true;
}

// Theme toggle event listener
themeToggle.addEventListener('change', () => {
    if (themeToggle.checked) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
    }
});

class ModernTicTacToe {
    constructor() {
        this.board = [''] * 9;
        this.currentPlayer = 'X';
        this.playerXScore = 0;
        this.playerOScore = 0;
        this.moveHistory = [];
        this.timerRunning = false;
        this.startTime = null;
        this.singlePlayerMode = false;
        this.playerNames = { X: 'Player X', O: 'Player O' };
        this.moves = 0;

        this.initializeElements();
        this.setupEventListeners();
        this.updateScoreDisplay();
    }

    initializeElements() {
        // Game board cells
        this.cells = Array.from(document.querySelectorAll('.cell'));
        
        // Player inputs
        this.playerXInput = document.getElementById('player-x');
        this.playerOInput = document.getElementById('player-o');
        
        // Mode switch
        this.modeSwitch = document.getElementById('single-player-mode');
        
        // Control buttons
        this.newGameBtn = document.getElementById('new-game');
        this.undoMoveBtn = document.getElementById('undo-move');
        
        // Score displays
        this.xScoreDisplay = document.getElementById('x-score');
        this.oScoreDisplay = document.getElementById('o-score');
        
        // Game info displays
        this.currentPlayerDisplay = document.getElementById('current-player');
        this.timerDisplay = document.getElementById('timer');
        this.movesDisplay = document.getElementById('moves');
        
        // History display
        this.historyText = document.getElementById('history-text');

        // Score elements
        this.xScoreElement = document.querySelector('.x-score');
        this.oScoreElement = document.querySelector('.o-score');
    }

    setupEventListeners() {
        // Cell click events
        this.cells.forEach(cell => {
            cell.addEventListener('click', () => this.handleMove(parseInt(cell.dataset.index)));
        });

        // Control button events
        this.newGameBtn.addEventListener('click', () => this.resetBoard());
        this.undoMoveBtn.addEventListener('click', () => this.undoMove());

        // Mode switch event
        this.modeSwitch.addEventListener('change', () => this.toggleGameMode());

        // Player name input events
        this.playerXInput.addEventListener('input', () => {
            const name = this.playerXInput.value.trim() || 'Player X';
            this.playerNames.X = name;
            this.updateScoreDisplay();
            this.updateCurrentPlayerDisplay();
        });

        this.playerOInput.addEventListener('input', () => {
            const name = this.playerOInput.value.trim() || 'Player O';
            this.playerNames.O = name;
            this.updateScoreDisplay();
            this.updateCurrentPlayerDisplay();
        });
    }

    updateScoreDisplay() {
        // Update score display text
        this.xScoreElement.innerHTML = `${this.playerNames.X}: <span id="x-score">${this.playerXScore}</span>`;
        this.oScoreElement.innerHTML = `${this.playerNames.O}: <span id="o-score">${this.playerOScore}</span>`;
    }

    updateCurrentPlayerDisplay() {
        this.currentPlayerDisplay.textContent = `Current Player: ${this.playerNames[this.currentPlayer]}`;
        // Remove both classes first
        this.currentPlayerDisplay.classList.remove('x-turn', 'o-turn');
        // Add the appropriate class
        this.currentPlayerDisplay.classList.add(this.currentPlayer.toLowerCase() + '-turn');
    }

    handleMove(index) {
        if (this.board[index] === '' && !this.checkWinner()) {
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
                this.board.includes('')) {
                setTimeout(() => this.makeAIMove(), 500);
            }
        }
    }

    makeMove(index) {
        this.board[index] = this.currentPlayer;
        const cell = this.cells[index];
        cell.textContent = this.currentPlayer;
        cell.classList.add(this.currentPlayer.toLowerCase());

        // Update moves counter
        this.moves++;
        this.movesDisplay.textContent = `Moves: ${this.moves}`;

        // Record move in history
        const row = Math.floor(index / 3) + 1;
        const col = (index % 3) + 1;
        const moveTime = new Date().toLocaleTimeString();
        const moveText = `[${moveTime}] ${this.playerNames[this.currentPlayer]}: (${row},${col})\n`;
        this.historyText.textContent += moveText;
        this.historyText.scrollTop = this.historyText.scrollHeight;

        // Add to move history
        this.moveHistory.push({ index, player: this.currentPlayer });
        this.undoMoveBtn.disabled = false;

        if (this.checkWinner()) {
            this.handleWin();
        } else if (!this.board.includes('')) {
            this.handleDraw();
        } else {
            this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
            this.updateCurrentPlayerDisplay();
        }
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
        // Check terminal states
        let result = this.checkWinnerForMinimax();
        if (result !== null) {
            return result === 'O' ? 10 - depth : depth - 10;
        }
        if (!board.includes('')) {
            return 0;
        }

        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = 'O';
                    let score = this.minimax(board, depth + 1, false, alpha, beta);
                    board[i] = '';
                    bestScore = Math.max(score, bestScore);
                    alpha = Math.max(alpha, bestScore);
                    if (beta <= alpha) break; // Alpha-Beta pruning
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = 'X';
                    let score = this.minimax(board, depth + 1, true, alpha, beta);
                    board[i] = '';
                    bestScore = Math.min(score, bestScore);
                    beta = Math.min(beta, bestScore);
                    if (beta <= alpha) break; // Alpha-Beta pruning
                }
            }
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
        this.timerRunning = false;
        const winnerName = this.playerNames[this.currentPlayer];
        this.historyText.textContent += `${winnerName} wins!\n`;

        // Update score
        if (this.currentPlayer === 'X') {
            this.playerXScore++;
            this.xScoreDisplay.textContent = this.playerXScore;
        } else {
            this.playerOScore++;
            this.oScoreDisplay.textContent = this.playerOScore;
        }

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
        this.timerRunning = false;
        this.historyText.textContent += "Game Draw!\n";
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
                this.undoMoveBtn.disabled = true;
                this.timerRunning = false;
                this.startTime = null;
                this.timerDisplay.textContent = "Time: 0:00";
            }
        }
    }

    updateTimer() {
        if (this.timerRunning && this.startTime) {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            this.timerDisplay.textContent = 
                `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
            setTimeout(() => this.updateTimer(), 1000);
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
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.moveHistory = [];
        this.timerRunning = false;
        this.startTime = null;
        this.timerDisplay.textContent = "Time: 0:00";
        this.undoMoveBtn.disabled = true;
        
        // Reset moves counter
        this.moves = 0;
        this.movesDisplay.textContent = "Moves: 0";

        // Update current player display
        this.updateCurrentPlayerDisplay();

        // Update player names
        this.playerNames.X = this.playerXInput.value || 'X';
        this.playerNames.O = this.playerOInput.value || 'O';

        // Reset cells
        this.cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('x', 'o');
            cell.style.backgroundColor = '';
            cell.style.color = '';
        });

        // Add reset message to history
        this.historyText.textContent += "\n=== New Game ===\n";
        this.historyText.scrollTop = this.historyText.scrollHeight;
    }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ModernTicTacToe();
});