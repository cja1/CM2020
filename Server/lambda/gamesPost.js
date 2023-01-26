const models = require(__dirname + "/models");
const Op = models.Sequelize.Op;
const validator = require('validator');
const _ = require('lodash');
const utilities = require(__dirname + '/utilities.js');

var principalId;

/**
 * @swagger
 *
 * /games:
 *   post:
 *     tags:
 *     - Games
 *     summary: Create a new game. This request returns the newly created game code like 'XY89'. This code is passed to the other player allowing them to join the game by POSTing to the /games/{code}/players endpoint.
 *     operationId: Create a game
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   description: 4 character alphanumeric game code - used to uniquely identify this game
 *                   example: AB12
 *       401:
 *         description: unauthorised - invalid Authorisation Bearer token
 */

//************************************
// POST GAME
//************************************
function postGame(event, callback) {

  //Set status to 'ended' for any game this player is in - either as player 1 or player 2
  models.Game.update(
    { status: 'ended' },
    { where: { [Op.and]: [ { status: { [Op.in]: ['waitingForPlayers', 'active']} }, { [Op.or]: [ { Player1Id: principalId }, { Player2Id: principalId } ] } ] } }
  )
  .then(function() {

    //create pack and shuffle cards
    const shuffled = _.shuffle(createPack());

    var cardsP1 = [];
    var cardsP2 = [];

    //Deal out first 6 cards to the players
    for (var i = 0; i < 12; i++) {
      if (i % 2 == 0) {
        cardsP1.push(shuffled[i]);
      }
      else {
        cardsP2.push(shuffled[i]);
      }
    }

    //create game with player 1 as the originator
    const game = {
      code: utilities.generateGameCode(),
      status: 'waitingForPlayers',
      cardsP1: cardsP1.join(','),
      cardsP2: cardsP2.join(','),
      cards: shuffled.join(','),
      cardPos: 12,
      nextPlayer: 1,
      boardState: generateEmptyBoardState().join(','),
      Player1Id: principalId
    };
    console.log(game);
    return models.Game.create(game);
  })
  .then(function(game) {
    return callback(null, utilities.okResponse(event, { code: game.code }));
  }, function(err) {
    return callback(null, utilities.errorResponse(event, err));
  }).catch(function (err) {
    return callback(null, utilities.errorResponse(event, err));
  });
}

//************************************
// HELPERS
//************************************
function createPack() {
  var cards = [];
  ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'].forEach((card) => {
    ['C', 'D', 'H', 'S'].forEach((suit) => {
      cards.push(card + '|' + suit);
    });
  });
  return cards;
}

function generateEmptyBoardState() {
  //return a 100 array of blanks - representing empty board state
  var state = [];
  for (var i = 0; i < 100; i++) {
    state.push([]);
  }
  return state;
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
    case 'POST':
      switch (pathParameters.length) {
        case 0:   //like /games
          postGame(event, callback);
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

