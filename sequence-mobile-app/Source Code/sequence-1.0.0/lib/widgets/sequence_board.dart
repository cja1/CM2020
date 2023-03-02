import 'package:flutter/material.dart';
import 'package:playing_cards/playing_cards.dart';
import 'package:provider/provider.dart';

import '../controllers/game.dart';

class SequenceGrid extends StatefulWidget {
  SequenceGrid({Key? key}) : super(key: key);
  @override
  State<SequenceGrid> createState() => _SequenceGridState();
}

class _SequenceGridState extends State<SequenceGrid> {
  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      padding: EdgeInsets.zero,
      clipBehavior: Clip.hardEdge,
      physics: NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 10,
        crossAxisSpacing: 0,
        mainAxisSpacing: 0,
        //childAspectRatio: 0.75,
        mainAxisExtent: MediaQuery.of(context).size.height / 15
      ),
      itemCount: Provider.of<Game>(context, listen: false).grid1D.length,
      itemBuilder: (BuildContext context, int index) {
        return Consumer<Game>(
          builder: (context, game, child) {
            return GestureDetector(
              onTap: (){
                if (!game.currentPlayerPlayed){
                if (
                (   game.compareCards(game.selectedCard, game.grid1D[index])
                    && !game.isGridCardPlayed(index)
                )
                || (game.twoEyedJackSelected() && !game.isGridCardPlayed(index))
                || (game.oneEyedJackSelected() && game.isOtherPlayedGridCard(index))
                )
                  game.playTurn(index);
                }
              },
              child: Stack(
                alignment: Alignment.center,
                children: [
                  Positioned.fill(
                    child: PlayingCardView(
                      elevation: 2,
                      shape: RoundedRectangleBorder(
                        side: !game.isCornerCardOnGrid(index)
                            && (game.compareCards(game.selectedCard, game.grid1D[index])
                                || (game.twoEyedJackSelected() && !game.isGridCardPlayed(index))
                                || (game.oneEyedJackSelected() && game.isOtherPlayedGridCard(index))
                            )
                            ? BorderSide(color: Colors.green, width: 2) : BorderSide.none,
                        borderRadius: BorderRadius.circular(5)
                      ),
                      card: game.grid1D[index],
                      style: cardViewStyle(),
                    ),
                  ),
                  Visibility(
                    visible: game.counterGrid[index] != null,
                    child: Container(
                      width: 20, height: 20,
                      decoration: BoxDecoration(
                        color: game.counterGrid[index] == "red" ? Colors.red : Colors.blue,
                        shape: BoxShape.circle,
                      ),
                    ),
                  )
                ],
              ),
            );
          },
        );
      }
    );
  }

  PlayingCardViewStyle cardViewStyle() => PlayingCardViewStyle(suitStyles: {
    Suit.spades: SuitStyle(
      builder: (context) => FittedBox(
        fit: BoxFit.fitHeight,
        child: Text("♠",style: TextStyle(fontSize: 1000),),
      ),
      style: Theme.of(context).textTheme.headline1?.copyWith(color: Colors.black)
    ),
    Suit.hearts: SuitStyle(
      builder: (context) => FittedBox(
        fit: BoxFit.fitHeight,
        child: Text("♥",style: TextStyle(fontSize: 1000),),
      ),
      style: Theme.of(context).textTheme.headline1?.copyWith(color: Colors.red)
    ),
    Suit.diamonds: SuitStyle(
      builder: (context) => FittedBox(
        fit: BoxFit.fitHeight,
        child: Text("♦",style: TextStyle(fontSize: 1000),),
      ),
      style: Theme.of(context).textTheme.headline1?.copyWith(color: Colors.red)
    ),
    Suit.clubs: SuitStyle(
      builder: (context) => FittedBox(
        fit: BoxFit.fitHeight,
        child: Text("♣",style: TextStyle(fontSize: 1000),),
      ),
      style: Theme.of(context).textTheme.headline1?.copyWith(color: Colors.black)
    ),
    Suit.joker: SuitStyle(
      style: TextStyle(color: Colors.white),
      builder: (context) => Container(),
      cardContentBuilders: {
        CardValue.joker_1 : (context) => Center(child: Container(
          height: 10, width: 10,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: Colors.black
          ),
        )),
        CardValue.joker_2 : (context) => Center(child: Container(
          height: 5, width: 5,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: Colors.black
          ),
        ))
      }
    )
  });
}

