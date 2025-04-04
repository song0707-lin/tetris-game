class Tetris {
    constructor() {
        // 初始化遊戲板（20行10列的二維陣列）
        this.board = Array(20).fill().map(() => Array(10).fill(0));
        this.score = 0;          // 分數計數器
        this.level = 1;          // 遊戲等級
        this.gameBoard = document.querySelector('.game-board');
        this.init();

        // 定義七種俄羅斯方塊的形狀
        this.shapes = {
            I: [[1, 1, 1, 1]],           // I型方塊
            L: [[1, 0], [1, 0], [1, 1]], // L型方塊
            J: [[0, 1], [0, 1], [1, 1]], // J型方塊
            O: [[1, 1], [1, 1]],         // O型方塊
            Z: [[1, 1, 0], [0, 1, 1]],   // Z型方塊
            S: [[0, 1, 1], [1, 1, 0]],   // S型方塊
            T: [[1, 1, 1], [0, 1, 0]]    // T型方塊
        };

        // 遊戲狀態變數
        this.currentPiece = null;         // 當前移動的方塊
        this.currentPosition = { x: 0, y: 0 }; // 當前方塊位置
        this.gameInterval = null;         // 遊戲計時器
        this.isPlaying = false;           // 遊戲狀態標記

        // 定義每種方塊的顏色
        this.colors = {
            I: '#00f0f0',  // 青色
            O: '#f0f000',  // 黃色
            T: '#a000f0',  // 紫色
            S: '#00f000',  // 綠色
            Z: '#f00000',  // 紅色
            J: '#0000f0',  // 藍色
            L: '#f0a000'   // 橙色
        };
        
        this.currentShape = null;  // 保存當前方塊的形狀名稱
        this.hasKeyListener = false; // 追踪鍵盤事件監聽器狀態
        this.handleKeyPress = this.handleKeyPress.bind(this); // 綁定事件處理器
    }

    // 初始化遊戲板UI
    init() {
        // 創建 20x10 的網格
        for (let row = 0; row < 20; row++) {
            for (let col = 0; col < 10; col++) {
                const block = document.createElement('div');
                block.classList.add('block');
                this.gameBoard.appendChild(block);
            }
        }
    }

    // 生成新的方塊
    generateNewPiece() {
        const shapes = Object.keys(this.shapes);
        const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
        this.currentPiece = this.shapes[randomShape];
        this.currentShape = randomShape;
        // 在頂部中間位置生成新方塊
        this.currentPosition = {
            x: Math.floor((10 - this.currentPiece[0].length) / 2),
            y: 0
        };
    }

    // 方塊向下移動
    moveDown() {
        if (this.canMove(this.currentPosition.x, this.currentPosition.y + 1)) {
            this.currentPosition.y++;
            this.updateBoardDisplay();
        } else {
            this.freezePiece();
            this.checkLines();
            this.generateNewPiece();
            if (!this.canMove(this.currentPosition.x, this.currentPosition.y)) {
                this.gameOver();
            }
        }
    }

    // 方塊向左移動
    moveLeft() {
        if (this.canMove(this.currentPosition.x - 1, this.currentPosition.y)) {
            this.currentPosition.x--;
            this.updateBoardDisplay();
        }
    }

    // 方塊向右移動
    moveRight() {
        if (this.canMove(this.currentPosition.x + 1, this.currentPosition.y)) {
            this.currentPosition.x++;
            this.updateBoardDisplay();
        }
    }

    // 方塊旋轉
    rotate() {
        // 矩陣轉置後反轉每行實現旋轉
        const rotated = this.currentPiece[0].map((_, i) =>
            this.currentPiece.map(row => row[i]).reverse()
        );
        
        if (this.canMove(this.currentPosition.x, this.currentPosition.y, rotated)) {
            this.currentPiece = rotated;
            this.updateBoardDisplay();
        }
    }

    // 檢查移動是否有效
    canMove(newX, newY, piece = this.currentPiece) {
        for (let y = 0; y < piece.length; y++) {
            for (let x = 0; x < piece[y].length; x++) {
                if (piece[y][x]) {
                    const nextX = newX + x;
                    const nextY = newY + y;
                    
                    // 檢查邊界和碰撞
                    if (nextX < 0 || nextX >= 10 || nextY >= 20) return false;
                    if (nextY >= 0 && this.board[nextY][nextX]) return false;
                }
            }
        }
        return true;
    }

    // 更新遊戲板顯示
    updateBoardDisplay() {
        const blocks = this.gameBoard.querySelectorAll('.block');
        // 清除所有方塊的顏色
        blocks.forEach(block => {
            block.classList.remove('active');
            block.style.backgroundColor = '#fff';
        });

        // 顯示已凍結的方塊
        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 10; x++) {
                if (this.board[y][x]) {
                    const position = y * 10 + x;
                    blocks[position].style.backgroundColor = this.colors[this.board[y][x]];
                }
            }
        }

        // 顯示當前活動方塊
        if (this.currentPiece) {
            requestAnimationFrame(() => {
                for (let y = 0; y < this.currentPiece.length; y++) {
                    for (let x = 0; x < this.currentPiece[y].length; x++) {
                        if (this.currentPiece[y][x]) {
                            const position = (this.currentPosition.y + y) * 10 + (this.currentPosition.x + x);
                            if (position >= 0) {
                                blocks[position].style.backgroundColor = this.colors[this.currentShape];
                            }
                        }
                    }
                }
            });
        }
    }

    // 開始遊戲
    start() {
        if (this.isPlaying) return;
        
        this.reset();
        this.isPlaying = true;
        this.generateNewPiece();
        // 設置遊戲速度
        const speed = Math.max(100, 1000 - (this.level - 1) * 100);
        this.gameInterval = setInterval(() => this.moveDown(), speed);
        
        // 添加鍵盤控制
        if (!this.hasKeyListener) {
            document.addEventListener('keydown', this.handleKeyPress);
            this.hasKeyListener = true;
        }
    }

    // 處理鍵盤輸入
    handleKeyPress(event) {
        console.log('Key pressed:', event.code);

        // P鍵：暫停/繼續
        if (event.code === 'KeyP') {
            if (this.isPlaying) {
                this.pause();
            } else if (this.currentPiece) {
                this.resume();
            }
            return;
        }

        // 空白鍵：快速下落
        if (event.code === 'Space') {
            event.preventDefault();
            if (this.isPlaying) {
                this.hardDrop();
            }
            return;
        }

        // 其他控制鍵
        if (!this.isPlaying) return;

        switch (event.code) {
            case 'ArrowLeft':  // 左移
                this.moveLeft();
                break;
            case 'ArrowRight': // 右移
                this.moveRight();
                break;
            case 'ArrowDown':  // 加速下落
                this.moveDown();
                break;
            case 'KeyZ':       // 旋轉
                this.rotate();
                break;
        }
    }

    // 凍結方塊
    freezePiece() {
        for (let y = 0; y < this.currentPiece.length; y++) {
            for (let x = 0; x < this.currentPiece[y].length; x++) {
                if (this.currentPiece[y][x]) {
                    const boardY = this.currentPosition.y + y;
                    const boardX = this.currentPosition.x + x;
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentShape;
                    }
                }
            }
        }
        this.updateBoardDisplay();
    }

    // 檢查並消除完整的行
    checkLines() {
        let linesCleared = 0;
        
        for (let y = 19; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(10).fill(0));
                linesCleared++;
                y++; // 重新檢查當前行
            }
        }

        if (linesCleared > 0) {
            this.updateScore(linesCleared);
            this.updateBoardDisplay();
        }
    }

    // 更新分數和等級
    updateScore(linesCleared) {
        const points = [0, 100, 300, 500, 800];  // 消除1-4行的分數
        this.score += points[linesCleared];
        this.level = Math.floor(this.score / 1000) + 1;
        
        // 更新顯示
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        
        // 調整遊戲速度
        clearInterval(this.gameInterval);
        const speed = Math.max(100, 1000 - (this.level - 1) * 100);
        this.gameInterval = setInterval(() => this.moveDown(), speed);
    }

    // 遊戲結束處理
    gameOver() {
        this.isPlaying = false;
        clearInterval(this.gameInterval);
        alert(`遊戲結束！\n最終分數：${this.score}\n等級：${this.level}`);
    }

    // 暫停遊戲
    pause() {
        if (this.isPlaying) {
            clearInterval(this.gameInterval);
            this.isPlaying = false;
            document.getElementById('pause-btn').textContent = '繼續';
            document.getElementById('pause-screen').style.display = 'flex';
        }
    }

    // 繼續遊戲
    resume() {
        if (!this.isPlaying && this.currentPiece) {
            this.isPlaying = true;
            const speed = Math.max(100, 1000 - (this.level - 1) * 100);
            this.gameInterval = setInterval(() => this.moveDown(), speed);
            document.getElementById('pause-btn').textContent = '暫停';
            document.getElementById('pause-screen').style.display = 'none';
        }
    }

    // 重置遊戲
    reset() {
        clearInterval(this.gameInterval);
        this.board = Array(20).fill().map(() => Array(10).fill(0));
        this.score = 0;
        this.level = 1;
        this.isPlaying = false;
        this.currentPiece = null;
        this.updateBoardDisplay();
        document.getElementById('score').textContent = '0';
        document.getElementById('level').textContent = '1';
        document.getElementById('pause-btn').textContent = '暫停';
        document.getElementById('pause-screen').style.display = 'none';
    }

    // 快速下落到底部
    hardDrop() {
        let dropDistance = 0;
        // 計算可以下落的最大距離
        while (this.canMove(this.currentPosition.x, this.currentPosition.y + 1)) {
            this.currentPosition.y++;
            dropDistance++;
        }
        this.updateBoardDisplay();
        
        this.freezePiece();
        this.checkLines();
        this.generateNewPiece();
        if (!this.canMove(this.currentPosition.x, this.currentPosition.y)) {
            this.gameOver();
        }

        // 根據下落距離增加分數
        this.score += dropDistance;
        document.getElementById('score').textContent = this.score;
    }
}

// 初始化遊戲
document.addEventListener('DOMContentLoaded', () => {
    const game = new Tetris();
    
    // 綁定按鈕事件
    document.getElementById('start-btn').addEventListener('click', () => {
        game.start();
    });

    document.getElementById('pause-btn').addEventListener('click', () => {
        if (game.isPlaying) {
            game.pause();
        } else {
            game.resume();
        }
    });

    document.getElementById('reset-btn').addEventListener('click', () => {
        game.reset();
    });
}); 