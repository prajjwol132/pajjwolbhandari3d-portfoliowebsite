"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import Image from "next/image";
import { Component, useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode, type RefObject } from "react";
import { MathUtils, Vector3, type PerspectiveCamera } from "three";
import { usePerformanceSettings } from "@/hooks/use-performance-settings";
import { createDeveloperCharacter } from "@/lib/three/developer-character";
import { DeveloperRoom } from "./developer-room";

export function CharacterPoster() {
  return <Image src="/media/character/room-poster-v2.webp" alt="Cartoon Prajjwol seated in a white and yellow creative studio"
    className="character-poster" fill priority sizes="100vw" />;
}

class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

interface PointerTarget { x: number; y: number; active: boolean }

function CharacterScene({ pointer, angle, reduced, compact, active, host, requestFrame, onReady }: {
  pointer: RefObject<PointerTarget>;
  angle: number;
  reduced: boolean;
  compact: boolean;
  active: boolean;
  host: RefObject<HTMLDivElement>;
  requestFrame: MutableRefObject<() => void>;
  onReady: () => void;
}) {
  const rig = useMemo(() => createDeveloperCharacter(), []);
  const { camera, size, invalidate } = useThree();
  const gaze = useRef({ x: 0, y: 0 });
  const projectedHead = useMemo(() => new Vector3(), []);
  const blink = useRef(0);
  const renderedFrames = useRef(0);
  // Register with the mounted R3F scene, including Strict Mode effect replays.
  useEffect(() => {
    requestFrame.current = invalidate;
    invalidate();
    return () => { if (requestFrame.current === invalidate) requestFrame.current = () => undefined; };
  }, [invalidate, requestFrame]);
  useEffect(() => () => rig.dispose(), [rig]);
  useEffect(() => {
    const lens = camera as PerspectiveCamera;
    const aspect = size.width / Math.max(size.height, 1);
    lens.fov = compact ? 37 : 34;
    const height = compact ? 4.8 : 5.0;
    const fitHeight = height / (2 * Math.tan(MathUtils.degToRad(lens.fov / 2)));
    const fitWidth = (compact ? 2.5 : 5.2) / (2 * Math.tan(MathUtils.degToRad(lens.fov / 2)) * aspect);
    lens.position.set(0, compact ? 2.7 : 3.3, Math.max(fitHeight, fitWidth));
    lens.lookAt(0, compact ? 1.68 : 1.6, 0);
    lens.updateProjectionMatrix();
    rig.root.position.x = compact ? 0 : 0.5;
    invalidate();
  }, [camera, compact, size.width, size.height, rig, invalidate]);
  useEffect(() => {
    onReady();
    if (reduced || !active) return;
    const interval = window.setInterval(() => { blink.current = 0.18; invalidate(); }, 4800);
    return () => window.clearInterval(interval);
  }, [onReady, reduced, active, invalidate]);
  useEffect(() => {
    if (reduced) {
      rig.root.rotation.y = angle - 0.12;
      rig.head.rotation.set(0, 0, 0);
      gaze.current = { x: 0, y: 0 };
    }
    invalidate();
  }, [angle, reduced, rig, invalidate]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const target = pointer.current;
    rig.head.localToWorld(projectedHead.set(0, 0.43, 0)).project(camera);
    const x = !target?.active ? 0 : MathUtils.clamp((target.x - projectedHead.x) * 1.35, -1, 1);
    const y = !target?.active ? 0 : MathUtils.clamp((target.y - projectedHead.y) * 1.5, -1, 1);
    // Reduced motion removes tweening and blinking, not direct user-controlled poses.
    gaze.current.x = reduced ? x : MathUtils.damp(gaze.current.x, x, 9, dt);
    gaze.current.y = reduced ? y : MathUtils.damp(gaze.current.y, y, 9, dt);
    rig.head.rotation.set(-gaze.current.y * 0.4, gaze.current.x * 0.82, -gaze.current.x * 0.035);
    const bodyAngle = angle - 0.12 + gaze.current.x * 0.085;
    rig.root.rotation.y = reduced ? bodyAngle : MathUtils.damp(rig.root.rotation.y, bodyAngle, 7, dt);
    blink.current = Math.max(0, blink.current - dt);
    rig.eyes.forEach((eye, index) => {
      eye.position.x = (index === 0 ? -1 : 1) * 0.222 + gaze.current.x * 0.024;
      eye.position.y = 0.065 + gaze.current.y * 0.024;
      eye.scale.y = blink.current > 0.03 && blink.current < 0.15 ? 0.12 : 1;
    });
    const unsettled = Math.abs(gaze.current.x - x) + Math.abs(gaze.current.y - y)
      + Math.abs(rig.root.rotation.y - bodyAngle);
    if (!reduced && (unsettled > 0.0008 || blink.current > 0)) invalidate();
    if (host.current) host.current.dataset.renderedFrames = String(++renderedFrames.current);
    if (host.current) {
      host.current.dataset.headYaw = rig.head.rotation.y.toFixed(3);
      host.current.dataset.headPitch = rig.head.rotation.x.toFixed(3);
      host.current.dataset.characterAngle = rig.root.rotation.y.toFixed(3);
    }
  });

  return <>
    <DeveloperRoom compact={compact} />
    <primitive object={rig.root} dispose={null} />
    <ContactShadows position={[compact ? 0 : 0.5, 0.005, 0.25]} opacity={0.3}
      scale={5} blur={2.8} far={3.7} resolution={compact ? 128 : 256} frames={1} color="#49483f" />
  </>;
}

export function CharacterHeroCanvas({ heroRef, angle, onAvailabilityChange }: {
  heroRef: RefObject<HTMLElement>;
  angle: number;
  onAvailabilityChange: (available: boolean) => void;
}) {
  const settings = usePerformanceSettings();
  const [ready, setReady] = useState(false);
  const [supported, setSupported] = useState(false);
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const [reduced, setReduced] = useState(true);
  const [compact, setCompact] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const pointer = useRef<PointerTarget>({ x: 0, y: 0, active: false });
  const contextCleanup = useRef<(() => void) | null>(null);
  const requestFrame = useRef<() => void>(() => undefined);
  const handleReady = useCallback(() => setReady(true), []);
  const handleError = useCallback(() => setFailed(true), []);
  useEffect(() => { onAvailabilityChange(ready && supported && !failed); }, [ready, supported, failed, onAvailabilityChange]);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("webgl2");
      setSupported(Boolean(context));
      context?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch { setSupported(false); }
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const narrow = matchMedia("(max-width: 900px)");
    const updateMotion = () => { setReduced(motion.matches); pointer.current = { x: 0, y: 0, active: false }; };
    const updateSize = () => setCompact(narrow.matches);
    const updateTab = () => setTabVisible(!document.hidden);
    const move = (event: PointerEvent) => {
      const hero = heroRef.current?.getBoundingClientRect();
      const bounds = host.current?.getBoundingClientRect();
      if (!hero || !bounds || hero.bottom <= 0 || hero.top >= innerHeight) return;
      pointer.current.x = MathUtils.clamp((event.clientX - bounds.left) / bounds.width * 2 - 1, -1, 1);
      pointer.current.y = MathUtils.clamp(1 - (event.clientY - bounds.top) / bounds.height * 2, -1, 1);
      pointer.current.active = true;
      requestFrame.current();
    };
    const reset = () => { pointer.current = { x: 0, y: 0, active: false }; requestFrame.current(); };
    const leave = (event: PointerEvent) => { if (event.pointerType !== "touch") reset(); };
    const observer = new IntersectionObserver(([entry]) => { setVisible(entry.isIntersecting); if (!entry.isIntersecting) reset(); });
    if (heroRef.current) observer.observe(heroRef.current);
    updateMotion(); updateSize(); updateTab();
    motion.addEventListener("change", updateMotion);
    narrow.addEventListener("change", updateSize);
    document.addEventListener("visibilitychange", updateTab);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    window.addEventListener("blur", reset);
    return () => {
      observer.disconnect();
      motion.removeEventListener("change", updateMotion); narrow.removeEventListener("change", updateSize);
      document.removeEventListener("visibilitychange", updateTab);
      window.removeEventListener("pointermove", move); window.removeEventListener("pointerdown", move);
      document.documentElement.removeEventListener("pointerleave", leave); window.removeEventListener("blur", reset);
    };
  }, [heroRef]);
  useEffect(() => () => contextCleanup.current?.(), []);

  const active = visible && tabVisible && !failed && supported;
  useEffect(() => { if (active) requestFrame.current(); }, [active, reduced]);
  return <div ref={host} className="character-stage" role="img"
    aria-label="Interactive 3D cartoon of Prajjwol in a white and yellow studio"
    data-character-ready={ready && !failed} data-character-active={active}
    data-character-fallback={failed || !supported} data-reduced-motion={reduced}>
    {(!ready || failed || !supported) && <CharacterPoster />}
    {supported && !failed && <SceneBoundary onError={handleError}>
      <Canvas camera={{ fov: 34, near: 0.1, far: 100, position: [0, 3.3, 8] }}
        dpr={settings.isLowTier ? [1, 1] : [1, 1.5]}
        shadows frameloop={active ? "demand" : "never"}
        gl={{ alpha: false, antialias: true, powerPreference: "low-power" }}
        fallback={<CharacterPoster />}
        onCreated={({ gl }) => {
          // Keep offscreen shadow targets transparent; the main framebuffer is opaque.
          gl.setClearColor("#ffffff", 0);
          const lost = (event: Event) => { event.preventDefault(); setFailed(true); };
          gl.domElement.addEventListener("webglcontextlost", lost);
          contextCleanup.current = () => gl.domElement.removeEventListener("webglcontextlost", lost);
        }}>
        <ambientLight intensity={0.7} />
        <hemisphereLight args={["#ffffff", "#c6c3b8", 1]} />
        <directionalLight position={[-3, 7, 5]} intensity={2.5} castShadow
          shadow-mapSize={[settings.isLowTier ? 512 : 1024, settings.isLowTier ? 512 : 1024]}
          shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6}
          shadow-bias={-0.0004} shadow-normalBias={0.025} />
        <directionalLight position={[4, 3, 1]} intensity={0.8} />
        <CharacterScene pointer={pointer} angle={angle} reduced={reduced} compact={compact} active={active} host={host} requestFrame={requestFrame} onReady={handleReady} />
      </Canvas>
    </SceneBoundary>}
  </div>;
}
