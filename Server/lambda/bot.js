const axios = require('axios');
const utilities = require(__dirname + '/utilities.js');

const BOT_DEVICE_UUID = '00000000-9ff1-4b77-8fdf-e626e8f98e94';
const GAMES_END_POINT = 'https://yhw44o1elj.execute-api.eu-west-1.amazonaws.com/prod/games';

//************************************
// BOT USER
//************************************
var playRound = function(deviceUUID, code) {
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
        const move = getMove(response.data);
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

function getMove(game) {
  var moves = [];

  //Create possible moves
  game.cards.forEach((card) => {
    const movesForCard = getMovesForCard(card, game.boardState, game.nextPlayer);
    moves = moves.concat(movesForCard);
  });
  console.log(moves);
  //If no moves return false
  if (moves.length == 0) {
    return false;
  }

  //Return a random move
  const num = Math.floor(Math.random() * moves.length);
  return moves[num];
}

function getMovesForCard(card, boardState, nextPlayer) {
  const cardParts = card.split('|');
  var moves = []
  if (cardParts[0] != 'J') {
    //Not a Jack
    const playOptions = utilities.playOptionsForCard(card, true); //true to get array of arrays back as opposed to array of strings
    playOptions.forEach((playOption) => {
      if (boardState[playOption[0]][playOption[1]] == '') {
        //Board is empty so valid move for this card
        moves.push({ card: card, moveRow: playOption[0], moveCol: playOption[1] });
      }
    });
    return moves;
  }

  //A Jack. See if one-eyed or not (Spades and Hearts are one-eyed)
  const isOneEyed = (['S', 'H'].includes(cardParts[1]));
  if (isOneEyed) {
    //One-eyed Jacks are 'anti-wild'
    //Rule: "remove one marker chip from the game board belonging to your opponent"
    //So valid moves are all places where boardState is nextPlayer
    const opponent = (nextPlayer == 1) ? 'p2' : 'p1';
    for (var i = 0; i < 10; i++) {
      for (var j = 0; j < 10; j++) {
        if (boardState[i][j] == opponent) {
          //The board position is occupied by the opponent
          moves.push({ card: card, moveRow: i, moveCol: j });
        }
      }
    }
    return moves;
  }

  //Two-eyed Jacks are 'wild'
  //Rule: "place one of your marker chips on any open space on the game board"
  //So find all open spaces
  for (var i = 0; i < 10; i++) {
    for (var j = 0; j < 10; j++) {
      //ignore corners
      if ((i == 0 && j == 0) || (i == 9 && j == 0) || (i == 0 && j == 9) || (i == 9 && j == 9)) {
        continue;
      }
      if (boardState[i][j] == '') {
        //The board position is empty by the opponent
        moves.push({ card: card, moveRow: i, moveCol: j });
      }
    }
  }
  return moves;
}

exports.handler = (event, context, callback) => {

  context.callbackWaitsForEmptyEventLoop = false;

  var promises = [];

  event.Records.forEach(function(record) {
    if ('body' in record) {
      const json = utilities.parseJson(record.body);
      if (!('deviceUUID' in json)) {
        json['deviceUUID'] = BOT_DEVICE_UUID;
      }
      if (('code' in json) && utilities.isValidGameCode(json.code)) {
        promises.push(playRound(json.deviceUUID, json.code));
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

