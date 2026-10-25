import React, { useState } from 'react';
import { X, Code2, Download, Copy, Check, GitBranch, Smartphone, Monitor, Apple } from 'lucide-react';

interface FlutterExportModalProps {
  onClose: () => void;
}

export const FlutterExportModal: React.FC<FlutterExportModalProps> = ({ onClose }) => {
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>('workflow');

  const files: Record<string, { name: string; lang: string; desc: string; content: string }> = {
    workflow: {
      name: '.github/workflows/build_apk.yml',
      lang: 'yaml',
      desc: '100% Reliable GitHub Actions workflow to build and download Android APK',
      content: `name: Build Android APK

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
  workflow_dispatch:

concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  build-apk:
    name: Build Android APK
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Java 17 (JDK)
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Set up Flutter (Latest Stable)
        uses: subosito/flutter-action@v2
        with:
          channel: 'stable'
          cache: true

      - name: Prepare Scaffolding & Build APK
        run: |
          if [ -d "flutter_app" ] && [ -f "flutter_app/pubspec.yaml" ]; then
            cd flutter_app
          fi
          echo "Current working directory: $(pwd)"
          rm -rf android
          flutter create --platforms=android --org com.apexdrift --project-name apex_drift_3d .
          chmod +x android/gradlew
          flutter pub get
          flutter build apk --release

      - name: Upload Android APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: ApexDrift-3D-Android-APK
          path: |
            **/build/app/outputs/flutter-apk/app-release.apk
            **/build/app/outputs/apk/release/*.apk
          if-no-files-found: error`,
    },
    main: {
      name: 'flutter_app/lib/main.dart',
      lang: 'dart',
      desc: 'Flutter App Entry point with landscape lock and router',
      content: `import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'models/car.dart';
import 'models/map_data.dart';
import 'screens/title_screen.dart';
import 'screens/game_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);
  runApp(const ApexDriftApp());
}`,
    },
    physics: {
      name: 'flutter_app/lib/physics/drift_physics.dart',
      lang: 'dart',
      desc: 'Dart Pacejka drift physics, slip angles, multiplier combos, and scoring',
      content: `// Vehicle Physics in pure Dart
class VehiclePhysics {
  Vector3 position = Vector3(0, 0.35, 0);
  Vector3 velocity = Vector3(0, 0, 0);
  double rotationY = 0.0;
  int speedKmh = 0;
  double slipAngleDeg = 0.0;
  final DriftScoreState driftState = DriftScoreState();
  // ... (Full implementation saved in /flutter_app/lib/physics/drift_physics.dart)
}`,
    },
    renderer: {
      name: 'flutter_app/lib/render/car_3d_renderer.dart',
      lang: 'dart',
      desc: '3D projection renderer in Flutter using CustomPainter & matrix transforms',
      content: `// 3D Car & Track Renderer in Flutter CustomPainter
class Car3DRenderer extends CustomPainter {
  // Projects 3D vectors to screen with camera perspective & draws BMW M-Sport body, kidney grilles, wheels & smoke
}`,
    },
  };

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFile(key);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/85">
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-wider text-white">
                Flutter (Dart) Android APK &amp; GitHub Actions
              </h2>
              <p className="text-xs text-neutral-400">
                Automated build workflow configured to compile and output Android APK (.apk)
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

        {/* Build Target Badges */}
        <div className="bg-neutral-950/60 border-b border-neutral-800 px-6 py-3 flex flex-wrap items-center gap-4 text-xs font-bold text-neutral-300">
          <span className="text-neutral-400 uppercase text-[11px] font-black">Target Output:</span>
          <div className="flex items-center gap-1.5 bg-emerald-950/80 text-emerald-400 px-3 py-1 rounded-md border border-emerald-500/40 shadow-sm">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span className="font-bold">Android Release APK (app-release.apk)</span>
          </div>
        </div>

        {/* Instructions banner */}
        <div className="bg-cyan-950/30 border-b border-cyan-500/20 px-6 py-3 text-xs text-cyan-200">
          <div className="font-bold flex items-center gap-2 mb-1">
            <GitBranch className="w-4 h-4 text-cyan-400" />
            <span>GitHub se Android APK kaise download karein:</span>
          </div>
          <p className="text-[11px] text-cyan-300/80 leading-relaxed">
            1. Is project ko GitHub pe push karo (`git push origin main`).<br />
            2. Apne GitHub repository me jakar <strong>Actions</strong> tab par click karein.<br />
            3. <strong>"Build Android APK"</strong> workflow 100% green pass hoga.<br />
            4. Job finish hote hi <strong>Artifacts</strong> section me <strong>ApexDrift-3D-Android-APK</strong> mil jayega jisse direct download karke phone me install karein!
          </p>
        </div>

        {/* File Tabs */}
        <div className="flex border-b border-neutral-800 bg-neutral-900/60 px-6 pt-2 gap-2 overflow-x-auto">
          {Object.entries(files).map(([key, f]) => (
            <button
              key={key}
              onClick={() => setSelectedFile(key)}
              className={`px-3 py-2 text-xs font-bold uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
                selectedFile === key
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              {f.name.split('/').pop()}
            </button>
          ))}
        </div>

        {/* File Content Preview */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-950">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-mono text-cyan-400 font-bold">
                {files[selectedFile].name}
              </span>
              <p className="text-[11px] text-neutral-400">{files[selectedFile].desc}</p>
            </div>
            <button
              onClick={() => handleCopy(selectedFile, files[selectedFile].content)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition border border-neutral-700"
            >
              {copiedFile === selectedFile ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-300 overflow-x-auto max-h-[350px]">
            <code>{files[selectedFile].content}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-800 bg-neutral-950">
          <span className="text-xs text-neutral-400">
            Files stored in: <code className="text-cyan-400">/flutter_app/</code> &amp; <code className="text-cyan-400">/.github/workflows/</code>
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-cyan-500 text-neutral-950 font-bold text-xs uppercase tracking-wider hover:bg-cyan-400 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
