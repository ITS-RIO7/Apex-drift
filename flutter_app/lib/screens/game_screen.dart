import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:vector_math/vector_math_64.dart' hide Colors;
import '../models/car.dart';
import '../models/map_data.dart';
import '../physics/drift_physics.dart';
import '../render/car_3d_renderer.dart';
import 'hud_overlay.dart';
import 'garage_screen.dart';
import 'map_selector_screen.dart';

class GameScreen extends StatefulWidget {
  final CarId initialCarId;
  final MapId initialMapId;
  final VoidCallback onReturnToTitle;

  const GameScreen({
    super.key,
    required this.initialCarId,
    required this.initialMapId,
    required this.onReturnToTitle,
  });

  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> with SingleTickerProviderStateMixin {
  late AnimationController _gameLoop;
  final VehiclePhysics _physics = VehiclePhysics();
  final VehicleInputs _inputs = VehicleInputs();

  late CarId _currentCarId;
  late MapId _currentMapId;
  late CarCustomization _customization;
  CameraViewMode _cameraMode = CameraViewMode.chase;

  final List<Particle3D> _particles = [];
  final List<ClippingPoint> _clippingPoints = [];
  DateTime _lastTime = DateTime.now();
  bool _isPaused = false;

  final Set<LogicalKeyboardKey> _pressedKeys = {};

  @override
  void initState() {
    super.initState();
    _currentCarId = widget.initialCarId;
    _currentMapId = widget.initialMapId;

    final initialSpecs = carCatalog[_currentCarId]!;
    _customization = CarCustomization(
      bodyColor: initialSpecs.defaultColor,
      rimColor: initialSpecs.defaultRimColor,
    );

    _initClippingPoints();

    _gameLoop = AnimationController(
      vsync: this,
      duration: const Duration(days: 365),
    )..addListener(_onTick);
    _gameLoop.forward();

    HardwareKeyboard.instance.addHandler(_handleKeyEvent);
  }

  @override
  void dispose() {
    HardwareKeyboard.instance.removeHandler(_handleKeyEvent);
    _gameLoop.dispose();
    super.dispose();
  }

  void _initClippingPoints() {
    _clippingPoints.clear();
    final points = [
      ClippingPoint(id: 1, x: -30, y: 0.5, z: 40, radius: 8, points: 1500),
      ClippingPoint(id: 2, x: 30, y: 0.5, z: 90, radius: 8, points: 1800),
      ClippingPoint(id: 3, x: -40, y: 0.5, z: 140, radius: 9, points: 2000),
      ClippingPoint(id: 4, x: 45, y: 0.5, z: -40, radius: 8, points: 1600),
    ];
    _clippingPoints.addAll(points);
  }

  bool _handleKeyEvent(KeyEvent event) {
    if (event is KeyDownEvent) {
      _pressedKeys.add(event.logicalKey);
      if (event.logicalKey == LogicalKeyboardKey.keyC) {
        _cycleCamera();
      }
      if (event.logicalKey == LogicalKeyboardKey.keyR) {
        _resetCar();
      }
      if (event.logicalKey == LogicalKeyboardKey.escape) {
        setState(() => _isPaused = !_isPaused);
      }
    } else if (event is KeyUpEvent) {
      _pressedKeys.remove(event.logicalKey);
    }
    return false;
  }

  void _updateKeyboardInputs() {
    final w = _pressedKeys.contains(LogicalKeyboardKey.keyW) || _pressedKeys.contains(LogicalKeyboardKey.arrowUp);
    final s = _pressedKeys.contains(LogicalKeyboardKey.keyS) || _pressedKeys.contains(LogicalKeyboardKey.arrowDown);
    final a = _pressedKeys.contains(LogicalKeyboardKey.keyA) || _pressedKeys.contains(LogicalKeyboardKey.arrowLeft);
    final d = _pressedKeys.contains(LogicalKeyboardKey.keyD) || _pressedKeys.contains(LogicalKeyboardKey.arrowRight);
    final space = _pressedKeys.contains(LogicalKeyboardKey.space);
    final shift = _pressedKeys.contains(LogicalKeyboardKey.shiftLeft) || _pressedKeys.contains(LogicalKeyboardKey.shiftRight);

    if (w) _inputs.throttle = 1.0;
    if (s) _inputs.brake = 1.0;
    if (a) _inputs.steer = -1.0;
    if (d) _inputs.steer = 1.0;
    if (space) _inputs.handbrake = true;
    if (shift) _inputs.nitrous = true;
  }

  void _onTick() {
    if (_isPaused) return;

    final now = DateTime.now();
    final dt = math.min(0.05, now.difference(_lastTime).inMicroseconds / 1000000.0);
    _lastTime = now;

    _updateKeyboardInputs();

    final specs = carCatalog[_currentCarId]!;
    final map = mapCatalog[_currentMapId]!;

    // Update Physics
    _physics.update(
      dt,
      _inputs,
      specs,
      _customization,
      map.surfaceGrip,
      _clippingPoints,
    );

    // Emit smoke particles on drift
    if (_physics.lateralSlipSpeed > 2.0 && _physics.speedKmh > 10) {
      final forward = Vector3(math.sin(_physics.rotationY), 0, math.cos(_physics.rotationY));
      final right = Vector3(forward.z, 0, -forward.x);

      final pPos = _physics.position + (right * (math.Random().nextBool() ? -0.8 : 0.8)) - (forward * 1.2);
      if (_particles.length < 150) {
        _particles.add(Particle3D(
          position: pPos,
          velocity: Vector3((math.Random().nextDouble() - 0.5) * 1.5, 0.8 + math.Random().nextDouble(), (math.Random().nextDouble() - 0.5) * 1.5),
          life: 0,
          maxLife: 0.8 + math.Random().nextDouble() * 0.5,
          size: 1.0 + math.Random().nextDouble() * 1.5,
          color: _customization.smokeColor,
        ));
      }
    }

    // Update particles
    for (int i = _particles.length - 1; i >= 0; i--) {
      final p = _particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        _particles.removeAt(i);
      } else {
        p.position.add(p.velocity * dt);
        p.size += dt * 3.0;
      }
    }

    setState(() {});
  }

  void _cycleCamera() {
    setState(() {
      const modes = CameraViewMode.values;
      _cameraMode = modes[(_cameraMode.index + 1) % modes.length];
    });
  }

  void _resetCar() {
    _physics.setSpawn(0, 0.35, 0, 0);
  }

  @override
  Widget build(BuildContext context) {
    final specs = carCatalog[_currentCarId]!;
    final map = mapCatalog[_currentMapId]!;

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // 3D Canvas
          CustomPaint(
            size: Size.infinite,
            painter: Car3DRenderer(
              physics: _physics,
              carSpecs: specs,
              customization: _customization,
              mapData: map,
              cameraMode: _cameraMode,
              particles: _particles,
              clippingPoints: _clippingPoints,
            ),
          ),

          // HUD Overlay
          HudOverlay(
            physics: _physics,
            car: specs,
            map: map,
            cameraMode: _cameraMode,
            onCycleCamera: _cycleCamera,
            onOpenGarage: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => GarageScreen(
                    currentCarId: _currentCarId,
                    customization: _customization,
                    onSelectCar: (cId) => setState(() => _currentCarId = cId),
                    onUpdateCustomization: (c) => setState(() => _customization = c),
                  ),
                ),
              );
            },
            onOpenMapSelector: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => MapSelectorScreen(
                    currentMapId: _currentMapId,
                    onSelectMap: (mId) {
                      setState(() {
                        _currentMapId = mId;
                        _resetCar();
                      });
                    },
                  ),
                ),
              );
            },
            onResetCar: _resetCar,
            onPause: () => setState(() => _isPaused = !_isPaused),
            onThrottleChanged: (v) => _inputs.throttle = v,
            onBrakeChanged: (v) => _inputs.brake = v,
            onSteerChanged: (v) => _inputs.steer = v,
            onHandbrakeChanged: (v) => _inputs.handbrake = v,
            onNitrousChanged: (v) => _inputs.nitrous = v,
          ),

          // Pause Menu Dialog
          if (_isPaused)
            Container(
              color: const Color(0xDD000000),
              child: Center(
                child: Container(
                  width: 320,
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F172A),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFF06B6D4)),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        'GAME PAUSED',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                      const SizedBox(height: 20),
                      ElevatedButton(
                        onPressed: () => setState(() => _isPaused = false),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF06B6D4),
                          foregroundColor: Colors.black,
                          minimumSize: const Size.fromHeight(44),
                        ),
                        child: const Text('RESUME DRIFT'),
                      ),
                      const SizedBox(height: 10),
                      OutlinedButton(
                        onPressed: () {
                          _resetCar();
                          setState(() => _isPaused = false);
                        },
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.white,
                          minimumSize: const Size.fromHeight(44),
                        ),
                        child: const Text('RESTART TRACK'),
                      ),
                      const SizedBox(height: 10),
                      TextButton(
                        onPressed: widget.onReturnToTitle,
                        child: const Text('RETURN TO TITLE', style: TextStyle(color: Colors.white60)),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
