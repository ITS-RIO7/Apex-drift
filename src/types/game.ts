export type MapId = 'city' | 'touge' | 'docklands' | 'circuit';

export type CarId = 'bmw_m4' | 'bmw_e30' | 'silvia_s15' | 'apex_gt';

export type CameraMode = 'chase' | 'close' | 'hood' | 'orbit';

export type GameState = 'title' | 'playing' | 'garage' | 'map_select' | 'paused' | 'results';

export interface CarSpecs {
  id: CarId;
  name: string;
  brand: string;
  year: string;
  description: string;
  topSpeed: number; // km/h
  acceleration: number; // 0-100 time factor
  handling: number; // steering responsiveness
  driftEase: number; // slide break tendency
  weight: number; // kg
  horsepower: number; // hp
  defaultColor: string;
  defaultRimColor: string;
  unlocked: boolean;
  price: number;
}

export interface CarCustomization {
  bodyColor: string;
  finish: 'gloss' | 'metallic' | 'matte';
  rimColor: string;
  smokeColor: string;
  spoilerStyle: 'stock' | 'gt_wing' | 'ducktail';
  steerAngle: number; // 40 - 65 degrees
  suspensionStiffness: number; // 0.5 - 1.5
  driftAssist: boolean;
}

export interface MapData {
  id: MapId;
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
}

export interface DriftState {
  isDrifting: boolean;
  currentScore: number;
  combo: number;
  multiplier: number;
  angle: number; // degrees
  speed: number; // km/h
  chainTimer: number; // grace period before score bank
  totalScore: number;
  bestDriftScore: number;
  clipPointsPassed: number;
  cashEarned: number;
  lastRatingText: string;
  ratingFade: number;
}

export interface VehicleInputs {
  throttle: number; // 0 - 1
  brake: number; // 0 - 1
  steer: number; // -1 to 1
  handbrake: boolean;
  nitrous: boolean;
  reset: boolean;
}

export interface ClippingPoint {
  id: number;
  x: number;
  y: number;
  z: number;
  radius: number;
  points: number;
  active: boolean;
  hit: boolean;
}
