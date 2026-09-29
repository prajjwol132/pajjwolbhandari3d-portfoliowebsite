"use client";

import { useEffect } from "react";
import { gsap, registerScrollTrigger } from "@/lib/gsap";

export function ReferenceScrollEffects() {
  useEffect(() => {
    const ScrollTriggerPlugin = registerScrollTrigger();

    if (!ScrollTriggerPlugin) {
      return;
    }

    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-reference-reveal]").forEach((element) => {
        gsap.from(
          element,
          {
            autoAlpha: 0,
            duration: 0.85,
            ease: "power3.out",
            immediateRender: false,
            y: 56,
            scrollTrigger: {
              trigger: element,
              start: "top 86%",
              end: "bottom 20%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-reference-parallax]").forEach((element) => {
        const distance = Number(element.dataset.referenceParallax || "80");

        gsap.fromTo(
          element,
          { y: -distance * 0.35 },
          {
            ease: "none",
            y: distance,
            scrollTrigger: {
              trigger: element,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-history-card]").forEach((element, index) => {
        gsap.from(
          element,
          {
            autoAlpha: 0.28,
            duration: 0.7,
            ease: "power2.out",
            immediateRender: false,
            rotate: index % 2 === 0 ? -2 : 2,
            scale: 0.92,
            y: 42,
            scrollTrigger: {
              trigger: element,
              start: "top 74%",
              end: "bottom 38%",
              scrub: 0.8,
            },
          },
        );
      });
    });

    window.requestAnimationFrame(() => ScrollTriggerPlugin.refresh());

    return () => {
      context.revert();
    };
  }, []);

  return null;
}
