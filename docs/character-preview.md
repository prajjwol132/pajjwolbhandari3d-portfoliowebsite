# Full-Frame Seated Character

## Current Result

Both `/` and `/character-preview` render complete character-and-chair frames on one 2D canvas. The current v3 set has **4,225 gaze frames** (65 x 65 positions) and **768 chronological turning frames**. Each adjacent source gaze pose has 31 in-between images on both axes; each source turn segment has 63. This doubles the sampling density on each axis compared with v2, using the same source artwork. No head cutout, independently transformed face layer, CSS flip, or runtime cross-fade is used.

The seated reference guides the generated face, glasses, dark hair, charcoal overshirt, white clothing, watch and yellow chair. The existing room now uses a separate full-hero `object-fit: cover` layer, extending behind the right-hand content and bottom stats/controls without letterboxing. The independently sized character does not enlarge/crop with the room. Contact shadows are baked immediately under shoe/chair-leg tips in each frame; the detached CSS shadow has been removed. Typography, CMS content, controller, logos and other portfolio sections remain unchanged. The original room poster is retained as the initial/error fallback.

This is an **image-based 3D-like animation**, not a reconstructed or rigged 3D model. The eyes/head directions are baked into full frames, not independently controlled bones. Generated views approximate the unseen geometry. RIFE improves transitions substantially over plain dissolves, but some turning in-betweens still soften or distort chair legs, shoes and overlapping limbs. Neither more frames nor frame interpolation guarantees exact geometry or perfect identity from a single photograph. Physical accuracy would require a consistent 3D render/video source. Do not describe this as artifact-free, independently rigged, or guaranteed 60 FPS.

## Changed Files

```text
src/components/3d/
  rotation-hero-scene.tsx          # Full-bleed room + responsive character viewport
  character-controls.tsx          # Left / Face cursor / Right icon controls
src/hooks/use-character-frames.ts # Cursor mapping, easing, player lifecycle
src/lib/character-frame-store.ts  # Typed manifest, prefetch, decoded-image LRU
src/app/character-hero.css        # Scoped controls, existing layout retained
scripts/prepare-character-frames.py
scripts/character-frame-requirements.txt
scripts/capture-character-preview.mjs
tests/browser/character-hero.spec.ts
tests/browser/character-preview.spec.ts
tests/browser/portfolio.spec.ts
```

The prior `use-character-gaze.ts`, `use-character-rotation.ts`, procedural avatar and head-atlas experiments are not imported by the current hero. They are retained as earlier work, not active dependencies.

## Asset Structure

```text
assets/character-source/frame-sequence-v1/
  prompts.json                    # Exact built-in image-generation prompts
  gaze-up.png                     # Left/up, up, right/up complete seated poses
  gaze-level.png                  # Left, front, right complete seated poses
  gaze-down.png                   # Left/down, down, right/down poses
  turn-0.png ... turn-3.png        # Generated front/side/rear source poses
public/media/character/
  room-poster.webp                # Supplied portrait, initial/error fallback
  rotation/room.webp              # Existing empty white/yellow room
  frames-v3/
    manifest.json                 # Dimensions, row-major gaze and ordered turn URLs
    neutral.webp
    gaze/0000.webp ... 4224.webp
    turn/0000.webp ... 0767.webp
artifacts/character-frame-build/     # Ignored local RIFE build tools
artifacts/character-frame-build-v3/  # Current interpolation cache and visual audit
```

All runtime character frames are 480 x 720 WebP. The complete library is 268,322,162 bytes (about 268 MB, including the neutral poster), **not an initial page download**. An asset audit verified all 4,993 animation frames have alpha, the expected dimensions, and distinct encoded data within each sequence. Only the neutral frame (gaze index 2112) is required initially. Gaze prefetch predicts the next eight steps toward the pointer. Angle buttons prefetch their upcoming 64-frame segment. Compressed blobs use a 192-item LRU bound; decoded images have a separate 16/28-item bound. The entire grid is never eagerly loaded on desktop or touch.

## Interaction

- Cursor events are attached to the hero only. X/Y are measured relative to the character's face, then mapped to the bounded gaze grid.
- Exponential easing and a one-grid-cell-per-tick limit prevent pointer jumps from skipping intermediate poses. Gaze advances at up to 60 cells/second, easing into the target; prediction uses the same calculation as playback. Each draw replaces the complete image; the stationary lower body is baked into those files.
- Leaving the hero or blurring the window returns gaze to the neutral front view. No continuous idle render loop runs after settling.
- The yellow `Rotate Character` command and automatic spinning option have been removed as requested. Only the three icon buttons remain, with accessible names and tooltips; loading/errors are announced by a status region.
- Controls are ordered **Rotate left / Face cursor / Rotate right**, both visually and in keyboard tab order. Left/right buttons move one twelfth of the turn using 64 ordered frames, at a nominal 60 frames/second and at most one frame per browser animation tick. The speed comes from the manifest's 12.8-second full-turn duration. The animation stops at the selected angle. `Face cursor` takes the shortest turn back to front, then restores gaze tracking. No horizontal mirroring is used.
- Cursor gaze is suspended during full-body rotation and while paused at a non-front view. The supplied data does not cover independent gaze at every body angle.
- Touch uses neutral gaze with tap-accessible angle controls. Enter/Space activate buttons. Reduced motion disables cursor animation and jumps directly to the requested angle.
- Playback suspends while offscreen/hidden and excludes that elapsed time when resuming. If a required frame is not decoded, the previous frame stays visible until it is ready; there is no blank frame or catch-up leap.
- Decoded images use an LRU limit of 16 on small screens or 28 on desktop, with three concurrent decodes. Recent compressed blobs are cached for repeat moves. Bitmaps are closed on eviction/unmount; requests, RAFs, media listeners and observers are cleaned up.
- Failed initial assets preserve the original seated poster. A failed later download preserves the last complete frame and supports retry via the controls.

The player retains the current frame while a missing next frame decodes. It never skips ahead to catch up after a slow device or hidden tab. More temporal samples improve motion granularity but cannot repair all generated geometry; physical-device FPS still depends on hardware and network conditions.

## Install / Run

No new npm runtime dependency is required. Existing servers remain at `http://localhost:3000` and `http://localhost:3001`; the latter is the tested preview. For a fresh checkout:

```powershell
npm ci
npm run dev -- --port 3002
```

For browser tests against another server:

```powershell
$env:PLAYWRIGHT_BASE_URL = 'http://localhost:3002'
npm run type-check
npm run lint
npx playwright test tests/browser/character-hero.spec.ts tests/browser/character-preview.spec.ts tests/browser/portfolio.spec.ts tests/browser/controller.spec.ts
node scripts/capture-character-preview.mjs
npm run build
```

## Rebuild Frames Locally

The exported WebPs are committed assets; Python/RIFE are **not** required by Next.js or the production host. Source PNGs and exact prompts are included for reproducibility. Generative source output is not deterministic.

The final in-betweens use [RIFE ncnn Vulkan](https://github.com/nihui/rife-ncnn-vulkan), release `20221029`, model `rife-v4.6`, running on the local GPU. Download the official portable Windows release and extract it to a build-only folder. Do not deploy the executable/model files.

```powershell
py -m venv .venv-character
.\.venv-character\Scripts\python.exe -m pip install -r scripts/character-frame-requirements.txt
.\.venv-character\Scripts\python.exe scripts/prepare-character-frames.py --rife artifacts/character-frame-build/rife/rife-ncnn-vulkan-20221029-windows
```

The script normalizes transparency, removes isolated matte debris, registers full figures to a fixed canvas, and interpolates color and coverage separately before restoring RGBA. It keeps a stationary lower-body region in the exported gaze images; this is offline pixel preparation, not a movable head layer in the app. It finds local silhouette minima at floor-contact points and composites tight contact/soft ambient shadows behind them. The rotation sequence closes with the same front keyframe and omits its duplicate final frame. Contact sheets and byte counts are written to `artifacts/character-frame-build-v3/`. Add `--reuse` to reuse matching cached RIFE outputs when adjusting shadows/export settings; source pixel arrays are compared before reuse, and interpolation density is part of the cache path.

Without `--rife`, the build script uses [OpenCV DIS optical flow](https://docs.opencv.org/5.0/examples/samples_python_snippets_dis_opt_flow_py.html). That is a diagnostic fallback and produces worse large-angle artifacts; the shipped assets were built with RIFE.

## Test Checklist

1. Move within the hero to all four corners and reverse direction quickly. The complete character should look toward the pointer without a separately floating head. The chair/body should remain stationary during gaze.
2. Leave the hero. Confirm neutral return and that the rendered-frame counter stops changing after settling.
3. Step left/right, check that each move animates then stops, and reset to front. Repeated steps reach front/side/rear views and wrap around. Inspect shoes/chair legs for the synthesis limitations above. There should be no yellow rotation button.
4. Tab through the three icon controls and activate using Enter/Space. Test tap and normal page scrolling on mobile. Enable reduced motion and verify immediate angle changes.
5. Scroll away during rotation and return. Verify there is no time jump. Simulate a failed image request; the canvas must never clear to a blank character.
6. Verify menu, section links, project filtering/modal, gallery and Xbox controller still work.

Browser tests use the actual character files, not colored stand-ins, and count the intermediate frames actually displayed during an angle step. They verify all 65 columns of a cursor sweep without skipped columns, distinct encoded in-between images, left/face/right tab order, and that the dense gaze grid is not downloaded initially. Screenshot/pixel audits cover 1880x900, 1440x900, 1024x768, 768x1024, 390x844, 320x740, 844x390 and 667x375, including full room coverage. Tests verify behavior and layout, not subjective perfection of generated anatomy. Emulated mobile checks do not replace testing on physical low-power devices.
