# Interactive Character Hero - Implementation History

**Current implementation:** See [full-frame character integration](character-preview.md). Both `/` and `/character-preview` use 4,225 whole-character gaze frames and 768 turn frames. The room covers the whole hero, and contact shadows meet the shoe/chair tips. Controls are ordered left / Face cursor / right; the yellow rotate/autoplay command has been removed. This is a frame-based approximation, not a rigged model; some turn in-betweens retain synthesis artifacts.

The sections below document earlier experiments and asset provenance, not current runtime behavior. The current frame assets use built-in image generation and local RIFE interpolation, with no paid external API submission. The controller, MongoDB logo, CMS and other sections remain unchanged.

## Scope

Replaces the photographic introduction. The latest revision restores the Xbox controller and adds MongoDB as a regular technology logo beside GitHub. The manifesto, projects, galleries, admin routes, and existing CMS schema are unchanged.

## Requested Rigged Replacement: Pending Asset

The earlier fully rigged replacement remains pending an appropriate asset. After trying and rejecting head-only image deformation, the user requested the four-view sprite approach described in `character-preview.md`. That preview now rotates the whole seated character using front, three-quarter, profile and back views. The existing procedural homepage has not been replaced and is not an accepted likeness match. Neither the current preview nor the earlier `head-views` and `room-body` concept assets are a rigged character.

The connected service lists image-to-3D models, but its available generation command rejects 3D output and refers to a `generate_3d` command that is not exposed in this session. No 3D generation was submitted or paid for.

Required deliverable: a textured GLB (preferred) or FBX, matching the charcoal jacket, white clothing, yellow-accented shoes, glasses, hair and face in the supplied turnaround. Include a skinned body with named hips/spine/neck/head bones, separately controllable left/right eyes, and preferably blink morph targets. The yellow chair should be a separate object. A neutral A-pose with bind transforms intact is suitable for posing the character in the chair. Use approximately 30,000-60,000 triangles and 1K-2K textures for the website, subject to visual review.

Once available: inspect the skeleton, clone it with SkeletonUtils, preserve bind quaternions, constrain head/neck and eye tracking, pose the seated body, and verify front/side/back appearance and cursor response on mobile/desktop. Automatic body rigging alone does not guarantee eye controls or likeness.

The displayed name, headline, biography, tagline, location, role, experience metric, custom-code metric, and project count still use `usePortfolioContent`. The character design is a code-owned asset, not an avatar upload from the dashboard.

## Assets

- `public/media/character/turnaround.png`: generated front, three-quarter, profile, and back design reference.
- `public/media/character/room-poster.webp`: original generated studio artwork, retained as design reference.
- `public/media/character/room-poster-v2.webp`: loading/no-WebGL poster captured from the current live model using `scripts/capture-character-poster.mjs`, so appearance matches the scene.
- `src/lib/three/developer-character.ts`: actual three-dimensional geometry, including complete chair, clothing, glasses, hair, face, hands, shoes, and separately articulated eyes/head.

The original reference images were generated with the built-in image generation tool using the user's photograph. The live model is a custom, stylized approximation built in Three.js; it is not an automatically reconstructed or rigged version of the generated image. Side/back details are artistic interpretations because a single photograph does not supply them. The current poster is a browser capture of that live model, not a separate generated character.

## Interaction and Rendering

- Cursor/touch coordinates are projected relative to the character's head, not just the page center.
- Damped yaw, pitch, subtle tilt, and pupil offsets support every pointer direction without React renders on mousemove.
- Turn-left/right controls move in 45-degree steps; reset returns to the front. Geometry exists around the entire character.
- Mobile receives a tighter scene, centered camera, lower pixel ratio, smaller shadow map, and simpler room.
- Demand rendering runs only while gaze/rotation settles or the character blinks; it pauses between interactions, outside the hero, and when the tab is hidden. Reduced motion removes interpolation and blinking but allows immediate, directly controlled head poses and manual view controls.
- Lost/unsupported WebGL keeps the matching studio poster and all HTML navigation/content usable. Unavailable 3D controls are disabled.
- The scene owns and disposes its materials/geometries. R3F owns renderer cleanup. All DOM listeners, observers, and blink timers are removed on unmount.

## Cursor and Likeness Revision

The earlier implementation ignored pointer input completely when the operating system requested reduced motion. It now distinguishes direct interaction from automatic animation. Frame invalidation is registered by the mounted R3F scene rather than just `Canvas.onCreated`, so Strict Mode effect replay does not leave a stale wake-up callback. Actual pose attributes update even for single-frame reduced-motion interactions.

The character now follows the source photograph more closely: warm skin, narrower face, thin metal tinted sunglasses, swept black hair, restrained facial hair, checked brown/olive blazer, off-white clothing, brown shoes and a wristwatch. The procedural plaid texture is disposed with the rig. This remains a stylized approximation, not an exact facial reconstruction; a photo-matched artist-sculpted/rigged asset would be needed for substantially closer facial fidelity.

## Controller and Technology Logos

- `src/components/3d/controller-canvas.tsx` loads the original textured Xbox GLB from `public/models/xbox-controller/controller.glb` using `useGLTF`. Its cached geometry and textures are not disposed by individual scene clones.
- `public/media/stack/mongodb.svg` is sourced from `https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/mongodb.svg`; the existing Simple Icons license is retained in that folder.
- The existing entrance remains anchored 120px below the final manifesto line, with desktop scroll positioning, inertial spin and pointer tilt.
- Play/pause controls permit explicit animation opt-in under reduced motion. Hidden scenes and hidden tabs do not render continuously.
- Demand-rendered states are invalidated when scroll/reveal changes, so a paused or reduced-motion controller cannot get stuck at zero entrance scale.
- The original controller PNG is the loading and context-loss fallback. MongoDB is the twelfth static technology logo, not a replacement for the controller.

## Generation Prompts

Tool: built-in `image_gen.imagegen`, not the API/CLI fallback.

### Turnaround

Use case: stylized-concept. Create a polished 3D cartoon character turnaround model sheet based on the young adult man in the reference photograph, for his personal developer portfolio. Preserve recognizable warm medium-brown skin, thick side-swept black hair with a quiff, dark eyebrows, black rounded-square glasses (clear lightly tinted lenses so eyes can be seen), small mustache, friendly smile and slim build. Stylized high-end vinyl/clay 3D animation character, gently oversized head, sophisticated clean sculpting not photoreal. Outfit adapts his jacket into a charcoal casual jacket over white shirt, off-white trousers, white sneakers with saturated yellow #ffd60a accents and a black wristwatch. Main character seated relaxed on a yellow modern chair, in a matte WHITE and saturated YELLOW creative studio room, white floor, yellow vertical wall panel, simple white desk with laptop. Deliver one wide 3:2 character sheet: four separated equally sized full-body views FRONT, LEFT THREE-QUARTER, RIGHT PROFILE, BACK of the same consistent seated character, all feet included, same scale, pure white background and faint contact shadows. Under each pose only a tiny gray view label. No website UI, no car, no motorbikes, no photo background. The room is only faintly suggested through white/yellow chair; character is the focus. Keep every view spatially separate and crisp.

### Room Poster

Use case: stylized-concept. Create a single 16:9 wide 3D studio render for a developer portfolio hero, based on the exact cartoon character in this reference turnaround. Same young adult man, warm medium-brown skin, swept black quiff, round-square glasses through which dark friendly eyes are visible, slight mustache, smiling, charcoal jacket over plain white tee, white trousers and white/yellow sneakers, black watch. Seated full-body on a saturated #ffd60a yellow modern chair near horizontal 56% of image. All feet and chair included. A bright matte WHITE minimalist creative room, soft daylight, polished stylized 3D clay sculpture quality. White floor, yellow tall rectangular architectural wall recess behind right of character, small white desk and laptop farther to right, subtle white wall shelves. Composition: empty pure white left 34% for live typography, main seated character takes central 35%, mostly empty far-right 15%. Eye-level camera tilted just slightly down, soft grounded contact shadows. No text, no labels, no UI, no gray overlays, no cars, no plants, no other people, no border.

## Validation

```bash
npm run type-check
npx playwright test tests/browser/character-hero.spec.ts tests/browser/controller.spec.ts tests/browser/portfolio.spec.ts
node scripts/capture-character-hero.mjs
npm run build
```

The capture script checks six viewport sizes from 320px to 1880px, saves four turntable angles, checks canvas pixel variation and horizontal overflow, and collects runtime errors. Browser tests verify pointer/touch direction, turntable/reset behavior, direct input without idle motion, offscreen pause, context loss, missing WebGL, controller playback, CMS content, and existing navigation. These are functional and visual checks, not a guarantee of 60 FPS on every GPU.
