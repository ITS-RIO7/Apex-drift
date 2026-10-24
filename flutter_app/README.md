# 🏎️ Apex Drift 3D (Flutter & Dart Engine)

Multi-platform 3D Car Drifting Game built with pure **Flutter & Dart**.
Features authentic Bavarian BMW M-Sport & JDM drift machines, Pacejka drift physics, clipping point scoring, dynamic smoke FX, and open world tracks.

---

## 🚀 GitHub Actions Multi-Platform Build (.APK, .IPA, .EXE)

This repository includes a pre-configured CI/CD workflow at:
`/.github/workflows/build_artifacts.yml`

Whenever you push to `main` or trigger manual dispatch, GitHub Actions automatically builds:
1. **Android APK**: `ApexDrift-Android-Universal-APK` (`.apk` ready for direct phone installation)
2. **Windows EXE**: `ApexDrift-Windows-x64-EXE` (`.zip` containing executable `.exe` and DLLs)
3. **iOS IPA**: `ApexDrift-iOS-IPA` (`.ipa` payload ready for distribution/testing)

### 📲 How to Download APK, IPA & EXE from GitHub:
1. Push this project to your GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "feat: Apex Drift 3D full Flutter project with GitHub Actions"
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git
   git push -u origin main
   ```
2. Go to your repository on GitHub.
3. Click on the **"Actions"** tab at the top.
4. Select the running or completed workflow **"Build Multi-Platform Flutter (APK, IPA, EXE)"**.
5. Scroll down to the **"Artifacts"** section at the bottom of the page.
6. Click on:
   - `ApexDrift-Android-Universal-APK` to download the Android `.apk`
   - `ApexDrift-Windows-x64-EXE` to download the Windows `.exe`
   - `ApexDrift-iOS-IPA` to download the iOS `.ipa`

---

## 🛠️ Running Locally (Developer Guide)

### Prerequisites:
- Flutter SDK (>= 3.24.x)
- Dart SDK (>= 3.0.0)

### 1. Install Dependencies:
```bash
cd flutter_app
flutter pub get
```

### 2. Run on Device or Emulator:
- **Android**: `flutter run -d android`
- **Windows**: `flutter run -d windows`
- **iOS (Mac)**: `flutter run -d ios`
- **Chrome / Web**: `flutter run -d chrome`

### 3. Build Locally:
- **Android APK**: `flutter build apk --release`
- **Windows EXE**: `flutter build windows --release`
- **iOS**: `flutter build ipa --no-codesign`

---

## 🎮 Game Features & Controls

- **Steer**: `A` / `D` or Left / Right Arrows (or on-screen touch steering)
- **Throttle / Gas**: `W` or Up Arrow (or on-screen GAS pedal)
- **Brake / Reverse**: `S` or Down Arrow (or on-screen REV pedal)
- **Handbrake Drift**: `Spacebar` (or on-screen DRIFT button)
- **Nitro Boost**: `Shift`
- **Camera Mode**: `C` (Chase, Close, Hood, Drone)
- **Reset Car**: `R`
- **Pause Menu**: `Esc`
