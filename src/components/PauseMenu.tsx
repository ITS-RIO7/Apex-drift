import React from 'react';
import { Play, RotateCcw, Wrench, MapPin, Home, Code2 } from 'lucide-react';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenGarage: () => void;
  onOpenMapSelector: () => void;
  onReturnToTitle: () => void;
  onOpenFlutterExport?: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onRestart,
  onOpenGarage,
  onOpenMapSelector,
  onReturnToTitle,
  onOpenFlutterExport,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/85 pointer-events-auto">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-center">
        <h2 className="text-2xl font-black italic tracking-wider uppercase text-white mb-1">
          GAME PAUSED
        </h2>
        <p className="text-xs text-neutral-400 mb-6">Take a breath or tune your drift machine</p>

        <div className="space-y-3">
          <button
            onClick={onResume}
            className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-black text-sm uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-neutral-950" />
            <span>Resume Drift (Esc)</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 border border-neutral-700"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart At Spawn Point</span>
          </button>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={onOpenGarage}
              className="py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 border border-neutral-700"
            >
              <Wrench className="w-4 h-4 text-cyan-400" />
              <span>Garage</span>
            </button>

            <button
              onClick={onOpenMapSelector}
              className="py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 border border-neutral-700"
            >
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>Change Map</span>
            </button>
          </div>

          {onOpenFlutterExport && (
            <button
              onClick={onOpenFlutterExport}
              className="w-full py-2.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 border border-cyan-500/40 mt-1"
            >
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span>Flutter (Dart) Export &amp; GitHub Actions</span>
            </button>
          )}

          <button
            onClick={onReturnToTitle}
            className="w-full py-2 rounded-xl text-neutral-400 hover:text-white font-bold text-xs uppercase tracking-wider transition mt-2 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Return to Title Screen</span>
          </button>
        </div>
      </div>
    </div>
  );
};
