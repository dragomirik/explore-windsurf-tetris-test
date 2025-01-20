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
        
        // Tetromino colors
        this.colors = {
            'I': '#00f0f0',
            'O': '#f0f000',
            'T': '#a000f0',
            'S': '#00f000',
            'Z': '#f00000',
            'J': '#0000f0',
            'L': '#f0a000'
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
        // Clear canvas
        this.ctx.fillStyle = 'rgba(0, 0, 15, 0.95)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw board
        this.board.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    this.ctx.fillStyle = this.colors[value];
                    this.ctx.fillRect(x * this.blockSize, y * this.blockSize, 
                        this.blockSize - 1, this.blockSize - 1);
                }
            });
        });

        // Draw current piece
        if (this.currentPiece) {
            this.currentPiece.shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value) {
                        this.ctx.fillStyle = this.currentPiece.color;
                        this.ctx.fillRect(
                            (this.currentPiece.x + x) * this.blockSize,
                            (this.currentPiece.y + y) * this.blockSize,
                            this.blockSize - 1,
                            this.blockSize - 1
                        );
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
                    ctx.fillRect(
                        offsetX + x * blockSize,
                        offsetY + y * blockSize,
                        blockSize - 1,
                        blockSize - 1
                    );
                }
            });
        });
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
        if (this.gameOver || this.paused) return;

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
            case 80: // P key
                this.togglePause();
                break;
        }
    }

    togglePause() {
        this.paused = !this.paused;
        const pauseIcon = document.getElementById('pauseIcon');
        pauseIcon.src = this.paused ? 'play.svg' : 'pause.svg';
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

        if (!this.paused) {
            this.dropCounter += deltaTime;
            if (this.dropCounter > this.dropInterval) {
                this.drop();
            }
        }

        this.draw();
        requestAnimationFrame(this.gameLoop.bind(this));
    }
}

// Create pause icon
const pauseSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
</svg>`;

const playSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z"/>
</svg>`;

// Create SVG files
const createSvgFile = (filename, content) => {
    const blob = new Blob([content], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Initialize game when window loads
window.onload = () => {
    createSvgFile('pause.svg', pauseSvg);
    createSvgFile('play.svg', playSvg);
    new Tetris();
};
