/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { GameState, CarId, MapId, CameraMode, CarCustomization, DriftState } from './types/game';
import { HUD } from './components/HUD';
import { ControlsOverlay } from './components/ControlsOverlay';
import { GarageModal } from './components/GarageModal';
import { MapSelector } from './components/MapSelector';
import { TitleScreen } from './components/TitleScreen';
import { PauseMenu } from './components/PauseMenu';
import { FlutterExportModal } from './components/FlutterExportModal';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // High-level Game State
  const [gameState, setGameState] = useState<GameState>('title');
  const [currentCarId, setCurrentCarId] = useState<CarId>('bmw_m4');
  const [currentMapId, setCurrentMapId] = useState<MapId>('city');
  const [cameraMode, setCameraMode] = useState<CameraMode>('chase');

  // Car Customization state
  const [customization, setCustomization] = useState<CarCustomization>({
    bodyColor: '#1e40af', // Bavarian Estoril Blue
    finish: 'metallic',
    rimColor: '#d4af37', // Matte Gold
    smokeColor: '#ffffff',
    spoilerStyle: 'gt_wing',
    steerAngle: 50,
    suspensionStiffness: 1.0,
    driftAssist: false,
  });

  // HUD Real-time Values
  const [hudState, setHudState] = useState<{
    speedKmh: number;
    rpm: number;
    gear: number;
    driftState: DriftState;
    carPosition: { x: number; z: number };
    heading: number;
  }>({
    speedKmh: 0,
    rpm: 800,
    gear: 1,
    driftState: {
      isDrifting: false,
      currentScore: 0,
      combo: 0,
      multiplier: 1.0,
      angle: 0,
      speed: 0,
      chainTimer: 0,
      totalScore: 0,
      bestDriftScore: 0,
      clipPointsPassed: 0,
      cashEarned: 0,
      lastRatingText: '',
      ratingFade: 0,
    },
    carPosition: { x: 0, z: 0 },
    heading: 0,
  });

  // Modals
  const [isGarageOpen, setIsGarageOpen] = useState(false);
  const [isMapSelectorOpen, setIsMapSelectorOpen] = useState(false);
  const [isFlutterExportOpen, setIsFlutterExportOpen] = useState(false);

  // Initialize Three.js GameEngine
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const engine = new GameEngine(canvasMountRef.current);
    engineRef.current = engine;

    // Throttle HUD updates slightly to 30fps for ultra crisp React responsiveness
    let lastHudUpdate = 0;
    engine.onDriftUpdate = (physics) => {
      const now = performance.now();
      if (now - lastHudUpdate > 30) {
        lastHudUpdate = now;
        setHudState({
          speedKmh: physics.speedKmh,
          rpm: physics.rpm,
          gear: physics.gear,
          driftState: { ...physics.driftState },
          carPosition: { x: physics.position.x, z: physics.position.z },
          heading: physics.rotationY,
        });
      }
    };

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Keyboard Pause (Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (isGarageOpen) {
          setIsGarageOpen(false);
          return;
        }
        if (isMapSelectorOpen) {
          setIsMapSelectorOpen(false);
          return;
        }
        if (gameState === 'playing') {
          setGameState('paused');
        } else if (gameState === 'paused') {
          setGameState('playing');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, isGarageOpen, isMapSelectorOpen]);

  // Car & Customization change handlers
  const handleSelectCar = useCallback((carId: CarId) => {
    setCurrentCarId(carId);
    if (engineRef.current) {
      engineRef.current.loadCar(carId, customization);
    }
  }, [customization]);

  const handleUpdateCustomization = useCallback((custom: Partial<CarCustomization>) => {
    setCustomization((prev) => {
      const updated = { ...prev, ...custom };
      if (engineRef.current) {
        engineRef.current.updateCarCustomization(custom);
      }
      return updated;
    });
  }, []);

  // Map change handler
  const handleSelectMap = useCallback((mapId: MapId) => {
    setCurrentMapId(mapId);
    if (engineRef.current) {
      engineRef.current.loadMap(mapId);
    }
  }, []);

  // Camera mode handler
  const handleSetCameraMode = useCallback((mode: CameraMode) => {
    setCameraMode(mode);
    if (engineRef.current) {
      engineRef.current.setCameraMode(mode);
    }
  }, []);

  // Reset car
  const handleResetCar = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.resetCar();
    }
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-950 font-sans select-none">
      {/* 3D WEBGL CANVAS CONTAINER (Isolated from React re-renders) */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full z-0" />

      {/* TITLE SCREEN */}
      {gameState === 'title' && (
        <TitleScreen
          currentCarId={currentCarId}
          currentMapId={currentMapId}
          onStartGame={() => setGameState('playing')}
          onOpenGarage={() => setIsGarageOpen(true)}
          onOpenMapSelector={() => setIsMapSelectorOpen(true)}
          onOpenFlutterExport={() => setIsFlutterExportOpen(true)}
        />
      )}

      {/* ACTIVE PLAYING HUD */}
      {gameState === 'playing' && (
        <>
          <HUD
            speedKmh={hudState.speedKmh}
            rpm={hudState.rpm}
            gear={hudState.gear}
            driftState={hudState.driftState}
            carId={currentCarId}
            mapId={currentMapId}
            cameraMode={cameraMode}
            carPosition={hudState.carPosition}
            heading={hudState.heading}
          />

          <ControlsOverlay
            cameraMode={cameraMode}
            onSetCameraMode={handleSetCameraMode}
            onOpenGarage={() => setIsGarageOpen(true)}
            onOpenMapSelector={() => setIsMapSelectorOpen(true)}
            onResetCar={handleResetCar}
            onOpenFlutterExport={() => setIsFlutterExportOpen(true)}
            onVirtualInput={(inputs) => {
              if (engineRef.current) {
                engineRef.current.setVirtualInputs(inputs);
              }
            }}
          />
        </>
      )}

      {/* PAUSE MENU */}
      {gameState === 'paused' && (
        <PauseMenu
          onResume={() => setGameState('playing')}
          onRestart={() => {
            handleResetCar();
            setGameState('playing');
          }}
          onOpenGarage={() => {
            setIsGarageOpen(true);
            setGameState('playing');
          }}
          onOpenMapSelector={() => {
            setIsMapSelectorOpen(true);
            setGameState('playing');
          }}
          onReturnToTitle={() => setGameState('title')}
          onOpenFlutterExport={() => setIsFlutterExportOpen(true)}
        />
      )}

      {/* GARAGE MODAL */}
      {isGarageOpen && (
        <GarageModal
          currentCarId={currentCarId}
          customization={customization}
          onSelectCar={handleSelectCar}
          onUpdateCustomization={handleUpdateCustomization}
          onClose={() => setIsGarageOpen(false)}
        />
      )}

      {/* MAP SELECTOR MODAL */}
      {isMapSelectorOpen && (
        <MapSelector
          currentMapId={currentMapId}
          onSelectMap={handleSelectMap}
          onClose={() => setIsMapSelectorOpen(false)}
        />
      )}

      {/* FLUTTER EXPORT & GITHUB ACTIONS MODAL */}
      {isFlutterExportOpen && (
        <FlutterExportModal onClose={() => setIsFlutterExportOpen(false)} />
      )}
    </div>
  );
}
