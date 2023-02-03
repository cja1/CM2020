//Handles network requests
function NetworkRequests() {

  //local consts
  //API endpoint
  const GAMES_END_POINT = 'https://yhw44o1elj.execute-api.eu-west-1.amazonaws.com/prod/games';
  //Poll interval in seconds
  const POLL_INTERVAL = 5;

  //current game code
  var code;

  //Create a game
  this.createGame = function(successFunction, failFunction) {
    httpDo(
      GAMES_END_POINT,
      {
        method: 'POST',
        headers: { authorization: 'Bearer ' + getDeviceUUID() },
      },
      function(res) {
        //Save code to this function (not needed elsewhere)
        code = JSON.parse(res).code;
        successFunction(code);
      },
      function(err) {
        console.log(err);
        failFunction('Unable to create game');
      }
    );
  };

  //Join a game
  this.joinGame = function(code, successFunction, failFunction) {

  };

  //Play a round
  this.playRound = function(card, row, col, successFunction, failFunction) {
  };

  //Get game status
  this.getStatus = function(successFunction, failFunction) {
    httpDo(
      GAMES_END_POINT + '/' + code,
      {
        method: 'GET',
        headers: { authorization: 'Bearer ' + getDeviceUUID() }
      },
      function(res) {
        successFunction(JSON.parse(res));
      },
      function(err) {
        console.log(err);
        failFunction('Unable to find game with code ' + code);
      }
    );
  };

  //Wait for game status change
  this.waitForStatusChange = function(currentStatus, successFunction, failFunction) {
    //Repeatedly poll game endpoint waiting for status to change from currentStatus
    setTimeout(getStatus(
      function(state) {
        //If status changed, call success function else re-call this function
        if (state.status != currentStatus) {
          successFunction(state);
          return;
        }
        //HERE! not structured right!
        setTimeout()
      },
      function() {}
    ), POLL_INTERVAL * 1000);
  };

  this.deleteGame = function(successFunction, failFunction) {

  };

  //local functions
  //Get this device's UUID from localStorage if set. If not, create.
  function getDeviceUUID() {
    if (localStorage.getItem('deviceUUID') !== null) {
      return localStorage.getItem('deviceUUID');
    }
    //Create and save
    const deviceUUID = uuidv4();
    localStorage.setItem('deviceUUID', deviceUUID);
    return deviceUUID;
  }

  //Generate a UUID: https://stackoverflow.com/questions/105034/how-do-i-create-a-guid-uuid
  function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }

}
