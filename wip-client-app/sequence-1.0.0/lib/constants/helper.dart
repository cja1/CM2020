import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../constants/settings.dart';

class Helper{
  static void debugErrorPrint(dynamic error, {dynamic trace, List<dynamic>? additionalOutputs}){
    if (kDebugMode){
      print(error);
      print("\n$trace");
      if (additionalOutputs != null) for (Object? output in additionalOutputs){print(output);}
    }
  }

  static void debugPrint(Object? message){if (kDebugMode) print(message);}

  static void showSnackBar(String? content, {String? actionLabel, void Function()? actionOnPressed}){
    if (Settings.scaffoldMessengerKey.currentState == null) Helper.debugErrorPrint("[ScaffoldMessengerKey] - currentState = null");
    if (content == null) debugErrorPrint("[Helper] - showSnackBar: content = null");
    else Settings.scaffoldMessengerKey.currentState?..hideCurrentSnackBar()..showSnackBar(
      SnackBar(
        content: Text(content),
        action: actionLabel != null && actionOnPressed != null
            ? SnackBarAction(label: actionLabel, onPressed: actionOnPressed)
            : null
      )
    );
  }
}