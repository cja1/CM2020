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
 *     GameOutcome:
 *       type: object
 *       description: The data set for the outcome of a game
 *       required: [handsPlayed, winner]
 *       properties:
 *         handsPlayed:
 *           type: int32
 *           description: The number of hands played in this game. Maximum is 104 as a maximum of 52 x 2 cards played.
 *           example: 65
 *         winner:
 *           type: int32
 *           enum: [0, 1, 2]
 *           description: The winner of the game. Either 0 represening no winner (a draw), 1 representing Player 1 or 2 represening Player 2
 *           example: 1
 *         winningSequence:
 *           type: object
 *           description: The winning sequence object, containing the type of win and a length 5 array of winning points on the game board.
 *           $ref: '#/components/schemas/WinningSequence' 
 *         duration:
 *           type: int32
 *           description: The duration of the game in seconds
 *           example: 610
 *         createdAt:
 *           type: string
 *           description: The date and time this game was created as an ISO format string like YYYY-MM-DDTHH:MM:SSZ
 *           example: 2023-02-20T04:24:40.000Z
 * 
 * /games:
 *   get:
 *     tags:
 *     - Games
 *     summary: Get a list of ended games. This request returns data about the last 100 completed games. For each game the return data is the number of hands played, the winner and the winning sequence. This endpoint is primarily used for statistics and development to ensure that all different possible winning sequences are tested and result in a win being declared.
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
 *               description: Array of GameOutcome objects
 *               items:
 *                 $ref: '#/components/schemas/GameOutcome' 
 *       401:
 *         description: unauthorised - invalid Authorisation Bearer token
 */

//************************************
// GET GAMES
//************************************
function getGames(event, callback) {
  const NUM_GAMES_TO_RETURN = 100;

  models.Game.findAll({
    attributes: ['handsPlayed', 'winner', 'winningSequence', 'createdAt', 'updatedAt'],
    where: { status: 'ended', winner: { [Op.gt]: 0 } }, //, Player1Id: 1, Player2Id: 2
    limit: NUM_GAMES_TO_RETURN,
    order: [['updatedAt', 'DESC']]
  })
  .then(function(games) {
    var outcomes = [];
    games.forEach((game) => {
      var obj = {
        handsPlayed: game.handsPlayed,
        winner: game.winner,
        duration: (game.updatedAt.getTime() - game.createdAt.getTime()) / 1000,
        createdAt: game.createdAt
      };

      if (game.winningSequence != null) {
        obj['winningSequence'] = JSON.parse(game.winningSequence);
      }

      outcomes.push(obj);
    });
    return callback(null, utilities.okResponse(event, outcomes));
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

