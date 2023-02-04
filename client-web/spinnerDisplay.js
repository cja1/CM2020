//Handles showing a spinner overlay
function SpinnerDisplay() {

  //local vars
  var isShowingSpinner = false;
  var haveShownBackground = false;

  //Show the spinner
  this.showSpinner = function() {
    isShowingSpinner = true;
    haveShownBackground = false;
  };

  //Draw the spinner
  this.draw = function() {
    if (!haveShownBackground) {
      //Shaded box over game board
      push();
      fill('#00000070');
      rect(playArea.x, playArea.boardTop, playArea.width, playArea.boardHeight + playArea.playerCardsHeight);
      pop();
      haveShownBackground = true;
    }

    push()
    //Background
    fill(0);
    const size = 100;
    const x = playArea.x + playArea.width / 2 - size / 2;
    const y = playArea.boardTop + (playArea.boardHeight) / 2 - size / 2; 
    rect(x, y, size, size, 10);

    //Spinner - using frameCount for rotation
    noFill();
    stroke(255);
    strokeWeight(10);
    const rads = (2 * PI) * (frameCount % 50) / 50;
    arc(x + size / 2, y + size / 2, size / 2, size / 2, rads, rads + 2 * PI * 0.8, OPEN);

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

}