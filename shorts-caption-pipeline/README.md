# Shorts Caption Pipeline

Automated caption timing pipeline for vertical short-form video. Takes a horizontal source video + separated audio WAV + Whisper word-timing JSON, outputs a styled 1080×1920 render with frame-accurate captions.

## How it works

1. **Audio onset detection** (`align.py`) — 5ms RMS dB envelope finds speech bursts (gaps ≥100ms below −55dB). Stray blips (breaths/clicks) are filtered.
2. **Word assignment** (`align.py`) — Dynamic programming assigns Whisper transcript words to audio bursts, minimising timing cost (burst duration vs syllable count, sentence-boundary penalties).
3. **Caption timing** (`captimes.py`) — In-burst words are snapped to energy dips (±100ms). Absolute override tokens `("A", t)` bypass alignment for hand-verified critical moments.
4. **Render** (`build_clip.py`) — ffmpeg + PIL pipeline: crop/fit segments with keyframe interpolation, cinematic grade (vignette, noise, contrast, colour), animated caption chunks with emphasis word, paper-tag overlays.
5. **Verification** (`verify.py`, `check.py`) — Reads the render back frame by frame, detects caption onset from pixel data, cross-checks against audio silence map.

## Key design decisions

- Whisper word times alone are ±200ms and smear backward across pauses — unreliable as raw caption times. We use them only for burst assignment, then re-anchor to audio energy.
- Dynamic programming (not greedy) for burst assignment handles contracted speech ("gonna" → "going to"), short noise bursts, and sentence-boundary cost.
- `check.py` is a pre-delivery gate: runs all three checks in one command, prints issues and pause-boundary review list.

## Stack

Python, NumPy, Pillow, OpenCV, ffmpeg, Whisper (word-level JSON output)

## Usage

```bash
# render clip
python3 build_clip.py 1

# verify render
python3 check.py 1 out/Clip1.mp4

# fonts: place Mont900.ttf (Montserrat Black) in ./fonts/ or set FONTS=/path/to/fonts/
```

## Limits

- ±100ms timing accuracy inside continuous speech (no forced aligner)
- Audio must be separated from music before processing (speech isolation)
- Clip config (`clipcfg.py`) requires manual crop/segment keyframes per clip
