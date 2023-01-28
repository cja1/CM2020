const models = require(__dirname + "/models");
const Op = models.Sequelize.Op;
const validator = require('validator');
const _ = require('lodash');
const utilities = require(__dirname + '/utilities.js');

var principalId;

/**
 * @swagger
 *
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       description: User information
 *       required: [name, color]
 *       properties:
 *         name:
 *           type: string
 *           description: The player's name
 *           example: Bob
 *         color:
 *           type: string
 *           description: The player's color
 *           example: ff0000
 * 
 * /users:
 *   get:
 *     tags:
 *     - Users
 *     summary: Get the user name and color.
 *     operationId: Get user details
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
 */

//************************************
// GET USER
//************************************
function getUser(event, callback) {

  //Get the user
  models.User.findOne({
    attributes: ['name', 'color'],
    where: { id: principalId }
  })
  .then(function(user) {
    if (user == null) {
      var error = new Error('User not found'); error.status = 404; throw(error);
    }
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
    case 'GET':
      switch (pathParameters.length) {
        case 0:   //like /users
          getUser(event, callback);
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

