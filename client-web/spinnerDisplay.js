//Handles showing a spinner overlay
function SpinnerDisplay() {

  //local vars
  var isShowingSpinner = false;
  var haveShownBackground = false;
  var closeButton = null;

  //Show the spinner
  this.showSpinner = function() {
    if (isShowingSpinner) { return; }
    isShowingSpinner = true;
    haveShownBackground = false;
  };

  this.reset = function() {
    haveShownBackground = false;
  };

  //Draw the spinner
  this.draw = function() {
    if (!haveShownBackground) {
      //Shaded box over game board
      push();
      fill('#00000030');
      rect(playArea.x, playArea.y, playArea.width, playArea.height);
      pop();
      haveShownBackground = true;
    }

    //Show spinner centred on board if in game and not waiting for players, else low spinner below 'Join' button
    const showCentredSpinner = gameLogic.isInGame() && !gameLogic.isWaitingForPlayers();

    push();

    //Background
    fill(0);
    const size = playArea.width * 0.25;
    const x = playArea.x + playArea.width / 2 - size / 2;
    var y = playArea.boardTop + (playArea.boardHeight) / 2 - size / 2;
    if (!showCentredSpinner) {
      y = y + playArea.height / 2.35;
    }
    rect(x, y, size, size, 10);


    //Spinner - using frameCount for rotation
    noFill();
    stroke(255);
    strokeWeight(Math.floor(size / 10));
    const rads = (2 * PI) * (frameCount % 50) / 50;
    arc(x + size / 2, y + size / 2, size / 2, size / 2, rads, rads + 2 * PI * 0.8, OPEN);

    //Close control - cancels whole game
    closeButton = new CloseButton(playArea.x + playArea.width * 0.965, playArea.y + playArea.width * (1 - 0.965), 255);
    closeButton.draw();

    pop();
  };

  //Return true if spinner is spinning
  this.isSpinning = function() {
    return isShowingSpinner;
  };

  //Hide the spinner
  this.hideSpinner = function() {
    isShowingSpinner = false;
  };

  this.hitCheck = function() {
    return closeButton.hitCheck();
  };

}