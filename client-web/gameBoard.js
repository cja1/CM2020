//Handles game board display
function GameBoard() {
  
  //local vars
  var colPlayer1, colPlayer2;
  var images = {};

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
    setupPlayerColors();
    drawGameBoard();
    drawPlayersCards();
    drawText();
  }

  ////////////////////////////////////////
  // Private functions
  ////////////////////////////////////////

  function drawBackground() {
    background('#505B4D');
    stroke('#00000050');
    noFill();
    rect(playArea.x, playArea.y, playArea.width, playArea.height);
    fill('#00000010');
    noStroke();
    rect(playArea.x, playArea.boardTop, playArea.width, playArea.boardHeight);
  }

  function drawGameBoard() {
    const gap = 5.0;

    const cellWidth = (playArea.width - 11 * gap) / 10;
    const cellHeight = (playArea.boardHeight - 11 * gap) / 10;

    textAlign(LEFT);
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
        translate(playArea.x + (cellWidth + gap) * col + gap, playArea.boardTop + (cellHeight + gap) * row + gap);

        //HERE. Pass in boardState and use to pick colour or null

        var colPlayer = null;
        drawGameCell(cellWidth, cellHeight, board[row][col], colPlayer);
        pop();
      }
    }
  }

  function drawGameCell(w, h, card, colPlayer) {
    //Draw playing card background
    const rounded = 5.0;
    fill(255);
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
      text(cardParts[0], w * 0.15, h * 0.45);

      //add image
      const img = images[cardParts[1]];
      const imgW = w / 2.2;
      const imgH = imgW / img.width * img.height;
      image(img, w / 2, h / 2, imgW, imgH);
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

  function drawPlayersCards() {

  }

  function drawText() {
  }

  function setupPlayerColors() {
    if ('players' in gameState) {
      colPlayer1 = color('#' + gameState.players[0].color);
      colPlayer2 = color('#' + gameState.players[1].color);
    }
  }


}