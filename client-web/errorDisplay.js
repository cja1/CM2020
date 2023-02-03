//Handle error display
function ErrorDisplay() {
  //local constants
  const MAX_DISPLAY_SECS = 10;

  //Local variables
  var errors = [];

  this.addError = function(error) {
    //add error with timestamp in seconds
    errors.push({ error: error, timestamp: Math.floor(Date.now() / 1000) });
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
    });
    errors = out;
    return (errors.length > 0);
  };

  this.draw = function() {
    //Show any errors
  };
}