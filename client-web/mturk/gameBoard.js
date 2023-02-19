//Handles game board display
function GameBoard() {
  
  //local constants
  const highlightColor = 'yellow';

  //local vars
  //player colours
  var colPlayer1, colPlayer2;

  //static card images (heart, spade, club, diamond)
  var images = {};

  //lookups for board card position and player cards - to support hit check on click events
  var boardCardFrames = {};
  var playerCardFrames = {};

  //selected card on the board
  var selectedCard = null;
  var selectedCardNum = null; //position of the card in the players hand

  //close button
  var closeButton = null;

  this.preload = function() {
    //load card images into images object
    images['C'] = loadImage('images/club.png');
    images['S'] = loadImage('images/spade.png');
    images['H'] = loadImage('images/heart.png');
    images['D'] = loadImage('images/diamond.png');
  };

  this.setup = function() {
    drawBackground();
  };

  this.draw = function() {
    boardCardFrames = {};
    playerCardFrames = {};

    setupPlayerColors();

    drawGameBoard();
    drawPlayersCards();
    drawTitleText();
    drawCloseButton();
  };

  //reset card selection -  called when player plays a card in a round
  this.resetCardSelection = function() {
    selectedCard = null;
    selectedCardNum = null;
  };

  //Check for clicks on cards - game board or player cards
  //If we have a click on a player card FOLLOWED BY a click on the relevant board cell AND validMove,return the card played.
  //If we are changing state (so need a refresh) return true.
  //Else return false.
  this.hitCheck = function() {
    var frame;

    //Close button
    if (closeButton.hitCheck()) {
      return { action: 'cancel' };
    }
    if (!gameLogic.isPlayersTurn()) {
      //no card clicks possible - return
      return false;
    }

    //See if selecting a card in player's hand
    var cards = Object.keys(playerCardFrames);
    for (var i = 0; i < cards.length; i++) {

      //We might have two cards the same, so playerCardFrames[cards[i]] is an array
      for (var j = 0; j < playerCardFrames[cards[i]].length; j++) {
        frame = playerCardFrames[cards[i]][j];

        if (mouseX > frame.x && mouseX < frame.x + frame.w && mouseY > frame.y && mouseY < frame.y + frame.h) {
          //clicking on a player card... options
          //#1 If no selected card, select this card
          if (selectedCard == null) {
            //console.log('selecting card ' + cards[i] + ', pos in hand ' + frame.cardNum);
            selectedCard = cards[i];
            selectedCardNum = frame.cardNum;
            return { action: 'refresh' };
          }
          //#2 If the selected one, de-select
          if ((selectedCard == cards[i]) && (selectedCardNum == frame.cardNum)) {
            //console.log('de-selecting card ' + selectedCard);
            selectedCard = null;
            selectedCardNum = null;
            return { action: 'refresh' };
          }
          //#3 Change the selected card to this one
          selectedCard = cards[i];
          selectedCardNum = frame.cardNum;
          //console.log('selecting card ' + cards[i] + ', pos in hand ' + frame.cardNum);
          return { action: 'refresh' };
        }
      }
    }

    //This wasn't a click on a player card but a click elsewhere. If no card currently selected, ignore the click
    if (selectedCard == null) {
      //console.log('ignoring');
      return false;
    }

    //See if we have a click on one of the the relevant 2 board cards
    //Logic depends on card type
    switch(gameLogic.cardType(selectedCard)) {

    case 'normal':
      //Only need to check the frames for this card
      const frames = boardCardFrames[selectedCard];

      //Frames always contains exactly 2 frames for the 2 cards on the board
      for (var i = 0; i < frames.length; i++) {
        frame = frames[i];
        if (mouseX > frame.x && mouseX < frame.x + frame.w && mouseY > frame.y && mouseY < frame.y + frame.h) {
          //This is a click on the card - check a valid move for this card
          if (gameLogic.isValidMove(selectedCard, frame.row, frame.col)) {
            //console.log('playing card ' + selectedCard);
            return { action: 'playRound', card: selectedCard, row: frame.row, col: frame.col };
          }
        }
      }
      break;

    case 'oneEyedJack': case 'twoEyedJack':
      cards = Object.keys(boardCardFrames);
      for (var i = 0; i < cards.length; i++) {

        const frames = boardCardFrames[cards[i]];

        for (var j = 0; j < frames.length; j++) {
          frame = frames[j];
          if (mouseX > frame.x && mouseX < frame.x + frame.w && mouseY > frame.y && mouseY < frame.y + frame.h) {
            //This is a click on the card - check a valid move for this card
            if (gameLogic.isValidMove(selectedCard, frame.row, frame.col)) {
              //console.log('playing card ' + selectedCard);
              return { action: 'playRound', card: selectedCard, row: frame.row, col: frame.col };
            }
          }
        }
      }
      break;
    }

    //We clicked somewhere else - deselect and return false
    //console.log('de-selecting card ' + selectedCard);
    selectedCard = null;
    selectedCardNum = null;
    return { action: 'refresh' };
  };

  ////////////////////////////////////////
  // Private functions
  ////////////////////////////////////////

  //Game background green colour with outline boxes
  function drawBackground() {
    background('#505B4D');
    stroke('#00000050');
    noFill();
    rect(playArea.x, playArea.y, playArea.width, playArea.height);
    fill('#00000020');
    noStroke();
    rect(playArea.x, playArea.boardTop, playArea.width, playArea.boardHeight);
  }

  //Draw the complete game board. Also deals with highlighted cells and cells which a player owns.
  function drawGameBoard() {
    const gap = 5.0;

    const cellWidth = (playArea.width - 11 * gap) / 10;
    const cellHeight = (playArea.boardHeight - 11 * gap) / 10;

    textAlign(LEFT, CENTER);
    //Dynamic font size
    const fontSize = Math.floor(cellWidth * 0.55);
    textFont(font, fontSize);

    const board = [
      ['', '6|D', '7|D', '8|D', '9|D', '10|D', 'Q|D', 'K|D', 'A|D', ''],
      ['5|D', '3|H', '2|H', '2|S', '3|S', '4|S', '5|S', '6|S', '7|S', 'A|C'],
      ['4|D', '4|H', 'K|D', 'A|D', 'A|C', 'K|C', 'Q|C', '10|C', '8|S', 'K|C'],
      ['3|D', '5|H', 'Q|D', 'Q|H', '10|H', '9|H', '8|H', '9|C', '9|S', 'Q|C'],
      ['2|D', '6|H', '10|D', 'K|H', '3|H', '2|H', '7|H', '8|C', '10|S', '10|C'],
      ['A|S', '7|H', '9|D', 'A|H', '4|H', '5|H', '6|H', '7|C', 'Q|S', '9|C'],
      ['K|S', '8|H', '8|D', '2|C', '3|C', '4|C', '5|C', '6|C', 'K|S', '8|C'],
      ['Q|S', '9|H', '7|D', '6|D', '5|D', '4|D', '3|D', '2|D', 'A|S', '7|C'],
      ['10|S', '10|H', 'Q|H', 'K|H', 'A|H', '2|C', '3|C', '4|C', '5|C', '6|C'],
      ['', '9|S', '8|S', '7|S', '6|S', '5|S', '4|S', '3|S', '2|S', ''],
    ];

    for (var row = 0; row < 10; row++) {
      for (var col = 0; col < 10; col++) {
        push();
        const x = playArea.x + (cellWidth + gap) * col + gap;
        const y = playArea.boardTop + (cellHeight + gap) * row + gap;
        translate(x, y);

        //Check board state and set the colour to the player if player owns this cell
        var colPlayer = null;
        const boardStateCell = gameLogic.boardStateCell(row, col);
        if (boardStateCell !== false && boardStateCell != '') {
          colPlayer = (boardStateCell == 'p1') ? colPlayer1 : colPlayer2;
        }

        const card = board[row][col];
        var isHighlighted;

        //Highlight logic depends on selectedCard type
        switch(gameLogic.cardType(selectedCard)) {
        case 'normal':
          //If normal card, highlight if selected card == card
          isHighlighted = (selectedCard == card);
          break;

        case 'oneEyedJack':
          //If one eyed, highlight if this cell is occupied by opponent
          isHighlighted = (boardStateCell == gameLogic.opponentPlayer());
          break;

        case 'twoEyedJack':
          //If two-eyed, highlight if this cell is empty and not corner
          if (isCorner(row, col)) {
            isHighlighted = false;
          }
          else {
            isHighlighted = (boardStateCell == '');
          }
          break;
        }

        drawGameCell(cellWidth, cellHeight, card, colPlayer, isHighlighted);
        pop();

        //add to boardCardFrames - ignore if corners as can't click on corners
        if (card != '') {
          //We want to make an array with the 2 card frames that are on the board for this card
          if (!(card in boardCardFrames)) {
            boardCardFrames[card] = [];
          }
          boardCardFrames[card].push({ x: x, y: y, w: cellWidth, h: cellHeight, row: row, col: col });
        }
      }
    }
  }

  //Draw a cell on the game board. If isHighlighted then set colour to the highlight colour
  function drawGameCell(w, h, card, colPlayer, isHighlighted) {
    //Draw playing card background
    const rounded = 5.0;
    fill(isHighlighted ? highlightColor : 255);
    rect(0, 0, w, h, rounded);

    //draw card
    if (card == '') {
      //Corner card
      drawCorner(w, h);
    }
    else {
      //Playing cards
      const cardParts = card.split('|');

      //Add text
      fill(0);
      text(cardParts[0], w * 0.15, h * 0.28);

      //add image
      const img = images[cardParts[1]];
      const imgW = w / 2.2;
      const imgH = imgW / img.width * img.height;
      image(img, w / 2, h / 2 * 1.1, imgW, imgH);
    }

    //add player piece if player colour set
    if (colPlayer != null) {
      stroke(128);
      fill(colPlayer);
      ellipse(w / 2, h / 2, w * 0.6);
      noStroke();
      //Dark shadow in middle
      fill(0, 0, 0, 100);
      ellipse(w / 2, h / 2, w * 0.4);
    }

  }

  //Draw a corner card - add the 4 images appropriately sized
  function drawCorner(w, h) {
    var inset = w / 15.0;
    var wFactor = 2.7;

    var img = images.H;
    var imgW = w / wFactor;
    var imgH = imgW / img.width * img.height;
    image(img, inset, inset, imgW, imgH);  
    
    img = images.C;
    imgW = w / wFactor;
    imgH = imgW / img.width * img.height;
    image(img, inset + w / 2, inset, imgW, imgH);  

    img = images.S;
    imgW = w / wFactor;
    imgH = imgW / img.width * img.height;
    image(img, inset, inset + h / 2, imgW, imgH);  

    img = images.D;
    imgW = w / wFactor;
    imgH = imgW / img.width * img.height;
    image(img, inset + w / 2, inset + h / 2, imgW, imgH);  
  }

  //Draw all the cards in the players hand - below the game board. Also add 'Your cards' text
  function drawPlayersCards() {

    var cards = gameLogic.cards();  //returns empty array if game not playing

    //Calculate dimensions
    const cardHeight = playArea.playerCardsHeight * 0.5;
    const cardWidth = cardHeight * 2 / 3; //width is 2/3 height - looks 'right'

    //Distribute cards with start / end padding
    const padding = playArea.width * 0.05; //5% of width as left / right padding

    //Force gap to always be based on 7 cards - so effectively left-aligns cards
    const numCardsForGap = 7;
    const gapX = (playArea.width - padding * 2 - numCardsForGap * cardWidth) / (numCardsForGap - 1);
    const gapY = (playArea.playerCardsHeight - cardHeight) / 1.8;

    textAlign(LEFT, CENTER);
    //Dynamic font size
    var fontSize = Math.floor(cardWidth * 0.55);
    textFont(font, fontSize);

    //Add cards
    for (var i = 0; i < cards.length; i++) {
      push();
      const x = playArea.x + padding + (cardWidth + gapX) * i;
      const y = playArea.playerCardsTop + gapY;
      translate(x, y);
      const isHighlighted = selectedCardNum == i;  //selected card position in hand equals the card we are displaying
      drawPlayerCard(cards[i], cardWidth, cardHeight, isHighlighted);
      pop();

      //We may have two versions of the same card in the hand, so make an array
      if (!(cards[i] in playerCardFrames)) {
        playerCardFrames[cards[i]] = [];
      }
      playerCardFrames[cards[i]].push({ x: x, y: y, w: cardWidth, h: cardHeight, cardNum: i });
    }
		
		//add player cards label
    fill(255);
    var fontSize = Math.floor(cardWidth * 0.45);
    textFont(font, fontSize);
		text('Your cards', playArea.x + padding, playArea.playerCardsTop + playArea.playerCardsHeight * 0.15);
  }

  //draw the player card at the current position
  function drawPlayerCard(card, w, h, isHighlighted) {
    //Background
    const rounded = 5.0;
    fill(isHighlighted ? highlightColor : 255);
    rect(0, 0, w, h, rounded);

    const cardParts = card.split('|');

    //Add text
    fill(0);
    text(cardParts[0], w * 0.15, h * 0.25);

    //add image
    const img = images[cardParts[1]];
    const imgW = w / 2.1;
    const imgH = imgW / img.width * img.height;
    image(img, w / 2 / 1.1, h / 2 * 1.25, imgW, imgH);      
  }

  //draw the title text
  function drawTitleText() {
    const str = gameLogic.statusString();
    fill(255);
    textAlign(CENTER, CENTER);
    const fontSize = Math.floor(playArea.width * 0.08);
    textFont(font, fontSize);
    text(str, playArea.x, playArea.y, playArea.width, playArea.boardTop - playArea.y);
  }

  function drawCloseButton() {
    //Close control - cancels whole game
    closeButton = new CloseButton(playArea.x + playArea.width * 0.965, playArea.y + playArea.width * (1 - 0.965), 255);
    closeButton.draw();
  }

  //setup player colours - from gameState.players color values
  function setupPlayerColors() {
    colPlayer1 = gameLogic.colPlayer1();
    colPlayer2 = gameLogic.colPlayer2();
  }

  function isCorner(row, col) {
    if (row == 0 && col == 0) { return true; }
    if (row == 0 && col == 9) { return true; }
    if (row == 9 && col == 9) { return true; }
    if (row == 9 && col == 0) { return true; }
    return false;
  }

}