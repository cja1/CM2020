import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../controllers/audio.dart';
import '../widgets/circle_loader.dart';

import '../controllers/game.dart';

class StartScreenPage extends StatefulWidget {
  const StartScreenPage({Key? key}) : super(key: key);

  @override
  State<StartScreenPage> createState() => _StartScreenPageState();
}

class _StartScreenPageState extends State<StartScreenPage> {
  final TextEditingController name1Controller = TextEditingController();
  final TextEditingController name2Controller = TextEditingController();
  final GlobalKey<FormState> formKey = GlobalKey<FormState>();
  bool randomGrid = false;
  bool startLoadingGrid = false;

  @override
  Widget build(BuildContext context) {
    return Form(
      key: formKey,
      child: Scaffold(
        resizeToAvoidBottomInset: true,
        body: SafeArea(
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: 20, vertical: 5),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Spacer(flex: 1,),
                Image.asset(
                  "assets/images/sequence_logo.png",
                  errorBuilder: (widget, object, trace)
                    => Text("Sequence", style: Theme.of(context).textTheme.headline2,),
                ),
                Spacer(flex: 1,),
                Container(
                  width: MediaQuery.of(context).size.width,
                  padding: EdgeInsets.symmetric(horizontal: 8, vertical: 15),
                  decoration: BoxDecoration(
                    border: Border.fromBorderSide(
                      BorderSide(color: Theme.of(context).primaryColor, width: 7)
                    ),
                    color: Theme.of(context).scaffoldBackgroundColor
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      SizedBox(
                        width: MediaQuery.of(context).size.width / 2,
                        child: TextFormField(
                          textAlign: TextAlign.center,
                          controller: name1Controller,
                          keyboardType: TextInputType.name,
                          textInputAction: TextInputAction.done,
                          style: Theme.of(context).textTheme.headline5,
                          decoration: InputDecoration(hintText: "Player 1 name",),
                          validator: (currentInput){
                            if (currentInput == null || currentInput == "")
                              return "Please enter name";
                            else if (currentInput.length > 10)
                              return "Enter less than 10 letters";
                            else return null;
                          },
                        ),
                      ),
                      SizedBox(height: 10,),
                      SizedBox(
                        width: MediaQuery.of(context).size.width / 2,
                        child: TextFormField(
                          textAlign: TextAlign.center,
                          controller: name2Controller,
                          keyboardType: TextInputType.name,
                          textInputAction: TextInputAction.done,
                          style: Theme.of(context).textTheme.headline5,
                          decoration: InputDecoration(hintText: "Player 2 name",),
                          validator: (currentInput){
                            if (currentInput == null || currentInput == "")
                              return "Please enter name";
                            else if (currentInput.length > 10)
                              return "Enter less than 10 letters";
                            else return null;
                          },
                        ),
                      ),
                      SizedBox(height: 20,),
                      Visibility(
                        visible: !startLoadingGrid,
                        child: OutlinedButton(
                          onPressed: onStartGamePressed,
                          child: Text("START GAME", style: Theme.of(context).textTheme.headline6,)
                        ),
                      ),
                      Visibility( visible: startLoadingGrid, child: CircleLoader(), )
                    ],
                  ),
                ),
                Spacer(flex: 1,),
                OutlinedButton(
                  onPressed: tutorialPressed,
                  style: Theme.of(context).outlinedButtonTheme.style?.copyWith(
                    shape: MaterialStatePropertyAll<OutlinedBorder>(StadiumBorder()),
                    padding: MaterialStatePropertyAll<EdgeInsets>(EdgeInsets.symmetric(horizontal: 30, vertical: 10))
                  ),
                  child: Text("Tutorial",
                    style: Theme.of(context).textTheme.headline4?.copyWith(fontWeight: FontWeight.w600),),
                ),
                Spacer(flex: 1,)
              ],
            ),
          ),
        ),
      ),
    );
  }

  void onStartGamePressed() async {
    setState(() {startLoadingGrid = true;});
    if (formKey.currentState!.validate()){
      FocusScope.of(context).unfocus();
      Provider.of<Game>(context, listen: false).setPlayerNames(name1Controller.text.trim(), name2Controller.text.trim());
      await AudioController.playShuffleCardSound();
      Future.delayed(Duration(seconds: 5), (){
        Navigator.of(context).pushReplacementNamed("/GameRoomScreen", arguments: false);
      });
    }
    else setState(() {startLoadingGrid = false;});
  }

  void tutorialPressed(){
    showDialog(
      barrierDismissible: true,
      context: context,
      builder: (context){
        return Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Container(
            padding: EdgeInsets.fromLTRB(10,10,15,10),
            width: MediaQuery.of(context).size.width,
            height: MediaQuery.of(context).size.height / 1.5,
            margin: EdgeInsets.symmetric(horizontal: 10, vertical: 10),
            decoration: BoxDecoration(
              border: Border.fromBorderSide(
                BorderSide(color: Theme.of(context).primaryColor, width: 7)
              ),
              color: Theme.of(context).scaffoldBackgroundColor
            ),
            child: Scrollbar(
              thickness: 3,
              child: SingleChildScrollView(
                physics: BouncingScrollPhysics(),
                child: Column(
                  children: [
                    Text("Objective", style: Theme.of(context).textTheme.headline3,),
                    Text("One player must create a sequence before their opponent to win the game. "
                      "A sequence is created when five identical colored chips are linked either "
                      "vertically, horizontally or diagonally.",
                      style: Theme.of(context).textTheme.headline6, textAlign: TextAlign.center,
                    ),
                    Text("\nCorner cards", style: Theme.of(context).textTheme.headline3,),
                    Text("Cards at the corner of the board are considered as an extra chip and when a sequence "
                      "is built around them, only four chips are needed to build a sequence.",
                      style: Theme.of(context).textTheme.headline6, textAlign: TextAlign.center,
                    ),
                    Text("\nHow to play", style: Theme.of(context).textTheme.headline3,),
                    Text("Players are dealt 6 cards from a total of 104 cards. A player places "
                      "a card from their hand and places a chip on the matching card on the board. The card "
                      "is discarded with replacement and the player turn ends. Each card appears twice on the board.",
                      style: Theme.of(context).textTheme.headline6, textAlign: TextAlign.center,
                    ),
                    Text("\nWild cards", style: Theme.of(context).textTheme.headline3,),
                    Text("Jacks do not appear on the board and are considered as wild cards. One eyed jacks "
                      "are used to remove an opponent chip from the board. Two eyed jacks are used to add a "
                      "chip on any unoccupied card in the board.",
                      style: Theme.of(context).textTheme.headline6, textAlign: TextAlign.center,
                    ),
                    Text("\nDead cards", style: Theme.of(context).textTheme.headline3,),
                    Text("Dead cards are cards in a player’s hand with no unoccupied corresponding card on the board. "
                      "These can be discarded for a new card on the player's turn.",
                      style: Theme.of(context).textTheme.headline6, textAlign: TextAlign.center,
                    )
                  ],
                ),
              ),
            ),
          ),
        );
      }
    );
  }
}
