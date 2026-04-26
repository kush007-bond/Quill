# Quill Cross-Platform App Conversion Plan

## 1. Overview
Convert the existing browser-based Quill markdown writing app into a native-like cross-platform application supporting:
- Desktop: Windows, macOS
- Mobile: iOS, Android
Reuse the existing React 18 + Vite codebase as much as possible, with minimal rewrites.

## 2. Target Platforms & Tech Stack
| Platform | Tooling | Rationale |
|----------|---------|-----------|
| Windows/Mac (Desktop) | Tauri v2 | Lightweight (~10MB bundles), secure Rust backend, native OS integration |
| iOS/Android (Mobile) | Capacitor 6 | Wraps existing React web app into native containers, no React Native rewrite needed |
| Shared Core | Existing React 18 + Vite + Zustand + CodeMirror 6 | Reuse current codebase, avoid redundant work |

## 3. Prerequisites
- Node.js 18+ installed
- Rust toolchain (for Tauri desktop builds)
- Xcode (for iOS builds, macOS only)
- Android Studio (for Android builds)
- Existing Quill project dependencies installed (`npm install`)

## 4. Phased Implementation Plan

### Phase 1: Codebase Preparation & Core Gap Fixes (1-2 weeks)
Address existing gaps from `CLAUDE.md` to make the app functional for native use:
1. Add persistence layer:
   - Use `zustand/middleware` for localStorage/IndexedDB persistence in web
   - Add Tauri's `@tauri-apps/plugin-store` for desktop native storage
   - Add `@capacitor/preferences` for mobile native storage
2. Implement folder hierarchy UI (wire existing `folders[]` store to UI)
3. Build basic settings UI (use existing `src/types/settings.ts` shape)
4. Fix responsive UI:
   - Add mobile-friendly touch targets, safe area insets
   - Adjust layout for split/preview modes on small screens

### Phase 2: Desktop App Setup (Tauri) (1 week)
1. Initialize Tauri in the project:
   ```bash
   npm install @tauri-apps/cli@latest
   npx tauri init
   ```
2. Configure `tauri.conf.json`:
   - Set app name, version, bundle identifiers
   - Enable required plugins: store, fs, dialog, menu
3. Replace browser-specific APIs with Tauri equivalents:
   - File system access for document import/export
   - Native menu bar with app controls
4. Test Windows/Mac builds locally:
   ```bash
   npx tauri build
   ```

### Phase 3: Mobile App Setup (Capacitor) (1-2 weeks)
1. Add Capacitor to the project:
   ```bash
   npm install @capacitor/core @capacitor/cli
   npx cap init Quill com.quill.md
   ```
2. Add iOS/Android platforms:
   ```bash
   npm install @capacitor/ios @capacitor/android
   npx cap add ios
   npx cap add android
   ```
3. Configure Capacitor plugins:
   - `@capacitor/filesystem` for document storage
   - `@capacitor/status-bar` for mobile status bar theming
   - `@capacitor/splash-screen` for app launch screens
4. Adjust Vite config to output static files for Capacitor:
   - Set `base: './'` for relative paths
5. Sync and test on simulators:
   ```bash
   npx cap sync
   npx cap run ios
   npx cap run android
   ```

### Phase 4: Cross-Platform Polish & Native Integrations (1 week)
1. Unified persistence: Write a storage abstraction layer to switch between web/desktop/mobile storage automatically
2. Native integrations:
   - Dark mode sync with OS system settings (Tauri/Capacitor APIs)
   - Native share sheet for exporting documents (mobile)
   - Drag-and-drop file import (desktop)
3. Performance optimizations:
   - Lazy load components for mobile
   - Optimize bundle size for app stores
4. Test all platforms for consistency

### Phase 5: Build, Test & Distribution (1 week)
1. Desktop distribution:
   - Windows: `.exe` installer, `.msi` package via `tauri-build`
   - macOS: `.dmg` disk image, notarize for macOS Gatekeeper
2. Mobile distribution:
   - iOS: Build archive via Xcode, submit to App Store
   - Android: Generate signed APK/AAB, submit to Play Store
3. Set up basic CI/CD (GitHub Actions) to automate builds for all platforms

## 5. Timeline Estimate
Total: 5-7 weeks for full cross-platform release.

## 6. Risks & Mitigations
- **Risk**: Tauri/Capacitor version conflicts with existing dependencies → Mitigation: Pin all dependency versions, test incrementally
- **Risk**: Mobile UI not responsive enough → Mitigation: Use Chrome DevTools mobile emulator early, test on real devices
- **Risk**: App store rejection for minimal features → Mitigation: Prioritize core writing features first, add advanced features post-launch
