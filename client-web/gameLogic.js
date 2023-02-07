//Handles game business logic
//Also holds gameState

function GameLogic() {

  //local constants
  const overallStates = ['noGame', 'game'];  

  //local vars
  var overallState = overallStates[0];  //no game

  //Hold the game state from the server
  var gameState = {};
  //Also keep track of whether playing against a bot - for 'waiting for player' message
  var isPlayer2Bot = false;

  this.isInGame = function() {
    return (overallState == overallStates[1]);
  };

  this.isWaitingForPlayers = function() {
    return (overallState == overallStates[1]) && (gameState.status == 'waitingForPlayers');
  };

  this.isAgainstBot = function() {
    return isPlayer2Bot;
  };

  this.createGame = function(isAgainstBot) {
    isPlayer2Bot = isAgainstBot
    spinnerDisplay.showSpinner();
    networkRequests.createGame(
      isPlayer2Bot,
      function() { gameLogic.getStatus(); },
      function(err) {
        //add error
        gameLogic.resetGame();
        errorDisplay.addError(err);
      }
    );
  };

  this.joinGame = function(code) {
    spinnerDisplay.showSpinner();
    networkRequests.joinGame(code,
      function() { gameLogic.getStatus(); },  //Get and update state and wait for player to change (as game creator plays first)
      function(err) {
        //add error
        gameLogic.resetGame();
        errorDisplay.addError(err);
      }
    );
  };

  //called from createGame, joinGame and from sketch setup()
  this.getStatus = function() {
    if (!networkRequests.haveGameCode()) {
      overallState = overallStates[0];  //no game
      return;
    }

    spinnerDisplay.showSpinner();

    networkRequests.getStatus(
      function(state) {
        overallState = overallStates[1];
        gameState = state;

        //Call here so board title can be updated
        didChangeState = true;

        if (gameState.status == 'ended') {
          //Done
          spinnerDisplay.hideSpinner();
          gameState = state;
          gameCancelDisplay.clearDisplayed();
          didChangeState = true;
        }
        else if (gameState.status == 'waitingForPlayers') {
          //Wait for a player to join
          networkRequests.waitForStatusChange(
            gameState.status,
            function(state) {
              spinnerDisplay.hideSpinner();
              if (state == null) {
                //game deleted - not an error
                gameState = {};
                overallState = overallStates[0];
              }
              else {
                gameState = state;
              }
              gameCancelDisplay.clearDisplayed(); //hide if showing - as state changed
              didChangeState = true;
            },
            function(err) {
              gameLogic.resetGame();
              errorDisplay.addError(err);
            }
          );
        }
        else if (!gameLogic.isPlayersTurn()) {
          //Wait for player change as originating player starts
          networkRequests.waitForPlayerChange(
            opponentPlayerNum(),
            function(state) {
              spinnerDisplay.hideSpinner();
              if (state == null) {
                //game deleted - not an error
                gameState = {};
                overallState = overallStates[0];
              }
              else {
                gameState = state;
              }
              gameCancelDisplay.clearDisplayed(); //hide if showing - as state changed
              didChangeState = true;
            },
            function(err) {
              gameLogic.resetGame();
              errorDisplay.addError(err);
            }
          );
        }
        else {
          spinnerDisplay.hideSpinner();
        }
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

        //successfully played round - reset selected card and wait for player to change
        gameBoard.resetCardSelection();
      
        //Wait for player change as now other player's turn
        networkRequests.waitForPlayerChange(
          opponentPlayerNum(),
          function(state) {
            spinnerDisplay.hideSpinner();
            if (state == null) {
              //game deleted - not an error
              gameState = {};
              overallState = overallStates[0];
            }
            else {
              gameState = state;
            }
            didChangeState = true;
          },
          function(err) {
            gameLogic.resetGame();
            errorDisplay.addError(err);
          }
        );
      },
      function(err) {
        gameLogic.resetGame();
        errorDisplay.addError(err);        
      }
    );
  };

  this.deleteGame = function() {
    spinnerDisplay.showSpinner();

    networkRequests.deleteGame(
      function() {
        gameLogic.resetGame();
        didChangeState = true;
      },
      function(err) {
        console.log('typeof', typeof this);
        gameLogic.resetGame();
        errorDisplay.addError(err);
    });
  };

  //reset state to no game
  this.resetGame = function () {
    networkRequests.clearGameCode();  //reset called when game ended (ie no call to deleteGame)
    overallState = overallStates[0];
    gameState = {};
    isPlayer2Bot = false;
    //clear game cancel, hide spinner (if showing)
    gameCancelDisplay.clearDisplayed();
    spinnerDisplay.hideSpinner();
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
        if (gameState.winner == 0) {
          //draw
          str = 'Game Over: Draw';
        }
        else {
          if (gameState.winner == opponentPlayerNum()) {
            const winningPlayer = gameState.players[gameState.winner - 1];
            str = winningPlayer.name + ' wins!';
          }
          else {
            str = 'You win!';
          }
        }
      }
      else {
        //In game - show which player's turn
        str = gameLogic.isPlayersTurn() ? 'Your turn' : (gameState.players[gameState.nextPlayer - 1].name + '\'s turn');
      }
    }
    return str;
  }

  this.isEnded = function() {
    return('status' in gameState) && (gameState.status == 'ended');
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

    switch (gameLogic.cardType(card)) {
    case 'normal':
      //normal card - valid if playing on an empty cell (already checked card matches the board card)
      return (boardStateCell == '');
      break;

    case 'oneEyedJack':
      //One-eyed Jacks are 'anti-wild'
      //Rule: "remove one marker chip from the game board belonging to your opponent"
      //Valid moves are all places where boardStateCell is opponent player
      return (boardStateCell == gameLogic.opponentPlayer())
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

  this.isValidGameCode = function(str) {
    //Check length and character set
    //Include 0, 1, I and O as valid - although server will not return these chars - simplifies testing
    if (str.trim().length != 4) { return false; }
    return str.match(/^[ABCDEFGHIJKLMNOPQRSTUVWXY01Z23456789]+$/) !== null;
  };

  //local functions
  //Returns 1 if I am player 2 and 2 if I am player 1
  function opponentPlayerNum() {
    if (gameState.players[0].isMe) { return 2; }
    return 1;
  }

}