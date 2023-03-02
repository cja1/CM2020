import 'package:flutter/material.dart';

class NavigationErrorPage extends StatelessWidget {
  final String? routeName;
  NavigationErrorPage(this.routeName, {super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(automaticallyImplyLeading: true,),
        body: Center(
          child: Text("Navigation error: routeName = $routeName",
            style: Theme.of(context).textTheme.headline1?.copyWith(color: Colors.black), textAlign: TextAlign.center,),
        )
    );
  }
}
