import * as THREE from 'three';
import { VehicleInputs, DriftState, ClippingPoint, CarSpecs, CarCustomization } from '../types/game';
import { CarMeshes } from './proceduralModels';
import { soundEngine } from '../audio/SoundEngine';

export class VehiclePhysics {
  public position: THREE.Vector3 = new THREE.Vector3(0, 0.35, 0);
  public velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public rotationY: number = 0; // heading in radians
  public angularVelocityY: number = 0;

  // Visual body roll & pitch
  public roll: number = 0;
  public pitch: number = 0;
  public currentSteerAngle: number = 0; // Front wheels angle in rad

  // Air physics
  public isGrounded: boolean = true;
  public verticalVelocity: number = 0;

  // Dynamic parameters
  public speedKmh: number = 0;
  public slipAngleDeg: number = 0;
  public lateralSlipSpeed: number = 0;
  public rpm: number = 800;
  public gear: number = 1;

  // Drift Score Tracker
  public driftState: DriftState = {
    isDrifting: false,
    currentScore: 0,
    combo: 0,
    multiplier: 1.0,
    angle: 0,
    speed: 0,
    chainTimer: 0,
    totalScore: 0,
    bestDriftScore: 0,
    clipPointsPassed: 0,
    cashEarned: 0,
    lastRatingText: '',
    ratingFade: 0,
  };

  private lastBackfireTime: number = 0;
  private continuousDriftDuration: number = 0;

  constructor() {}

  public setSpawn(x: number, y: number, z: number, heading: number) {
    this.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
    this.rotationY = heading;
    this.angularVelocityY = 0;
    this.verticalVelocity = 0;
    this.isGrounded = true;
    this.roll = 0;
    this.pitch = 0;
    this.rpm = 800;
  }

  public update(
    dt: number,
    inputs: VehicleInputs,
    specs: CarSpecs,
    custom: CarCustomization,
    surfaceGrip: number,
    colliders: { box: THREE.Box3; type: string }[],
    ramps: { box: THREE.Box3; normal: THREE.Vector3; boost: number }[],
    clippingPoints: ClippingPoint[],
    onBackfire?: () => void
  ) {
    // 1. Calculate Local Heading & Vectors
    const forward = new THREE.Vector3(Math.sin(this.rotationY), 0, Math.cos(this.rotationY));
    const right = new THREE.Vector3(forward.z, 0, -forward.x);

    // Deconstruct velocity into longitudinal (forward/back) and lateral (sideways)
    const forwardVel = this.velocity.dot(forward);
    const lateralVel = this.velocity.dot(right);
    this.lateralSlipSpeed = Math.abs(lateralVel);

    const speedMs = this.velocity.length();
    this.speedKmh = Math.floor(speedMs * 3.6);

    // 2. Steering Dynamics (Smoothed)
    const maxSteerRad = THREE.MathUtils.degToRad(custom.steerAngle || 48);
    const targetSteer = -inputs.steer * maxSteerRad;
    const steerSpeed = 8.0;
    this.currentSteerAngle = THREE.MathUtils.damp(this.currentSteerAngle, targetSteer, steerSpeed, dt);

    // 3. Engine & Gear Simulation
    let throttleForce = 0;
    const nitroBoost = inputs.nitrous ? 1.5 : 1.0;

    if (inputs.throttle > 0) {
      const topSpeedMs = (specs.topSpeed / 3.6) * nitroBoost;
      if (forwardVel < topSpeedMs) {
        // Power curve
        const accelPower = (85 / specs.acceleration) * nitroBoost * (specs.horsepower / 500);
        throttleForce = inputs.throttle * accelPower * 2.8;
      }
    }

    if (inputs.brake > 0) {
      if (forwardVel > 0.5) {
        // Foot brake
        throttleForce -= inputs.brake * 35;
      } else {
        // Reverse
        throttleForce -= inputs.brake * 15;
      }
    }

    // Engine RPM Calculation for sound and tachometer
    const speedRatio = Math.min(1.0, Math.abs(forwardVel) / (specs.topSpeed / 3.6));
    const targetGear = speedRatio < 0.2 ? 1 : speedRatio < 0.4 ? 2 : speedRatio < 0.65 ? 3 : speedRatio < 0.85 ? 4 : 5;
    this.gear = targetGear;
    const gearSpeed = speedRatio * 5 - (targetGear - 1);
    const calculatedRpm = 850 + Math.max(0, Math.min(7400, gearSpeed * 6800 + (inputs.throttle * 900)));
    this.rpm = THREE.MathUtils.damp(this.rpm, calculatedRpm, 12, dt);

    // 4. Drift & Tire Friction Dynamics (The Core Drift Magic)
    // When handbrake is pressed or high throttle + steering, rear tires break traction
    const isHandbrake = inputs.handbrake;
    const highPowerBreak = inputs.throttle > 0.8 && Math.abs(this.currentSteerAngle) > 0.25 && speedMs > 5;
    const wantsDrift = isHandbrake || highPowerBreak;

    // Longitudinal friction (rolling resistance + braking)
    const rollingFriction = 0.988;
    this.velocity.multiplyScalar(rollingFriction);

    // Lateral friction curve: High grip when rolling, low sliding friction when drifting
    let lateralGripFactor = 0.85 * surfaceGrip;

    if (wantsDrift) {
      // Drift slip friction: allows the rear to slide out smoothly
      lateralGripFactor = (0.28 / (specs.driftEase / 80)) * surfaceGrip;
    } else if (custom.driftAssist) {
      lateralGripFactor = 0.92 * surfaceGrip;
    }

    // Apply lateral damping
    const newLateralVel = lateralVel * Math.pow(1 - lateralGripFactor, dt * 10);
    this.velocity.add(right.clone().multiplyScalar(newLateralVel - lateralVel));

    // 5. Angular Heading / Yaw Dynamics (Steering & Counter-steer)
    if (this.isGrounded) {
      // Ackermann turning rate
      const turnRadiusFactor = (forwardVel / 2.8) * Math.tan(this.currentSteerAngle);
      let yawTorque = turnRadiusFactor;

      // When drifting, rear slides out (oversteer)
      if (Math.abs(lateralVel) > 1.8 && speedMs > 4) {
        const driftYawOversteer = -Math.sign(lateralVel) * (Math.abs(lateralVel) * 0.12) * (specs.driftEase / 85);
        yawTorque += driftYawOversteer;
      }

      this.angularVelocityY = THREE.MathUtils.damp(this.angularVelocityY, yawTorque, 8.5, dt);
      this.rotationY += this.angularVelocityY * dt;
    }

    // Apply forward propulsion
    if (this.isGrounded) {
      this.velocity.add(forward.clone().multiplyScalar(throttleForce * dt));
    }

    // 6. Vertical Gravity & Ground / Ramp Check
    const gravity = -26;
    if (!this.isGrounded) {
      this.verticalVelocity += gravity * dt;
      this.position.y += this.verticalVelocity * dt;
      if (this.position.y <= 0.35) {
        this.position.y = 0.35;
        this.verticalVelocity = 0;
        this.isGrounded = true;
      }
    }

    // Check Ramps
    const carBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(this.position.x, this.position.y + 0.5, this.position.z),
      new THREE.Vector3(2.0, 1.2, 4.4)
    );

    for (const ramp of ramps) {
      if (ramp.box.intersectsBox(carBox)) {
        if (speedMs > 8 && this.isGrounded) {
          // Launch into air!
          this.isGrounded = false;
          this.verticalVelocity = ramp.boost * 0.7;
          this.velocity.add(forward.clone().multiplyScalar(6));
        }
      }
    }

    // Apply horizontal motion
    this.position.addScaledVector(this.velocity, dt);

    // 7. Collision Detection with World Props & Walls
    for (const col of colliders) {
      if (col.box.intersectsBox(carBox)) {
        // Bounce back softly
        soundEngine.playHitSound();
        this.velocity.multiplyScalar(-0.4);
        this.position.addScaledVector(this.velocity, dt * 1.5);

        // Heavy impact breaks active drift combo
        if (this.driftState.isDrifting) {
          this.driftState.currentScore = 0;
          this.driftState.combo = 0;
          this.driftState.multiplier = 1.0;
          this.driftState.lastRatingText = 'WALL TAP / CRASH!';
          this.driftState.ratingFade = 2.0;
        }
        break;
      }
    }

    // 8. Calculate Slip Angle Beta
    if (speedMs > 3.0) {
      const headingAngle = Math.atan2(forward.x, forward.z);
      const moveAngle = Math.atan2(this.velocity.x, this.velocity.z);
      let angleDiff = headingAngle - moveAngle;
      // Normalize angle difference to -PI to PI
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      this.slipAngleDeg = Math.abs(THREE.MathUtils.radToDeg(angleDiff));
    } else {
      this.slipAngleDeg = 0;
    }

    // 9. DRIFT SCORING SYSTEM
    const minDriftAngle = 14; // Degrees
    const minDriftSpeed = 16; // km/h
    const isDriftingNow = this.slipAngleDeg >= minDriftAngle && this.speedKmh >= minDriftSpeed && this.isGrounded;

    if (isDriftingNow) {
      this.driftState.isDrifting = true;
      this.continuousDriftDuration += dt;
      this.driftState.chainTimer = 1.5; // Grace period timer

      // Multiplier steps
      if (this.continuousDriftDuration > 10) {
        this.driftState.multiplier = 5.0;
      } else if (this.continuousDriftDuration > 7) {
        this.driftState.multiplier = 3.5;
      } else if (this.continuousDriftDuration > 4) {
        this.driftState.multiplier = 2.5;
      } else if (this.continuousDriftDuration > 2) {
        this.driftState.multiplier = 1.5;
      } else {
        this.driftState.multiplier = 1.0;
      }

      // Base points per frame
      const angleMultiplier = Math.min(3.0, (this.slipAngleDeg / 30));
      const speedMultiplier = (this.speedKmh / 50);
      const frameScore = 180 * angleMultiplier * speedMultiplier * this.driftState.multiplier * dt;

      this.driftState.currentScore += frameScore;
      this.driftState.combo = Math.floor(this.continuousDriftDuration * 10);
      this.driftState.angle = Math.floor(this.slipAngleDeg);
      this.driftState.speed = this.speedKmh;

      // Rating badge text
      if (this.slipAngleDeg > 55) {
        this.driftState.lastRatingText = 'EXTREME REVERSE ENTRY!';
        this.driftState.ratingFade = 1.2;
      } else if (this.driftState.multiplier >= 5.0) {
        this.driftState.lastRatingText = 'DRIFT GOD!';
        this.driftState.ratingFade = 1.2;
      } else if (this.continuousDriftDuration > 4) {
        this.driftState.lastRatingText = 'SICK ANGLE & COMBO!';
        this.driftState.ratingFade = 1.2;
      } else if (this.continuousDriftDuration > 1.5) {
        this.driftState.lastRatingText = 'NICE DRIFT!';
        this.driftState.ratingFade = 1.2;
      }
    } else {
      // In grace transition period?
      if (this.driftState.chainTimer > 0) {
        this.driftState.chainTimer -= dt;
      } else if (this.driftState.currentScore > 0) {
        // Bank the score!
        const bankedScore = Math.floor(this.driftState.currentScore);
        this.driftState.totalScore += bankedScore;
        const cashWon = Math.floor(bankedScore / 4);
        this.driftState.cashEarned += cashWon;

        if (bankedScore > this.driftState.bestDriftScore) {
          this.driftState.bestDriftScore = bankedScore;
        }

        if (bankedScore > 1000) {
          soundEngine.playCashEarned();
        }

        // Reset current active drift
        this.driftState.isDrifting = false;
        this.driftState.currentScore = 0;
        this.driftState.multiplier = 1.0;
        this.continuousDriftDuration = 0;
      } else {
        this.driftState.isDrifting = false;
      }
    }

    if (this.driftState.ratingFade > 0) {
      this.driftState.ratingFade -= dt;
    }

    // 10. Check Proximity to Clipping Points
    for (const cp of clippingPoints) {
      if (cp.active && !cp.hit) {
        const dist = Math.hypot(this.position.x - cp.x, this.position.z - cp.z);
        if (dist <= cp.radius) {
          if (this.driftState.isDrifting) {
            // HIT THE CLIPPING POINT WITH DRIFT!
            cp.hit = true;
            this.driftState.currentScore += cp.points * this.driftState.multiplier;
            this.driftState.clipPointsPassed++;
            this.driftState.lastRatingText = `CLIPPING POINT BONUS! +${cp.points * this.driftState.multiplier}`;
            this.driftState.ratingFade = 2.0;
            soundEngine.playClipBonus();

            // Reset after 8 seconds
            setTimeout(() => {
              cp.hit = false;
            }, 8000);
          }
        }
      }
    }

    // 11. Visual Roll & Pitch (Weight Transfer)
    const targetRoll = (-lateralVel * 0.02) * (1.2 / custom.suspensionStiffness);
    const targetPitch = (throttleForce * 0.003) * (1.2 / custom.suspensionStiffness);
    this.roll = THREE.MathUtils.damp(this.roll, targetRoll, 8, dt);
    this.pitch = THREE.MathUtils.damp(this.pitch, targetPitch, 8, dt);

    // 12. Exhaust Backfire & Pop Trigger
    if (inputs.throttle < 0.1 && this.rpm > 5500 && performance.now() - this.lastBackfireTime > 750) {
      this.lastBackfireTime = performance.now();
      soundEngine.playBackfire();
      if (onBackfire) onBackfire();
    }

    // 13. Update Audio Synthesizer
    soundEngine.update(this.rpm, inputs.throttle, this.lateralSlipSpeed, inputs.handbrake, inputs.nitrous);
  }

  public applyToMeshes(carMeshes: CarMeshes) {
    // Position car root
    carMeshes.root.position.copy(this.position);
    carMeshes.root.rotation.set(0, 0, 0);
    carMeshes.root.rotateY(this.rotationY);

    // Apply weight transfer body roll & pitch to the body mesh
    carMeshes.bodyMesh.rotation.z = this.roll;
    carMeshes.bodyMesh.rotation.x = this.pitch;

    // Front wheels steering
    carMeshes.frontLeftWheel.rotation.y = this.currentSteerAngle;
    carMeshes.frontRightWheel.rotation.y = Math.PI + this.currentSteerAngle;

    // Wheel rotation around spin axis based on speed
    const wheelSpin = (this.velocity.length() / 0.34) * 0.02;
    carMeshes.flTireMesh.rotation.x += wheelSpin;
    carMeshes.frTireMesh.rotation.x += wheelSpin;
    carMeshes.rlTireMesh.rotation.x += wheelSpin;
    carMeshes.rrTireMesh.rotation.x += wheelSpin;
  }
}
