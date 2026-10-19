"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { CHARACTER_FRAME_ROOT, GAZE_GRID_SIZE, CharacterFrameStore, frameManifestSchema, type FrameManifest } from "@/lib/character-frame-store";

export type CharacterFrameStatus = "loading" | "idle" | "moving" | "paused" | "error";
const HALF_GRID = (GAZE_GRID_SIZE - 1) / 2;
const center = { x: HALF_GRID, y: HALF_GRID };
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
const wrap = (value: number, count: number) => (value % count + count) % count;
const advanceGaze = (value: number, target: number, dt: number) => {
  if (Math.abs(target - value) < .015) return target;
  const limit = Math.min(dt * 60 * 2.5, 2.5);
  return value + clamp((target - value) * (1 - Math.exp(-24 * dt)), -limit, limit);
};

export function useCharacterFrames(heroRef: RefObject<HTMLElement>, canvasRef: RefObject<HTMLCanvasElement>) {
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<CharacterFrameStatus>("loading");
  const [progress, setProgress] = useState(0);
  const [reduced, setReduced] = useState(false);
  const commands = useRef<{ reset: () => void; step: (direction: number) => void; prepare: (direction: number) => void }>(
    { reset: () => {}, step: () => {}, prepare: () => {} },
  );

  useEffect(() => {
    const hero = heroRef.current, element = canvasRef.current;
    const context = element?.getContext("2d", { alpha: true });
    if (!hero || !element || !context) return;
    const canvas = element;
    let manifest: FrameManifest | undefined;
    let disposed = false, visible = true, frame = 0, lastTime = 0;
    let initialized = false, failed = false, lastPath = "", drawCount = 0;
    let x = center.x, y = center.y, target = { ...center };
    let mode: "gaze" | "turn" = "gaze", turn = 0;
    let destination: number | null = null, returning = false;
    let afterNeutral: (() => void) | undefined;
    let loadEpoch = 0;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = matchMedia("(hover: hover) and (pointer: fine)");
    const abort = new AbortController();

    const wake = () => {
      if (!disposed && visible && !document.hidden && !frame && !failed) frame = requestAnimationFrame(tick);
    };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; lastTime = 0; };
    const store = new CharacterFrameStore(innerWidth < 768 ? 16 : 28, wake, () => {
      failed = true; stop(); setStatus("error");
    });
    const paint = (path: string) => {
      if (path === lastPath) return true;
      const image = store.get(path);
      if (!image) { store.request(path, true); return false; }
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      lastPath = path;
      canvas.dataset.renderedFrames = String(++drawCount);
      canvas.dataset.cachedFrames = String(store.size);
      return true;
    };
    const neutralize = (next: () => void) => {
      target = { ...center }; afterNeutral = next;
      if (mode === "turn") { afterNeutral = undefined; next(); }
      wake();
    };
    const turnPath = (end: number) => {
      if (!manifest) return [];
      const count = manifest.turn.frames.length, direction = Math.sign(end - turn) || 1;
      return Array.from({ length: Math.ceil(Math.abs(end - turn)) + 2 }, (_, index) =>
        manifest!.turn.frames[wrap(Math.round(turn) + index * direction, count)]);
    };
    const begin = (end: number, returnToGaze = false) => {
      if (!manifest || !initialized || disposed) return;
      const epoch = ++loadEpoch;
      failed = false;
      afterNeutral = undefined;
      destination = null;
      stop();
      setProgress(0);
      setStatus("loading");
      void store.preload(turnPath(end), value => { if (!disposed && epoch === loadEpoch) setProgress(value); }).then(() => {
        if (disposed || epoch !== loadEpoch) return;
        neutralize(() => { mode = "turn"; returning = returnToGaze; destination = end; setStatus("moving"); wake(); });
      }).catch(() => { if (!disposed && epoch === loadEpoch) setStatus("error"); });
    };
    const step = (direction: number) => {
      if (!manifest) return;
      begin(turn + direction * manifest.turn.frames.length / 12);
    };

    function tick(now: number) {
      frame = 0;
      if (!manifest || failed || disposed) return;
      const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.04) : 1 / 60;
      lastTime = now;
      if (mode === "gaze") {
        const nx = advanceGaze(x, target.x, dt);
        const ny = advanceGaze(y, target.y, dt);
        const index = Math.round(ny) * GAZE_GRID_SIZE + Math.round(nx);
        if (!paint(manifest.gaze.frames[index])) return;
        x = nx; y = ny;
        canvas.dataset.gazeX = ((x - HALF_GRID) / HALF_GRID).toFixed(4);
        canvas.dataset.gazeY = ((y - HALF_GRID) / HALF_GRID).toFixed(4);
        canvas.dataset.frameIndex = String(index);
        canvas.dataset.frameMode = "gaze";
        if (!initialized) {
          initialized = true; setReady(true); setStatus("idle");
        }
        // Predict the same bounded motion used above; never eagerly load the grid.
        let forecastX = x, forecastY = y;
        for (let ahead = 1; ahead <= 8; ahead++) {
          forecastX = advanceGaze(forecastX, target.x, 1 / 60);
          forecastY = advanceGaze(forecastY, target.y, 1 / 60);
          const nextX = clamp(Math.round(forecastX), 0, GAZE_GRID_SIZE - 1);
          const nextY = clamp(Math.round(forecastY), 0, GAZE_GRID_SIZE - 1);
          store.request(manifest.gaze.frames[nextY * GAZE_GRID_SIZE + nextX]);
        }
        if (x !== target.x || y !== target.y) wake();
        else if (afterNeutral) { const action = afterNeutral; afterNeutral = undefined; action(); wake(); }
      } else {
        const count = manifest.turn.frames.length;
        let next = turn;
        if (destination !== null) {
          const delta = destination - turn;
          const framesPerSecond = count / manifest.turn.durationSeconds;
          next = motion.matches ? destination : turn + Math.sign(delta) * Math.min(Math.abs(delta), dt * framesPerSecond, 1);
        }
        const index = wrap(Math.round(next), count);
        if (!paint(manifest.turn.frames[index])) return;
        turn = next;
        canvas.dataset.frameIndex = String(index);
        canvas.dataset.frameMode = "turn";
        canvas.dataset.rotationAngle = (wrap(turn, count) / count * 360).toFixed(2);
        const direction = destination === null ? 1 : Math.sign(destination - turn) || 1;
        for (let ahead = 1; ahead <= 8; ahead++) store.request(manifest.turn.frames[wrap(index + ahead * direction, count)]);
        if (destination !== null && turn === destination) {
          destination = null;
          setStatus("paused");
          if (returning) {
            returning = false; mode = "gaze"; turn = 0; x = HALF_GRID; y = HALF_GRID; target = { ...center };
            setStatus("idle"); wake();
          }
        } else if (destination !== null) wake();
      }
    }

    commands.current = {
      step,
      reset: () => {
        loadEpoch++; failed = false; afterNeutral = undefined; target = { ...center };
        if (mode === "turn" && manifest) {
          const count = manifest.turn.frames.length;
          begin(Math.round(turn / count) * count, true);
        } else setStatus("idle");
        wake();
      },
      prepare: (direction: number) => {
        if (manifest) void store.preload(turnPath(turn + direction * manifest.turn.frames.length / 12)).catch(() => {});
      },
    };
    const move = (event: PointerEvent) => {
      if (!initialized || mode !== "gaze" || afterNeutral || motion.matches || !pointer.matches || event.pointerType === "touch") return;
      const box = canvas.getBoundingClientRect(), bounds = hero.getBoundingClientRect();
      const headX = box.left + box.width * .5, headY = box.top + box.height * .18;
      target = { x: HALF_GRID + clamp((event.clientX - headX) / (bounds.width * .38), -1, 1) * HALF_GRID,
        y: HALF_GRID + clamp((event.clientY - headY) / (bounds.height * .4), -1, 1) * HALF_GRID };
      wake();
    };
    const leave = () => { target = { ...center }; wake(); };
    const preferences = () => {
      setReduced(motion.matches);
      target = { ...center };
      if (motion.matches) { x = center.x; y = center.y; }
      wake();
    };
    const visibility = () => { if (document.hidden) stop(); else wake(); };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) { target = { ...center }; stop(); } else wake();
    }, { threshold: 0 });
    observer.observe(hero);
    hero.addEventListener("pointermove", move, { passive: true });
    hero.addEventListener("pointerleave", leave);
    window.addEventListener("blur", leave);
    document.addEventListener("visibilitychange", visibility);
    motion.addEventListener("change", preferences);
    pointer.addEventListener("change", preferences);
    preferences();
    void fetch(`${CHARACTER_FRAME_ROOT}/manifest.json`, { signal: abort.signal })
      .then(response => { if (!response.ok) throw new Error("No frame manifest"); return response.json(); })
      .then(data => { if (!disposed) { manifest = frameManifestSchema.parse(data); wake(); } })
      .catch(() => { if (!disposed) setStatus("error"); });
    return () => {
      disposed = true; stop(); abort.abort(); store.dispose(); observer.disconnect();
      hero.removeEventListener("pointermove", move); hero.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave); document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", preferences); pointer.removeEventListener("change", preferences);
      commands.current = { reset: () => {}, step: () => {}, prepare: () => {} };
    };
  }, [heroRef, canvasRef]);

  return { ready, status, progress, reduced,
    reset: () => commands.current.reset(), step: (direction: number) => commands.current.step(direction),
    prepare: (direction: number) => commands.current.prepare(direction) };
}
