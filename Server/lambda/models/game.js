"use strict";

module.exports = function(sequelize, DataTypes) {
  var Game = sequelize.define("Game", {
    code: {
      type: DataTypes.STRING
    },
    isActive: {
      type: DataTypes.BOOLEAN,
    },
    cardsP1: {
      type: DataTypes.STRING(1024)
    },
    cardsP2: {
      type: DataTypes.STRING(1024)
    },
    cards: {
      type: DataTypes.STRING(1024)
    },
    cardPos: {
      type: DataTypes.INTEGER
    },
    nextPlayer: {
      type: DataTypes.INTEGER
    },
    boardState: {
      type: DataTypes.STRING(1024)
    }    
  }, {
    paranoid: true
  });

  //Class Method
  Game.associate = function (models) {
    Game.belongsTo(models.User, { as: "Player1" })
    Game.belongsTo(models.User, { as: "Player2" })
  };

  return Game;
};