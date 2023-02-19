//Game setup functionality - display with buttons etc.
function GameInitiationDisplay() {

  //Local vars
  const frameButtonCreate = { x: 0, y: 0, w: 0, h: 0 };
  const frameButtonInstructions = { x: 0, y: 0, w: 0, h: 0 };
  var buttonCreate = null;
  var buttonInstructions = null;

  //Draw the game initiation view
  this.draw = function() {
    push();

    //Background box
    fill('#505B4D');
    stroke('#00000050');
    rect(playArea.x, playArea.y, playArea.width, playArea.height);

    const isWaitingForPlayers =  gameLogic.isWaitingForPlayers();

    //Welcome text
    textAlign(CENTER, CENTER);
    //Dynamic font size
    const fontSize = Math.floor(playArea.width * 0.08);
    textFont(font, fontSize);
    fill(255);
    var title = 'Welcome to Sequence';
    if (isWaitingForPlayers) {
      title = gameLogic.isAgainstBot() ? 'Waiting for bot' : 'Waiting for player';
    }
    text(title, playArea.x, playArea.boardTop, playArea.width, playArea.height / 5);

    //Buttons
    frameButtonCreate.x = playArea.x + playArea.width * 0.1;
    frameButtonCreate.y = playArea.boardTop + playArea.height * 0.3;
    frameButtonCreate.w = playArea.width * 0.8;
    frameButtonCreate.h = playArea.height * 0.1;
    buttonCreate = new Button('Start Game', frameButtonCreate.x, frameButtonCreate.y, frameButtonCreate.w,
			frameButtonCreate.h, 255, 1.0);
    buttonCreate.draw(); 

		frameButtonInstructions.x = playArea.x + playArea.width * 0.65;
    frameButtonInstructions.y = playArea.y + playArea.height * 0.03;
    frameButtonInstructions.w = playArea.width * 0.3;
    frameButtonInstructions.h = playArea.height * 0.05;
    buttonInstructions = new Button('Instructions', frameButtonInstructions.x, frameButtonInstructions.y, frameButtonInstructions.w, frameButtonInstructions.h, 255, 0.7);
    buttonInstructions.draw(); 

    pop();
  };

  this.hitCheck = function() {
    if (buttonCreate.hitCheck()) {
      return({ action: 'create', isPlayer2Bot: true });
    }
    
		if (buttonInstructions.hitCheck()) {
      return({ action: 'instructions' });
    }

    //Not a valid hit
    return false;
  };

}