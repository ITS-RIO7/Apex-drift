import * as THREE from 'three';
import { CarId, CarCustomization } from '../types/game';

/**
 * Creates dynamic procedural textures for carbon fiber, tire treads, and brake discs
 * Zero 404s, completely procedural HTML5 canvas textures
 */
function createCarbonTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#181818';
  ctx.fillRect(0, 0, 64, 64);

  ctx.fillStyle = '#282828';
  for (let y = 0; y < 64; y += 8) {
    for (let x = 0; x < 64; x += 8) {
      if ((x / 8 + y / 8) % 2 === 0) {
        ctx.fillRect(x, y, 4, 8);
      } else {
        ctx.fillRect(x + 4, y, 4, 8);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createBrakeDiscTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Brushed steel radial
  const grad = ctx.createRadialGradient(64, 64, 20, 64, 64, 60);
  grad.addColorStop(0, '#555555');
  grad.addColorStop(0.5, '#bbbbbb');
  grad.addColorStop(1, '#666666');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  // Cross drilled ventilation holes
  ctx.fillStyle = '#1a1a1a';
  for (let r = 32; r <= 52; r += 7) {
    const count = Math.floor(r * 0.4);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = 64 + Math.cos(angle) * r;
      const y = 64 + Math.sin(angle) * r;
      ctx.beginPath();
      ctx.arc(x, y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 128, 256);
  const grad = ctx.createRadialGradient(64, 128, 20, 64, 128, 90);
  grad.addColorStop(0, 'rgba(0,0,0,0.85)');
  grad.addColorStop(0.6, 'rgba(0,0,0,0.4)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 256);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

const carbonTex = createCarbonTexture();
const brakeDiscTex = createBrakeDiscTexture();
const contactShadowTex = createContactShadowTexture();

export interface CarMeshes {
  root: THREE.Group;
  bodyMesh: THREE.Mesh;
  frontLeftWheel: THREE.Group;
  frontRightWheel: THREE.Group;
  rearLeftWheel: THREE.Group;
  rearRightWheel: THREE.Group;
  flTireMesh: THREE.Mesh;
  frTireMesh: THREE.Mesh;
  rlTireMesh: THREE.Mesh;
  rrTireMesh: THREE.Mesh;
  headlightL: THREE.Mesh;
  headlightR: THREE.Mesh;
  taillightL: THREE.Mesh;
  taillightR: THREE.Mesh;
  spoilerGroup: THREE.Group;
  exhaustLeft: THREE.Vector3;
  exhaustRight: THREE.Vector3;
  rimMaterials: THREE.MeshStandardMaterial[];
  bodyMaterial: THREE.MeshPhysicalMaterial;
}

/**
 * Builds a multi-part competition drift car with authentic brand styling
 */
export function buildCarModel(carId: CarId, custom: CarCustomization): CarMeshes {
  const root = new THREE.Group();
  root.name = 'CarRoot_' + carId;

  // Material setup
  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(custom.bodyColor),
    metalness: custom.finish === 'metallic' ? 0.9 : custom.finish === 'matte' ? 0.1 : 0.6,
    roughness: custom.finish === 'matte' ? 0.8 : custom.finish === 'metallic' ? 0.2 : 0.15,
    clearcoat: custom.finish === 'matte' ? 0.0 : 1.0,
    clearcoatRoughness: 0.1,
  });

  const carbonMaterial = new THREE.MeshStandardMaterial({
    map: carbonTex,
    color: 0x222222,
    roughness: 0.35,
    metalness: 0.4,
  });

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x111620,
    metalness: 0.1,
    roughness: 0.1,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });

  const rimMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(custom.rimColor),
    metalness: 0.92,
    roughness: 0.18,
  });

  const tireMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.85,
    metalness: 0.05,
  });

  const brakeRotorMat = new THREE.MeshStandardMaterial({
    map: brakeDiscTex,
    metalness: 0.95,
    roughness: 0.2,
  });

  const brakeCaliperMat = new THREE.MeshStandardMaterial({
    color: 0x0066cc, // M-Sport Electric Blue caliper
    metalness: 0.7,
    roughness: 0.3,
  });

  const chromeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.98,
    roughness: 0.05,
  });

  const blackPlasticsMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.7,
    metalness: 0.1,
  });

  const headLightEmissionMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xddeeff,
    emissiveIntensity: 2.5,
    roughness: 0.1,
  });

  const tailLightEmissionMat = new THREE.MeshStandardMaterial({
    color: 0xff2222,
    emissive: 0xff1111,
    emissiveIntensity: 2.2,
    roughness: 0.2,
  });

  // Base dimensions
  const carWidth = 1.95;
  const carLength = 4.45;
  const carHeight = 1.15;
  const wheelbase = 2.65;
  const trackWidth = 1.68;
  const groundOffset = 0.32;

  // 1. CAR BODY GROUP
  const bodyGroup = new THREE.Group();
  bodyGroup.position.y = groundOffset;

  // Primary lower chassis
  const lowerChassisGeo = new THREE.BoxGeometry(carWidth * 0.94, 0.35, carLength);
  const lowerChassis = new THREE.Mesh(lowerChassisGeo, bodyMaterial);
  lowerChassis.position.y = 0.2;
  lowerChassis.castShadow = true;
  lowerChassis.receiveShadow = true;
  bodyGroup.add(lowerChassis);

  // Sculpted hood
  const hoodGeo = new THREE.BoxGeometry(carWidth * 0.88, 0.15, 1.4);
  const hoodMesh = new THREE.Mesh(hoodGeo, bodyMaterial);
  hoodMesh.position.set(0, 0.4, 0.95);
  hoodMesh.rotation.x = 0.06;
  hoodMesh.castShadow = true;
  bodyGroup.add(hoodMesh);

  // Cabin / Greenhouse
  const cabinWidth = carWidth * 0.78;
  const cabinLength = carLength * 0.48;
  const cabinHeight = 0.58;
  const cabinGeo = new THREE.BoxGeometry(cabinWidth, cabinHeight, cabinLength);
  const cabinMesh = new THREE.Mesh(cabinGeo, bodyMaterial);
  cabinMesh.position.set(0, 0.65, -0.2);
  cabinMesh.castShadow = true;
  bodyGroup.add(cabinMesh);

  // Windshield & Windows
  const windshieldGeo = new THREE.BoxGeometry(cabinWidth * 0.96, cabinHeight * 0.85, 0.08);
  const windshieldMesh = new THREE.Mesh(windshieldGeo, glassMaterial);
  windshieldMesh.position.set(0, 0.68, 0.85);
  windshieldMesh.rotation.x = -0.6;
  bodyGroup.add(windshieldMesh);

  const rearGlassGeo = new THREE.BoxGeometry(cabinWidth * 0.94, cabinHeight * 0.8, 0.08);
  const rearGlassMesh = new THREE.Mesh(rearGlassGeo, glassMaterial);
  rearGlassMesh.position.set(0, 0.66, -1.25);
  rearGlassMesh.rotation.x = 0.55;
  bodyGroup.add(rearGlassMesh);

  // Carbon Roof
  const roofGeo = new THREE.BoxGeometry(cabinWidth * 0.96, 0.04, cabinLength * 0.7);
  const roofMesh = new THREE.Mesh(roofGeo, carbonMaterial);
  roofMesh.position.set(0, 0.95, -0.2);
  roofMesh.castShadow = true;
  bodyGroup.add(roofMesh);

  // Rear Trunk Deck
  const trunkGeo = new THREE.BoxGeometry(carWidth * 0.86, 0.18, 0.95);
  const trunkMesh = new THREE.Mesh(trunkGeo, bodyMaterial);
  trunkMesh.position.set(0, 0.38, -1.65);
  trunkMesh.castShadow = true;
  bodyGroup.add(trunkMesh);

  // Widebody Fender Flares
  const flareGeo = new THREE.BoxGeometry(0.12, 0.28, 0.75);
  const flFlare = new THREE.Mesh(flareGeo, bodyMaterial);
  flFlare.position.set(-carWidth * 0.48, 0.24, wheelbase * 0.5);
  const frFlare = flFlare.clone();
  frFlare.position.x = carWidth * 0.48;
  const rlFlare = flFlare.clone();
  rlFlare.position.set(-carWidth * 0.49, 0.25, -wheelbase * 0.5);
  const rrFlare = flFlare.clone();
  rrFlare.position.set(carWidth * 0.49, 0.25, -wheelbase * 0.5);
  bodyGroup.add(flFlare, frFlare, rlFlare, rrFlare);

  // Carbon Front Splitter
  const splitterGeo = new THREE.BoxGeometry(carWidth * 0.96, 0.04, 0.45);
  const splitterMesh = new THREE.Mesh(splitterGeo, carbonMaterial);
  splitterMesh.position.set(0, 0.04, carLength * 0.48 + 0.1);
  bodyGroup.add(splitterMesh);

  // Carbon Side Skirts
  const skirtGeo = new THREE.BoxGeometry(0.06, 0.05, wheelbase * 0.9);
  const lSkirt = new THREE.Mesh(skirtGeo, carbonMaterial);
  lSkirt.position.set(-carWidth * 0.47, 0.05, 0);
  const rSkirt = lSkirt.clone();
  rSkirt.position.x = carWidth * 0.47;
  bodyGroup.add(lSkirt, rSkirt);

  // 2. FRONT BUMPER & BRAND-SPECIFIC GRILLE
  if (carId === 'bmw_m4' || carId === 'bmw_e30') {
    // BMW ICONIC TWIN KIDNEY GRILLE
    const isM4 = carId === 'bmw_m4';
    const kidneyWidth = isM4 ? 0.22 : 0.18;
    const kidneyHeight = isM4 ? 0.32 : 0.16;
    const kidneyDepth = 0.05;

    // Left kidney frame
    const kidneyFrameGeo = new THREE.BoxGeometry(kidneyWidth, kidneyHeight, kidneyDepth);
    const leftKidney = new THREE.Mesh(kidneyFrameGeo, isM4 ? blackPlasticsMat : chromeMaterial);
    leftKidney.position.set(-kidneyWidth * 0.65, 0.26, carLength * 0.5 + 0.01);

    // Right kidney frame
    const rightKidney = new THREE.Mesh(kidneyFrameGeo, isM4 ? blackPlasticsMat : chromeMaterial);
    rightKidney.position.set(kidneyWidth * 0.65, 0.26, carLength * 0.5 + 0.01);

    // Kidney vertical slats
    for (let s = -2; s <= 2; s++) {
      const slatGeo = new THREE.BoxGeometry(0.015, kidneyHeight * 0.85, 0.06);
      const lSlat = new THREE.Mesh(slatGeo, blackPlasticsMat);
      lSlat.position.set(-kidneyWidth * 0.65 + s * 0.035, 0.26, carLength * 0.5 + 0.02);
      const rSlat = new THREE.Mesh(slatGeo, blackPlasticsMat);
      rSlat.position.set(kidneyWidth * 0.65 + s * 0.035, 0.26, carLength * 0.5 + 0.02);
      bodyGroup.add(lSlat, rSlat);
    }

    bodyGroup.add(leftKidney, rightKidney);
  } else {
    // JDM / Apex central intercooler mesh grille
    const grillGeo = new THREE.BoxGeometry(0.7, 0.18, 0.06);
    const grillMesh = new THREE.Mesh(grillGeo, blackPlasticsMat);
    grillMesh.position.set(0, 0.18, carLength * 0.5 + 0.01);
    bodyGroup.add(grillMesh);
  }

  // 3. HEADLIGHTS
  const hlWidth = carId === 'bmw_e30' ? 0.12 : 0.32;
  const hlHeight = carId === 'bmw_e30' ? 0.12 : 0.1;
  const hlGeo = carId === 'bmw_e30' 
    ? new THREE.CylinderGeometry(0.08, 0.08, 0.06, 16) 
    : new THREE.BoxGeometry(hlWidth, hlHeight, 0.1);

  if (carId === 'bmw_e30') {
    hlGeo.rotateX(Math.PI / 2);
  }

  const headlightL = new THREE.Mesh(hlGeo, headLightEmissionMat);
  headlightL.position.set(-carWidth * 0.35, 0.34, carLength * 0.49);
  const headlightR = new THREE.Mesh(hlGeo.clone(), headLightEmissionMat);
  headlightR.position.set(carWidth * 0.35, 0.34, carLength * 0.49);
  bodyGroup.add(headlightL, headlightR);

  // If E30, add second pair of round lights
  if (carId === 'bmw_e30') {
    const hlL2 = headlightL.clone();
    hlL2.position.x = -carWidth * 0.22;
    const hlR2 = headlightR.clone();
    hlR2.position.x = carWidth * 0.22;
    bodyGroup.add(hlL2, hlR2);
  }

  // 4. TAILLIGHTS
  const tlGeo = new THREE.BoxGeometry(0.35, 0.1, 0.06);
  const taillightL = new THREE.Mesh(tlGeo, tailLightEmissionMat);
  taillightL.position.set(-carWidth * 0.34, 0.42, -carLength * 0.5);
  const taillightR = taillightL.clone();
  taillightR.position.x = carWidth * 0.34;
  bodyGroup.add(taillightL, taillightR);

  // 5. REAR DIFFUSER & QUAD EXHAUST
  const diffuserGeo = new THREE.BoxGeometry(carWidth * 0.8, 0.14, 0.3);
  const diffuserMesh = new THREE.Mesh(diffuserGeo, carbonMaterial);
  diffuserMesh.position.set(0, 0.12, -carLength * 0.48);
  bodyGroup.add(diffuserMesh);

  // Polished chrome exhaust pipes (Bavarian quad tips)
  const pipeGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.18, 16);
  pipeGeo.rotateX(Math.PI / 2);

  const exhaustPipes = [-0.38, -0.28, 0.28, 0.38];
  exhaustPipes.forEach((posX) => {
    const pipe = new THREE.Mesh(pipeGeo, chromeMaterial);
    pipe.position.set(posX, 0.12, -carLength * 0.51);
    bodyGroup.add(pipe);
  });

  // Exhaust positions in world coords for backfire particles
  const exhaustLeft = new THREE.Vector3(-0.33, groundOffset + 0.12, -carLength * 0.52);
  const exhaustRight = new THREE.Vector3(0.33, groundOffset + 0.12, -carLength * 0.52);

  // 6. GT DRIFT SPOILER
  const spoilerGroup = new THREE.Group();
  if (custom.spoilerStyle === 'gt_wing') {
    // Big carbon drift wing on stanchions
    const uprightGeo = new THREE.BoxGeometry(0.03, 0.32, 0.12);
    const lUpright = new THREE.Mesh(uprightGeo, blackPlasticsMat);
    lUpright.position.set(-0.45, 0.58, -1.85);
    const rUpright = lUpright.clone();
    rUpright.position.x = 0.45;

    const bladeGeo = new THREE.BoxGeometry(carWidth * 0.95, 0.035, 0.32);
    const bladeMesh = new THREE.Mesh(bladeGeo, carbonMaterial);
    bladeMesh.position.set(0, 0.74, -1.86);
    bladeMesh.rotation.x = -0.1;
    bladeMesh.castShadow = true;

    // Endplates
    const endplateGeo = new THREE.BoxGeometry(0.02, 0.18, 0.38);
    const lPlate = new THREE.Mesh(endplateGeo, carbonMaterial);
    lPlate.position.set(-carWidth * 0.475, 0.74, -1.86);
    const rPlate = lPlate.clone();
    rPlate.position.x = carWidth * 0.475;

    spoilerGroup.add(lUpright, rUpright, bladeMesh, lPlate, rPlate);
  } else if (custom.spoilerStyle === 'ducktail') {
    // Sleek ducktail spoiler
    const ducktailGeo = new THREE.BoxGeometry(carWidth * 0.75, 0.12, 0.15);
    const ducktailMesh = new THREE.Mesh(ducktailGeo, carbonMaterial);
    ducktailMesh.position.set(0, 0.48, -1.95);
    ducktailMesh.rotation.x = -0.4;
    spoilerGroup.add(ducktailMesh);
  }
  bodyGroup.add(spoilerGroup);

  // Add body group to car root
  root.add(bodyGroup);

  // 7. SOFT RADIAL CONTACT SHADOW
  const shadowGeo = new THREE.PlaneGeometry(carWidth * 1.4, carLength * 1.3);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: contactShadowTex,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.02; // flush above ground
  root.add(shadowMesh);

  // 8. WHEELS (Assembly of tire, 5-spoke rim, drilled disc, brake caliper)
  const wheelRadius = 0.34;
  const wheelWidth = 0.26;
  const rimMaterials: THREE.MeshStandardMaterial[] = [rimMaterial];

  function buildWheelAssembly(isFront: boolean): { wheelGroup: THREE.Group; tireMesh: THREE.Mesh } {
    const wheelGroup = new THREE.Group();

    // Tire
    const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 24);
    tireGeo.rotateZ(Math.PI / 2);
    const tireMesh = new THREE.Mesh(tireGeo, tireMaterial);
    tireMesh.castShadow = true;
    wheelGroup.add(tireMesh);

    // Rim Outer Lip
    const lipGeo = new THREE.TorusGeometry(wheelRadius * 0.76, 0.025, 12, 24);
    const lipMesh = new THREE.Mesh(lipGeo, rimMaterial);
    lipMesh.position.x = wheelWidth * 0.42;
    wheelGroup.add(lipMesh);

    // Center Hub
    const hubGeo = new THREE.CylinderGeometry(wheelRadius * 0.22, wheelRadius * 0.22, wheelWidth * 0.9, 16);
    hubGeo.rotateZ(Math.PI / 2);
    const hubMesh = new THREE.Mesh(hubGeo, rimMaterial);
    wheelGroup.add(hubMesh);

    // 5 Spokes
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const spokeGeo = new THREE.BoxGeometry(0.04, wheelRadius * 0.6, 0.03);
      const spoke = new THREE.Mesh(spokeGeo, rimMaterial);
      spoke.position.set(wheelWidth * 0.4, Math.sin(angle) * wheelRadius * 0.42, Math.cos(angle) * wheelRadius * 0.42);
      spoke.rotation.x = angle;
      wheelGroup.add(spoke);
    }

    // Drilled Brake Rotor inside wheel
    const rotorGeo = new THREE.CylinderGeometry(wheelRadius * 0.68, wheelRadius * 0.68, 0.02, 20);
    rotorGeo.rotateZ(Math.PI / 2);
    const rotorMesh = new THREE.Mesh(rotorGeo, brakeRotorMat);
    rotorMesh.position.x = wheelWidth * 0.1;
    wheelGroup.add(rotorMesh);

    // Brake Caliper
    const caliperGeo = new THREE.BoxGeometry(0.08, 0.16, 0.1);
    const caliperMesh = new THREE.Mesh(caliperGeo, brakeCaliperMat);
    caliperMesh.position.set(wheelWidth * 0.1, wheelRadius * 0.45, 0);
    wheelGroup.add(caliperMesh);

    return { wheelGroup, tireMesh };
  }

  // Create 4 wheels
  const fl = buildWheelAssembly(true);
  const fr = buildWheelAssembly(true);
  const rl = buildWheelAssembly(false);
  const rr = buildWheelAssembly(false);

  // Position wheels
  const halfTrack = trackWidth * 0.5;
  const halfWheelbase = wheelbase * 0.5;

  fl.wheelGroup.position.set(-halfTrack, wheelRadius, halfWheelbase);
  fr.wheelGroup.position.set(halfTrack, wheelRadius, halfWheelbase);
  fr.wheelGroup.rotation.y = Math.PI; // Mirror right side

  rl.wheelGroup.position.set(-halfTrack, wheelRadius, -halfWheelbase);
  rr.wheelGroup.position.set(halfTrack, wheelRadius, -halfWheelbase);
  rr.wheelGroup.rotation.y = Math.PI;

  root.add(fl.wheelGroup, fr.wheelGroup, rl.wheelGroup, rr.wheelGroup);

  return {
    root,
    bodyMesh: lowerChassis,
    frontLeftWheel: fl.wheelGroup,
    frontRightWheel: fr.wheelGroup,
    rearLeftWheel: rl.wheelGroup,
    rearRightWheel: rr.wheelGroup,
    flTireMesh: fl.tireMesh,
    frTireMesh: fr.tireMesh,
    rlTireMesh: rl.tireMesh,
    rrTireMesh: rr.tireMesh,
    headlightL,
    headlightR,
    taillightL,
    taillightR,
    spoilerGroup,
    exhaustLeft,
    exhaustRight,
    rimMaterials,
    bodyMaterial,
  };
}

export const CAR_CATALOG: Record<CarId, {
  name: string;
  brand: string;
  year: string;
  description: string;
  topSpeed: number;
  acceleration: number;
  handling: number;
  driftEase: number;
  weight: number;
  horsepower: number;
  defaultColor: string;
  defaultRimColor: string;
  price: number;
}> = {
  bmw_m4: {
    name: 'Bavarian M4 Drift GT',
    brand: 'Bavaria M-Sport',
    year: '2024',
    description: 'Twin-turbo inline-6 beast with tuned limited-slip differential and aggressive kidney grille styling. Pure drift perfection.',
    topSpeed: 290,
    acceleration: 3.4,
    handling: 92,
    driftEase: 95,
    weight: 1580,
    horsepower: 680,
    defaultColor: '#1e40af', // Estoril Blue
    defaultRimColor: '#d4af37', // Matte Gold
    price: 0,
  },
  bmw_e30: {
    name: 'Bavarian E30 Classic King',
    brand: 'Bavaria Heritage',
    year: '1989',
    description: 'The legendary lightweight boxy coupe. Ultra-balanced chassis, high revving naturally aspirated engine, and instant slide control.',
    topSpeed: 255,
    acceleration: 4.1,
    handling: 96,
    driftEase: 90,
    weight: 1140,
    horsepower: 490,
    defaultColor: '#dc2626', // Alpine Red
    defaultRimColor: '#silver',
    price: 15000,
  },
  silvia_s15: {
    name: 'Silvia S-Drift Spec-R',
    brand: 'Nippon Performance',
    year: '2002',
    description: 'The undisputed Touge drift icon. SR20DET turbo punch, high steering lock angle, and effortless transition snaps.',
    topSpeed: 275,
    acceleration: 3.8,
    handling: 94,
    driftEase: 98,
    weight: 1220,
    horsepower: 540,
    defaultColor: '#f59e0b', // Sunset Pearl
    defaultRimColor: '#111827', // Gloss Black
    price: 28000,
  },
  apex_gt: {
    name: 'Apex GT Hyper-Slide',
    brand: 'Apex Racing Division',
    year: '2025',
    description: 'Carbon-chassis hyper drift concept. Extreme downforce, 850 horsepower twin-turbo V8, and razor-sharp throttle control.',
    topSpeed: 330,
    acceleration: 2.8,
    handling: 90,
    driftEase: 92,
    weight: 1350,
    horsepower: 850,
    defaultColor: '#059669', // Emerald Neon
    defaultRimColor: '#b45309', // Bronze
    price: 50000,
  },
};
