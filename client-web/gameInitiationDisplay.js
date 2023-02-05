//Game setup functionality - display with buttons etc.
function GameInitiationDisplay() {

  //Local vars
  const frameButtonCreate = { x: 0, y: 0, w: 0, h: 0 };
  const frameButtonJoin = { x: 0, y: 0, w: 0, h: 0 };
  const frameToggleBot = { x: 0, y: 0, w: 0, h: 0 };
  var toggleBotIsOn = false;
  var buttonCreate = null;
  var buttonJoin = null;

  var codeInput = createInput();

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
    const title = isWaitingForPlayers ? 'Waiting for player' : 'Welcome to Sequence';
    text(title, playArea.x, playArea.boardTop, playArea.width, playArea.height / 5);

    //Buttons
    frameButtonCreate.x = playArea.x + playArea.width * 0.1;
    frameButtonCreate.y = playArea.boardTop + playArea.height * 0.3;
    frameButtonCreate.w = playArea.width * 0.4;
    frameButtonCreate.h = playArea.height * 0.1;
    buttonCreate = new Button('Create Game', frameButtonCreate.x, frameButtonCreate.y, frameButtonCreate.w, frameButtonCreate.h, 255);
    buttonCreate.draw(); 

    frameButtonJoin.x = playArea.x + playArea.width * 0.1;
    frameButtonJoin.y = playArea.boardTop + playArea.height * 0.55;
    frameButtonJoin.w = playArea.width * 0.4;
    frameButtonJoin.h = playArea.height * 0.1;
    buttonJoin = new Button('Join Game', frameButtonJoin.x, frameButtonJoin.y, frameButtonJoin.w, frameButtonJoin.h, 255);
    buttonJoin.draw(); 

    //Bot toggle
    frameToggleBot.x = playArea.x + playArea.width * 0.1;
    frameToggleBot.y = playArea.boardTop + playArea.height * 0.43;
    frameToggleBot.w = playArea.width;
    frameToggleBot.h = playArea.height * 0.05;
    drawToggle('Play against bot', frameToggleBot, toggleBotIsOn);

    if (isWaitingForPlayers) {
      //Hide text input for code
      this.clear();
    }
    else {
      //Draw text input for code
      createCodeInput();
    }

    //If have game code, show it
    if (networkRequests.haveGameCode()) {
      showGameCode(networkRequests.gameCode());
    }
    pop();
  };

  this.clear = function() {
    //Hide the input
    codeInput.style('display', 'none');
  };

  this.hitCheck = function() {
    if (buttonCreate.hitCheck()) {
      return({ action: 'create', isPlayer2Bot: toggleBotIsOn });
    }

    if (buttonJoin.hitCheck()) {
      const code = codeInput.value().toUpperCase();
      //Check valid code
      if (!gameLogic.isValidGameCode(code)) {
        //show code error
        const msg = (code.trim().length == 0) ? 'Game code can not be blank' : ('\'' + code + '\' is not a valid game code');
        errorDisplay.addError(msg);
        return false;
      }
      else {
        return({ action: 'join', code: code });
      }
    }

    if (isButtonHit(frameToggleBot)) {
      return({ action: 'toggleBot' });      
    }

    //Not a valid hit
    return false;
  };

  //toggle bot switch state
  this.toggleBot = function() {
    toggleBotIsOn = !toggleBotIsOn;
  }

  //local functions
  function drawToggle(str, frame, isOn) {
    const width = frame.w / 7;
    const height = width * 2.5 / 5;

    //toggle outline - lozenge
    stroke(255);
    noFill();
    rect(frame.x, frame.y, width, height, height / 2);

    //filled circle to represent the toggle switch
    fill(255);
    noStroke();
    var circleX = frame.x + 1 + height / 2;
    if (isOn) {
        circleX += width - height - 1;
    } 
    ellipse(circleX, frame.y + height / 2, height - 4, height - 4);

    //text
    const fontSize = Math.floor(playArea.width * 0.045);
    textFont(font, fontSize);
    textAlign(LEFT, CENTER);
    fill(255);
    noStroke();
    text(str, frame.x + width * 1.2, frame.y - frame.h * 0.1, frame.w, frame.h);
  }

  //Button hit check
  function isButtonHit(frame) {
    return (mouseX > frame.x && mouseX < frame.x + frame.w && mouseY > frame.y && mouseY < frame.y + frame.h);
  }

  //Create input area for code
  function createCodeInput() {
    codeInput.position(frameButtonJoin.x + frameButtonJoin.w * 1.2, frameButtonJoin.y + frameButtonJoin.h * 0.15);
    codeInput.style('border', 'none');
    codeInput.style('box-shadow', 'none');
    codeInput.style('outline', 'none');
    codeInput.style('height', frameButtonJoin.h * 0.6 + 'px');
    const fontSize = Math.floor(frameButtonJoin.w * 0.2);
    codeInput.style('font-size', fontSize + 'pt');
    const size = Math.floor(frameButtonJoin.w * 0.7);    
    codeInput.style('text-align', 'center');
    codeInput.size(size);
    codeInput.style('display', 'normal');
  }

  //Show game code - to left of frameButtonCreate
  function showGameCode(code) {
    var fontSize = Math.floor(playArea.width * 0.08);
    textFont(font, fontSize);
    textAlign(CENTER, CENTER);
    fill(255);
    noStroke();
    text(code, frameButtonCreate.x + frameButtonCreate.w, frameButtonCreate.y, playArea.width - frameButtonCreate.w * 1.1, frameButtonCreate.h * 0.6);

    fontSize = Math.floor(playArea.width * 0.03);
    textFont(font, fontSize);
    text('Share code with Opponent', frameButtonCreate.x + frameButtonCreate.w, frameButtonCreate.y + frameButtonCreate.h * 0.3, playArea.width - frameButtonCreate.w * 1.1, frameButtonCreate.h);
  }


}