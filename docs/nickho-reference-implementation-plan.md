# Nick Ho Reference Audit And Implementation Plan

This document treats `nickho-motorsports.nl` as a visual and interaction reference only. The implementation in this portfolio uses Prajjwol Bhandari's own assets, copy, projects, and CMS data.

## Reference Technology Findings

- Hosting/build surface: Webflow-generated HTML/CSS/JS.
- Asset CDN: `cdn.prod.website-files.com`.
- Styling: Webflow CSS with custom dark/white/yellow visual system.
- Motion libraries detected in page source: GSAP 3.15, ScrollTrigger, SplitText, CustomEase, Lenis, Swiper 12, Three.js r128, HLS.js, Finsweet Attributes, Webflow runtime, and Slater custom script.
- Interaction pattern: smooth scrolling, scroll-triggered reveals, draggable/swiper gallery elements, media hover states, and full-screen hero image effects.

## Reference Page Map

1. Hero
   - Full viewport dark photographic layout.
   - Logo top-left, yellow square/menu action top-right.
   - Vertical guide lines over imagery.
   - Left telemetry numbers.
   - Large central numeric identity.
   - Name and bio anchored near bottom-left.
   - Location/stat cluster on the right.
   - Black-and-white imagery with selective color interaction.

2. Manifesto And Partners
   - White background.
   - Small floating media thumbnails.
   - Huge uppercase quote centered.
   - Yellow emphasis words.
   - Sparse partner/logo grid.
   - Small yellow CTA.

3. History
   - Long black section.
   - Centered vertical stack of grayscale media cards.
   - Yellow active marker and slide count.
   - Large negative space around the cards.

4. Media And Articles
   - White section.
   - Oversized pale background heading.
   - Compact row of article/media cards.

5. Calendar
   - Black section.
   - Centered title.
   - Dense list/table rows with thin dividers.

6. Promo / Sponsorguide Equivalent
   - White section.
   - Checkerboard top texture.
   - Small yellow CTA centered in large whitespace.

7. Gallery
   - Large central media card.
   - Oversized pale `Gallery` background word.
   - Tilted thumbnail carousel composition.

8. Footer / Contact
   - Dark footer.
   - Navigation/contact links.

## Implementation Decision

The existing project is already a Next.js 14 App Router build with Supabase CMS, Lenis, GSAP, Tailwind, and admin routes. Recreating the app in Vite would discard the working CMS and deployment setup, so the implementation stays in Next.js while matching the reference behavior and structure.

## Implementation Plan

1. Keep the full-screen hero as a photographic background using Prajjwol's image.
2. Use a grayscale base image plus masked color image layer for cursor-following color reveal.
3. Use the latest brief's yellow menu button and an animated full-screen section menu.
4. Match the full-page section order from the reference screenshot.
5. Remove the extra standalone About/Profile section from the replica page flow.
6. Replace abstract placeholder blocks with media-like cards using existing local assets.
7. Add GSAP/ScrollTrigger polish for reveal, parallax, and history card motion.
8. Keep the black/white/gray/`#ffd60a` palette.
9. Preserve responsive behavior for desktop, laptop, tablet, and mobile.
10. Verify with type-check, lint, production build, and Playwright screenshots.

## Current Implementation Targets

- `src/components/sections/portfolio-hero-section.tsx`: full-bleed image, damped cursor color reveal, subtle photographic parallax, logo, menu, telemetry.
- `src/components/sections/reference-portfolio-page.tsx`: full-page section structure matching the reference screenshot.
- `src/components/sections/reference-scroll-effects.tsx`: GSAP/ScrollTrigger reveal and parallax layer.
- `public/media/brand/*`: Prajjwol logo and main photo.
- `public/media/projects/*`: project media cards for history/media/gallery sections.

## October 10, 2026 Implementation

The attached brief is the current specification. In particular, it restores the hamburger menu requested by the reference and adds functional media, contact, and gallery interactions.

### Observed Reference

Source: https://nickho-motorsports.nl/ (page source and Chromium inspection).

- Live headings use Anton. Body copy uses Helvetica. This build self-hosts the open-source Anton font from Google Fonts, including its OFL license, and uses a system Helvetica/Arial stack for body text.
- The page exposes two canvases. Its image/depth-map assets and Three.js scripts establish a layered photographic WebGL presentation, not evidence of a downloadable car GLB. This build reproduces the visible depth response with composited photo transforms and a cursor mask. It does not claim to reproduce the original shader.
- The reference has a full-screen menu, hero, statement and partners, five history chapters, article carousel, calendar, sponsor-guide CTA, featured media, gallery, contact form, and legal/credit links. The supplied screenshot captures only some animation states; invisible text in that capture is not treated as intentionally absent content.

### Section Mapping

| Reference | Portfolio | Interaction |
| --- | --- | --- |
| Driver introduction | Prajjwol's full-screen portrait and CMS profile | Grayscale/color cursor mask; photographic parallax; section link |
| Corner menu | About, History, Projects, Calendar, Gallery, Contact | Animated Radix dialog; focus trap; Escape; smooth anchor navigation |
| Driver statement | Development manifesto and personal photos | Scroll reveal and small image parallax |
| Sponsors | Technology marks | Local SVG assets; hover lift; collaboration CTA |
| Career chapters | Five personal journey chapters | Sticky chapter index, active counter, image reveals; flowing mobile layout |
| Media and articles | Project case studies | CMS category filters, horizontal carousel, video preview, project modal |
| Race calendar | Project calendar | CMS project creation dates, categories and stacks; rows open case studies |
| Sponsor-guide download | Resume and collaboration | CMS resume link or existing `/resume` route |
| Featured film | CMS video when available, otherwise personal photo | Native video controls or gallery link |
| Gallery | Supplied personal photographs and uploaded project images | Previous/next, swipe, arrow keys, image lightbox |
| Contact | Name, email and message | Browser validation and encoded mailto draft; copyable email |
| Footer | Profile contact, configured social links, section links and credits | `/privacy`, return to top, external links |

### Data And Assets

`PortfolioContentProvider` shares one profile request and one project/category request across the hero, showcase, calendar, gallery and footer. Existing Supabase admin routes and database tables are retained. Profile name, title, headline, biography, location, metrics, email, avatar, social links and resume come from `profiles`. Published project totals, categories, metadata, thumbnails, video and galleries come from `projects`/`categories`.

The manifesto and five journey paragraphs are authored locally. The technology marks identify tools, not claimed sponsors. The calendar represents stored project creation dates, not invented upcoming events. No unprovided phone number, social account or client endorsement is fabricated.

If Supabase is unavailable, existing example project records and a local profile render. A successful empty query now remains empty; deleting all published projects in the dashboard no longer brings sample projects back. Example project images are excluded from the personal gallery. Add published projects and actual case-study assets through the existing CMS to replace sample content.

Personal media comes from the supplied `3d website infromation` directory. `prepare-portfolio-media.mjs` generates WebP derivatives without replacing source photos. The hero uses a 1920px-wide WebP. Other images are lazy loaded. Stack marks are sourced from Simple Icons with its license retained. No reference-site photographs or proprietary Helvetica font files were copied.

### Motion And Performance

- Color reveal and image parallax update through refs and CSS variables, without React rendering on every pointer move.
- The hero animation loop sleeps when its target settles and cancels when off-screen or unmounted.
- Touch and reduced-motion devices retain a static grayscale hero.
- GSAP registrations use matchMedia cleanup; reduced motion omits scroll transforms.
- Lenis anchor navigation has a native reduced-motion fallback. Dialogs pause background scrolling and permit their own scrolling.
- Project dialogs are lazy loaded. Hover video uses muted playback and stops on pointer exit/focus loss.
- The photographic hero stays CSS-based. The tools section now loads the user-supplied Xbox controller in a separate, viewport-gated R3F canvas, as requested in the later controller update below.

### Contact Delivery

The contact form opens an email draft in the visitor's configured mail app. It does not silently store a message or claim delivery. Actual server-delivered email requires a configured delivery service, which is outside this UI update. The privacy page documents the draft behavior and credits.

### Verification

- `npm run type-check`, `npm run lint`, `npm run build`.
- `npm run test:browser` against `http://localhost:3001`, or a URL set via `PLAYWRIGHT_BASE_URL`.
- Chromium desktop and mobile checks cover section presence, asset loading, horizontal overflow, menu/Escape/focus restoration, smooth anchors, category filters, case-study dialogs, calendar actions, gallery controls/lightbox, form validation, and reduced motion.
- Pixel checks compare monochrome and cursor-revealed regions; remote CMS fixtures verify successful empty responses.
- Screenshots and source-inspection artifacts go into ignored `artifacts/`; failure traces go into ignored `test-results/`.
- Emulated mobile Chromium is not a physical-device Safari or sustained FPS benchmark. No locked 60 FPS claim is made.

Local development uses `.next-dev` by default; production uses `.next`, preventing simultaneous build/dev cache corruption. An additional preview server can use its own output directory:

```powershell
$env:NEXT_DIST_DIR='.next-preview'
node node_modules/next/dist/bin/next dev -p 3001
```

## Controller And Tool Marks Update

The live reference's [helmet animation module](https://assets.slater.app/slater/20545/63174.js?v=740341) uses a 180-frame image sequence, not a helmet GLB. It rotates continuously, adds scroll velocity with inertia, follows the last scroll direction, scales in on entry, and grows slightly through the section. This portfolio recreates that behavior using the user's actual controller GLB and React Three Fiber rather than downloading the reference's frame sequence.

- `public/models/xbox-controller/controller.glb`: original 1.22 MB self-contained model from the supplied ZIP, with its embedded textures and materials retained. No external texture/HDR requests or additional model tooling are needed.
- `controller-canvas.tsx`: normalized model bounds, aspect-aware framing, inertial rotation, pointer tilt, scroll velocity/direction response, and GSAP entrance animation. The cached model is reused; R3F owns renderer teardown.
- Rendering stops outside the viewport and in hidden tabs. Small/low-tier devices use DPR 1 and a lower maximum spin speed. Reduced-motion visitors receive a static rendered pose. Unsupported WebGL, context loss, or loading errors use a locally rendered controller poster.
- `technology-field.tsx`: Tailwind CSS, Django, Python, Next.js, React, MySQL, HTML, DaVinci Resolve, Premiere Pro, Vercel, and GitHub. Local monochrome Simple Icons assets preserve the surrounding visual style. The Premiere Pro mark comes from the published 11.15.0 release.
- The controller pops into the space immediately below the manifesto, with its stage centered 120px below the final line. Desktop holds it near viewport center as scrolling brings the logo columns around it, then releases it into the grid. Compact layouts reserve room below the text and keep the controller there, ahead of the lower two portraits and logo grid, to prevent overlap. Rendering visibility follows the translated canvas rather than the later logo section.
- The ZIP did not contain a license or author attribution file. Model publication rights remain the asset owner's responsibility; no license or author is inferred.

`scripts/capture-controller.mjs` captures six responsive widths, verifies loaded logos and canvas pixel variation, checks overlap/overflow, and generates the original-model poster. `tests/browser/controller.spec.ts` checks animated pixel changes, framing, scroll/pointer input, offscreen pausing, reduced motion, and context-loss fallback. These are browser checks, not a physical-device FPS guarantee.
