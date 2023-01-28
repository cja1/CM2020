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

function createSQSEntryForBot(code) {
  //Just send the game code in the message body: all the bot needs to play a round in this game
  var sqs = new AWS.SQS({apiVersion: '2012-11-05'});
  const params = {
    MessageBody: code,
    QueueUrl: 'https://sqs.eu-west-1.amazonaws.com/705936070782/sequenceBot'
  };
  return sqs.sendMessage(params).promise();
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
  createSQSEntryForBot: createSQSEntryForBot
};
