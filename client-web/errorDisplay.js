//Handle error display
function ErrorDisplay() {
  //local constants
  const MAX_DISPLAY_SECS = 10;

  //Local variables
  var errors = [];
  var closeButtons = [];
  var haveShowErrors = false;

  this.addError = function(error) {
    //add error with timestamp in seconds
    errors.push({ error: error, timestamp: Math.floor(Date.now() / 1000) });
    haveShowErrors = false;
  };

  this.haveErrors = function() {
    //Update errors - remove any expired
    var out = [];
    const now = Math.floor(Date.now() / 1000);
    errors.forEach((error) => {
      if (now - error.timestamp < MAX_DISPLAY_SECS) {
        //Still display
        out.push(error);
      }
      else {
        haveShowErrors = false;
        didChangeState = true;
      }
    });
    errors = out;
    return (errors.length > 0);
  };

  this.draw = function() {
    if (haveShowErrors) { return; }

    const MAX_ERRORS = 10;
    const errorPlusGapHeight = playArea.height / MAX_ERRORS;
    const gap = errorPlusGapHeight * 0.1;
    const errorHeight = errorPlusGapHeight - gap;

    noStroke();
    textAlign(CENTER, CENTER);
    //Dynamic font size
    const fontSize = Math.floor(playArea.width * 0.04);
    textFont(font, fontSize);

    //Start from bottom
    var y = playArea.y + playArea.height;
    for (var i = 0; i < errors.length; i++) {
      const error = errors[i];

      //White box
      fill('yellow');
      rect(playArea.x, y - errorHeight, playArea.width, errorHeight);

      //Text
      fill(0);
      text(error.error, playArea.x + (playArea.width * 0.1), y - errorHeight, playArea.width - (playArea.width * 0.1 * 2), errorHeight);

      //Close button
      const closeButton = new CloseButton(playArea.x + playArea.width * 0.965, y - errorHeight * 0.80, 0);
      closeButton.draw();
      closeButtons.push(closeButton);

      y -= errorPlusGapHeight;
    }
  };

  this.hitCheck = function() {
    for (var i = 0; i < closeButtons.length; i++) {
      if (closeButtons[i].hitCheck()) {
        //remove error at i
        removeError(i);
        haveShowErrors = false;
        didChangeState = true;
      }
    }
  };

  //private functions
  function removeError(num) {
    var out = [];
    for (var i = 0; i < errors.length; i++) {
      if (i == num) { continue; }
      out.push(errors[i]);
    }
    errors = out;
  }

}