//Handles game business logic
function GameLogic() {
  
  //local vars
  var gameState = {};

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
  }

  this.updateGameState = function(state) {
    gameState = state;
  }

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