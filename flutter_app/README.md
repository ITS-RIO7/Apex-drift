# 🏎️ Apex Drift 3D (Flutter & Dart Android APK Engine)

Full 3D Car Drifting Game built with **Flutter & Dart** featuring real BMW M-Sport & JDM drift machines, Pacejka physics, dynamic tire smoke, and multiple maps.

---

## 📲 Automated Android APK Build (GitHub Actions)

This repository includes a dedicated, 100% reliable CI/CD workflow at:
`/.github/workflows/build_apk.yml`

Whenever you push to `main` or trigger a manual dispatch, GitHub Actions builds:
- 📱 **`ApexDrift-3D-Android-APK`**: Full Release APK ready for direct Android phone installation.

### 📥 How to Download the APK from GitHub:
1. Push this project to your GitHub repository:
   ```bash
   git add .
   git commit -m "feat: Apex Drift 3D Android APK workflow"
   git push origin main
   ```
2. Go to your repository on GitHub.
3. Click on the **"Actions"** tab at the top.
4. Select the workflow **"Build Android APK"**.
5. Once the job finishes with a green checkmark, scroll down to the **"Artifacts"** section.
6. Click on **`ApexDrift-3D-Android-APK`** to download `app-release.apk` directly to your computer or phone!

---

## 🛠️ Local Android Build (Optional)
If you have the Flutter SDK installed on your computer:
```bash
cd flutter_app
flutter pub get
flutter build apk --release
```
The generated APK will be at:
`flutter_app/build/app/outputs/flutter-apk/app-release.apk`

---

## 🎮 Game Features & Controls
- **Steer**: `A` / `D` or on-screen touch arrow buttons
- **Throttle / Gas**: `W` or on-screen GAS pedal
- **Brake / Reverse**: `S` or on-screen REV pedal
- **Handbrake Drift**: `Spacebar` or on-screen DRIFT button
- **Nitro Boost**: `Shift`
- **Camera Mode**: `C` (Chase, Close, Hood, Drone)
- **Reset Car**: `R`
- **Pause**: `Esc`
