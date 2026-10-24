import 'dart:math' as math;
import 'package:vector_math/vector_math_64.dart';
import '../models/car.dart';
import '../models/map_data.dart';

class VehicleInputs {
  double throttle;
  double brake;
  double steer;
  bool handbrake;
  bool nitrous;
  bool reset;

  VehicleInputs({
    this.throttle = 0.0,
    this.brake = 0.0,
    this.steer = 0.0,
    this.handbrake = false,
    this.nitrous = false,
    this.reset = false,
  });
}

class DriftScoreState {
  bool isDrifting = false;
  double currentScore = 0.0;
  int combo = 0;
  double multiplier = 1.0;
  double angle = 0.0;
  int speed = 0;
  double chainTimer = 0.0;
  int totalScore = 0;
  int bestDriftScore = 0;
  int clipPointsPassed = 0;
  int cashEarned = 0;
  String lastRatingText = '';
  double ratingFade = 0.0;
}

class VehiclePhysics {
  Vector3 position = Vector3(0, 0.35, 0);
  Vector3 velocity = Vector3(0, 0, 0);
  double rotationY = 0.0; // heading
  double angularVelocityY = 0.0;

  double roll = 0.0;
  double pitch = 0.0;
  double currentSteerAngle = 0.0;

  bool isGrounded = true;
  double verticalVelocity = 0.0;

  int speedKmh = 0;
  double slipAngleDeg = 0.0;
  double lateralSlipSpeed = 0.0;
  double rpm = 800.0;
  int gear = 1;

  final DriftScoreState driftState = DriftScoreState();
  double _continuousDriftDuration = 0.0;

  void setSpawn(double x, double y, double z, double heading) {
    position.setValues(x, y, z);
    velocity.setValues(0, 0, 0);
    rotationY = heading;
    angularVelocityY = 0.0;
    verticalVelocity = 0.0;
    isGrounded = true;
    roll = 0.0;
    pitch = 0.0;
    rpm = 800.0;
  }

  void update(
    double dt,
    VehicleInputs inputs,
    CarSpecs specs,
    CarCustomization custom,
    double surfaceGrip,
    List<ClippingPoint> clippingPoints,
  ) {
    // 1. Heading forward & right vectors
    final forward = Vector3(math.sin(rotationY), 0, math.cos(rotationY));
    final right = Vector3(forward.z, 0, -forward.x);

    // Deconstruct velocity into forward and lateral components
    final forwardVel = velocity.dot(forward);
    final lateralVel = velocity.dot(right);
    lateralSlipSpeed = lateralVel.abs();

    final speedMs = velocity.length;
    speedKmh = (speedMs * 3.6).floor();

    // 2. Smoothed Steering
    final maxSteerRad = (custom.steerAngle * math.pi) / 180.0;
    final targetSteer = -inputs.steer * maxSteerRad;
    currentSteerAngle += (targetSteer - currentSteerAngle) * math.min(1.0, dt * 8.0);

    // 3. Engine propulsion & nitro
    double throttleForce = 0.0;
    final nitroBoost = inputs.nitrous ? 1.5 : 1.0;

    if (inputs.throttle > 0) {
      final topSpeedMs = (specs.topSpeed / 3.6) * nitroBoost;
      if (forwardVel < topSpeedMs) {
        final accelPower = (85.0 / specs.acceleration) * nitroBoost * (specs.horsepower / 500.0);
        throttleForce = inputs.throttle * accelPower * 2.8;
      }
    }

    if (inputs.brake > 0) {
      if (forwardVel > 0.5) {
        throttleForce -= inputs.brake * 35.0;
      } else {
        throttleForce -= inputs.brake * 15.0;
      }
    }

    // RPM & Gear calculation
    final speedRatio = math.min(1.0, forwardVel.abs() / (specs.topSpeed / 3.6));
    gear = speedRatio < 0.2 ? 1 : speedRatio < 0.4 ? 2 : speedRatio < 0.65 ? 3 : speedRatio < 0.85 ? 4 : 5;
    final gearSpeed = speedRatio * 5.0 - (gear - 1);
    final calcRpm = 850.0 + math.max(0.0, math.min(7400.0, gearSpeed * 6800.0 + (inputs.throttle * 900.0)));
    rpm += (calcRpm - rpm) * math.min(1.0, dt * 12.0);

    // 4. Drift & Tire Friction Dynamics
    final isHandbrake = inputs.handbrake;
    final highPowerBreak = inputs.throttle > 0.8 && currentSteerAngle.abs() > 0.25 && speedMs > 5.0;
    final wantsDrift = isHandbrake || highPowerBreak;

    velocity.scale(0.988); // Rolling resistance

    double lateralGripFactor = 0.85 * surfaceGrip;
    if (wantsDrift) {
      lateralGripFactor = (0.28 / (specs.driftEase / 80.0)) * surfaceGrip;
    } else if (custom.driftAssist) {
      lateralGripFactor = 0.92 * surfaceGrip;
    }

    final newLateralVel = lateralVel * math.pow(1.0 - lateralGripFactor, dt * 10.0);
    velocity.add(right * (newLateralVel - lateralVel));

    // 5. Yaw Dynamics (Oversteer & Counter-steer)
    if (isGrounded) {
      final turnRadiusFactor = (forwardVel / 2.8) * math.tan(currentSteerAngle);
      double yawTorque = turnRadiusFactor;

      if (lateralVel.abs() > 1.8 && speedMs > 4.0) {
        final driftYawOversteer = -lateralVel.sign * (lateralVel.abs() * 0.12) * (specs.driftEase / 85.0);
        yawTorque += driftYawOversteer;
      }

      angularVelocityY += (yawTorque - angularVelocityY) * math.min(1.0, dt * 8.5);
      rotationY += angularVelocityY * dt;
      velocity.add(forward * (throttleForce * dt));
    }

    // Apply horizontal translation
    position.add(velocity * dt);

    // 6. Slip Angle Beta
    if (speedMs > 3.0) {
      final headingAngle = math.atan2(forward.x, forward.z);
      final moveAngle = math.atan2(velocity.x, velocity.z);
      var diff = headingAngle - moveAngle;
      while (diff > math.pi) {
        diff -= math.pi * 2;
      }
      while (diff < -math.pi) {
        diff += math.pi * 2;
      }
      slipAngleDeg = (diff.abs() * 180.0) / math.pi;
    } else {
      slipAngleDeg = 0.0;
    }

    // 7. DRIFT SCORING
    const minDriftAngle = 14.0;
    const minDriftSpeed = 16.0;
    final isDriftingNow = slipAngleDeg >= minDriftAngle && speedKmh >= minDriftSpeed && isGrounded;

    if (isDriftingNow) {
      driftState.isDrifting = true;
      _continuousDriftDuration += dt;
      driftState.chainTimer = 1.5;

      if (_continuousDriftDuration > 10.0) {
        driftState.multiplier = 5.0;
      } else if (_continuousDriftDuration > 7.0) {
        driftState.multiplier = 3.5;
      } else if (_continuousDriftDuration > 4.0) {
        driftState.multiplier = 2.5;
      } else if (_continuousDriftDuration > 2.0) {
        driftState.multiplier = 1.5;
      } else {
        driftState.multiplier = 1.0;
      }

      final angleMult = math.min(3.0, (slipAngleDeg / 30.0));
      final speedMult = (speedKmh / 50.0);
      final frameScore = 180.0 * angleMult * speedMult * driftState.multiplier * dt;

      driftState.currentScore += frameScore;
      driftState.combo = (_continuousDriftDuration * 10).floor();
      driftState.angle = slipAngleDeg;
      driftState.speed = speedKmh;

      if (slipAngleDeg > 55.0) {
        driftState.lastRatingText = 'EXTREME REVERSE ENTRY!';
        driftState.ratingFade = 1.2;
      } else if (driftState.multiplier >= 5.0) {
        driftState.lastRatingText = 'DRIFT GOD!';
        driftState.ratingFade = 1.2;
      } else if (_continuousDriftDuration > 4.0) {
        driftState.lastRatingText = 'SICK ANGLE & COMBO!';
        driftState.ratingFade = 1.2;
      } else if (_continuousDriftDuration > 1.5) {
        driftState.lastRatingText = 'NICE DRIFT!';
        driftState.ratingFade = 1.2;
      }
    } else {
      if (driftState.chainTimer > 0) {
        driftState.chainTimer -= dt;
      } else if (driftState.currentScore > 0) {
        final banked = driftState.currentScore.floor();
        driftState.totalScore += banked;
        driftState.cashEarned += (banked / 4).floor();

        if (banked > driftState.bestDriftScore) {
          driftState.bestDriftScore = banked;
        }

        driftState.isDrifting = false;
        driftState.currentScore = 0.0;
        driftState.multiplier = 1.0;
        _continuousDriftDuration = 0.0;
      } else {
        driftState.isDrifting = false;
      }
    }

    if (driftState.ratingFade > 0) {
      driftState.ratingFade -= dt;
    }

    // 8. Clipping points proximity check
    for (final cp in clippingPoints) {
      if (cp.active && !cp.hit) {
        final dist = math.sqrt(math.pow(position.x - cp.x, 2) + math.pow(position.z - cp.z, 2));
        if (dist <= cp.radius && driftState.isDrifting) {
          cp.hit = true;
          driftState.currentScore += cp.points * driftState.multiplier;
          driftState.clipPointsPassed++;
          driftState.lastRatingText = 'CLIPPING BONUS! +${(cp.points * driftState.multiplier).floor()}';
          driftState.ratingFade = 2.0;
        }
      }
    }

    // 9. Body Roll & Pitch
    final targetRoll = (-lateralVel * 0.02) * (1.2 / custom.suspensionStiffness);
    final targetPitch = (throttleForce * 0.003) * (1.2 / custom.suspensionStiffness);
    roll += (targetRoll - roll) * math.min(1.0, dt * 8.0);
    pitch += (targetPitch - pitch) * math.min(1.0, dt * 8.0);
  }
}
