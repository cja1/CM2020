//global for the game board display
var gameBoard = null;
//global for game business logic
var gameLogic = null;
//global for the game initiation (create / join) display
var gameInitiationDisplay = null;
//global gameCancelDisplay
var gameCancelDisplay = null;

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
  gameInitiationDisplay = new GameInitiationDisplay();
  gameCancelDisplay = new GameCancelDisplay();

  networkRequests = new NetworkRequests();
  errorDisplay = new ErrorDisplay();
  spinnerDisplay = new SpinnerDisplay();

  font = loadFont('fonts/SpecialElite-Regular.ttf')
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  setupPlayArea();
  gameLogic.getStatus();
}

function draw() {

  if (didChangeState) {
    //Always setup game board - overall background
    gameBoard.setup();

    if (gameCancelDisplay.isDisplayed()) {
      //Show continue / cancel overlay
      gameCancelDisplay.draw();
      gameInitiationDisplay.clear();  //removes text box
    }
    else if (!gameLogic.isInGame() || gameLogic.isWaitingForPlayers()) {
      //If not in game, or in game and waiting for players, show game initiation screen
      gameInitiationDisplay.draw();
      spinnerDisplay.reset(); //to force re-draw of spinner background
    }
    else {
      //Clear gameInitiationDisplay (text input)
      gameInitiationDisplay.clear();
      //Show game board
      gameBoard.draw();
    }
    didChangeState = false;
  }

  if (errorDisplay.haveErrors()) {
    errorDisplay.draw();
  }

  if (spinnerDisplay.isSpinning() && !gameCancelDisplay.isDisplayed()) {
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

  //If continue / cancel show this
  if (gameCancelDisplay.isDisplayed()) {
    const ret = gameCancelDisplay.hitCheck();
    if (ret === false) { return; }  //keep displaying

    //Either Cancel or OK hit - hide display
    gameCancelDisplay.clearDisplayed();
    if (ret.action == 'continue') {
      //Action depends on state
      if (gameLogic.isEnded()) {
        //Back to game initiation
      }
      else {
        //HERE: the code for spinner on refresh if in game not working...
        
        //Delete the game
        gameLogic.deleteGame();
      }
    }
    didChangeState = true;
    return;
  }

  //If errors, clicks on errors only
  if (errorDisplay.haveErrors()) {
    if (errorDisplay.hitCheck()) {
      didChangeState = true;
    }
    return;
  }

  //If spinner showing, click on close only
  if (spinnerDisplay.isSpinning()) {
    if (spinnerDisplay.hitCheck()) {
      //game cancel - check
      gameCancelDisplay.title = 'Are you sure you want to end this game?';
      gameCancelDisplay.setDisplayed();
      didChangeState = true;
    }
    return;
  }

  //If not in game, clicks are on the gameInitiationDisplay
  if (!gameLogic.isInGame()) {
    const ret = gameInitiationDisplay.hitCheck();
    if (ret === false) { return; }

    if (ret.action == 'create') {
      gameLogic.createGame(ret.isPlayer2Bot);
    }
    else if (ret.action == 'join') {
      //join
      const code = ret.code;
      gameLogic.joinGame(code);
    }
    else if (ret.action == 'toggleBot') {
      gameInitiationDisplay.toggleBot();
    }
    //re-draw the board
    didChangeState = true;
    return;
  }

  //See if clicked on the game board. Returns false to ignore, true to change state and a card (string) if valid card play.
  //Only relevant if player's turn.
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
