# Android release build

The app is a Capacitor shell that loads `https://app.roughcut.com.au`. `npm run build` is NOT
needed for the APK/AAB: `webDir` is `public`, which only holds the offline fallback page.

Requirements: JDK 21, Android SDK (`android/local.properties` with `sdk.dir=...`, gitignored),
`android/key.properties` (see SIGNING.md).

1. Clean checkout of `main`.
2. `npm ci`
3. `npx cap sync android`
4. Build:

       cd android
       ./gradlew bundleRelease assembleRelease
       ./gradlew --stop

5. Copy outputs to `release/` (gitignored) as `roughcut-v<versionName>-vc<versionCode>.{apk,aab}`:
   - `android/app/build/outputs/apk/release/app-release.apk`
   - `android/app/build/outputs/bundle/release/app-release.aab`
6. Verify the signature:

       apksigner verify --print-certs release/roughcut-v1.0-vc1.apk

Bump `versionCode` in `android/app/build.gradle` for every build handed out (Play rejects reuse).
