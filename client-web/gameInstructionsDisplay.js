function GameInstructionsDisplay() {

  var haveShown = false;
  var isDisplayed = false;
	var closeButton = null;
	
	const title = 'Instructions';
	const instructions = 'Start by creating a game and sharing the game code with your opponent, or joining a game with the game code you have been given.\n\n'
		+ 'Play a turn by selecting a card in your hand then selecting one of the positions of this card on the board. Possible moves are shown in yellow.\n\n'
		+ 'Win by creating a 5 chip sequence before your opponent. The corners are Bonus chips and can be used by any player as part of their sequence.\n\n'
		+ 'Two-eyed Jacks are wild: they are placed on any empty space on the board. One-eyed Jacks are anti-wild: they are placed on an opponent\'s chip and remove it.';
	
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
    var fontSize = Math.floor(playArea.width * 0.07);
    textFont(font, fontSize);
    fill(255);
    text(title, playArea.x + playArea.width * 0.05, playArea.y, playArea.width - playArea.width * 0.1, playArea.height * 0.1);

		//Instructions
    textAlign(LEFT, TOP);
		//Dynamic font size
    fontSize = Math.floor(playArea.width * 0.045);
    textFont(font, fontSize);
    fill(255);
    text(instructions, playArea.x + playArea.width * 0.05, playArea.y + playArea.height * 0.15, playArea.width - playArea.width * 0.1, playArea.height * 0.9);

		//Close control - closes instructions display
    closeButton = new CloseButton(playArea.x + playArea.width * 0.965, playArea.y + playArea.width * (1 - 0.965), 255, 1.0);
    closeButton.draw();

    haveShown = true;

		pop();
  }

  this.hitCheck = function() {
    if (closeButton.hitCheck()) {
      return({ action: 'close' });
    }
    return false;
  }
}
