import 'package:page_transition/page_transition.dart';
import 'package:flutter/material.dart';
import '../pages/game_room.dart';
import '../pages/splash_screen.dart';
import '../pages/start_page.dart';
import '../test_page.dart';

import 'constants/helper.dart';
import 'navigation_error.dart';

class RouteGenerator{
  static const Duration _defaultTransitionDuration = Duration(milliseconds: 200);
  static PageTransition _defaultTransition(Widget child, {Duration duration = _defaultTransitionDuration}) =>
      PageTransition(child: child, type: PageTransitionType.fade, curve: Curves.easeOut, duration: duration);

  static ValueNotifier<String?> currentRoute = ValueNotifier('');

  static Route<dynamic> onGenerateRoute(RouteSettings settings){
    Helper.debugPrint("[NAVIGATOR] - navigating to named route: ${settings.name}, arguments: ${settings.arguments}");
    currentRoute.value = settings.name;
    switch (settings.name){
      case "/SplashScreen":
        return _defaultTransition(SplashScreenPage());
      case "/StartScreen":
        return _defaultTransition(StartScreenPage());
      case "/TestPageScreen":
        return _defaultTransition(TestPage());
      case "/GameRoomScreen":
        return _defaultTransition(GameRoomPage());
      default:
        return _defaultTransition(NavigationErrorPage(settings.name));
    }
  }
}