/**
 * Rhythm modes — the three cadences of the collage-kinetic lane.
 * Derived from reference analysis (see references/STYLE_SPEC.md).
 * Pick a mode per piece; it sets how stepped the motion is, which hit source
 * to sync to, and whether fast moves carry motion blur.
 */

export type ModeName = "punchy" | "churn" | "rapidfire";

export type ModePreset = {
  name: ModeName;
  /** Hold animated values every N frames to fake a lower, stepped frame rate.
   *  1 = smooth 30fps, 2 = "on twos" (~15fps feel), 3 = "on threes" (~10fps). */
  stepHold: number;
  /** Which sync source hits land on. */
  hitSource: "beats" | "onsets";
  /** Decay (frames) of a hit pulse. Shorter = snappier. */
  hitDecay: number;
  /** Apply motion blur to fast moves. */
  motionBlur: boolean;
  /** Reference clips + one-line feel. */
  note: string;
};

export const MODES: Record<ModeName, ModePreset> = {
  // clips 2, 4, 5 — held composition punctuated by sharp hits on the beat
  punchy: {
    name: "punchy",
    stepHold: 2,
    hitSource: "beats",
    hitDecay: 7,
    motionBlur: true,
    note: "burst-and-hold; deliberate, type-forward; hits ~every 1.75-2.25s",
  },
  // clips 9, 12 — relentless, always moving, texture-flicker driven
  churn: {
    name: "churn",
    stepHold: 3,
    hitSource: "onsets",
    hitDecay: 4,
    motionBlur: false,
    note: "continuous churn; gritty, never fully still; ~12fps feel",
  },
  // clip 3 — mid-tempo, clustered fast cuts
  rapidfire: {
    name: "rapidfire",
    stepHold: 2,
    hitSource: "onsets",
    hitDecay: 5,
    motionBlur: true,
    note: "clustered fast cuts; between punchy and churn; ~15fps feel",
  },
};

/**
 * Quantise a frame to a stepped cadence. Returns the frame value to actually
 * sample animation at, so motion updates every `hold` frames instead of every
 * frame. This is how we get the deliberate choppy/stop-motion feel at 30fps.
 *
 *   const f = stepFrame(frame, MODES[mode].stepHold);
 *   const x = interpolate(f, ...);
 */
export const stepFrame = (frame: number, hold: number): number =>
  hold <= 1 ? frame : Math.floor(frame / hold) * hold;
