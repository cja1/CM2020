import 'package:flutter/material.dart';

PreferredSizeWidget sequenceAppBar(BuildContext context){
  return PreferredSize(
    preferredSize: Size.fromHeight(50),
    child: AppBar(
      automaticallyImplyLeading: false,
      title: Image.asset(
        "assets/images/sequence_logo.png",
        errorBuilder: (context, widget, trace)
          => Text("Sequence", style: Theme.of(context).textTheme.headline2,),
      ),
    )
  );
}