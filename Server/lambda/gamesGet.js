const models = require(__dirname + "/models");
const Op = models.Sequelize.Op;
const _ = require('lodash');
const utilities = require(__dirname + '/utilities.js');

var principalId;

/**
 * @swagger
 *
 * components:
 *   schemas:
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
 * 
 * /games:
 *   get:
 *     tags:
 *     - Games
 *     summary: Get a list of games. This request returns all the completed game winning sequences as an array. This is primarily used for development and testing to ensure that all different possible winning sequences are tested and result in a win being declared.
 *     operationId: Get a list of games
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WinningSequence' 
 *       401:
 *         description: unauthorised - invalid Authorisation Bearer token
 */

//************************************
// GET GAMES
//************************************
function getGames(event, callback) {

  models.Game.findAll({
    attributes: ['winningSequence'],
    where: { [Op.and]: [
      { winningSequence: { [Op.ne]: null } },
      { status: 'ended' }
    ]}
  })
  .then(function(games) {
    var winningSequences = [];
    games.forEach((game) => {
      winningSequences.push(JSON.parse(game.winningSequence));
    });
    return callback(null, utilities.okResponse(event, winningSequences));
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
  const pathParameters = (event.pathParameters == null || !event.pathParameters.proxy) ? [] : event.pathParameters.proxy.split('/');
  //** BOILERPLATE END **//

  switch (method) {
    case 'GET':
      switch (pathParameters.length) {
        case 0:   //like /games
          getGames(event, callback);
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

