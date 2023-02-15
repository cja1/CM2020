function GameCancelDisplay() {

  var buttonCancel = null;
  var buttonContinue = null;
  var haveShown = false;
  var isDisplayed = false;

  const frameButton = { x: 0, y: 0, w: 0, h: 0 };

  this.title = '';

  this.isDisplayed = function() {
    return isDisplayed;
  };

  this.setDisplayed = function () {
    isDisplayed = true;
    haveShown = false;
  };

  this.clearDisplayed = function() {
    isDisplayed = false;    
  };

  this.draw = function() {
    if (haveShown) { return; }

    push();

    //Background box
    fill('#505B4D'); 
    stroke('#00000050');
    rect(playArea.x, playArea.y, playArea.width, playArea.height);

    //Text
    textAlign(CENTER, CENTER);
    //Dynamic font size
    const fontSize = Math.floor(playArea.width * 0.06);
    textFont(font, fontSize);
    fill(255);
    text(this.title, playArea.x + playArea.width * 0.05, playArea.y, playArea.width - playArea.width * 0.1, playArea.height * 2 / 3);

    //Buttons
    frameButton.x = playArea.x + playArea.width * 0.15;
    frameButton.y = playArea.boardTop + playArea.height * 0.3;
    frameButton.w = playArea.width * 0.3;
    frameButton.h = playArea.height * 0.1;
    buttonCancel = new Button('Cancel', frameButton.x, frameButton.y, frameButton.w, frameButton.h, 255);
    buttonCancel.draw(); 

    frameButton.x += frameButton.w + playArea.width * 0.1;
    buttonContinue = new Button('Yes', frameButton.x, frameButton.y, frameButton.w, frameButton.h, 'red');
    buttonContinue.draw();

		pop();

    haveShown = true;
  }

  this.hitCheck = function() {
    if (buttonCancel.hitCheck()) {
      return({ action: 'cancel' });
    }
    if (buttonContinue.hitCheck()) {
      return({ action: 'continue' });
    }
    return false;
  }
}
