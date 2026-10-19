/**
 * INK MOTION — house motion tokens (v1, 2026-10-19).
 *
 * Numbers adapted from cinetic (MIT, github.com/Leonxlnx/cinetic, references/motion-tokens.md) and
 * hyperframes-community-skills (Apache-2.0), cross-checked against the detailed prompts on prompt-motion.com.
 * See references/MOTION_POLISH_LIBRARY.md for the why. Source values are at 60 fps; helpers here take
 * durations in SECONDS or 60-fps frames (f60) and convert with FPS, so they work at 30 or 60.
 *
 * Rules of thumb: entrances decay (out), exits accelerate (exit / in), fades use smooth, scale uses lmix,
 * critically damped springs by default, overshoot only on a true landing (max 2 per film), never on type.
 */
import { Easing, interpolate, spring } from "remotion";

export const FPS = 30;
/** convert a 60-fps frame count from the references to this film's frames */
export const f60 = (frames60: number, fps = FPS) => (frames60 * fps) / 60;

export type Ease = (t: number) => number;

export const E = {
  out: Easing.bezier(0.16, 1, 0.3, 1), // arrivals, reveals, word entrances (never fade-outs)
  outSoft: Easing.bezier(0.22, 1, 0.36, 1), // gentle settles, type
  in: Easing.bezier(0.7, 0, 0.84, 0), // implosions, hard snaps out
  exit: Easing.bezier(0.55, 0.055, 0.675, 0.19), // exits into a cut: fastest on the last frame
  inOut: Easing.bezier(0.87, 0, 0.13, 1), // whips, morphs, lockup slides
  smooth: Easing.bezier(0.65, 0, 0.35, 1), // ALL fades, drifts, holds
  ui: Easing.bezier(0.4, 0, 0.2, 1), // toggles, chips, rows
  cam: Easing.bezier(0.48, 0.1, 0, 0.9), // camera pushes
  glide: Easing.bezier(0.47, 0.2, 0.15, 1), // 150-350 px element moves
  rest: Easing.bezier(0.45, 0, 0.1, 1), // moves that end at rest / chain after another
  contact: Easing.bezier(0.55, 0, 0.9, 0.55), // accelerate INTO an impact
  whip: Easing.bezier(0.6, 0, 0.15, 1), // feature-to-feature whips
  dolly: Easing.bezier(0.35, 0, 0.65, 1), // slow push through a hold
  split: Easing.bezier(0.33, 0, 0.1, 1),
  close: Easing.bezier(0.55, 0, 0.15, 1),
  iris: Easing.bezier(0.4, 0, 0.7, 0.92),
  shutter: Easing.bezier(0.2, 0.7, 0.2, 1),
  linear: (t: number) => t, // drift and clocks only
} as const;

export type Spr = { damping: number; stiffness: number; mass: number; overshootClamping?: boolean };
export const SPR = {
  firm: { damping: 24, stiffness: 140, mass: 1 }, // UI arrivals, 0% overshoot
  soft: { damping: 26, stiffness: 120, mass: 1 }, // panels, cards, big type
  heavy: { damping: 30, stiffness: 90, mass: 1.4 }, // full-frame surfaces
  calm: { damping: 16, stiffness: 64, mass: 1 }, // the only spring for type
  micro: { damping: 30, stiffness: 500, mass: 0.6 }, // chips, badges
  snap: { damping: 18, stiffness: 260, mass: 0.7 }, // TRUE landing, 6%
  land: { damping: 14.5, stiffness: 200, mass: 1 }, // TRUE landing, 15% (counts toward the 2)
  impact: { damping: 23, stiffness: 320, mass: 1 }, // visible impact, 7%
  tile: { damping: 15, stiffness: 150, mass: 0.7 }, // tiles into a grid, 3.4%
} satisfies Record<string, Spr>;

const C = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
/** log-space mix for scale/zoom: constant perceived speed */
export const lmix = (a: number, b: number, t: number) => Math.exp(mix(Math.log(a), Math.log(b), t));
/** eased 0..1 progress between frames a and b (always clamped; pass the curve explicitly) */
export const prog = (f: number, a: number, b: number, ease: Ease) =>
  b === a ? (f >= b ? 1 : 0) : interpolate(f, [a, b], [0, 1], { ...C, easing: ease });
/** spring from a start frame, tail snapped to rest so nothing creeps across a cut */
export const spr = (f: number, start: number, cfg: Spr, fps = FPS) => {
  const v = spring({ frame: f - start, fps, config: cfg });
  return Math.abs(1 - v) < 0.01 ? 1 : v;
};
/** whole-frame read for discrete state (counters, typed chars, carets) so blur sub-frames agree */
export const fd = (f: number) => Math.round(f);

/**
 * hitPulse: the one envelope for punches and ticks. Quarter-sine attack, exponential decay.
 * attack/tau are in 60-fps frames; peaks `attack` frames after the cue (put the sound ON the cue).
 * Repeating ticks: Math.max over them. Independent hits: add.
 */
export const hitPulse = (t: number, attack = 2, tau = 5, fps = FPS) => {
  const u = (t * 60) / fps;
  if (u <= 0 || u > attack + 6 * tau) return 0;
  return u < attack ? Math.sin((u / attack) * (Math.PI / 2)) : Math.exp(-(u - attack) / tau);
};
/** contact squash factors, anchored on the edge that was hit */
export const squash = (t: number, fps = FPS) => {
  const q = hitPulse(t, 1, 4, fps);
  return { across: 1 + 0.08 * q, along: 1 - 0.1 * q };
};

export type Pace = {
  move: { base: number; perPx: number; camMin: number; camMax: number };
  wordDur60: number;
  stagger60: number;
  riseEm: number;
  blurPx: number;
  exitDur60: number;
};
export const PACE: Record<"calm" | "crisp", Pace> = {
  calm: { move: { base: 0.5, perPx: 0.0016, camMin: 0.9, camMax: 3.0 }, wordDur60: 36, stagger60: 11, riseEm: 0.2, blurPx: 0, exitDur60: 24 },
  crisp: { move: { base: 0.35, perPx: 0.00135, camMin: 0.6, camMax: 2.4 }, wordDur60: 26, stagger60: 6, riseEm: 0.32, blurPx: 8, exitDur60: 16 },
};
/** frames for a move of `px` pixels: duration scales with distance (longest move >= 3x shortest) */
export const durFor = (px: number, camera = false, p: Pace = PACE.calm, fps = FPS) => {
  const s = p.move.base + p.move.perPx * Math.abs(px);
  return Math.round((camera ? clamp(s, p.move.camMin, p.move.camMax) : s) * fps);
};
/** reading hold in frames: max(60, 42 + 8/word) @60 (calm) */
export const readHold = (words: number, p: "calm" | "crisp" = "calm", fps = FPS) =>
  Math.round(f60(p === "calm" ? Math.max(60, 42 + 8 * words) : Math.max(42, 36 + 6 * words), fps));

/** px/f on the last frame of a D px move over T frames (for velocity-matched cuts) */
export const exitSpeed = (D: number, T: number, ease: Ease = E.in) => D * (ease(1) - ease(1 - 1 / T));
/** distance an incoming move over T frames needs to start at v px/f */
export const entryDistance = (v: number, T: number, ease: Ease = E.out) => v / (ease(1 / T) - ease(0));

/** a living hold: drift that eases in from rest (no lurch at the seam), px per 60-fps frame */
export const holdDrift = (f: number, pxPerF60 = 0.8, fps = FPS) => {
  const u = (f * 60) / fps;
  return (u - 20 * (1 - Math.exp(-u / 20))) * pxPerF60;
};

/** 9:16 feed layout (1080x1920) */
export const FEED_9x16 = {
  safe: { top: 270, right: 120, bottom: 420, left: 64 },
  statement: { y: [300, 580], px: [110, 140] },
  product: { y: [620, 1380], actionY: [900, 1100] },
  result: { y: [1390, 1490], minPx: 48 },
  uiMinPx: 32,
  secondaryPx: [60, 72],
} as const;
