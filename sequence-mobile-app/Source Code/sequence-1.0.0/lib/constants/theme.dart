import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class SequenceAppTheme{
  static ThemeData baseTheme = ThemeData(
    fontFamily: "Montserrat",
    primaryColor: Colors.black,
    indicatorColor: Colors.black,
    scaffoldBackgroundColor: Colors.white,
    appBarTheme: AppBarTheme(
      elevation: 0,
      centerTitle: true,
      foregroundColor: Colors.black,
      backgroundColor: Colors.white,
      shadowColor: Colors.transparent,
      iconTheme: IconThemeData(color: Colors.black),
      actionsIconTheme: IconThemeData(color: Colors.black),
      systemOverlayStyle: SystemUiOverlayStyle(
        statusBarColor: Colors.black,
        statusBarBrightness: Brightness.dark,
        systemNavigationBarColor: Colors.black,
        systemNavigationBarDividerColor: Colors.black,
        systemNavigationBarIconBrightness: Brightness.dark,
      )
    ),
    snackBarTheme: SnackBarThemeData(
      elevation: 2,
      backgroundColor: Colors.black,
      contentTextStyle: TextStyle(
        fontSize: 14,
        color: Colors.white,
        fontFamily: "Montserrat",
        fontWeight: FontWeight.normal,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(10),
          topRight: Radius.circular(10)
        )
      )
    ),
    textSelectionTheme: TextSelectionThemeData(
      cursorColor: Colors.black,
      selectionColor: Colors.black.withOpacity(0.4),
      selectionHandleColor: Colors.black
    ),
    inputDecorationTheme: InputDecorationTheme(
      hintStyle: TextStyle(
        fontSize: 18,
        fontFamily: "Montserrat",
        color: Colors.black.withOpacity(0.7),
      ),
      border: UnderlineInputBorder(
        borderSide: BorderSide(color: Colors.black, width: 3),
      ),
      enabledBorder: UnderlineInputBorder(
        borderSide: BorderSide(color: Colors.black, width: 3)
      ),
      disabledBorder: UnderlineInputBorder(
        borderSide: BorderSide(color: Colors.black, width: 3)
      ),
      focusedBorder: UnderlineInputBorder(
        borderSide: BorderSide(color: Colors.black, width: 3)
      ),
      errorBorder: UnderlineInputBorder(
        borderSide: BorderSide(color: Colors.black, width: 3)
      )
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: ButtonStyle(
        side: MaterialStatePropertyAll<BorderSide>(BorderSide(width: 3, color: Colors.black)),
        padding: MaterialStatePropertyAll<EdgeInsets>(EdgeInsets.symmetric(horizontal: 20, vertical: 5)),
        foregroundColor: MaterialStatePropertyAll<Color>(Colors.black),
      )
    ),
    textButtonTheme: TextButtonThemeData(
      style: ButtonStyle(
        foregroundColor: MaterialStatePropertyAll<Color>(Colors.black),
        textStyle: MaterialStatePropertyAll<TextStyle>(TextStyle(
          fontSize: 24,
          color: Colors.black,
          fontFamily: "Montserrat",
          fontWeight: FontWeight.w600,)
        )
      )
    ),
    switchTheme: SwitchThemeData(
      thumbColor: MaterialStatePropertyAll<Color>(Colors.black),
      splashRadius: 0,
    ),
    textTheme: TextTheme(
      headline1: TextStyle(
        fontSize: 36,
        color: Colors.black,
        fontFamily: "Montserrat",
        fontWeight: FontWeight.w600,
      ),
      headline2: TextStyle(
        fontSize: 32,
        color: Colors.black,
        fontFamily: "Montserrat",
        fontWeight: FontWeight.w800,
      ),
      headline3: TextStyle(
        fontSize: 28,
        color: Colors.black,
        fontFamily: "Montserrat",
        fontWeight: FontWeight.w600,
      ),
      headline4: TextStyle(
        fontSize: 24,
        color: Colors.black,
        fontFamily: "Montserrat",
        fontWeight: FontWeight.normal,
      ),
      headline5: TextStyle(
        fontSize: 22,
        color: Colors.black,
        fontFamily: "Montserrat",
        fontWeight: FontWeight.normal,
      ),
      headline6: TextStyle(
        fontSize: 18,
        color: Colors.black,
        fontFamily: "Montserrat",
        fontWeight: FontWeight.normal,
      ),
      bodyText1: TextStyle(
        fontSize: 16,
        color: Colors.black,
        fontFamily: "Montserrat",
        fontWeight: FontWeight.normal,
      ),
      bodyText2: TextStyle(
        fontSize: 14,
        color: Colors.black,
        fontFamily: "Montserrat",
        fontWeight: FontWeight.w100,
      )
    )
  );
}