# Publishing PRIME on GitHub

Repository: [jeevansaibotla/PRIME-WORKOUT-TRACKER](https://github.com/jeevansaibotla/PRIME-WORKOUT-TRACKER)

The repository needs its first source commit before its GitHub Actions workflows can run. Upload the contents of the PRIME project root (the folder containing `package.json`, `src/`, and `android/`), including `.github/workflows/`, `README.md`, and `docs/screenshots/`. Do not upload `node_modules/`, `.env` files, Android signing keys, or `android/keystore.properties`.

## Browser demo with GitHub Pages

1. Push the project to the repository's `main` branch (the workflow also accepts `master`).
2. In GitHub, open **Settings → Pages** and choose **GitHub Actions** as the build/deployment source.
3. The `Deploy browser demo` workflow builds the static SPA, sets the repository subpath, creates a 404 fallback for direct route links, and deploys the artifact.
4. After the workflow succeeds, the demo URL is:

   <https://jeevansaibotla.github.io/PRIME-WORKOUT-TRACKER/>

   The first deployment can take a few minutes. Subsequent pushes to `main` or `master` redeploy the demo. The Home, Profile, Plan, Stats, History and other routes should remain available after refresh.

The browser app stores each visitor's app data in that visitor's browser storage. If a visitor explicitly enables the optional Gemini Coach, their prompt and compact workout context are sent to Google's Gemini API; the README explains this behavior.

## Downloadable signed Android APK

The `Build signed Android release` workflow runs when a version tag such as `v1.0.2` is pushed. It builds a signed release APK and attaches it to a GitHub Release. Before using the workflow, set up a signing key and add its credentials as repository Actions secrets.

### Create and protect an Android signing key

Generate the key locally and keep it backed up somewhere secure. Do not commit the keystore or its passwords; future updates to an installed app must use a key compatible with the original signature.

```bash
keytool -genkeypair -v \
  -keystore prime-release.jks \
  -alias prime \
  -keyalg RSA \
  -keysize 4096 \
  -validity 10000
```

Convert the keystore to one-line Base64. On Linux:

```bash
base64 -w 0 prime-release.jks
```

On macOS:

```bash
base64 < prime-release.jks | tr -d '\n'
```

On PowerShell:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("prime-release.jks"))
```

In the GitHub repository, open **Settings → Secrets and variables → Actions → New repository secret** and add:

- `ANDROID_SIGNING_KEY_BASE64` — the Base64 string for `prime-release.jks`
- `ANDROID_STORE_PASSWORD` — the keystore password
- `ANDROID_KEY_ALIAS` — the alias used above (`prime` if you used the command as written)
- `ANDROID_KEY_PASSWORD` — the private-key password

Do not paste these values into issues, commits, README files or public messages. The workflow writes a temporary ignored `android/keystore.properties` file during the runner job and uses GitHub's encrypted secrets.

### Publish a release

After pushing the app source and adding the four secrets, create and push a version tag:

```bash
git tag v1.0.2
git push origin v1.0.2
```

The workflow uploads `app-release.apk` to the repository's Releases page. Visitors can download it from:

<https://github.com/jeevansaibotla/PRIME-WORKOUT-TRACKER/releases/latest>

Before a later release, update Android's `versionCode` and `versionName` in `android/app/build.gradle`, then create the next version tag (for example `v1.0.3`). Always use the same signing key. Keep the keystore and password backup safe and private.

## README buttons

The repository README links to the live demo and latest release. Those links become usable once the Pages deployment succeeds and the first signed APK release is published.

## License reminder

The public repository and any distributed APK must retain applicable third-party attribution and license material. Review `THIRD_PARTY_NOTICES.md` and the license files before publishing releases; the OpenGym-derived catalogue includes AGPL-3.0-or-later material except the separately identified ExerciseDB/MIT records.
