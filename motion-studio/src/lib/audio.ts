/**
 * Beat-sync — drive animation off a track's grid.
 *
 * The JSON is produced by scripts/analyze_audio.py (BPM, beat frames, onset
 * frames, per-frame energy 0..1). Import it per piece and feed it to these
 * pure helpers. All functions take the current frame and return plain numbers,
 * so they stay deterministic for Remotion's render.
 */

export type Hit = { t: number; frame: number; strength?: number };
export type SyncData = {
  file: string;
  fps: number;
  duration: number;
  bpm: number;
  beat_interval_s: number | null;
  beats: Hit[];
  onsets: Hit[];
  energy: number[]; // per-frame, 0..1
};

/** Energy envelope value at a frame (0..1). Drive scale/shake/glow with this. */
export const energyAt = (data: SyncData, frame: number): number => {
  if (!data.energy.length) return 0;
  const i = Math.max(0, Math.min(data.energy.length - 1, frame));
  return data.energy[i];
};

/** Frames of the chosen hit source. mode picks beats (pulse) or onsets (every transient). */
export const hitFrames = (
  data: SyncData,
  source: "beats" | "onsets" = "beats"
): number[] => (source === "beats" ? data.beats : data.onsets).map((h) => h.frame);

/**
 * Pulse value that spikes to 1 ON each hit frame and decays to 0 over `decay`
 * frames (ease-out). This is the core "land it on the beat" driver: multiply a
 * scale overshoot, a flash opacity, a shake amount by it.
 */
export const hitPulse = (
  frame: number,
  frames: number[],
  decay = 8
): number => {
  let best = 0;
  for (const f of frames) {
    if (frame >= f && frame < f + decay) {
      const p = 1 - (frame - f) / decay; // linear falloff
      const eased = p * p; // ease-out-ish decay
      if (eased > best) best = eased;
    }
  }
  return best;
};

/** True exactly on a hit frame (for hard cuts / asset swaps). */
export const isHitFrame = (frame: number, frames: number[]): boolean =>
  frames.includes(frame);

/** Index of the current bar section, i.e. how many hits have fired by `frame`. */
export const hitIndex = (frame: number, frames: number[]): number => {
  let n = -1;
  for (const f of frames) if (frame >= f) n++;
  return n;
};
