const canvas = document.getElementById('arena');
const context = canvas.getContext('2d');
const redBlockImg = document.getElementById("red_block");
const blueBlockImg = document.getElementById("blue_block");

const ARENA_LENGTH = 12;
const ARENA_WIDTH = 16;
const GRACE_PERIOD = 3000;

//matrix color coding
const BLANK = 0;
const RED = 1;
const BLUE = 2;
const ACTIVATED_RED = 3;
const ACTIVATED_BLUE = 4;
const SCANNED_BLOCK = 9;
// 0 for nothing
// 1 for red
// 2 for blue
// 3 for activated red
// 4 for activated blue
// 9 for scanned activated block (both red and blue) 
let currentLevel = 0;
let numOfCompletedScan = 0;
const completedScansBetweenLevels = 10;
let currentScore = 0;
let currentHighScore = 0;
let gameIsOver = false;


setUpModals();

function setUpModals() {
    $('#myModal').modal({
        backdrop: 'static',
        keyboard: false
    });
    $('#gameOverModal').modal({
        backdrop: 'static',
        keyboard: false
    });




    $('#start-game-btn').on('click', () => {
        startGame();
    });

    $('#start-another-game-btn').on('click', () => {
        startAnotherGame();
    });

    $('#myModal').modal('show');
    $('#gameOverModal').modal('hide');
}

class Level {
    // ..and an (optional) custom class constructor. If one is
    // not supplied, a default constructor is used instead:
    // constructor() { }
    constructor(blockDropTime, gracePeriodTime) {
        this.blockDropTime = blockDropTime;
        this.gracePeriodTime = gracePeriodTime;
    }
}

function updateLevelIfPossible() {
    if (numOfCompletedScan > completedScansBetweenLevels && currentLevel < MAX_LEVEL - 1) {
        updateLevel();
        numOfCompletedScan = 0;
    }
}

function updateLevel() {
    currentLevel++;
    document.getElementById('level-value').innerText = currentLevel;
}

function updateHighScoreIfPossible() {
    if (currentScore > currentHighScore) {
        updateHighScore(currentScore);
    }
}

function updateHighScore(newHighScore) {
    currentHighScore = newHighScore;
    document.getElementById('highscore-value').innerText = currentHighScore;
}



function getLevelGracePeriodTime() {

    return levels[currentLevel].gracePeriodTime;
}

function getLevelBlockDropTime() {
    return levels[currentLevel].blockDropTime;
}



const levels = [
    new Level(1000, 3000),
    new Level(950, 2750),
    new Level(900, 2500),
    new Level(850, 2250),
    new Level(800, 2000),
    new Level(750, 1800),
    new Level(700, 1600),
    new Level(650, 1500),
    new Level(600, 1400),
    new Level(550, 1300),
    new Level(500, 1200),
    new Level(450, 1100),
    new Level(400, 1000),
    new Level(300, 900),
    new Level(250, 800)
];

const MAX_LEVEL = levels.length;

let dropInterval = levels[0].gracePeriodTime;

class Arena {
    constructor(WIDTH, LENGTH) {
        this.regularSquaresMatrix = createMatrix(WIDTH, LENGTH);
        this.activatedSquaresMatrix = createMatrix(WIDTH, LENGTH);
        this.scannedSquaresMatrix = createMatrix(WIDTH, LENGTH);
    }

}


//0 based index
const LAST_COLUMN_NUM = ARENA_WIDTH - 1;

const COLLISION_PARTIAL = 'COLLISION_PARTIAL';
const COLLISION_COMPLETE = 'COLLISION_COMPLETE';
const COLLISION_NONE = 'COLLISION_NONE';
//5 seconds to scan entire row
const SCAN_TIME = 5000;
//time for scanning 1 column
const SCAN_INTERVAL = SCAN_TIME / ARENA_WIDTH;

context.scale(30, 30);


function clearActivatedSquares() {
    activatedSquares = createMatrix(ARENA_WIDTH, ARENA_LENGTH);
}

function clearScannedSquares() {
    scannedSquares = createMatrix(ARENA_WIDTH, ARENA_LENGTH);
}


//TODO here!!! do by column for effecientcy
function removeActivatedSquares() {

    alreadyScanOne = false;
    let numOfRemovedBlocks = 0;
    for (let x = 0; x < ARENA_WIDTH; ++x) {
        let replacementCol = [];
        for (let y = arena.length - 1; y >= 0; --y) {
            if (scannedSquares[y][x] !== BLANK) {
                // arena[y][x] = 'X';
                numOfRemovedBlocks++;
            } else {
                replacementCol.push(arena[y][x]);
            }
        }

        for (let y = arena.length - 1; y >= 0; --y) {
            arena[y][x] = replacementCol.shift() || 0;
        }


    }


    let scoreAddition = calculateAdditionalScore(numOfRemovedBlocks);
    updateScore(scoreAddition);


    recalculateActivatedSquares();
    clearScannedSquares();

}

function calculateAdditionalScore(numOfRemovedBlocks) {
    const currentOneBasedLevel = currentLevel + 1;
    const bonusMultiplier = Math.floor(Math.pow(1.1, currentOneBasedLevel) * 10 * Math.pow(1.1, numOfRemovedBlocks));
    return (numOfRemovedBlocks * 10) * bonusMultiplier;
}



function coordinateIsOutOfBounds(coordinate) {
    let {x, y} = coordinate;
    return !((x >= 0 && x < ARENA_WIDTH) && (y >= 0 && y < ARENA_LENGTH));
}

//problematic hasleftscanned due to not being scanned yet
function isvalidToBeScannedBlock(coordinate) {
    return hasLeftScannedRectangle(coordinate) || hasRightActivatedRectangle(coordinate);
}

function hasRightActivatedRectangle(coordinate) {
    let matrix = activatedSquares;
    return checkExistSquare(coordinate, 1, 1, activatedSquares) || checkExistSquare(coordinate, 1, -1, activatedSquares);
}

function checkExistSquare(coordinate, dirX, dirY) {
    let matrix = arena;
    const row = coordinate.y;
    const col = coordinate.x;
    const num = matrix[row][col];

    if (num === 0) {
        return false;
    }


    if (!coordinateIsOutOfBounds({
                y: row + dirY,
                x: col + dirX
            }) && matrix[row + dirY][col + dirX] === num &&
            !coordinateIsOutOfBounds({
                y: row,
                x: col + dirX
            }) && matrix[row][col + dirX] === num &&
            !coordinateIsOutOfBounds({
                y: row + dirY,
                x: col
            }) && matrix[row + dirY][col] === num) {
        return true;
    }
    return false;

}

function hasLeftScannedRectangle(coordinate) {
    return alreadyScanOne && (checkExistSquare(coordinate, -1, -1) || checkExistSquare(coordinate, -1, 1));
}

function recalculateActivatedSquares() {
    clearActivatedSquares();
    for (let x = 0; x < ARENA_WIDTH; ++x) {
        for (let y = ARENA_LENGTH - 1; y >= 0; --y) {
            if (arena[y][x] !== BLANK) {
                checkSurroundingSquares({
                    x,
                    y
                });
            } else {
                activatedSquares[y][x] = BLANK;
            }
        }
    }
}





function checkSurroundingSquares(coordinate) {
    checkSquare(coordinate, -1, -1);
    checkSquare(coordinate, 1, 1);
    checkSquare(coordinate, 1, -1);
    checkSquare(coordinate, -1, 1);
}

function checkSquare(coordinate, dirX, dirY) {
    const row = coordinate.y;
    const col = coordinate.x;
    const num = arena[row][col];

    if (num === 0) {
        return;
    }


    if (!coordinateIsOutOfBounds({
                y: row + dirY,
                x: col + dirX
            }) && arena[row + dirY][col + dirX] === num &&
            !coordinateIsOutOfBounds({
                y: row,
                x: col + dirX
            }) && arena[row][col + dirX] === num &&
            !coordinateIsOutOfBounds({
                y: row + dirY,
                x: col
            }) && arena[row + dirY][col] === num) {
        let coordinates = [];
        coordinates.push({
            x: col,
            y: row
        });
        coordinates.push({
            x: col + dirX,
            y: row
        });
        coordinates.push({
            x: col,
            y: row + dirY
        });
        coordinates.push({
            x: col + dirX,
            y: row + dirY
        });
        markForScan(coordinates, num);
    }

}

function markForScan(coordinates, num) {
    coordinates.forEach((coordinate) => {
        activatedSquares[coordinate.y][coordinate.x] = num + 2;
    });
}


function checkForReactangleMatch(listOfCoordinates) {
    listOfCoordinates.forEach((coordinate) => {
        checkSurroundingSquares(coordinate);
    });
}

function draw() {
    // context.fillStyle = '#000';
    // context.fillRect(0, 0, canvas.width, canvas.height);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "rgba(0, 0, 0, 0.0)";
    context.fillRect(0, 0, canvas.width, canvas.height);

    for (var x = 0; x < ARENA_WIDTH; x += 1) {
        context.moveTo(x, 2);
        context.lineTo(x, ARENA_LENGTH);
    }

    for (var y = 2; y < ARENA_WIDTH; y += 1) {
        context.moveTo(0, y);
        context.lineTo(ARENA_WIDTH, y);
    }

    // context.moveTo(0,0);
    // context.lineTo(ARENA_LENGTH,ARENA_LENGTH	);

    context.strokeStyle = "#ddd";
    context.stroke();



    drawMatrix(arena, {
        x: 0,
        y: 0
    });
    drawMatrix(player.matrix, player.pos);
    drawMatrix(activatedSquares, {
        x: 0,
        y: 0
    });
    drawMatrix(scannedSquares, {
        x: 0,
        y: 0
    });
    drawScan();
}


function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    const collisionCols = [];

    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {

            if (m[y][x] !== 0 &&
                    (arena[y + o.y] &&
                    arena[y + o.y][x + o.x]) !== 0) {
                collisionCols.push(x);
            }
        }
    }


    let maxPossibleCollisions = m[m.length - 1].reduce((total, x) => {
        return x !== 0 ? total + 1 : total
    }, 0);

    if (collisionCols.length >= maxPossibleCollisions) {
        return {
            type: COLLISION_COMPLETE
        };
    } else if (collisionCols.length > 0 && collisionCols.length < maxPossibleCollisions) {
        return {
            type: COLLISION_PARTIAL,
            collisionCols: collisionCols
        };
    } else {
        return {
            type: COLLISION_NONE
        };
    }


}

function getFallingOffMatrix(player, collisionCols) {
    const isStillFallingMatrix = true;
    return getSeperatedOffMatrix(player, collisionCols, isStillFallingMatrix);
}

function createEmptyMatrixPiece() {
    return [[0, 0], [0, 0]];
}

function getSeperatedOffMatrix(player, collisionCols, isStillFallingMatrix) {
    const seperatedOffMatrix = createEmptyMatrixPiece();
    const playerMatrix = player.matrix;
    for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 2; col++) {
            if (isStillFallingMatrix ^ collisionCols.includes(col)) {
                seperatedOffMatrix[row][col] = playerMatrix[row][col];
            }
        }
    }
    return seperatedOffMatrix;
}


function getCollidedOffMatrix(player, collisionCols) {
    const isStillFallingMatrix = false;
    return getSeperatedOffMatrix(player, collisionCols, isStillFallingMatrix);
}


function incompleteMerge(arena, player, collisionCols) {
    const collidedOffMatrix = getCollidedOffMatrix(player, collisionCols);
    const fallingOffMatrix = getFallingOffMatrix(player, collisionCols);

    player.matrix = collidedOffMatrix;

    merge(arena, player);

    player.matrix = fallingOffMatrix;



}

function resetScore() {
    currentScore = 0;
    document.getElementById('currentscore-value').innerText = currentScore;
}


function updateScore(additionalPoints) {
    currentScore = currentScore + additionalPoints;
    document.getElementById('currentscore-value').innerText = currentScore;
}

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function freezePlayer() {
    player.frozen = true;
}
function playerIsFrozen() {
    return player.frozen;
}

function unfreezePlayer() {
    player.frozen = false;
}

function playerDrop() {

    if (!player.fastFallFrozen) {
        dropInterval = getLevelBlockDropTime();
    }
    player.pos.y++;
    let collison = collide(arena, player);
    let collisonType = collison.type;
    if (collisonType === COLLISION_COMPLETE) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
    // arenaSweep();
    // updateScore();
    } else if (collisonType === COLLISION_PARTIAL) {
        player.pos.y--;
        incompleteMerge(arena, player, collison.collisionCols);
        player.pos.y++;
        freezePlayer();
    }

    dropCounter = 0;
}

function fastFall() {
    dropInterval = 20;
    player.fastFallFrozen = true;
}



function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player).type !== COLLISION_NONE) {
        player.pos.x -= dir;
    }
}

function playerIsWithinBoard() {
    return (player.pos.x <= 10 && player.pos.x >= 0);
}




function createRandomPiece() {
    const pieces = [];

    for (let i = 1; i <= 2; i++) {
        for (let j = 1; j <= 2; j++) {
            for (let k = 1; k <= 2; k++) {
                for (let l = 1; l <= 2; l++) {

                    pieces.push([[i, j],
                        [k, l]]);
                }
            }
        }
    }
    return pieces[Math.floor(Math.random() * 16)];
}


const arena = createMatrix(ARENA_WIDTH, ARENA_LENGTH);

// 1s and 0s to determine whether the square should be deleted on the next sweep through 
let activatedSquares = createMatrix(ARENA_WIDTH, ARENA_LENGTH);
let scannedSquares = createMatrix(ARENA_WIDTH, ARENA_LENGTH);

function scanNewColumn(columnNum) {
    let activatedSquareCount = 0;
    for (let y = ARENA_LENGTH - 1; y >= 0; --y) {
        if (activatedSquares[y][columnNum] !== 0) {
            if (isvalidToBeScannedBlock({
                        x: columnNum,
                        y: y
                    })) {
                activatedSquareCount++;
                scannedSquares[y][columnNum] = SCANNED_BLOCK;
            }
        }
    }
    const shouldRemoveScannedBlocks = (activatedSquareCount === 0);
    return shouldRemoveScannedBlocks;
}

//always display next three
const nextPieces = [createRandomPiece(), createRandomPiece(), createRandomPiece()];

function playerReset() {
    if (gameIsOver) {
        return;
    }
    updateLevelIfPossible();
    player.fastFallFrozen = false;
    dropInterval = getLevelGracePeriodTime();
    const nextPiece = nextPieces.shift();
    nextPieces.push(createRandomPiece());
    drawNextPieces();

    player.matrix = nextPiece;
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
    let hasAlreadyCollison = collide(arena, player).type !== COLLISION_NONE;
    if (hasAlreadyCollison) {
        gameOver();
    }
    unfreezePlayer();
}

function freezeGame() {
    freezePlayer();
    gameIsFrozen = true;
}

function gameOver() {
    freezeGame();
    showGameOverModal();
    updateHighScoreIfPossible();
    updateScore(0);
    gameIsOver = true;
}

function showGameOverModal() {
    const message = currentScore > currentHighScore ? `Congratulations you beat the current High Score of ${currentHighScore} with ${currentScore}!` : `You got a score of ${currentScore}. Try again to beat the current High Score of ${currentHighScore}.`;
    $('#gameOverMessage').text(message);
    $('#gameOverModal').modal('show');
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x], ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }

    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function drawMatrix(matrix, offset) {

    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value === RED) {
                context.drawImage(blueBlockImg, x + offset.x, y + offset.y, 1, 1);
            } else if (value === BLUE) {
                context.drawImage(redBlockImg, x + offset.x, y + offset.y, 1, 1);
            } else if (value === ACTIVATED_RED) {
                context.fillStyle = '#FF2437';
                context.fillRect(x + offset.x,
                    y + offset.y, 1, 1);
            } else if (value === ACTIVATED_BLUE) {
                context.fillStyle = '#06a5df';
                context.fillRect(x + offset.x,
                    y + offset.y, 1, 1);
            } else if (value === SCANNED_BLOCK) {
                context.fillStyle = 'gray';
                context.fillRect(x + offset.x,
                    y + offset.y, 1, 1);
            }
        });
    });
}

function drawScan() {
    let x = scanTime / (SCAN_INTERVAL);
    context.beginPath();
    context.strokeStyle = '#ff0000';
    context.moveTo(x, 2);
    context.lineTo(x, ARENA_LENGTH);
    context.lineWidth = 0.05;
    context.stroke();
}

let dropCounter = 0;



const player = {
    pos: {
        x: 0,
        y: 0
    },
    matrix: null,
    score: 0,
    frozen: false,
    gracePeriodFrozen: true
};

let lastTime = 0;
let scanTime = 0;
let scanIntervalTime = 0;
let scannedBlocks = Array(ARENA_WIDTH).fill(false);

function getScanTimeBlock() {
    return Math.floor(scanTime / SCAN_INTERVAL);
}

function scan(message) {
}

let isContinuousScan = false;
let alreadyScanOne = false;
function update(time = window.performance.now(), first = false) {





    if (first) {
        lastTime = time - 16;
    }

    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    scanTime += deltaTime;

    if (scanTime > SCAN_TIME) {
        numOfCompletedScan++;
        scannedBlocks = Array(ARENA_WIDTH).fill(false);
        scanTime = 0;
        removeActivatedSquares();
    }

    let scanTimeBlock = getScanTimeBlock();

    if (!scannedBlocks[scanTimeBlock]) {
        scannedBlocks[scanTimeBlock] = true;
        let shouldRemoveScannedBlocks = scanNewColumn(scanTimeBlock);
        alreadyScanOne = !shouldRemoveScannedBlocks;
        if (shouldRemoveScannedBlocks) {
            removeActivatedSquares();
        }
    }

    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    const requestId = requestAnimationFrame(update);
    return requestId;
}


function merge(arena, player) {
    let coordinates = [];
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
                coordinates.push({
                    x: (x + player.pos.x),
                    y: (y + player.pos.y)
                });
            }
        });
    });
    checkForReactangleMatch(coordinates);
}

document.addEventListener('keydown', event => {


    if (event.keyCode === 32) {
        fastFall();
    } else {

        if (!playerIsFrozen() && !player.fastFallFrozen) {
            if (event.keyCode === 37) {
                playerMove(-1);
            } else if (event.keyCode === 39) {
                playerMove(1);
            } else if (event.keyCode === 38) {
                playerRotate(-1);
            } else if (event.keyCode === 40) {
                playerRotate(1);
            } else if (event.keyCode === 13) {
                removeActivatedSquares();
            } else if (event.keyCode === 9) {
                showData();
            }
        }

    }

});


const nextPieceCanvas = document.getElementById('next-piece-canvas');
const nextPieceContext = nextPieceCanvas.getContext('2d');
const nextPiecesMatrix = createMatrix(2, 8);
nextPieceContext.scale(30, 30);
function drawNextPieces() {
    //2 block (width) by 8 (length) block with two gaps for the three next pieces

    let nextPiece = nextPieces[0];


    nextPiecesMatrix[0][0] = nextPieces[0][0][0];
    nextPiecesMatrix[0][1] = nextPieces[0][0][1];
    nextPiecesMatrix[1][0] = nextPieces[0][1][0];
    nextPiecesMatrix[1][1] = nextPieces[0][1][1];

    nextPiecesMatrix[3][0] = nextPieces[1][0][0];
    nextPiecesMatrix[3][1] = nextPieces[1][0][1];
    nextPiecesMatrix[4][0] = nextPieces[1][1][0];
    nextPiecesMatrix[4][1] = nextPieces[1][1][1];


    nextPiecesMatrix[6][0] = nextPieces[2][0][0];
    nextPiecesMatrix[6][1] = nextPieces[2][0][1];
    nextPiecesMatrix[7][0] = nextPieces[2][1][0];
    nextPiecesMatrix[7][1] = nextPieces[2][1][1];


    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 2; x++) {
            let value = nextPiecesMatrix[y][x];
            if (value === RED) {
                nextPieceContext.drawImage(blueBlockImg, x, y, 1, 1);
            } else if (value === BLUE) {
                nextPieceContext.drawImage(redBlockImg, x, y, 1, 1);

            }
        }
    }




}

let requestId = null;
function startGame() {
    playerReset();
    updateScore(0);
    updateHighScore(0);
    update(window.performance.now(), true);
}

function startAnotherGame() {
    gameIsOver = false;
    resetScore();
    arena.forEach(row => row.fill(0));
    activatedSquares.forEach(row => row.fill(0));
    playerReset();
}


