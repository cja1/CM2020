"use strict";

module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define("User", {
    deviceUUID: {
      type: DataTypes.STRING,
    },
    name: {
      type: DataTypes.STRING,
    },
    color: {
      type: DataTypes.STRING,
    }
  }, {
    paranoid: true
  });

  //Class Method
  User.associate = function (models) {
    User.hasMany(models.Game, { as: "Player1" });
    User.hasMany(models.Game, { as: "Player2" });
  };

  return User;
};
