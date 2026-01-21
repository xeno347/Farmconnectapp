# FarmConnect App (React Native)

This repository contains a **bare React Native** app (TypeScript).

## Starting fresh on **Windows** (what to download/install)

### 1) Git
- Install **Git for Windows** (for cloning/pulling).

### 2) Node.js
- Install **Node.js LTS** (Node **20+** recommended for this project).
- This also installs **npm**.

### 3) Java (JDK)
- Install **JDK 17** (recommended for modern React Native Android builds).

### 4) Android Studio + Android SDK
Install **Android Studio** (includes the Android SDK + tools).

In Android Studio SDK Manager, make sure you have:
- **Android SDK Platform** (a recent stable API level)
- **Android SDK Build-Tools**
- **Android SDK Platform-Tools** (contains `adb`)
- **Android Emulator** (optional if you test on an emulator)

Also install an emulator image (AVD) OR enable **USB debugging** on a physical Android device.

### 5) Environment variables (Windows)
Set these (System Environment Variables):
- `ANDROID_HOME` → your Android SDK path (commonly: `C:\Users\<you>\AppData\Local\Android\Sdk`)
- Add to `Path`:
  - `%ANDROID_HOME%\platform-tools`
  - `%ANDROID_HOME%\emulator` (optional)
  - `%ANDROID_HOME%\tools` and `%ANDROID_HOME%\tools\bin` (if present)

### 6) Optional but recommended
- **VS Code**
- **Android Studio (Emulator)** or a real device

> iOS builds are not supported on Windows. You can run **Android on Windows**, and run **iOS on macOS**.

## Project setup (after installing the above)

1) Install JavaScript dependencies:
- `npm install`

2) Create `.env` in the project root (required):
```properties
API_BASE_URL=https://farm-connect.amritagrotech.com
```

3) Start Metro:
- `npm start`

4) Run Android:
- `npm run android`

## Notes
- This project uses `react-native-dotenv` via Babel (`@env`) to load `API_BASE_URL`.
- If Android builds fail on a new machine, re-check **JDK 17**, **ANDROID_HOME**, and that `adb` works.
