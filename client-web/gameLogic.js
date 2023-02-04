//Handles game business logic
//Also holds gameState

function GameLogic() {

  //local constants
  const overallStates = ['noGame', 'game'];  

  //local vars
  var overallState = overallStates[0];  //no game

  //Hold the game state from the server
  var gameState = {};

  this.isInGame = function() {
    return overallState == overallStates[1];
  };

  this.createGame = function() {
    spinnerDisplay.showSpinner();
    networkRequests.createGame(
      function() {
        //Call getStatus to get and update state
        networkRequests.getStatus(
          function(state) {
            overallState = overallStates[1];
            gameState = state;
            didChangeState = true;

            //Wait for a player to join
            networkRequests.waitForStatusChange(
              gameState.status,
              function(state) {
                spinnerDisplay.hideSpinner();
                gameState = state;
                didChangeState = true;
              },
              function(err) {
                overallState = overallStates[0];
                spinnerDisplay.hideSpinner();
                errorDisplay.addError(err);
              }
            );
          },
          function(err) {
            overallState = overallStates[0];
            spinnerDisplay.hideSpinner();
            errorDisplay.addError(err);
          }
        );
      },
      function(err) {
        //add error
        overallState = overallStates[0];
        spinnerDisplay.hideSpinner();
        errorDisplay.addError(err);
      }
    );
  };

  this.joinGame = function(code) {
    spinnerDisplay.showSpinner();
    networkRequests.joinGame(code,
      function() {
        //Call getStatus to get and update state
        networkRequests.getStatus(
          function(state) {
            overallState = overallStates[1];
            gameState = state;
            didChangeState = true;
            spinnerDisplay.hideSpinner();

            //Wait for player change as originating player starts
            networkRequests.waitForPlayerChange(
              opponentPlayerNum(),
              function(state) {
                //Note: status might be 'ended' if game won
                gameState = state;
                didChangeState = true;
              },
              function(err) {
                overallState = overallStates[0];
                errorDisplay.addError(err);
              }
            );

          },
          function(err) {
            overallState = overallStates[0];
            spinnerDisplay.hideSpinner();
            errorDisplay.addError(err);
          }
        );
      },
      function(err) {
        //add error
        overallState = overallStates[0];
        spinnerDisplay.hideSpinner();
        errorDisplay.addError(err);
      }
    );
  };

  this.getStatus = function() {
    if (!networkRequests.haveGameCode()) {
      overallState = overallStates[0];  //no game
      return;
    }
    spinnerDisplay.showSpinner();
    networkRequests.getStatus(
      function(state) {
        spinnerDisplay.hideSpinner();
        overallState = overallStates[1];
        gameState = state;
        didChangeState = true;
      },
      function(err) {
        spinnerDisplay.hideSpinner();
        errorDisplay.addError(err);
      }
    );
  };

  this.playRound = function(card, row, col) {
    spinnerDisplay.showSpinner();
    networkRequests.playRound(card, row, col,
      function() {
        //successfully played round - reset selected card and get updated game status
        gameBoard.resetCardSelection();
        networkRequests.getStatus(
          function(state) {
            spinnerDisplay.hideSpinner();
            gameState = state;
            didChangeState = true;

            //Wait for player change as now other player's turn
            networkRequests.waitForPlayerChange(
              opponentPlayerNum(),
              function(state) {
                //Note: status might be 'ended' if game won
                gameState = state;
                didChangeState = true;
              },
              function(err) {
                errorDisplay.addError(err);
              }
            );

          },
          function(err) {
            spinnerDisplay.hideSpinner();
            errorDisplay.addError(err);
          }
        );
      },
      function(err) {
        spinnerDisplay.hideSpinner();
        errorDisplay.addError(err);        
      }
    );
  };

  this.deleteGame = function() {
    spinnerDisplay.showSpinner();
    networkRequests.deleteGame(
      function() {
        overallState = overallStates[0];
        spinnerDisplay.hideSpinner();
        didChangeState = true;
      },
      function(err) {
        overallState = overallStates[0];
        spinnerDisplay.hideSpinner();
        errorDisplay.addError(err);
    });
  };

  //Get the board state for this row / col. Returns false if no board state
  this.boardStateCell = function(row, col) {
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
      else {
        //In game - show which player's turn
        str = this.isPlayersTurn() ? 'Your turn' : (gameState.players[gameState.nextPlayer - 1].name + '\'s turn');
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
    if (!('status' in gameState) || (gameState.status != 'active')) {
      return false;
    }
    //if the next player is me return true.
    //Note players array is zero indexed. nextPlayer is 1 or 2.
    return gameState.players[gameState.nextPlayer - 1].isMe;
  };

  //return one of 'normal', 'oneEyedJack' or 'twoEyedJack'
  this.cardType = function(card) {
    if (card == null) { return false; }
    const cardParts = card.split('|');
    if (cardParts[0] != 'J') { return 'normal'; }
    const isOneEyed = (['S', 'H'].includes(cardParts[1]));
    return isOneEyed ? 'oneEyedJack' : 'twoEyedJack';
  }

  this.isValidMove = function(card, row, col) {
    const boardStateCell = this.boardStateCell(row, col);
    if (boardStateCell === false) { return false; }

    switch (this.cardType(card)) {
    case 'normal':
      //normal card - valid if playing on an empty cell (already checked card matches the board card)
      return (boardStateCell == '');
      break;

    case 'oneEyedJack':
      //One-eyed Jacks are 'anti-wild'
      //Rule: "remove one marker chip from the game board belonging to your opponent"
      //Valid moves are all places where boardStateCell is opponent player
      return (boardStateCell == this.opponentPlayer())
      break;

    case 'twoEyedJack':
      //Not one-eyed
      //Two-eyed Jacks are 'wild'
      //Rule: "place one of your marker chips on any open space on the game board"
      //Valid moves are all places that are empty
      return (boardStateCell == '');
      break;
    }
  };

  this.updateGameState = function(state) {
    gameState = state;
  };

  this.opponentPlayer = function() {
    //return p1 if opponent is p1 else p2
    if (!('players' in gameState)) {
      return false;
    }
    if (gameState.players[0].isMe) {
      return 'p2';
    }
    return 'p1';
  };

  //local functions
  //Returns 1 if I am player 2 and 2 if I am player 1
  function opponentPlayerNum() {
    if (gameState.players[0].isMe) { return 2; }
    return 1;
  }

}