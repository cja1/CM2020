//Handle error display
function ErrorDisplay() {
  //local constants
  const MAX_DISPLAY_SECS = 10;

  //Local variables
  var errors = [];
  var closeButtons = [];
  var haveShown = false;

  this.addError = function(error) {
    //add error with timestamp in seconds
    errors.push({ error: error, timestamp: Math.floor(Date.now() / 1000) });
    haveShown = false;
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
        haveShown = false;
        didChangeState = true;
      }
    });
    errors = out;
    return (errors.length > 0);
  };

  this.draw = function() {
    if (haveShown) { return; }

    const MAX_ERRORS = 10;
    const errorPlusGapHeight = playArea.height / MAX_ERRORS;
    const gap = errorPlusGapHeight * 0.1;
    const errorHeight = errorPlusGapHeight - gap;

    noStroke();
    textAlign(CENTER, CENTER);
    //Dynamic font size
    const fontSize = Math.floor(playArea.width * 0.04);
    const fontSizeSmall = Math.floor(playArea.width * 0.035);

    const now = Math.floor(Date.now() / 1000);

    //Start from bottom
    var y = playArea.y + playArea.height;
    for (var i = 0; i < errors.length; i++) {
      const error = errors[i];

      //Yellow box
      fill('yellow');
      rect(playArea.x, y - errorHeight, playArea.width, errorHeight);

      //Text
      fill(0);
      textFont(font, fontSize);
      text(error.error, playArea.x + (playArea.width * 0.1), y - errorHeight, playArea.width - (playArea.width * 0.1 * 2), errorHeight);

      //Secs left to auto-close
      const secs = MAX_DISPLAY_SECS - (now - error.timestamp);
      textFont(font, fontSizeSmall);
      text(secs + 's', playArea.x + (playArea.width * 0.92), y - errorHeight * 0.4, playArea.width * 0.08, errorHeight * 0.4);

      //Close button
      const closeButton = new CloseButton(playArea.x + playArea.width * 0.965, y - errorHeight * 0.80, 0);
      closeButton.draw();
      closeButtons.push(closeButton);

      y -= errorPlusGapHeight;
    }
  };

  this.hitCheck = function() {
    var didClick = false;
    for (var i = 0; i < closeButtons.length; i++) {
      if (closeButtons[i].hitCheck()) {
        //remove error at i
        removeError(i);
        haveShown = false;
        didClick = true;
      }
    }
    return didClick;
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