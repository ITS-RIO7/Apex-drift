import 'package:flutter/material.dart';

enum MapId {
  city,
  touge,
  docklands,
  circuit,
}

enum MapDifficulty {
  beginner,
  intermediate,
  expert,
  pro,
}

class MapData {
  final MapId id;
  final String name;
  final String subtitle;
  final String description;
  final MapDifficulty difficulty;
  final double surfaceGrip;
  final Color skyColor;
  final Color fogColor;
  final int driftTargetScore;

  const MapData({
    required this.id,
    required this.name,
    required this.subtitle,
    required this.description,
    required this.difficulty,
    required this.surfaceGrip,
    required this.skyColor,
    required this.fogColor,
    required this.driftTargetScore,
  });
}

class ClippingPoint {
  final int id;
  final double x;
  final double y;
  final double z;
  final double radius;
  final int points;
  bool active;
  bool hit;

  ClippingPoint({
    required this.id,
    required this.x,
    required this.y,
    required this.z,
    required this.radius,
    required this.points,
    this.active = true,
    this.hit = false,
  });
}

const Map<MapId, MapData> mapCatalog = {
  MapId.city: MapData(
    id: MapId.city,
    name: 'Night Cyber Metropolis',
    subtitle: 'Open World City & Highway Grid',
    description: 'Neon skyscrapers, wide 4-way intersections for donut drifts, billboard arches, and ramp jumps under glowing streetlights.',
    difficulty: MapDifficulty.intermediate,
    surfaceGrip: 1.0,
    skyColor: Color(0xFF050814),
    fogColor: Color(0xFF090E24),
    driftTargetScore: 25000,
  ),
  MapId.touge: MapData(
    id: MapId.touge,
    name: 'Akina Mountain Touge',
    subtitle: 'Downhill Switchbacks & Hairpins',
    description: 'Famous mountain pass with tight hairpins, elevation drops, guardrails, and cherry trees. Requires precise steering and throttle feathering.',
    difficulty: MapDifficulty.pro,
    surfaceGrip: 0.92,
    skyColor: Color(0xFF1E1B4B),
    fogColor: Color(0xFF171439),
    driftTargetScore: 40000,
  ),
  MapId.docklands: MapData(
    id: MapId.docklands,
    name: 'Port Docklands Arena',
    subtitle: 'Industrial Skidpad & Obstacle Maze',
    description: 'Massive open concrete pad with stacked shipping containers, cargo gantry cranes, container chicanes, and high-flying stunt ramps.',
    difficulty: MapDifficulty.beginner,
    surfaceGrip: 1.08,
    skyColor: Color(0xFF0F172A),
    fogColor: Color(0xFF1E293B),
    driftTargetScore: 30000,
  ),
  MapId.circuit: MapData(
    id: MapId.circuit,
    name: 'Apex Grand Prix Circuit',
    subtitle: 'High-Speed Sweepers & Grandstands',
    description: 'Professional drift competition track with alternating kerbs, high-speed clipping zones, grandstands, and huge run-off areas.',
    difficulty: MapDifficulty.expert,
    surfaceGrip: 1.05,
    skyColor: Color(0xFF0C1A2E),
    fogColor: Color(0xFF13233C),
    driftTargetScore: 35000,
  ),
};
