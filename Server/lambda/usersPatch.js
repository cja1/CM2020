const models = require(__dirname + "/models");
const Op = models.Sequelize.Op;
const validator = require('validator');
const _ = require('lodash');
const utilities = require(__dirname + '/utilities.js');

var principalId;

/**
 * @swagger
 * 
 * /users:
 *   patch:
 *     tags:
 *     - Users
 *     summary: Set the user name and / or colour.
 *     operationId: Update user details
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The new name for this player
 *                 example: Bob
 *               color:
 *                 type: string
 *                 description: The new colour for this player - as a hex string
 *                 example: ff0000
 *       required: false
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: successful operation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: unauthorised - invalid API token
 *       404:
 *         description: user not found
 *       422:
 *         description: unprocessable
 */

//************************************
// PATCH USER
//************************************
function patchUser(event, callback) {

  //See if we have name and/or color set
  const jsonBody = utilities.parseJson(event.body);  //deals with nulls and JSON parse errors

  var obj = {};

  //Validate name
  if ('name' in jsonBody) {
    //Check not empty or spaces
    if (jsonBody.name.trim().length == 0) {
      var error = new Error('name can not be blank'); error.status = 422;
      return callback(null, utilities.errorResponse(event, error));      
    }
    //Check alphanumeric, space or - or underscore
    if (!validator.isAlphanumeric(jsonBody.name, 'en-GB', { ignore: ' -_' })) {
      var error = new Error('name can only contain alphanumeric characters, spaces, dashes or underscores'); error.status = 422;
      return callback(null, utilities.errorResponse(event, error));      
    }
    obj['name'] = jsonBody.name;
  }

  //Validate color
  if ('color' in jsonBody) {
    //Check not empty or spaces
    if (jsonBody.color.trim().length != 6) {
      var error = new Error('color must be 6 characters long'); error.status = 422;
      return callback(null, utilities.errorResponse(event, error));      
    }
    //Check 0-9a-f
    if (!jsonBody.color.toLowerCase().match(/[0-9A-Fa-f]{6}/g)) { 
      var error = new Error('color must be hexadecimal'); error.status = 422;
      return callback(null, utilities.errorResponse(event, error));      
    }
    obj['color'] = jsonBody.color.toLowerCase();
  }

  //Get the user
  models.User.findOne({
    attributes: ['id', 'name', 'color'],
    where: { id: principalId }
  })
  .then(function(user) {
    if (user == null) {
      var error = new Error('User not found'); error.status = 404; throw(error);
    }
    //Update
    if (Object.keys(obj) == 0) {
      //Nothing to update
      return Promise.resolve();
    }
    return user.update(obj);
  })
  .then(function(user) {  
    return callback(null, utilities.okResponse(event, { name: user.name, color: user.color }));
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
    case 'PATCH':
      switch (pathParameters.length) {
        case 0:   //like /users
          patchUser(event, callback);
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

