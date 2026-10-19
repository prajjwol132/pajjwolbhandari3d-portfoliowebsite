"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { CHARACTER_ROOM, CHARACTER_SEQUENCE, characterManifestSchema, rotationFrameAt, type CharacterSequence } from "@/lib/character-assets";

type Status = "checking" | "unavailable" | "idle" | "loading" | "playing" | "paused" | "error";

export function useCharacterRotation(heroRef: RefObject<HTMLElement>, canvasRef: RefObject<HTMLCanvasElement>) {
  const [status, setStatus] = useState<Status>("checking");
  const [reason, setReason] = useState("Checking rotation assets.");
  const [progress, setProgress] = useState(0);
  const [displaying, setDisplaying] = useState(false);
  const [reduced, setReduced] = useState(false);
  const actions = useRef({ toggle: () => {}, reset: () => {} });

  useEffect(() => {
    const abort = new AbortController();
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const images: HTMLImageElement[] = [];
    const room = new window.Image();
    let sequence: CharacterSequence | null = null;
    let state: Status = "checking";
    let visible = true;
    let playing = false;
    let ready = false;
    let raf = 0;
    let previousTime = 0;
    let elapsed = 0;
    let index = 0;
    let drawn = -1;
    let disposed = false;
    let loadFailed = false;
    const releaseImages = () => {
      for (const image of images) if (image) { image.onload = null; image.onerror = null; image.removeAttribute("src"); }
      images.length = 0;
      room.removeAttribute("src");
    };
    const updateStatus = (next: Status) => { state = next; if (!disposed) setStatus(next); };
    const stopLoop = () => { cancelAnimationFrame(raf); raf = 0; previousTime = 0; };
    const paint = () => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (!canvas || !context || !sequence || !images[index]) return false;
      if (drawn === index) return true;
      if (canvas.width !== sequence.width || canvas.height !== sequence.height) {
        canvas.width = sequence.width; canvas.height = sequence.height;
      }
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(images[index], 0, 0);
      drawn = index;
      canvas.dataset.frame = String(index);
      return true;
    };
    const tick = (now: number) => {
      raf = 0;
      if (!sequence || !playing || !visible || document.hidden || disposed) return;
      if (previousTime) elapsed += now - previousTime;
      previousTime = now;
      index = rotationFrameAt(elapsed, sequence);
      if (!paint()) { fail("Character playback is unavailable in this browser."); return; }
      raf = requestAnimationFrame(tick);
    };
    const resume = () => {
      if (!raf && playing && visible && !document.hidden) raf = requestAnimationFrame(tick);
    };
    const fail = (message: string) => {
      loadFailed = true; playing = false; stopLoop();
      releaseImages();
      if (!disposed) { setDisplaying(false); setReason(message); updateStatus("error"); }
    };
    const loadFrames = async () => {
      if (!sequence) return;
      const currentSequence = sequence;
      updateStatus("loading");
      let next = 0;
      let completed = 0;
      const load = async () => {
        while (!disposed && !loadFailed && next < currentSequence.frames.length) {
          const position = next++;
          const image = new window.Image();
          images[position] = image;
          image.src = currentSequence.frames[position].src;
          await image.decode();
          if (disposed || loadFailed) return;
          if (image.naturalWidth !== currentSequence.width || image.naturalHeight !== currentSequence.height) {
            throw new Error("Rotation frames must have identical registered dimensions.");
          }
          setProgress(Math.round(++completed / currentSequence.frames.length * 100));
        }
      };
      try {
        room.src = CHARACTER_ROOM;
        await room.decode();
        await Promise.all(Array.from({ length: 4 }, load));
        if (disposed || loadFailed) return;
        ready = true;
        index = 0;
        if (!paint()) throw new Error("Canvas unavailable");
        setDisplaying(true);
        playing = !preference.matches;
        updateStatus(playing ? "playing" : "paused");
        resume();
      } catch {
        fail("A rotation frame could not load. The original portrait is still available.");
      }
    };
    actions.current = {
      toggle: () => {
        if (!sequence || state === "loading" || state === "error") return;
        if (!ready) { void loadFrames(); return; }
        if (preference.matches) {
          index = (index + Math.max(1, Math.round(sequence.frames.length / 24))) % sequence.frames.length;
          elapsed = index / sequence.frames.length * sequence.durationSeconds * 1000;
          paint(); setDisplaying(true); updateStatus("paused"); return;
        }
        playing = !playing;
        setDisplaying(true);
        updateStatus(playing ? "playing" : "paused");
        if (playing) resume(); else stopLoop();
      },
      reset: () => {
        playing = false; stopLoop(); elapsed = 0; index = 0; drawn = -1;
        setDisplaying(false);
        if (sequence && state !== "loading" && state !== "error") updateStatus("idle");
      },
    };
    const activity = () => {
      if (document.hidden || !visible) { stopLoop(); if (playing) updateStatus("paused"); }
      else { if (playing) updateStatus("playing"); resume(); }
    };
    const motion = () => {
      setReduced(preference.matches);
      if (preference.matches && playing) { playing = false; stopLoop(); updateStatus("paused"); }
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; activity(); });
    if (heroRef.current) observer.observe(heroRef.current);
    document.addEventListener("visibilitychange", activity);
    preference.addEventListener("change", motion);
    motion();
    void (async () => {
      try {
        const response = await fetch(CHARACTER_SEQUENCE, { signal: abort.signal });
        if (!response.ok) throw new Error("Manifest unavailable");
        const manifest = characterManifestSchema.parse(await response.json());
        if (disposed) return;
        if (manifest.kind === "unavailable") { setReason(manifest.reason); updateStatus("unavailable"); }
        else { sequence = manifest; setReason(""); updateStatus("idle"); }
      } catch {
        if (!disposed) { setReason("No validated 360-degree sequence is available."); updateStatus("unavailable"); }
      }
    })();
    return () => {
      disposed = true; abort.abort(); stopLoop(); observer.disconnect();
      document.removeEventListener("visibilitychange", activity);
      preference.removeEventListener("change", motion);
      releaseImages();
      actions.current = { toggle: () => {}, reset: () => {} };
    };
  }, [heroRef, canvasRef]);

  return { status, reason, progress, displaying, reduced,
    toggle: () => actions.current.toggle(), reset: () => actions.current.reset() };
}
