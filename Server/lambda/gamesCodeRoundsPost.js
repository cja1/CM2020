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
 *     summary: Play a round in a game. NOT IMPLEMENTED YET. NEED TO PASS THE CARD IN THE POST BODY.
 *     operationId: Play a round NOT LIVE
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

  //STEPS
  /*
  -is this player in the game?
  - is it this player's turn?
  - do they have the card they are playing?
  - is the move valid?
  - have they won?

  ...
  - update board state
  - return success
  */
  //TODO: implement this
  callback(null, utilities.errorResponse(event));
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

