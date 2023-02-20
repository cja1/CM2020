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
  //Logic for selecting move depends on bot version
  console.log('getMove, version: ' + version);
  var moves, playerLabel, boardPositions;

  switch(version) {
  case 1:
    //Bot v1: random move from all possible moves
    moves = utilities.getMovesForGame(game);
    if (moves.length == 0) { return false; }
    const num = Math.floor(Math.random() * moves.length);
    return moves[num];

  case 2:
    //Bot v2: get move that is closest to a corner
    moves = utilities.getMovesForGame(game);
    if (moves.length == 0) { return false; }
    return getMoveClosestToCorner(moves);

  case 3:
    //Bot v3: get move that is closest to a corner; hold on to Jacks until after 35 hands played
    const ignoreJacks = game.handsPlayed < 35;
    moves = utilities.getMovesForGame(game, ignoreJacks);
    if (moves.length == 0) {
      if (ignoreJacks) {
        //see if any moves if don't ignore jacks
        moves = utilities.getMovesForGame(game, false);
        if (moves.length == 0) { return false; }
      }
      else {
        return false;
      }
    }
    return getMoveClosestToCorner(moves);

  case 4: case 5: case 6:
    //Play close to existing piece on table if available
    moves = utilities.getMovesForGame(game);
    playerLabel = game.players[0].isMe ? 'p1' : 'p2';
    boardPositions = getBoardPositionsForPlayer(game.boardState, playerLabel);
    if (version == 4) {
      //Bot v4: if there is a play next to an existing piece do this, else closest to corner
      return getMoveClosestToExisting(boardPositions, moves);
    }
    else if (version == 5) {
      //Bot v5: if there is a play next to an existing piece or 2 pieces away do this, else closest to corner
      return getMoveClosestToExistingV2(boardPositions, moves);
    }
    else {
      //Bot v6: play closest for all proximity ranges (1-9)
      return getMoveClosestToExistingV3(boardPositions, moves);
    }

  case 7:
    //Get all moves 1 away from existing then, if any, pick the one that will create the longest sequence
    moves = utilities.getMovesForGame(game);
    playerLabel = game.players[0].isMe ? 'p1' : 'p2';
    boardPositions = getBoardPositionsForPlayer(game.boardState, playerLabel);
    const movesOneAwayFromExisting = getAllMovesClosestToExisting(boardPositions, moves);
    if (movesOneAwayFromExisting.length > 0) {
      return bestMove(movesOneAwayFromExisting, game.boardState, playerLabel);
    }
    else {
      //Just return like bot v6
      return getMoveClosestToExistingV3(boardPositions, moves);      
    }
  }
}

function bestMove(movesOneAwayFromExisting, boardState, playerLabel) {
  //See if any move results in a win
  for (var i = 0; i < movesOneAwayFromExisting.length; i++) {
    //start with a copy of the boardState
    var boardStateCopy = JSON.parse(JSON.stringify(boardState));
    //Set this move to be this player's piece...
    boardStateCopy[movesOneAwayFromExisting[i].moveRow][movesOneAwayFromExisting[i].moveCol] = playerLabel;
    //... and see if this results in a win
    var winState = utilities.getWinState(boardStateCopy);
    if (winState.didWin) {
      return movesOneAwayFromExisting[i];
    }
  }
  //No move resulted in a win
  //Start by calculating the longest sequence on the board before any move
  var currentLongestSequence = longestSequence(boardState, playerLabel);
  var moveForMax = null;
  //Add each move to board position and re-calculate longest sequence. Keep hold of the longest
  for (var i = 0; i < movesOneAwayFromExisting.length; i++) {
    //start with a copy of the boardState
    var boardStateCopy = JSON.parse(JSON.stringify(boardState));
    //Set this move to be this player's piece...
    boardStateCopy[movesOneAwayFromExisting[i].moveRow][movesOneAwayFromExisting[i].moveCol] = playerLabel;
    var thisLongestSequence = longestSequence(boardStateCopy, playerLabel);
    if (thisLongestSequence > currentLongestSequence) {
      currentLongestSequence = thisLongestSequence;
      moveForMax = movesOneAwayFromExisting[i];
    }
  }

  if (moveForMax != null) {
    return moveForMax;
  }
  //return random move as none better than existing
  return movesOneAwayFromExisting[Math.floor(Math.random() * movesOneAwayFromExisting.length)];
}

function longestSequence(boardState, playerLabel) {
  return Math.max(
    longestRow(boardState, playerLabel),
    longestCol(boardState, playerLabel),
    longestDiagDR(boardState, playerLabel),
    longestDiagUR(boardState, playerLabel)
  );
}

function longestRow(boardState, playerLabel) {
  var maxLen = 0;
  var currentLen = 0;

  for (var r = 0; r < 10; r++) {
    for (var c = 0; c < 10; c++) {
      if (boardState[r][c] == playerLabel) {
        currentLen += 1;
        maxLen = Math.max(maxLen, currentLen);
      }
      else {
        currentLen = 0;
      }
    }
    //end of row - reset
    currentLen = 0;
  }
  return maxLen;
}

function longestCol(boardState, playerLabel) {
  var maxLen = 0;
  var currentLen = 0;

  for (var c = 0; c < 10; c++) {
    for (var r = 0; r < 10; r++) {
      if (boardState[r][c] == playerLabel) {
        currentLen += 1;
        maxLen = Math.max(maxLen, currentLen);
      }
      else {
        currentLen = 0;
      }
    }
    //end of col - reset
    currentLen = 0;
  }
  return maxLen;
}

function longestDiagDR(boardState, playerLabel) {
  var maxLen = 0;
  var currentLen = 0;

  //Start at col -5, up to col = 5
  for (var cStart = -5; cStart < 5; cStart++) {
    //reset r - start at -1 so first increment gets us to 0
    var r = -1;
    var c = cStart;
    while (r < 9) {
      //we always increment r even if c is < 0
      r += 1;
      c += 1;
      //if c < 0 or > 9 then invalid cell - go to next
      if (c < 0 || c > 9) { continue; }

      //console.log(r, c, boardState[r][c], playerLabel);
      if (boardState[r][c] == playerLabel) {
        currentLen += 1;
        maxLen = Math.max(maxLen, currentLen);
      }
      else {
        currentLen = 0;
      }
    }
    //end of diagonal - reset
    currentLen = 0;
  }
  return maxLen;
}

function longestDiagUR(boardState, playerLabel) {
  var maxLen = 0;
  var currentLen = 0;

  //Start at col -5, up to col = 5
  for (var cStart = -5; cStart < 5; cStart++) {
    //reset r - start at 10 so first decrement gets us to 9
    var r = 10;
    var c = cStart;
    while (r > 0) {
      //we always decrement r even if c is < 0
      r -= 1;
      c += 1;
      //if c < 0 or > 9 then invalid cell - go to next
      if (c < 0 || c > 9) { continue; }

      if (boardState[r][c] == playerLabel) {
        currentLen += 1;
        maxLen = Math.max(maxLen, currentLen);
      }
      else {
        currentLen = 0;
      }
    }
    //end of diagonal - reset
    currentLen = 0;
  }
  return maxLen;
}

//Get all the positons on the board held by this player
function getBoardPositionsForPlayer(boardState, playerLabel) {
  var out = [];
  for (var r = 0; r < 10; r++) {
    for (var c = 0; c < 10; c++) {
      if (boardState[r][c] == playerLabel) {
        out.push({ row: r, col: c });
      }
    }
  }
  return out;
}

function getAllMovesClosestToExisting(boardPositions, moves) {
  var movesOneAwayFromExisting = [];
  //get all moves that are next to an existing piece of this player
  for (var i = 0; i < moves.length; i++) {
    const row = moves[i].moveRow;
    const col = moves[i].moveCol;
    for (var j = 0; j < boardPositions.length; j++) {
      if ((Math.abs(row - boardPositions[j]['row']) <= 1) && (Math.abs(col - boardPositions[j]['col']) <= 1)) {
        movesOneAwayFromExisting.push(moves[i]);
      }
    }
  }
  return movesOneAwayFromExisting;
}

function getMoveClosestToExisting(boardPositions, moves) {
  //see if any moves are next to an existing piece of this player
  for (var i = 0; i < moves.length; i++) {
    const row = moves[i].moveRow;
    const col = moves[i].moveCol;
    for (var j = 0; j < boardPositions.length; j++) {
      if ((Math.abs(row - boardPositions[j]['row']) <= 1) && (Math.abs(col - boardPositions[j]['col']) <= 1)) {
        return moves[i];
      }
    }
  }
  //No moves close - return move closest to corner
  return getMoveClosestToCorner(moves);
}

function getMoveClosestToExistingV2(boardPositions, moves) {
  //see if any moves are next to an existing piece of this player
  for (var i = 0; i < moves.length; i++) {
    const row = moves[i].moveRow;
    const col = moves[i].moveCol;
    for (var j = 0; j < boardPositions.length; j++) {
      if ((Math.abs(row - boardPositions[j]['row']) <= 1) && (Math.abs(col - boardPositions[j]['col']) <= 1)) {
        return moves[i];
      }
    }
  }
  //now see if any moves 2 away from an existing piece of this player
  for (var i = 0; i < moves.length; i++) {
    const row = moves[i].moveRow;
    const col = moves[i].moveCol;
    for (var j = 0; j < boardPositions.length; j++) {
      if ((Math.abs(row - boardPositions[j]['row']) <= 2) && (Math.abs(col - boardPositions[j]['col']) <= 2)) {
        return moves[i];
      }
    }
  }
  //No moves close - return move closest to corner
  return getMoveClosestToCorner(moves);
}

function getMoveClosestToExistingV3(boardPositions, moves) {
  for (var proximity = 1; proximity < 10; proximity ++) {
    for (var i = 0; i < moves.length; i++) {
      const row = moves[i].moveRow;
      const col = moves[i].moveCol;
      for (var j = 0; j < boardPositions.length; j++) {
        if ((Math.abs(row - boardPositions[j]['row']) <= proximity) && (Math.abs(col - boardPositions[j]['col']) <= proximity)) {
          return moves[i];
        }
      }
    }
  }
  //No moves close - return move to closest corner (should only happen on first play)
  return getMoveClosestToCorner(moves);
}

function getMoveClosestToCorner(moves) {
  //add distance to closest corner for each move
  for (var i = 0; i < moves.length; i++) {
    moves[i]['distance'] = distanceToCorner(moves[i]);
  }

  //sort array by distance
  moves.sort((a, b) => a.distance - b.distance);

  //return the top-most move - the closest to the corner
  const move = moves[0];
  delete move.distance;
  return move;
}

function distanceToCorner(move) {
  //move like { card: '3|S', moveRow: 9, moveCol: 7 }
  const distTL = Math.sqrt(Math.pow(move.moveRow, 2) + Math.pow(move.moveCol, 2));
  const distTR = Math.sqrt(Math.pow(move.moveRow, 2) + Math.pow(9 - move.moveCol, 2));
  const distBL = Math.sqrt(Math.pow(9 - move.moveRow, 2) + Math.pow(move.moveCol, 2));
  const distBR = Math.sqrt(Math.pow(9 - move.moveRow, 2) + Math.pow(9 - move.moveCol, 2));
  return Math.min(distTL, distTR, distBL, distBR);
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

