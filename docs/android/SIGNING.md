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

- Keystore: `RoughCutoughcut-upload.keystore` (existing, alias `roughcut`, not new)
- SHA-1: AB:B0:79:45:77:96:A1:02:C6:5E:BB:17:36:1F:57:F3:BA:13:DC:CE
- SHA-256: 15:44:3F:94:33:BE:1D:F7:66:2D:09:6B:A8:C7:F8:66:56:0F:BD:F3:26:2D:91:AE:9A:C8:59:1A:47:95:2A:71

Read them with:

    keytool -list -v -keystore ..\roughcut-upload.keystore -alias <key alias>

## After first Play upload

1. Play Console -> your app -> Test and release -> App integrity -> App signing.
2. Copy the "App signing key certificate" SHA-256.
3. Add it to `public/.well-known/assetlinks.json` in `sha256_cert_fingerprints`, alongside the
   upload key (replace the `UPLOAD_KEY_SHA256_TBD` placeholder with the real upload fingerprint).
4. Deploy, then verify on a device:

       adb shell pm get-app-links au.com.roughcut
