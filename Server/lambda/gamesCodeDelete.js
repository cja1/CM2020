const models = require(__dirname + "/models");
const Op = models.Sequelize.Op;
const validator = require('validator');
const _ = require('lodash');
const utilities = require(__dirname + '/utilities.js');

var principalId;

/**
 * @swagger
 *
 * /games/{code}:
 *   delete:
 *     tags:
 *     - Games
 *     summary: Delete a new game. This request sets the game 'status' to 'ended' and the 'winner' to 0 to indicate no winner. Note that DELETE is idempotent - as long as the game code is valid for this player then the operation succeeds even if the game state is already set to ended. Note also that a game that has been won (and ended) will keep the existing 'winner' value, so calling DELETE doesn't remove the winner.
 *     operationId: Delete a game
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
 *         description: unauthorised - invalid Authorisation Bearer token
 *       404:
 *         description: game not found
 */

//************************************
// DELETE GAME
//************************************
function deleteGame(event, callback) {

  //already validated code
  const code = event.pathParameters.code.toUpperCase();

  //Get the game: with this code, where waitingForPlayers, active or ended, and with the requestor as Player1 or Player2
  models.Game.findOne({
    attributes: ['id', 'status', 'winner'],
    where: { [Op.and]: [
      { code: code.toUpperCase() },
      { [Op.or]: [ { Player1Id: principalId }, { Player2Id: principalId } ] }
    ]}
  })
  .then(function(game) {
    if (game == null) {
      var error = new Error('Game not found: ' + code); error.status = 404; throw(error);
    }

    //If game ended then no action
    if (game.status == 'ended') {
      return Promise.resolve();
    }

    //Set game status to ended and winner to 0 to indicate no winner
    return game.update({ status: 'ended', winner: 0 });
  })
  .then(function(game) {
    //Return 204 success even if no change (DELETE is idempotent)
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
  const method = event.httpMethod || 'undefined';       //like GET
  const pathParameters = (event.pathParameters == null || !event.pathParameters.proxy) ? [] : event.pathParameters.proxy.split('/');
  //** BOILERPLATE END **//

  switch (method) {
    case 'DELETE':
      if ((event.resource.toLowerCase() == '/games/{code}') && ('pathParameters' in event)
        && ('code' in event.pathParameters)) {
        //like /games/{code}/rounds
        if (utilities.isValidGameCode(event.pathParameters.code.toUpperCase())) {
          deleteGame(event, callback);
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

