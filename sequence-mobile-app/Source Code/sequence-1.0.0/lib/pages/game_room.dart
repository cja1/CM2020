import 'package:flutter/material.dart';
import 'package:playing_cards/playing_cards.dart';
import 'package:provider/provider.dart';
import '../controllers/game.dart';
import '../widgets/app_bar.dart';
import '../widgets/sequence_board.dart';

class GameRoomPage extends StatefulWidget {
  GameRoomPage({Key? key}) : super(key: key);
  @override
  State<GameRoomPage> createState() => _GameRoomPageState();
}

class _GameRoomPageState extends State<GameRoomPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: sequenceAppBar(context),
      body: SingleChildScrollView(
        physics: BouncingScrollPhysics(),
        keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 5, vertical: 10),
          child: Column(
            children: [
              SequenceGrid(),
              SizedBox(height: 5,),
              BottomRow(),
            ],
          ),
        ),
      ),
    );
  }
}

class BottomRow extends StatefulWidget {
  BottomRow({Key? key}) : super(key: key);
  @override
  State<BottomRow> createState() => _BottomRowState();
}

class _BottomRowState extends State<BottomRow> {
  @override
  Widget build(BuildContext context) {
    return Consumer<Game>(
      builder: (context, game, child) {

        if (game.gameWonBy == "red" || game.gameWonBy == "blue")
          return Padding(
            padding: EdgeInsets.all(8.0),
            child: Center(child: Column(
              children: [
                Text("${game.gameWonBy == "red" ? game.player1Name : game.player2Name} won", style: Theme.of(context).textTheme.headline3,),
                SizedBox(height: 10,),
                OutlinedButton(
                  onPressed: () async {
                    game.clearGame();
                    Navigator.of(context).pushReplacementNamed("/StartScreen");
                  },
                  child: Text("End Game")
                )
              ],
            ),),
          );

        if (!game.currentPlayerPlayed && game.showingCards && game.selectedCard == null){
          WidgetsBinding.instance.addPostFrameCallback((timeStamp) {
            if (game.player1Turn)
              game.setSelectedCard(game.player1Hand.last, game.player1Hand.length - 1);
            else
              game.setSelectedCard(game.player2Hand.last, game.player2Hand.length - 1);
          });
        }

        List<PlayingCard> hand = game.player1Turn ? game.player1Hand : game.player2Hand;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Visibility(
              visible: !game.showingCards,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  SizedBox(height: 10,),
                  Wrap(
                    alignment: WrapAlignment.center,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      game.getPlayerCounterContainer(),
                      Text("  ${game.player1Turn ? game.player1Name : game.player2Name}'s turn", style: Theme.of(context).textTheme.headline4,),
                    ],
                  ),
                  SizedBox(height: 10,),
                  OutlinedButton(onPressed: (){game.showHand();}, child: Text("Show Cards")),
                  SizedBox(height: 4,)
                ],
              ),
            ),
            Visibility(
              visible: game.showingCards,
              child: SizedBox(
                height: 160,
                width: MediaQuery.of(context).size.width / 1.2,
                child: Stack(
                  children: List.generate(hand.length, (index) => Align(
                    alignment: Alignment(-1.0 + (index / (hand.length - 1)) * 2.0, 0),
                    child: GestureDetector(
                      onTap: (){
                        setState(() {
                          if (game.selectedCardHandIndex != index) {
                            if (game.player1Turn)
                              game.setSelectedCard(game.player1Hand[index], index);
                            else
                              game.setSelectedCard(game.player2Hand[index], index);
                          }
                        });
                      },
                      child: index != (game.selectedCardHandIndex)
                        ? Padding(
                          padding: EdgeInsets.only(top: 20),
                          child: PlayingCardView(card: hand[index], elevation: 1),
                        )
                        : PlayingCardView(card: hand[index], elevation: 1)
                    ),
                  )),
                ),
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                Visibility(
                  visible: game.canCallDeadCard(game.selectedCard ?? hand.last),
                  child: OutlinedButton(
                    onPressed: (){game.callDeadCard(game.selectedCardHandIndex);},
                    child: Text("Dead Card")
                  )
                ),
                Visibility(
                  visible: game.currentPlayerPlayed,
                  child: OutlinedButton(
                    onPressed: game.onEndCurrentTurn,
                    child: Text("End Turn"))
                )
              ],
            )
          ],
        );
      }
    );
  }
}



