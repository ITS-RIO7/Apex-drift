import React from 'react';
import { CarId, CarCustomization } from '../types/game';
import { CAR_CATALOG } from '../game/proceduralModels';
import { X, Wrench, Palette, Sliders, Check, ShieldCheck, Flame } from 'lucide-react';

interface GarageModalProps {
  currentCarId: CarId;
  customization: CarCustomization;
  onSelectCar: (carId: CarId) => void;
  onUpdateCustomization: (custom: Partial<CarCustomization>) => void;
  onClose: () => void;
}

const BODY_COLORS = [
  { name: 'Estoril Blue', hex: '#1e40af' },
  { name: 'Alpine White', hex: '#f8fafc' },
  { name: 'Isle of Man Green', hex: '#065f46' },
  { name: 'Toronto Red', hex: '#b91c1c' },
  { name: 'Frozen Matte Black', hex: '#171717' },
  { name: 'Sunset Pearl', hex: '#f59e0b' },
  { name: 'Nardo Gray', hex: '#64748b' },
  { name: 'Neon Cyber Pink', hex: '#ec4899' },
  { name: 'Midnight Purple', hex: '#581c87' },
];

const RIM_COLORS = [
  { name: 'Matte Gold', hex: '#d4af37' },
  { name: 'Brushed Bronze', hex: '#92400e' },
  { name: 'Hyper Silver', hex: '#cbd5e1' },
  { name: 'Gloss Black', hex: '#0f172a' },
  { name: 'Gunmetal', hex: '#475569' },
];

const SMOKE_COLORS = [
  { name: 'Pure White', hex: '#ffffff' },
  { name: 'Cyber Cyan', hex: '#06b6d4' },
  { name: 'Neon Pink', hex: '#f43f5e' },
  { name: 'Toxic Lime', hex: '#84cc16' },
  { name: 'Deep Purple', hex: '#a855f7' },
];

export const GarageModal: React.FC<GarageModalProps> = ({
  currentCarId,
  customization,
  onSelectCar,
  onUpdateCustomization,
  onClose,
}) => {
  const [tab, setTab] = React.useState<'cars' | 'paint' | 'tuning'>('cars');
  const activeCar = CAR_CATALOG[currentCarId];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/85">
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-wider text-white">
                M-Performance Drift Garage
              </h2>
              <p className="text-xs text-neutral-400">
                Configure your drift machine, livery &amp; suspension stance
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

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 bg-neutral-900/60 px-6 pt-2 gap-2">
          <button
            onClick={() => setTab('cars')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition border-b-2 ${
              tab === 'cars'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Select Vehicle
          </button>
          <button
            onClick={() => setTab('paint')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition border-b-2 ${
              tab === 'paint'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Livery &amp; Paint
          </button>
          <button
            onClick={() => setTab('tuning')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition border-b-2 ${
              tab === 'tuning'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Drift Tuning
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'cars' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.keys(CAR_CATALOG) as CarId[]).map((cId) => {
                const c = CAR_CATALOG[cId];
                const isSelected = cId === currentCarId;

                return (
                  <div
                    key={cId}
                    onClick={() => {
                      onSelectCar(cId);
                      onUpdateCustomization({
                        bodyColor: c.defaultColor,
                        rimColor: c.defaultRimColor,
                      });
                    }}
                    className={`cursor-pointer rounded-xl p-5 border transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-neutral-800/90 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                        : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-400">
                          {c.brand} · {c.year}
                        </span>
                        {isSelected && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-700/50">
                            <Check className="w-3 h-3" /> EQUIPPED
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-black text-white mb-1">{c.name}</h3>
                      <p className="text-xs text-neutral-400 mb-4 line-clamp-2">{c.description}</p>

                      {/* Performance Bars */}
                      <div className="space-y-2 text-xs">
                        <div>
                          <div className="flex justify-between text-[11px] text-neutral-400 mb-0.5">
                            <span>Horsepower</span>
                            <span className="font-bold text-white">{c.horsepower} HP</span>
                          </div>
                          <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-cyan-400 rounded-full"
                              style={{ width: `${(c.horsepower / 850) * 100}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] text-neutral-400 mb-0.5">
                            <span>Top Speed</span>
                            <span className="font-bold text-white">{c.topSpeed} KM/H</span>
                          </div>
                          <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${(c.topSpeed / 330) * 100}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] text-neutral-400 mb-0.5">
                            <span>Drift Tendency / Slide Angle</span>
                            <span className="font-bold text-white">{c.driftEase}%</span>
                          </div>
                          <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-400 rounded-full"
                              style={{ width: `${c.driftEase}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      className={`mt-4 w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                        isSelected
                          ? 'bg-cyan-500 text-neutral-950'
                          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      {isSelected ? 'Ready To Drift' : 'Select Car'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'paint' && (
            <div className="space-y-6">
              {/* Body Paint */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-3">
                  Vehicle Body Color
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {BODY_COLORS.map((col) => (
                    <button
                      key={col.hex}
                      onClick={() => onUpdateCustomization({ bodyColor: col.hex })}
                      className={`flex flex-col items-center p-2.5 rounded-xl border transition ${
                        customization.bodyColor === col.hex
                          ? 'border-cyan-400 bg-neutral-800'
                          : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-full border border-white/20 shadow-md mb-1.5"
                        style={{ backgroundColor: col.hex }}
                      />
                      <span className="text-[11px] text-neutral-300 font-medium text-center">
                        {col.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Finish */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-2">
                  Paint Finish
                </label>
                <div className="flex gap-3">
                  {(['metallic', 'gloss', 'matte'] as const).map((finish) => (
                    <button
                      key={finish}
                      onClick={() => onUpdateCustomization({ finish })}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition ${
                        customization.finish === finish
                          ? 'bg-cyan-500 text-neutral-950 border-cyan-400'
                          : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-750'
                      }`}
                    >
                      {finish}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rim Colors */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-3">
                  Wheel Rim Color
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {RIM_COLORS.map((rc) => (
                    <button
                      key={rc.hex}
                      onClick={() => onUpdateCustomization({ rimColor: rc.hex })}
                      className={`flex flex-col items-center p-2.5 rounded-xl border transition ${
                        customization.rimColor === rc.hex
                          ? 'border-cyan-400 bg-neutral-800'
                          : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-full border border-white/20 shadow-md mb-1.5"
                        style={{ backgroundColor: rc.hex }}
                      />
                      <span className="text-[11px] text-neutral-300 font-medium text-center">
                        {rc.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tire Smoke Color */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-3">
                  Tire Drift Smoke Color
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {SMOKE_COLORS.map((sc) => (
                    <button
                      key={sc.hex}
                      onClick={() => onUpdateCustomization({ smokeColor: sc.hex })}
                      className={`flex flex-col items-center p-2.5 rounded-xl border transition ${
                        customization.smokeColor === sc.hex
                          ? 'border-cyan-400 bg-neutral-800'
                          : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-full border border-white/20 shadow-md mb-1.5"
                        style={{ backgroundColor: sc.hex }}
                      />
                      <span className="text-[11px] text-neutral-300 font-medium text-center">
                        {sc.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'tuning' && (
            <div className="space-y-6">
              {/* Steering Lock Angle */}
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Steering Lock Angle (Drift Angle Capacity)
                  </span>
                  <span className="text-xs font-black text-cyan-400 tabular-nums">
                    {customization.steerAngle}°
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="65"
                  step="1"
                  value={customization.steerAngle}
                  onChange={(e) => onUpdateCustomization({ steerAngle: Number(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
                  <span>40° (Street Spec)</span>
                  <span>52° (Pro Drift)</span>
                  <span>65° (Extreme Wisefab Lock)</span>
                </div>
              </div>

              {/* Suspension Stiffness */}
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Suspension Coilovers &amp; Camber Stance
                  </span>
                  <span className="text-xs font-black text-cyan-400 tabular-nums">
                    {customization.suspensionStiffness.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="1.6"
                  step="0.1"
                  value={customization.suspensionStiffness}
                  onChange={(e) => onUpdateCustomization({ suspensionStiffness: Number(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
                  <span>Soft (Body Roll Transfer)</span>
                  <span>Balanced</span>
                  <span>Stiff Track Coilovers</span>
                </div>
              </div>

              {/* Spoiler Style */}
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                <label className="block text-xs font-bold uppercase tracking-wider text-white mb-2">
                  Aerodynamic Spoiler
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'gt_wing', label: 'Carbon GT Drift Wing' },
                    { id: 'ducktail', label: 'Ducktail Lip Spoiler' },
                    { id: 'stock', label: 'Clean / Stock Deck' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => onUpdateCustomization({ spoilerStyle: s.id as any })}
                      className={`p-3 rounded-lg text-xs font-bold border transition ${
                        customization.spoilerStyle === s.id
                          ? 'border-cyan-400 bg-neutral-800 text-cyan-400'
                          : 'border-neutral-850 bg-neutral-900 text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drift Assist Toggle */}
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-0.5">
                    Drift Traction Assist
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    Helps counter-steer automatically for beginners vs full manual physics
                  </p>
                </div>
                <button
                  onClick={() => onUpdateCustomization({ driftAssist: !customization.driftAssist })}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                    customization.driftAssist
                      ? 'bg-emerald-500 text-neutral-950'
                      : 'bg-neutral-800 text-neutral-300'
                  }`}
                >
                  {customization.driftAssist ? 'Assisted ON' : 'Pro Manual OFF'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-neutral-800 bg-neutral-950">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 text-neutral-950 font-black text-xs uppercase tracking-wider hover:bg-cyan-400 transition shadow-lg"
          >
            Apply &amp; Return to Track
          </button>
        </div>
      </div>
    </div>
  );
};
