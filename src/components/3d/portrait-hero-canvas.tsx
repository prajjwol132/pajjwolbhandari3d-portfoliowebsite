"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import Image from "next/image";
import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState,
  type MutableRefObject, type ReactNode, type RefObject } from "react";
import { MathUtils, PlaneGeometry, SRGBColorSpace, Vector3, type OrthographicCamera } from "three";
import { createPortraitUniforms, HEAD_ANCHOR, HEAD_CENTER_OFFSET, HEAD_SIZE,
  PORTRAIT_HEADS, PORTRAIT_POSTER, PORTRAIT_ROOM, portraitFragmentShader,
  portraitVertexShader, ROOM_SIZE } from "@/lib/three/portrait-atlas";

interface PointerTarget { x: number; y: number; active: boolean }

class PortraitBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function ContextLifecycle({ onError }: { onError: () => void }) {
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => { event.preventDefault(); onError(); };
    canvas.addEventListener("webglcontextlost", lost);
    // R3F intentionally loses the context during disposal; detach before that.
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, onError]);
  return null;
}

function PortraitScene({ host, pointer, requestFrame, onReady }: {
  host: RefObject<HTMLDivElement>;
  pointer: RefObject<PointerTarget>;
  requestFrame: MutableRefObject<() => void>;
  onReady: () => void;
}) {
  const [room, atlas] = useTexture([PORTRAIT_ROOM, PORTRAIT_HEADS], textures => {
    for (const texture of textures) texture.colorSpace = SRGBColorSpace;
  });
  const uniforms = useMemo(createPortraitUniforms, []);
  uniforms.uAtlas.value = atlas;
  const { camera, size, invalidate } = useThree();
  const gaze = useRef({ x: 0, y: 0, eyeX: 0, eyeY: 0, frames: 0 });
  const projection = useMemo(() => new Vector3(), []);
  const neck = useMemo(() => new Vector3(HEAD_ANCHOR[0] - ROOM_SIZE[0] / 2,
    ROOM_SIZE[1] / 2 - HEAD_ANCHOR[1], 1), []);
  const headY = neck.y + HEAD_CENTER_OFFSET;
  const geometry = useMemo(() => {
    const surface = new PlaneGeometry(HEAD_SIZE, HEAD_SIZE, 64, 64);
    surface.translate(0, HEAD_CENTER_OFFSET, 0);
    return surface;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useEffect(() => {
    const lens = camera as OrthographicCamera;
    const compact = size.width <= 900;
    lens.zoom = compact ? size.height / ROOM_SIZE[1]
      : Math.min(size.width / ROOM_SIZE[0], size.height / ROOM_SIZE[1]);
    lens.position.set(compact ? neck.x : 0, 0, 1000);
    lens.updateProjectionMatrix();
    invalidate();
  }, [camera, size, neck, invalidate]);

  useEffect(() => {
    requestFrame.current = invalidate;
    invalidate();
    onReady();
    return () => { if (requestFrame.current === invalidate) requestFrame.current = () => undefined; };
  }, [invalidate, requestFrame, onReady]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    projection.set(neck.x, headY, 1).project(camera);
    const target = pointer.current;
    const x = target?.active ? MathUtils.clamp((target.x - projection.x) * 1.3, -1, 1) : 0;
    const y = target?.active ? MathUtils.clamp((target.y - projection.y) * 1.8, -1, 1) : 0;
    gaze.current.x = MathUtils.damp(gaze.current.x, x, 6, dt);
    gaze.current.y = MathUtils.damp(gaze.current.y, y, 6, dt);
    gaze.current.eyeX = MathUtils.damp(gaze.current.eyeX, x, 20, dt);
    gaze.current.eyeY = MathUtils.damp(gaze.current.eyeY, y, 20, dt);
    uniforms.uHead.value.set(gaze.current.x, gaze.current.y);
    uniforms.uEyes.value.set(gaze.current.eyeX, gaze.current.eyeY);
    const unsettled = Math.abs(gaze.current.x - x) + Math.abs(gaze.current.y - y)
      + Math.abs(gaze.current.eyeX - x) + Math.abs(gaze.current.eyeY - y) > 0.001;
    if (unsettled) invalidate();
    if (host.current) {
      host.current.dataset.headYaw = gaze.current.x.toFixed(3);
      host.current.dataset.headPitch = (-gaze.current.y).toFixed(3);
      host.current.dataset.eyeYaw = gaze.current.eyeX.toFixed(3);
      host.current.dataset.eyePitch = (-gaze.current.eyeY).toFixed(3);
      host.current.dataset.motionMode = "continuous-relief";
      host.current.dataset.headCenterX = ((projection.x + 1) * size.width / 2).toFixed(2);
      host.current.dataset.headCenterY = ((1 - projection.y) * size.height / 2).toFixed(2);
      host.current.dataset.renderedFrames = String(++gaze.current.frames);
    }
  });

  return <>
    <mesh>
      <planeGeometry args={[...ROOM_SIZE]} />
      <meshBasicMaterial map={room} toneMapped={false} />
    </mesh>
    <mesh geometry={geometry} position={[neck.x, neck.y, 120]} frustumCulled={false}>
      <shaderMaterial uniforms={uniforms} vertexShader={portraitVertexShader}
        fragmentShader={portraitFragmentShader} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  </>;
}

export function PortraitHeroCanvas({ heroRef }: { heroRef: RefObject<HTMLElement> }) {
  const host = useRef<HTMLDivElement>(null);
  const pointer = useRef<PointerTarget>({ x: 0, y: 0, active: false });
  const requestFrame = useRef<() => void>(() => undefined);
  const [interactive, setInteractive] = useState(false);
  const [visible, setVisible] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const [posterReady, setPosterReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reduced, setReduced] = useState(true);
  const handleReady = useCallback(() => setReady(true), []);
  const handleError = useCallback(() => setFailed(true), []);
  const active = interactive && visible && tabVisible && !failed;

  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    const configure = () => {
      setReduced(motion.matches);
      let supported = false;
      if (!motion.matches && fine.matches) {
        try {
          const gl = document.createElement("canvas").getContext("webgl2");
          supported = Boolean(gl);
          gl?.getExtension("WEBGL_lose_context")?.loseContext();
        } catch { supported = false; }
      }
      setReady(false);
      setInteractive(supported);
      pointer.current = { x: 0, y: 0, active: false };
    };
    const reset = () => { pointer.current.active = false; requestFrame.current(); };
    const move = (event: PointerEvent) => {
      if (motion.matches || !fine.matches || event.pointerType === "touch") return;
      const hero = heroRef.current?.getBoundingClientRect();
      const bounds = host.current?.getBoundingClientRect();
      if (!hero || !bounds || hero.bottom <= 0 || hero.top >= innerHeight) return;
      if (event.clientX < hero.left || event.clientX > hero.right || event.clientY < hero.top || event.clientY > hero.bottom) {
        reset(); return;
      }
      pointer.current = { x: (event.clientX - bounds.left) / bounds.width * 2 - 1,
        y: 1 - (event.clientY - bounds.top) / bounds.height * 2, active: true };
      requestFrame.current();
    };
    const tab = () => { setTabVisible(!document.hidden); if (document.hidden) reset(); };
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
      if (!entry.isIntersecting) reset();
    });
    if (heroRef.current) observer.observe(heroRef.current);
    configure(); tab();
    motion.addEventListener("change", configure);
    fine.addEventListener("change", configure);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("blur", reset);
    document.documentElement.addEventListener("pointerleave", reset);
    document.addEventListener("visibilitychange", tab);
    return () => {
      observer.disconnect();
      motion.removeEventListener("change", configure);
      fine.removeEventListener("change", configure);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("blur", reset);
      document.documentElement.removeEventListener("pointerleave", reset);
      document.removeEventListener("visibilitychange", tab);
    };
  }, [heroRef]);
  useEffect(() => { if (active) requestFrame.current(); }, [active]);

  return <div ref={host} className="character-stage portrait-stage" role="img"
    aria-label="Illustrated Prajjwol seated in a white and yellow studio"
    data-character-ready={ready || posterReady} data-character-active={active}
    data-portrait-loaded={ready && interactive && !failed}
    data-character-fallback={!interactive || failed} data-reduced-motion={reduced}>
    {(!ready || !interactive || failed) && <Image src={PORTRAIT_POSTER}
      alt="" fill priority unoptimized sizes="100vw" className="character-poster"
      onLoad={() => setPosterReady(true)} />}
    {interactive && !failed && <PortraitBoundary onError={handleError}>
      <Canvas orthographic camera={{ position: [0, 0, 1000], near: 0.1, far: 2000 }}
        dpr={[1, 1.5]} frameloop={active ? "demand" : "never"}
        gl={{ alpha: false, antialias: true, powerPreference: "low-power" }}
        onCreated={({ gl }) => gl.setClearColor("#ffffff", 1)}>
        <ContextLifecycle onError={handleError} />
        <Suspense fallback={null}>
          <PortraitScene host={host} pointer={pointer} requestFrame={requestFrame} onReady={handleReady} />
        </Suspense>
      </Canvas>
    </PortraitBoundary>}
  </div>;
}
