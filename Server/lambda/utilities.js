var AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

//Consts
const accessControlHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
};

const GAME_CODE_LENGTH = 4;
const BOT1_DEVICE_UUID = '00000000-9ff1-4b77-8fdf-e626e8f98e94';
const BOT2_DEVICE_UUID = '11111111-9ff1-4b77-8fdf-e626e8f98e94';
const CARDS_PER_PLAYER = 7; //sequence rules: 7 cards per player for a 2 person game
const MAX_HANDS_PLAYED = 110;  //always stop if this many hands (shouldn't happen - fallback)

function okResponse(event, jsonObject) {
  return {
    statusCode: 200,
    headers: accessControlHeaders,
    body: JSON.stringify(jsonObject)
  };
}

function okEmptyResponse(event) {
  return {
    statusCode: 204,
    headers: accessControlHeaders,
    body: ''
  };
}

function errorResponse(event, err) {
  //If error code is 403, 404, 409 or 422 then return this status code and message
  if ((err !== undefined) && ('status' in err) && (err.status == 401 || err.status == 402 || err.status == 403 || err.status == 404 || err.status == 409 || err.status == 410 || err.status == 422)) {
    return {
      statusCode: err.status,
      headers: accessControlHeaders,
      body: JSON.stringify({ 'msg': (('message' in err) ? err.message : 'Unauthorized') })
    }
  }
  return {
    statusCode: 404,
    headers: accessControlHeaders,
    body: JSON.stringify({ 'msg': 'Not found' })
  }
}

function parseJson(str) {
  if (str == null) {
    return {};
  }
  else {
    try {
      const json = JSON.parse(str)
      return json;
    }
    catch (e) {
      return {};
    }
  }
}

//previousCodes is an array of all previously used game codes
function generateGameCode(previousCodes) {
  const GAME_CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var code;

  do {
    //Generate a random code
    code = Array(GAME_CODE_LENGTH).fill(GAME_CODE_CHARSET).map(function(x) {
      return x[Math.floor(Math.random() * x.length)];
    }).join('');
  } while(previousCodes.includes(code));

  return code;
}

function isValidGameCode(str) {
  //Check length and character set
  if (str.trim().length != GAME_CODE_LENGTH) { return false; }
  return str.match(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/) !== null;
}

//Convert boardState string into 2d array
function createBoardStateArray(boardStateStr) {
  //boardStateStr is a comma-separated string with 100 elements
  const boardStateArray = boardStateStr.split(','); 

  var out = [];
  for (var i = 0; i < 100; i++) {
    if (i % 10 == 0) {
      //Add row every 10
      out.push([]);
    }
    out[out.length - 1].push(boardStateArray[i]);
  }
  return out;
}

function createBoardStateString(boardStateArray) {
  var out = [];
  for (var i = 0; i < 10; i++) {
    for (var j = 0; j < 10; j++) {
      out.push(boardStateArray[i][j]);
    }
  }
  return out.join(',');
}

//Create a random player name like Player12345
function randomPlayerName() {
  var name = 'Player';
  name += Array(5).fill('0123456789').map(function(x) {
    return x[Math.floor(Math.random() * x.length)];
  }).join('');
  return name;
}

//Create a random player color like ff0000
function randomPlayerColor() {
  return Array(6).fill('0123456789abcdef').map(function(x) {
    return x[Math.floor(Math.random() * x.length)];
  }).join('');
}

//Create SQS entry to request bot play. version optional - defaults to 1
function createSQSEntryForBot(code, deviceUUID, version) {
  version = version || 1; //defaults to bot v1
  var body = { code: code, deviceUUID: deviceUUID, version: version };
  console.log('About to send SQS', body);

  var sqs = new AWS.SQS({apiVersion: '2012-11-05'});
  const params = {
    MessageBody: JSON.stringify(body),
    QueueUrl: 'https://sqs.eu-west-1.amazonaws.com/705936070782/sequenceBot.fifo',
    MessageGroupId: 'BotRequests',
    MessageDeduplicationId: uuidv4(),
  };
  return sqs.sendMessage(params).promise();
}

//Get the board game with the card values. Blank for the corners.
function boardGameWithCards() {
  return [
    ["", "6|D", "7|D", "8|D", "9|D", "10|D", "Q|D", "K|D", "A|D", ""],
    ["5|D", "3|H", "2|H", "2|S", "3|S", "4|S", "5|S", "6|S", "7|S", "A|C"],
    ["4|D", "4|H", "K|D", "A|D", "A|C", "K|C", "Q|C", "10|C", "8|S", "K|C"],
    ["3|D", "5|H", "Q|D", "Q|H", "10|H", "9|H", "8|H", "9|C", "9|S", "Q|C"],
    ["2|D", "6|H", "10|D", "K|H", "3|H", "2|H", "7|H", "8|C", "10|S", "10|C"],
    ["A|S", "7|H", "9|D", "A|H", "4|H", "5|H", "6|H", "7|C", "Q|S", "9|C"],
    ["K|S", "8|H", "8|D", "2|C", "3|C", "4|C", "5|C", "6|C", "K|S", "8|C"],
    ["Q|S", "9|H", "7|D", "6|D", "5|D", "4|D", "3|D", "2|D", "A|S", "7|C"],
    ["10|S", "10|H", "Q|H", "K|H", "A|H", "2|C", "3|C", "4|C", "5|C", "6|C"],
    ["", "9|S", "8|S", "7|S", "6|S", "5|S", "4|S", "3|S", "2|S", ""],
  ];
}

//Return the places where this card can be played
//Only for non-Jacks
//Note: not very efficient as loops over whole pack. Could make a simple static lookup.
function playOptionsForCard(card, asJSON) {
  asJSON = asJSON || false;

  var out = [];
  const bg = boardGameWithCards();
  for (var i = 0; i < 10; i++) {
    for (var j = 0; j < 10; j++) {
      if (bg[i][j] == card) {
        if (asJSON) {
          out.push([i, j]);
        }
        else {
          out.push('(' + i + ', ' + j + ')');
        }
      }
    }
  }
  return out;
}

function getMovesForGame(game, ignoreJacks) {
  ignoreJacks = ignoreJacks || false; //defaults to don't ignore Jacks
  var moves = [];

  //Create possible moves for all cards
  game.cards.forEach((card) => {
    if (!ignoreJacks || !isCardJack(card)) {
      const movesForCard = getMovesForCard(card, game.boardState, game.nextPlayer);
      moves = moves.concat(movesForCard);
    }
  });
  console.log(moves);
  return moves;
}

function isCardJack(card) {
  return card.split('|')[0] == 'J';
}

function getMovesForCard(card, boardState, nextPlayer) {
  const cardParts = card.split('|');
  var moves = []
  if (cardParts[0] != 'J') {
    //Not a Jack
    const playOptions = playOptionsForCard(card, true); //true to get array of arrays back as opposed to array of strings
    playOptions.forEach((playOption) => {
      if (boardState[playOption[0]][playOption[1]] == '') {
        //Board is empty so valid move for this card
        moves.push({ card: card, moveRow: playOption[0], moveCol: playOption[1] });
      }
    });
    return moves;
  }

  //A Jack. See if one-eyed or not (Spades and Hearts are one-eyed)
  const isOneEyed = (['S', 'H'].includes(cardParts[1]));
  if (isOneEyed) {
    //One-eyed Jacks are 'anti-wild'
    //Rule: "remove one marker chip from the game board belonging to your opponent"
    //So valid moves are all places where boardState is nextPlayer
    const opponent = (nextPlayer == 1) ? 'p2' : 'p1';
    for (var i = 0; i < 10; i++) {
      for (var j = 0; j < 10; j++) {
        if (boardState[i][j] == opponent) {
          //The board position is occupied by the opponent
          moves.push({ card: card, moveRow: i, moveCol: j });
        }
      }
    }
    return moves;
  }

  //Two-eyed Jacks are 'wild'
  //Rule: "place one of your marker chips on any open space on the game board"
  //So find all open spaces
  for (var i = 0; i < 10; i++) {
    for (var j = 0; j < 10; j++) {
      //ignore corners
      if ((i == 0 && j == 0) || (i == 9 && j == 0) || (i == 0 && j == 9) || (i == 9 && j == 9)) {
        continue;
      }
      if (boardState[i][j] == '') {
        //The board position is empty by the opponent
        moves.push({ card: card, moveRow: i, moveCol: j });
      }
    }
  }
  return moves;
}


module.exports = {
  BOT1_DEVICE_UUID: BOT1_DEVICE_UUID,
  BOT2_DEVICE_UUID: BOT2_DEVICE_UUID,
  CARDS_PER_PLAYER: CARDS_PER_PLAYER,
  MAX_HANDS_PLAYED: MAX_HANDS_PLAYED,
  okResponse: okResponse,
  okEmptyResponse: okEmptyResponse,
  errorResponse: errorResponse,
  parseJson: parseJson,
  generateGameCode: generateGameCode,
  isValidGameCode: isValidGameCode,
  createBoardStateArray: createBoardStateArray,
  createBoardStateString: createBoardStateString,
  randomPlayerName: randomPlayerName,
  randomPlayerColor: randomPlayerColor,
  createSQSEntryForBot: createSQSEntryForBot,
  boardGameWithCards: boardGameWithCards,
  playOptionsForCard: playOptionsForCard,
  getMovesForGame: getMovesForGame,
  getMovesForCard: getMovesForCard
};
