"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import { CharacterControls } from "@/components/3d/character-controls";
import { useCharacterFrames } from "@/hooks/use-character-frames";
import { CHARACTER_AXIS_X, CHARACTER_POSTER, CHARACTER_ROOM, CHARACTER_ROOM_SIZE } from "@/lib/character-assets";

export function RotationHeroScene({ heroRef, posterSrc, roomSrc, showControls = false }: {
  heroRef: RefObject<HTMLElement>;
  posterSrc: string;
  roomSrc: string;
  showControls?: boolean;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [posterReady, setPosterReady] = useState(false);
  const [roomReady, setRoomReady] = useState(false);
  const [roomFailed, setRoomFailed] = useState(false);
  const player = useCharacterFrames(heroRef, canvas);
  const ready = player.ready && roomReady;

  useLayoutEffect(() => {
    const element = viewport.current;
    const composition = scene.current;
    if (!element || !composition) return;
    const resize = () => {
      const { width, height } = element.getBoundingClientRect();
      const compact = window.innerWidth <= 900;
      const availableHeight = Math.max(0, height - (compact ? 58 : 56));
      const scale = compact ? availableHeight / CHARACTER_ROOM_SIZE[1]
        : Math.min(width / CHARACTER_ROOM_SIZE[0], availableHeight / CHARACTER_ROOM_SIZE[1]);
      composition.style.setProperty("--portrait-scale", String(scale));
      composition.style.left = `calc(50% - ${compact ? (CHARACTER_AXIS_X - CHARACTER_ROOM_SIZE[0] / 2) * scale : 0}px)`;
      composition.style.top = `${availableHeight / 2}px`;
      element.dataset.sceneScale = scale.toFixed(5);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element); resize();
    return () => observer.disconnect();
  }, []);

  return <div className="character-stage portrait-stage rotation-stage" role="group" aria-label="Character studio"
    data-motion-mode="full-character-frames" data-character-ready={ready || posterReady} data-portrait-loaded={ready}
    data-character-fallback={roomFailed || player.status === "error"} data-rotation-status={player.status} data-reduced-motion={player.reduced}>
    <div className="character-room-backdrop" aria-hidden>
      <Image src={roomSrc || CHARACTER_ROOM} alt="" fill unoptimized sizes="100vw" priority
        onLoad={() => setRoomReady(true)} onError={() => setRoomFailed(true)} />
    </div>
    <div className="seated-original" style={{ visibility: ready ? "hidden" : "visible" }}>
      <Image src={posterSrc || CHARACTER_POSTER} alt="Prajjwol seated on his yellow chair in a white and yellow studio"
        fill priority unoptimized sizes="100vw" draggable={false} onLoad={() => setPosterReady(true)} />
    </div>
    <div ref={viewport} className="character-subject-viewport">
      <div ref={scene} className="portrait-composition">
        <div className="seated-turntable" aria-hidden={!ready} style={{ visibility: ready ? "visible" : "hidden" }}>
          <canvas ref={canvas} className="portrait-figure" width={480} height={720}
            role="img" aria-label="Prajjwol seated on a yellow chair, following your cursor" />
        </div>
      </div>
      {showControls && <CharacterControls {...player} ready={ready} status={roomFailed ? "error" : player.status} />}
    </div>
  </div>;
}
