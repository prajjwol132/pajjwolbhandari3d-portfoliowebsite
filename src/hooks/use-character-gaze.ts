"use client";

import { useEffect, type RefObject } from "react";

/** Small 2D portrait tilt, not a facial rig or a synthesized head turn. */
export function useCharacterGaze(heroRef: RefObject<HTMLElement>, headRef: RefObject<HTMLDivElement>, enabled: boolean) {
  useEffect(() => {
    const hero = heroRef.current;
    const head = headRef.current;
    if (!hero || !head) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    let visible = true;
    let raf = 0;
    let previousTime = 0;
    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;
    let rendered = 0;
    let bounds = head.getBoundingClientRect();
    const allowed = () => enabled && visible && !document.hidden && !reduced.matches && fine.matches;
    const paint = () => {
      // Rotation is anchored inside the original neck; no body/chair transform.
      head.parentElement?.style.setProperty("--gaze-opacity", x === 0 && y === 0 ? "0" : "1");
      head.style.transform = `perspective(900px) rotateY(${x * 5}deg) rotateX(${-y * 3}deg) rotateZ(${x * 1.4}deg)`;
      head.dataset.gazeX = x.toFixed(4);
      head.dataset.gazeY = y.toFixed(4);
      head.dataset.renderedFrames = String(++rendered);
    };
    const tick = (now: number) => {
      raf = 0;
      const dt = previousTime ? Math.min((now - previousTime) / 1000, 0.05) : 1 / 60;
      previousTime = now;
      const alpha = 1 - Math.exp(-10 * dt);
      x += (targetX - x) * alpha;
      y += (targetY - y) * alpha;
      const settled = Math.abs(targetX - x) + Math.abs(targetY - y) < 0.0005;
      if (settled) { x = targetX; y = targetY; }
      paint();
      if (!settled && allowed()) raf = requestAnimationFrame(tick);
      else { previousTime = 0; head.style.willChange = "auto"; }
    };
    const wake = () => {
      if (!raf && allowed()) { head.style.willChange = "transform"; raf = requestAnimationFrame(tick); }
    };
    const reset = () => {
      targetX = 0; targetY = 0;
      if (allowed()) wake();
      else { cancelAnimationFrame(raf); raf = 0; previousTime = 0; x = 0; y = 0; paint(); head.style.willChange = "auto"; }
    };
    const measure = () => { bounds = head.getBoundingClientRect(); reset(); };
    const move = (event: PointerEvent) => {
      if (!allowed() || event.pointerType === "touch") return;
      if (event.target instanceof Element && event.target.closest("button, a, input, [role=dialog]")) { reset(); return; }
      const area = hero.getBoundingClientRect();
      if (event.clientX < area.left || event.clientX > area.right || event.clientY < area.top || event.clientY > area.bottom) { reset(); return; }
      targetX = Math.max(-1, Math.min(1, (event.clientX - bounds.left - bounds.width * 0.55) / Math.max(180, area.width * 0.4)));
      targetY = Math.max(-1, Math.min(1, (event.clientY - bounds.top - bounds.height * 0.45) / Math.max(140, area.height * 0.4)));
      wake();
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; reset(); });
    observer.observe(hero);
    const resize = new ResizeObserver(measure);
    resize.observe(hero);
    hero.addEventListener("pointermove", move, { passive: true });
    hero.addEventListener("pointerleave", reset);
    window.addEventListener("blur", reset);
    window.addEventListener("scroll", measure, { passive: true });
    document.addEventListener("visibilitychange", reset);
    reduced.addEventListener("change", reset);
    fine.addEventListener("change", reset);
    paint();
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect(); resize.disconnect();
      hero.removeEventListener("pointermove", move); hero.removeEventListener("pointerleave", reset);
      window.removeEventListener("blur", reset); window.removeEventListener("scroll", measure);
      document.removeEventListener("visibilitychange", reset);
      reduced.removeEventListener("change", reset); fine.removeEventListener("change", reset);
      head.style.transform = "none"; head.style.willChange = "auto";
      head.parentElement?.style.setProperty("--gaze-opacity", "0");
    };
  }, [heroRef, headRef, enabled]);
}
