//global for the game board display
var gameBoard = null;
//global for game business logic
var gameLogic = null;
//global for the game initiation (create / join) display
var gameInitiationDisplay = null;
//global game cancel display
var gameCancelDisplay = null;
//global game instructions display
var gameInstructionsDisplay = null;

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
	gameInstructionsDisplay = new GameInstructionsDisplay();
	
  networkRequests = new NetworkRequests();
  errorDisplay = new ErrorDisplay();
  spinnerDisplay = new SpinnerDisplay();

  font = loadFont('fonts/SpecialElite-Regular.ttf')
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  setupPlayArea();

  //Initial get status call to see if a game is already running
  gameLogic.getStatus();
}

function draw() {

  if (didChangeState) {
    //Always setup game board - overall background
    gameBoard.setup();

		if (gameInstructionsDisplay.isDisplayed()) {
			//Show instructions
			gameInstructionsDisplay.draw();
      gameInitiationDisplay.hideCodeInput();
		}
    else if (gameCancelDisplay.isDisplayed()) {
      //Show continue / cancel overlay
      gameCancelDisplay.draw();
    }
    else if (!gameLogic.isInGame() || gameLogic.isWaitingForPlayers()) {
      //If not in game, or in game and waiting for players, show game initiation screen
      gameInitiationDisplay.draw();
      spinnerDisplay.reset(); //to force re-draw of spinner background
    }
    else {
      //Show game board
      gameInitiationDisplay.hideCodeInput();
      gameBoard.draw();
    }
    didChangeState = false;
  }

  //Overlay errors if have errors
  if (errorDisplay.haveErrors()) {
    errorDisplay.draw();
  }

  //Keep spinner spinning
  if (spinnerDisplay.isSpinning() && !gameCancelDisplay.isDisplayed()) {
    gameInitiationDisplay.hideCodeInput();
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

//use mousePressed() rather than touch () - touch doesn't work on Firefox browser
function mousePressed() {
	
	//If game instructions see if click on close
	if (gameInstructionsDisplay.isDisplayed()) {
    const ret = gameInstructionsDisplay.hitCheck();
    if (ret === false) { return; }  //keep displaying
		//hide
		gameInstructionsDisplay.clearDisplayed();
		didChangeState = true;
		return;
	}
	
  //If continue / cancel see if click on continue or OK
  if (gameCancelDisplay.isDisplayed()) {
    const ret = gameCancelDisplay.hitCheck();
    if (ret === false) { return; }  //keep displaying
    //Either Cancel or OK hit - hide display
    gameCancelDisplay.clearDisplayed();
    if (ret.action == 'continue') {
      //Action depends on state
      if (gameLogic.isEnded()) {
        //Back to game initiation
        gameLogic.resetGame();
      }
      else {
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
    //No other clicks permitted so return
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
    //No other clicks permitted so return
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
      gameLogic.joinGame(ret.code);
    }
    else if (ret.action == 'instructions') {
			//Show instructions
			gameInstructionsDisplay.setDisplayed();
    }
    else if (ret.action == 'toggleBot') {
      //Just need to re-draw the board as toggle happened in gameInitiationDisplay
    }
    //re-draw the board
    didChangeState = true;
    return;
  }

  //See if clicked on the game board. Returns false to ignore. Returns object with action if click on card or close or refresh
  const ret = gameBoard.hitCheck();
  if (ret === false) { return; }

  if (ret.action == 'refresh') {
    //state change - refresh
    didChangeState = true;
  }
  else if (ret.action == 'playRound') {
    //Object returned has card, row and col set: play this card
    gameLogic.playRound(ret.card, ret.row, ret.col);
  }
  else if (ret.action == 'cancel') {
    //game cancel - check
    gameCancelDisplay.title = gameLogic.isEnded() ? 'Reset game and go back to start screen?' : 'Are you sure you want to end this game?';
    gameCancelDisplay.setDisplayed();
    didChangeState = true;
  }

}
