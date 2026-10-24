import React, { useState } from 'react';
import { CameraMode, VehicleInputs } from '../types/game';
import { soundEngine } from '../audio/SoundEngine';
import {
  Camera,
  MapPin,
  Wrench,
  Volume2,
  VolumeX,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Zap,
  Disc,
  Code2,
} from 'lucide-react';

interface ControlsOverlayProps {
  cameraMode: CameraMode;
  onSetCameraMode: (mode: CameraMode) => void;
  onOpenGarage: () => void;
  onOpenMapSelector: () => void;
  onResetCar: () => void;
  onOpenFlutterExport?: () => void;
  onVirtualInput: (inputs: Partial<VehicleInputs>) => void;
}

export const ControlsOverlay: React.FC<ControlsOverlayProps> = ({
  cameraMode,
  onSetCameraMode,
  onOpenGarage,
  onOpenMapSelector,
  onResetCar,
  onOpenFlutterExport,
  onVirtualInput,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const toggleSound = () => {
    soundEngine.init();
    soundEngine.resume();
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const cameraModes: { id: CameraMode; label: string }[] = [
    { id: 'chase', label: 'Chase' },
    { id: 'close', label: 'Close' },
    { id: 'hood', label: 'Hood' },
    { id: 'orbit', label: 'Drone' },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-30">
      {/* VIRTUAL TOUCH / ON-SCREEN GAMEPAD (Visible on mobile/touch, or clickable) */}
      <div className="absolute bottom-28 left-4 pointer-events-auto flex gap-2 md:hidden">
        {/* Left / Right Steer Buttons */}
        <button
          onTouchStart={() => onVirtualInput({ steer: -1 })}
          onTouchEnd={() => onVirtualInput({ steer: 0 })}
          onMouseDown={() => onVirtualInput({ steer: -1 })}
          onMouseUp={() => onVirtualInput({ steer: 0 })}
          className="w-14 h-14 rounded-2xl bg-neutral-900/90 border border-neutral-750 text-white font-black text-xl active:bg-cyan-500 active:text-neutral-950 flex items-center justify-center shadow-lg"
        >
          ◀
        </button>
        <button
          onTouchStart={() => onVirtualInput({ steer: 1 })}
          onTouchEnd={() => onVirtualInput({ steer: 0 })}
          onMouseDown={() => onVirtualInput({ steer: 1 })}
          onMouseUp={() => onVirtualInput({ steer: 0 })}
          className="w-14 h-14 rounded-2xl bg-neutral-900/90 border border-neutral-750 text-white font-black text-xl active:bg-cyan-500 active:text-neutral-950 flex items-center justify-center shadow-lg"
        >
          ▶
        </button>
      </div>

      <div className="absolute bottom-28 right-4 pointer-events-auto flex items-center gap-2 md:hidden">
        {/* Handbrake Button */}
        <button
          onTouchStart={() => onVirtualInput({ handbrake: true })}
          onTouchEnd={() => onVirtualInput({ handbrake: false })}
          onMouseDown={() => onVirtualInput({ handbrake: true })}
          onMouseUp={() => onVirtualInput({ handbrake: false })}
          className="w-14 h-14 rounded-2xl bg-rose-950/90 border border-rose-500/40 text-rose-300 font-bold text-xs uppercase flex flex-col items-center justify-center active:bg-rose-600 active:text-white shadow-lg"
        >
          <Disc className="w-5 h-5 mb-0.5" />
          DRIFT
        </button>

        {/* Throttle & Brake Pedals */}
        <div className="flex flex-col gap-2">
          <button
            onTouchStart={() => onVirtualInput({ throttle: 1 })}
            onTouchEnd={() => onVirtualInput({ throttle: 0 })}
            onMouseDown={() => onVirtualInput({ throttle: 1 })}
            onMouseUp={() => onVirtualInput({ throttle: 0 })}
            className="w-14 h-14 rounded-2xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 font-black text-sm uppercase flex items-center justify-center active:bg-emerald-500 active:text-neutral-950 shadow-lg"
          >
            GAS
          </button>
          <button
            onTouchStart={() => onVirtualInput({ brake: 1 })}
            onTouchEnd={() => onVirtualInput({ brake: 0 })}
            onMouseDown={() => onVirtualInput({ brake: 1 })}
            onMouseUp={() => onVirtualInput({ brake: 0 })}
            className="w-14 h-14 rounded-2xl bg-neutral-900/90 border border-neutral-750 text-neutral-300 font-black text-xs uppercase flex items-center justify-center active:bg-red-500 active:text-white shadow-lg"
          >
            REV
          </button>
        </div>
      </div>

      {/* UNIFIED SLEEK BOTTOM CONTROL DOCK (Mandated Three.js Skill Layout) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto max-w-[min(940px,94vw)] transition-all duration-300">
        {/* Collapse / Expand Toggle Tab */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="bg-neutral-950/90 border border-b-0 border-neutral-800 text-neutral-400 hover:text-white px-3 py-1 rounded-t-lg text-[11px] font-bold tracking-wider flex items-center gap-1 shadow-md"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Show Controls</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Hide Controls</span>
            </>
          )}
        </button>

        {/* Main Dock Container */}
        {!isCollapsed && (
          <div className="bg-neutral-950/95 border border-neutral-800 rounded-2xl px-4 py-2.5 shadow-2xl flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {/* Camera Switcher Pills */}
            <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
              <Camera className="w-3.5 h-3.5 text-neutral-400 ml-1.5 mr-0.5" />
              {cameraModes.map((cm) => (
                <button
                  key={cm.id}
                  onClick={() => onSetCameraMode(cm.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                    cameraMode === cm.id
                      ? 'bg-cyan-500 text-neutral-950 shadow-sm'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  {cm.label}
                </button>
              ))}
            </div>

            <div className="h-5 w-[1px] bg-neutral-800 hidden sm:block" />

            {/* Garage & Maps Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenGarage}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-cyan-500/50 hover:bg-neutral-850 text-white text-xs font-bold uppercase tracking-wider transition shadow-sm"
              >
                <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                <span>Garage</span>
              </button>

              <button
                onClick={onOpenMapSelector}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-cyan-500/50 hover:bg-neutral-850 text-white text-xs font-bold uppercase tracking-wider transition shadow-sm"
              >
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>Maps</span>
              </button>

              {onOpenFlutterExport && (
                <button
                  onClick={onOpenFlutterExport}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/80 border border-cyan-500/50 hover:bg-cyan-900 text-cyan-300 text-xs font-bold uppercase tracking-wider transition shadow-sm"
                >
                  <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Flutter (APK/EXE)</span>
                </button>
              )}
            </div>

            <div className="h-5 w-[1px] bg-neutral-800 hidden sm:block" />

            {/* Reset Car & Audio Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={onResetCar}
                title="Reset Car (R)"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850 text-neutral-300 text-xs font-bold uppercase tracking-wider transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span> (R)
              </button>

              <button
                onClick={toggleSound}
                title="Toggle Mute (M)"
                className={`p-2 rounded-xl border transition ${
                  isMuted
                    ? 'bg-neutral-900 border-neutral-800 text-neutral-500'
                    : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                }`}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Desktop Keyboard Hints */}
            <div className="hidden xl:flex items-center gap-2 text-[11px] text-neutral-400 font-medium pl-1 border-l border-neutral-800">
              <span className="bg-neutral-900 px-1.5 py-0.5 rounded text-neutral-300 font-mono">WASD</span> Steer / Gas ·
              <span className="bg-neutral-900 px-1.5 py-0.5 rounded text-neutral-300 font-mono">SPACE</span> Handbrake ·
              <span className="bg-neutral-900 px-1.5 py-0.5 rounded text-neutral-300 font-mono">SHIFT</span> Nitro
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
