import * as THREE from 'three';

/**
 * Creates a soft radial puff texture on canvas for smoke particles
 */
function createSmokeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.3, 'rgba(240, 240, 245, 0.7)');
  grad.addColorStop(0.7, 'rgba(200, 200, 210, 0.25)');
  grad.addColorStop(1, 'rgba(200, 200, 210, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

const smokeTexture = createSmokeTexture();

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  size: number;
  maxSize: number;
  life: number;
  maxLife: number;
  color: THREE.Color;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private maxParticles = 300;
  private geometry: THREE.BufferGeometry;
  private pointsMesh: THREE.Points;
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private opacities: Float32Array;

  // Exhaust flame meshes
  public flameLeft: THREE.Mesh;
  public flameRight: THREE.Mesh;
  public flameTimer: number = 0;

  // Skid marks
  private skidGroup: THREE.Group;
  private skidSegments: { mesh: THREE.Mesh; life: number }[] = [];
  private lastLeftSkidPos: THREE.Vector3 | null = null;
  private lastRightSkidPos: THREE.Vector3 | null = null;
  private skidMat: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene) {
    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.sizes = new Float32Array(this.maxParticles);
    this.opacities = new Float32Array(this.maxParticles);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    const smokeMaterial = new THREE.PointsMaterial({
      size: 2.5,
      map: smokeTexture,
      transparent: true,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      opacity: 0.65,
    });

    this.pointsMesh = new THREE.Points(this.geometry, smokeMaterial);
    scene.add(this.pointsMesh);

    // Exhaust Flames
    const flameGeo = new THREE.ConeGeometry(0.08, 0.45, 8);
    flameGeo.rotateX(Math.PI / 2); // Point backward
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.9,
    });

    this.flameLeft = new THREE.Mesh(flameGeo, flameMat);
    this.flameRight = new THREE.Mesh(flameGeo.clone(), flameMat);
    this.flameLeft.visible = false;
    this.flameRight.visible = false;
    scene.add(this.flameLeft, this.flameRight);

    // Skid marks container
    this.skidGroup = new THREE.Group();
    scene.add(this.skidGroup);

    this.skidMat = new THREE.MeshBasicMaterial({
      color: 0x050505,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
  }

  public emitSmoke(pos: THREE.Vector3, baseColor: string, count: number = 2) {
    if (this.particles.length >= this.maxParticles) return;

    const parsedColor = new THREE.Color(baseColor);

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const p: Particle = {
        position: pos.clone().add(new THREE.Vector3(
          (Math.random() - 0.5) * 0.4,
          Math.random() * 0.15,
          (Math.random() - 0.5) * 0.4
        )),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 1.5,
          0.8 + Math.random() * 1.5,
          (Math.random() - 0.5) * 1.5
        ),
        size: 0.8 + Math.random() * 0.8,
        maxSize: 3.5 + Math.random() * 2.5,
        life: 0,
        maxLife: 1.0 + Math.random() * 0.8,
        color: parsedColor.clone(),
      };

      this.particles.push(p);
    }
  }

  public addSkidMark(leftWheel: THREE.Vector3, rightWheel: THREE.Vector3) {
    // Ground elevation
    const y = 0.035;

    if (this.lastLeftSkidPos && this.lastRightSkidPos) {
      const dist = this.lastLeftSkidPos.distanceTo(leftWheel);
      if (dist > 0.4 && dist < 4.0) {
        // Create left tire mark quad
        this.createSkidRibbon(this.lastLeftSkidPos, leftWheel, y);
        this.createSkidRibbon(this.lastRightSkidPos, rightWheel, y);
      }
    }

    this.lastLeftSkidPos = leftWheel.clone();
    this.lastRightSkidPos = rightWheel.clone();
  }

  public endSkidMark() {
    this.lastLeftSkidPos = null;
    this.lastRightSkidPos = null;
  }

  private createSkidRibbon(p1: THREE.Vector3, p2: THREE.Vector3, y: number) {
    const dir = p2.clone().sub(p1).normalize();
    const perp = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(0.14); // Half tire width

    const geo = new THREE.BufferGeometry();
    const verts = new Float32Array([
      p1.x - perp.x, y, p1.z - perp.z,
      p1.x + perp.x, y, p1.z + perp.z,
      p2.x - perp.x, y, p2.z - perp.z,

      p1.x + perp.x, y, p1.z + perp.z,
      p2.x + perp.x, y, p2.z + perp.z,
      p2.x - perp.x, y, p2.z - perp.z,
    ]);

    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    const mesh = new THREE.Mesh(geo, this.skidMat);
    this.skidGroup.add(mesh);
    this.skidSegments.push({ mesh, life: 18.0 });

    // Cull old marks if too many
    if (this.skidSegments.length > 250) {
      const oldest = this.skidSegments.shift();
      if (oldest) {
        this.skidGroup.remove(oldest.mesh);
        oldest.mesh.geometry.dispose();
      }
    }
  }

  public triggerBackfire(exhaustLeftWorld: THREE.Vector3, exhaustRightWorld: THREE.Vector3, carQuaternion: THREE.Quaternion) {
    this.flameLeft.position.copy(exhaustLeftWorld);
    this.flameLeft.quaternion.copy(carQuaternion);
    this.flameRight.position.copy(exhaustRightWorld);
    this.flameRight.quaternion.copy(carQuaternion);

    this.flameLeft.visible = true;
    this.flameRight.visible = true;
    this.flameTimer = 0.18; // Seconds of visual burst
  }

  public update(dt: number) {
    // 1. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      p.position.addScaledVector(p.velocity, dt);
      p.velocity.multiplyScalar(0.96); // drag
      p.size = THREE.MathUtils.lerp(p.size, p.maxSize, dt * 2.5);
    }

    // Update Points geometry buffers
    const pCount = this.particles.length;
    for (let i = 0; i < pCount; i++) {
      const p = this.particles[i];
      this.positions[i * 3] = p.position.x;
      this.positions[i * 3 + 1] = p.position.y;
      this.positions[i * 3 + 2] = p.position.z;

      const alpha = 1.0 - (p.life / p.maxLife);
      this.colors[i * 3] = p.color.r * alpha;
      this.colors[i * 3 + 1] = p.color.g * alpha;
      this.colors[i * 3 + 2] = p.color.b * alpha;

      this.sizes[i] = p.size;
    }

    this.geometry.setDrawRange(0, pCount);
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;

    // 2. Update Backfire Flames
    if (this.flameTimer > 0) {
      this.flameTimer -= dt;
      const flicker = 0.8 + Math.random() * 0.4;
      this.flameLeft.scale.set(flicker, flicker, flicker);
      this.flameRight.scale.set(flicker, flicker, flicker);
      if (this.flameTimer <= 0) {
        this.flameLeft.visible = false;
        this.flameRight.visible = false;
      }
    }

    // 3. Update Skid marks life and fade
    for (let i = this.skidSegments.length - 1; i >= 0; i--) {
      const seg = this.skidSegments[i];
      seg.life -= dt;
      if (seg.life <= 0) {
        this.skidGroup.remove(seg.mesh);
        seg.mesh.geometry.dispose();
        this.skidSegments.splice(i, 1);
      }
    }
  }

  public dispose() {
    this.geometry.dispose();
    this.pointsMesh.geometry.dispose();
    this.skidSegments.forEach((s) => s.mesh.geometry.dispose());
  }
}
