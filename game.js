class Tetris {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.holdCanvas = document.getElementById('holdCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.holdCtx = this.holdCanvas.getContext('2d');

        // Set canvas sizes
        this.canvas.width = 300;
        this.canvas.height = 600;
        this.nextCanvas.width = 100;
        this.nextCanvas.height = 100;
        this.holdCanvas.width = 100;
        this.holdCanvas.height = 100;

        this.blockSize = 30;
        this.cols = 10;
        this.rows = 20;
        
        // Game state
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.paused = false;
        
        // Tetromino colors with modern, vibrant colors
        this.colors = {
            'I': '#00E5FF', // Cyan
            'O': '#FFD700', // Gold
            'T': '#FF4081', // Pink
            'S': '#00E676', // Green
            'Z': '#FF1744', // Red
            'J': '#2979FF', // Blue
            'L': '#FF9100'  // Orange
        };

        // Tetromino shapes
        this.shapes = {
            'I': [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
            'O': [[1,1], [1,1]],
            'T': [[0,1,0], [1,1,1], [0,0,0]],
            'S': [[0,1,1], [1,1,0], [0,0,0]],
            'Z': [[1,1,0], [0,1,1], [0,0,0]],
            'J': [[1,0,0], [1,1,1], [0,0,0]],
            'L': [[0,0,1], [1,1,1], [0,0,0]]
        };

        this.currentPiece = this.generatePiece();
        this.nextPiece = this.generatePiece();
        this.holdPiece = null;
        this.canHold = true;

        // Bind event listeners
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        const pauseButton = document.getElementById('pauseButton');
        pauseButton.addEventListener('click', () => this.togglePause());
        
        // Start game loop
        this.lastTime = 0;
        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.gameLoop();
    }

    generatePiece() {
        const pieces = 'IOTSZJL';
        const type = pieces[Math.floor(Math.random() * pieces.length)];
        return {
            type,
            shape: this.shapes[type],
            color: this.colors[type],
            x: Math.floor(this.cols / 2) - Math.floor(this.shapes[type][0].length / 2),
            y: 0
        };
    }

    draw() {
        // Clear canvas with a darker background
        this.ctx.fillStyle = 'rgba(8, 8, 16, 0.95)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid background
        for (let x = 0; x < this.cols; x++) {
            if (x % 2 === 0) {
                this.ctx.fillStyle = 'rgba(16, 16, 24, 0.95)';
                this.ctx.fillRect(x * this.blockSize, 0, this.blockSize, this.canvas.height);
            }
        }

        // Draw grid lines
        this.ctx.strokeStyle = 'rgba(40, 40, 50, 0.95)';
        this.ctx.lineWidth = 1;
        for (let y = 0; y <= this.rows; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.blockSize);
            this.ctx.lineTo(this.canvas.width, y * this.blockSize);
            this.ctx.stroke();
        }

        // Draw vertical grid lines
        for (let x = 0; x <= this.cols; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.blockSize, 0);
            this.ctx.lineTo(x * this.blockSize, this.canvas.height);
            this.ctx.stroke();
        }

        // Draw board
        this.board.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    this.ctx.fillStyle = this.colors[value];
                    // Add gradient effect to blocks
                    const gradient = this.ctx.createLinearGradient(
                        x * this.blockSize,
                        y * this.blockSize,
                        (x + 1) * this.blockSize,
                        (y + 1) * this.blockSize
                    );
                    gradient.addColorStop(0, this.colors[value]);
                    gradient.addColorStop(1, this.adjustColor(this.colors[value], -20));
                    this.ctx.fillStyle = gradient;
                    this.ctx.fillRect(x * this.blockSize, y * this.blockSize, 
                        this.blockSize - 1, this.blockSize - 1);
                    
                    // Add highlight
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                    this.ctx.fillRect(x * this.blockSize, y * this.blockSize,
                        this.blockSize - 1, 2);
                }
            });
        });

        // Draw current piece
        if (this.currentPiece) {
            this.currentPiece.shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value) {
                        this.ctx.fillStyle = this.currentPiece.color;
                        // Add gradient effect to blocks
                        const gradient = this.ctx.createLinearGradient(
                            (this.currentPiece.x + x) * this.blockSize,
                            (this.currentPiece.y + y) * this.blockSize,
                            (this.currentPiece.x + x + 1) * this.blockSize,
                            (this.currentPiece.y + y + 1) * this.blockSize
                        );
                        gradient.addColorStop(0, this.currentPiece.color);
                        gradient.addColorStop(1, this.adjustColor(this.currentPiece.color, -20));
                        this.ctx.fillStyle = gradient;
                        this.ctx.fillRect(
                            (this.currentPiece.x + x) * this.blockSize,
                            (this.currentPiece.y + y) * this.blockSize,
                            this.blockSize - 1,
                            this.blockSize - 1
                        );
                        
                        // Add highlight
                        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                        this.ctx.fillRect(
                            (this.currentPiece.x + x) * this.blockSize,
                            (this.currentPiece.y + y) * this.blockSize,
                            this.blockSize - 1, 2);
                    }
                });
            });
        }

        // Draw next piece
        this.drawPreviewPiece(this.nextCtx, this.nextPiece);
        
        // Draw hold piece
        if (this.holdPiece) {
            this.drawPreviewPiece(this.holdCtx, this.holdPiece);
        } else {
            this.holdCtx.fillStyle = 'rgba(0, 0, 15, 0.8)';
            this.holdCtx.fillRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
        }

        // Draw pause overlay if game is paused
        if (this.paused) {
            // Semi-transparent overlay
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Pause text
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 24px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
            
            // Instruction text
            this.ctx.font = '16px sans-serif';
            this.ctx.fillText('Press P to resume', this.canvas.width / 2, this.canvas.height / 2 + 40);
        }
    }

    drawPreviewPiece(ctx, piece) {
        ctx.fillStyle = 'rgba(0, 0, 15, 0.8)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        const blockSize = 20;
        const offsetX = (ctx.canvas.width - piece.shape[0].length * blockSize) / 2;
        const offsetY = (ctx.canvas.height - piece.shape.length * blockSize) / 2;

        piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    ctx.fillStyle = piece.color;
                    // Add gradient effect to blocks
                    const gradient = ctx.createLinearGradient(
                        offsetX + x * blockSize,
                        offsetY + y * blockSize,
                        offsetX + (x + 1) * blockSize,
                        offsetY + (y + 1) * blockSize
                    );
                    gradient.addColorStop(0, piece.color);
                    gradient.addColorStop(1, this.adjustColor(piece.color, -20));
                    ctx.fillStyle = gradient;
                    ctx.fillRect(
                        offsetX + x * blockSize,
                        offsetY + y * blockSize,
                        blockSize - 1,
                        blockSize - 1
                    );
                    
                    // Add highlight
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                    ctx.fillRect(
                        offsetX + x * blockSize,
                        offsetY + y * blockSize,
                        blockSize - 1, 2);
                }
            });
        });
    }

    adjustColor(color, amount) {
        return '#' + color.replace(/^#/, '').replace(/../g, color => 
            ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
    }

    collide() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x] &&
                    (this.board[y + this.currentPiece.y] &&
                    this.board[y + this.currentPiece.y][x + this.currentPiece.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    }

    rotate() {
        const original = this.currentPiece.shape;
        this.currentPiece.shape = this.currentPiece.shape[0].map((_, i) =>
            this.currentPiece.shape.map(row => row[i]).reverse()
        );
        
        if (this.collide()) {
            this.currentPiece.shape = original;
        }
    }

    merge() {
        this.currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    this.board[y + this.currentPiece.y][x + this.currentPiece.x] = 
                        this.currentPiece.type;
                }
            });
        });
    }

    clearLines() {
        let linesCleared = 0;
        outer: for (let y = this.board.length - 1; y >= 0; y--) {
            for (let x = 0; x < this.board[y].length; x++) {
                if (this.board[y][x] === 0) {
                    continue outer;
                }
            }
            
            const row = this.board.splice(y, 1)[0].fill(0);
            this.board.unshift(row);
            linesCleared++;
            y++;
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += linesCleared * 100 * this.level;
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
            
            // Update display
            document.getElementById('score').textContent = this.score;
            document.getElementById('lines').textContent = this.lines;
            document.getElementById('level').textContent = this.level;
        }
    }

    drop() {
        this.currentPiece.y++;
        if (this.collide()) {
            this.currentPiece.y--;
            this.merge();
            this.clearLines();
            this.currentPiece = this.nextPiece;
            this.nextPiece = this.generatePiece();
            this.canHold = true;
            
            if (this.collide()) {
                this.gameOver = true;
                alert('Game Over!');
                this.reset();
            }
        }
        this.dropCounter = 0;
    }

    move(dir) {
        this.currentPiece.x += dir;
        if (this.collide()) {
            this.currentPiece.x -= dir;
        }
    }

    hold() {
        if (!this.canHold) return;
        
        if (!this.holdPiece) {
            this.holdPiece = {
                type: this.currentPiece.type,
                shape: this.shapes[this.currentPiece.type],
                color: this.colors[this.currentPiece.type]
            };
            this.currentPiece = this.nextPiece;
            this.nextPiece = this.generatePiece();
        } else {
            const temp = {
                type: this.currentPiece.type,
                shape: this.shapes[this.currentPiece.type],
                color: this.colors[this.currentPiece.type]
            };
            this.currentPiece = {
                ...this.holdPiece,
                x: Math.floor(this.cols / 2) - Math.floor(this.holdPiece.shape[0].length / 2),
                y: 0
            };
            this.holdPiece = temp;
        }
        
        this.canHold = false;
    }

    handleKeyPress(event) {
        if (this.gameOver) return;
        
        // Only allow pause toggle when game is running
        if (event.keyCode === 80) { // P key
            this.togglePause();
            return;
        }

        // Don't process other keys when paused
        if (this.paused) return;

        switch(event.keyCode) {
            case 37: // Left
                this.move(-1);
                break;
            case 39: // Right
                this.move(1);
                break;
            case 40: // Down
                this.drop();
                break;
            case 38: // Up
                this.rotate();
                break;
            case 32: // Space
                while (!this.collide()) {
                    this.currentPiece.y++;
                }
                this.currentPiece.y--;
                this.drop();
                break;
            case 67: // C key
                this.hold();
                break;
        }
    }

    togglePause() {
        this.paused = !this.paused;
        const pauseIcon = document.getElementById('pauseIcon');
        
        if (this.paused) {
            pauseIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" fill="white"/>
            </svg>`;
        } else {
            pauseIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6zm8 0h4v16h-4z" fill="white"/>
            </svg>`;
        }
    }

    reset() {
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.currentPiece = this.generatePiece();
        this.nextPiece = this.generatePiece();
        this.holdPiece = null;
        this.canHold = true;
        this.dropInterval = 1000;
        
        // Reset display
        document.getElementById('score').textContent = '0';
        document.getElementById('lines').textContent = '0';
        document.getElementById('level').textContent = '1';
    }

    gameLoop(time = 0) {
        const deltaTime = time - this.lastTime;
        this.lastTime = time;

        if (!this.paused && !this.gameOver) {
            this.dropCounter += deltaTime;
            if (this.dropCounter > this.dropInterval) {
                this.drop();
            }
        }

        this.draw();
        requestAnimationFrame(this.gameLoop.bind(this));
    }
}

// Initialize game when window loads
window.onload = () => {
    const pauseButton = document.getElementById('pauseButton');
    const pauseIcon = document.getElementById('pauseIcon');
    pauseIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <path d="M6 4h4v16H6zm8 0h4v16h-4z" fill="white"/>
    </svg>`;
    new Tetris();
};
