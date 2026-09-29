"use client";

import type Lenis from "@studio-freight/lenis";
import { syncLenisWithScrollTrigger as syncLenis } from "@/lib/gsap";

export function syncLenisWithScrollTrigger(lenis: Lenis) {
  return syncLenis(lenis);
}
