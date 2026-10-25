# Third-party notices

## SVG muscle-map geometry

PRIME includes a port of the body-map path geometry from the openGym project:

- Repository: https://github.com/DuarteSantos8/openGym
- Source file: `frontend/src/lib/body-paths.js`
- Original geometry attribution: MuscleMap by Melih Colpan, MIT licensed.

The geometry is used only as functional SVG path data. PRIME applies its own ivory/cobalt visual system, interaction states, muscle weighting, and workout data calculations.

## OpenGym exercise catalogue

PRIME includes a modified JSON export of 5,632 movement records (names, body-part/equipment metadata, targets, descriptions and instructions) from [DuarteSantos8/openGym](https://github.com/DuarteSantos8/openGym), files under `catalogue/`. OpenGym catalogue material is offered under GNU AGPL-3.0-or-later except records identified as `textSource: exercisedb`, which carry the MIT terms reproduced in `NOTICE.md` (ExerciseDB v1 / hasaneyldrm/exercises-dataset). See `THIRD_PARTY_AGPL-3.0.txt` and the upstream notices; preserve these notices and meet applicable AGPL source-offer obligations when distributing a combined application.

**OpenGym exercise images and animations are not redistributed.** OpenGym’s `NOTICE.md` restricts those Gym visual assets from extraction into independent apps without a separate Gym Visual licence. PRIME keeps OpenGym movement metadata and written instructions, and uses an independently licensed illustration set for matched exercises (see the Exercise animation illustrations notice below).

## User-provided PRIME icon

`public/prime-app-icon.png`, `public/favicon.png`, and Android launcher icon renditions are adapted from the icon image supplied by the user for this project.

## Exercise animation illustrations

PRIME bundles selected/adapted three-frame illustrations from [Workout Guide](https://github.com/bryllim/workout-guide), created by Bryl Lim, with first-pose artwork derived from Everkinetic. The visual assets are licensed under **CC BY-SA 4.0**. PRIME converts 512 px PNG source frames into 256 px WebP files and displays the three frames as a looping animation. Preserve `public/exercise-guide/ATTRIBUTION.md`, `LICENSE-ASSETS.txt`, `LICENSES.md`, and `src/lib/workout-guide-manifest.json`; the adaptations must remain under CC BY-SA 4.0. Asset-source and exact frame provenance are recorded in the shipped manifest.
