//Handles game board display
function GameBoard() {
  
  //local vars
  //player colours
  var colPlayer1, colPlayer2;
  //static card images (heart, spade, club, diamond)
  var images = {};
  //lookups for board card position and player cards - to support hit check on click events
  var boardCardFrames = {};
  var playerCardFrames = {};
  var selectedCard = null;

  this.preload = function() {
    images['C'] = loadImage('images/club.png');
    images['S'] = loadImage('images/spade.png');
    images['H'] = loadImage('images/heart.png');
    images['D'] = loadImage('images/diamond.png');
  }

  this.setup = function() {
    drawBackground();
  }

  this.draw = function() {
    boardCardFrames = {};
    playerCardFrames = {};

    setupPlayerColors();

    drawGameBoard();
    drawPlayersCards(['3|H', '4|D', '10|H', '8|D', 'Q|D', 'A|D', '2|S']);
    drawText('Waiting for players');
  }

  //Check for clicks on cards - game board or player cards
  //If we have a click on a player card FOLLOWED BY a click on the relevant board cell AND validMove,return the card played.
  //If we are changing state (so need a refresh) return true.
  //Else return false.
  this.hitCheck = function() {
    var frame;

    //Start by seeing if selecting a card in player's hand
    const cards = Object.keys(playerCardFrames);
    for (var i = 0; i < cards.length; i++) {
      frame = playerCardFrames[cards[i]];

      if (mouseX > frame.x && mouseX < frame.x + frame.w && mouseY > frame.y && mouseY < frame.y + frame.h) {
        //clicking on a player card... options
        //#1 If no selected card, select this card
        if (selectedCard == null) {
          console.log('selecting card ' + cards[i]);
          selectedCard = cards[i];
          return true;
        }
        //#2 If the selected one, de-select
        if (selectedCard == cards[i]) {
          console.log('de-selecting card ' + selectedCard);
          selectedCard = null;
          return true;
        }
        //#3 Change the selected card to this one
        selectedCard = cards[i];
        console.log('selecting card ' + cards[i]);
        return true;
      }
    }

    //This wasn't a click on a player card but a click elsewhere. If no card currently selected, ignore the click
    if (selectedCard == null) {
      console.log('ignoring');
      return false;
    }

    //See if we have a click on one of the the relevant 2 board cards
    const frames = boardCardFrames[selectedCard];
    //Frames always contains exactly 2 frames for the 2 cards on the board
    for (var i = 0; i < frames.length; i++) {
      frame = frames[i];
      if (mouseX > frame.x && mouseX < frame.x + frame.w && mouseY > frame.y && mouseY < frame.y + frame.h) {
        //This is a click on the card - check a valid move for this card
        if (gameLogic.isValidMove(selectedCard, frame.row, frame.col)) {
          console.log('playing card ' + selectedCard);
          return selectedCard;
        }
        else {
          //ignore click
          return false;
        }
      }
    }

    //We clicked somewhere else - deselect and return false
    console.log('de-selecting card ' + selectedCard);
    selectedCard = null;
    return true;
  };

  ////////////////////////////////////////
  // Private functions
  ////////////////////////////////////////

  function drawBackground() {
    background('#505B4D');
    stroke('#00000050');
    noFill();
    rect(playArea.x, playArea.y, playArea.width, playArea.height);
    fill('#00000020');
    noStroke();
    rect(playArea.x, playArea.boardTop, playArea.width, playArea.boardHeight);
  }

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
        if (('boardState' in gameState) && (gameState.boardState[row][col] != '')) {
          colPlayer = (gameState.boardState[row][col] == 'p1') ? colPlayer1 : colPlayer2;
        }

        const card = board[row][col];
        const isHighlighted = selectedCard == card;  //selected card equals the card we are displaying
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

  function drawGameCell(w, h, card, colPlayer, isHighlighted) {
    //Draw playing card background
    const rounded = 5.0;
    fill(isHighlighted ? 'yellow' : 255);
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

  function drawPlayersCards(cards) {
    //Calculate dimensions
    const cardHeight = playArea.playerCardsHeight * 0.5;
    const cardWidth = cardHeight * 2 / 3; //width is 2/3 height - looks 'right'

    //Distribute cards with start / end padding
    const padding = playArea.width * 0.05; //5% of width as left / right padding

    //Force gap to always be based on 7 cards - so effectively left-aligns cards
    const numCardsForGap = 7;
    const gapX = (playArea.width - padding * 2 - numCardsForGap * cardWidth) / (numCardsForGap - 1);
    const gapY = (playArea.playerCardsHeight - cardHeight) / 2.0;

    textAlign(LEFT, CENTER);
    //Dynamic font size
    const fontSize = Math.floor(cardWidth * 0.55);
    textFont(font, fontSize);

    //Add cards
    for (var i = 0; i < cards.length; i++) {
      push();
      const x = playArea.x + padding + (cardWidth + gapX) * i;
      const y = playArea.playerCardsTop + gapY;
      translate(x, y);
      const isHighlighted = selectedCard == cards[i];  //selected card equals the card we are displaying
      drawPlayerCard(cards[i], cardWidth, cardHeight, isHighlighted);
      pop();

      playerCardFrames[cards[i]] = { x: x, y: y, w: cardWidth, h: cardHeight };
    }
  }

  function drawPlayerCard(card, w, h, isHighlighted) {
    //Background
    const rounded = 5.0;
    fill(isHighlighted ? 'yellow' : 255);
    rect(0, 0, w, h, rounded);

    const cardParts = card.split('|');

    //Add text
    fill(0);
    text(cardParts[0], w * 0.15, h * 0.25);

    //add image
    //HERE: remove background from images. Make fixed size / heart in the middle of a (200 x 200?) box
    const img = images[cardParts[1]];
    const imgW = w / 2.1;
    const imgH = imgW / img.width * img.height;
    image(img, w / 2 / 1.1, h / 2 * 1.25, imgW, imgH);      
  }

  function drawText(str) {
    fill(255);
    textAlign(CENTER, CENTER);
    const fontSize = Math.floor(playArea.width * 0.09);
    textFont(font, fontSize);
    text(str, playArea.x, playArea.y, playArea.width, playArea.boardTop - playArea.y);
  }

  function setupPlayerColors() {
    if ('players' in gameState) {
      colPlayer1 = color('#' + gameState.players[0].color);
      colPlayer2 = color('#' + gameState.players[1].color);
    }
  }

}