# Windway, now in your pocket

I started Windway with a car on a screen. Then I wanted a road, then a jungle, then a mountain that fought back. This Android edition brings those same three roads into an app, with a quieter interface and room for your thumbs.

Made by [Waqar Ahmed](https://github.com/Waqar-743). Source: [WindWay](https://github.com/Waqar-743/WindWay/tree/codex/flutter-android).

## What is inside?

Flutter handles the animated welcome screen, Start / Continue, characters, settings, and the driving guide. The actual 3D driving game is the existing **Three.js / Rapier game bundled into a local Android WebView**. This is not a rewrite into a native Dart 3D engine, and no hosted website is required to race.

- Alpine: the original winding valley loop, bridges, and boost ramp.
- Canopy Run: a dense jungle circuit, two laps, and the familiar wildlife.
- Frostbite Ascent: the long, slippery mountain climb to the summit.
- Two cars, the full SVG collection, and a new original open-wheel launcher icon.
- Compact corner information: minimap left, speed right, with time and race progress kept away from the middle of the road.
- Continue restores the last saved race checkpoint, not an arbitrary mid-air frame. Your preferences stay on the device.

Choose arrow buttons, a virtual steering wheel, or **phone tilt**. Tilt means gently rotating the phone left and right; do not bend, stretch, or shake the device. Settings also include camera and performance choices. The first version is single-player, not an online multiplayer game.

## Smooth comes before shiny

The Infinix Hot 10 is the target for the conservative automatic graphics defaults. The game uses the optimized delivery car models, caps rendering resolution, and reduces costly effects. Automatic graphics can lower resolution if frames slow down. Low graphics and calmer effects are useful when the device is warm or battery is low.

Actual frame rate, thermal behavior, touch feel, and tilt calibration still need testing on a physical phone. There is no guaranteed 60 FPS claim. An emulator or a successful APK build does not establish hardware performance.

## Build and run

Use Node.js 20, Flutter **3.47.7 stable**, Java 17, and an installed Android SDK. The Android project targets Android 7.0 / API 24 or newer. From the repository root:

```sh
npm ci
node scripts/prepare-android-assets.mjs
node scripts/prepare-android-web.mjs
node scripts/test-android-assets.mjs
node scripts/test-android-web.mjs
cd mobile
flutter pub get
flutter analyze
flutter test
flutter run
```

The generated `assets/game` folder is intentionally ignored by Git. **Prepare the web bundle before running Flutter**; a fresh clone cannot drive until that build step has completed. If the app reports missing bundled game files, regenerate them with the two prepare scripts above and rebuild the app. It does not silently replace the game with an online page or an empty placeholder.

To make installable APKs covering both 32-bit and 64-bit Android firmware:

```sh
flutter build apk --release --target-platform android-arm,android-arm64 --split-per-abi
```

Files appear in `mobile/build/app/outputs/flutter-apk/`. Use the `armeabi-v7a` APK for 32-bit firmware or `arm64-v8a` for 64-bit firmware. The GitHub **Build Windway Android demo** workflow runs on this Android branch or on manual request and retains both APKs for 14 days. It does not publish or change GitHub Pages.

These are **demo APKs using the development signing setup**, not Play Store-ready releases. A real release still needs your private signing key, release configuration, device testing, and store disclosures. Do not commit signing keys or passwords.

## Offline, with credit where it belongs

Cars, SVGs, code, physics, and sounds are packaged with the application. Gameplay requires no account, analytics, remote fonts, or asset downloads. Initial development builds still need the normal package downloads on the build computer. Profile, source, and license links are external destinations, not a requirement to play.

The car artwork by [MattsActuallyUsefulModels](https://sketchfab.com/MattsActuallyUsefulModels) retains **CC BY-NC-SA 4.0** attribution and noncommercial restrictions. Read the complete [model credits](assets/art/MODEL_CREDITS.md) before sharing or distributing. Formula 1, McLaren, and Mercedes-AMG marks belong to their respective owners; Windway is an independent, noncommercial learning project, not an official product.

The launcher artwork is an original stylized open-wheel car, not the Formula 1 logo. Editable sources and sizing notes are in [branding](branding/README.md).
