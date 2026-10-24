import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CarId, MapId, CameraMode, VehicleInputs, CarCustomization } from '../types/game';
import { buildCarModel, CarMeshes, CAR_CATALOG } from './proceduralModels';
import { buildWorld, WorldObjects, MAP_CATALOG } from './worldBuilder';
import { VehiclePhysics } from './physics';
import { ParticleSystem } from './particles';
import { soundEngine } from '../audio/SoundEngine';

export class GameEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean;
  private frameId: number = 0;
  private isRunning: boolean = false;

  // Scene Components
  private carMeshes: CarMeshes | null = null;
  private worldObjects: WorldObjects | null = null;
  private physics: VehiclePhysics;
  private particles: ParticleSystem;

  // Lights
  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;

  // State & Config
  public currentCarId: CarId = 'bmw_m4';
  public currentMapId: MapId = 'city';
  public currentCameraMode: CameraMode = 'chase';
  public carCustomization: CarCustomization = {
    bodyColor: '#1e40af',
    finish: 'metallic',
    rimColor: '#d4af37',
    smokeColor: '#ffffff',
    spoilerStyle: 'gt_wing',
    steerAngle: 50,
    suspensionStiffness: 1.0,
    driftAssist: false,
  };

  // Keyboard Inputs
  private inputs: VehicleInputs = {
    throttle: 0,
    brake: 0,
    steer: 0,
    handbrake: false,
    nitrous: false,
    reset: false,
  };
  private keysDown: Set<string> = new Set();

  // Camera targets
  private cameraPosSmooth = new THREE.Vector3();
  private cameraLookSmooth = new THREE.Vector3();
  private orbitAngle: number = 0;

  // Clock
  private lastTime: number = 0;

  // Listeners & Callbacks
  public onDriftUpdate?: (physics: VehiclePhysics) => void;

  constructor(container: HTMLElement) {
    this.container = container;

    // Detect software WebGL
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // Initialize Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);
    this.handleResize();

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.2, 800);

    // Setup Environment Map
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Studio Lighting Rig
    this.dirLight = new THREE.DirectionalLight(0xfff1e0, 2.2);
    this.dirLight.castShadow = !this.isSoftwareGl;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 1;
    this.dirLight.shadow.camera.far = 120;
    this.dirLight.shadow.camera.left = -30;
    this.dirLight.shadow.camera.right = 30;
    this.dirLight.shadow.camera.top = 30;
    this.dirLight.shadow.camera.bottom = -30;
    this.dirLight.shadow.bias = -0.0005;
    this.dirLight.shadow.normalBias = 0.02;
    this.scene.add(this.dirLight);

    this.hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x1e293b, 1.2);
    this.scene.add(this.hemiLight);

    // Initialize Physics & Particles
    this.physics = new VehiclePhysics();
    this.particles = new ParticleSystem(this.scene);

    // Bind event handlers
    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onWindowBlur);

    // Load initial map & car
    this.loadMap(this.currentMapId);
    this.loadCar(this.currentCarId, this.carCustomization);

    this.start();
  }

  private onWindowResize = () => {
    this.handleResize();
  };

  private handleResize() {
    if (!this.container || !this.renderer) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera?.aspect != null && (this.camera.aspect = width / height);
    this.camera?.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public loadMap(mapId: MapId) {
    if (this.worldObjects) {
      this.scene.remove(this.worldObjects.group);
    }
    this.currentMapId = mapId;
    const mapMeta = MAP_CATALOG[mapId];

    // Background & Fog
    this.scene.background = new THREE.Color(mapMeta.skyColor);
    this.scene.fog = new THREE.FogExp2(new THREE.Color(mapMeta.fogColor), mapMeta.fogDensity);

    // Re-adjust lighting colors according to map theme
    if (mapMeta.timeOfDay === 'night') {
      this.dirLight.color.setHex(0x93c5fd);
      this.dirLight.intensity = 1.4;
      this.hemiLight.color.setHex(0x38bdf8);
      this.hemiLight.groundColor.setHex(0x0f172a);
    } else {
      this.dirLight.color.setHex(0xfef08a);
      this.dirLight.intensity = 2.4;
      this.hemiLight.color.setHex(0x93c5fd);
      this.hemiLight.groundColor.setHex(0x451a03);
    }

    this.worldObjects = buildWorld(mapId);
    this.scene.add(this.worldObjects.group);

    // Position car at spawn
    this.physics.setSpawn(
      this.worldObjects.spawnPoint.x,
      this.worldObjects.spawnPoint.y,
      this.worldObjects.spawnPoint.z,
      this.worldObjects.spawnPoint.heading
    );

    // Reset camera position near spawn
    this.cameraPosSmooth.set(
      this.worldObjects.spawnPoint.x,
      this.worldObjects.spawnPoint.y + 4,
      this.worldObjects.spawnPoint.z - 9
    );
  }

  public loadCar(carId: CarId, custom: CarCustomization) {
    if (this.carMeshes) {
      this.scene.remove(this.carMeshes.root);
    }
    this.currentCarId = carId;
    this.carCustomization = { ...custom };

    this.carMeshes = buildCarModel(carId, this.carCustomization);
    this.scene.add(this.carMeshes.root);
  }

  public updateCarCustomization(custom: Partial<CarCustomization>) {
    this.carCustomization = { ...this.carCustomization, ...custom };
    // Reload car with new styles
    this.loadCar(this.currentCarId, this.carCustomization);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    soundEngine.init();
    soundEngine.resume();
    this.keysDown.add(e.code);

    if (e.code === 'KeyC') {
      this.cycleCamera();
    }
    if (e.code === 'KeyR') {
      this.resetCar();
    }
    if (e.code === 'KeyM') {
      soundEngine.toggleMute();
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keysDown.delete(e.code);
  };

  private onWindowBlur = () => {
    this.keysDown.clear();
  };

  public cycleCamera() {
    const modes: CameraMode[] = ['chase', 'close', 'hood', 'orbit'];
    const idx = modes.indexOf(this.currentCameraMode);
    this.currentCameraMode = modes[(idx + 1) % modes.length];
  }

  public setCameraMode(mode: CameraMode) {
    this.currentCameraMode = mode;
  }

  public resetCar() {
    if (!this.worldObjects) return;
    this.physics.setSpawn(
      this.physics.position.x,
      0.35,
      this.physics.position.z,
      this.physics.rotationY
    );
  }

  public setVirtualInputs(inputs: Partial<VehicleInputs>) {
    soundEngine.init();
    soundEngine.resume();
    this.inputs = { ...this.inputs, ...inputs };
  }

  private updateInputs() {
    // Merge keyboard with virtual inputs
    const throttleKey = this.keysDown.has('KeyW') || this.keysDown.has('ArrowUp');
    const brakeKey = this.keysDown.has('KeyS') || this.keysDown.has('ArrowDown');
    const steerLeft = this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft');
    const steerRight = this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight');
    const handbrakeKey = this.keysDown.has('Space');
    const nitroKey = this.keysDown.has('ShiftLeft') || this.keysDown.has('ShiftRight');

    const keyThrottle = throttleKey ? 1 : 0;
    const keyBrake = brakeKey ? 1 : 0;
    const keySteer = steerLeft ? -1 : steerRight ? 1 : 0;

    this.inputs.throttle = Math.max(keyThrottle, this.inputs.throttle);
    this.inputs.brake = Math.max(keyBrake, this.inputs.brake);
    if (keySteer !== 0) {
      this.inputs.steer = keySteer;
    }
    this.inputs.handbrake = handbrakeKey || this.inputs.handbrake;
    this.inputs.nitrous = nitroKey || this.inputs.nitrous;
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick = (time: number) => {
    if (!this.isRunning) return;

    if (!this.lastTime) this.lastTime = time;
    const rawDt = (time - this.lastTime) / 1000;
    this.lastTime = time;
    const dt = Math.min(rawDt, 0.05); // Clamp dt to prevent tunneling

    this.updateInputs();

    const carSpecs = CAR_CATALOG[this.currentCarId];
    const mapMeta = MAP_CATALOG[this.currentMapId];

    if (this.carMeshes && this.worldObjects) {
      // 1. Update Physics
      this.physics.update(
        dt,
        this.inputs,
        { ...carSpecs, id: this.currentCarId, unlocked: true },
        this.carCustomization,
        mapMeta.surfaceGrip,
        this.worldObjects.colliders,
        this.worldObjects.ramps,
        this.worldObjects.clippingPoints,
        () => {
          // Backfire trigger
          if (this.carMeshes) {
            const lEx = this.carMeshes.exhaustLeft.clone().applyMatrix4(this.carMeshes.root.matrixWorld);
            const rEx = this.carMeshes.exhaustRight.clone().applyMatrix4(this.carMeshes.root.matrixWorld);
            this.particles.triggerBackfire(lEx, rEx, this.carMeshes.root.quaternion);
          }
        }
      );

      // 2. Apply physics to 3D car meshes
      this.physics.applyToMeshes(this.carMeshes);

      // 3. Move key directional light with car to cast crisp shadows
      this.dirLight.position.set(
        this.physics.position.x + 18,
        this.physics.position.y + 24,
        this.physics.position.z + 18
      );
      this.dirLight.target.position.copy(this.physics.position);
      this.dirLight.target.updateMatrixWorld();

      // 4. Tire Smoke Emission & Skid Marks
      const isSlipping = this.physics.lateralSlipSpeed > 2.0 || this.inputs.handbrake;
      if (isSlipping && this.physics.isGrounded && this.physics.speedKmh > 10) {
        // Emit from rear tires
        const rlPos = new THREE.Vector3(-0.84, 0.2, -1.3).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.physics.rotationY).add(this.physics.position);
        const rrPos = new THREE.Vector3(0.84, 0.2, -1.3).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.physics.rotationY).add(this.physics.position);

        this.particles.emitSmoke(rlPos, this.carCustomization.smokeColor, 2);
        this.particles.emitSmoke(rrPos, this.carCustomization.smokeColor, 2);
        this.particles.addSkidMark(rlPos, rrPos);
      } else {
        this.particles.endSkidMark();
      }

      // Update particles
      this.particles.update(dt);

      // 5. Dynamic Camera Smoothing
      this.updateCamera(dt);

      // 6. Notify HUD callbacks
      if (this.onDriftUpdate) {
        this.onDriftUpdate(this.physics);
      }
    }

    // Render frame
    this.renderer.render(this.scene, this.camera);

    // Software WebGL pacing
    if (this.isSoftwareGl) {
      this.afterDraw(() => this.tick(performance.now()));
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  private updateCamera(dt: number) {
    const carPos = this.physics.position;
    const carHeading = this.physics.rotationY;

    // Calculate camera target offset
    let targetPos = new THREE.Vector3();
    let lookTarget = new THREE.Vector3();

    if (this.currentCameraMode === 'chase') {
      // Dynamic Drift Follow Cam:
      // The camera subtly swings outward in the direction of the drift so the player can see
      // their car angle in all its glory!
      const driftSwayAngle = THREE.MathUtils.clamp(-this.physics.slipAngleDeg * 0.015, -0.6, 0.6);
      const camHeading = carHeading + driftSwayAngle;

      const camDist = 6.8;
      const camHeight = 2.4;
      targetPos.set(
        carPos.x - Math.sin(camHeading) * camDist,
        carPos.y + camHeight,
        carPos.z - Math.cos(camHeading) * camDist
      );
      lookTarget.set(
        carPos.x + Math.sin(carHeading) * 3.5,
        carPos.y + 1.1,
        carPos.z + Math.cos(carHeading) * 3.5
      );
    } else if (this.currentCameraMode === 'close') {
      const camDist = 5.0;
      const camHeight = 1.8;
      targetPos.set(
        carPos.x - Math.sin(carHeading) * camDist,
        carPos.y + camHeight,
        carPos.z - Math.cos(carHeading) * camDist
      );
      lookTarget.set(carPos.x, carPos.y + 0.9, carPos.z);
    } else if (this.currentCameraMode === 'hood') {
      // Hood bumper camera (intense sense of velocity)
      targetPos.set(
        carPos.x + Math.sin(carHeading) * 0.8,
        carPos.y + 0.95,
        carPos.z + Math.cos(carHeading) * 0.8
      );
      lookTarget.set(
        carPos.x + Math.sin(carHeading) * 15,
        carPos.y + 0.9,
        carPos.z + Math.cos(carHeading) * 15
      );
    } else {
      // Orbit / Drone Cam
      this.orbitAngle += dt * 0.35;
      const orbitDist = 8.5;
      targetPos.set(
        carPos.x + Math.sin(this.orbitAngle) * orbitDist,
        carPos.y + 3.0,
        carPos.z + Math.cos(this.orbitAngle) * orbitDist
      );
      lookTarget.set(carPos.x, carPos.y + 0.8, carPos.z);
    }

    // Smooth exponential damping
    const camDampSpeed = this.currentCameraMode === 'hood' ? 24 : 10;
    this.cameraPosSmooth.lerp(targetPos, Math.min(1.0, dt * camDampSpeed));
    this.cameraLookSmooth.lerp(lookTarget, Math.min(1.0, dt * 14));

    this.camera.position.copy(this.cameraPosSmooth);
    this.camera.lookAt(this.cameraLookSmooth);
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.frameId = requestAnimationFrame(this.tick);
  }

  public stop() {
    this.isRunning = false;
    if (this.isSoftwareGl) {
      clearTimeout(this.frameId);
    } else {
      cancelAnimationFrame(this.frameId);
    }
  }

  public dispose() {
    this.stop();
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onWindowBlur);

    this.particles.dispose();
    this.renderer.dispose();
    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
