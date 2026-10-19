/**
 * SPOTIFY — "Every sound. One place."   (unaffiliated concept piece, 16:9)
 *
 * PARAMETER BRIEF (pre-committed before code, per remotion-motion-direction)
 * - Reference / lineage: Luca's collage-kinetic refs (clips 2/3/5: torn-paper
 *   collage, bold type, hard colour blocking, stepped cadence) resolving into
 *   Spotify's own language (black/green, Circular, Browse tiles).
 * - Palette: intro = warm paper #E9E2D4 + each genre's own 2-3 colours.
 *   Spotify = #191414 bg (60) / #FAFAF7 type (30) / #1ED760 accent (10).
 *   (#1ED760 = the green in Luca's official SVG; #1DB954 is the older green.)
 * - Type: lo-fi Caveat (lowercase), TECHNO Space Mono (+0.1em), Jazz Playfair
 *   Black Italic, REGGAETÓN Lilita One (sticker outline), RAP Anton. Spotify
 *   section = Circular Black. Hero line = "One place." (green + underline).
 * - Composition: intro is a free collage pile; the NEWEST card is the focal
 *   point, older cards recede (scale, brightness). Spotify: icon centred for
 *   the impact, then icon left third + tile grid right two thirds, then a
 *   centred lockup with the tagline below.
 * - Pacing: 30fps, 480f. Shots 0-133 intro (cards on onsets 3/30/61/77/106,
 *   build 106-125, collapse 125-133) | 134-209 impact + orbit | 210-353 tiles
 *   | 354-380 collapse #2 + lockup | 381-480 tagline, hold, fade. Hard cut on
 *   the 134 downbeat. Everything on the analysed grid.
 * - Easing: entrances ease-out (0,0,.2,1); collapses/exits ease-in (.4,0,1,1);
 *   on-screen moves ease-in-out (.65,0,.35,1); emphasis overshoot
 *   (.34,1.56,.64,1); RAP slam snap (.12,0,.08,1). Springs: icon punch
 *   {mass .4, stiffness 300, damping 14}; reggaetón bounce {1, 80, 8}.
 * - Stagger: intro cards ride the onsets; words emerge on onsets 143-182;
 *   tiles 3f apart; corner art 1 per beat; tagline words 4f apart; secondary
 *   elements (corner art, header, underline) lag their primary.
 * - Texture: grain ~13% overlay re-seeded per frame; paper fibre + uneven
 *   light; torn-paper card edges + ONE hard offset shadow; per-genre surface:
 *   halftone (RAP), scanlines + RGB split (TECHNO), sepia + vignette (JAZZ),
 *   VHS chroma (LO-FI), sticker outline (REGGAETÓN).
 * - Camera: slow push 1.00 -> 1.05 over the piece; rush-in 1.00 -> 1.12 on
 *   the pre-drop pickup (118-133); impact kicks + shake at 106/134/362;
 *   noise drift +-5px, time multiplier .012, stepped.
 * - Cadence: stepped per personality: lo-fi on threes, RAP/REGGAETÓN/Spotify
 *   on twos, TECHNO hard-cut on onsets, Jazz legato (on ones) on purpose.
 * - Sound: Upbeat Chill baked in. Source masters at -9.3 LUFS / +0.7 dBTP,
 *   so gain is pulled -4.7 dB (~-14 LUFS, <=-1 dBTP). Fade 448-480. No extra
 *   SFX: the track's own transients are the accents, every hit sits on them.
 */
import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  random,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { noise2D } from "@remotion/noise";
import { stepFrame } from "../lib/modes";
import { SyncData, hitFrames, hitPulse } from "../lib/audio";
import { loadLocalFont } from "../lib/localFonts";
import {
  SPOTIFY_ICON_D,
  SPOTIFY_TEXT_D,
  SPOTIFY_TEXT_DOT,
  SPOTIFY_TEXT_TRANSFORM,
} from "../lib/spotifyPaths";
import { Grain, Vignette } from "../components/Texture";
import { CatEyesEnd, CAT_EYES_DURATION } from "../components/CatEyesEnd";
import syncJson from "../../public/data/upbeatchill.json";

// ---------------------------------------------------------------- constants
export const SPOTIFY_DURATION = 504; // 456 lockup + 48f cat-eyes end mark
const FPS = 30;
const DROP = 134; // groove enters on this downbeat — the reshuffle hinge
const CX = 960;
const CY = 540;

const C = {
  paper: "#E9E2D4",
  black: "#191414",
  white: "#FAFAF7",
  green: "#1ED760",
};

const LOFI = { bg: "#B6AAD8", ink: "#3A3056", moon: "#F7E9CC", chromaA: "#78C9D9", chromaB: "#E98FB0" };
const TECH = { bg: "#0D1013", grid: "rgba(67,224,227,0.09)", cyan: "#43E0E3", cyanDim: "rgba(67,224,227,0.38)", magenta: "#E85A9F", white: "#EAF6F6" };
const JAZZ = { cream: "#EFE3C8", ray: "#E6D3AC", ink: "#5A1C17", brass: "#9A6B26", label: "#7A2620" };
const REG = { pink: "#DE4479", orange: "#E68A45", yellow: "#EDC453", ink: "#3A0F25" };
const RAP = { bg: "#121110", gold: "#D7A83C", dot: "rgba(215,168,60,0.5)", shadow: "#5A4310" };

const E = {
  out: Easing.bezier(0, 0, 0.2, 1),
  in: Easing.bezier(0.4, 0, 1, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  over: Easing.bezier(0.34, 1.56, 0.64, 1),
  snap: Easing.bezier(0.12, 0, 0.08, 1),
};
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const prog = (t: number, start: number, dur: number, ease: (n: number) => number) =>
  interpolate(t, [start, start + Math.max(1, dur)], [0, 1], { ...CLAMP, easing: ease });
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

// ---------------------------------------------------------------- fonts (local, offline)
const FONT = {
  lofi: loadLocalFont("SpLofiCaveat", "Caveat-Bold.woff2"),
  techno: loadLocalFont("SpTechnoMono", "SpaceMono-Bold.woff2"),
  jazz: loadLocalFont("SpJazzPlayfair", "Playfair-BlackItalic.woff2"),
  reggaeton: loadLocalFont("SpReggaetonLilita", "LilitaOne.woff2"),
  rap: loadLocalFont("SpRapAnton", "Anton.woff2"),
  spotify: loadLocalFont("SpCircularBlack", "CircularBlack.ttf"),
};

// ---------------------------------------------------------------- sync grid
const SYNC = syncJson as unknown as SyncData;
const BEATS = hitFrames(SYNC, "beats");
const ONSETS = hitFrames(SYNC, "onsets");

// ---------------------------------------------------------------- shapes
const torn = (seed: string, jag = 1.7, steps = 22) => {
  const r = (i: number, e: number) => random(`${seed}-${e}-${i}`) * jag;
  const p: string[] = [];
  for (let i = 0; i < steps; i++) p.push(`${(i / steps) * 100}% ${r(i, 0)}%`);
  for (let i = 0; i < steps; i++) p.push(`${100 - r(i, 1)}% ${(i / steps) * 100}%`);
  for (let i = 0; i < steps; i++) p.push(`${100 - (i / steps) * 100}% ${100 - r(i, 2)}%`);
  for (let i = 0; i < steps; i++) p.push(`${r(i, 3)}% ${100 - (i / steps) * 100}%`);
  return `polygon(${p.join(",")})`;
};

const starburst = (points = 14, inner = 0.78) => {
  const p: string[] = [];
  for (let k = 0; k < points * 2; k++) {
    const a = (k / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const rr = k % 2 === 0 ? 50 : 50 * inner;
    p.push(`${50 + rr * Math.cos(a)}% ${50 + rr * Math.sin(a)}%`);
  }
  return `polygon(${p.join(",")})`;
};
const BADGE = starburst(14, 0.8);

const star4 = (x: number, y: number, r: number) =>
  `M ${x} ${y - r} Q ${x} ${y} ${x + r} ${y} Q ${x} ${y} ${x} ${y + r} Q ${x} ${y} ${x - r} ${y} Q ${x} ${y} ${x} ${y - r} Z`;

// ================================================================= GENRE CARDS
type GenreKey = "lofi" | "techno" | "jazz" | "reggaeton" | "rap";

const LofiContent: React.FC<{ f: number; w: number; h: number; mini?: boolean }> = ({ f, w, h }) => {
  const sf = stepFrame(f, 3); // lo-fi lives on threes: lazy, low-framerate
  const wob = Math.sin(sf * 0.35) * 3;
  const twinkle = (k: number) => 0.4 + 0.6 * hitPulse(f, ONSETS, 9 + k * 2);
  return (
    <AbsoluteFill style={{ background: LOFI.bg }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 38% 40%, rgba(255,255,255,0.22), rgba(58,48,86,0.28) 85%)" }} />
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <mask id="lofiMoonMask">
            <circle cx={w - 118} cy={92} r={46} fill="white" />
            <circle cx={w - 98} cy={78} r={40} fill="black" />
          </mask>
        </defs>
        <circle cx={w - 118} cy={92} r={46} fill={LOFI.moon} mask="url(#lofiMoonMask)" />
        {[
          [w - 236, 62, 10],
          [w - 58, 176, 7],
          [w - 198, 170, 5],
          [86, 66, 7],
        ].map(([x, y, r], k) => (
          <path key={k} d={star4(x, y, r)} fill={LOFI.moon} opacity={twinkle(k)} />
        ))}
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: h * 0.17, textAlign: "center", transform: `translateX(${wob}px)` }}>
        <div style={{ position: "relative", display: "inline-block", fontFamily: FONT.lofi, fontSize: 216, lineHeight: 1, color: LOFI.ink }}>
          <span style={{ position: "absolute", left: -6, top: 0, color: LOFI.chromaA, opacity: 0.6, mixBlendMode: "multiply" }}>lo-fi</span>
          <span style={{ position: "absolute", left: 6, top: 0, color: LOFI.chromaB, opacity: 0.6, mixBlendMode: "multiply" }}>lo-fi</span>
          <span style={{ position: "relative" }}>lo-fi</span>
        </div>
      </div>
      <div style={{ position: "absolute", left: 42, bottom: 30, fontFamily: FONT.lofi, fontSize: 46, color: LOFI.ink, opacity: 0.85, transform: "rotate(-2deg)" }}>
        beats to relax / study to
      </div>
      <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 4px)" }} />
    </AbsoluteFill>
  );
};

const GlitchBars: React.FC<{ f: number; w: number; h: number }> = ({ f, w, h }) => (
  <>
    {[0, 1, 2, 3].map((k) => {
      const y = random(`gb-y-${f}-${k}`) * h;
      const bh = 6 + random(`gb-h-${f}-${k}`) * 24;
      const x = (random(`gb-x-${f}-${k}`) - 0.5) * 140;
      const col = [TECH.cyan, TECH.white, TECH.magenta, "#000"][k];
      return (
        <div key={k} style={{ position: "absolute", left: x, top: y, width: w, height: bh, background: col, opacity: 0.78, mixBlendMode: k === 3 ? "normal" : "screen" }} />
      );
    })}
  </>
);

const TechnoContent: React.FC<{ f: number; w: number; h: number; glitch: boolean }> = ({ f, w, h, glitch }) => {
  const step = Math.floor(Math.max(0, f - 30) / 4.7) % 16; // 16th-note playhead at 95.7 BPM
  const split = glitch ? 10 : 2.5;
  const clock = `[${String(Math.floor(f / 30)).padStart(2, "0")}:${String(f % 30).padStart(2, "0")}]`;
  return (
    <AbsoluteFill style={{ background: TECH.bg }}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${TECH.grid} 1px, transparent 1px), linear-gradient(90deg, ${TECH.grid} 1px, transparent 1px)`,
          backgroundSize: "44px 44px",
        }}
      />
      <div style={{ position: "absolute", left: 36, top: 28, fontFamily: FONT.techno, fontSize: 26, color: TECH.cyan, letterSpacing: "0.12em", opacity: 0.85 }}>BPM 130 // 4x4</div>
      <div style={{ position: "absolute", right: 36, top: 28, fontFamily: FONT.techno, fontSize: 26, color: TECH.white, opacity: 0.65 }}>{clock}</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: h * 0.3, textAlign: "center", fontFamily: FONT.techno, fontSize: 126, letterSpacing: "0.1em", paddingLeft: "0.1em", lineHeight: 1 }}>
        <div style={{ position: "absolute", left: 0, right: 0, color: TECH.magenta, transform: `translateX(${split}px)`, opacity: glitch ? 0.85 : 0.45, mixBlendMode: "screen" }}>TECHNO</div>
        <div style={{ position: "absolute", left: 0, right: 0, color: TECH.cyan, transform: `translateX(${-split}px)`, opacity: 0.9, mixBlendMode: "screen" }}>TECHNO</div>
        <div style={{ position: "relative", color: TECH.white }}>TECHNO</div>
      </div>
      <div style={{ position: "absolute", left: 36, right: 36, bottom: 40, display: "flex", gap: 8 }}>
        {Array.from({ length: 16 }).map((_, k) => {
          const kick = k % 4 === 0;
          const on = k === step && f >= 45;
          return <div key={k} style={{ flex: 1, height: 26, background: on ? TECH.white : kick ? TECH.cyanDim : "transparent", border: `2px solid ${TECH.cyanDim}` }} />;
        })}
      </div>
      <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0 1px, transparent 1px 3px)" }} />
      {glitch ? <GlitchBars f={f} w={w} h={h} /> : null}
    </AbsoluteFill>
  );
};

const Vinyl: React.FC<{ size: number; spin: number }> = ({ size, spin }) => (
  <div style={{ position: "relative", width: size, height: size }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "50%",
        transform: `rotate(${spin}deg)`,
        background: "repeating-radial-gradient(circle at center, #141414 0 2px, #232323 2px 4px)",
        boxShadow: "0 0 0 3px #0c0c0c",
      }}
    >
      <div style={{ position: "absolute", left: size * 0.35, top: size * 0.35, width: size * 0.3, height: size * 0.3, borderRadius: "50%", background: JAZZ.label }}>
        <div style={{ position: "absolute", left: "16%", top: "47%", width: "30%", height: "6%", background: JAZZ.cream, opacity: 0.85 }} />
        <div style={{ position: "absolute", left: "46%", top: "46%", width: "8%", height: "8%", borderRadius: "50%", background: "#0c0c0c" }} />
      </div>
    </div>
    {/* static sheen so the rotation reads */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "50%",
        background: "conic-gradient(from 20deg, rgba(255,255,255,0.11) 0deg 16deg, transparent 16deg 180deg, rgba(255,255,255,0.08) 180deg 194deg, transparent 194deg)",
      }}
    />
  </div>
);

const JazzContent: React.FC<{ f: number; w: number; h: number }> = ({ f, w, h }) => {
  const t = Math.max(0, f - 61);
  const burst = t * 0.35;
  const spin = t * 6.67; // 33 1/3 rpm
  return (
    <AbsoluteFill style={{ background: JAZZ.cream }}>
      <div
        style={{
          position: "absolute",
          left: w * 0.36 - 900,
          top: h * 0.55 - 900,
          width: 1800,
          height: 1800,
          borderRadius: "50%",
          background: `repeating-conic-gradient(from ${burst}deg, ${JAZZ.ray} 0deg 7deg, ${JAZZ.cream} 7deg 14deg)`,
        }}
      />
      <div style={{ position: "absolute", left: w - 200, top: h / 2 - 180 }}>
        <Vinyl size={360} spin={spin} />
      </div>
      <div style={{ position: "absolute", inset: 16, border: `2px solid ${JAZZ.ink}`, opacity: 0.55 }} />
      <div style={{ position: "absolute", inset: 23, border: `1px solid ${JAZZ.ink}`, opacity: 0.35 }} />
      <div style={{ position: "absolute", left: 58, top: h * 0.14, fontFamily: FONT.jazz, fontSize: 262, lineHeight: 1, color: JAZZ.ink, textShadow: `4px 5px 0 ${JAZZ.cream}, 8px 10px 0 rgba(90,28,23,0.22)` }}>
        Jazz
      </div>
      <div style={{ position: "absolute", left: 66, bottom: 46, fontFamily: FONT.jazz, fontSize: 34, letterSpacing: "0.2em", color: JAZZ.brass }}>live · after midnight</div>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 42% 48%, transparent 48%, rgba(70,35,10,0.40))" }} />
    </AbsoluteFill>
  );
};

const ReggaetonContent: React.FC<{ f: number; w: number; h: number }> = ({ f, w, h }) => {
  const sf = stepFrame(Math.max(0, f - 77), 2);
  const bounce = f >= 77 ? hitPulse(f, ONSETS, 6) : 0; // dembow bounce on every transient
  return (
    <AbsoluteFill style={{ background: REG.pink }}>
      <div
        style={{
          position: "absolute",
          left: w * 0.22 - 800,
          top: h - 800 + 40,
          width: 1600,
          height: 1600,
          borderRadius: "50%",
          opacity: 0.55,
          background: `repeating-conic-gradient(from ${sf * 1.6}deg, ${REG.orange} 0deg 10deg, ${REG.pink} 10deg 20deg)`,
        }}
      />
      <div style={{ position: "absolute", left: 0, right: 0, top: h * 0.34, textAlign: "center" }}>
        <span
          style={{
            display: "inline-block",
            fontFamily: FONT.reggaeton,
            fontSize: 102,
            lineHeight: 1,
            color: REG.yellow,
            WebkitTextStroke: `7px ${REG.ink}`,
            paintOrder: "stroke fill",
            textShadow: `9px 9px 0 ${REG.ink}`,
            transform: `translateY(${-10 * bounce}px) scale(${1 + 0.04 * bounce}, ${1 - 0.05 * bounce})`,
          }}
        >
          REGGAETÓN
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          right: 22,
          top: 14,
          width: 176,
          height: 176,
          clipPath: BADGE,
          background: REG.yellow,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `rotate(${12 + 7 * bounce}deg) scale(${1 + 0.08 * bounce})`,
        }}
      >
        <span style={{ fontFamily: FONT.reggaeton, fontSize: 44, color: REG.pink }}>¡DALE!</span>
      </div>
    </AbsoluteFill>
  );
};

const Crown: React.FC<{ x: number; y: number; scale?: number }> = ({ x, y, scale = 1 }) => (
  <svg width={150 * scale} height={92 * scale} viewBox="0 0 150 92" style={{ position: "absolute", left: x, top: y }}>
    <polyline points="8,82 8,24 44,60 75,12 106,60 142,24 142,82 8,82" fill="none" stroke={RAP.gold} strokeWidth={7} strokeLinejoin="round" />
    {[
      [8, 24],
      [75, 12],
      [142, 24],
    ].map(([cx, cy], k) => (
      <circle key={k} cx={cx} cy={cy - 9} r={7} fill={RAP.gold} />
    ))}
  </svg>
);

const RapContent: React.FC<{ f: number; w: number; h: number }> = ({ w, h }) => (
  <AbsoluteFill style={{ background: RAP.bg }}>
    <AbsoluteFill
      style={{
        backgroundImage: `radial-gradient(circle, ${RAP.dot} 1.6px, transparent 2.4px)`,
        backgroundSize: "11px 11px",
        WebkitMaskImage: "linear-gradient(135deg, rgba(0,0,0,0.95), rgba(0,0,0,0.05) 72%)",
        maskImage: "linear-gradient(135deg, rgba(0,0,0,0.95), rgba(0,0,0,0.05) 72%)",
      }}
    />
    <Crown x={62} y={34} />
    <div style={{ position: "absolute", left: 50, top: 108, fontFamily: FONT.rap, fontSize: 300, lineHeight: 0.92, color: RAP.gold, textShadow: `9px 9px 0 ${RAP.shadow}` }}>RAP</div>
    <div style={{ position: "absolute", right: 40, bottom: 44, fontFamily: FONT.rap, fontSize: 40, letterSpacing: "0.12em", color: RAP.gold, opacity: 0.78 }}>VOL.1 / TRACK 03</div>
    <div style={{ position: "absolute", right: 40, bottom: 34, width: w * 0.36, height: 3, background: RAP.gold, opacity: 0.55 }} />
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h }} />
  </AbsoluteFill>
);

// ----- card defs + pose
type CardDef = { key: GenreKey; enter: number; cx: number; cy: number; w: number; h: number; rot: number };
const CARDS: CardDef[] = [
  { key: "lofi", enter: 3, cx: 560, cy: 320, w: 620, h: 380, rot: -5 },
  { key: "techno", enter: 30, cx: 1400, cy: 300, w: 660, h: 370, rot: 4 },
  { key: "jazz", enter: 60, cx: 975, cy: 575, w: 760, h: 460, rot: -2.5 },
  { key: "reggaeton", enter: 77, cx: 470, cy: 800, w: 640, h: 360, rot: 6 },
  { key: "rap", enter: 106, cx: 1450, cy: 790, w: 680, h: 400, rot: -4 },
];
const POLY: Record<GenreKey, string> = {
  lofi: torn("lofi"),
  techno: torn("techno"),
  jazz: torn("jazz"),
  reggaeton: torn("reggaeton"),
  rap: torn("rap"),
};
const TECHNO_VISIBLE = (f: number) => (f >= 30 && f <= 31) || (f >= 36 && f <= 37) || (f >= 40 && f <= 41) || f >= 45; // stutters on onsets 30/36/40/45
const Z0 = [0, 1, 2, 3, 4];
const Z1 = [3, 0, 4, 1, 2]; // first reshuffle tease (onset 121)
const Z2 = [1, 4, 2, 0, 3]; // second (onset 130)
const zAt = (i: number, f: number) => (f >= 130 ? Z2[i] : f >= 121 ? Z1[i] : Z0[i]);

type Pose = { x: number; y: number; s: number; r: number; o: number; bright: number; visible: boolean };
const HIDDEN: Pose = { x: 0, y: 0, s: 1, r: 0, o: 0, bright: 1, visible: false };

const cardPose = (i: number, f: number): Pose => {
  const d = CARDS[i];
  if (f < d.enter || f >= DROP) return HIDDEN;
  const t = f - d.enter;
  let x = d.cx;
  let y = d.cy;
  let s = 1;
  let r = d.rot;
  let o = 1;
  switch (d.key) {
    case "lofi": {
      const p = prog(stepFrame(t, 3), 0, 18, E.out);
      y += 46 * (1 - p);
      o = p;
      s = 0.95 + 0.05 * p;
      break;
    }
    case "techno": {
      if (!TECHNO_VISIBLE(f)) o = 0;
      if (f < 45) x += (random(`tg-${f}`) - 0.5) * 70;
      break;
    }
    case "jazz": {
      // lands HARD on the trumpet (2-frame cut-in), then settles legato: the one smooth thing in the intro
      const p = prog(t, 0, 16, E.out);
      o = prog(t, 0, 2, E.out);
      s = 1.08 - 0.08 * p;
      y += 14 * (1 - p);
      break;
    }
    case "reggaeton": {
      const sp = spring({ frame: stepFrame(t, 2), fps: FPS, config: { mass: 1, stiffness: 80, damping: 8 } });
      s = 0.35 + 0.65 * sp;
      r = d.rot + 16 * (1 - sp);
      break;
    }
    case "rap": {
      const p = prog(t, 0, 5, E.snap);
      s = 1.9 - 0.9 * p;
      r = d.rot - 10 * (1 - p);
      break;
    }
  }
  // atmospheric demotion: the newest card is the focal point, older ones recede
  let dem = 0;
  CARDS.forEach((c, j) => {
    if (j > i && f >= c.enter) dem += prog(f, c.enter, 7, E.out);
  });
  s *= 1 - 0.035 * dem;
  const bright = Math.max(0.7, 1 - 0.075 * dem);
  // micro life (stepped)
  const sf = stepFrame(f, 2);
  x += noise2D(`dx${i}`, sf * 0.02, 0) * 4;
  y += noise2D(`dy${i}`, 0, sf * 0.02) * 4;
  // tension build on the last bar before the drop
  const amp = interpolate(f, [106, 126], [0, 11], CLAMP);
  x += (random(`jx${i}-${sf}`) - 0.5) * 2 * amp;
  y += (random(`jy${i}-${sf}`) - 0.5) * 2 * amp;
  r += (random(`jr${i}-${sf}`) - 0.5) * 2 * amp * 0.18;
  // the collapse: everything is sucked to the centre on the pickup (ease-in)
  const cs = 125 + Math.round(i * 0.8);
  const cp = prog(f, cs, DROP - cs, E.in);
  x = lerp(x, CX, cp);
  y = lerp(y, CY, cp);
  s *= 1 - 0.94 * cp;
  r += cp * (i % 2 ? 38 : -38);
  return { x, y, s, r, o, bright, visible: o > 0.001 };
};

const CardContent: React.FC<{ def: CardDef; f: number; glitch: boolean }> = ({ def, f, glitch }) => {
  switch (def.key) {
    case "lofi":
      return <LofiContent f={f} w={def.w} h={def.h} />;
    case "techno":
      return <TechnoContent f={f} w={def.w} h={def.h} glitch={glitch} />;
    case "jazz":
      return <JazzContent f={f} w={def.w} h={def.h} />;
    case "reggaeton":
      return <ReggaetonContent f={f} w={def.w} h={def.h} />;
    case "rap":
      return <RapContent f={f} w={def.w} h={def.h} />;
  }
};

const Card: React.FC<{ def: CardDef; pose: Pose; f: number; z: number; ghost?: number }> = ({ def, pose, f, z, ghost }) => {
  const glitch = def.key === "techno" && f >= 30 && f < 45;
  return (
    <div
      style={{
        position: "absolute",
        left: pose.x - def.w / 2,
        top: pose.y - def.h / 2,
        width: def.w,
        height: def.h,
        transform: `rotate(${pose.r}deg) scale(${pose.s})`,
        opacity: pose.o * (ghost ?? 1),
        filter: ghost ? undefined : `brightness(${pose.bright})`,
        zIndex: z,
      }}
    >
      {!ghost ? <div style={{ position: "absolute", inset: 0, transform: "translate(10px, 13px)", background: "rgba(40,28,18,0.32)", clipPath: POLY[def.key] }} /> : null}
      <div style={{ position: "absolute", inset: 0, clipPath: POLY[def.key], overflow: "hidden" }}>
        <CardContent def={def} f={f} glitch={glitch} />
      </div>
    </div>
  );
};

const PaperGround: React.FC = () => (
  <AbsoluteFill>
    <AbsoluteFill style={{ background: C.paper }} />
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at 28% 18%, rgba(255,255,255,0.45), transparent 58%), radial-gradient(ellipse at 82% 92%, rgba(120,95,60,0.16), transparent 60%)",
      }}
    />
    <AbsoluteFill style={{ mixBlendMode: "multiply", opacity: 0.16 }}>
      <svg width="100%" height="100%">
        <filter id="paperFibre">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves={4} seed={7} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#paperFibre)" />
      </svg>
    </AbsoluteFill>
  </AbsoluteFill>
);

const Intro: React.FC<{ f: number }> = ({ f }) => {
  const layers: React.ReactNode[] = [];
  CARDS.forEach((def, i) => {
    const pose = cardPose(i, f);
    if (!pose.visible) return;
    const z = zAt(i, f) * 10;
    const fast = (def.key === "rap" && f - def.enter < 6) || f >= 125;
    if (fast) {
      [1, 2, 3].forEach((k, gi) => {
        const gp = cardPose(i, f - k);
        if (gp.visible) layers.push(<Card key={`g${i}-${k}`} def={def} pose={gp} f={f - k} z={z + 3 - gi} ghost={[0.32, 0.17, 0.08][gi]} />);
      });
    }
    layers.push(<Card key={`c${i}`} def={def} pose={pose} f={f} z={z + 5} />);
  });
  return (
    <AbsoluteFill>
      <PaperGround />
      {layers}
    </AbsoluteFill>
  );
};

// ================================================================= SPOTIFY SECTION
const SpotifyMark: React.FC<{ cx: number; cy: number; dia: number; reveal: number; fill: string; ghost?: number }> = ({ cx, cy, dia, reveal, fill, ghost }) => {
  const Wa = dia / ((2 * 18.172) / 120); // svg width that gives this icon diameter
  const left = cx - (22.123 / 120) * Wa;
  const top = cy - Wa / 4;
  return (
    <svg viewBox="0 0 120 60" width={Wa} height={Wa / 2} style={{ position: "absolute", left, top, overflow: "visible", zIndex: ghost ? 39 : 40, opacity: ghost ?? 1, filter: ghost ? GHOST_FILTER : undefined }}>
      <defs>
        <clipPath id="spWordmarkReveal">
          <rect x={41} y={0} width={77 * reveal} height={60} />
        </clipPath>
      </defs>
      <path d={SPOTIFY_ICON_D} fill={fill} />
      {reveal > 0 && !ghost ? (
        <g clipPath="url(#spWordmarkReveal)">
          <g transform={SPOTIFY_TEXT_TRANSFORM} fill={fill}>
            <path d={SPOTIFY_TEXT_D} />
            <circle cx={SPOTIFY_TEXT_DOT.cx} cy={SPOTIFY_TEXT_DOT.cy} r={SPOTIFY_TEXT_DOT.r} />
          </g>
        </g>
      ) : null}
    </svg>
  );
};

const ORDER: GenreKey[] = ["rap", "techno", "jazz", "reggaeton", "lofi"];
const EMERGE = [143, 148, 153, 172, 182]; // strong onsets after the drop
const WORD_TXT: Record<GenreKey, string> = { rap: "RAP", techno: "TECHNO", jazz: "Jazz", reggaeton: "REGGAETÓN", lofi: "lo-fi" };
const WORD_FONT: Record<GenreKey, string> = { rap: FONT.rap, techno: FONT.techno, jazz: FONT.jazz, reggaeton: FONT.reggaeton, lofi: FONT.lofi };
const WORD_PX: Record<GenreKey, number> = { rap: 84, techno: 62, jazz: 80, reggaeton: 70, lofi: 96 };
const LABEL_PX: Record<GenreKey, number> = { rap: 50, techno: 34, jazz: 48, reggaeton: 40, lofi: 56 };
const TILE_COLOR: Record<GenreKey, string> = { rap: "#9C7418", techno: "#1C5C6E", jazz: "#7A2B25", reggaeton: "#C23C6C", lofi: "#6A5BA0" };

// Bento, not a row of identical cards: ONE hero tile (the focal genre) + four smalls.
// On every beat a new genre takes the hero slot (swaps places with the old hero):
// "every sound" keeps cycling, and the moves are big enough to earn motion blur.
type Rect = { x: number; y: number; w: number; h: number };
const GRID_X = 680;
const GRID_Y = 360;
const SLOTS: Rect[] = [
  { x: 680, y: 360, w: 560, h: 360 }, // hero
  { x: 1256, y: 360, w: 270, h: 172 },
  { x: 1542, y: 360, w: 270, h: 172 },
  { x: 1256, y: 548, w: 270, h: 172 },
  { x: 1542, y: 548, w: 270, h: 172 },
];
const SMALL_H = 172;
const HERO_BEATS = [248, 267, 286, 305, 324];
const HERO_SEQ = [1, 2, 3, 4, 0]; // techno, jazz, reggaeton, lo-fi, back to rap
const SWAP_LEAD = 2; // start the move 2f early so the big stepped jump lands ON the beat
const SWAP_DUR = 8;
const SLOT_EVENTS: { f: number; slots: number[] }[] = (() => {
  let slots = [0, 1, 2, 3, 4]; // slots[i] = slot of tile i
  let hero = 0;
  const ev = [{ f: -Infinity, slots }];
  HERO_BEATS.forEach((b, k) => {
    const h = HERO_SEQ[k];
    const next = [...slots];
    next[hero] = slots[h];
    next[h] = 0;
    ev.push({ f: b - SWAP_LEAD, slots: next });
    slots = next;
    hero = h;
  });
  return ev;
})();
const slotRect = (i: number, f: number): { r: Rect; toHero: boolean } => {
  let k = 0;
  SLOT_EVENTS.forEach((e, n) => {
    if (f >= e.f) k = n;
  });
  const cur = SLOTS[SLOT_EVENTS[k].slots[i]];
  if (k === 0) return { r: cur, toHero: SLOT_EVENTS[0].slots[i] === 0 };
  const prev = SLOTS[SLOT_EVENTS[k - 1].slots[i]];
  const p = prog(stepFrame(f - SLOT_EVENTS[k].f, 2), 0, SWAP_DUR, E.snap);
  return {
    r: { x: lerp(prev.x, cur.x, p), y: lerp(prev.y, cur.y, p), w: lerp(prev.w, cur.w, p), h: lerp(prev.h, cur.h, p) },
    toHero: SLOT_EVENTS[k].slots[i] === 0,
  };
};
const CORNER_BEATS = [229, 248, 267, 286, 305]; // one corner art per beat
const ICON_LEFT = { x: 400, y: CY };
const LOCKUP = { x: 689, y: 470, d: 260 }; // centres the full wordmark on screen

const ORB = { rx: 600, ry: 330, w: 0.0085 };
const orbitPos = (i: number, f: number) => {
  const sf = stepFrame(f, 2);
  const th = -Math.PI / 2 + i * ((2 * Math.PI) / 5) + (sf - 143) * ORB.w;
  return { x: CX + ORB.rx * Math.cos(th), y: CY + ORB.ry * Math.sin(th), depth: (Math.sin(th) + 1) / 2 };
};

type TPose = { x: number; y: number; w: number; h: number; s: number; r: number; o: number; top: boolean; visible: boolean };
const tilePose = (i: number, f: number): TPose => {
  const { r: T, toHero } = slotRect(i, f);
  let x = T.x + T.w / 2;
  let y = T.y + T.h / 2;
  let s = 1;
  let r = 0;
  let o = 1;
  const st = 220 + 3 * i; // after the icon has cleared the hero slot
  if (f < st) {
    o = 0;
    s = 0.82;
  } else {
    const p = prog(stepFrame(f - st, 2), 0, 11, E.over);
    s = 0.82 + 0.18 * p;
    o = Math.min(1, p * 1.6);
  }
  if (f >= 229 && f < 343) s *= 1 + 0.022 * hitPulse(f, BEATS, 6);
  const a = prog(stepFrame(f, 2), 343, 10, E.inOut); // anticipation: pull back before the throw
  s *= 1 - 0.04 * a;
  x += 14 * a;
  const cs = 352 + i;
  const c = prog(f, cs, 362 - cs, E.in); // collapse #2 into the icon
  x = lerp(x, ICON_LEFT.x, c);
  y = lerp(y, ICON_LEFT.y, c);
  s *= 1 - 0.95 * c;
  r += c * (i % 2 ? 48 : -48);
  return { x, y, w: T.w, h: T.h, s, r, o, top: toHero, visible: o > 0.001 && f < 362 };
};

const labelScaleOf = (tp: TPose) => Math.pow(tp.h / SMALL_H, 0.8);
const labelWorld = (tp: TPose) => {
  const ox = 0;
  const oy = -0.23 * tp.h * tp.s;
  const a = (tp.r * Math.PI) / 180;
  return { x: tp.x + ox * Math.cos(a) - oy * Math.sin(a), y: tp.y + ox * Math.sin(a) + oy * Math.cos(a) };
};

type WPose = { x: number; y: number; s: number; r: number; o: number; visible: boolean };
const wordPose = (i: number, f: number): WPose => {
  const key = ORDER[i];
  const e = EMERGE[i];
  if (f < e || f >= 362) return { x: 0, y: 0, s: 1, r: 0, o: 0, visible: false };
  const orb = orbitPos(i, f);
  const pe = prog(stepFrame(f - e, 2), 0, 10, E.out);
  let x = lerp(CX, orb.x, pe);
  let y = lerp(CY, orb.y, pe);
  let s = (0.3 + 0.7 * pe) * lerp(0.84, 1, orb.depth) * (1 + 0.06 * hitPulse(f, BEATS, 6));
  let o = pe * lerp(0.6, 1, orb.depth);
  let r = 0;
  const fs = 210 + 2 * i;
  if (f >= fs) {
    const from = orbitPos(i, fs);
    const q = prog(stepFrame(f - fs, 2), 0, 14, E.inOut);
    const tp = tilePose(i, f);
    const target = labelWorld(tp);
    x = lerp(from.x, target.x, q);
    y = lerp(from.y, target.y, q);
    s = lerp(lerp(0.84, 1, from.depth), (LABEL_PX[key] / WORD_PX[key]) * labelScaleOf(tp) * tp.s, q);
    o = lerp(lerp(0.6, 1, from.depth), 1, q);
    r = lerp(0, tp.r, q);
  }
  return { x, y, s, r, o, visible: o > 0.001 };
};

// ---- motion blur: stepped motion jumps every 2 frames, so blur = a smear across the
// step displacement (180-degree shutter -> half the step). Speed-proportional: nothing
// under ~8px/frame gets a smear; sample count grows with distance.
const SHUTTER = 0.5;
const smearSamples = (dist: number) => {
  if (dist < 16) return [];
  const n = Math.min(10, Math.ceil(dist / 14)); // denser samples = smear, not strobe echoes
  return Array.from({ length: n }, (_, k) => ({ t: ((k + 1) / n) * SHUTTER, o: 0.3 * (1 - k / n) }));
};
const GHOST_FILTER = "blur(1.5px)";

const CornerArt: React.FC<{ k: GenreKey; f: number }> = ({ k, f }) => {
  const size = 132;
  const base: React.CSSProperties = { position: "absolute", inset: 0, overflow: "hidden" };
  switch (k) {
    case "rap":
      return (
        <div style={{ ...base, background: RAP.bg }}>
          <AbsoluteFill style={{ backgroundImage: `radial-gradient(circle, ${RAP.dot} 1.4px, transparent 2.1px)`, backgroundSize: "9px 9px" }} />
          <div style={{ position: "absolute", left: 20, top: 6, fontFamily: FONT.rap, fontSize: 108, lineHeight: 1, color: RAP.gold }}>R</div>
        </div>
      );
    case "techno": {
      const step = Math.floor(Math.max(0, f - 30) / 4.7) % 16;
      return (
        <div style={{ ...base, background: TECH.bg, padding: 18, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
          {Array.from({ length: 16 }).map((_, n) => (
            <div key={n} style={{ background: n === step ? TECH.white : n % 5 === 0 ? TECH.cyan : "transparent", border: `2px solid ${TECH.cyanDim}` }} />
          ))}
        </div>
      );
    }
    case "jazz":
      return (
        <div style={{ ...base, background: JAZZ.cream }}>
          <div style={{ position: "absolute", left: 14, top: 14 }}>
            <Vinyl size={size - 28} spin={Math.max(0, f - 61) * 6.67} />
          </div>
        </div>
      );
    case "reggaeton":
      return (
        <div style={{ ...base, background: REG.pink }}>
          <div style={{ position: "absolute", left: -84, top: -84, width: 300, height: 300, borderRadius: "50%", opacity: 0.6, background: `repeating-conic-gradient(from ${stepFrame(f, 2) * 1.6}deg, ${REG.orange} 0deg 12deg, ${REG.pink} 12deg 24deg)` }} />
          <div style={{ position: "absolute", left: 34, top: 34, width: 64, height: 64, borderRadius: "50%", background: REG.yellow, boxShadow: `5px 5px 0 ${REG.ink}` }} />
        </div>
      );
    case "lofi":
      return (
        <div style={{ ...base, background: LOFI.bg }}>
          <svg width={size} height={size} style={{ position: "absolute", left: 0, top: 0 }}>
            <defs>
              <mask id="lofiMiniMoon">
                <circle cx={66} cy={66} r={36} fill="white" />
                <circle cx={82} cy={54} r={31} fill="black" />
              </mask>
            </defs>
            <circle cx={66} cy={66} r={36} fill={LOFI.moon} mask="url(#lofiMiniMoon)" />
            <path d={star4(100, 30, 7)} fill={LOFI.moon} />
          </svg>
        </div>
      );
  }
};

const Tile: React.FC<{ i: number; f: number; tp: TPose; ghost?: number }> = ({ i, f, tp, ghost }) => {
  const key = ORDER[i];
  const pop = prog(stepFrame(f - CORNER_BEATS[i], 2), 0, 9, E.over);
  const k = tp.h / 220; // corner art was authored for a 220px-tall tile
  return (
    <div
      style={{
        position: "absolute",
        left: tp.x - tp.w / 2,
        top: tp.y - tp.h / 2,
        width: tp.w,
        height: tp.h,
        borderRadius: 14,
        background: TILE_COLOR[key],
        overflow: "hidden",
        transform: `rotate(${tp.r}deg) scale(${tp.s})`,
        opacity: tp.o * (ghost ?? 1),
        filter: ghost ? GHOST_FILTER : undefined,
        zIndex: (ghost ? 9 : 10) + (tp.top ? 2 : 0),
      }}
    >
      {f >= CORNER_BEATS[i] && !ghost ? (
        <div
          style={{
            position: "absolute",
            left: tp.w - 112 * k,
            top: tp.h - 104 * k,
            width: 132,
            height: 132,
            transform: `scale(${k}) translate(53px, 53px) rotate(${45 - 20 * pop}deg) scale(${pop}) translate(-53px, -53px)`,
            transformOrigin: "0 0",
            boxShadow: "0 8px 16px rgba(0,0,0,0.35)",
          }}
        >
          <CornerArt k={key} f={f} />
        </div>
      ) : null}
      <AbsoluteFill style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.12), rgba(0,0,0,0.14))" }} />
    </div>
  );
};

const Ring: React.FC<{ f: number; start: number; x: number; y: number; d0: number }> = ({ f, start, x, y, d0 }) => {
  if (f < start || f > start + 18) return null;
  const p = prog(f, start, 16, E.out);
  const d = d0 * (1 + 2.2 * p);
  return <div style={{ position: "absolute", left: x - d / 2, top: y - d / 2, width: d, height: d, borderRadius: "50%", border: `5px solid ${C.green}`, opacity: 0.65 * (1 - p), zIndex: 5 }} />;
};

const iconPose = (f: number) => {
  let x = CX;
  let y = CY;
  let d = 340;
  if (f <= 135) return { x, y, d: d * 1.18, reveal: 0 };
  const sp = spring({ frame: stepFrame(f - DROP, 2), fps: FPS, config: { mass: 0.4, stiffness: 300, damping: 14 } });
  let s = 1.18 - 0.18 * sp;
  if (f < 210) s *= 1 + 0.035 * hitPulse(f, BEATS, 7);
  const m1 = prog(stepFrame(f - 210, 2), 0, 14, E.inOut);
  x = lerp(CX, ICON_LEFT.x, m1);
  d = lerp(340, 230, m1);
  if (f >= 224 && f < 352) s *= 1 + 0.025 * hitPulse(f, BEATS, 6);
  if (f >= 362) {
    const sp2 = spring({ frame: stepFrame(f - 362, 2), fps: FPS, config: { mass: 0.4, stiffness: 300, damping: 14 } });
    s *= 1 + 0.15 * (1 - sp2);
  }
  const m2 = prog(stepFrame(f - 364, 2), 0, 16, E.inOut);
  x = lerp(x, LOCKUP.x, m2);
  y = lerp(y, LOCKUP.y, m2);
  d = lerp(d, LOCKUP.d, m2);
  if (f >= 437) s *= 1 + 0.03 * hitPulse(f, [437], 8);
  const reveal = f >= 370 ? prog(stepFrame(f - 370, 2), 0, 12, E.out) : 0;
  return { x, y, d: d * s, reveal };
};

const Tagline: React.FC<{ f: number }> = ({ f }) => {
  const word = (txt: string, start: number, color: string) => {
    const p = prog(stepFrame(f - start, 2), 0, 9, E.out);
    return <span style={{ display: "inline-block", transform: `translateY(${30 * (1 - p)}px)`, opacity: p, color }}>{txt}</span>;
  };
  const ul = prog(stepFrame(f - 437, 2), 0, 10, E.out);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 664, textAlign: "center", fontFamily: FONT.spotify, fontSize: 72, letterSpacing: "-0.02em", lineHeight: 1.1, zIndex: 50 }}>
      {word("Every", 381, C.white)} {word("sound.", 385, C.white)}
      <span style={{ display: "inline-block", width: 26 }} />
      <span style={{ position: "relative", display: "inline-block" }}>
        {word("One", 400, C.green)} {word("place.", 404, C.green)}
        <span style={{ position: "absolute", left: 0, right: 0, bottom: -10, height: 7, background: C.green, transform: `scaleX(${ul})`, transformOrigin: "left center" }} />
      </span>
    </div>
  );
};

const SpotifySection: React.FC<{ f: number }> = ({ f }) => {
  const flash = f <= 135;
  const ic = iconPose(f);
  const icp = iconPose(f - 2);
  const tiles: React.ReactNode[] = [];
  const words: React.ReactNode[] = [];
  ORDER.forEach((key, i) => {
    const tp = tilePose(i, f);
    if (tp.visible) {
      if (f >= 352) {
        [1, 2, 3].forEach((k, gi) => {
          const gp = tilePose(i, f - k);
          if (gp.visible) tiles.push(<Tile key={`tg${i}-${k}`} i={i} f={f - k} tp={gp} ghost={[0.32, 0.17, 0.08][gi]} />);
        });
      } else {
        const pp = tilePose(i, f - 2);
        if (pp.visible) {
          smearSamples(Math.hypot(tp.x - pp.x, tp.y - pp.y) + Math.abs(tp.w - pp.w)).forEach((g, gi) => {
            const gp: TPose = { ...tp, x: lerp(tp.x, pp.x, g.t), y: lerp(tp.y, pp.y, g.t), w: lerp(tp.w, pp.w, g.t), h: lerp(tp.h, pp.h, g.t) };
            tiles.push(<Tile key={`ts${i}-${gi}`} i={i} f={f} tp={gp} ghost={g.o} />);
          });
        }
      }
      tiles.push(<Tile key={`t${i}`} i={i} f={f} tp={tp} />);
    }
    const wp = wordPose(i, f);
    if (wp.visible) {
      const wordEl = (p: WPose, id: string, ghost?: number) => (
        <div
          key={id}
          style={{
            position: "absolute",
            left: p.x,
            top: p.y,
            transform: `translate(-50%, -50%) rotate(${p.r}deg) scale(${p.s})`,
            opacity: p.o * (ghost ?? 1),
            filter: ghost ? GHOST_FILTER : undefined,
            fontFamily: WORD_FONT[key],
            fontSize: WORD_PX[key],
            letterSpacing: key === "techno" ? "0.1em" : undefined,
            color: C.white,
            whiteSpace: "nowrap",
            lineHeight: 1,
            zIndex: ghost ? 19 : 20,
          }}
        >
          {WORD_TXT[key]}
        </div>
      );
      const pw = wordPose(i, f - 2);
      if (pw.visible && f < 352) {
        smearSamples(Math.hypot(wp.x - pw.x, wp.y - pw.y)).forEach((g, gi) => {
          words.push(wordEl({ ...wp, x: lerp(wp.x, pw.x, g.t), y: lerp(wp.y, pw.y, g.t), s: lerp(wp.s, pw.s, g.t) }, `ws${i}-${gi}`, g.o));
        });
      }
      words.push(wordEl(wp, `w${i}`));
    }
  });
  const hdrIn = prog(stepFrame(f - 230, 2), 0, 10, E.out);
  const hdrOut = prog(f, 346, 8, E.in);
  return (
    <AbsoluteFill style={{ background: flash ? C.green : C.black }}>
      {!flash ? (
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 48%, rgba(30,215,96,0.07), transparent 60%)" }} />
      ) : null}
      <Ring f={f} start={136} x={CX} y={CY} d0={340} />
      <Ring f={f} start={362} x={ICON_LEFT.x} y={ICON_LEFT.y} d0={230} />
      {f >= 230 && f < 356 ? (
        <div style={{ position: "absolute", left: GRID_X, top: GRID_Y - 78 + 16 * (1 - hdrIn), fontFamily: FONT.spotify, fontSize: 38, color: C.white, opacity: 0.74 * hdrIn * (1 - hdrOut), zIndex: 15 }}>
          Browse all
        </div>
      ) : null}
      {tiles}
      {words}
      {!flash
        ? smearSamples(Math.hypot(ic.x - icp.x, ic.y - icp.y) + Math.abs(ic.d - icp.d)).map((g, gi) => (
            <SpotifyMark key={`is${gi}`} cx={lerp(ic.x, icp.x, g.t)} cy={lerp(ic.y, icp.y, g.t)} dia={lerp(ic.d, icp.d, g.t)} reveal={0} fill={C.green} ghost={g.o} />
          ))
        : null}
      <SpotifyMark cx={ic.x} cy={ic.y} dia={ic.d} reveal={ic.reveal} fill={flash ? C.black : C.green} />
      {f >= 381 ? <Tagline f={f} /> : null}
    </AbsoluteFill>
  );
};

// ================================================================= V3 DEPTH SECTION (frame 210 -> 456)
/*
 * v3 = same piece up to 0:07, then a real camera in Z:
 *  A 210-228  DOLLY THROUGH: camera flies forward through the orbiting genre words (they swell,
 *             defocus and pass the lens) while the card wall arrives from deep space. Focus is
 *             fixed at the orbit plane, so the dolly itself racks focus from words -> wall.
 *  B 228-343  CARD WALL IN 3D: bento wall tilted in Y, slowly orbiting (34deg -> 16deg) while the
 *             camera trucks sideways. Depth of field from true distance: the hero (near side) is
 *             sharp, far tiles soften. Every hero swap = camera push + aperture breath. A giant
 *             out-of-focus genre word sits deep behind; bokeh shapes drift in front (parallax).
 *  C 343-362  PULL BACK (wall flattens, everything into focus) -> TUNNEL: genre-coloured rings rush
 *             out of the icon while the tiles are sucked in (ref 11 target-ring tunnel).
 *  D 362-384  DIVE THROUGH the icon (fills frame) -> one white flash frame (ref 5) -> pull back
 *             out to the lockup, racking from blur into focus (ref 3 extreme-zoom transition).
 *  E 381-456  tagline words rack-focus in; on the 437 downbeat the five genre colours echo-stack
 *             out of "One place." and collapse back into it (refs 9/10 echo stack).
 */
const FOCAL = 1000;
type P3 = { x: number; y: number; z: number };
type Cam3 = { x: number; y: number; z: number; focus: number; ap: number };
const proj = (p: P3, cam: Cam3) => {
  const d = Math.max(1, p.z - cam.z);
  const s = FOCAL / d;
  return { sx: CX + (p.x - cam.x) * s, sy: CY + (p.y - cam.y) * s, s, d };
};
const dof = (d: number, cam: Cam3) => Math.min(26, cam.ap * Math.abs(1 - cam.focus / d));
const blurCss = (b: number) => (b > 0.4 ? `blur(${b.toFixed(2)}px)` : undefined);

const WALL = { x: 1390, y: CY, z: 800 };
const S3 = 1.2;
const SLOTS3 = SLOTS.map((r) => ({ u: (r.x + r.w / 2 - 1246) * S3, v: (r.y + r.h / 2 - 540) * S3, w: r.w * S3, h: r.h * S3 }));
const WALL_HALF_W = 566 * S3;
const WALL_HALF_H = 180 * S3;

const slotLocal = (i: number, f: number) => {
  let k = 0;
  SLOT_EVENTS.forEach((e, n) => {
    if (f >= e.f) k = n;
  });
  const cur = SLOTS3[SLOT_EVENTS[k].slots[i]];
  const toHero = SLOT_EVENTS[k].slots[i] === 0;
  if (k === 0) return { ...cur, toHero };
  const prev = SLOTS3[SLOT_EVENTS[k - 1].slots[i]];
  const p = prog(stepFrame(f - SLOT_EVENTS[k].f, 2), 0, SWAP_DUR, E.snap);
  return { u: lerp(prev.u, cur.u, p), v: lerp(prev.v, cur.v, p), w: lerp(prev.w, cur.w, p), h: lerp(prev.h, cur.h, p), toHero };
};
const heroAt = (f: number) => {
  let h = 0;
  let since = f - 214;
  HERO_BEATS.forEach((b, k) => {
    if (f >= b - SWAP_LEAD) {
      h = HERO_SEQ[k];
      since = f - (b - SWAP_LEAD);
    }
  });
  return { h, since };
};

const wallTheta = (f: number) => {
  const sf = stepFrame(f, 2);
  return interpolate(sf, [210, 343], [28, 13], { ...CLAMP, easing: E.inOut }) * (1 - prog(sf, 343, 10, E.inOut));
};
const wallPoint = (u: number, v: number, thDeg: number): P3 => {
  const th = (thDeg * Math.PI) / 180;
  return { x: WALL.x + u * Math.cos(th), y: WALL.y + v, z: WALL.z + u * Math.sin(th) };
};

const pushes = (f: number) => {
  const sf = stepFrame(f, 2);
  let p = 0;
  HERO_BEATS.forEach((b) => {
    const a = sf - (b - SWAP_LEAD);
    if (a >= 0 && a < 26) p += prog(a, 0, 4, E.snap) * (1 - prog(a, 6, 14, E.inOut));
  });
  return p;
};

const cam3 = (f: number): Cam3 => {
  const sf = stepFrame(f, 2);
  const pu = pushes(f);
  let z = lerp(-1000, -250, prog(sf, 210, 24, E.inOut)); // the dolly (24f so the words read as they pass)
  z += 120 * pu; // push on every hero swap
  z = lerp(z, -440, prog(sf, 343, 10, E.inOut)); // pull back before the tunnel
  const truck = interpolate(sf, [226, 343], [-70, 70], { ...CLAMP, easing: E.inOut }) * (1 - prog(sf, 343, 10, E.inOut));
  const x = CX + truck;
  const y = CY + noise2D("c3y", sf * 0.01, 0) * 14;
  const hero = wallPoint(SLOTS3[0].u, 0, wallTheta(f));
  const focus = lerp(1000, hero.z - z, prog(sf, 222, 10, E.inOut));
  const ap = lerp(20, 3, prog(sf, 343, 10, E.inOut)) + 12 * pu;
  return { x, y, z, focus, ap };
};

// ---- the tile (3D)
type T3 = { sx: number; sy: number; s: number; d: number; w: number; h: number; th: number; rz: number; o: number; blur: number; zi: number };
// v4: each wall tile now carries its genre's ORIGINAL intro-card artwork (same components as
// the opening collage), framed in a clean rounded rectangle instead of torn paper. The art is
// rendered at its native card size and cover-scaled into the tile, so animation (lo-fi stars,
// techno sequencer, spinning vinyl, sunbursts, dembow bounce) keeps running inside the wall.
const EDGE: Record<GenreKey, string> = { lofi: "rgba(255,255,255,0.14)", techno: "rgba(67,224,227,0.45)", jazz: "rgba(154,107,38,0.35)", reggaeton: "rgba(255,255,255,0.16)", rap: "rgba(215,168,60,0.5)" };
const CARD_BG: Record<GenreKey, string> = { lofi: LOFI.bg, techno: TECH.bg, jazz: JAZZ.cream, reggaeton: REG.pink, rap: RAP.bg };
const Tile3: React.FC<{ i: number; f: number; t: T3; ghost?: number }> = ({ i, f, t, ghost }) => {
  const key = ORDER[i];
  const def = CARDS.find((c) => c.key === key)!;
  const fit = Math.min(t.w / def.w, t.h / def.h); // contain: titles never cropped, card bg fills the rest
  return (
    <div
      style={{
        position: "absolute",
        left: t.sx,
        top: t.sy,
        width: t.w,
        height: t.h,
        marginLeft: -t.w / 2,
        marginTop: -t.h / 2,
        borderRadius: 16,
        background: CARD_BG[key],
        overflow: "hidden",
        transform: `scale(${t.s}) rotate(${t.rz}deg) perspective(${t.d}px) rotateY(${t.th}deg)`,
        opacity: t.o * (ghost ?? 1),
        filter: blurCss(t.blur + (ghost ? 1.5 : 0)),
        zIndex: t.zi - (ghost ? 1 : 0),
      }}
    >
      {!ghost ? (
        <>
          <div
            style={{
              position: "absolute",
              left: (t.w - def.w * fit) / 2,
              top: (t.h - def.h * fit) / 2,
              width: def.w,
              height: def.h,
              transform: `scale(${fit})`,
              transformOrigin: "0 0",
            }}
          >
            <CardContent def={def} f={f} glitch={false} />
          </div>
          {/* clean frame: hairline edge + soft top light, one quiet treatment */}
          <AbsoluteFill style={{ borderRadius: 16, boxShadow: `inset 0 0 0 2px ${EDGE[key]}`, background: "linear-gradient(160deg, rgba(255,255,255,0.08), rgba(0,0,0,0.12))" }} />
        </>
      ) : null}
    </div>
  );
};

const icon3 = (f: number, cam: Cam3) => {
  const ip = iconPose(Math.min(f, 361));
  return { x: ip.x - 1.6 * (cam.x - CX), y: ip.y, d: ip.d }; // HUD layer reads as nearest: strongest parallax
};

const tileT3 = (i: number, f: number, cam: Cam3, ic: { x: number; y: number }): T3 | null => {
  const st = 218 + 2 * i;
  if (f < st || f >= 362) return null;
  const sl = slotLocal(i, f);
  const th = wallTheta(f);
  const p = proj(wallPoint(sl.u, sl.v, th), cam);
  const bloom = prog(stepFrame(f - st, 2), 0, 10, E.over);
  let sx = p.sx;
  let sy = p.sy;
  let s = p.s * (0.8 + 0.2 * bloom);
  let rz = 0;
  const cs = 352 + i;
  const c = prog(f, cs, 362 - cs, E.in);
  sx = lerp(sx, ic.x, c);
  sy = lerp(sy, ic.y, c);
  s *= 1 - 0.95 * c;
  rz = c * (i % 2 ? 48 : -48);
  return { sx, sy, s, d: p.d, w: sl.w, h: sl.h, th, rz, o: Math.min(1, bloom * 1.8), blur: dof(p.d, cam) * (1 - c), zi: Math.round(3000 - p.d) + (sl.toHero ? 40 : 0) };
};

// ---- depth dressing
const DOTS = Array.from({ length: 110 }, (_, n) => ({
  x: CX - 1700 + 3400 * random(`dx${n}`),
  y: CY - 950 + 1900 * random(`dy${n}`),
  z: -60 + 2700 * random(`dz${n}`),
}));
const DotField: React.FC<{ cam: Cam3; o: number }> = ({ cam, o }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, zIndex: 1 }}>
    {DOTS.map((p, n) => {
      const q = proj(p, cam);
      if (q.d < 90) return null;
      const r = Math.min(16, 2.4 * q.s);
      const a = o * Math.min(0.32, 0.5 / Math.max(1, dof(q.d, cam) * 0.35)) * Math.min(1, q.s * 1.4);
      return <circle key={n} cx={q.sx} cy={q.sy} r={r} fill={C.white} opacity={a} />;
    })}
  </svg>
);

const BOKEH = Array.from({ length: 11 }, (_, n) => ({
  kind: ["circle", "ring", "star", "square"][Math.floor(random(`bk${n}`) * 4)],
  color: TILE_COLOR[ORDER[n % 5]],
  x: CX - 1000 + 2000 * random(`bx${n}`),
  y: CY - 560 + 1120 * random(`by${n}`),
  z: 20 + 300 * random(`bz${n}`),
  size: 16 + 26 * random(`bs${n}`),
}));
const Bokeh: React.FC<{ f: number; cam: Cam3; o: number }> = ({ f, cam, o }) => (
  <>
    {BOKEH.map((b, n) => {
      const sf = stepFrame(f, 2);
      const q = proj({ x: b.x + noise2D(`bkx${n}`, sf * 0.01, 0) * 60, y: b.y + noise2D(`bky${n}`, 0, sf * 0.01) * 40, z: b.z }, cam);
      if (q.d < 60) return null;
      const sz = b.size * q.s;
      const common: React.CSSProperties = { position: "absolute", left: q.sx - sz / 2, top: q.sy - sz / 2, width: sz, height: sz, opacity: 0.38 * o, filter: blurCss(Math.max(6, dof(q.d, cam))), zIndex: 6000 };
      if (b.kind === "star")
        return (
          <svg key={n} viewBox="0 0 40 40" style={common}>
            <path d={star4(20, 20, 19)} fill={b.color} />
          </svg>
        );
      return <div key={n} style={{ ...common, borderRadius: b.kind === "square" ? "18%" : "50%", background: b.kind === "ring" ? "transparent" : b.color, border: b.kind === "ring" ? `${sz * 0.14}px solid ${b.color}` : undefined, transform: b.kind === "square" ? `rotate(${n * 23}deg)` : undefined }} />;
    })}
  </>
);

const BigWord: React.FC<{ f: number; cam: Cam3 }> = ({ f, cam }) => {
  if (f < 224 || f >= 356) return null;
  const { h, since } = heroAt(f);
  const prevH = h === 0 && f < HERO_BEATS[0] ? -1 : HERO_SEQ[(HERO_SEQ.indexOf(h) + 4) % 5];
  const p = prog(stepFrame(since, 2), 0, 8, E.out);
  const fade = prog(f, 224, 10, E.out) * (1 - prog(f, 343, 12, E.in));
  const q = proj({ x: WALL.x - 60, y: CY - 330, z: 2300 }, cam);
  const one = (gi: number, a: number, dy: number) => {
    const key = ORDER[gi];
    return (
      <div
        key={`bw${gi}-${dy > 0 ? "in" : "out"}`}
        style={{
          position: "absolute",
          left: q.sx,
          top: q.sy + dy * q.s,
          transform: `translate(-50%, -50%) scale(${q.s})`,
          fontFamily: WORD_FONT[key],
          fontSize: 900,
          letterSpacing: key === "techno" ? "0.08em" : undefined,
          lineHeight: 1,
          whiteSpace: "nowrap",
          color: TILE_COLOR[key],
          opacity: 0.6 * a * fade,
          filter: blurCss(dof(q.d, cam) * 0.8),
          zIndex: 2,
        }}
      >
        {WORD_TXT[key]}
      </div>
    );
  };
  return (
    <>
      {prevH >= 0 && p < 1 ? one(prevH, 1 - p, -220 * p) : null}
      {one(h, f < HERO_BEATS[0] - SWAP_LEAD ? 1 : p, 220 * (1 - p))}
    </>
  );
};

const Tunnel: React.FC<{ f: number; x: number; y: number }> = ({ f, x, y }) => {
  const rings: React.ReactNode[] = [];
  for (let spawn = 348; spawn <= 366; spawn += 2) {
    const a = f - spawn;
    if (a < 0) continue;
    const dia = 70 * Math.pow(1.42, a);
    if (dia > 4200) continue;
    const k = (spawn - 348) / 2;
    rings.push(
      <div
        key={spawn}
        style={{
          position: "absolute",
          left: x - dia / 2,
          top: y - dia / 2,
          width: dia,
          height: dia,
          borderRadius: "50%",
          border: `${Math.max(4, dia * 0.07)}px solid ${TILE_COLOR[ORDER[k % 5]]}`,
          opacity: 0.95 * (1 - prog(dia, 1600, 2400, E.in)),
          zIndex: 7000,
        }}
      />
    );
  }
  return <>{rings}</>;
};

const Tagline3: React.FC<{ f: number }> = ({ f }) => {
  const word = (txt: string, start: number, color: string) => {
    const p = prog(stepFrame(f - start, 2), 0, 9, E.out);
    return (
      <span style={{ display: "inline-block", transform: `scale(${1.35 - 0.35 * p})`, filter: blurCss(14 * (1 - p)), opacity: Math.min(1, p * 1.6), color }}>{txt}</span>
    );
  };
  const ul = prog(stepFrame(f - 437, 2), 0, 10, E.out);
  const e = f >= 437 ? 1 - prog(stepFrame(f - 437, 2), 0, 14, E.out) : 0; // echo spread: max ON the hit, collapses in
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 664, textAlign: "center", fontFamily: FONT.spotify, fontSize: 72, letterSpacing: "-0.02em", lineHeight: 1.1, zIndex: 9000 }}>
      {word("Every", 381, C.white)} {word("sound.", 385, C.white)}
      <span style={{ display: "inline-block", width: 26 }} />
      <span style={{ position: "relative", display: "inline-block" }}>
        {e > 0.01
          ? [4, 3, 2, 1, 0].map((k) => (
              <span key={k} style={{ position: "absolute", left: 0, top: 0, whiteSpace: "nowrap", color: TILE_COLOR[ORDER[k]], transform: `translate(0px, ${(k + 1) * 16 * e}px)`, opacity: Math.min(1, e * 1.4) }}>
                One place.
              </span>
            ))
          : null}
        <span style={{ position: "relative" }}>
          {word("One", 400, C.green)} {word("place.", 404, C.green)}
        </span>
        <span style={{ position: "absolute", left: 0, right: 0, bottom: -10, height: 7, background: C.green, transform: `scaleX(${ul})`, transformOrigin: "left center" }} />
      </span>
    </div>
  );
};

const DepthSection: React.FC<{ f: number }> = ({ f }) => {
  const sf = stepFrame(f, 2);
  // camera for the wall world (A-C); after the dive a gentle forward drift for the lockup world
  const cam: Cam3 = f < 368 ? cam3(f) : { x: CX, y: CY, z: -420 + 2.2 * (sf - 368), focus: 1000, ap: 6 };
  const ic = icon3(f, cam);
  const nodes: React.ReactNode[] = [];

  // A: the orbit words fly past the lens (orbit plane z=0, camera dollies through it)
  if (f < 240) {
    ORDER.forEach((key, i) => {
      const orb = orbitPos(i, f);
      const q = proj({ x: orb.x, y: orb.y, z: 0 }, { ...cam, x: CX, y: CY });
      const s0 = lerp(0.84, 1, orb.depth);
      const gone = prog(q.s, 1.9, 1.6, E.in);
      if (gone >= 1) return;
      nodes.push(
        <div
          key={`fw${i}`}
          style={{
            position: "absolute",
            left: q.sx,
            top: q.sy,
            transform: `translate(-50%, -50%) scale(${s0 * q.s})`,
            fontFamily: WORD_FONT[key],
            fontSize: WORD_PX[key],
            letterSpacing: key === "techno" ? "0.1em" : undefined,
            color: C.white,
            whiteSpace: "nowrap",
            lineHeight: 1,
            opacity: lerp(0.6, 1, orb.depth) * (1 - gone),
            filter: blurCss(dof(q.d, cam)),
            zIndex: 8000,
          }}
        >
          {WORD_TXT[key]}
        </div>
      );
    });
  }

  // B: wall tiles (+ smear on the swaps)
  if (f < 362) {
    ORDER.forEach((_, i) => {
      const t = tileT3(i, f, cam, ic);
      if (!t) return;
      const tp = tileT3(i, f - 2, cam3(f - 2), icon3(f - 2, cam3(f - 2)));
      if (tp && f < 352 && f >= 240) {
        smearSamples(Math.hypot(t.sx - tp.sx, t.sy - tp.sy) + Math.abs(t.w * t.s - tp.w * tp.s) * 0.5).forEach((g, gi) => {
          nodes.push(<Tile3 key={`ts${i}-${gi}`} i={i} f={f} t={{ ...t, sx: lerp(t.sx, tp.sx, g.t), sy: lerp(t.sy, tp.sy, g.t), w: lerp(t.w, tp.w, g.t), h: lerp(t.h, tp.h, g.t) }} ghost={g.o} />);
        });
      }
      if (f >= 352) {
        [1, 2, 3].forEach((k, gi) => {
          const cg = cam3(f - k);
          const tg = tileT3(i, f - k, cg, icon3(f - k, cg));
          if (tg) nodes.push(<Tile3 key={`tg${i}-${k}`} i={i} f={f - k} t={tg} ghost={[0.32, 0.17, 0.08][gi]} />);
        });
      }
      nodes.push(<Tile3 key={`t${i}`} i={i} f={f} t={t} />);
    });
    // header on the wall plane
    if (f >= 226 && f < 352) {
      const th = wallTheta(f);
      const q = proj(wallPoint(-WALL_HALF_W + 210, -WALL_HALF_H - 46, th), cam);
      const hp = prog(stepFrame(f - 226, 2), 0, 10, E.out) * (1 - prog(f, 343, 8, E.in));
      nodes.push(
        <div
          key="hdr"
          style={{
            position: "absolute",
            left: q.sx,
            top: q.sy,
            width: 420,
            height: 60,
            marginLeft: -210,
            marginTop: -30,
            transform: `scale(${q.s}) perspective(${q.d}px) rotateY(${th}deg)`,
            fontFamily: FONT.spotify,
            fontSize: 44,
            color: C.white,
            opacity: 0.78 * hp,
            filter: blurCss(dof(q.d, cam)),
            zIndex: 2900,
          }}
        >
          Browse all
        </div>
      );
    }
  }

  // icon: HUD anchor until the dive; dive 362-367 fills the frame
  let iconEl: React.ReactNode = null;
  if (f < 362) {
    const icp = icon3(f - 2, cam3(f - 2));
    iconEl = (
      <>
        {smearSamples(Math.hypot(ic.x - icp.x, ic.y - icp.y) + Math.abs(ic.d - icp.d)).map((g, gi) => (
          <SpotifyMark key={`is${gi}`} cx={lerp(ic.x, icp.x, g.t)} cy={lerp(ic.y, icp.y, g.t)} dia={lerp(ic.d, icp.d, g.t)} reveal={0} fill={C.green} ghost={g.o} />
        ))}
        <SpotifyMark cx={ic.x} cy={ic.y} dia={ic.d * (1 + 0.12 * prog(f, 352, 10, E.in))} reveal={0} fill={C.green} />
      </>
    );
  } else if (f < 368) {
    const start = icon3(361, cam3(361));
    const dv = prog(f, 362, 5, E.in);
    const kick = f === 362 ? 1.15 : 1;
    iconEl = <SpotifyMark cx={lerp(start.x, CX, dv)} cy={lerp(start.y, CY, dv)} dia={start.d * kick * Math.pow(26, dv)} reveal={0} fill={C.green} />;
  }

  // D: pull back out to the lockup, racking from blur into focus
  let lockEl: React.ReactNode = null;
  if (f >= 369) {
    const p = prog(stepFrame(f - 369, 2), 0, 16, E.out);
    const k = lerp(3.0, 1, p);
    const acc = f >= 437 ? 1 + 0.03 * hitPulse(f, [437], 8) : 1;
    lockEl = (
      <div style={{ position: "absolute", inset: 0, filter: blurCss(18 * (1 - p)), zIndex: 8500 }}>
        <SpotifyMark cx={CX + (LOCKUP.x - CX) * k} cy={CY + (LOCKUP.y - CY) * k} dia={LOCKUP.d * k * acc} reveal={1} fill={C.green} />
      </div>
    );
  }

  const wallWorld = f < 362;
  iconEl = iconEl ? <div style={{ position: "absolute", inset: 0, zIndex: 7500 }}>{iconEl}</div> : null;
  return (
    <AbsoluteFill style={{ background: C.black }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 48%, rgba(30,215,96,0.07), transparent 60%)" }} />
      <DotField cam={cam} o={f < 368 ? 1 : prog(f, 369, 10, E.out)} />
      {wallWorld ? <BigWord f={f} cam={cam} /> : null}
      {nodes}
      {f >= 346 && f < 368 ? <Tunnel f={f} x={f < 362 ? ic.x : lerp(icon3(361, cam3(361)).x, CX, prog(f, 362, 5, E.in))} y={CY} /> : null}
      {iconEl}
      {f >= 226 && f < 356 ? <Bokeh f={f} cam={cam} o={prog(f, 226, 10, E.out) * (1 - prog(f, 343, 12, E.in))} /> : null}
      {lockEl}
      {f >= 381 ? <Tagline3 f={f} /> : null}
      {f === 368 ? <AbsoluteFill style={{ background: C.white, zIndex: 9500 }} /> : null}
    </AbsoluteFill>
  );
};

// ================================================================= MAIN
export const SpotifyEverySound: React.FC = () => {
  const frame = useCurrentFrame();
  useVideoConfig();
  const sf = stepFrame(frame, 2);

  // camera: slow push + pre-drop rush + impact kicks + stepped drift + shake
  const push = interpolate(frame, [0, SPOTIFY_DURATION], [1, 1.05], { ...CLAMP, easing: E.inOut });
  const rush = frame < DROP ? interpolate(frame, [118, 133], [1, 1.12], { ...CLAMP, easing: E.in }) : 1;
  const kick = 1 + 0.03 * hitPulse(frame, [DROP, 362], 8);
  const shake = 16 * hitPulse(frame, [106], 9) + 12 * hitPulse(frame, [DROP], 8) + 7 * hitPulse(frame, [362], 6);
  const sx = (random(`sx-${sf}`) - 0.5) * 2 * shake + noise2D("camx", sf * 0.012, 0) * 5;
  const sy = (random(`sy-${sf}`) - 0.5) * 2 * shake + noise2D("camy", 0, sf * 0.012) * 5;
  const END_CUT = 456; // implied beat after the 437 downbeat (19f grid)

  return (
    <AbsoluteFill style={{ backgroundColor: frame < DROP ? C.paper : C.black, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px) scale(${push * rush * kick})`, transformOrigin: "50% 50%" }}>
        {frame < DROP ? <Intro f={frame} /> : frame < 210 ? <SpotifySection f={frame} /> : <DepthSection f={frame} />}
      </AbsoluteFill>
      <Vignette opacity={frame < DROP ? 0.2 : 0.3} />
      <Grain opacity={frame < DROP ? 0.13 : 0.16} />
      <Sequence from={END_CUT} durationInFrames={CAT_EYES_DURATION}>
        <CatEyesEnd tint={C.green} />
        <Grain opacity={0.05} />
      </Sequence>
      <Audio src={staticFile("audio/upbeatchill.mp3")} volume={(f) => 0.582 * interpolate(f, [462, SPOTIFY_DURATION], [1, 0], { ...CLAMP, easing: E.in })} />
    </AbsoluteFill>
  );
};
