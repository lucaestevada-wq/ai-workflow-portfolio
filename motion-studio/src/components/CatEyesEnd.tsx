/**
 * CAT EYES END MARK — Luca's signature sting. A black cat in the dark: only the eyes show.
 *
 * Use inside a <Sequence from={cutFrame} durationInFrames={CAT_EYES_DURATION}>, hard cut
 * on the piece's last hit. Pure black ground, eyes centred, small (reference lineage:
 * a quiet stamp, not an outro card).
 *
 * Timeline (relative frames, 30fps):
 *   0-3    eyes snap open from 35% (scaleY, ease-out) — visible ON the cut frame
 *   5-18   hold, pupils drift (stepped on 2s)
 *   19     blink lands on the next beat: lids close 3f (ease-in), pupils pinch to slits,
 *          reopen 4f (ease-out), pupils re-round
 *   42-47  eyes close to black (ease-in). Last frame is pure black = seamless Reel loop.
 *
 * tint = EYESHINE. Real cat eyes in the dark reflect light, so the iris takes the colour of
 * the last thing the cat saw: pass each piece's hero colour. Highlights share one light
 * direction in both eyes (fixed from the source art, where they were mirrored).
 */
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { noise2D } from "@remotion/noise";
import { stepFrame } from "../lib/modes";

export const CAT_EYES_DURATION = 48;
export const CAT_EYES_DEFAULT_TINT = "#F6D04D"; // logo yellow

const EASE_OUT = Easing.bezier(0, 0, 0.2, 1);
const EASE_IN = Easing.bezier(0.4, 0, 1, 1);
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const prog = (t: number, a: number, d: number, e: (n: number) => number) =>
  interpolate(t, [a, a + d], [0, 1], { ...CLAMP, easing: e });

// Geometry in a 600x220 box (traced from the logo, normalised). Eye centres 165/435.
const EYE = { rx: 122, ry: 98 };
const PUPIL = { rx: 76, ry: 86, inset: 38 }; // pupils sit toward the nose (the "looking at you" read)
const HL_BIG = { dx: 6, dy: -22, rx: 22, ry: 19 };
const HL_SMALL = { dx: 30, dy: 32, r: 9 };

const Eye: React.FC<{ cx: number; side: -1 | 1; open: number; slit: number; look: { x: number; y: number }; tint: string; ink: string; shine: string }> = ({
  cx,
  side,
  open,
  slit,
  look,
  tint,
  ink,
  shine,
}) => {
  const cy = 110;
  const px = cx - side * PUPIL.inset + look.x;
  const py = cy + look.y;
  return (
    <g transform={`translate(${cx} ${cy}) scale(1 ${Math.max(open, 0.0001)}) translate(${-cx} ${-cy})`}>
      <ellipse cx={cx} cy={cy} rx={EYE.rx} ry={EYE.ry} fill={tint} />
      <ellipse cx={px} cy={py} rx={PUPIL.rx * slit} ry={PUPIL.ry} fill={ink} />
      {slit > 0.55 ? (
        <>
          <ellipse cx={px + HL_BIG.dx} cy={py + HL_BIG.dy} rx={HL_BIG.rx} ry={HL_BIG.ry} fill={shine} />
          <circle cx={px + HL_SMALL.dx} cy={py + HL_SMALL.dy} r={HL_SMALL.r} fill={shine} />
        </>
      ) : null}
    </g>
  );
};

export const CatEyesEnd: React.FC<{ tint?: string; width?: number; blinkAt?: number }> = ({
  tint = CAT_EYES_DEFAULT_TINT,
  width = 140,
  blinkAt = 19,
}) => {
  const f = useCurrentFrame();
  const sf = stepFrame(f, 2);

  const opening = 0.35 + 0.65 * prog(f, 0, 3, EASE_OUT); // already 35% open on the cut frame, so the hit lands
  const blinkDown = prog(f, blinkAt - 3, 3, EASE_IN);
  const blinkUp = prog(f, blinkAt, 4, EASE_OUT);
  const blink = f < blinkAt ? blinkDown : 1 - blinkUp;
  const closing = prog(f, CAT_EYES_DURATION - 6, 5, EASE_IN);
  const open = opening * (1 - blink) * (1 - closing);
  // pupils pinch to slits as the lids come down (the cat signal), re-round after
  const slit = 1 - 0.72 * Math.max(blink, closing);
  // micro life: a slow stepped glance, tiny
  const look = { x: noise2D("cat-lx", sf * 0.03, 0) * 9, y: noise2D("cat-ly", 0, sf * 0.03) * 4 };
  const h = (width * 220) / 600;

  return (
    <AbsoluteFill style={{ background: "#0B0B0C", justifyContent: "center", alignItems: "center" }}>
      <svg
        viewBox="0 0 600 220"
        width={width}
        height={h}
        style={{ overflow: "visible", filter: `drop-shadow(0 0 ${width * 0.05}px ${tint}55)` }}
      >
        <Eye cx={165} side={-1} open={open} slit={slit} look={look} tint={tint} ink="#0B0B0C" shine="#FBF3E4" />
        <Eye cx={435} side={1} open={open} slit={slit} look={look} tint={tint} ink="#0B0B0C" shine="#FBF3E4" />
      </svg>
    </AbsoluteFill>
  );
};
