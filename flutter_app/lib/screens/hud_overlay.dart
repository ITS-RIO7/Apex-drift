import 'package:flutter/material.dart';
import '../models/car.dart';
import '../models/map_data.dart';
import '../physics/drift_physics.dart';
import '../render/car_3d_renderer.dart';

class HudOverlay extends StatelessWidget {
  final VehiclePhysics physics;
  final CarSpecs car;
  final MapData map;
  final CameraViewMode cameraMode;
  final VoidCallback onCycleCamera;
  final VoidCallback onOpenGarage;
  final VoidCallback onOpenMapSelector;
  final VoidCallback onResetCar;
  final VoidCallback onPause;
  final Function(double) onThrottleChanged;
  final Function(double) onBrakeChanged;
  final Function(double) onSteerChanged;
  final Function(bool) onHandbrakeChanged;
  final Function(bool) onNitrousChanged;

  const HudOverlay({
    super.key,
    required this.physics,
    required this.car,
    required this.map,
    required this.cameraMode,
    required this.onCycleCamera,
    required this.onOpenGarage,
    required this.onOpenMapSelector,
    required this.onResetCar,
    required this.onPause,
    required this.onThrottleChanged,
    required this.onBrakeChanged,
    required this.onSteerChanged,
    required this.onHandbrakeChanged,
    required this.onNitrousChanged,
  });

  @override
  Widget build(BuildContext context) {
    final ds = physics.driftState;

    return Stack(
      children: [
        // 1. TOP HEADER: Car & Map Info + Cash / Score
        Positioned(
          top: 16,
          left: 16,
          right: 16,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Car & Map
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xDD090D16),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0x4406B6D4)),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        color: Color(0xFF06B6D4),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          car.name.toUpperCase(),
                          style: const TextStyle(
                            color: Color(0xFF38BDF8),
                            fontWeight: FontWeight.w900,
                            fontSize: 12,
                          ),
                        ),
                        Text(
                          '${map.name} · ${cameraMode.name.toUpperCase()}',
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Total Score & Cash
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xDD090D16),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0x44F59E0B)),
                    ),
                    child: Text(
                      '\$${ds.cashEarned}',
                      style: const TextStyle(
                        color: Color(0xFFFBBF24),
                        fontWeight: FontWeight.w900,
                        fontSize: 13,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xDD090D16),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0x4410B981)),
                    ),
                    child: Text(
                      '${ds.totalScore} PTS',
                      style: const TextStyle(
                        color: Color(0xFF34D399),
                        fontWeight: FontWeight.w900,
                        fontSize: 13,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    onPressed: onPause,
                    icon: const Icon(Icons.pause, color: Colors.white),
                    style: IconButton.styleFrom(
                      backgroundColor: const Color(0xDD090D16),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        // 2. DRIFT COMBO & SCORE CALLOUT (Center Top)
        if (ds.isDrifting || ds.currentScore > 0 || ds.ratingFade > 0)
          Positioned(
            top: 75,
            left: 0,
            right: 0,
            child: Column(
              children: [
                if (ds.lastRatingText.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 3),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF0284C7), Color(0xFF2563EB)],
                      ),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: Colors.white24),
                    ),
                    child: Text(
                      ds.lastRatingText,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontStyle: FontStyle.italic,
                        fontSize: 13,
                        letterSpacing: 1.2,
                      ),
                    ),
                  ),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xEE050814),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFF06B6D4), width: 2),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.local_fire_department, color: Colors.orange, size: 28),
                      const SizedBox(width: 10),
                      Column(
                        children: [
                          const Text(
                            'DRIFT SCORE',
                            style: TextStyle(
                              color: Color(0xFF38BDF8),
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1.5,
                            ),
                          ),
                          Text(
                            ds.currentScore.floor().toString(),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 32,
                              fontWeight: FontWeight.w900,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(width: 14),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFF06B6D4),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          '${ds.multiplier.toStringAsFixed(1)}x',
                          style: const TextStyle(
                            color: Colors.black,
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'ANGLE: ${ds.angle.floor()}°  ·  SPEED: ${ds.speed} KM/H',
                  style: const TextStyle(
                    color: Colors.white70,
                    fontWeight: FontWeight.bold,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),

        // 3. BOTTOM-RIGHT SPEEDOMETER CLUSTER
        Positioned(
          bottom: 24,
          right: 20,
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xEE090D16),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.white10,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        'GEAR ${physics.gear}',
                        style: const TextStyle(
                          color: Color(0xFF06B6D4),
                          fontWeight: FontWeight.w900,
                          fontSize: 11,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'RPM',
                      style: TextStyle(
                        color: Colors.white38,
                        fontWeight: FontWeight.bold,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Text(
                      '${physics.speedKmh}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 48,
                        fontWeight: FontWeight.w900,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Text(
                      'KM/H',
                      style: TextStyle(
                        color: Colors.white54,
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                // RPM gauge bar
                Container(
                  width: 120,
                  height: 6,
                  decoration: BoxDecoration(
                    color: Colors.white10,
                    borderRadius: BorderRadius.circular(3),
                  ),
                  child: FractionallySizedBox(
                    alignment: Alignment.centerLeft,
                    widthFactor: ((physics.rpm - 800) / 7200).clamp(0.0, 1.0),
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF06B6D4), Color(0xFFEF4444)],
                        ),
                        borderRadius: BorderRadius.circular(3),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),

        // 4. ON-SCREEN TOUCH CONTROLS (Steering & Pedals)
        // Steer Left / Right
        Positioned(
          bottom: 24,
          left: 20,
          child: Row(
            children: [
              GestureDetector(
                onTapDown: (_) => onSteerChanged(-1.0),
                onTapUp: (_) => onSteerChanged(0.0),
                onTapCancel: () => onSteerChanged(0.0),
                child: Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: const Color(0xDD0F172A),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.white24),
                  ),
                  child: const Icon(Icons.arrow_back, color: Colors.white, size: 28),
                ),
              ),
              const SizedBox(width: 12),
              GestureDetector(
                onTapDown: (_) => onSteerChanged(1.0),
                onTapUp: (_) => onSteerChanged(0.0),
                onTapCancel: () => onSteerChanged(0.0),
                child: Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: const Color(0xDD0F172A),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.white24),
                  ),
                  child: const Icon(Icons.arrow_forward, color: Colors.white, size: 28),
                ),
              ),
            ],
          ),
        ),

        // Drift Handbrake & Throttle / Brake
        Positioned(
          bottom: 24,
          right: 210,
          child: Row(
            children: [
              // Handbrake
              GestureDetector(
                onTapDown: (_) => onHandbrakeChanged(true),
                onTapUp: (_) => onHandbrakeChanged(false),
                onTapCancel: () => onHandbrakeChanged(false),
                child: Container(
                  width: 65,
                  height: 60,
                  decoration: BoxDecoration(
                    color: const Color(0xDD881337),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.roseAccent),
                  ),
                  child: const Center(
                    child: Text(
                      'DRIFT',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              // Throttle
              GestureDetector(
                onTapDown: (_) => onThrottleChanged(1.0),
                onTapUp: (_) => onThrottleChanged(0.0),
                onTapCancel: () => onThrottleChanged(0.0),
                child: Container(
                  width: 65,
                  height: 60,
                  decoration: BoxDecoration(
                    color: const Color(0xDD065F46),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.emeraldAccent),
                  ),
                  child: const Center(
                    child: Text(
                      'GAS',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              // Brake
              GestureDetector(
                onTapDown: (_) => onBrakeChanged(1.0),
                onTapUp: (_) => onBrakeChanged(0.0),
                onTapCancel: () => onBrakeChanged(0.0),
                child: Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: const Color(0xDD1E293B),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.white24),
                  ),
                  child: const Center(
                    child: Text(
                      'REV',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),

        // 5. QUICK ACTIONS DOCK (Center Bottom)
        Positioned(
          bottom: 24,
          left: 170,
          child: Row(
            children: [
              IconButton(
                onPressed: onCycleCamera,
                icon: const Icon(Icons.camera_alt, color: Colors.cyanAccent),
                style: IconButton.styleFrom(
                  backgroundColor: const Color(0xDD0F172A),
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                onPressed: onResetCar,
                icon: const Icon(Icons.refresh, color: Colors.white),
                style: IconButton.styleFrom(
                  backgroundColor: const Color(0xDD0F172A),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
