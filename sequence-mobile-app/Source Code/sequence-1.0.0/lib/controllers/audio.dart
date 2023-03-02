import 'package:audioplayers/audioplayers.dart';

class AudioController{
  static void playFlipCardSound() async { await AudioPlayer().play(AssetSource("sounds/flip_card.mp3"));}
  static void playGameWinSound() async { await AudioPlayer().play(AssetSource("sounds/game_win.mp3")); }
  static Future<void> playShuffleCardSound() async { await AudioPlayer().play(AssetSource("sounds/shuffle_cards.mp3")); }
  static void playDeadCardSound() async { await AudioPlayer().play(AssetSource("sounds/dead_card.mp3")); }
}