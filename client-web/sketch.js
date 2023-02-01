
//global for the game board
var gameBoard = null;

var gameState = {"players": [{"name": "Player08801","color": "d9efd8","isMe": true},{"name": "COMPUTER","color": "ff0000","isMe": false}]}

var boardState = [];
var font;
var playArea = { x: 0, y: 0, width: 0, height: 0, boardTop: 0, boardHeight: 0 };
var didChangeState = true;

function preload() {
  gameBoard = new GameBoard();
  gameBoard.preload();
  font = loadFont('fonts/SpecialElite-Regular.ttf')
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  setupPlayArea();
  gameBoard.setup();
}

function draw() {
  if (didChangeState) {
    gameBoard.draw();
    didChangeState = false;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  setupPlayArea();
  gameBoard.setup();
  didChangeState = true;
}

function setupPlayArea() {
  playArea.height = windowHeight * 0.9;
  playArea.width = Math.min(playArea.height * 0.6, windowWidth);
  playArea.x = (windowWidth - playArea.width) / 2.0;
  playArea.y = (windowHeight - playArea.height) / 2.0;
  playArea.boardTop = playArea.height * 0.1 + playArea.y;
  playArea.boardHeight = playArea.height * 0.7;
}


//support mouse clicks inside visualisation if supported
/*function mouseClicked(){
}*/

//use touch started rather than mouse click - seems to be more reliable on touch devices
function touchStarted() {
//  controls.mousePressed();
}

function keyPressed() {
  //controls.keyPressed(keyCode);
}

