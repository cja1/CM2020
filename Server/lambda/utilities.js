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

module.exports = {
  GAME_CODE_LENGTH: GAME_CODE_LENGTH,
  okResponse: okResponse,
  okEmptyResponse: okEmptyResponse,
  errorResponse: errorResponse,
  parseJson: parseJson,
  generateGameCode: generateGameCode,
  isValidGameCode: isValidGameCode,
};
