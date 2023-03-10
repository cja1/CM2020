const models = require(__dirname + "/models");
const Op = models.Sequelize.Op;
const validator = require('validator');
const _ = require('lodash');
const utilities = require(__dirname + '/utilities.js');

var principalId, isBot1, isBot2;

/**
 * @swagger
 *
 * /games:
 *   post:
 *     tags:
 *     - Games
 *     summary: Create a new game. This request returns the newly created game code like 'XY89'. This code is passed to the other player allowing them to join the game by POSTing to the /games/{code}/players endpoint.
 *     operationId: Create a game
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isPlayer2Bot:
 *                 type: boolean
 *                 description: A flag indicating the game should be created with player 2 as a bot - ie play against the computer.
 *                 example: false
 *       required: false
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

  //validate the body - see if isPlayer2Bot is set and true
  const jsonBody = utilities.parseJson(event.body);  //deals with nulls and JSON parse errors
  var isPlayer2Bot = false;
  if (('isPlayer2Bot' in jsonBody) && validator.isBoolean(jsonBody.isPlayer2Bot + '', { loose: false }) && ['true', '1'].includes(jsonBody.isPlayer2Bot + '')) {
    //Check this request not made by bot2 - can't play bot2 against bot 2
    if (isBot2) {
      var error = new Error('Bot2 can not be player 1 and player 2'); error.status = 422;
      return callback(null, utilities.errorResponse(event, error));      
    }
    isPlayer2Bot = true;
  }

  var code;

  //Get all current game codes to ensure no clash
  models.Game.findAll({
    attributes: ['code'],
  })
  .then(function(games) {
    //Generate a unique game code
    var codes = [];
    games.forEach((game) => codes.push(game.code));
    code = utilities.generateGameCode(codes);

    //If not bot creating this game, set status to 'ended' and winner to 0 for any game this player is in - either as player 1 or player 2
    if (isBot1 || isBot2) {
      return Promise.resolve();
    }
    return models.Game.update(
      { status: 'ended', winner: 0 },
      { where: { [Op.and]: [
        { status: { [Op.in]: ['waitingForPlayers', 'active']} },
        { [Op.or]: [ { Player1Id: principalId }, { Player2Id: principalId } ] }
      ]}}
    );
  })
  .then(function() {

    //create pack and shuffle cards
    const shuffled = _.shuffle(createPack());

    var cardsP1 = [];
    var cardsP2 = [];

    //Deal out first 6 cards to the players
    for (var i = 0; i < utilities.CARDS_PER_PLAYER * 2; i++) {
      if (i % 2 == 0) {
        cardsP1.push(shuffled[i]);
      }
      else {
        cardsP2.push(shuffled[i]);
      }
    }

    //create game with player 1 as the originator
    const game = {
      code: code,
      status: 'waitingForPlayers',
      cardsP1: cardsP1.join(','),
      cardsP2: cardsP2.join(','),
      cards: shuffled.join(','),
      cardPos: utilities.CARDS_PER_PLAYER * 2,
      handsPlayed: 0,
      nextPlayer: 1,
      boardState: generateEmptyBoardState().join(','),
      isPlayer1Bot: isBot1,
      isPlayer2Bot: isPlayer2Bot,
      Player1Id: principalId
    };
    console.log(game);
    return models.Game.create(game);
  })
  .then(function(game) {
    if (!isPlayer2Bot) {
      return Promise.resolve();
    }
    //Create an SQS entry to signal the bot to join this game
    return utilities.createSQSEntryForBot(code, utilities.BOT2_DEVICE_UUID);
  })
  .then(function() {  
    return callback(null, utilities.okResponse(event, { code: code }));
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
function createPack() {
  var cards = [];
  //2 packs used in Sequence
  for (var i = 0; i < 2; i++) {
    ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'].forEach((card) => {
      ['C', 'D', 'H', 'S'].forEach((suit) => {
        cards.push(card + '|' + suit);
      });
    });
  }
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
  isBot1 = event.requestContext.authorizer.isBot1 == 'true';
  isBot2 = event.requestContext.authorizer.isBot2 == 'true';
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

