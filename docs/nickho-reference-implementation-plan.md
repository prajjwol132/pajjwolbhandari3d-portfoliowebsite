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
3. Remove the extra top menu and keep a single yellow contact action.
4. Match the full-page section order from the reference screenshot.
5. Remove the extra standalone About/Profile section from the replica page flow.
6. Replace abstract placeholder blocks with media-like cards using existing local assets.
7. Add GSAP/ScrollTrigger polish for reveal, parallax, and history card motion.
8. Keep the black/white/gray/`#ffd60a` palette.
9. Preserve responsive behavior for desktop, laptop, tablet, and mobile.
10. Verify with type-check, lint, production build, and Playwright screenshots.

## Current Implementation Targets

- `src/components/sections/portfolio-hero-section.tsx`: hero image, cursor color reveal, logo, contact CTA, telemetry.
- `src/components/sections/reference-portfolio-page.tsx`: full-page section structure matching the reference screenshot.
- `src/components/sections/reference-scroll-effects.tsx`: GSAP/ScrollTrigger reveal and parallax layer.
- `public/media/brand/*`: Prajjwol logo and main photo.
- `public/media/projects/*`: project media cards for history/media/gallery sections.
