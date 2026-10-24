import React, { useEffect } from 'react';
import { CarId, MapId } from '../types/game';
import { CAR_CATALOG } from '../game/proceduralModels';
import { MAP_CATALOG } from '../game/worldBuilder';
import { Play, Wrench, MapPin, Sparkles, Code2 } from 'lucide-react';
import { soundEngine } from '../audio/SoundEngine';

interface TitleScreenProps {
  currentCarId: CarId;
  currentMapId: MapId;
  onStartGame: () => void;
  onOpenGarage: () => void;
  onOpenMapSelector: () => void;
  onOpenFlutterExport?: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  currentCarId,
  currentMapId,
  onStartGame,
  onOpenGarage,
  onOpenMapSelector,
  onOpenFlutterExport,
}) => {
  const car = CAR_CATALOG[currentCarId];
  const map = MAP_CATALOG[currentMapId];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        soundEngine.init();
        soundEngine.resume();
        onStartGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame]);

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-between p-8 sm:p-12 pointer-events-auto bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent">
      {/* TOP: Brand Lockup & Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-cyan-400" />
          <span className="text-xs font-black tracking-widest uppercase text-cyan-400">
            PRO DRIFT MOTORSPORT SIMULATION
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenGarage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/80 border border-neutral-800 text-white hover:border-cyan-500/50 hover:bg-neutral-800 text-xs font-bold uppercase tracking-wider transition shadow-lg"
          >
            <Wrench className="w-3.5 h-3.5 text-cyan-400" />
            <span>Garage ({car.brand})</span>
          </button>

          <button
            onClick={onOpenMapSelector}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/80 border border-neutral-800 text-white hover:border-cyan-500/50 hover:bg-neutral-800 text-xs font-bold uppercase tracking-wider transition shadow-lg"
          >
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>Map ({map.name})</span>
          </button>

          {onOpenFlutterExport && (
            <button
              onClick={onOpenFlutterExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-900 text-xs font-bold uppercase tracking-wider transition shadow-lg"
            >
              <Code2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Flutter (APK/EXE)</span>
            </button>
          )}
        </div>
      </div>

      {/* CENTER: Bespoke SVG Title Lockup */}
      <div className="flex flex-col items-center text-center my-auto">
        <div className="mb-2">
          <svg className="w-full max-w-lg h-24 sm:h-28" viewBox="0 0 600 120" fill="none">
            {/* Bavaria M-Colors Tri-Stripe Accent */}
            <path d="M 90 20 L 130 20 L 110 32 L 70 32 Z" fill="#0066b1" />
            <path d="M 135 20 L 175 20 L 155 32 L 115 32 Z" fill="#001e4a" />
            <path d="M 180 20 L 220 20 L 200 32 L 160 32 Z" fill="#e21a22" />

            {/* Glowing Text Outline */}
            <text
              x="300"
              y="85"
              textAnchor="middle"
              className="font-black italic tracking-tighter"
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '68px',
                fontWeight: 900,
                letterSpacing: '-2px',
                fill: '#ffffff',
                filter: 'drop-shadow(0 0 20px rgba(6,182,212,0.6))',
              }}
            >
              APEX DRIFT 3D
            </text>
          </svg>
        </div>

        <p className="text-sm sm:text-base font-bold text-neutral-300 tracking-wider uppercase mb-8 max-w-md">
          Precision Car Drifting &amp; Open World Experience
        </p>

        {/* Big Start Button */}
        <button
          onClick={() => {
            soundEngine.init();
            soundEngine.resume();
            onStartGame();
          }}
          className="group relative px-10 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-neutral-950 font-black text-lg uppercase tracking-widest transition-all duration-200 shadow-[0_0_35px_rgba(6,182,212,0.5)] hover:scale-105 active:scale-95 flex items-center gap-3"
        >
          <Play className="w-6 h-6 fill-neutral-950" />
          <span>START DRIFTING</span>
        </button>

        <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mt-3">
          Press [Enter] or [Space] to Launch
        </span>
      </div>

      {/* BOTTOM: Minimal Control Hint Line */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-neutral-400 text-xs border-t border-neutral-800/80 pt-4 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold">{car.name}</span>
          <span>·</span>
          <span>{car.horsepower} HP</span>
          <span>·</span>
          <span className="text-cyan-400">{map.name}</span>
        </div>

        <div className="text-neutral-400 text-[11px] font-medium tracking-wide">
          WASD Move · Space Handbrake · Shift Nitro · C Camera · Esc Pause
        </div>
      </div>
    </div>
  );
};
