import React from 'react';
import { MapId } from '../types/game';
import { MAP_CATALOG } from '../game/worldBuilder';
import { X, MapPin, Gauge, Flag, Sparkles } from 'lucide-react';

interface MapSelectorProps {
  currentMapId: MapId;
  onSelectMap: (mapId: MapId) => void;
  onClose: () => void;
}

export const MapSelector: React.FC<MapSelectorProps> = ({
  currentMapId,
  onSelectMap,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/85">
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-wider text-white">
                Select Drift Location
              </h2>
              <p className="text-xs text-neutral-400">
                Choose between open world city, mountain downhill, industrial docks, or race circuit
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map Cards Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Object.keys(MAP_CATALOG) as MapId[]).map((mId) => {
            const m = MAP_CATALOG[mId];
            const isSelected = mId === currentMapId;

            return (
              <div
                key={mId}
                onClick={() => {
                  onSelectMap(mId);
                  onClose();
                }}
                className={`cursor-pointer rounded-xl p-5 border transition flex flex-col justify-between ${
                  isSelected
                    ? 'bg-neutral-800/90 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                    : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                        m.difficulty === 'Beginner'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                          : m.difficulty === 'Intermediate'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/50'
                          : m.difficulty === 'Expert'
                          ? 'bg-amber-950 text-amber-300 border border-amber-700/50'
                          : 'bg-rose-950 text-rose-300 border border-rose-700/50'
                      }`}
                    >
                      {m.difficulty}
                    </span>

                    <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                      {m.timeOfDay}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-white mb-0.5">{m.name}</h3>
                  <div className="text-xs font-semibold text-cyan-400 mb-2">{m.subtitle}</div>
                  <p className="text-xs text-neutral-400 mb-4">{m.description}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-neutral-950/70 p-3 rounded-lg border border-neutral-800 mb-3">
                    <div className="flex items-center gap-1.5 text-neutral-300">
                      <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Surface Grip:</span>
                      <span className="font-bold text-white tabular-nums">{m.surfaceGrip.toFixed(2)}x</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-neutral-300">
                      <Flag className="w-3.5 h-3.5 text-amber-400" />
                      <span>Target Score:</span>
                      <span className="font-bold text-white tabular-nums">{m.driftTargetScore.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <button
                  className={`w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                    isSelected
                      ? 'bg-cyan-500 text-neutral-950'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  {isSelected ? 'Currently Loaded' : 'Enter Location'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
