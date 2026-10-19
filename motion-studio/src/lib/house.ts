/**
 * HOUSE SYSTEM — the locked defaults for every piece.
 * These encode the craft rules from the motion-direction skill so that
 * "default" is NOT the AI tell. Change these only deliberately, per project.
 */

import { Easing } from "remotion";

// ---- CANVAS ----------------------------------------------------------------
// 16:9 is the build default. 9:16 is a per-project packaging decision.
export const CANVAS = {
  width: 1920,
  height: 1080,
  fps: 30,
} as const;

// ---- EASING (the loudest tell lives here) ----------------------------------
// Entrances ease-out, exits ease-in. NEVER the same curve for both.
// NEVER linear on a moving element.
export const EASE = {
  // cubic-bezier(0, 0, 0.2, 1) — ease-out, for entrances
  out: Easing.bezier(0, 0, 0.2, 1),
  // cubic-bezier(0.4, 0, 1, 1) — ease-in, for exits
  in: Easing.bezier(0.4, 0, 1, 1),
  // cubic-bezier(0.4, 0, 0.2, 1) — ease-in-out, for moves that start and stop on screen
  inOut: Easing.bezier(0.4, 0, 0.2, 1),
  // a controlled snap with a touch of overshoot feel (use sparingly, accents only)
  snap: Easing.bezier(0.2, 0.9, 0.1, 1.0),
} as const;

// ---- DURATION TOKENS (frames @ 30fps) --------------------------------------
// Vary these across elements. Do not animate everything over the same count.
export const DUR = {
  snap: 5, //  ~150ms — most travel snaps in here
  fast: 8, //  ~250ms
  base: 12, // ~400ms
  slow: 18, // ~600ms
} as const;

// ---- STAGGER ---------------------------------------------------------------
// 2–4 frames per element/char. Cascade should resolve within ~1.5s.
export const STAGGER = {
  perChar: 2,
  perElement: 3,
  maxCascadeFrames: 45, // 1.5s @ 30fps — if a cascade runs longer, tighten it
} as const;

// ---- OVERSHOOT -------------------------------------------------------------
// 5–10% of travel, settle not bounce. Secondary motion settles AFTER primary.
export const OVERSHOOT = {
  amount: 0.07, // 7% of travel distance
  settleDelayFrames: 3, // secondary settles a few frames after primary lands
} as const;

// ---- COLOR (off-black on off-white, never #000 / #fff) ----------------------
// One accent, under 80% saturation. This is a PLACEHOLDER palette —
// per brand piece, swap these for the brand kit's hex codes.
export const COLOR = {
  ink: "#141210", // off-black
  paper: "#F3EEE6", // off-white
  accent: "#E8541E", // warm accent, < 80% sat
  muted: "#8A857C",
} as const;

// ---- TEXTURE ---------------------------------------------------------------
// Grain 10–15% (above ~20% reads as a filter). Subtle vignette.
export const TEXTURE = {
  grainOpacity: 0.12,
  vignetteOpacity: 0.25,
} as const;

// ---- CAMERA (always a subtle move; never glass-smooth-static) ---------------
// A slow push or drift lives under every shot. Never a frozen frame.
export const CAMERA = {
  pushFrom: 1.0,
  pushTo: 1.06,
  noiseTimeMultiplier: 0.04, // < 0.05 per the rules
  driftPx: 8,
} as const;

// ---- SOUND SPEC ------------------------------------------------------------
// Master to -14 LUFS integrated, -1 dBTP true peak.
// SFX transients land ON the contact frame (often 1–2 frames early feels best).
export const SOUND = {
  lufs: -14,
  truePeakDb: -1,
  transientLeadFrames: 1,
} as const;

// ---- HOLD READABILITY ------------------------------------------------------
// Hold readable text at least words * 0.6s before moving it.
export const holdFramesForWords = (wordCount: number): number =>
  Math.ceil(wordCount * 0.6 * CANVAS.fps);

// ---- LIVING HOLD -----------------------------------------------------------
// NO dead freeze. During any text read, keep a sub-perceptual motion alive
// (breathing scale / slow drift). This flag is a reminder the compositions
// must honour; see components/LivingHold.tsx.
export const LIVING_HOLD = {
  breatheScaleAmount: 0.004, // 0.4% scale oscillation
  breathePeriodFrames: 90, // ~3s cycle
} as const;
