//global for the game board display
var gameBoard = null;
//global for game business logic
var gameLogic = null;
//global for all network requests
var networkRequests = null;
//global for displaying any errors
var errorDisplay = null;
//global for spinner overlay
var spinnerDisplay = null;

//global font for all text - preloaded
var font;
//global play area - defines the frame where all text / board is displayed
var playArea = { x: 0, y: 0, width: 0, height: 0, boardTop: 0, boardHeight: 0 };
//global state flag - used to ensure we aren't re-creating the board on each P5 frame (as un-necessary)
var didChangeState = true;

function preload() {
  gameBoard = new GameBoard();
  gameBoard.preload();
  gameLogic = new GameLogic();
  networkRequests = new NetworkRequests();
  errorDisplay = new ErrorDisplay();
  spinnerDisplay = new SpinnerDisplay();

  font = loadFont('fonts/SpecialElite-Regular.ttf')
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  setupPlayArea();
  gameBoard.setup();
  gameLogic.getStatus();
}

function draw() {

  if (didChangeState) {
    gameBoard.setup();
    gameBoard.draw();
    didChangeState = false;
  }
  if (errorDisplay.haveErrors()) {
    errorDisplay.draw();
  }
  if (spinnerDisplay.isSpinning()) {
    spinnerDisplay.draw();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  setupPlayArea();
  gameBoard.setup();
  didChangeState = true;
}

function setupPlayArea() {
  //Overall play area dimensions
  playArea.height = windowHeight * 0.9;
  playArea.width = Math.min(playArea.height * 0.6, windowWidth);
  playArea.x = (windowWidth - playArea.width) / 2.0;
  playArea.y = (windowHeight - playArea.height) / 2.0;

  //Board
  playArea.boardTop = playArea.height * 0.1 + playArea.y;
  playArea.boardHeight = playArea.height * 0.7;

  //Player cards at bottom
  playArea.playerCardsHeight = playArea.height * 0.2;
  playArea.playerCardsTop = playArea.boardTop + playArea.boardHeight;
}

//use touch started rather than mouse click - seems to be more reliable on touch devices
function touchStarted() {
  //Logic here: create game / join game etc. Depends on state.

  //Ignore if spinner showing
  if (spinnerDisplay.isSpinning()) {
    return;
  }

  //See if clicked on the game board. Returns false to ignore, true to change state and a card (string) if valid card play.
  //Only relevant if player's turn.... check state.
  if (gameLogic.isPlayersTurn()) {
    const ret = gameBoard.hitCheck();
    if (ret === true) {
      //state change - refresh
      gameBoard.draw();
    }
    else if (ret !== false) {
      //Object returned with card, row and col set: play this card
      gameLogic.playRound(ret.card, ret.row, ret.col);
    }    
  }

}

function keyPressed() {
  //controls.keyPressed(keyCode);
}

