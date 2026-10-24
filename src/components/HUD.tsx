import React from 'react';
import { DriftState, CarId, MapId, CameraMode } from '../types/game';
import { CAR_CATALOG } from '../game/proceduralModels';
import { MAP_CATALOG } from '../game/worldBuilder';
import { Gauge, Zap, Flame, Trophy, Coins } from 'lucide-react';

interface HUDProps {
  speedKmh: number;
  rpm: number;
  gear: number;
  driftState: DriftState;
  carId: CarId;
  mapId: MapId;
  cameraMode: CameraMode;
  carPosition: { x: number; z: number };
  heading: number;
}

export const HUD: React.FC<HUDProps> = ({
  speedKmh,
  rpm,
  gear,
  driftState,
  carId,
  mapId,
  cameraMode,
  carPosition,
  heading,
}) => {
  const car = CAR_CATALOG[carId];
  const map = MAP_CATALOG[mapId];

  // RPM percentage (800 to 8500)
  const rpmPercent = Math.min(100, Math.max(0, ((rpm - 800) / 7700) * 100));
  const isRedlining = rpm > 7200;

  // Mini-map radar calculation (relative to center of map)
  const mapSize = 400;
  const radarRadius = 45;
  const radarX = 50 + (carPosition.x / mapSize) * radarRadius;
  const radarY = 50 + (carPosition.z / mapSize) * radarRadius;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden text-white font-sans">
      {/* TOP HEADER: Map, Car Badge & Banked Score */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        {/* Car & Map Badge */}
        <div className="flex items-center gap-3 bg-neutral-950/85 border border-cyan-500/30 px-3.5 py-1.5 rounded-lg shadow-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-none" />
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-cyan-400">
              {car.name}
            </div>
            <div className="text-[11px] text-neutral-400 tracking-wide">
              {map.name} · <span className="text-neutral-300 capitalize">{cameraMode} Cam</span>
            </div>
          </div>
        </div>

        {/* Total Score & Cash */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-neutral-950/85 border border-amber-500/30 px-3.5 py-1.5 rounded-lg shadow-lg">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-neutral-400 uppercase font-semibold">Cash</span>
            <span className="text-sm font-black tabular-nums text-amber-300">
              ${driftState.cashEarned.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-neutral-950/85 border border-emerald-500/30 px-3.5 py-1.5 rounded-lg shadow-lg">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-neutral-400 uppercase font-semibold">Total Drift</span>
            <span className="text-sm font-black tabular-nums text-emerald-300">
              {driftState.totalScore.toLocaleString()} pts
            </span>
          </div>
        </div>
      </div>

      {/* CENTER TOP: DYNAMIC DRIFT SCORE BANNER */}
      {(driftState.isDrifting || driftState.currentScore > 0 || driftState.ratingFade > 0) && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-150">
          {/* Drift Callout Badge */}
          {driftState.lastRatingText && (
            <div className="mb-1 px-3 py-0.5 rounded bg-gradient-to-r from-cyan-600 to-blue-600 text-[13px] font-black tracking-widest uppercase italic shadow-md border border-cyan-300/40 animate-none">
              {driftState.lastRatingText}
            </div>
          )}

          {/* Main Drift Score Display */}
          <div className="flex items-center gap-3 bg-neutral-950/90 border-2 border-cyan-400 px-6 py-2 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.4)]">
            <Flame className="w-6 h-6 text-orange-400 animate-none" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400">
                Drift Score
              </span>
              <span className="text-3xl font-black italic tabular-nums tracking-wider text-white">
                {Math.floor(driftState.currentScore).toLocaleString()}
              </span>
            </div>

            {/* Multiplier Badge */}
            <div className="flex flex-col items-center justify-center bg-cyan-500 text-neutral-950 px-3 py-1 rounded-lg font-black text-xl italic shadow-inner">
              <span>{driftState.multiplier.toFixed(1)}x</span>
            </div>
          </div>

          {/* Angle & Speed indicators */}
          <div className="flex items-center gap-4 mt-1.5 text-xs font-bold text-neutral-300 tracking-wider">
            <span className="bg-neutral-900/80 px-2 py-0.5 rounded border border-neutral-700">
              ANGLE: <span className="text-cyan-400 tabular-nums">{driftState.angle}°</span>
            </span>
            <span className="bg-neutral-900/80 px-2 py-0.5 rounded border border-neutral-700">
              SPEED: <span className="text-cyan-400 tabular-nums">{driftState.speed} KM/H</span>
            </span>
          </div>
        </div>
      )}

      {/* BOTTOM-LEFT: RADAR MINI-MAP */}
      <div className="absolute bottom-20 left-4 hidden sm:block">
        <div className="relative w-28 h-28 rounded-full bg-neutral-950/85 border border-cyan-500/40 shadow-lg p-1 overflow-hidden">
          {/* Radar grid rings */}
          <div className="absolute inset-2 rounded-full border border-neutral-700/50" />
          <div className="absolute inset-6 rounded-full border border-neutral-700/30" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-[1px] bg-neutral-700/40" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-full w-[1px] bg-neutral-700/40" />
          </div>

          {/* Car blip */}
          <div
            className="absolute w-3 h-3 -ml-1.5 -mt-1.5 flex items-center justify-center pointer-events-none transition-transform"
            style={{
              left: `${Math.max(8, Math.min(92, radarX))}%`,
              top: `${Math.max(8, Math.min(92, radarY))}%`,
              transform: `rotate(${-heading}rad)`,
            }}
          >
            <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[9px] border-b-cyan-400" />
          </div>

          {/* North indicator */}
          <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] font-black text-cyan-400">
            N
          </div>
        </div>
      </div>

      {/* BOTTOM-RIGHT: DIGITAL SPEEDOMETER & TACHOMETER CLUSTER */}
      <div className="absolute bottom-20 right-4 sm:bottom-24 sm:right-6 flex flex-col items-end">
        <div className="bg-neutral-950/90 border border-neutral-800 rounded-2xl p-4 shadow-2xl flex flex-col items-center min-w-[170px]">
          {/* Gear & Nitrous */}
          <div className="w-full flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 bg-neutral-900 px-2 py-0.5 rounded text-[11px] font-bold text-neutral-400">
              <span>GEAR</span>
              <span className="text-cyan-400 text-sm font-black">{gear}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-cyan-400">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>NITRO</span>
            </div>
          </div>

          {/* Big Speedometer Readout */}
          <div className="flex items-baseline gap-1.5 my-0.5">
            <span className="text-5xl font-black italic tracking-tighter tabular-nums text-white">
              {speedKmh}
            </span>
            <span className="text-xs font-black tracking-widest text-neutral-400">
              KM/H
            </span>
          </div>

          {/* RPM Bar Gauge */}
          <div className="w-full mt-2">
            <div className="flex justify-between text-[10px] font-bold text-neutral-400 mb-1">
              <span>RPM</span>
              <span className={`tabular-nums ${isRedlining ? 'text-red-500 font-black' : 'text-neutral-300'}`}>
                {Math.floor(rpm)}
              </span>
            </div>
            <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden p-0.5 flex">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  isRedlining ? 'bg-red-500' : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-red-500'
                }`}
                style={{ width: `${rpmPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
