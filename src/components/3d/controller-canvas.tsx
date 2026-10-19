"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, useGLTF } from "@react-three/drei";
import { Pause, Play } from "lucide-react";
import Image from "next/image";
import {
  Component, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState,
  type MutableRefObject, type ReactNode, type RefObject,
} from "react";
import { Box3, Group, MathUtils, Vector3, type PerspectiveCamera } from "three";
import { usePerformanceSettings } from "@/hooks/use-performance-settings";
import { gsap, registerScrollTrigger } from "@/lib/gsap";

const MODEL_URL = "/models/xbox-controller/controller.glb";
const ENTRY_CENTER_GAP = 120;

function ControllerPoster() {
  return <div className="controller-poster"><Image src="/models/xbox-controller/poster.png"
    alt="White Xbox controller" fill sizes="(max-width: 767px) 88vw, 44vw" /></div>;
}

class ControllerBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

interface MotionState {
  reveal: number;
  progress: number;
  velocity: number;
  direction: number;
  pointerX: number;
  pointerY: number;
  travel: number;
  compact: boolean;
}

function ControllerModel({ motion, reduced, lowTier, host, requestFrame, onReady }: {
  motion: RefObject<MotionState>;
  reduced: boolean;
  lowTier: boolean;
  host: RefObject<HTMLDivElement>;
  requestFrame: MutableRefObject<() => void>;
  onReady: () => void;
}) {
  const { scene } = useGLTF(MODEL_URL);
  const root = useRef<Group>(null);
  const pose = useRef<Group>(null);
  const speed = useRef(0);
  const { camera, size, invalidate } = useThree();
  useEffect(() => {
    requestFrame.current = invalidate;
    invalidate();
    return () => { if (requestFrame.current === invalidate) requestFrame.current = () => undefined; };
  }, [invalidate, requestFrame]);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    const box = new Box3().setFromObject(clone);
    const dimensions = box.getSize(new Vector3());
    const scale = 3.6 / dimensions.x;
    const center = box.getCenter(new Vector3());
    clone.position.sub(center);
    return { scene: clone, scale, radius: dimensions.length() * scale / 2 };
  }, [scene]);

  useEffect(() => {
    const perspective = camera as PerspectiveCamera;
    const aspect = size.width / Math.max(1, size.height);
    const halfFov = MathUtils.degToRad(perspective.fov / 2);
    const limitingAngle = Math.min(halfFov, Math.atan(Math.tan(halfFov) * aspect));
    // Fit the full rotation envelope, including scroll growth and entrance overshoot.
    const distance = model.radius * 1.18 / Math.sin(limitingAngle);
    perspective.position.set(0, 0.25, distance);
    perspective.lookAt(0, 0, 0);
    perspective.updateProjectionMatrix();
    invalidate();
  }, [camera, size.width, size.height, invalidate, model.radius]);

  useEffect(() => { onReady(); }, [onReady]);
  useEffect(() => { invalidate(); }, [reduced, invalidate]);

  useFrame((state, delta) => {
    if (!root.current || !pose.current || !motion.current) return;
    const values = motion.current;
    const dt = Math.min(delta, 0.05);
    // Match the reference's inertial spin: idle rotation plus signed scroll velocity.
    const target = reduced || values.reveal <= 0 ? 0 : MathUtils.clamp(
      values.direction * 0.84 + values.velocity * 0.00698,
      lowTier ? -4 : -9.4, lowTier ? 4 : 9.4,
    );
    speed.current = reduced ? 0 : MathUtils.damp(speed.current, target, 1 / 0.35, dt);
    values.velocity = MathUtils.damp(values.velocity, 0, 4, dt);
    root.current.rotation.y += speed.current * dt;
    const scale = values.compact ? 1 : MathUtils.lerp(0.72, 1.1, values.travel);
    root.current.scale.setScalar(values.reveal * scale);
    root.current.position.y = reduced ? 0 : Math.sin(state.clock.elapsedTime * 1.1) * 0.045;
    pose.current.rotation.x = MathUtils.damp(pose.current.rotation.x, -0.16 + values.pointerY * 0.12, 5, dt);
    pose.current.rotation.z = MathUtils.damp(pose.current.rotation.z, -0.1 + values.pointerX * 0.12, 5, dt);
    if (host.current) host.current.dataset.modelAngle = root.current.rotation.y.toFixed(4);
  });

  return (
    <group ref={root} rotation={[0, -0.35, 0]}>
      <group ref={pose} rotation={[-0.16, 0, -0.1]} scale={model.scale}>
        <primitive object={model.scene} dispose={null} />
      </group>
    </group>
  );
}

export function ControllerCanvas({ sectionRef }: {
  sectionRef: RefObject<HTMLDivElement>;
}) {
  const settings = usePerformanceSettings();
  const [reduced, setReduced] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [lost, setLost] = useState(false);
  const [visible, setVisible] = useState(false);
  const [supported, setSupported] = useState(false);
  const [playOverride, setPlayOverride] = useState<boolean | null>(null);
  const playing = playOverride ?? !reduced;
  const handleReady = useCallback(() => setLoaded(true), []);
  const handleError = useCallback(() => setLost(true), []);
  const motion = useRef<MotionState>({ reveal: 1, progress: 0, velocity: 0, direction: 1, pointerX: 0, pointerY: 0, travel: 0, compact: false });
  const host = useRef<HTMLDivElement>(null);
  const contextCleanup = useRef<(() => void) | null>(null);
  const requestFrame = useRef<() => void>(() => undefined);

  useEffect(() => {
    try {
      const context = document.createElement("canvas").getContext("webgl2");
      setSupported(Boolean(context));
      context?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch { setSupported(false); }
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    const tab = () => setTabVisible(!document.hidden);
    const visibility = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    if (host.current) visibility.observe(host.current);
    update(); tab();
    query.addEventListener("change", update);
    document.addEventListener("visibilitychange", tab);
    return () => {
      query.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", tab);
      visibility.disconnect();
      contextCleanup.current?.();
    };
  }, []);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const stage = host.current;
    const ScrollTrigger = registerScrollTrigger();
    if (!section || !stage || !ScrollTrigger) return;
    const values = motion.current;
    const introduction = section.closest("section")?.querySelector("#about-heading");
    const anchor = stage.parentElement;
    if (!anchor) return;
    const positions = () => {
      const anchorRect = anchor.getBoundingClientRect();
      const destination = anchorRect.top + window.scrollY + anchorRect.height / 2;
      const origin = introduction
        ? introduction.getBoundingClientRect().bottom + window.scrollY + ENTRY_CENTER_GAP
        : destination;
      return { origin, destination, offset: Math.min(0, origin - destination) };
    };
    const reveal = (entered: boolean, animate: boolean) => {
      stage.setAttribute("data-controller-entered", String(entered));
      if (animate && !reduced) {
        gsap.to(values, {
          reveal: entered ? 1 : 0,
          duration: entered ? 0.8 : 0.4,
          ease: entered ? "back.out(1.4)" : "power2.in",
          overwrite: "auto",
          onUpdate: () => requestFrame.current(),
        });
      } else {
        gsap.killTweensOf(values);
        values.reveal = entered ? 1 : 0;
        requestFrame.current();
      }
    };
    const media = gsap.matchMedia();
    media.add({ compact: "(max-width: 1023px)", desktop: "(min-width: 1024px)" }, (context) => {
      values.compact = Boolean(context.conditions?.compact);
      values.travel = 0;
      gsap.set(stage, { y: positions().offset, visibility: "visible" });

      if (!values.compact) {
        // Keep the controller centered until its final position in the tool grid catches up.
        gsap.fromTo(stage, { y: () => positions().offset }, {
          y: 0,
          ease: "none",
          scrollTrigger: {
            trigger: introduction ?? section,
            start: () => positions().origin - window.innerHeight / 2,
            end: () => positions().destination - window.innerHeight / 2,
            scrub: true,
            invalidateOnRefresh: true,
            onUpdate: (self) => { values.travel = self.progress; requestFrame.current(); },
          },
        });
      }

      ScrollTrigger.create({
        trigger: introduction ?? section,
        start: () => positions().origin - window.innerHeight * 0.85,
        endTrigger: section,
        end: "bottom top",
        onEnter: () => reveal(true, true),
        onLeaveBack: () => reveal(false, true),
        onRefresh: (self) => {
          if (values.compact) gsap.set(stage, { y: positions().offset });
          reveal(self.scroll() >= self.start, false);
        },
        onUpdate: (self) => {
          values.progress = self.progress;
          values.velocity = self.getVelocity();
          if (Math.abs(values.velocity) > 60) values.direction = self.direction;
          requestFrame.current();
        },
      });
      return () => gsap.killTweensOf(values);
    }, section);
    let refreshTimer = 0;
    const observer = new ResizeObserver(() => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 150);
    });
    if (introduction) observer.observe(introduction);
    observer.observe(anchor);
    return () => {
      window.clearTimeout(refreshTimer);
      observer.disconnect();
      media.revert();
      gsap.killTweensOf(values);
    };
  }, [sectionRef, reduced]);

  return (
    <div className="controller-stage" ref={host} role="group" aria-label="Interactive white Xbox controller"
      data-controller-loaded={loaded} data-controller-active={visible && tabVisible && playing && !lost && supported}
      onPointerMove={(event) => {
        if (!playing || event.pointerType === "touch") return;
        const bounds = event.currentTarget.getBoundingClientRect();
        motion.current.pointerX = (event.clientX - bounds.left) / bounds.width * 2 - 1;
        motion.current.pointerY = (event.clientY - bounds.top) / bounds.height * 2 - 1;
      }}
      onPointerLeave={() => { motion.current.pointerX = 0; motion.current.pointerY = 0; }}>
      {(!loaded || lost || !supported) && <ControllerPoster />}
      {supported && !lost && (
        <ControllerBoundary onError={handleError}>
          <Canvas
            camera={{ fov: 38, near: 0.1, far: 100, position: [0, 0.25, 9] }}
            dpr={settings.dpr}
            frameloop={!visible || !tabVisible ? "never" : playing ? "always" : "demand"}
            gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
            fallback={<ControllerPoster />}
            onCreated={({ gl }) => {
              const onLost = (event: Event) => { event.preventDefault(); setLost(true); };
              gl.domElement.addEventListener("webglcontextlost", onLost);
              contextCleanup.current = () => gl.domElement.removeEventListener("webglcontextlost", onLost);
              gl.setClearColor("#ffffff", 0);
            }}>
            <ambientLight intensity={1.2} />
            <directionalLight position={[3, 5, 6]} intensity={3} />
            <directionalLight position={[-4, 1, 2]} intensity={1.2} />
            <Suspense fallback={null}>
              <ControllerModel motion={motion} reduced={!playing} lowTier={settings.isLowTier} host={host} requestFrame={requestFrame} onReady={handleReady} />
              <Environment resolution={128} frames={1}>
                <Lightformer position={[0, 5, -2]} rotation={[Math.PI / 2, 0, 0]} scale={[10, 8, 1]} intensity={2} />
                <Lightformer position={[-5, 0, 2]} rotation={[0, Math.PI / 2, 0]} scale={[6, 8, 1]} intensity={2} />
              </Environment>
            </Suspense>
          </Canvas>
        </ControllerBoundary>
      )}
      <div className="controller-caption">
        <button type="button" disabled={!loaded || lost || !supported}
          onClick={() => setPlayOverride(!playing)}
          aria-label={playing ? "Pause controller animation" : "Play controller animation"}
          title={playing ? "Pause controller animation" : "Play controller animation"}>
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
      </div>
    </div>
  );
}
