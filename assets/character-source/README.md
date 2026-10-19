# Character Source Artwork

## Current Full-Frame Animation

`frame-sequence-v1/` contains seven selected transparent keyframe strips generated with the built-in image tool on 2026-10-11. Exact prompts and generation mode are recorded in `frame-sequence-v1/prompts.json`. The supplied seated portrait and turnaround are the identity references. No remote paid 3D/video service was used.

`scripts/prepare-character-frames.py --rife <local-tool-directory>` registers the source figures, runs local RIFE v4.6 interpolation, and exports complete RGBA WebP frames. See `docs/character-preview.md` for rebuilding, runtime behavior and known visual limitations. The older assets below are retained for provenance, not used as head layers by the current hero.

## Four-View Rotation Assets

Generated with the built-in image-generation tool on 2026-10-10. The source files were copied into this folder and exported by `scripts/prepare-character-rotation.mjs`. No paid external 3D generation service was used. The artwork is a sprite sequence, not a rigged model.

### Transparent Turnaround Prompt

Input: `public/media/character/turnaround.png`. Output: `assets/character-source/turnaround-cutouts.png`. Transparent background enabled.

Use case: background-extraction. Edit the attached four-view character turnaround into a transparent sprite sheet for a website. Preserve the exact four existing character-and-chair views, their face, hair, glasses, pose, white clothing, watch, shoes, yellow chair, wooden chair legs and black cross-braces. Remove ONLY the white studio background, floor shadow, and all text labels. Keep white trousers, T-shirt and white shoe surfaces fully opaque. Four separate complete figures, one horizontal row, in the same left-to-right order: front, three-quarter, profile, back. Keep each figure entirely inside its own equal-width column with safe transparent gaps; no overlap between columns. Align the top of the hair and lowest shoe to the same horizontal guide across all four. No new angles, no redesign, no anatomy changes, no extra limbs, no cropped shoes or chair legs. Output a high-resolution true RGBA transparent PNG, ideally at least 2048 pixels wide, retaining sharp details. This is asset extraction, not a new character interpretation.

### Empty Room Prompt

Input: `public/media/character/room-poster.webp`. Output: `assets/character-source/room-empty.png`. Transparent background disabled.

Use case: precise-object-edit. Edit target: the attached portfolio studio background. Remove ONLY the seated foreground man, his yellow chair, their chair legs, shoes, and their floor shadows/reflections. Fill those removed areas with the uninterrupted white studio wall, white skirting and pale floor behind them. Preserve the camera, crop, aspect ratio, lighting, white wall, the yellow recessed wall niche at right-center, and the far-right desk, laptop, secondary white chair, shelves, books and decorations EXACTLY. Do not move, resize or add furniture. Keep the right edge cropped as in the original. The result must be the same empty white-and-yellow room, with clean unoccupied foreground for compositing an animated character. High-quality crisp photo-like 3D render, landscape 1672x941 composition, no people, no foreground chair, no text.

## Optional Modeling Reference

`a-pose.png` is a raster modeling reference, not a 3D model. It was generated with the built-in image-generation tool on 2026-10-10, using `public/media/character/turnaround.png` as the identity reference. The user subsequently chose free/local work focused on the existing preview's head movement. This reference is retained for future modeling but is not loaded by the website, and no paid 3D API task was submitted.

## Generation Prompt

Use case: identity-preserve. Asset type: single image reference for real 3D character reconstruction and skeletal rigging. Use the attached turnaround as the exact character identity and outfit reference. Generate ONE single full-body character standing upright, facing directly forward, symmetrical relaxed A-pose with both arms angled 35 degrees away from the torso, hands open and fingers individually readable, feet hip-width apart. Preserve this young adult man's recognizable face, warm medium-brown skin, thick swept black quiff, dark eyebrows, small moustache and subtle chin beard, friendly restrained closed-lip smile, slim body and gently oversized animation-character head. Preserve charcoal gray unbuttoned overshirt over a white tee, off-white trousers, white sneakers with saturated yellow #ffd60a accents, and black wristwatch on his left wrist. Thin metal rounded-square eyeglasses with almost-clear lightly tinted lenses; both eyes fully visible. Same polished high-quality stylized 3D character as reference, detailed clean sculpting and fabric. Character isolated on pure white, uniform neutral studio lighting, minimal tiny ground shadow, orthographic-like front camera with no foreshortening. All fingers, arms, legs, hair and shoes in frame with margin. Portrait composition, maximum available image detail. NO chair, no desk, no room, no additional heads or views, no text, no labels, no border. The only intended change from reference is standing A-pose instead of sitting; keep identity and clothing consistent.
