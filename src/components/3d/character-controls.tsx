"use client";

import { Focus, RotateCcw, RotateCw } from "lucide-react";
import type { CharacterFrameStatus } from "@/hooks/use-character-frames";

interface CharacterControlsProps {
  status: CharacterFrameStatus;
  ready: boolean;
  progress: number;
  reset: () => void;
  step: (direction: number) => void;
  prepare: (direction: number) => void;
}

export function CharacterControls({ status, ready, progress, reset, step, prepare }: CharacterControlsProps) {
  const disabled = !ready || status === "loading";
  const stateLabel = status === "loading" ? progress ? `Loading ${progress}%` : "Loading"
    : status === "moving" ? "Turning" : status === "error" ? "Connection interrupted" : "Ready";

  return <div className="seated-character-controls" role="group" aria-label="Character rotation">
    <div className="character-control-row">
      <button type="button" className="character-angle-button" onClick={() => step(-1)} disabled={disabled}
        onPointerEnter={() => prepare(-1)} onFocus={() => prepare(-1)}
        aria-label="Rotate character left" title="Rotate left"><RotateCcw size={17} aria-hidden /></button>
      <button type="button" className="character-angle-button" onClick={reset} disabled={!ready}
        aria-label="Face cursor" title="Face cursor"><Focus size={17} aria-hidden /></button>
      <button type="button" className="character-angle-button" onClick={() => step(1)} disabled={disabled}
        onPointerEnter={() => prepare(1)} onFocus={() => prepare(1)}
        aria-label="Rotate character right" title="Rotate right"><RotateCw size={17} aria-hidden /></button>
    </div>
    <span className={status === "loading" || status === "error" ? "character-rotation-status" : "sr-only"}
      role="status" aria-live="polite">{stateLabel}</span>
  </div>;
}
