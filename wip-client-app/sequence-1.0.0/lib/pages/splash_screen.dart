import 'package:flutter/material.dart';
import '../widgets/circle_loader.dart';

class SplashScreenPage extends StatefulWidget {
  const SplashScreenPage({Key? key}) : super(key: key);
  @override
  State<SplashScreenPage> createState() => _SplashScreenPageState();
}

class _SplashScreenPageState extends State<SplashScreenPage> {
  @override
  void initState() {
    Future.delayed(Duration(seconds: 3), (){ Navigator.of(context).pushReplacementNamed("/StartScreen"); });
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: ()async{return false;},
      child: Scaffold(
        body: SafeArea(
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: 20, vertical: 0),
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Image.asset("assets/images/sequence_logo.png"),
                  SizedBox(height: 60,),
                  CircleLoader(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
