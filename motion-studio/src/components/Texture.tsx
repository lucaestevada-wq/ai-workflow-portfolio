/**
 * Grain + vignette overlay. Kills the "flat clean vector" tell.
 * Grain is animated (re-seeded per frame) so it doesn't look like a static filter.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame, random } from "remotion";
import { TEXTURE } from "../lib/house";

export const Grain: React.FC<{ opacity?: number }> = ({
  opacity = TEXTURE.grainOpacity,
}) => {
  const frame = useCurrentFrame();
  // Re-seed each frame so grain shimmers like film, not a fixed texture.
  const seed = Math.floor(random(`grain-${frame}`) * 100000);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity, mixBlendMode: "overlay" }}>
      <svg width="100%" height="100%">
        <filter id={`noise-${seed}`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            seed={seed}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#noise-${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{ opacity?: number }> = ({
  opacity = TEXTURE.vignetteOpacity,
}) => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background:
        "radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,1) 130%)",
      opacity,
    }}
  />
);
