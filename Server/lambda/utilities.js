var AWS = require('aws-sdk');

//Consts
const accessControlHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
};

const GAME_CODE_LENGTH = 4;

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

function generateGameCode() {
  //Generate a random code
  const GAME_CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array(GAME_CODE_LENGTH).fill(GAME_CODE_CHARSET).map(function(x) {
    return x[Math.floor(Math.random() * x.length)];
  }).join('');
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

function createSQSEntryForBot(code, deviceUUID) {
  deviceUUID = deviceUUID || false;
  var body = { code: code };
  if (deviceUUID !== false) {
    body['deviceUUID'] = deviceUUID;
  }
  
  var sqs = new AWS.SQS({apiVersion: '2012-11-05'});
  const params = {
    MessageBody: JSON.stringify(body),
    QueueUrl: 'https://sqs.eu-west-1.amazonaws.com/705936070782/sequenceBot'
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

module.exports = {
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
  playOptionsForCard: playOptionsForCard
};
