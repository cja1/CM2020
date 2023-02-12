const models = require(__dirname + "/models");
const Op = models.Sequelize.Op;
const validator = require('validator');
const _ = require('lodash');
const utilities = require(__dirname + '/utilities.js');

var principalId, deviceUUID;

/**
 * @swagger
 *
 * /bots:
 *   post:
 *     tags:
 *     - Bots
 *     summary: Bot play a round in a game. Request the bot to play a round. Players pass in the game code. The bot gets the players cards and plays a round in the game.
 *     operationId: Bot play a round
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code:
 *                 type: string
 *                 description: The unique 4 character code for this game
 *                 example: 12AB
 *       required: true
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
// POST BOT PLAY ROUND IN GAME
//************************************
function postBot(event, callback) {

  //validate the body
  const jsonBody = utilities.parseJson(event.body);  //deals with nulls and JSON parse errors

  //Check expected body parameters are set
  const params = ['code'];
  for (var i = 0; i < params.length; i++) {
    if (!(params[i] in jsonBody)) {
      var error = new Error('Parameter "' + params[i] + '" missing'); error.status = 422;
      return callback(null, utilities.errorResponse(event, error));      
    }
  }

  //Check params are valid
  //Code
  if (!utilities.isValidGameCode(jsonBody['code'].toUpperCase())) {
    var error = new Error('Code "' + jsonBody['code'] + '" is not a valid game code'); error.status = 422;
    return callback(null, utilities.errorResponse(event, error));          
  }
  const code = jsonBody['code'].toUpperCase();

  //Check game state - must be 'active' and this player part of games else error
  models.Game.findOne({
    attributes: ['id', 'status', 'Player1Id', 'Player2Id', 'nextPlayer'],
    where: { [Op.and]: [
      { code: code.toUpperCase() },
      { status: { [Op.in]: ['waitingForPlayers', 'active'] } }
    ]}
  })
  .then(function(game) {
    console.log('game', game);
    if (game == null) {
      var error = new Error('Game not found: ' + code); error.status = 404; throw(error);
    }
    if (game.status == 'waitingForPlayers') {
      var error = new Error('The game is waiting for a second player to join'); error.status = 422; throw(error);      
    }
    if ((game.Player1Id != principalId) && (game.Player2Id != principalId)) {
      var error = new Error('This player is not in this game'); error.status = 422; throw(error);      
    }
    //Check this players turn
    if ((game.nextPlayer == 1) && (game.Player1Id != principalId)) {
      var error = new Error('Not Player 2\'s turn'); error.status = 422; throw(error);      
    }
    if ((game.nextPlayer == 2) && (game.Player2Id != principalId)) {
      var error = new Error('Not Player 1\'s turn'); error.status = 422; throw(error);      
    }

    //Create SQS entry to request the bot play a round for this game code with this user's deviceUUID
    //v6 bot
    return utilities.createSQSEntryForBot(code, deviceUUID, 6);
  })
  .then(function() {  
    console.log('Successfully requested bot play a round', principalId, code, deviceUUID);
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
  deviceUUID = event.requestContext.authorizer.deviceUUID;
  const method = event.httpMethod || 'undefined';       //like GET
  const pathParameters = (event.pathParameters == null || !event.pathParameters.proxy) ? [] : event.pathParameters.proxy.split('/');
  //** BOILERPLATE END **//

  switch (method) {
    case 'POST':
      switch (pathParameters.length) {
        case 0:   //like /bots
          postBot(event, callback);
          break;

        default:
          return callback(null, utilities.errorResponse(event));
          break;
      }
      break;

    default:
      return callback(null, utilities.errorResponse(event));
      break;    
  }

};

