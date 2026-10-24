import 'package:flutter/material.dart';
import '../models/car.dart';
import '../models/map_data.dart';

class TitleScreen extends StatelessWidget {
  final CarId currentCarId;
  final MapId currentMapId;
  final VoidCallback onStartGame;
  final VoidCallback onOpenGarage;
  final VoidCallback onOpenMapSelector;

  const TitleScreen({
    super.key,
    required this.currentCarId,
    required this.currentMapId,
    required this.onStartGame,
    required this.onOpenGarage,
    required this.onOpenMapSelector,
  });

  @override
  Widget build(BuildContext context) {
    final car = carCatalog[currentCarId]!;
    final map = mapCatalog[currentMapId]!;

    return Scaffold(
      backgroundColor: const Color(0xFF050814),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Top Bar
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 10,
                        height: 10,
                        decoration: const BoxDecoration(
                          color: Color(0xFF06B6D4),
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        'APEX DRIFT 3D MOTORSPORT',
                        style: TextStyle(
                          color: Color(0xFF38BDF8),
                          fontWeight: FontWeight.w900,
                          fontSize: 12,
                          letterSpacing: 1.2,
                        ),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      IconButton(
                        onPressed: onOpenGarage,
                        icon: const Icon(Icons.build, color: Colors.cyanAccent),
                      ),
                      IconButton(
                        onPressed: onOpenMapSelector,
                        icon: const Icon(Icons.map, color: Colors.cyanAccent),
                      ),
                    ],
                  ),
                ],
              ),

              // Title Lockup Center
              Column(
                children: [
                  // M-Sport tri-color bars
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(width: 28, height: 6, color: const Color(0xFF0066B1)),
                      Container(width: 28, height: 6, color: const Color(0xFF001E4A)),
                      Container(width: 28, height: 6, color: const Color(0xFFE21A22)),
                    ],
                  ),
                  const SizedBox(height: 14),
                  const Text(
                    'APEX DRIFT 3D',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 44,
                      fontWeight: FontWeight.w900,
                      fontStyle: FontStyle.italic,
                      letterSpacing: -1.0,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Precision Bavarian Drift & Open World Experience',
                    style: TextStyle(
                      color: Colors.white70,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 36),
                  ElevatedButton(
                    onPressed: onStartGame,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF06B6D4),
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(horizontal: 42, vertical: 18),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                      ),
                      elevation: 12,
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.play_arrow, size: 28),
                        SizedBox(width: 8),
                        Text(
                          'START DRIFTING',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              // Bottom Info Line
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${car.name} · ${map.name}',
                    style: const TextStyle(color: Colors.white60, fontSize: 12),
                  ),
                  const Text(
                    'Full Flutter Dart Engine',
                    style: TextStyle(color: Color(0xFF06B6D4), fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
