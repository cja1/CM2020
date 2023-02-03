//Handles game business logic
//Also holds gameState

function GameLogic() {

  //local constants
  const overallStates = ['noGame', 'game'];  

  //local vars
  var overallState = overallStates[0];  //no game

  //Hold the game state from the server
  var gameState = {};

  this.createGame = function() {
    networkRequests.createGame(
      function() {
        //Call get game to get and update state
        networkRequests.getStatus(
          function(state) {
            overallState = overallStates[1];
            gameState = state;
            didChangeState = true;

            //Wait for a player to join
            networkRequests.waitForStatusChange(
              gameState.status,
              function(state) {
                gameState = state;
                didChangeState = true;
              },
              function(err) { errorDisplay.addError(err); }
            )
          },
          function(err) { errorDisplay.addError(err); }
        );
      },
      function(err) {
        //add error
        errorDisplay.addError(err);
      }
    );
  };

  //Get the board state for this row / col. Returns false if no board state
  this.boardState = function(row, col) {
    if (!('boardState' in gameState)) { return false; }
    return gameState.boardState[row][col];    
  };

  //Get the players cards
  this.cards = function() {
    if (!('cards' in gameState)) { return []; }
    return gameState.cards;
  }

  //Get the game status string
  this.statusString = function() {
    var str = 'Game not started';
    if ('status' in gameState) {
      if (gameState.status == 'waitingForPlayers') {
        str = 'Waiting for players';
      }
      else if (gameState.status == 'ended') {
        str = 'Game Over: ';
        if (gameState.winner == 0) {
          //draw
          str += 'Draw';
        }
        else {
          const winningPlayer = gameState.players[gameState.winner - 1];
          str += winningPlayer.name + ' wins!';
        }
      }
    }
    return str;
  }

  this.colPlayer1 = function() {
    if (!('players' in gameState)) { return null; }
    return color('#' + gameState.players[0].color);
  }
  this.colPlayer2= function() {
    if (!('players' in gameState) || (gameState.players.length < 2)) { return null; }
    return color('#' + gameState.players[1].color);
  }

  //Return true if this player's turn
  this.isPlayersTurn = function() {
    if (!('state' in gameState) || (gameState.state != 'active')) {
      return false;
    }
    //if the next player is me return true.
    //Note players array is zero indexed. nextPlayer is 1 or 2.
    return gameState.players[gameState.nextPlayer - 1].isMe;
  };

  this.isValidMove = function(card, row, col) {
    if (!('boardState' in gameState)) { return false; }

    const state = gameState.boardState[row][col];
    const cardParts = card.split('|');

    if (cardParts[0] != 'J') {
      //normal card - valid if playing on an empty cell (already checked card matches the board card)
      return (state == '');
    }

    const isOneEyed = (['S', 'H'].includes(cardParts[1]));
    if (isOneEyed) {
      //One-eyed Jacks are 'anti-wild'
      //Rule: "remove one marker chip from the game board belonging to your opponent"
      //Valid moves are all places where boardState is opponent player
      return (state == opponentPlayer())
    }
    else {
      //Not one-eyed
      //Two-eyed Jacks are 'wild'
      //Rule: "place one of your marker chips on any open space on the game board"
      //Valid moves are all places that are empty
      return (state == '');
    }
  };

  this.updateGameState = function(state) {
    gameState = state;
  };

  function opponentPlayer() {
    //return p1 if opponent is p1 else p2
    if (!('players' in gameState)) {
      return false;
    }
    if (gameState.players[0].isMe) {
      return 'p2';
    }
    return 'p1';
  }

}