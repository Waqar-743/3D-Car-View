import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import 'app_model.dart';
import 'app_theme.dart';
import 'game_page.dart';

const artRoot = 'assets/art/';

class RoadStory {
  const RoadStory(
    this.id,
    this.name,
    this.tagline,
    this.description,
    this.facts,
    this.art,
  );
  final String id, name, tagline, description, art;
  final List<String> facts;
}

const roads = [
  RoadStory(
    'alpine',
    'Alpine Valley',
    'Find your line.',
    'A road between the pines, a river below, and a bridge that asks you to lift off the throttle. Start here; learn every bend.',
    ['1 lap', '8 gates', 'Bridge crossings', 'Boost ramp'],
    'cartoon-pack/mountain-range.svg',
  ),
  RoadStory(
    'jungle',
    'Canopy Run',
    'The trees are watching.',
    'Two laps under a crowded green canopy. Watch the road, not the lion. WAQAR, IMRAN and TATHEER are along for the ride.',
    ['2 laps', '8 gates per lap', 'Dense jungle', 'Boost ramp'],
    'jungle-pack/jungle-badge.svg',
  ),
  RoadStory(
    'snow',
    'Frostbite Ascent',
    'Earn the summit.',
    'A long, one-way climb through snow. Brake before black ice, thread the snow hurdles, and reach the final flag on the mountain.',
    ['6.44 km climb', '17 gate frames', 'Ice zones', 'Summit finish'],
    'snow-pack/snowy-mountain.svg',
  ),
];

RoadStory roadFor(String id) =>
    roads.firstWhere((r) => r.id == id, orElse: () => roads.first);

void _open(BuildContext context, Widget page) {
  Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => page));
}

void _drive(BuildContext context, AppModel model, {bool resume = false}) {
  _open(context, GamePage(model: model, resume: resume));
}

class AssetArt extends StatelessWidget {
  const AssetArt(this.path, {super.key, this.size = 96, this.label});
  final String path;
  final double size;
  final String? label;

  @override
  Widget build(BuildContext context) => Semantics(
    label: label,
    image: label != null,
    excludeSemantics: true,
    child: SvgPicture.asset(
      '$artRoot$path',
      width: size,
      height: size,
      fit: BoxFit.contain,
      placeholderBuilder: (_) => SizedBox(width: size, height: size),
    ),
  );
}

/// Shared safe-area shell. Content scrolls on short landscape phones instead of
/// shrinking the controls below comfortable touch sizes.
class MenuPage extends StatelessWidget {
  const MenuPage({
    super.key,
    required this.title,
    required this.child,
    this.subtitle,
    this.actions,
  });
  final String title;
  final String? subtitle;
  final Widget child;
  final List<Widget>? actions;

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text(title), actions: actions),
    body: SafeArea(
      top: false,
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
        child: Align(
          alignment: Alignment.topCenter,
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1120),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (subtitle != null) ...[
                  Text(subtitle!, style: Theme.of(context).textTheme.bodyLarge),
                  const SizedBox(height: 24),
                ],
                child,
              ],
            ),
          ),
        ),
      ),
    ),
  );
}

class StarterScreen extends StatelessWidget {
  const StarterScreen({super.key, required this.model});
  final AppModel model;

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: model,
    builder: (context, _) => MenuPage(
      title: 'WINDWAY',
      actions: [
        IconButton(
          tooltip: 'Options',
          onPressed: () => _open(context, OptionsScreen(model: model)),
          icon: const Icon(Icons.tune_rounded),
        ),
        const SizedBox(width: 8),
      ],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          LayoutBuilder(
            builder: (context, constraints) {
              final compact =
                  constraints.maxWidth >= 700 &&
                  MediaQuery.sizeOf(context).height < 500;
              final intro = Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (!compact) ...[
                    const Eyebrow('A LITTLE CAR. A LONG WAY HOME.'),
                    const SizedBox(height: 12),
                  ],
                  Text(
                    'Take the\nscenic detour.',
                    style: Theme.of(context).textTheme.displaySmall?.copyWith(
                      fontSize: compact ? 32 : 36,
                    ),
                  ),
                  SizedBox(height: compact ? 8 : 14),
                  Text(
                    compact
                        ? 'Three roads. Two cars. Find your own way.'
                        : 'Three roads. Two cars. Just you, the next bend, and a very questionable shortcut.',
                  ),
                  SizedBox(height: compact ? 12 : 22),
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: [
                      FilledButton.icon(
                        key: const ValueKey('start-button'),
                        onPressed: () =>
                            _open(context, RoadsScreen(model: model)),
                        icon: const Icon(Icons.arrow_forward_rounded),
                        label: const Text('Start a drive'),
                      ),
                      OutlinedButton.icon(
                        key: const ValueKey('continue-button'),
                        onPressed: model.hasSavedRun
                            ? () => _drive(context, model, resume: true)
                            : null,
                        icon: const Icon(Icons.play_arrow_rounded),
                        label: const Text('Continue'),
                      ),
                    ],
                  ),
                  if (!compact || model.hasSavedRun) ...[
                    const SizedBox(height: 10),
                    Text(
                      model.hasSavedRun
                          ? 'Continue ${roadFor(model.savedRun!['mapId'] as String).name} from your last gate.'
                          : 'Your next checkpoint will make a place to come back to.',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ],
              );
              final scene = _StarterScene(
                reducedMotion: model.reducedMotion,
                height: compact ? 180 : 252,
              );
              if (constraints.maxWidth < 700) {
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [intro, const SizedBox(height: 24), scene],
                );
              }
              return Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(flex: 6, child: intro),
                  const SizedBox(width: 32),
                  Expanded(flex: 5, child: scene),
                ],
              );
            },
          ),
          const SizedBox(height: 28),
          const Divider(height: 1),
          const SizedBox(height: 18),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _MenuLink(
                label: 'Garage',
                icon: Icons.sports_motorsports_outlined,
                onTap: () => _open(context, GarageScreen(model: model)),
              ),
              _MenuLink(
                label: 'Characters',
                icon: Icons.groups_2_outlined,
                onTap: () => _open(context, CharactersScreen(model: model)),
              ),
              _MenuLink(
                label: 'Options',
                icon: Icons.tune_rounded,
                onTap: () => _open(context, OptionsScreen(model: model)),
              ),
              _MenuLink(
                label: 'How to play',
                icon: Icons.menu_book_outlined,
                onTap: () => _open(context, HowToPlayScreen(model: model)),
              ),
            ],
          ),
          if (model.storageWarning != null) ...[
            const SizedBox(height: 16),
            Semantics(liveRegion: true, child: Text(model.storageWarning!)),
          ],
          const SizedBox(height: 18),
          const Text(
            'A small driving adventure by Waqar Ahmed. Built for the road, not a leaderboard.',
            style: TextStyle(fontSize: 12, color: muted),
          ),
        ],
      ),
    ),
  );
}

class _MenuLink extends StatelessWidget {
  const _MenuLink({
    required this.label,
    required this.icon,
    required this.onTap,
  });
  final String label;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => OutlinedButton.icon(
    onPressed: onTap,
    icon: Icon(icon, size: 20),
    label: Text(label),
  );
}

class _StarterScene extends StatelessWidget {
  const _StarterScene({required this.reducedMotion, this.height = 252});
  final bool reducedMotion;
  final double height;

  @override
  Widget build(BuildContext context) => ExcludeSemantics(
    child: Container(
      height: height,
      clipBehavior: Clip.hardEdge,
      decoration: BoxDecoration(
        color: const Color(0xFFE7EDDE),
        borderRadius: BorderRadius.circular(28),
      ),
      child: Stack(
        children: [
          const Positioned(
            top: 14,
            right: 22,
            child: AssetArt('cartoon-pack/sun.svg', size: 52),
          ),
          const Positioned(
            top: 18,
            left: 20,
            child: AssetArt('cartoon-pack/clouds.svg', size: 104),
          ),
          Positioned(
            bottom: 40,
            left: 10,
            child: AssetArt(
              'cartoon-pack/mountain-range.svg',
              size: height < 200 ? 150 : 204,
            ),
          ),
          const Positioned(
            bottom: 42,
            right: 12,
            child: AssetArt('cartoon-pack/pine-tree.svg', size: 116),
          ),
          Positioned(
            left: -4,
            right: -4,
            bottom: 12,
            child: Container(height: 54, color: pine),
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 37,
            child: LayoutBuilder(
              builder: (_, bounds) => Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: List.generate(
                  (bounds.maxWidth / 46).floor().clamp(1, 30).toInt(),
                  (_) => Container(
                    width: 21,
                    height: 2,
                    color: const Color(0xFFEEE4C7),
                  ),
                ),
              ),
            ),
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 26,
            child: F1Motion(reducedMotion: reducedMotion),
          ),
        ],
      ),
    ),
  );
}

/// Only this small leaf repaints for the starter animation.
class F1Motion extends StatefulWidget {
  const F1Motion({super.key, required this.reducedMotion});
  final bool reducedMotion;

  @override
  State<F1Motion> createState() => _F1MotionState();
}

class _F1MotionState extends State<F1Motion>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 5),
  );

  void _sync() {
    final disabled =
        widget.reducedMotion || MediaQuery.disableAnimationsOf(context);
    if (disabled) {
      _controller.stop();
      _controller.value = .48;
    } else if (!_controller.isAnimating) {
      _controller.repeat();
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _sync();
  }

  @override
  void didUpdateWidget(F1Motion oldWidget) {
    super.didUpdateWidget(oldWidget);
    _sync();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => RepaintBoundary(
    child: LayoutBuilder(
      builder: (context, bounds) => AnimatedBuilder(
        animation: _controller,
        child: SizedBox(
          width: 118,
          height: 50,
          child: SvgPicture.asset(
            '${artRoot}branding/f1-loading-car.svg',
            fit: BoxFit.contain,
          ),
        ),
        builder: (_, child) => Align(
          alignment: Alignment.centerLeft,
          child: Transform.translate(
            offset: Offset(
              -124 + (bounds.maxWidth + 248) * _controller.value,
              0,
            ),
            child: child,
          ),
        ),
      ),
    ),
  );
}

class RoadsScreen extends StatelessWidget {
  const RoadsScreen({super.key, required this.model});
  final AppModel model;

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: model,
    builder: (context, _) => MenuPage(
      title: 'Choose your road',
      subtitle:
          'A valley to learn, a jungle to get lost in, and a mountain to earn. Every road is open.',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          for (final road in roads) ...[
            _RoadRow(
              road: road,
              selected: model.selectedMap == road.id,
              onTap: () => unawaited(model.update(selectedMap: road.id)),
            ),
            const SizedBox(height: 12),
          ],
          const SizedBox(height: 8),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              FilledButton.icon(
                onPressed: () => _drive(context, model),
                icon: const Icon(Icons.sports_motorsports_outlined),
                label: Text('Drive ${roadFor(model.selectedMap).name}'),
              ),
              OutlinedButton(
                onPressed: () => _open(context, GarageScreen(model: model)),
                child: const Text('Choose a car'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Text(
            'Starting a new drive replaces your previous checkpoint after you reach a new gate.',
            style: TextStyle(fontSize: 12, color: muted),
          ),
        ],
      ),
    ),
  );
}

class _RoadRow extends StatelessWidget {
  const _RoadRow({
    required this.road,
    required this.selected,
    required this.onTap,
  });
  final RoadStory road;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Semantics(
    button: true,
    selected: selected,
    label: '${road.name}. ${road.tagline}',
    child: Material(
      color: selected ? const Color(0xFFE4EBDC) : paper,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(
          color: selected ? pine : rule,
          width: selected ? 2 : 1,
        ),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: LayoutBuilder(
            builder: (context, bounds) {
              final info = Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          road.name,
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                      ),
                      if (selected)
                        const Icon(Icons.check_circle, color: pine, size: 22),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(road.description),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 14,
                    runSpacing: 6,
                    children: road.facts
                        .map(
                          (fact) => Text(
                            fact,
                            style: const TextStyle(
                              fontSize: 12,
                              color: pine,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        )
                        .toList(),
                  ),
                ],
              );
              if (bounds.maxWidth < 440) {
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    AssetArt(road.art, size: 92),
                    const SizedBox(height: 10),
                    info,
                  ],
                );
              }
              return Row(
                children: [
                  AssetArt(road.art, size: 116),
                  const SizedBox(width: 22),
                  Expanded(child: info),
                ],
              );
            },
          ),
        ),
      ),
    ),
  );
}

class GarageScreen extends StatelessWidget {
  const GarageScreen({super.key, required this.model});
  final AppModel model;

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: model,
    builder: (context, _) => MenuPage(
      title: 'The garage',
      subtitle:
          'Two different moods. Pick the car that feels like your kind of trouble.',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _SelectionTile(
            title: 'McLaren MCL38',
            subtitle: 'THE FIRECRACKER',
            art: 'cartoon-pack/formula-racer.svg',
            description:
                'Quicker off the line, lighter through the bends. Use small steering inputs and leave room to brake.',
            selected: model.selectedCar == 'mclaren-mcl38',
            onTap: () => unawaited(model.update(selectedCar: 'mclaren-mcl38')),
          ),
          const SizedBox(height: 12),
          _SelectionTile(
            title: 'Mercedes-AMG W14',
            subtitle: 'THE MOUNTAIN ARROW',
            art: 'cartoon-pack/vehicle-badge.svg',
            description:
                'More planted through corners, with a longer stride on the straights. A calmer choice for the climb.',
            selected: model.selectedCar == 'mercedes-w14',
            onTap: () => unawaited(model.update(selectedCar: 'mercedes-w14')),
          ),
          const SizedBox(height: 24),
          Text('Make it yours', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          const Text(
            'Body paint changes the car colour. Its handling stays the same.',
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              for (var i = 0; i < AppModel.paintColors.length; i++)
                _PaintChoice(
                  hex: AppModel.paintColors[i],
                  name: const [
                    'Trail orange',
                    'Alpine sage',
                    'River blue',
                    'Butter yellow',
                    'Warm cream',
                    'Dark pine',
                  ][i],
                  selected: model.paint == AppModel.paintColors[i],
                  onTap: () =>
                      unawaited(model.update(paint: AppModel.paintColors[i])),
                ),
            ],
          ),
          const SizedBox(height: 24),
          Align(
            alignment: Alignment.centerLeft,
            child: FilledButton(
              onPressed: () => _open(context, RoadsScreen(model: model)),
              child: const Text('Pick a road'),
            ),
          ),
          const SizedBox(height: 18),
          const Text(
            'Car names identify the included community-made models. Windway is an independent, unofficial project.',
            style: TextStyle(fontSize: 12, color: muted),
          ),
        ],
      ),
    ),
  );
}

class _PaintChoice extends StatelessWidget {
  const _PaintChoice({
    required this.hex,
    required this.name,
    required this.selected,
    required this.onTap,
  });
  final String hex, name;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Semantics(
    label: name,
    selected: selected,
    button: true,
    child: Tooltip(
      message: name,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          width: 56,
          height: 56,
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: selected ? pine : rule,
              width: selected ? 2 : 1,
            ),
          ),
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: Color(int.parse(hex.substring(1), radix: 16) + 0xFF000000),
              borderRadius: BorderRadius.circular(8),
            ),
            child: selected
                ? Icon(
                    Icons.check_rounded,
                    color: hex == '#334c41' ? paper : pine,
                  )
                : null,
          ),
        ),
      ),
    ),
  );
}

class CharactersScreen extends StatelessWidget {
  const CharactersScreen({super.key, required this.model});
  final AppModel model;

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: model,
    builder: (context, _) => MenuPage(
      title: 'Your road crew',
      subtitle:
          'Choose the face beside your race messages. Everyone gets the same car physics; no hidden advantages.',
      child: Column(
        children: [
          for (final character in const [
            (
              'waqar',
              'WAQAR',
              'The curious one',
              'A new bend is a good reason to keep going. Likes the alpine road, but never quite takes the sensible line.',
              'jungle-pack/waqar.svg',
            ),
            (
              'imran',
              'IMRAN',
              'The calm navigator',
              'A little patience, a clean braking point, and one more lap. Keeps the crew focused when the canopy closes in.',
              'jungle-pack/imran.svg',
            ),
            (
              'tatheer',
              'TATHEER',
              'The bold explorer',
              'Sees a ramp and immediately has a plan. Reminds the crew that the best drive is not always the fastest one.',
              'jungle-pack/tatheer.svg',
            ),
            (
              'snowman',
              'SNOWY',
              'The summit regular',
              'Feels right at home above the snowline. Would recommend braking before the ice, not while you are on it.',
              'snow-pack/snowman.svg',
            ),
          ]) ...[
            _SelectionTile(
              title: character.$2,
              subtitle: character.$3.toUpperCase(),
              description: character.$4,
              art: character.$5,
              selected: model.selectedCharacter == character.$1,
              onTap: () =>
                  unawaited(model.update(selectedCharacter: character.$1)),
            ),
            const SizedBox(height: 12),
          ],
        ],
      ),
    ),
  );
}

class _SelectionTile extends StatelessWidget {
  const _SelectionTile({
    required this.title,
    required this.subtitle,
    required this.description,
    required this.art,
    required this.selected,
    required this.onTap,
  });
  final String title, subtitle, description, art;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Semantics(
    selected: selected,
    button: true,
    child: Material(
      color: selected ? const Color(0xFFE4EBDC) : paper,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: BorderSide(
          color: selected ? pine : rule,
          width: selected ? 2 : 1,
        ),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: LayoutBuilder(
            builder: (context, bounds) {
              final detail = Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Eyebrow(subtitle),
                  const SizedBox(height: 5),
                  Text(title, style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 6),
                  Text(description),
                  if (selected)
                    const Padding(
                      padding: EdgeInsets.only(top: 8),
                      child: Text(
                        'Selected',
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          color: pine,
                        ),
                      ),
                    ),
                ],
              );
              if (bounds.maxWidth < 390) {
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    AssetArt(art, size: 96),
                    const SizedBox(height: 12),
                    detail,
                  ],
                );
              }
              return Row(
                children: [
                  AssetArt(art, size: 106),
                  const SizedBox(width: 20),
                  Expanded(child: detail),
                ],
              );
            },
          ),
        ),
      ),
    ),
  );
}

class OptionsScreen extends StatelessWidget {
  const OptionsScreen({super.key, required this.model});
  final AppModel model;

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: model,
    builder: (context, _) => MenuPage(
      title: 'Settle into the driver’s seat',
      subtitle:
          'These settings stay on your phone. Start with Auto graphics and find the controls that feel natural.',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const _SectionTitle('01', 'Steering'),
          _Choices(
            label: 'Control style',
            value: model.steeringMode,
            choices: const {
              'arrows': 'Arrows',
              'wheel': 'Steering wheel',
              'tilt': 'Phone tilt',
            },
            onChanged: (v) => unawaited(model.update(steeringMode: v)),
          ),
          const SizedBox(height: 12),
          Text(switch (model.steeringMode) {
            'wheel' =>
              'Drag the wheel left or right. Release it to return toward the centre. Throttle and brake stay on the right.',
            'tilt' =>
              'Hold the phone in landscape. Gently roll it left or right like a steering wheel. Do not shake, bend or stretch the phone.',
            _ =>
              'Hold the left or right arrow to steer. Short taps help at speed; throttle and brake stay on the right.',
          }),
          const SizedBox(height: 12),
          Text(
            'Wheel & tilt sensitivity · ${model.sensitivity.toStringAsFixed(2)}×',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          Slider(
            value: model.sensitivity,
            min: .5,
            max: 1.5,
            divisions: 20,
            semanticFormatterCallback: (v) => '${v.toStringAsFixed(2)} times',
            onChanged: (v) => unawaited(model.update(sensitivity: v)),
          ),
          const Text(
            'Lower is calmer. Higher turns in sooner. The centre dead zone helps prevent accidental tilt steering.',
          ),
          if (model.steeringMode == 'tilt') ...[
            SwitchListTile.adaptive(
              contentPadding: EdgeInsets.zero,
              title: const Text('Invert tilt direction'),
              subtitle: const Text(
                'Swap left and right only if that feels more comfortable.',
              ),
              value: model.invertTilt,
              onChanged: (v) => unawaited(model.update(invertTilt: v)),
            ),
            const _Note(
              icon: Icons.screen_rotation_rounded,
              title: 'Calibrate before you move',
              text:
                  'In the game, hold the phone comfortably and tap Centre tilt while stationary. Repeat if you change your grip. Arrows remain available as a fallback if the sensor is unavailable.',
            ),
          ],
          const Divider(),
          const _SectionTitle('02', 'Your view'),
          _Choices(
            label: 'Camera',
            value: model.cameraMode,
            choices: const {'chase': 'Chase', 'hood': 'Hood'},
            onChanged: (v) => unawaited(model.update(cameraMode: v)),
          ),
          const SizedBox(height: 8),
          const Text(
            'Chase shows the car and road edges. Hood brings the road closer. You can switch from the pause menu too.',
          ),
          const Divider(),
          const _SectionTitle('03', 'Keep it smooth'),
          _Choices(
            label: 'Graphics quality',
            value: model.quality,
            choices: const {'low': 'Low', 'auto': 'Auto', 'high': 'High'},
            onChanged: (v) => unawaited(model.update(quality: v)),
          ),
          const SizedBox(height: 8),
          const Text(
            'Auto balances detail and screen resolution. Low reduces rendering cost for slower or warm phones. High asks more of the battery and graphics hardware.',
          ),
          SwitchListTile.adaptive(
            contentPadding: EdgeInsets.zero,
            title: const Text('Extra visual effects'),
            subtitle: const Text(
              'Optional particles and extra decoration. Off is the lighter setting.',
            ),
            value: model.effects,
            onChanged: (v) => unawaited(model.update(effects: v)),
          ),
          SwitchListTile.adaptive(
            contentPadding: EdgeInsets.zero,
            title: const Text('Reduce motion'),
            subtitle: const Text(
              'Stops menu animation and reduces decorative motion. System accessibility settings are respected too.',
            ),
            value: model.reducedMotion,
            onChanged: (v) => unawaited(model.update(reducedMotion: v)),
          ),
          const Divider(),
          const _SectionTitle('04', 'The engine note'),
          Text(
            'Sound · ${(model.sound * 100).round()}%',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          Slider(
            value: model.sound,
            min: 0,
            max: 1,
            divisions: 20,
            semanticFormatterCallback: (v) => '${(v * 100).round()} percent',
            onChanged: (v) => unawaited(model.update(sound: v)),
          ),
          const Text(
            'Set to zero for a quiet drive. Keep the volume low enough to stay aware of your surroundings.',
          ),
          if (model.storageWarning != null) ...[
            const SizedBox(height: 16),
            Text(model.storageWarning!),
          ],
        ],
      ),
    ),
  );
}

class _Choices extends StatelessWidget {
  const _Choices({
    required this.label,
    required this.value,
    required this.choices,
    required this.onChanged,
  });
  final String label, value;
  final Map<String, String> choices;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(label, style: Theme.of(context).textTheme.titleMedium),
      const SizedBox(height: 10),
      Wrap(
        spacing: 8,
        runSpacing: 8,
        children: choices.entries
            .map(
              (choice) => ChoiceChip(
                label: Text(choice.value),
                selected: value == choice.key,
                materialTapTargetSize: MaterialTapTargetSize.padded,
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 12,
                ),
                onSelected: (_) => onChanged(choice.key),
              ),
            )
            .toList(),
      ),
    ],
  );
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.number, this.title);
  final String number, title;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 18),
    child: Row(
      children: [
        Text(
          number,
          style: const TextStyle(
            color: muted,
            fontSize: 12,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(title, style: Theme.of(context).textTheme.titleLarge),
        ),
      ],
    ),
  );
}

class HowToPlayScreen extends StatelessWidget {
  const HowToPlayScreen({super.key, required this.model});
  final AppModel model;

  @override
  Widget build(BuildContext context) => MenuPage(
    title: 'A good drive starts here',
    subtitle:
        'No opponents to unlock. No upgrades to grind. Follow the gates, learn the corners, and bring the car home.',
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const _GuideStep(
          '01',
          'Take your seat',
          'Choose a road, a car and a member of the crew. Select arrows, a drag-to-turn wheel or phone tilt in Options. Play in landscape with both hands on the phone.',
          'cartoon-pack/steering-wheel.svg',
        ),
        const _GuideStep(
          '02',
          'Feet on the right',
          'Hold GO to accelerate. Release it to ease off. Hold BRAKE before a corner, then turn in gently. You do not need to hold full throttle all the time.',
          'cartoon-pack/pedal-controls.svg',
        ),
        const _GuideStep(
          '03',
          'Follow the next gate',
          'The tiny roadmap stays in the left corner. Speed and race information stay at the right edge. Cross checkpoints in order; a shortcut cannot skip the route.',
          'cartoon-pack/checkpoint.svg',
        ),
        const _GuideStep(
          '04',
          'Give the ramp a clean run',
          'Alpine Valley and Canopy Run have on-road boost ramps. Approach straight, keep the car settled, and let the boost carry you through the short jump.',
          'jungle-pack/boost-ramp.svg',
        ),
        const _GuideStep(
          '05',
          'Ice needs patience',
          'Frostbite Ascent is a long climb, not a circuit. Slow down before shiny ice, weave through the snow hurdles and aim for the flag at the summit. There are no boost ramps on this road.',
          'snow-pack/ice-warning.svg',
        ),
        const _GuideStep(
          '06',
          'A mistake is a new try',
          'If the car leaves the road, recovery returns you to a checkpoint. Use Reset if you are stuck. Pause before putting the phone down; Continue returns to your saved gate, not an exact mid-air position.',
          'cartoon-pack/restart-button.svg',
        ),
        const _GuideStep(
          '07',
          'Make the phone comfortable',
          'Try Low graphics if the phone feels warm or the frame rate drops. Turn off extra effects first. Pause to change camera or centre the tilt sensor when your grip changes.',
          'cartoon-pack/camera-button.svg',
        ),
        const SizedBox(height: 8),
        const _Note(
          icon: Icons.info_outline_rounded,
          title: 'A note about saves',
          text:
              'Preferences and checkpoint progress stay on this device. Reinstalling or clearing app storage can remove them. There is no cloud account or cross-device sync.',
        ),
        const SizedBox(height: 22),
        Align(
          alignment: Alignment.centerLeft,
          child: FilledButton.icon(
            onPressed: () => _open(context, RoadsScreen(model: model)),
            icon: const Icon(Icons.arrow_forward_rounded),
            label: const Text('Find my road'),
          ),
        ),
        const SizedBox(height: 12),
        Align(
          alignment: Alignment.centerLeft,
          child: TextButton.icon(
            icon: const Icon(Icons.info_outline_rounded),
            label: const Text('About & model licenses'),
            onPressed: () => showAboutDialog(
              context: context,
              applicationName: 'Windway',
              applicationVersion: 'Android demo 1.0.0',
              applicationLegalese:
                  'An independent, non-commercial learning project by Waqar Ahmed.',
              children: const [
                Text(
                  'Car artwork by MattsActuallyUsefulModels, licensed CC BY-NC-SA 4.0. View licenses for source links, attribution and changes.',
                ),
                SizedBox(height: 12),
                SelectableText('github.com/Waqar-743/WindWay'),
              ],
            ),
          ),
        ),
      ],
    ),
  );
}

class _GuideStep extends StatelessWidget {
  const _GuideStep(this.number, this.title, this.text, this.art);
  final String number, title, text, art;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 24),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AssetArt(art, size: 64),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Eyebrow('FIELD NOTE $number'),
              const SizedBox(height: 4),
              Text(title, style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 6),
              Text(text),
            ],
          ),
        ),
      ],
    ),
  );
}

class _Note extends StatelessWidget {
  const _Note({required this.icon, required this.title, required this.text});
  final IconData icon;
  final String title, text;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: const Color(0xFFE4EBDC),
      borderRadius: BorderRadius.circular(14),
    ),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: pine, size: 22),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 6),
              Text(text),
            ],
          ),
        ),
      ],
    ),
  );
}

class Eyebrow extends StatelessWidget {
  const Eyebrow(this.text, {super.key});
  final String text;
  @override
  Widget build(BuildContext context) => Text(
    text,
    style: const TextStyle(
      fontSize: 10,
      height: 1.4,
      letterSpacing: 1.5,
      fontWeight: FontWeight.w800,
      color: muted,
    ),
  );
}
