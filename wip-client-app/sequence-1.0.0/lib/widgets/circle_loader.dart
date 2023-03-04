import 'package:flutter/material.dart';

class CircleLoader extends StatelessWidget {
  const CircleLoader({Key? key}) : super(key: key);
  @override
  Widget build(BuildContext context) => CircularProgressIndicator(color: Theme.of(context).primaryColor,);
}
