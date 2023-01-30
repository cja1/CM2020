const models = require(__dirname + "/models");
const Op = models.Sequelize.Op;
const validator = require('validator');
const _ = require('lodash');
const utilities = require(__dirname + '/utilities.js');

var principalId, isBot1, isBot2;

/**
 * @swagger
 *
 * /games/{code}/players:
 *   post:
 *     tags:
 *     - Games
 *     summary: Join a game. The second player joins a game by POSTing to the /games/{code}/players endpoint, where {code} is the 4 digit game code received by the player who created the game.
 *     operationId: Join a game
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
 *       409:
 *         description: conflict - another player has aready accepted to join this game
 *       422:
 *         description: unprocessable - this player has already joined this game (ie this player created the game)
 */

//************************************
// POST PLAYER TO GAME
//************************************
function postPlayer(event, callback) {

  //already validated code
  const code = event.pathParameters.code.toUpperCase();
  var game;

  models.Game.findOne({
    attributes: ['id', 'status', 'Player1Id', 'Player2Id', 'isPlayer1Bot'],
    where: { [Op.and]: [
      { code: code.toUpperCase() },
      { status: { [Op.in]: ['waitingForPlayers', 'active'] } }
    ]}
  })
  .then(function(thisGame) {
    game = thisGame;  //save to function scope
    console.log('game', game);
    if (game == null) {
      var error = new Error('Game not found: ' + code); error.status = 404; throw(error);
    }
    if (game.status == 'active') {
      var error = new Error('This game already has 2 players'); error.status = 409; throw(error);      
    }
    if (game.Player1Id == principalId) {
      var error = new Error('Game created by this player - cannot be joined a second time'); error.status = 422; throw(error);      
    }
    //add this player to the game and set status to 'active'
    return game.update({ status: 'active', Player2Id: principalId })
  })
  .then(function(game) {
    //If player is a bot, no action
    if (isBot1 || isBot2) {
      return Promise.resolve();
    }
    //Player is not a bot. Set status to 'ended' and set winner to 0 to indicate no winner
    //for any waitingForPlayers or active game this player is in - apart from the current game
    return models.Game.update(
      { status: 'ended', winner: 0 },
      { where: { [Op.and]: [
        { status: { [Op.in]: ['waitingForPlayers', 'active'] } },
        { [Op.or]: [ { Player1Id: principalId }, { Player2Id: principalId } ] },
        { id: { [Op.ne]: game.id } }
      ]}}
    );
  })
  .then(function() {
    //If isPlayer1Bot then the second player has just joined and we want to trigger player 1 bot to play a round
    if (game.isPlayer1Bot) {
      console.log('Creating SQS entry to trigger Bot 1 play a round');
      return utilities.createSQSEntryForBot(code, utilities.BOT1_DEVICE_UUID);
    }
    return Promise.resolve();
  })
  .then(function(game) {
    return callback(null, utilities.okEmptyResponse(event));
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
  isBot1 = event.requestContext.authorizer.isBot1 == 'true';
  isBot2 = event.requestContext.authorizer.isBot2 == 'true';
  const method = event.httpMethod || 'undefined';       //like GET
  //** BOILERPLATE END **//

  switch (method) {
    case 'POST':
      if ((event.resource.toLowerCase() == '/games/{code}/players') && ('pathParameters' in event)
        && ('code' in event.pathParameters)) {
        //like /games/{code}/players
        if (utilities.isValidGameCode(event.pathParameters.code.toUpperCase())) {
          postPlayer(event, callback);
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

