# PRIME update — implementation and build notes

## Included

- The supplied PRIME icon replaces the red mark in the profile, browser favicon/app icon, Android launcher resources and Android splash screens.
- The exercise screen loads the OpenGym movement catalogue from a local bundled JSON file only when the screen is opened. Search covers exercise names, muscles, equipment, category, targets, supporting muscles and descriptions; it supports muscle/type filters and custom local movements.
- Exercise details show step-by-step instructions and a three-frame animated visual when an animation match exists. The active workout has an expandable technique guide with cue-by-cue navigation and the same animated visual. Exercises without a matching visual retain their written coaching.
- The animation set is from Workout Guide by Bryl Lim, with some underlying artwork by Everkinetic. It is licensed CC BY-SA 4.0; this project resizes/converts the frames and must preserve the attribution and share-alike terms. See `public/exercise-guide/ATTRIBUTION.md`, `LICENSE-ASSETS.txt`, `LICENSES.md`, and `src/lib/workout-guide-manifest.json`. The 302 movements (906 frames) are a partial visual library, not a match for every OpenGym exercise. OpenGym's restricted Gym Visual media was not reused.
- The former Muscle page appears as Stats in navigation. Muscle balance, fatigue and retained-strength views are history-derived; the separate Progress screen remains separate. All target muscles remain in one continuous list. Each mini-map is now a centered, single-view crop: posterior targets (including traps, back/lats, lower back, glutes and hamstrings) use the back geometry; other targets use the front geometry. The anatomy origin is adjusted per SVG viewBox, the target area is highlighted in blue even when there is no training history, and the map colors/outlines have higher contrast. Training values themselves still reflect logged workout history.
- Plan has an explicit Coach action. Opening Coach there immediately presents a seven-step, selection-based intake for goal, experience, weekly frequency, session length, available equipment, focus and movement limits. It produces a reviewable workout draft from PRIME's local exercise library; the user may replace or append exercises to the selected day only. Other split days are preserved. New exercise loads start unset for editing in Split Builder. Home Coach remains unchanged and retains its existing chat/quick actions.
- The Plan builder is local/template-based and does not send intake answers to an AI service. PRIME's existing chat still has offline responses and an optional Gemini connection. OpenGym catalogue reuse is documented in `THIRD_PARTY_NOTICES.md` and the upstream notice/license files. Review the included AGPL-3.0 notice and obligations before redistributing the combined app.
- Home motivation rotates among short, attributed lines from David Goggins, Muhammad Ali, LeBron James and Virat Kohli, alongside original strength-oriented PRIME prompts. Sources and one corrected common misattribution are recorded in `QUOTE_SOURCES.md`.

## Known parity limits

The Plan's selection flow and local draft-to-split application implement the main guided workout-building path, but this is not OpenGym's complete, service-backed AI Coach. It does not add OpenGym's multi-provider/admin setup, server-side intake and consent pipeline, AI-authored plan revisions, guarded apply/revert flow, detailed workout-debrief pipeline or optional cohort comparisons. The local builder cannot guarantee clinical suitability; users with pain or injuries are advised to consult a qualified clinician.

The independent CC BY-SA illustration set covers only 302 movements. Unmatched exercises show written coaching without a third-party animation.

## Validation

- `npm run build` — passed after the Coach and Stats updates.
- `npx tsc --noEmit` — passed.
- Targeted ESLint on edited TypeScript/TSX files — passed.
- Headless Chromium verification — the Plan Coach opened its seven-question flow, built a proposal and applied its exercises into the selected day's split; the Stats page was visually checked at a phone-sized viewport.
- `npm run cap:sync` — passed after the final source update and refreshed Android's bundled web assets.
- Android APK compilation was attempted but is blocked in this build environment because the Android SDK is not installed (`ANDROID_HOME` is unset). Open the `android/` project in Android Studio with an Android SDK configured to produce/install the APK.
