# Ink Motion Studio

Remotion pipeline for beat-synced spec ads — React/TypeScript compositions rendered at 30fps with a sub-frame motion blur trick, exported for Instagram Reels (9:16) and feed (16:9).

**Live work:** [@ink.2d](https://www.instagram.com/ink.2d/) on Instagram.

---

## Stack

| Tool | Version | Role |
|------|---------|------|
| Remotion | 4.0.534 | React-based frame renderer |
| React | 19 | Component model |
| TypeScript | 5.6.3 | Type safety |
| @remotion/three | — | 3D lit objects (LdCan3D) |
| @remotion/noise | — | Organic drift / grain |
| ffmpeg | system | Post-render compositing |
| librosa (Python) | — | Beat/onset extraction → JSON |

---

## Repository layout

```
src/
  lib/
    inkMotion.ts    # House motion token library — all easing curves, spring configs, helpers
    house.ts        # Canvas constants, duration tokens, color/texture defaults
    modes.ts        # Rhythm modes: punchy / churn / rapidfire + stepFrame helper
    localFonts.ts   # Offline font loader (FontFace + delayRender)
    audio.ts        # Audio utilities
  components/
    CatEyesEnd.tsx  # Reusable end-mark (cat-eyes wipe, 48-frame)
    Texture.tsx     # Grain + vignette overlay
    LivingHold.tsx  # Sub-perceptual breathing motion during holds
    LdCan3D.tsx     # 3D lit cylinder with re-projected label (Three.js via @remotion/three)
  compositions/
    SpotifyEverySound_4.tsx   # Spotify "Every Sound" — final 16:9 cut (v4)
    LiquidDeath_7.tsx         # Liquid Death — final 16:9 cut (v7)
    Revolut_916_5.tsx         # Revolut — final 9:16 cut (v5)
  Root.tsx          # Composition registry
```

Brand-specific SVG path data files (`*Paths.ts`) are excluded from this repo. The compositions reference them as local imports; to run locally, provide your own path data or swap with placeholder geometry.

---

## Key design patterns

### Sub-frame motion blur
Renders at **120fps** internally, then ffmpeg post-processes to 30fps:
```bash
ffmpeg -i render-%d.png \
  -vf "tmix=frames=4:weights='1 1 1 1'" \
  -r 30 output.mp4
```
This produces natural trail blur without CameraMotionBlur, matching the aesthetic of film grain motion.

### Beat sync
A Python/librosa script extracts beat and onset timestamps → JSON. Compositions read this data to align hit pulses, cuts, and scale punches to the music.

### Versioning rule
**Never overwrite.** Each iteration is a new file (`_N`), new composition ID (`-N`), and new render script. Old versions stay in `Root.tsx` for reference. This keeps the iteration history readable.

### Motion tokens (`inkMotion.ts`)
All timing lives in one file:
- `E.*` — named easing curves (out, in, exit, cam, whip, dolly, …)
- `SPR.*` — spring configs (firm, soft, snap, land, impact, …)
- `prog()` — eased 0→1 progress between two frames
- `spr()` — spring with tail snapped to rest at cuts
- `hitPulse()` — quarter-sine attack + exponential decay for beat hits
- `lmix()` — log-space scale mix (constant perceived speed)
- `holdDrift()` — living hold drift (no lurch at seam)
- `readHold()` — minimum hold duration for word count
- `FEED_9x16` — safe-area constants for Instagram Reels

### Rhythm modes (`modes.ts`)
Three cadences per piece:
- **punchy** — burst-and-hold, beat-synced, motion blur on
- **churn** — relentless, onset-synced, ~12fps stepped feel
- **rapidfire** — clustered fast cuts, between punchy and churn

`stepFrame(frame, hold)` quantises animation to a lower effective rate, producing the deliberate stop-motion feel at 30fps.

---

## IG export

`scripts/ig-export.mjs` converts the rendered ProRes/PNG sequence through a `gbrp` intermediate, BT.709 colour space, 20 Mbps CBR — matching Instagram's transcode expectations.

---

## Craft rules encoded in `house.ts`

- Entrances ease-out (`E.out`), exits ease-in (`E.exit`) — never the same curve for both
- No linear easing on moving elements
- Overshoot ≤ 7% of travel; max 2 true landings per film
- Grain at 10–12% opacity (above ~20% reads as a filter)
- Every shot has a subtle camera push or drift — no frozen frames
- Audio: master to −14 LUFS integrated, −1 dBTP true peak
