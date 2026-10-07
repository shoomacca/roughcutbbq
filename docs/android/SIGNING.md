# Android signing

## Keystore location

The upload keystore lives OUTSIDE the repo:

    C:\Users\Corsa\.antigravity\projects\RoughCut\roughcut-upload.keystore

Keep a backup copy somewhere else (password manager vault / offline drive). If it is lost,
the upload key must be reset through Play support. Never commit keystores or `android/key.properties`.

## android/key.properties

Create `android/key.properties` (gitignored) with:

    storeFile=../../roughcut-upload.keystore
    storePassword=<store password>
    keyAlias=<key alias>
    keyPassword=<key password>

`storeFile` is resolved with `rootProject.file(...)`, i.e. relative to the `android/` folder:
`android/../../roughcut-upload.keystore` is `...\RoughCut\roughcut-upload.keystore`
(the repo is `...\RoughCut\roughcutbbq`).

Release tasks (`bundleRelease`, `assembleRelease`) fail with a clear error if this file is missing.
Debug builds do not need it.

## Upload key fingerprints

- SHA-1: TBD
- SHA-256: TBD

Read them with:

    keytool -list -v -keystore ..\roughcut-upload.keystore -alias <key alias>

## After first Play upload

1. Play Console -> your app -> Test and release -> App integrity -> App signing.
2. Copy the "App signing key certificate" SHA-256.
3. Add it to `public/.well-known/assetlinks.json` in `sha256_cert_fingerprints`, alongside the
   upload key (replace the `UPLOAD_KEY_SHA256_TBD` placeholder with the real upload fingerprint).
4. Deploy, then verify on a device:

       adb shell pm get-app-links au.com.roughcut
