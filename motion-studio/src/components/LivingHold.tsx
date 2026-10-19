/**
 * Living hold. Wrap any element that must sit still while text is read.
 * Adds a sub-perceptual breathing scale so the frame is never frozen.
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import { LIVING_HOLD } from "../lib/house";

export const LivingHold: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const frame = useCurrentFrame();
  const phase = (frame / LIVING_HOLD.breathePeriodFrames) * Math.PI * 2;
  const scale = 1 + Math.sin(phase) * LIVING_HOLD.breatheScaleAmount;
  return (
    <div style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}>
      {children}
    </div>
  );
};
