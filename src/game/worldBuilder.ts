import * as THREE from 'three';
import { MapId, ClippingPoint } from '../types/game';

export interface WorldObjects {
  group: THREE.Group;
  clippingPoints: ClippingPoint[];
  colliders: { box: THREE.Box3; type: 'wall' | 'prop' | 'ramp' }[];
  ramps: { box: THREE.Box3; normal: THREE.Vector3; boost: number }[];
  spawnPoint: { x: number; y: number; z: number; heading: number };
}

/**
 * Procedural asphalt texture with road markings and subtle surface noise
 */
function createAsphaltTexture(gridMarkings: boolean = true): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Dark asphalt base
  ctx.fillStyle = '#1c1f24';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle aggregate speckles
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const gray = Math.floor(25 + Math.random() * 25);
    ctx.fillStyle = `rgb(${gray},${gray},${gray})`;
    ctx.fillRect(x, y, 2, 2);
  }

  if (gridMarkings) {
    // Subtle lane dashed grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 4;
    ctx.setLineDash([24, 24]);
    ctx.beginPath();
    ctx.moveTo(256, 0);
    ctx.lineTo(256, 512);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(24, 24);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural Kerb Texture (Red and White alternating racing kerbs)
 */
function createKerbTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#dc2626'; // Red
  ctx.fillRect(0, 0, 64, 32);
  ctx.fillStyle = '#f8fafc'; // White
  ctx.fillRect(64, 0, 64, 32);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 1);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural Neon Billboard Texture
 */
function createNeonSignTexture(text: string, color: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0a0f1d';
  ctx.fillRect(0, 0, 512, 128);

  ctx.strokeStyle = color;
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 496, 112);

  ctx.fillStyle = color;
  ctx.font = 'bold 52px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function buildWorld(mapId: MapId): WorldObjects {
  const group = new THREE.Group();
  group.name = 'World_' + mapId;

  const clippingPoints: ClippingPoint[] = [];
  const colliders: { box: THREE.Box3; type: 'wall' | 'prop' | 'ramp' }[] = [];
  const ramps: { box: THREE.Box3; normal: THREE.Vector3; boost: number }[] = [];
  let spawnPoint = { x: 0, y: 0.35, z: 0, heading: 0 };

  const asphaltTex = createAsphaltTexture();
  const kerbTex = createKerbTexture();

  // Materials
  const asphaltMat = new THREE.MeshStandardMaterial({
    map: asphaltTex,
    roughness: 0.88,
    metalness: 0.1,
  });

  const kerbMat = new THREE.MeshStandardMaterial({
    map: kerbTex,
    roughness: 0.7,
    metalness: 0.1,
  });

  const guardrailMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.85,
    roughness: 0.25,
  });

  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.9,
    metalness: 0.05,
  });

  if (mapId === 'city') {
    // ---------------------------------------------------------
    // MAP 1: NIGHT CYBER METROPOLIS (Open World City)
    // ---------------------------------------------------------
    spawnPoint = { x: 0, y: 0.35, z: 50, heading: 0 };

    // Massive ground plane
    const groundGeo = new THREE.PlaneGeometry(800, 800);
    const ground = new THREE.Mesh(groundGeo, asphaltMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    group.add(ground);

    // City Grid & Skyscrapers using InstancedMesh
    const buildingGeo = new THREE.BoxGeometry(1, 1, 1);
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.4,
      metalness: 0.8,
    });

    const windowGlowMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
    });

    const buildingCount = 64;
    const instancedBuildings = new THREE.InstancedMesh(buildingGeo, buildingMat, buildingCount);
    instancedBuildings.castShadow = true;
    instancedBuildings.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let bIndex = 0;

    // Outer city perimeter blocks
    const blockPositions = [
      // Left blocks
      [-120, -120], [-120, -40], [-120, 40], [-120, 120],
      [-180, -120], [-180, -40], [-180, 40], [-180, 120],
      // Right blocks
      [120, -120], [120, -40], [120, 40], [120, 120],
      [180, -120], [180, -40], [180, 40], [180, 120],
      // North blocks
      [-40, -160], [40, -160], [-40, -220], [40, -220],
      // South blocks
      [-40, 160], [40, 160], [-40, 220], [40, 220],
      // Highway pillars / surrounds
      [-70, -70], [70, -70], [-70, 70], [70, 70],
      [-90, 0], [90, 0], [0, -90], [0, 90],
    ];

    blockPositions.forEach(([bx, bz]) => {
      if (bIndex >= buildingCount) return;
      const bw = 24 + (bIndex % 4) * 6;
      const bd = 24 + ((bIndex + 2) % 4) * 6;
      const bh = 40 + (bIndex % 7) * 15;

      dummy.position.set(bx, bh / 2, bz);
      dummy.scale.set(bw, bh, bd);
      dummy.updateMatrix();
      instancedBuildings.setMatrixAt(bIndex, dummy.matrix);

      // Add collider
      const box = new THREE.Box3();
      box.setFromCenterAndSize(
        new THREE.Vector3(bx, bh / 2, bz),
        new THREE.Vector3(bw, bh, bd)
      );
      colliders.push({ box, type: 'wall' });

      bIndex++;
    });

    instancedBuildings.instanceMatrix.needsUpdate = true;
    group.add(instancedBuildings);

    // Neon Overhead Arches across main boulevards
    const archMat1 = new THREE.MeshBasicMaterial({ map: createNeonSignTexture('APEX DRIFT 3D', '#06b6d4') });
    const archMat2 = new THREE.MeshBasicMaterial({ map: createNeonSignTexture('BAVARIA M-SPORT', '#3b82f6') });
    const archMat3 = new THREE.MeshBasicMaterial({ map: createNeonSignTexture('DRIFT ZONE // 360', '#f43f5e') });

    const archConfigs = [
      { pos: [0, 8, 100], rotY: 0, mat: archMat1 },
      { pos: [0, 8, -100], rotY: 0, mat: archMat2 },
      { pos: [100, 8, 0], rotY: Math.PI / 2, mat: archMat3 },
      { pos: [-100, 8, 0], rotY: Math.PI / 2, mat: archMat1 },
    ];

    archConfigs.forEach((ac, idx) => {
      const archGroup = new THREE.Group();
      archGroup.position.set(ac.pos[0], 0, ac.pos[2]);
      archGroup.rotation.y = ac.rotY;

      // Pillars
      const pillarGeo = new THREE.BoxGeometry(1, 9, 1);
      const lPillar = new THREE.Mesh(pillarGeo, concreteMat);
      lPillar.position.set(-16, 4.5, 0);
      const rPillar = lPillar.clone();
      rPillar.position.x = 16;

      // Top sign bar
      const signGeo = new THREE.BoxGeometry(34, 3.5, 1);
      const signMesh = new THREE.Mesh(signGeo, ac.mat);
      signMesh.position.set(0, 8, 0);

      archGroup.add(lPillar, rPillar, signMesh);
      group.add(archGroup);

      // Clipping points under arches!
      clippingPoints.push({
        id: idx,
        x: ac.pos[0],
        y: 0.5,
        z: ac.pos[2],
        radius: 8,
        points: 1500,
        active: true,
        hit: false,
      });
    });

    // Central Drift Plaza Skidpad with Donut Hub
    const donutHubGeo = new THREE.CylinderGeometry(4, 4, 1.2, 32);
    const donutHub = new THREE.Mesh(donutHubGeo, kerbMat);
    donutHub.position.set(0, 0.6, 0);
    donutHub.castShadow = true;
    group.add(donutHub);

    // Neon center tower
    const towerGeo = new THREE.CylinderGeometry(1.5, 1.5, 18, 16);
    const towerMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0284c7,
      emissiveIntensity: 1.8,
    });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(0, 9, 0);
    group.add(tower);

    // Add Donut Hub collider
    const donutCollider = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(8, 2, 8)
    );
    colliders.push({ box: donutCollider, type: 'wall' });

    // Stunt Jump Ramps
    const rampConfigs = [
      { pos: [0, 0, -50], rotY: 0 },
      { pos: [0, 0, 50], rotY: Math.PI },
      { pos: [-50, 0, 0], rotY: -Math.PI / 2 },
      { pos: [50, 0, 0], rotY: Math.PI / 2 },
    ];

    rampConfigs.forEach((rc) => {
      const rampGroup = new THREE.Group();
      rampGroup.position.set(rc.pos[0], 0, rc.pos[2]);
      rampGroup.rotation.y = rc.rotY;

      // Sloped wedge geometry
      const rampShape = new THREE.Shape();
      rampShape.moveTo(-3.5, 0);
      rampShape.lineTo(3.5, 0);
      rampShape.lineTo(3.5, 1.8);
      rampShape.lineTo(-3.5, 0);

      const rampGeo = new THREE.BoxGeometry(7, 1.8, 8);
      rampGeo.rotateX(0.22); // Tilt into ramp
      const rampMesh = new THREE.Mesh(rampGeo, kerbMat);
      rampMesh.position.set(0, 0.6, 0);
      rampMesh.castShadow = true;
      rampGroup.add(rampMesh);

      group.add(rampGroup);

      // Add to ramps array
      const rampBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(rc.pos[0], 0.9, rc.pos[2]),
        new THREE.Vector3(7, 1.8, 8)
      );
      ramps.push({
        box: rampBox,
        normal: new THREE.Vector3(0, 0.4, 0.9).applyAxisAngle(new THREE.Vector3(0, 1, 0), rc.rotY).normalize(),
        boost: 14,
      });
    });

    // Street Light Poles with dynamic pools of light
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.12, 8, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 });
    const lampBulbGeo = new THREE.SphereGeometry(0.3, 8, 8);
    const lampBulbMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

    const lightPositions = [
      [-20, 20], [20, 20], [-20, -20], [20, -20],
      [-20, 60], [20, 60], [-20, -60], [20, -60],
      [-60, 20], [-60, -20], [60, 20], [60, -20],
    ];

    lightPositions.forEach(([lx, lz]) => {
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(lx, 4, lz);
      pole.castShadow = true;

      const bulb = new THREE.Mesh(lampBulbGeo, lampBulbMat);
      bulb.position.set(lx, 8, lz);

      group.add(pole, bulb);

      // Soft point light
      const pLight = new THREE.PointLight(0xfffaed, 3.5, 30);
      pLight.position.set(lx, 7.5, lz);
      group.add(pLight);
    });

    // More clipping points around the city drift loops
    const cityClipPoints = [
      { x: -35, z: -35 }, { x: 35, z: -35 },
      { x: -35, z: 35 }, { x: 35, z: 35 },
      { x: -70, z: 0 }, { x: 70, z: 0 },
      { x: 0, z: -70 }, { x: 0, z: 70 },
    ];

    cityClipPoints.forEach((pt, i) => {
      clippingPoints.push({
        id: 10 + i,
        x: pt.x,
        y: 0.5,
        z: pt.z,
        radius: 9,
        points: 1200,
        active: true,
        hit: false,
      });
    });

  } else if (mapId === 'touge') {
    // ---------------------------------------------------------
    // MAP 2: AKINA MOUNTAIN PASS (Winding Downhill Hairpins)
    // ---------------------------------------------------------
    spawnPoint = { x: 0, y: 0.35, z: 180, heading: 0 };

    // Massive terrain base with canyon hills
    const mountainGeo = new THREE.PlaneGeometry(600, 600, 48, 48);
    const pos = mountainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      // Elevation contour hills
      const distFromCenter = Math.abs(vx);
      const hillHeight = Math.pow(distFromCenter / 120, 2) * 22;
      pos.setZ(i, hillHeight + Math.sin(vx * 0.05) * 5 + Math.cos(vy * 0.05) * 6);
    }
    mountainGeo.computeVertexNormals();

    const mountainMat = new THREE.MeshStandardMaterial({
      color: 0x15251a, // Dark alpine evergreen terrain
      roughness: 0.95,
      metalness: 0.05,
    });

    const mountain = new THREE.Mesh(mountainGeo, mountainMat);
    mountain.rotation.x = -Math.PI / 2;
    mountain.receiveShadow = true;
    group.add(mountain);

    // Winding S-Curves Touge Road Track
    // We construct a ribbon road through series of hairpins
    const curvePoints = [
      new THREE.Vector3(0, 0.1, 200),
      new THREE.Vector3(-30, 0.1, 140),
      new THREE.Vector3(40, 0.1, 80),
      new THREE.Vector3(-55, 0.1, 20),
      new THREE.Vector3(50, 0.1, -40),
      new THREE.Vector3(-45, 0.1, -100),
      new THREE.Vector3(30, 0.1, -160),
      new THREE.Vector3(0, 0.1, -210),
    ];

    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const roadWidth = 14;
    const roadSamples = 160;
    const roadPoints = curve.getSpacedPoints(roadSamples);

    const roadGeo = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const uvs: number[] = [];

    for (let i = 0; i < roadPoints.length; i++) {
      const p = roadPoints[i];
      const tangent = curve.getTangentAt(i / (roadPoints.length - 1));
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const left = p.clone().add(normal.clone().multiplyScalar(roadWidth * 0.5));
      const right = p.clone().add(normal.clone().multiplyScalar(-roadWidth * 0.5));

      vertices.push(left.x, left.y, left.z);
      vertices.push(right.x, right.y, right.z);

      const v = i / (roadPoints.length - 1) * 20;
      uvs.push(0, v, 1, v);
    }

    const indices: number[] = [];
    for (let i = 0; i < roadPoints.length - 1; i++) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2;
      const d = (i + 1) * 2 + 1;
      indices.push(a, b, c);
      indices.push(b, d, c);
    }

    roadGeo.setIndex(indices);
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    roadGeo.computeVertexNormals();

    const roadMesh = new THREE.Mesh(roadGeo, asphaltMat);
    roadMesh.receiveShadow = true;
    group.add(roadMesh);

    // Guardrails along both sides of mountain road
    const railGeo = new THREE.BoxGeometry(0.3, 0.9, 3);
    const railPostGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.9, 8);

    for (let i = 0; i < roadPoints.length; i += 2) {
      const p = roadPoints[i];
      const tangent = curve.getTangentAt(i / (roadPoints.length - 1));
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const leftRailPos = p.clone().add(normal.clone().multiplyScalar(roadWidth * 0.5 + 0.4));
      const rightRailPos = p.clone().add(normal.clone().multiplyScalar(-roadWidth * 0.5 - 0.4));

      const rotY = Math.atan2(tangent.x, tangent.z);

      // Left rail segment
      const lRail = new THREE.Mesh(railGeo, guardrailMat);
      lRail.position.set(leftRailPos.x, 0.45, leftRailPos.z);
      lRail.rotation.y = rotY;
      group.add(lRail);

      // Right rail segment
      const rRail = new THREE.Mesh(railGeo, guardrailMat);
      rRail.position.set(rightRailPos.x, 0.45, rightRailPos.z);
      rRail.rotation.y = rotY;
      group.add(rRail);

      // Add colliders on hairpin turns
      if (i % 6 === 0) {
        colliders.push({
          box: new THREE.Box3().setFromCenterAndSize(
            new THREE.Vector3(leftRailPos.x, 0.5, leftRailPos.z),
            new THREE.Vector3(2, 1, 2)
          ),
          type: 'wall',
        });
        colliders.push({
          box: new THREE.Box3().setFromCenterAndSize(
            new THREE.Vector3(rightRailPos.x, 0.5, rightRailPos.z),
            new THREE.Vector3(2, 1, 2)
          ),
          type: 'wall',
        });
      }
    }

    // Hairpin Apex Clipping Points
    const hairpinApexes = [
      { x: -30, z: 140, pts: 2000 },
      { x: 40, z: 80, pts: 2200 },
      { x: -55, z: 20, pts: 2500 },
      { x: 50, z: -40, pts: 2400 },
      { x: -45, z: -100, pts: 2200 },
      { x: 30, z: -160, pts: 2000 },
    ];

    hairpinApexes.forEach((ha, idx) => {
      clippingPoints.push({
        id: 200 + idx,
        x: ha.x,
        y: 0.5,
        z: ha.z,
        radius: 9,
        points: ha.pts,
        active: true,
        hit: false,
      });
    });

    // Japanese Mountain Pine & Cherry Blossom Trees (InstancedMesh)
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 4, 8);
    const foliageGeo = new THREE.ConeGeometry(2.4, 5, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.8 });

    const treeCount = 70;
    const instancedTrunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
    const instancedFoliage = new THREE.InstancedMesh(foliageGeo, foliageMat, treeCount);
    instancedTrunks.castShadow = true;
    instancedFoliage.castShadow = true;

    const dummyT = new THREE.Object3D();
    const dummyF = new THREE.Object3D();

    for (let t = 0; t < treeCount; t++) {
      const side = (t % 2 === 0 ? 1 : -1);
      const angle = (t / treeCount) * Math.PI * 4;
      const tx = side * (25 + Math.random() * 65);
      const tz = -180 + (t / treeCount) * 380;
      const ty = 0;

      dummyT.position.set(tx, ty + 2, tz);
      dummyT.updateMatrix();
      instancedTrunks.setMatrixAt(t, dummyT.matrix);

      dummyF.position.set(tx, ty + 5.5, tz);
      dummyF.updateMatrix();
      instancedFoliage.setMatrixAt(t, dummyF.matrix);
    }

    instancedTrunks.instanceMatrix.needsUpdate = true;
    instancedFoliage.instanceMatrix.needsUpdate = true;
    group.add(instancedTrunks, instancedFoliage);

  } else if (mapId === 'docklands') {
    // ---------------------------------------------------------
    // MAP 3: INDUSTRIAL DOCKLANDS DRIFT ARENA
    // ---------------------------------------------------------
    spawnPoint = { x: 0, y: 0.35, z: 60, heading: 0 };

    // Huge concrete pad
    const dockGroundGeo = new THREE.PlaneGeometry(600, 600);
    const dockGround = new THREE.Mesh(dockGroundGeo, concreteMat);
    dockGround.rotation.x = -Math.PI / 2;
    dockGround.receiveShadow = true;
    group.add(dockGround);

    // Red & Blue Shipping Containers (InstancedMesh)
    const containerGeo = new THREE.BoxGeometry(6, 6, 15);
    const redContainerMat = new THREE.MeshStandardMaterial({
      color: 0xb91c1c, // Rust Red
      roughness: 0.7,
      metalness: 0.3,
    });
    const blueContainerMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8, // Port Blue
      roughness: 0.7,
      metalness: 0.3,
    });

    const containerPlacements = [
      // Left maze chicane
      { x: -35, z: -40, rot: 0, mat: redContainerMat },
      { x: -35, z: -20, rot: 0, mat: blueContainerMat },
      { x: -35, z: 20, rot: 0, mat: redContainerMat },
      { x: -35, z: 40, rot: 0, mat: blueContainerMat },
      // Stacked 2nd story
      { x: -35, z: -30, rot: 0, y: 6, mat: blueContainerMat },
      { x: -35, z: 30, rot: 0, y: 6, mat: redContainerMat },

      // Right maze chicane
      { x: 35, z: -40, rot: 0, mat: blueContainerMat },
      { x: 35, z: -20, rot: 0, mat: redContainerMat },
      { x: 35, z: 20, rot: 0, mat: blueContainerMat },
      { x: 35, z: 40, rot: 0, mat: redContainerMat },
      { x: 35, z: -30, rot: 0, y: 6, mat: redContainerMat },
      { x: 35, z: 30, rot: 0, y: 6, mat: blueContainerMat },

      // Horizontal barriers
      { x: 0, z: -100, rot: Math.PI / 2, mat: redContainerMat },
      { x: -16, z: -100, rot: Math.PI / 2, mat: blueContainerMat },
      { x: 16, z: -100, rot: Math.PI / 2, mat: redContainerMat },

      { x: 0, z: 100, rot: Math.PI / 2, mat: blueContainerMat },
      { x: -16, z: 100, rot: Math.PI / 2, mat: redContainerMat },
      { x: 16, z: 100, rot: Math.PI / 2, mat: blueContainerMat },
    ];

    containerPlacements.forEach((cp) => {
      const cMesh = new THREE.Mesh(containerGeo, cp.mat);
      cMesh.position.set(cp.x, (cp.y || 0) + 3, cp.z);
      cMesh.rotation.y = cp.rot;
      cMesh.castShadow = true;
      cMesh.receiveShadow = true;
      group.add(cMesh);

      const size = cp.rot === 0 ? new THREE.Vector3(6.5, 6.5, 15.5) : new THREE.Vector3(15.5, 6.5, 6.5);
      colliders.push({
        box: new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(cp.x, (cp.y || 0) + 3, cp.z),
          size
        ),
        type: 'wall',
      });
    });

    // Giant Port Gantry Cranes
    const craneMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.3 });
    const craneGeo = new THREE.BoxGeometry(4, 30, 4);
    const craneBeamGeo = new THREE.BoxGeometry(70, 4, 4);

    [-80, 80].forEach((cx) => {
      const leg1 = new THREE.Mesh(craneGeo, craneMat);
      leg1.position.set(cx, 15, -40);
      const leg2 = new THREE.Mesh(craneGeo, craneMat);
      leg2.position.set(cx, 15, 40);
      const topBeam = new THREE.Mesh(craneBeamGeo, craneMat);
      topBeam.position.set(cx > 0 ? cx - 15 : cx + 15, 30, 0);
      topBeam.rotation.y = Math.PI / 2;

      group.add(leg1, leg2, topBeam);
    });

    // Stunt Jump Ramp over shipping container alley
    const dockRampGeo = new THREE.BoxGeometry(8, 2.5, 10);
    dockRampGeo.rotateX(0.25);
    const dockRamp = new THREE.Mesh(dockRampGeo, kerbMat);
    dockRamp.position.set(0, 1.2, 0);
    dockRamp.castShadow = true;
    group.add(dockRamp);

    ramps.push({
      box: new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(0, 1.2, 0), new THREE.Vector3(8, 2.5, 10)),
      normal: new THREE.Vector3(0, 0.45, 0.89),
      boost: 16,
    });

    // Donut obstacle barrels
    const barrelGeo = new THREE.CylinderGeometry(1.2, 1.2, 2.5, 16);
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.5 });
    const barrelPositions = [
      [-15, -60], [15, -60],
      [-15, 60], [15, 60],
      [-60, 0], [60, 0],
    ];

    barrelPositions.forEach(([bx, bz], bIdx) => {
      const barrel = new THREE.Mesh(barrelGeo, barrelMat);
      barrel.position.set(bx, 1.25, bz);
      barrel.castShadow = true;
      group.add(barrel);

      clippingPoints.push({
        id: 300 + bIdx,
        x: bx,
        y: 0.5,
        z: bz,
        radius: 8,
        points: 1500,
        active: true,
        hit: false,
      });
    });

  } else {
    // ---------------------------------------------------------
    // MAP 4: PRO APEX DRIFT CIRCUIT
    // ---------------------------------------------------------
    spawnPoint = { x: 0, y: 0.35, z: 90, heading: 0 };

    // Big green grass field
    const grassGeo = new THREE.PlaneGeometry(700, 700);
    const grassMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.95 });
    const grass = new THREE.Mesh(grassGeo, grassMat);
    grass.rotation.x = -Math.PI / 2;
    grass.receiveShadow = true;
    group.add(grass);

    // Oval circuit track with sweeping turns
    const trackPoints = [
      new THREE.Vector3(0, 0.08, 120),
      new THREE.Vector3(70, 0.08, 90),
      new THREE.Vector3(110, 0.08, 0),
      new THREE.Vector3(70, 0.08, -90),
      new THREE.Vector3(0, 0.08, -120),
      new THREE.Vector3(-70, 0.08, -90),
      new THREE.Vector3(-110, 0.08, 0),
      new THREE.Vector3(-70, 0.08, 90),
      new THREE.Vector3(0, 0.08, 120),
    ];

    const circuitCurve = new THREE.CatmullRomCurve3(trackPoints, true);
    const circuitSamples = 180;
    const cPoints = circuitCurve.getSpacedPoints(circuitSamples);
    const cRoadWidth = 18;

    const cRoadGeo = new THREE.BufferGeometry();
    const cVerts: number[] = [];
    const cUvs: number[] = [];

    for (let i = 0; i <= cPoints.length; i++) {
      const idx = i % cPoints.length;
      const p = cPoints[idx];
      const tangent = circuitCurve.getTangentAt(idx / cPoints.length);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const left = p.clone().add(normal.clone().multiplyScalar(cRoadWidth * 0.5));
      const right = p.clone().add(normal.clone().multiplyScalar(-cRoadWidth * 0.5));

      cVerts.push(left.x, left.y, left.z);
      cVerts.push(right.x, right.y, right.z);

      const v = (i / cPoints.length) * 30;
      cUvs.push(0, v, 1, v);
    }

    const cIndices: number[] = [];
    for (let i = 0; i < cPoints.length; i++) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2;
      const d = (i + 1) * 2 + 1;
      cIndices.push(a, b, c);
      cIndices.push(b, d, c);
    }

    cRoadGeo.setIndex(cIndices);
    cRoadGeo.setAttribute('position', new THREE.Float32BufferAttribute(cVerts, 3));
    cRoadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(cUvs, 2));
    cRoadGeo.computeVertexNormals();

    const cRoadMesh = new THREE.Mesh(cRoadGeo, asphaltMat);
    cRoadMesh.receiveShadow = true;
    group.add(cRoadMesh);

    // Grandstand
    const standGeo = new THREE.BoxGeometry(70, 16, 20);
    const standMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const grandstand = new THREE.Mesh(standGeo, standMat);
    grandstand.position.set(0, 8, 145);
    grandstand.castShadow = true;
    group.add(grandstand);

    colliders.push({
      box: new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(0, 8, 145), new THREE.Vector3(72, 16, 22)),
      type: 'wall',
    });

    // Start / Finish Gantry
    const gantryArch = new THREE.Mesh(
      new THREE.BoxGeometry(26, 2.5, 2),
      new THREE.MeshBasicMaterial({ map: createNeonSignTexture('PRO DRIFT CIRCUIT', '#10b981') })
    );
    gantryArch.position.set(0, 8, 90);
    group.add(gantryArch);

    // Circuit Clipping Points around high-speed sweepers
    const circuitClips = [
      { x: 70, z: 90 },
      { x: 110, z: 0 },
      { x: 70, z: -90 },
      { x: -70, z: -90 },
      { x: -110, z: 0 },
      { x: -70, z: 90 },
    ];

    circuitClips.forEach((cp, idx) => {
      clippingPoints.push({
        id: 400 + idx,
        x: cp.x,
        y: 0.5,
        z: cp.z,
        radius: 12,
        points: 1800,
        active: true,
        hit: false,
      });
    });
  }

  // Visual Holographic Beacons for Clipping Points
  const beaconGeo = new THREE.CylinderGeometry(0.8, 0.8, 4, 16);
  const beaconMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.6,
  });

  const beaconRingGeo = new THREE.RingGeometry(2.5, 3.2, 24);
  beaconRingGeo.rotateX(-Math.PI / 2);
  const beaconRingMat = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.7,
  });

  clippingPoints.forEach((cp) => {
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(cp.x, cp.y + 2, cp.z);
    beacon.name = `Beacon_${cp.id}`;

    const ring = new THREE.Mesh(beaconRingGeo, beaconRingMat);
    ring.position.set(cp.x, cp.y + 0.1, cp.z);
    ring.name = `BeaconRing_${cp.id}`;

    group.add(beacon, ring);
  });

  return {
    group,
    clippingPoints,
    colliders,
    ramps,
    spawnPoint,
  };
}

export const MAP_CATALOG: Record<MapId, {
  name: string;
  subtitle: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Expert' | 'Pro';
  surfaceGrip: number;
  skyColor: string;
  fogColor: string;
  fogDensity: number;
  timeOfDay: 'night' | 'sunset' | 'day' | 'overcast';
  driftTargetScore: number;
}> = {
  city: {
    name: 'Night Cyber Metropolis',
    subtitle: 'Open World City & Highway Grid',
    description: 'Neon skyscrapers, wide 4-way intersections for donut drifts, billboard arches, and ramp jumps under glowing streetlights.',
    difficulty: 'Intermediate',
    surfaceGrip: 1.0,
    skyColor: '#050814',
    fogColor: '#090e24',
    fogDensity: 0.0035,
    timeOfDay: 'night',
    driftTargetScore: 25000,
  },
  touge: {
    name: 'Akina Mountain Touge',
    subtitle: 'Downhill Switchbacks & Hairpins',
    description: 'Famous mountain pass with tight hairpins, elevation drops, guardrails, and cherry trees. Requires precise steering and throttle feathering.',
    difficulty: 'Pro',
    surfaceGrip: 0.92,
    skyColor: '#1e1b4b',
    fogColor: '#171439',
    fogDensity: 0.004,
    timeOfDay: 'sunset',
    driftTargetScore: 40000,
  },
  docklands: {
    name: 'Port Docklands Arena',
    subtitle: 'Industrial Skidpad & Obstacle Maze',
    description: 'Massive open concrete pad with stacked shipping containers, cargo gantry cranes, container chicanes, and high-flying stunt ramps.',
    difficulty: 'Beginner',
    surfaceGrip: 1.08,
    skyColor: '#0f172a',
    fogColor: '#1e293b',
    fogDensity: 0.003,
    timeOfDay: 'night',
    driftTargetScore: 30000,
  },
  circuit: {
    name: 'Apex Grand Prix Circuit',
    subtitle: 'High-Speed Sweepers & Grandstands',
    description: 'Professional drift competition track with alternating kerbs, high-speed clipping zones, grandstands, and huge run-off areas.',
    difficulty: 'Expert',
    surfaceGrip: 1.05,
    skyColor: '#0c1a2e',
    fogColor: '#13233c',
    fogDensity: 0.0028,
    timeOfDay: 'sunset',
    driftTargetScore: 35000,
  },
};
