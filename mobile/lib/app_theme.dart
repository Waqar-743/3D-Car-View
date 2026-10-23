import 'package:flutter/material.dart';

const cream = Color(0xFFF6F1E5);
const paper = Color(0xFFFFFCF4);
const pine = Color(0xFF263F35);
const muted = Color(0xFF5B6C60);
const orange = Color(0xFFE98254);
const rule = Color(0xFFD7DDCF);

ThemeData windwayTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: pine,
    brightness: Brightness.light,
    surface: cream,
    primary: pine,
    secondary: orange,
    onSurface: pine,
    outline: rule,
  );
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: cream,
    fontFamily: 'Roboto',
    textTheme: const TextTheme(
      displaySmall: TextStyle(
        fontSize: 36,
        height: 1.08,
        fontWeight: FontWeight.w800,
        letterSpacing: -1.2,
        color: pine,
      ),
      headlineMedium: TextStyle(
        fontSize: 28,
        height: 1.15,
        fontWeight: FontWeight.w800,
        letterSpacing: -.6,
        color: pine,
      ),
      titleLarge: TextStyle(
        fontSize: 21,
        height: 1.2,
        fontWeight: FontWeight.w700,
        color: pine,
      ),
      titleMedium: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w700,
        color: pine,
      ),
      bodyLarge: TextStyle(fontSize: 16, height: 1.5, color: muted),
      bodyMedium: TextStyle(fontSize: 14, height: 1.45, color: muted),
      labelLarge: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: cream,
      foregroundColor: pine,
      scrolledUnderElevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(
        fontFamily: 'Roboto',
        fontSize: 19,
        fontWeight: FontWeight.w800,
        color: pine,
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size(48, 52),
        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(48, 52),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
        side: const BorderSide(color: rule),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    ),
    iconButtonTheme: IconButtonThemeData(
      style: IconButton.styleFrom(minimumSize: const Size(48, 48)),
    ),
    sliderTheme: const SliderThemeData(trackHeight: 4),
    dividerTheme: const DividerThemeData(color: rule, space: 32),
  );
}
