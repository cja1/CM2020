import 'dart:math';

import 'package:flutter/material.dart';
import 'package:playing_cards/playing_cards.dart';
import '../controllers/audio.dart';

import '../constants/helper.dart';

class Game extends ChangeNotifier{
  Random randomizer = Random();
  final PlayingCard cornerCard = PlayingCard(Suit.joker, CardValue.joker_1);

  List<List<PlayingCard>> grid = [];
  List<PlayingCard> grid1D = [];
  List<String?> counterGrid = [];

  List<PlayingCard> gameRoomDeck = [];
  List<PlayingCard> gameRoomPlayedCards = [];

  PlayingCard? selectedCard;
  int? selectedCardHandIndex = 0;

  String player1Name = "";
  String player2Name = "";
  List<PlayingCard> player1Hand = [];
  List<PlayingCard> player2Hand = [];

  bool player1Turn = true; // player 2 turn = false
  bool showingCards = false;
  bool currentPlayerPlayed = false;

  String? gameWonBy;

  Game(){
    if (cardValueGrid.length != 10)
      throw Error.safeToString(
        "[Card Grid] - Card Value Grid: ${cardValueGrid.length} rows",);

    if (suitGrid.length != 10)
      throw Error.safeToString(
        "[Card Grid] - Suit Grid: ${cardValueGrid.length} rows",);

    for (int i = 0; i < 10; i++) {
      grid.add(List<PlayingCard>.generate(10, (index) => PlayingCard(Suit.spades, CardValue.jack)));
      for (int j = 0; j < 10; j++)
        grid[i][j] = PlayingCard(suitGrid[i][j], cardValueGrid[i][j]);
    }

    grid1D = grid.expand((element) => element).toList();
    counterGrid = List.generate(grid1D.length, (index) => null);

    gameRoomDeck.addAll(standardFiftyTwoCardDeck());
    gameRoomDeck.addAll(standardFiftyTwoCardDeck());
    fillHandsFirst();
  }

  final List<List<CardValue>> cardValueGrid = [
    [
      CardValue.joker_1, CardValue.two, CardValue.three, CardValue.four,
      CardValue.five, CardValue.six, CardValue.seven, CardValue.eight,
      CardValue.nine, CardValue.joker_1
    ],
    [
      CardValue.six, CardValue.five, CardValue.four, CardValue.three,
      CardValue.two, CardValue.ace, CardValue.king, CardValue.queen,
      CardValue.ten, CardValue.ten
    ],
    [
      CardValue.seven, CardValue.ace, CardValue.two, CardValue.three,
      CardValue.four, CardValue.five, CardValue.six, CardValue.seven,
      CardValue.nine, CardValue.queen
    ],
    [
      CardValue.eight, CardValue.king, CardValue.six, CardValue.five,
      CardValue.four, CardValue.three, CardValue.two, CardValue.eight,
      CardValue.eight, CardValue.king,
    ],
    [
      CardValue.nine, CardValue.queen, CardValue.seven, CardValue.six,
      CardValue.five, CardValue.four, CardValue.ace, CardValue.nine,
      CardValue.seven, CardValue.ace
    ],
    [
      CardValue.ten, CardValue.ten, CardValue.eight, CardValue.seven,
      CardValue.two, CardValue.three, CardValue.king, CardValue.ten,
      CardValue.six, CardValue.two
    ],
    [
      CardValue.queen, CardValue.nine, CardValue.nine, CardValue.eight,
      CardValue.nine, CardValue.ten, CardValue.queen, CardValue.queen,
      CardValue.five, CardValue.three
    ],
    [
      CardValue.king, CardValue.eight, CardValue.ten, CardValue.queen,
      CardValue.king, CardValue.ace, CardValue.ace, CardValue.king,
      CardValue.four, CardValue.four
    ],
    [
      CardValue.ace, CardValue.seven, CardValue.six, CardValue.five,
      CardValue.four, CardValue.three, CardValue.two, CardValue.two,
      CardValue.three, CardValue.five
    ],
    [
      CardValue.joker_1, CardValue.ace, CardValue.king, CardValue.queen,
      CardValue.ten, CardValue.nine, CardValue.eight, CardValue.seven,
      CardValue.six, CardValue.joker_1
    ]
  ];

  final List<List<Suit>> suitGrid = [
    [
      Suit.joker, Suit.spades, Suit.spades, Suit.spades, Suit.spades,
      Suit.spades, Suit.spades, Suit.spades, Suit.spades, Suit.joker
    ],
    [
      Suit.clubs, Suit.clubs, Suit.clubs, Suit.clubs, Suit.clubs,
      Suit.hearts, Suit.hearts, Suit.hearts, Suit.hearts, Suit.spades
    ],
    [
      Suit.clubs, Suit.spades, Suit.diamonds, Suit.diamonds, Suit.diamonds,
      Suit.diamonds, Suit.diamonds, Suit.diamonds, Suit.hearts, Suit.spades
    ],
    [
      Suit.clubs, Suit.spades, Suit.clubs, Suit.clubs, Suit.clubs,
      Suit.clubs, Suit.clubs, Suit.diamonds, Suit.hearts, Suit.spades
    ],
    [
      Suit.clubs, Suit.spades, Suit.clubs, Suit.hearts, Suit.hearts,
      Suit.hearts, Suit.hearts, Suit.diamonds, Suit.hearts, Suit.spades
    ],
    [
      Suit.clubs, Suit.spades, Suit.clubs, Suit.hearts, Suit.hearts,
      Suit.hearts, Suit.hearts, Suit.diamonds, Suit.hearts, Suit.diamonds
    ],
    [
      Suit.clubs, Suit.spades, Suit.clubs, Suit.hearts, Suit.hearts,
      Suit.hearts, Suit.hearts, Suit.diamonds, Suit.hearts, Suit.diamonds,
    ],
    [
      Suit.clubs, Suit.spades, Suit.clubs, Suit.clubs, Suit.clubs,
      Suit.clubs, Suit.diamonds, Suit.diamonds, Suit.hearts, Suit.diamonds,
    ],
    [
      Suit.clubs, Suit.spades, Suit.spades, Suit.spades, Suit.spades,
      Suit.spades, Suit.spades, Suit.hearts, Suit.hearts, Suit.diamonds
    ],
    [
      Suit.joker, Suit.diamonds, Suit.diamonds, Suit.diamonds, Suit.diamonds,
      Suit.diamonds, Suit.diamonds, Suit.diamonds, Suit.diamonds, Suit.joker
    ]
  ];

  void setPlayerNames(String player1, String player2){ player1Name = player1; player2Name = player2; }

  void fillHandsFirst(){
    for (int i = 0; i < 6; i ++){
      player1Hand.add(gameRoomDeck.removeAt(randomizer.nextInt(gameRoomDeck.length)));
      player2Hand.add(gameRoomDeck.removeAt(randomizer.nextInt(gameRoomDeck.length)));
    }
  }

  void showHand(){ if (!showingCards){ showingCards = true; notifyListeners(); } }

  void setSelectedCard(PlayingCard pickedCard, int handIndex){
    Helper.debugPrint("Selecting ${'${pickedCard.suit} ${pickedCard.value}'}");
    selectedCard = pickedCard;
    selectedCardHandIndex = handIndex;
    notifyListeners();
  }

  void unSelectCard(){ selectedCard = null; selectedCardHandIndex = null; notifyListeners(); }

  void fillHandAfterTurn(){
    if (player1Turn)
      player1Hand.add(gameRoomDeck.removeAt(randomizer.nextInt(gameRoomDeck.length)));
    else
      player2Hand.add(gameRoomDeck.removeAt(randomizer.nextInt(gameRoomDeck.length)));
  }

  bool compareCards(PlayingCard? card1, PlayingCard? card2)
    => card1?.suit == card2?.suit && card1?.value == card2?.value;

  void placeCounter(int gridIndex){
    counterGrid[gridIndex] = player1Turn ? "red" : "blue";
  }

  bool oneEyedJackSelected()
    => compareCards(selectedCard, PlayingCard(Suit.spades, CardValue.jack)) || compareCards(selectedCard, PlayingCard(Suit.hearts, CardValue.jack));

  bool isOtherPlayedGridCard(int gridIndex)
    => (player1Turn && counterGrid[gridIndex] == "blue") || (!player1Turn && counterGrid[gridIndex] == "red");

  bool twoEyedJackSelected()
    => compareCards(selectedCard, PlayingCard(Suit.diamonds, CardValue.jack)) || compareCards(selectedCard, PlayingCard(Suit.clubs, CardValue.jack));

  bool isGridCardPlayed(int gridIndex)
    => counterGrid[gridIndex] != null;

  bool isWildCardSelected()
    => oneEyedJackSelected() || twoEyedJackSelected();

  bool isCornerCardOnGrid(int gridIndex)
    => compareCards(cornerCard, grid1D[gridIndex]);

  bool canCallDeadCard(PlayingCard card) {
    int countPlayed = 0;
    for (int i = 0; i < grid1D.length; i++) {
      if (compareCards(card, grid1D[i]) && counterGrid[i] != null)
        if (++countPlayed == 2) return true;
    }
    return false;
  }

  void callDeadCard(int? handIndex){
    AudioController.playDeadCardSound();
    if (handIndex != null){
      if (player1Turn) {
        player1Hand.removeAt(handIndex);
        player1Hand.add(gameRoomDeck.removeAt(randomizer.nextInt(gameRoomDeck.length)));
      }
      else{
        player2Hand.removeAt(handIndex);
        player2Hand.add(gameRoomDeck.removeAt(randomizer.nextInt(gameRoomDeck.length)));
      }
      notifyListeners();
    }
  }

  void onEndCurrentTurn(){
    fillHandAfterTurn();
    player1Turn = !player1Turn;
    showingCards = false;
    currentPlayerPlayed = false;
    notifyListeners();
  }

  void playTurn(int gridIndex){
    AudioController.playFlipCardSound();
    Helper.debugPrint("Placing counter on $gridIndex card");
    if (oneEyedJackSelected())
      counterGrid[gridIndex] = null;
    else
      placeCounter(gridIndex);
    gameRoomPlayedCards.add(
      player1Turn
        ? player1Hand.removeAt(selectedCardHandIndex!)
        : player2Hand.removeAt(selectedCardHandIndex!)
    );
    currentPlayerPlayed = true;
    unSelectCard();
    checkWinGame();
    notifyListeners();
  }

  bool checkSequenceInAllDirections(int gridIndex, String? counter){
    // check left
    for (int i = gridIndex, j = 0; i % 9 != 0; i--){
      if (counterGrid[i] == counter || compareCards(grid1D[i], cornerCard)) {
        if (++j == 5) return true;
      }
      else break;
    }

    // check right
    for (int i = gridIndex, j = 0; i % 10 != 0; i++){
      if (counterGrid[i] == counter || compareCards(grid1D[i], cornerCard)) {
        if (++j == 5) return true;
      }
      else break;
    }

    // check top
    for (int i = gridIndex, j = 0; i > 0; i -= 10) {
      if (counterGrid[i] == counter || compareCards(grid1D[i], cornerCard)) {
        if (++j == 5) return true;
      }
      else break;
    }

    // check bottom
    for (int i = gridIndex, j = 0; i < 100; i += 10) {
      if (counterGrid[i] == counter || compareCards(grid1D[i], cornerCard)) {
        if (++j == 5) return true;
      }
      else break;
    }

    // check top-left diagonal
    for (int i = gridIndex, j = 0; (i > 0 && (i % 9 != 0)); i -= 11){
      if (counterGrid[i] == counter || compareCards(grid1D[i], cornerCard)){
        if (++j == 5) return true;
      }
      else break;
    }

    // check bottom-right diagonal
    for (int i = gridIndex, j = 0; (i < 100 && (i % 10 != 0)); i += 11){
      if (counterGrid[i] == counter || compareCards(grid1D[i], cornerCard)){
        if (++j == 5) return true;
      }
      else break;
    }

    // check bottom-left diagonal
    for (int i = gridIndex, j =0; i < 100; i += 9){
      if (counterGrid[i] == counter || compareCards(grid1D[i], cornerCard)){
        if (++j == 5) return true;
        if (i % 10 == 0) break;
      }
      else break;
    }

    // check top-right diagonal
    for (int i = gridIndex, j =0; i > 0; i -= 9){
      if (counterGrid[i] == counter || compareCards(grid1D[i], cornerCard)){
        if (++j == 5) return true;
        if (i % 9 == 0) break;
      }
      else break;
    }

    return false;
  }

  void checkWinGame(){
    for (int i = 0; i < counterGrid.length; i++){
      if (counterGrid[i] != null && checkSequenceInAllDirections(i, counterGrid[i])){
        gameWonBy = counterGrid[i]; // already calling notifyListener in coupled function
        AudioController.playGameWinSound();
        break;
      }
    }
  }

  Widget getPlayerCounterContainer(){
    return Container(
      width: 20, height: 20,
      decoration: BoxDecoration(
        color: player1Turn ? Colors.red : Colors.blue,
        shape: BoxShape.circle,
      ),
    );
  }

  Future<void> clearGame() async {
    randomizer = Random();
    counterGrid = List.generate(grid1D.length, (index) => null);

    gameRoomDeck.clear();
    gameRoomPlayedCards.clear();
    gameRoomDeck.addAll(standardFiftyTwoCardDeck());
    gameRoomDeck.addAll(standardFiftyTwoCardDeck());

    selectedCard = null;
    selectedCardHandIndex = 0;

    player1Turn = true;
    showingCards = false;
    currentPlayerPlayed = false;
    gameWonBy = null;

    player1Hand.clear();
    player2Hand.clear();
    fillHandsFirst();
    notifyListeners();
  }
}
