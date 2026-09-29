"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface WebGLSupportState {
  isReady: boolean;
  isSupported: boolean;
}

interface WebGLFallbackProps {
  className?: string;
}

interface WebGLSupportGateProps {
  children: ReactNode;
  className?: string;
  fallbackClassName?: string;
}

export function detectWebGLSupport() {
  if (typeof document === "undefined") {
    return false;
  }

  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
      depth: true,
      failIfMajorPerformanceCaveat: false,
      powerPreference: "high-performance",
      stencil: false,
    });
    return Boolean(context);
  } catch {
    return false;
  }
}

export function useWebGLSupport(): WebGLSupportState {
  const [state, setState] = useState<WebGLSupportState>({
    isReady: false,
    isSupported: false,
  });

  useEffect(() => {
    setState({
      isReady: true,
      isSupported: detectWebGLSupport(),
    });
  }, []);

  return state;
}

export function WebGLFallback({ className }: WebGLFallbackProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative h-full min-h-[28rem] w-full overflow-hidden bg-black text-white",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#000_0%,#111_45%,#2a2a2a_100%)]" />
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="absolute left-[12%] top-[18%] h-28 w-28 animate-pulse rounded-full border border-[#ffd60a]/40 bg-[#ffd60a]/10 blur-xl" />
      <div className="absolute right-[18%] top-[24%] h-44 w-44 animate-[pulse_3s_ease-in-out_infinite] rounded-full border border-white/15 bg-white/5 blur-2xl" />
      <div className="absolute bottom-[16%] left-[45%] h-36 w-36 animate-[pulse_4s_ease-in-out_infinite] rounded-full border border-neutral-500/20 bg-neutral-400/10 blur-2xl" />
      <div className="absolute inset-x-8 bottom-10 h-px bg-gradient-to-r from-transparent via-[#ffd60a]/70 to-transparent" />
      <div className="absolute bottom-8 left-8 font-mono text-[0.62rem] font-black uppercase tracking-normal text-white/55">
        Static rendering mode / WebGL unavailable
      </div>
    </div>
  );
}

export function WebGLSupportGate({
  children,
  className,
  fallbackClassName,
}: WebGLSupportGateProps) {
  const { isReady, isSupported } = useWebGLSupport();

  if (!isReady) {
    return <div className={className} />;
  }

  if (!isSupported) {
    return <WebGLFallback className={fallbackClassName ?? className} />;
  }

  return <>{children}</>;
}
