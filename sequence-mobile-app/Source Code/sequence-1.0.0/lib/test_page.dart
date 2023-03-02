import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:playing_cards/playing_cards.dart';

class TestPage extends StatefulWidget {
  TestPage({Key? key}) : super(key: key);

  @override
  State<TestPage> createState() => _TestPageState();
}

class _TestPageState extends State<TestPage> {
  Suit suit = Suit.hearts;
  CardValue value = CardValue.jack;
  PlayingCardViewStyle? myCardStyles;

  @override
  void initState() {
    super.initState();
    SchedulerBinding.instance.addPostFrameCallback((timeStamp) {
      // This style object overrides the styles for the suits, replacing the
      // image-based default implementation for the suit emblems with a text based
      // implementation.

      myCardStyles = PlayingCardViewStyle(suitStyles: {
        Suit.spades: SuitStyle(
            builder: (context) => FittedBox(
              fit: BoxFit.fitHeight,
              child: Text(
                "♠",
                style: TextStyle(fontSize: 500),
              ),
            ),
            style: Theme.of(context).textTheme.headline5?.copyWith(color: Colors.black)),
        Suit.hearts: SuitStyle(
            builder: (context) => FittedBox(
              fit: BoxFit.fitHeight,
              child: Text(
                "♥",
                style: TextStyle(fontSize: 500),
              ),
            ),
            style: Theme.of(context).textTheme.headline5?.copyWith(color: Colors.red)),
        Suit.diamonds: SuitStyle(
            builder: (context) => FittedBox(
              fit: BoxFit.fitHeight,
              child: Text(
                "♦",
                style: TextStyle(fontSize: 500),
              ),
            ),
            style: Theme.of(context).textTheme.headline5?.copyWith(color: Colors.red)),
        Suit.clubs: SuitStyle(
            builder: (context) => FittedBox(
              fit: BoxFit.fitHeight,
              child: Text(
                "♣",
                style: TextStyle(fontSize: 500),
              ),
            ),
            style: Theme.of(context).textTheme.headline5?.copyWith(color: Colors.black)),
        Suit.joker: SuitStyle(
            builder: (context) => Container())
      });
      setState(() {});
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          PlayingCardView(card: PlayingCard(suit, value), style: myCardStyles),
          Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
            DropdownButton<Suit>(
                value: suit,
                items: Suit.values
                    .map((s) =>
                    DropdownMenuItem(value: s, child: Text(s.toString())))
                    .toList(),
                onChanged: (val) {
                  setState(() {
                    suit = val ?? suit;
                  });
                }),
            DropdownButton<CardValue>(
                value: value,
                items: CardValue.values
                    .map((s) =>
                    DropdownMenuItem(value: s, child: Text(s.toString())))
                    .toList(),
                onChanged: (val) {
                  setState(() {
                    value = val ?? value;
                  });
                }),
          ])
        ],
      ),
    );
  }
}