class TicTacToe {
    constructor() {
        this.currentPlayer = 'X';
        this.board = Array(9).fill('');
        this.scores = {
            X: 0,
            O: 0
        };
        this.moveHistory = [];
        
        // DOM elements
        this.cells = document.querySelectorAll('.cell');
        this.resetButton = document.getElementById('reset-button');
        this.resetAllButton = document.getElementById('reset-all-button');
        this.xScoreElement = document.getElementById('x-score');
        this.oScoreElement = document.getElementById('o-score');
        
        // Event listeners
        this.cells.forEach(cell => {
            cell.addEventListener('click', () => this.handleCellClick(cell));
        });
        this.resetButton.addEventListener('click', () => this.resetBoard());
        this.resetAllButton.addEventListener('click', () => this.resetAll());
    }

    handleCellClick(cell) {
        const index = cell.dataset.index;
        if (this.board[index] === '') {
            this.board[index] = this.currentPlayer;
            cell.textContent = this.currentPlayer;
            cell.classList.add(this.currentPlayer.toLowerCase());
            this.moveHistory.push(index);
            
            if (this.checkWinner()) {
                this.updateScore();
                setTimeout(() => {
                    alert(`Player ${this.currentPlayer} wins!`);
                    this.resetBoard();
                }, 100);
            } else if (!this.board.includes('')) {
                setTimeout(() => {
                    alert("It's a tie!");
                    this.resetBoard();
                }, 100);
            } else {
                this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
            }
        }
    }

    checkWinner() {
        const winCombinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6] // diagonals
        ];

        for (let combo of winCombinations) {
            if (this.board[combo[0]] === this.currentPlayer &&
                this.board[combo[1]] === this.currentPlayer &&
                this.board[combo[2]] === this.currentPlayer) {
                
                // Animate winning cells
                combo.forEach(index => {
                    this.cells[index].classList.add('winner');
                });
                
                return true;
            }
        }
        return false;
    }

    updateScore() {
        this.scores[this.currentPlayer]++;
        if (this.currentPlayer === 'X') {
            this.xScoreElement.textContent = this.scores.X;
        } else {
            this.oScoreElement.textContent = this.scores.O;
        }
    }

    resetBoard() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.moveHistory = [];
        this.cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('x', 'o', 'winner');
        });
    }

    resetAll() {
        this.scores = {
            X: 0,
            O: 0
        };
        this.xScoreElement.textContent = '0';
        this.oScoreElement.textContent = '0';
        this.resetBoard();
    }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TicTacToe();
});

// Theme toggle functionality
document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    document.getElementById('theme-toggle').textContent = isDarkMode ? '☀️' : '🌙';
}); 