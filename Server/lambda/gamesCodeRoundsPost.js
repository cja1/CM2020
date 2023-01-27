const models = require(__dirname + "/models");
const Op = models.Sequelize.Op;
const validator = require('validator');
const _ = require('lodash');
const utilities = require(__dirname + '/utilities.js');

var principalId;

/**
 * @swagger
 *
 * /games/{code}/rounds:
 *   post:
 *     tags:
 *     - Games
 *     summary: Play a round in a game. Players pass in the card they want to play from their hand together with the position on the board they want to play the card. If this is a valid move then the board state is updated and play moves to the other player. The business logic in this function makes various checks including <ul><li>Is it this player's turn?</li><li>Does the player have this card in their hand?</li><li>Is the move valid?</li></ul>
 *     operationId: Play a round
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [card, moveRow, moveCol]
 *             properties:
 *               card:
 *                 type: string
 *                 description: The card this player wants to play
 *                 example: A|C
 *               moveRow:
 *                 type: int32
 *                 description: The row number where the player wants to play this card, from 0 to 9
 *                 example: 3
 *               moveCol:
 *                 type: int32
 *                 description: The column number where the player wants to play this card, from 0 to 9
 *                 example: 7
 *       required: true
 *     parameters:
 *       - name: code
 *         in: path
 *         description: The unique 4 character code for this game
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: successful operation
 *       401:
 *         description: unauthorised - invalid API token
 *       404:
 *         description: game not found
 *       422:
 *         description: unprocessable
 */

//************************************
// POST ROUND IN GAME
//************************************
function postRound(event, callback) {

  //already validated code
  const code = event.pathParameters.code;

  //validate the body
  const jsonBody = utilities.ParseJson(event.body);  //deals with nulls and JSON parse errors

  //Check expected body parameters are set
  const params = ['card', 'moveRow', 'moveCol'];
  for (var i = 0; i < params.length; i++) {
    if (!(params[i] in jsonBody)) {
      var error = new Error('Parameter "' + params[i] + '" missing'); error.status = 422;
      return callback(null, utilities.ErrorResponse(event, error));      
    }
  }

  //Check params are valid
  //Card
  if (!isValidCard(jsonBody['card'])) {
    var error = new Error('Card "' + jsonBody['card'] + '" is not a valid card'); error.status = 422;
    return callback(null, utilities.ErrorResponse(event, error));          
  }
  const card = jsonBody['card'];

  //moveRow. Note: supports both int and string versions. Use + '' to coerce numbers to string.
  if (!validator.isInt(jsonBody['moveRow'] + '')) {
    var error = new Error('moveRow "' + jsonBody['moveRow'] + '" is not a valid integer'); error.status = 422;
    return callback(null, utilities.ErrorResponse(event, error));          
  }
  const moveRow = parseInt(jsonBody['moveRow'] + '');
  if (moveRow < 0 ! moveRow > 9) {
    var error = new Error('moveRow "' + moveRow + '" must be between 0 and 9'); error.status = 422;
    return callback(null, utilities.ErrorResponse(event, error));              
  }

  //moveCol  
  if (!validator.isInt(jsonBody['moveCol'] + '')) {
    var error = new Error('moveCol "' + jsonBody['moveCol'] + '" is not a valid integer'); error.status = 422;
    return callback(null, utilities.ErrorResponse(event, error));          
  }
  const moveCol = parseInt(jsonBody['moveCol'] + '');
  if (moveCol < 0 ! moveCol > 9) {
    var error = new Error('moveCol "' + moveCol + '" must be between 0 and 9'); error.status = 422;
    return callback(null, utilities.ErrorResponse(event, error));              
  }

  //Get the game: with this code, where active, and with the requestor as Player1 or Player2
  models.Game.findOne({
    attributes: ['id', 'status', 'cardsP1', 'cardsP2', 'cards', 'cardPos', 'nextPlayer', 'winner', 'boardState', 'Player1Id', 'Player2Id'],
    where: { [Op.and]: [
      { code: code.toUpperCase() },
      { status: 'active' },
      { [Op.or]: [ { Player1Id: principalId }, { Player2Id: principalId } ] }
    ]}
  })
  .then(function(game) {
    if (game == null) {
      var error = new Error('Game not found: ' + code); error.status = 404; throw(error);
    }

    //Check this players turn
    if ((game.nextPlayer == 1) && (game.Player1Id != principalId)) {
      var error = new Error('Not Player 1\'s turn'); error.status = 422; throw(error);      
    }
    if ((game.nextPlayer == 2) && (game.Player2Id != principalId)) {
      var error = new Error('Not Player 2\'s turn'); error.status = 422; throw(error);      
    }

    //Check the player has this card in their hand
    const cardsPlayer = (game.nextPlayer == 1) ? game.cardsP1.split(',') : game.cardsP2.split(',');
    if (!cardsPlayer.includes(card)) {
      var error = new Error('The card "' + card + '" is not in ' + ((game.nextPlayer == 1) ? 'Player 1' : 'Player 2') + '\'s hand'); error.status = 422; throw(error);            
    }

    //Check the move is valid
    const boardStateArray = utilities.createBoardStateArray(game.boardState);
    const ret = validateMove(card, moveRow, moveCol, boardStateArray, game.nextPlayer);
    if (!ret.isValid) {
      //invalid move. ret.reason contains the explanation
      var error = new Error('The card "' + card + '" can not be placed at row ' + moveRow + ', column ' + moveCol + ' Reason: ' + ret.reason); error.status = 422; throw(error);
    }
    //ret.boardStateArray contains the updated board state
    const boardState = createBoardStateString(ret.boardStateArray);

    //Update cards for this player
    //Remove the card that was played...
    var updatedPlayerCards = cardsPlayer.splice(cardsPlayer.indexOf(card), 1);;
    //...and deal the next card to them
    updatedPlayerCards.push(game.cards[game.cardPos]);

    //Have they won?
    if (didWin(boardStateArray)) {
      //Update the winner and game state
      return game.update({ status: 'ended', winner: game.nextPlayer, boardState: boardState });
    }
    else {
      //Update the nextPlayer, boardState and the cardPos in the pack...
      var updateObj = { nextPlayer: (game.nextPlayer == 1) ? 2 : 1, boardState: boardState, cardPos: game.cardPos + 1 };
      //... and update the relevant player's cards too
      if (game.nextPlayer == 1) {
        updateObj['cardsP1'] = updatedPlayerCards;
      }
      else {
        updateObj['cardsP2'] = updatedPlayerCards;        
      }
      return game.update(updateObj);
    }
  })
  .then(function(game) {
    return callback(null, utilities.okEmptyResponse(event));
  }, function(err) {
    return callback(null, utilities.errorResponse(event, err));
  }).catch(function (err) {
    return callback(null, utilities.errorResponse(event, err));
  });
}

//************************************
// HELPERS
//************************************

function validateMove(card, moveRow, moveCol, boardStateArray, nextPlayer) {
  //Deal first with corners - all invalid
  if ((moveRow == 0 && moveCol == 0) || (moveRow == 9 && moveCol == 0) || (moveRow == 0 && moveCol == 9) || (moveRow == 9 && moveCol == 9)) {
    //Corner position - invalid move
    return { isValid: false, reason: 'No card can be placed on a corner position' };
  }

  //Now deal with non-jacks. Logic: needs to match the card in boardGameWithCards and not already have a piece on it
  const cardParts = card.split('|');

  if (cardParts[0] != 'J') {
    //Not a Jack
    const bgWithCards = boardGameWithCards();
    if (bgWithCards[moveRow][moveCol] != card) {
      //the move is to an invalid cell
      return { isValid: false, reason: 'The card played does not match the board card at this position' };
    }
    if (boardStateArray[moveRow][moveCol] != '') {
      //the board position is already occupied
      return { isValid: false, reason: 'There is already a card at this position' };
    }

    //Valid move: update the board state to set this position owned by player
    boardStateArray[moveRow][moveCol] = (nextPlayer == 1) ? 'p1' : 'p2';
    return { isValid: true, boardStateArray: boardStateArray };
  }

  //A Jack. See if one-eyed or not (Spades and Hearts are one-eyed)
  const isOneEyed = (['S', 'H'].includes(cardParts[1]));
  if (isOneEyed) {
    //One-eyed Jacks are 'anti-wild'
    //Rule: "remove one marker chip from the game board belonging to your opponent"
    if (boardStateArray[moveRow][moveCol] != (nextPlayer == 1) ? 'p2' : 'p1') {
      //the board position is not occupied by the opposition
      return { isValid: false, reason: 'There is no opponent card at this position' };
    }

    //Valid move: update the board state to clear this position
    boardStateArray[moveRow][moveCol] = '';
    return { isValid: true, boardStateArray: boardStateArray };
  }

  //Two-eyed Jacks are 'wild'
  //Rule: "place one of your marker chips on any open space on the game board"
  if (boardStateArray[moveRow][moveCol] != '') {
    //the board position is already occupied
    return { isValid: false, reason: 'There is already a card at this position so you cannot play a two-eyed Jack here' };
  }

  //Valid move: update the board state to set this position owned by player
  boardStateArray[moveRow][moveCol] = (nextPlayer == 1) ? 'p1' : 'p2';
  return { isValid: true, boardStateArray: boardStateArray };    
}

//Returns true if a player has won
function didWin(boardStateArray) {
  //Test corners first - only need 4 long
  //Top row
  if (areCellsSameRow(boardStateArray, 1, 0, 4)) { return true; }
  if (areCellsSameRow(boardStateArray, 5, 0, 4)) { return true; }
  //Bottom row
  if (areCellsSameRow(boardStateArray, 1, 9, 4)) { return true; }
  if (areCellsSameRow(boardStateArray, 5, 9, 4)) { return true; }
  //First col
  if (areCellsSameCol(boardStateArray, 0, 1, 4)) { return true; }
  if (areCellsSameCol(boardStateArray, 0, 5, 4)) { return true; }
  //Last col
  if (areCellsSameCol(boardStateArray, 9, 1, 4)) { return true; }
  if (areCellsSameCol(boardStateArray, 9, 5, 4)) { return true; }
  //Diagonals - downwards
  if (areCellsSameDiagDown(boardStateArray, 1, 1, 4)) { return true; }
  if (areCellsSameDiagDown(boardStateArray, 5, 5, 4)) { return true; }
  //Diagonals - upwards
  if (areCellsSameDiagUp(boardStateArray, 1, 8, 4)) { return true; }
  if (areCellsSameDiagUp(boardStateArray, 5, 5, 4)) { return true; }

  //Now test all rows from 0..9 and cols from 0..5
  for (var row = 0; row < 10; row++) {
    for (var col = 0; col < 6; col++) {
      if (areCellsSameRow(boardStateArray, row, col, 5)) { return true; }
    }
  }
  //Now test all cols from 0..9 and rows from 0..5
  for (var col = 0; col < 10; col++) {
    for (var row = 0; row < 6; row++) {
      if (areCellsSameRow(boardStateArray, row, col, 5)) { return true; }
    }
  }
  //Now test diagonals - downwards
  for (var col = 0; col < 6; col++) {
    for (var row = 0; row < 6; row++) {
      if (areCellsSameDiagDown(boardStateArray, row, col, 5)) { return true; }
    }
  }
  //Now test diagonals - upwards
  for (var col = 0; col < 6; col++) {
    for (var row = 5; row < 10; row++) {
      if (areCellsSameDiagUp(boardStateArray, row, col, 5)) { return true; }
    }
  }
  return false;
}

//4 helpers to test for vals same on row, column or diagonal
function areCellsSameRow(boardStateArray, r, c, len) {
  const startVal = boardStateArray[r][c];
  if (startVal == '') { return false; }
  for (var i = 0; i < len; i++) {
    //Increment row by i
    if (boardStateArray[r + i][c] != startVal) { return false; }
  }
  return true;
}
function areCellsSameCol(boardStateArray, r, c, len) {
  const startVal = boardStateArray[r][c];
  if (startVal == '') { return false; }
  for (var i = 0; i < len; i++) {
    //Increment col by i
    if (boardStateArray[r][c + i] != startVal) { return false; }
  }
  return true;
}
//Need to deal with diagonal that increments on both - ie downward and increments on row / decrements on col - ie upward
function areCellsSameDiagDown(boardStateArray, r, c, len) {
  const startVal = boardStateArray[r][c];
  if (startVal == '') { return false; }
  for (var i = 0; i < len; i++) {
    //Increment both by i
    if (boardStateArray[r + i][c + i] != startVal) { return false; }
  }
  return true;
}
function areCellsSameDiagUp(boardStateArray, r, c, len) {
  const startVal = boardStateArray[r][c];
  if (startVal == '') { return false; }
  for (var i = 0; i < len; i++) {
    //Increment row, decrement column by i
    if (boardStateArray[r + i][c - i] != startVal) { return false; }
  }
  return true;
}

//Get the board game with the card values. Blank for the corners.
function boardGameWithCards() {
  return [
    ["", "6|D", "7|D", "8|D", "9|D", "10|D", "Q|D", "K|D", "A|D", ""],
    ["5|D", "3|H", "2|H", "2|S", "3|S", "4|S", "5|S", "6|S", "7|S", "A|C"],
    ["4|D", "4|H", "K|D", "A|D", "A|C", "K|C", "Q|C", "10|C", "8|S", "K|C"],
    ["3|D", "5|H", "Q|D", "Q|H", "10|H", "9|H", "8|H", "9|C", "9|S", "Q|C"],
    ["2|D", "6|H", "10|D", "K|H", "3|H", "2|H", "7|H", "8|C", "10|S", "10|C"],
    ["A|S", "7|H", "9|D", "A|H", "4|H", "5|H", "6|H", "7|C", "Q|S", "9|C"],
    ["K|S", "8|H", "8|D", "2|C", "3|C", "4|C", "5|C", "6|C", "K|S", "8|C"],
    ["Q|S", "9|H", "7|D", "6|D", "5|D", "4|D", "3|D", "2|D", "A|S", "7|C"],
    ["10|S", "10|H", "Q|H", "K|H", "A|H", "2|C", "3|C", "4|C", "5|C", "6|C"],
    ["", "9|S", "8|S", "7|S", "6|S", "5|S", "4|S", "3|S", "2|S", ""],
  ];
}

function isValidCard(card) {
  card = card.trim();
  const cardParts = card.split('|');

  if (cardParts.length != 2) {
    return false;
  }

  if (!['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'].includes(cardParts[0])) {
    return false;
  }

  if (!['C', 'D', 'H', 'S'].includes(cardParts[1])) {
    return false;
  }
  return true;
}

exports.handler = (event, context, callback) => {

  //** BOILERPLATE START **//
  context.callbackWaitsForEmptyEventLoop = false;
  if (_.get(event, 'requestContext.authorizer.principalId', false) === false) {
    var err = new Error('Unauthorised (1)'); err.status = 401;
    return callback(null, utilities.ErrorResponse(event, err));
  }
  principalId = parseInt(event.requestContext.authorizer.principalId);
  const method = event.httpMethod || 'undefined';       //like GET
  //** BOILERPLATE END **//

  switch (method) {
    case 'POST':
      if ((event.resource.toLowerCase() == '/games/{code}/rounds') && ('pathParameters' in event)
        && ('code' in event.pathParameters)) {
        //like /games/{code}/rounds
        if (utilities.isValidGameCode(event.pathParameters.code.toUpperCase())) {
          postRound(event, callback);
        }
        else {
          //Custom error message for invalid code format
          var error = new Error('Invalid game code: ' + event.pathParameters.code); error.status = 404;
          return callback(null, utilities.errorResponse(event, error));
        }
      }
      else {         
        return callback(null, utilities.errorResponse(event));
      }
      break;

    default:
      return callback(null, utilities.ErrorResponse(event));
      break;    
  }

};

