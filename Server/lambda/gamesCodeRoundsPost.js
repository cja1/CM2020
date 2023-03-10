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
 *       200:
 *         description: successful operation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GameState'
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
  const code = event.pathParameters.code.toUpperCase();

  //validate the body
  const jsonBody = utilities.parseJson(event.body);  //deals with nulls and JSON parse errors

  //hold game state
  var gameState;

  //Check expected body parameters are set
  const params = ['card', 'moveRow', 'moveCol'];
  for (var i = 0; i < params.length; i++) {
    if (!(params[i] in jsonBody)) {
      var error = new Error('Parameter "' + params[i] + '" missing'); error.status = 422;
      return callback(null, utilities.errorResponse(event, error));      
    }
  }

  //Check params are valid
  //Card
  if (!isValidCard(jsonBody['card'].toUpperCase())) {
    var error = new Error('Card "' + jsonBody['card'] + '" is not a valid card'); error.status = 422;
    return callback(null, utilities.errorResponse(event, error));          
  }
  const card = jsonBody['card'].toUpperCase();

  //moveRow. Note: supports both int and string versions. Use + '' to coerce numbers to string.
  if (!validator.isInt(jsonBody['moveRow'] + '')) {
    var error = new Error('moveRow "' + jsonBody['moveRow'] + '" is not a valid integer'); error.status = 422;
    return callback(null, utilities.errorResponse(event, error));          
  }
  const moveRow = parseInt(jsonBody['moveRow'] + '');
  if (moveRow < 0 || moveRow > 9) {
    var error = new Error('moveRow "' + moveRow + '" must be between 0 and 9'); error.status = 422;
    return callback(null, utilities.errorResponse(event, error));              
  }

  //moveCol  
  if (!validator.isInt(jsonBody['moveCol'] + '')) {
    var error = new Error('moveCol "' + jsonBody['moveCol'] + '" is not a valid integer'); error.status = 422;
    return callback(null, utilities.errorResponse(event, error));          
  }
  const moveCol = parseInt(jsonBody['moveCol'] + '');
  if (moveCol < 0 || moveCol > 9) {
    var error = new Error('moveCol "' + moveCol + '" must be between 0 and 9'); error.status = 422;
    return callback(null, utilities.errorResponse(event, error));              
  }

  //Get the game: with this code, where active or waitingForPlayers, and with the requestor as Player1 or Player2
  models.Game.findOne({
    attributes: ['id', 'status', 'cardsP1', 'cardsP2', 'cards', 'cardPos', 'nextPlayer', 'winner', 'boardState', 'Player1Id', 'Player2Id', 'isPlayer1Bot', 'isPlayer2Bot',
      'handsPlayed', 'createdAt', 'updatedAt'],
    include: [
      { model: models.User, as: 'Player1', required: true, attributes: ['id', 'name', 'color'] },
      { model: models.User, as: 'Player2', required: false, attributes: ['id', 'name', 'color'] }
    ],
    where: { [Op.and]: [
      { code: code.toUpperCase() },
      { status: { [Op.in]: ['waitingForPlayers', 'active'] }},
      { [Op.or]: [ { Player1Id: principalId }, { Player2Id: principalId } ] }
    ]}
  })
  .then(function(game) {
    if (game == null) {
      var error = new Error('Game not found: ' + code); error.status = 404; throw(error);
    }
    if (game.status == 'waitingForPlayers') {
      //also a 404 but nicer error message
      var error = new Error('Game with code ' + code + ' waiting for second player to join'); error.status = 404; throw(error);      
    }
    //Check this players turn
    if ((game.nextPlayer == 1) && (game.Player1Id != principalId)) {
      var error = new Error('Not Player 2\'s turn'); error.status = 422; throw(error);      
    }
    if ((game.nextPlayer == 2) && (game.Player2Id != principalId)) {
      var error = new Error('Not Player 1\'s turn'); error.status = 422; throw(error);      
    }

    //Check the player has this card in their hand
    var cardsPlayer = (game.nextPlayer == 1) ? game.cardsP1 : game.cardsP2;
    cardsPlayer = (cardsPlayer == '') ? [] : cardsPlayer.split(',');

    //var cardsOpponent = (game.nextPlayer == 2) ? game.cardsP1 : game.cardsP2;
    //cardsOpponent = (cardsOpponent == '') ? [] : cardsOpponent.split(',');

    if (!cardsPlayer.includes(card)) {
      var error = new Error('The card ' + card + ' is not in ' + ((game.nextPlayer == 1) ? 'Player 1' : 'Player 2') + '\'s hand'); error.status = 422; throw(error);            
    }

    //Check the move is valid
    const boardStateArray = utilities.createBoardStateArray(game.boardState);
    const ret = validateMove(card, moveRow, moveCol, boardStateArray, game.nextPlayer);
    if (!ret.isValid) {
      //invalid move. ret.reason contains the explanation
      var error = new Error('The card ' + card + ' can not be placed at row ' + moveRow + ', column ' + moveCol + '. Reason: ' + ret.reason); error.status = 422; throw(error);
    }
    //ret.boardStateArray contains the updated board state
    const boardState = utilities.createBoardStateString(ret.boardStateArray);

    //Update cards for this player
    //Remove the card that was played...
    cardsPlayer.splice(cardsPlayer.indexOf(card), 1);

    //Also auto-remove any un-playable cards (ie no position open on board for this card)
    cardsPlayer.forEach((cardPlayer) => {
      //Ignore One-eyed jacks - as 1-eyed remove opponent's card and opponent may not have played yet
      if (utilities.isOneEyedJack(cardPlayer)) {
        return;
      }
      const moves = utilities.getMovesForCard(cardPlayer, ret.boardStateArray, game.nextPlayer);
      if (moves.length == 0) {
        //remove this card as no moves
        console.log('Removed card as un-playable', cardPlayer);
        cardsPlayer.splice(cardsPlayer.indexOf(cardPlayer), 1);
      }
    });

    //Deal up to CARDS_PER_PLAYER cards if cards left
    var cardPos = game.cardPos;
    const cards = game.cards.split(',');
    while ((cardPos < cards.length) && (cardsPlayer.length < utilities.CARDS_PER_PLAYER)) {
      cardsPlayer.push(cards[cardPos]);
      cardPos += 1;
    }

    //Add items to gameState that are always present regardless of status
    gameState = {
      status: 'active',
      players: [
        { name: game.Player1.name, color: game.Player1.color, isMe: game.Player1.id == principalId },
        { name: game.Player2.name, color: game.Player2.color, isMe: game.Player2.id == principalId }
      ],
      boardState: utilities.createBoardStateArray(boardState),
      handsPlayed: game.handsPlayed + 1,
      duration: (game.updatedAt.getTime() - game.createdAt.getTime()) / 1000
    }

    //If no cards in player's hand OR played more than MAX_HANDS_PLAYED hands (should never happen) then stop
    if ((cardsPlayer.length == 0)|| (game.handsPlayed > utilities.MAX_HANDS_PLAYED)) {
      gameState.status = 'ended';
      gameState['winner'] = 0;
      return game.update({ status: 'ended', winner: 0, boardState: boardState });   
    }

    //Have they won?
    const winState = utilities.getWinState(boardStateArray);
    if (winState.didWin) {
      //Update the winner, game state and winningSequence
      gameState.status = 'ended';
      gameState['winner'] = game.nextPlayer;
      gameState['winningSequence'] = winState.winningSequence;
      return game.update({ status: 'ended', winner: game.nextPlayer, boardState: boardState, winningSequence: JSON.stringify(winState.winningSequence) });
    }
    else {
      //Update the nextPlayer, boardState, cardPos in the pack and handsPlayed
      gameState['nextPlayer'] = (game.nextPlayer == 1) ? 2 : 1;
      gameState['cards'] = cardsPlayer;

      var updateObj = { nextPlayer: (game.nextPlayer == 1) ? 2 : 1, boardState: boardState, cardPos: cardPos, handsPlayed: game.handsPlayed + 1 };
      //... and update the relevant player's cards too
      if (game.nextPlayer == 1) {
        updateObj['cardsP1'] = cardsPlayer.join(',');
      }
      else {
        updateObj['cardsP2'] = cardsPlayer.join(',');
      }
      return game.update(updateObj);
    }
  })
  .then(function(game) {
    //see if bot plays next
    //If yes, create an SQS entry to signal the bot to play a round in this game
    if ((game.nextPlayer == 1) && game.isPlayer1Bot && (game.status != 'ended')) {
      //Make bot 1 use version 7 bot
      return utilities.createSQSEntryForBot(code, utilities.BOT1_DEVICE_UUID, 7);
    }
    if ((game.nextPlayer == 2) && game.isPlayer2Bot && (game.status != 'ended')) {
      //Bot 2 use v7 bot
      return utilities.createSQSEntryForBot(code, utilities.BOT2_DEVICE_UUID, 7);
    }
    //Neither player a bot
    return Promise.resolve();
  })
  .then(function() {  
    console.log('Successfully played round', principalId, card, moveRow, moveCol);
    return callback(null, utilities.okResponse(event, gameState));
  }, function(err) {
    console.log(err);
    return callback(null, utilities.errorResponse(event, err));
  }).catch(function (err) {
    console.log(err);
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
    const bgWithCards = utilities.boardGameWithCards();
    if (bgWithCards[moveRow][moveCol] != card) {
      //the move is to an invalid cell
      const playOptions = utilities.playOptionsForCard(card);
      return { isValid: false, reason: 'The card does not match the board card at this position (' + bgWithCards[moveRow][moveCol] + '). The card ' + card + ' can be played at ' + playOptions.join(' and ') + '.'  };
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
    const opponent = (nextPlayer == 1) ? 'p2' : 'p1';
    if (boardStateArray[moveRow][moveCol] != opponent) {
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
    return callback(null, utilities.errorResponse(event, err));
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
      return callback(null, utilities.errorResponse(event));
      break;    
  }

};

