import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:vector_math/vector_math_64.dart' hide Colors;
import '../models/car.dart';
import '../models/map_data.dart';
import '../physics/drift_physics.dart';

enum CameraViewMode {
  chase,
  close,
  hood,
  orbit,
}

class Particle3D {
  Vector3 position;
  Vector3 velocity;
  double life;
  double maxLife;
  double size;
  Color color;

  Particle3D({
    required this.position,
    required this.velocity,
    required this.life,
    required this.maxLife,
    required this.size,
    required this.color,
  });
}

class Car3DRenderer extends CustomPainter {
  final VehiclePhysics physics;
  final CarSpecs carSpecs;
  final CarCustomization customization;
  final MapData mapData;
  final CameraViewMode cameraMode;
  final List<Particle3D> particles;
  final List<ClippingPoint> clippingPoints;

  Car3DRenderer({
    required this.physics,
    required this.carSpecs,
    required this.customization,
    required this.mapData,
    required this.cameraMode,
    required this.particles,
    required this.clippingPoints,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2.0;
    final cy = size.height / 2.0;

    // 1. Setup Camera
    final carPos = physics.position;
    final carHeading = physics.rotationY;

    Vector3 camPos;
    Vector3 camLook;

    switch (cameraMode) {
      case CameraViewMode.chase:
        final driftSway = (-physics.slipAngleDeg * 0.012).clamp(-0.5, 0.5);
        final camH = carHeading + driftSway;
        camPos = Vector3(
          carPos.x - math.sin(camH) * 7.5,
          carPos.y + 2.6,
          carPos.z - math.cos(camH) * 7.5,
        );
        camLook = Vector3(
          carPos.x + math.sin(carHeading) * 3.5,
          carPos.y + 1.1,
          carPos.z + math.cos(carHeading) * 3.5,
        );
        break;

      case CameraViewMode.close:
        camPos = Vector3(
          carPos.x - math.sin(carHeading) * 5.2,
          carPos.y + 1.9,
          carPos.z - math.cos(carHeading) * 5.2,
        );
        camLook = Vector3(carPos.x, carPos.y + 0.9, carPos.z);
        break;

      case CameraViewMode.hood:
        camPos = Vector3(
          carPos.x + math.sin(carHeading) * 0.8,
          carPos.y + 0.95,
          carPos.z + math.cos(carHeading) * 0.8,
        );
        camLook = Vector3(
          carPos.x + math.sin(carHeading) * 15.0,
          carPos.y + 0.9,
          carPos.z + math.cos(carHeading) * 15.0,
        );
        break;

      case CameraViewMode.orbit:
        camPos = Vector3(
          carPos.x - math.sin(carHeading + 0.8) * 8.0,
          carPos.y + 3.2,
          carPos.z - math.cos(carHeading + 0.8) * 8.0,
        );
        camLook = Vector3(carPos.x, carPos.y + 0.8, carPos.z);
        break;
    }

    final viewMatrix = makeViewMatrix(camPos, camLook, Vector3(0, 1, 0));
    final fov = (65.0 * math.pi) / 180.0;
    final aspect = size.width / size.height;
    final projMatrix = makePerspectiveMatrix(fov, aspect, 0.2, 500.0);
    final viewProj = projMatrix * viewMatrix;

    // Helper: Project 3D vector to screen point
    Offset? projectToScreen(Vector3 v) {
      final v4 = Vector4(v.x, v.y, v.z, 1.0);
      viewProj.transform(v4);
      if (v4.w <= 0.1) return null;
      final ndcX = v4.x / v4.w;
      final ndcY = v4.y / v4.w;
      if (ndcX < -2.0 || ndcX > 2.0 || ndcY < -2.0 || ndcY > 2.0) return null;
      return Offset(
        (ndcX + 1.0) * 0.5 * size.width,
        (1.0 - ndcY) * 0.5 * size.height,
      );
    }

    // 2. Background Sky Gradient
    final skyPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          mapData.skyColor,
          mapData.fogColor,
        ],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), skyPaint);

    // 3. Draw Ground Grid & Road Plane
    final gridPaint = Paint()
      ..color = const Color(0x2238BDF8)
      ..strokeWidth = 1.0;

    const gridExtent = 180.0;
    const gridStep = 10.0;
    final startX = (carPos.x / gridStep).floor() * gridStep - gridExtent;
    final endX = startX + gridExtent * 2;
    final startZ = (carPos.z / gridStep).floor() * gridStep - gridExtent;
    final endZ = startZ + gridExtent * 2;

    for (double x = startX; x <= endX; x += gridStep) {
      final p1 = projectToScreen(Vector3(x, 0, startZ));
      final p2 = projectToScreen(Vector3(x, 0, endZ));
      if (p1 != null && p2 != null) {
        canvas.drawLine(p1, p2, gridPaint);
      }
    }

    for (double z = startZ; z <= endZ; z += gridStep) {
      final p1 = projectToScreen(Vector3(startX, 0, z));
      final p2 = projectToScreen(Vector3(endX, 0, z));
      if (p1 != null && p2 != null) {
        canvas.drawLine(p1, p2, gridPaint);
      }
    }

    // 4. Draw Clipping Beacons
    for (final cp in clippingPoints) {
      final baseP = projectToScreen(Vector3(cp.x, 0.1, cp.z));
      final topP = projectToScreen(Vector3(cp.x, 3.5, cp.z));
      if (baseP != null && topP != null) {
        final beaconPaint = Paint()
          ..color = cp.hit
              ? const Color(0xFF10B981)
              : const Color(0xFF06B6D4)
          ..strokeWidth = 3.0;
        canvas.drawLine(baseP, topP, beaconPaint);
        canvas.drawCircle(topP, 6.0, beaconPaint);
      }
    }

    // 5. Draw 3D Car Model
    _drawCar(canvas, projectToScreen, carPos, carHeading);

    // 6. Draw Volumetric Smoke Particles
    for (final p in particles) {
      final sp = projectToScreen(p.position);
      if (sp != null) {
        final alpha = (1.0 - (p.life / p.maxLife)).clamp(0.0, 1.0);
        final smokePaint = Paint()
          ..color = p.color.withOpacity(alpha * 0.45)
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 8);
        canvas.drawCircle(sp, p.size * 5.0, smokePaint);
      }
    }
  }

  void _drawCar(
    Canvas canvas,
    Offset? Function(Vector3) project,
    Vector3 carPos,
    double heading,
  ) {
    final forward = Vector3(math.sin(heading), 0, math.cos(heading));
    final right = Vector3(forward.z, 0, -forward.x);
    final up = Vector3(0, 1, 0);

    Vector3 localToWorld(double rx, double ry, double rz) {
      return carPos + (right * rx) + (up * ry) + (forward * rz);
    }

    void drawBox(
      Vector3 center,
      Vector3 halfSize,
      Paint paint, {
      bool drawEdges = true,
    }) {
      final corners = [
        Vector3(-halfSize.x, -halfSize.y, -halfSize.z),
        Vector3(halfSize.x, -halfSize.y, -halfSize.z),
        Vector3(halfSize.x, halfSize.y, -halfSize.z),
        Vector3(-halfSize.x, halfSize.y, -halfSize.z),
        Vector3(-halfSize.x, -halfSize.y, halfSize.z),
        Vector3(halfSize.x, -halfSize.y, halfSize.z),
        Vector3(halfSize.x, halfSize.y, halfSize.z),
        Vector3(-halfSize.x, halfSize.y, halfSize.z),
      ];

      final screenPts = corners.map((c) {
        final w = localToWorld(center.x + c.x, center.y + c.y, center.z + c.z);
        return project(w);
      }).toList();

      if (screenPts.any((p) => p == null)) return;

      final pts = screenPts.cast<Offset>();

      // Draw faces
      final faces = [
        [0, 1, 2, 3], // back
        [4, 5, 6, 7], // front
        [0, 1, 5, 4], // bottom
        [2, 3, 7, 6], // top
        [0, 3, 7, 4], // left
        [1, 2, 6, 5], // right
      ];

      final edgePaint = Paint()
        ..color = Colors.black.withOpacity(0.4)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.0;

      for (final face in faces) {
        final path = Path()
          ..moveTo(pts[face[0]].dx, pts[face[0]].dy)
          ..lineTo(pts[face[1]].dx, pts[face[1]].dy)
          ..lineTo(pts[face[2]].dx, pts[face[2]].dy)
          ..lineTo(pts[face[3]].dx, pts[face[3]].dy)
          ..close();

        canvas.drawPath(path, paint);
        if (drawEdges) {
          canvas.drawPath(path, edgePaint);
        }
      }
    }

    // Shadow plane beneath car
    final shL1 = project(localToWorld(-1.1, 0.02, -2.2));
    final shL2 = project(localToWorld(1.1, 0.02, -2.2));
    final shL3 = project(localToWorld(1.1, 0.02, 2.2));
    final shL4 = project(localToWorld(-1.1, 0.02, 2.2));
    if (shL1 != null && shL2 != null && shL3 != null && shL4 != null) {
      final shadowPath = Path()
        ..moveTo(shL1.dx, shL1.dy)
        ..lineTo(shL2.dx, shL2.dy)
        ..lineTo(shL3.dx, shL3.dy)
        ..lineTo(shL4.dx, shL4.dy)
        ..close();
      canvas.drawPath(shadowPath, Paint()..color = const Color(0x99000000));
    }

    // Main Body Materials
    final bodyPaint = Paint()..color = customization.bodyColor;
    final cabinPaint = Paint()..color = const Color(0xFF0F172A);
    final glassPaint = Paint()..color = const Color(0xCC38BDF8);
    final grillPaint = Paint()..color = const Color(0xFF171717);
    final rimPaint = Paint()..color = customization.rimColor;
    final tirePaint = Paint()..color = const Color(0xFF1C1917);

    // 1. Lower Body Chassis
    drawBox(Vector3(0, 0.45, 0), Vector3(0.95, 0.18, 2.2), bodyPaint);

    // 2. Sculpted Hood
    drawBox(Vector3(0, 0.55, 0.95), Vector3(0.88, 0.1, 0.7), bodyPaint);

    // 3. Cabin & Glass Roof
    drawBox(Vector3(0, 0.85, -0.2), Vector3(0.78, 0.28, 1.05), cabinPaint);

    // 4. Windshield Glass
    drawBox(Vector3(0, 0.82, 0.65), Vector3(0.74, 0.22, 0.05), glassPaint);
    drawBox(Vector3(0, 0.82, -1.05), Vector3(0.74, 0.22, 0.05), glassPaint);

    // 5. BMW Kidney Grille on Front Bumper
    if (carSpecs.id == CarId.bmwM4 || carSpecs.id == CarId.bmwE30) {
      // Left kidney
      drawBox(Vector3(-0.25, 0.42, 2.22), Vector3(0.16, 0.12, 0.04), grillPaint);
      // Right kidney
      drawBox(Vector3(0.25, 0.42, 2.22), Vector3(0.16, 0.12, 0.04), grillPaint);
    }

    // 6. Dual LED Headlights
    final hlPaint = Paint()..color = const Color(0xFFE0F2FE);
    drawBox(Vector3(-0.68, 0.52, 2.18), Vector3(0.18, 0.06, 0.04), hlPaint);
    drawBox(Vector3(0.68, 0.52, 2.18), Vector3(0.18, 0.06, 0.04), hlPaint);

    // 7. Taillights & Exhausts
    final tlPaint = Paint()..color = const Color(0xFFEF4444);
    drawBox(Vector3(-0.65, 0.55, -2.2), Vector3(0.22, 0.06, 0.04), tlPaint);
    drawBox(Vector3(0.65, 0.55, -2.2), Vector3(0.22, 0.06, 0.04), tlPaint);

    // Quad Exhaust tips
    final exPaint = Paint()..color = const Color(0xFFE2E8F0);
    drawBox(Vector3(-0.35, 0.32, -2.22), Vector3(0.06, 0.05, 0.05), exPaint);
    drawBox(Vector3(-0.22, 0.32, -2.22), Vector3(0.06, 0.05, 0.05), exPaint);
    drawBox(Vector3(0.22, 0.32, -2.22), Vector3(0.06, 0.05, 0.05), exPaint);
    drawBox(Vector3(0.35, 0.32, -2.22), Vector3(0.06, 0.05, 0.05), exPaint);

    // 8. GT Drift Wing / Ducktail Spoiler
    if (customization.spoilerStyle == SpoilerStyle.gtWing) {
      // Upright struts
      drawBox(Vector3(-0.45, 0.85, -1.9), Vector3(0.03, 0.22, 0.08), grillPaint);
      drawBox(Vector3(0.45, 0.85, -1.9), Vector3(0.03, 0.22, 0.08), grillPaint);
      // Wing blade
      drawBox(Vector3(0, 1.05, -1.9), Vector3(0.95, 0.03, 0.24), grillPaint);
    } else if (customization.spoilerStyle == SpoilerStyle.ducktail) {
      drawBox(Vector3(0, 0.72, -2.05), Vector3(0.8, 0.08, 0.12), grillPaint);
    }

    // 9. 4 Wheels (Tires & Rims)
    final wheelPositions = [
      Vector3(-0.95, 0.34, 1.3), // Front Left
      Vector3(0.95, 0.34, 1.3),  // Front Right
      Vector3(-0.95, 0.34, -1.3), // Rear Left
      Vector3(0.95, 0.34, -1.3),  // Rear Right
    ];

    for (final wp in wheelPositions) {
      // Outer tire
      drawBox(wp, Vector3(0.14, 0.32, 0.32), tirePaint);
      // Rim cap
      final rimOffset = wp.x < 0 ? -0.04 : 0.04;
      drawBox(Vector3(wp.x + rimOffset, wp.y, wp.z), Vector3(0.04, 0.22, 0.22), rimPaint);
    }
  }

  @override
  bool shouldRepaint(covariant Car3DRenderer oldDelegate) => true;
}
