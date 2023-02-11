const axios = require('axios');
const utilities = require(__dirname + '/utilities.js');
var validator = require('validator');

const GAMES_END_POINT = 'https://yhw44o1elj.execute-api.eu-west-1.amazonaws.com/prod/games';

//************************************
// BOT USER
//************************************
var playRound = function(deviceUUID, code, version) {
  return new Promise(function(resolve, reject) {
    console.log(deviceUUID, code);

    const instance = axios.create({
      baseURL: GAMES_END_POINT,
      headers: { 'Authorization': 'Bearer ' + deviceUUID }
    });

    //Get game
    instance.get('/' + code)
    .then(function (response) {
      console.log(response.data);

      switch (response.data.status) {
      case 'waitingForPlayers':
        //Join the game
        console.log('Joining the game');
        instance.post('/' + code + '/' + 'players')
        .then(function (response) { resolve(); })
        .catch(function (error) { reject(error); });
        break;

      case 'active':
        //Check me next
        if ((response.data.players[0].isMe && (response.data.nextPlayer != 1)) || (response.data.players[1].isMe && (response.data.nextPlayer != 2))) {
          reject('This player is not the next player');
          return;
        }
        //Get move (card, moveRow, moveCol)
        const move = getMove(response.data, version);
        if (move === false) {
          reject('No moves available');
          return;
        }
        //Play the move
        console.log('Playing move', move);
        instance.post('/' + code + '/' + 'rounds', move)
        .then(function (response) { resolve(); })
        .catch(function (error) { reject(error); });
        break;

      case 'ended':
        //Assume game has just ended - resolce
        resolve();
        break;
      }
    })
    .catch(function (error) {
      // handle error
      console.log(error);
      reject(error);
    })
  });
}

//************************************
// HELPERS
//************************************
function getMove(game, version) {
  const moves = utilities.getMovesForGame(game);
  //If no moves return false
  if (moves.length == 0) {
    return false;
  }
  //Logic for selecting move depends on bot version
  switch(version) {
  case 1:
    //Bot v1: random move from all possible moves
    const num = Math.floor(Math.random() * moves.length);
    return moves[num];
  }
}

exports.handler = (event, context, callback) => {

  context.callbackWaitsForEmptyEventLoop = false;

  var promises = [];

  event.Records.forEach(function(record) {
    if ('body' in record) {
      const json = utilities.parseJson(record.body);
      console.log(json);
      if (('deviceUUID' in json) && validator.isUUID(json.deviceUUID)
        && ('code' in json) && utilities.isValidGameCode(json.code.toUpperCase()) && ('version' in json)) {
        promises.push(playRound(json.deviceUUID, json.code.toUpperCase(), json.version));
      }
    }
  });

  Promise.all(promises)
  .then(function() {
    return callback(null, 'successful process ' + JSON.stringify(event, null, 2));
  }, function(err) {
    console.log(err);
    return callback(null, 'failed ' + JSON.stringify(event, null, 2));
  });

};

