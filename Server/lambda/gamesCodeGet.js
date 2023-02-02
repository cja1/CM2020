const models = require(__dirname + "/models");
const Op = models.Sequelize.Op;
const validator = require('validator');
const _ = require('lodash');
const utilities = require(__dirname + '/utilities.js');

var principalId;

/**
 * @swagger
 *
 * components:
 *   schemas:
 *     Player:
 *       type: object
 *       description: Player information
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the player. Currently this is set to a random player name when the player is created, format 'PlayerXXXXX' where 'X' is a 0-9 random digit.
 *           example: Player12345
 *         color:
 *           type: string
 *           description: The color for this player as a hex string. Currently this is set to a random color when the player is created, format 'XXXXXX' where 'X' is a 0-9a-f hex color.
 *           example: ff0000
 *         isMe:
 *           type: boolean
 *           description: Flag indicating if this player is the player making the request
 *           example: true
 *
 *     BoardRow:
 *       type: array
 *       description: The state of one row on the board as a 10 element array of strings. The string is blank if no-one owns the cell, 'p1' if Player 1 owns it, or 'p2' if Player 2 owns it.
 *       example: ['', '', '', 'p1', 'p2', '', 'p1', '', '', '']
 *       items:
 *         type: string
 *
 *     BoardPosition:
 *       type: array
 *       description: An x, y cooridnate on the board
 *       example: [0,1]
 *       items:
 *         type: int32
 * 
 *     WinningSequence:
 *       type: object
 *       description: A game winning sequence
 *       properties:
 *         type:
 *           type: string
 *           enum: [row, col, diagDR, diagDL]
 *           description: The type of winning sequence. One of 'row', 'col', 'diagDR' and 'diagDL' for row, column, diagonal down and to the right and diagonal down and to the left.
 *           example: row
 *         sequence:
 *           type: array
 *           description: The winning sequence as a length 5 array of points on the game board.
 *           items:
 *             $ref: '#/components/schemas/BoardPosition' 

 *     GameState:
 *       type: object
 *       description: Game state information. Always returns 'status' and 'players'. Other properties depend on game status - <ul><li><b>status = 'waitingForPlayers'</b> returns 'status', 'players'</li><li><b>status = 'active'</b> returns 'status', 'players', 'nextPlayer', 'boardState', 'cards'</li><li><b>status = 'ended'</b> returns 'status', 'players', 'winner', 'boardState'</li></ul>
 *       required: [status, players]
 *       properties:
 *         status:
 *           type: string
 *           enum: [waitingForPlayers, active, ended]
 *           description: The game status, one of waitingForPlayers, active or ended
 *           example: active
 *         players:
 *           type: array
 *           description: The names of the players in this game. The first player is always the player who created the game.
 *           items:
 *             $ref: '#/components/schemas/Player' 
 *         cards:
 *           type: array
 *           description: The cards in this player's hand as an array of strings. Card first part is the value, second part is the suit. Separated by a | as a delimiter.
 *           example: [A|S, 10|H, 2|C]
 *           items:
 *             type: string
 *         nextPlayer:
 *           type: int32
 *           description: The number of the next player. 1 = Player 1, 2 = Player 2.
 *           example: 1
 *         boardState:
 *           type: array
 *           description: The current state of the game board - same for each player - sent as a 10 row array of BoardRow objects.
 *           items:
 *             $ref: '#/components/schemas/BoardRow' 
 *         winner:
 *           type: int32
 *           description: The number of the player who won. 1 = Player 1, 2 = Player 2. Note that 0 indicates that no player won - ie game was cancelled before a Player won the game.
 *           example: 2
 *         winningSequence:
 *           type: object
 *           description: The winning sequence object, containing the type of win and a length 5 array of winning points on the game board.
 *           $ref: '#/components/schemas/WinningSequence' 
 * 
 * /games/{code}:
 *   get:
 *     tags:
 *     - Games
 *     summary: Get the state of this game. Always returns 'status' and 'players'. Other properties depend on game status - <ul><li><b>status = 'waitingForPlayers'</b> returns 'status', 'players'</li><li><b>status = 'active'</b> returns 'status', 'players', 'nextPlayer', 'boardState', 'cards'</li><li><b>status = 'ended'</b> returns 'status', 'players', 'winner', 'boardState'</li></ul>
 *     operationId: Get game state
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
 */

//************************************
// GET GAME STATUS
//************************************
function getGame(event, callback) {

  //already validated code
  const code = event.pathParameters.code.toUpperCase();

  //Get the game: with this code
  models.Game.findOne({
    attributes: ['id', 'status', 'cardsP1', 'cardsP2', 'nextPlayer', 'winner', 'winningSequence', 'boardState', 'Player1Id', 'Player2Id'],
    include: [
      { model: models.User, as: 'Player1', required: true, attributes: ['id', 'name', 'color'] },
      { model: models.User, as: 'Player2', required: false, attributes: ['id', 'name', 'color'] }
    ],
    where: { code: code }
  })
  .then(function(game) {
    if (game == null) {
      var error = new Error('Game not found: ' + code); error.status = 404; throw(error);
    }

    //Create players array
    var players = [ { name: game.Player1.name, color: game.Player1.color, isMe: game.Player1.id == principalId }];
    if (game.Player2 != null) {
      //Add second player
      players.push({ name: game.Player2.name, color: game.Player2.color, isMe: game.Player2.id == principalId });
    }

    //Add items to gameState that are always present regardless of status
    var gameState = {
      status: game.status,  //'waitingForPlayers', 'active' or 'ended'
      players: players
    }

    //Test if this requestor is one of the players. If not, only return if game is 'waitingForPlayers'
    if ((game.Player1.id == principalId) || ((game.Player2 != null) && ('id' in game.Player2) && (game.Player2.id == principalId))) {
      //If active or ended, add boardState and cards
      if (game.status == 'active') {
        gameState['nextPlayer'] = game.nextPlayer;

        //return cards for this player. If empty, blank
        const cards = (game.Player1Id == principalId) ? game.cardsP1 : game.cardsP2;
        gameState['cards'] = (cards == '') ? [] : cards.split(',');

        //Send the board state as an array of arrays, 10x10
        gameState['boardState'] = utilities.createBoardStateArray(game.boardState);      
      }

      //If ended, also add winner and winning sequence
      if (game.status == 'ended') {
        gameState['winner'] = game.winner;
        gameState['winningSequence'] = JSON.parse(game.winningSequence);
        gameState['boardState'] = utilities.createBoardStateArray(game.boardState);      
      }
    }
    else if (game.status != 'waitingForPlayers') {
      //This is an error: a player not in the game requesting info about the game that has started or ended
      var error = new Error('This player is not playing in this game'); error.status = 404; throw(error);
    }

    console.log(gameState);

    return callback(null, utilities.okResponse(event, gameState));
  }, function(err) {
    console.log(err);
    return callback(null, utilities.errorResponse(event, err));
  }).catch(function (err) {
    console.log(err);
    return callback(null, utilities.errorResponse(event, err));
  });
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
    case 'GET':
      if ((event.resource.toLowerCase() == '/games/{code}') && ('pathParameters' in event)
        && ('code' in event.pathParameters)) {
        //like /games/{code}/rounds
        if (utilities.isValidGameCode(event.pathParameters.code.toUpperCase())) {
          getGame(event, callback);
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

