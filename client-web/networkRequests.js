//Handles network requests
function NetworkRequests() {

  //local consts
  //API endpoint
  const GAMES_END_POINT = 'https://yhw44o1elj.execute-api.eu-west-1.amazonaws.com/prod/games';
  //Poll interval in seconds
  const POLL_INTERVAL = 5;

  this.haveGameCode = function() {
    return localStorage.getItem('code') != null;
  };

  this.gameCode = function() {
    return localStorage.getItem('code');
  };

  //Create a game
  this.createGame = function(isPlayer2Bot, successFunction, failFunction) {
    var postObject = {
      method: 'POST',
      headers: { authorization: 'Bearer ' + getDeviceUUID() },
    };
    if (isPlayer2Bot) {
      postObject['body'] = JSON.stringify({ isPlayer2Bot: true });
    }

    httpDo(
      GAMES_END_POINT,
      postObject,
      function(res) {
        //Save code to local storage to allow browser refresh and game continue
        const code = JSON.parse(res).code;
        localStorage.setItem('code', code);
        successFunction(code);
      },
      function(err) {
        failFunction('Unable to create game');
      }
    );
  };

  //Join a game
  this.joinGame = function(code, successFunction, failFunction) {
    httpDo(
      GAMES_END_POINT + '/' + code + '/players',
      {
        method: 'POST',
        headers: { authorization: 'Bearer ' + getDeviceUUID() }
      },
      function(res) {
        //Success - store code to localStorage
        localStorage.setItem('code', code);
        successFunction();
      },
      function(err) {
        var msg = 'Unable to join game with code \'' + code + '\'';
        if (err.status == 404) { msg = 'Game code \'' + code + '\' not found'; }
        if (err.status == 409) { msg = 'This game already has 2 players'; }
        if (err.status == 422) { msg = 'You have already joined this game'; }
        failFunction(msg);
      }
    );
  };

  //Play a round
  this.playRound = function(card, row, col, successFunction, failFunction) {
    httpDo(
      GAMES_END_POINT + '/' + localStorage.getItem('code') + '/rounds',
      {
        method: 'POST',
        headers: { authorization: 'Bearer ' + getDeviceUUID() },
        body: JSON.stringify({ card: card, moveRow: row, moveCol: col }),
      },
      function(res) {
        successFunction();
      },
      function(err) {
        failFunction('Unable to play round');
      }
    );
  };

  //Get game status
  this.getStatus = function(successFunction, failFunction) {
    httpDo(
      GAMES_END_POINT + '/' + localStorage.getItem('code'),
      {
        method: 'GET',
        headers: { authorization: 'Bearer ' + getDeviceUUID() }
      },
      function(res) {
        successFunction(JSON.parse(res));
      },
      function(err) {
        console.log(err);
        failFunction('Unable to find game with code ' + localStorage.getItem('code'));
      }
    );
  };

  //Wait for game status change
  this.waitForStatusChange = function(currentStatus, successFunction, failFunction) {
    //Repeatedly poll game endpoint waiting for status to change from currentStatus
    setTimeout(getStatusRepeat, POLL_INTERVAL * 1000, this, currentStatus, successFunction, failFunction);
  };

  //Wait for game nextPlayer change
  this.waitForPlayerChange = function(opponentPlayer, successFunction, failFunction) {
    //Repeatedly poll game endpoint waiting for nextPlayer to change from opponentPlayer
    setTimeout(getPlayerRepeat, POLL_INTERVAL * 1000, this, opponentPlayer, successFunction, failFunction);
  };

  this.deleteGame = function(successFunction, failFunction) {
    if (localStorage.getItem('code') == null) {
      //nothing to delete
      successFunction();
      return;
    }
    httpDo(
      GAMES_END_POINT + '/' + localStorage.getItem('code'),
      {
        method: 'DELETE',
        headers: { authorization: 'Bearer ' + getDeviceUUID() },
      },
      function(res) {
        //Clear code from local storage
        localStorage.removeItem('code');
        successFunction();
      },
      function(err) {
        localStorage.removeItem('code');
        failFunction('Unable to delete game');
      }
    );
  };

  ///////////////////
  //local functions
  ///////////////////

  //repeatedly call get game state until status changes.
  function getStatusRepeat(thisRef, currentStatus, successFunction, failFunction) {
    if (!this.haveGameCode()) {
      //not in game - has been cancelled out of loop
      successFunction(null);
    }
    thisRef.getStatus(
      function(state) {
        //If status changed, call success function else re-call this function
        if (state.status != currentStatus) {
          successFunction(state);
          return;
        }
        //Call again
        setTimeout(getStatusRepeat, POLL_INTERVAL * 1000, thisRef, currentStatus, successFunction, failFunction);
      },
      function(err) {
        failFunction(err);
      }
    )
  }

  //repeatedly call get game state until nextPlayer
  function getPlayerRepeat(thisRef, opponentPlayer, successFunction, failFunction) {
    console.log('in getPlayerRepeat', opponentPlayer);
    thisRef.getStatus(
      function(state) {
        //If nextPlayer changed, call success function else re-call this function
        //Note: can also be no player as game just won
        if ((state.status == 'ended') || (state.nextPlayer != opponentPlayer)) {
          console.log('changed state');
          successFunction(state);
          return;
        }
        //Call again
        setTimeout(getPlayerRepeat, POLL_INTERVAL * 1000, thisRef, opponentPlayer, successFunction, failFunction);
      },
      function(err) {
        failFunction(err);
      }
    )
  }

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
