/**
 * REVOLUT — "One app for your money."  v5 (= v4 with the bed at -44 LUFS), 9:16 (1080x1920, 30fps). Unaffiliated concept piece.
 *
 * PARAMETER BRIEF
 * - Lineage: refs 16 (VO-paced, recurring motif, colour discipline, holds), 17 (ONE persistent
 *   object + flash/streak whips), 14/15 (card-to-world, pinned HUD, glass UI), 18 (match cut on
 *   shared shape). Clean fintech: smooth 30fps (no twos — deliberate contrast with pieces 1–2).
 * - Palette (4 + neutrals): bg #0B0B12, surface #16161F, text #F5F5F7, muted #9A9AA8;
 *   hero gradient #CF206A → #7B3A8E → #2B44A0 (sampled from the Original card);
 *   one functional accent green #3ECF8E (order filled / sparklines only). No indigo-default gradient.
 * - Type: Aeonik Pro Light 88px sentence case for VO lines, Aeonik Pro Bold Italic for the ONE
 *   stressed verb per line (the recurring motif). Inter 400/500/600 for all UI. Hero hook word 150px.
 * - Composition: pinned HUD (5-segment world rail + headline, top-left, never moves);
 *   ONE focal object = the Original card; worlds unfold around/out of it. Focal zone y 560–1560.
 * - Pacing (VO-locked, Voice1 measured): hook 0–84 · Spend 84–160 · Invest 160–252 ·
 *   Crypto 252–328 · Analytics 328–400 · Rewards 400–488 · lockup 488–600 · cat eyes 600–648.
 * - Transitions (one family each, never repeated back-to-back):
 *   streak→card (light whip deposits the card) · card edge-on → chart line (shape match) ·
 *   chart head dot → BTC coin (shape match) · line → card re-forms "in the same place" ·
 *   card flips and BECOMES the analytics screen (card-to-world) · screen folds back to card ·
 *   gather + spin → wordmark snap (the one IMPACT hit).
 * - Easing: entrances expo-out (0.16,1,0.3,1); exits ease-in (0.4,0,1,1); flips in-out;
 *   card opens with a ~10% overshoot (0.34,1.56,0.64,1). Stagger 2–4f per word/element.
 * - Texture: grain 7% (clean brand, below the 10–15% default on purpose), soft vignette,
 *   colour-graded glow blobs per world, specular sheen on the card.
 * - Camera: per-world slow push (≤3.5%) + noise drift ±3px / ±0.12°; HUD pinned outside camera.
 * - Sound: VO (Voice1, normalised) + ambient pad bed + frame-locked placeholder SFX (rv-*.wav,
 *   synthesized — swap for sourced files with the same names). Target −14 LUFS / −1 dBTP.
 *
 * Privacy: every UI value here is invented. No personal names, balances, card numbers,
 * merchants or rates from the source screenshots. Card 5 (named) is not used.
 */
import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Sequence,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { noise2D } from "@remotion/noise";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { loadLocalFont } from "../lib/localFonts";
import { CatEyesEnd, CAT_EYES_DURATION } from "../components/CatEyesEnd";
import { RV_WORDMARK_PATHS, RV_WORDMARK_VIEWBOX } from "../lib/revolutPaths";
import { RV_COAST, RV_LAND_DOTS } from "../lib/revolutEarth";

// ---------------------------------------------------------------------------------------------
// SETUP
// ---------------------------------------------------------------------------------------------
export const RV_LOCKUP_END = 600;
export const RV_DURATION = RV_LOCKUP_END + CAT_EYES_DURATION; // 648f = 21.6s

const W = 1080;
const H = 1920;
const CX = 540;

const F = {
  light: loadLocalFont("RvAeonikLight", "AeonikPro-Light.ttf"),
  boldIt: loadLocalFont("RvAeonikBoldIt", "AeonikPro-BoldItalic.ttf"),
  i4: loadLocalFont("RvInter400", "Inter-400.woff2"),
  i5: loadLocalFont("RvInter500", "Inter-500.woff2"),
  i6: loadLocalFont("RvInter600", "Inter-600.woff2"),
};

const C = {
  bg: "#0B0B12",
  surface: "#16161F",
  surface2: "#1D1D28",
  hair: "rgba(255,255,255,0.08)",
  text: "#F5F5F7",
  muted: "#9A9AA8",
  mag: "#CF206A",
  vio: "#7B3A8E",
  blue: "#2B44A0",
  green: "#3ECF8E",
  eyes: "#6F7CF2",
};
const HERO_GRAD = `linear-gradient(115deg, ${C.mag} 0%, ${C.vio} 48%, ${C.blue} 100%)`;

type EaseFn = (t: number) => number;
const E = {
  out: Easing.bezier(0, 0, 0.2, 1),
  in: Easing.bezier(0.4, 0, 1, 1),
  inOut: Easing.bezier(0.4, 0, 0.2, 1),
  expo: Easing.bezier(0.16, 1, 0.3, 1),
  over: Easing.bezier(0.34, 1.56, 0.64, 1),
  snapIn: Easing.bezier(0.7, 0, 0.84, 0),
};
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const prog = (f: number, a: number, d: number, e: EaseFn = E.out) =>
  interpolate(f, [a, a + d], [0, 1], { ...CLAMP, easing: e });
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type Key = [number, number, EaseFn?];
/** piecewise keyframes; the easing on a key shapes the segment that ENDS on it */
const kf = (f: number, keys: Key[]): number => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [f1, v1, e] = keys[i];
    if (f <= f1) {
      const [f0, v0] = keys[i - 1];
      if (f1 === f0) return v1;
      return v0 + (v1 - v0) * (e ?? E.inOut)((f - f0) / (f1 - f0));
    }
  }
  return keys[keys.length - 1][1];
};
/** 0→1→0 bump over d frames starting at a */
const bump = (f: number, a: number, d: number) => {
  const u = (f - a) / d;
  return u <= 0 || u >= 1 ? 0 : Math.sin(Math.PI * u) * (1 - u * 0.35);
};

// fast-move windows that get real (camera) motion blur
const MB_WINDOWS: [number, number][] = [
  [0, 14],
  [114, 124],
  [130, 138],
  [141, 149],
  [156, 168],
  [248, 262],
  [286, 300],
  [318, 350],
  [394, 416],
  [482, 504],
];
const inMB = (f: number) => MB_WINDOWS.some(([a, b]) => f >= a && f <= b);

// ---------------------------------------------------------------------------------------------
// THE CARD (persistent object) — keyframed state
// ---------------------------------------------------------------------------------------------
const CARD_W = 620;
const CARD_H = 391;
const TAPS = [91, 121, 135, 146, 446, 458, 470];
const PANEL_W = 840;

const cardState = (f: number) => {
  const visible = (f >= 6 && f <= 166) || f >= 290;
  const y = kf(f, [
    [6, 1120], [84, 1120], [98, 1340], [156, 1340], [166, 1180, E.in], [290, 1180],
    [306, 1150, E.out], [328, 1150], [348, 1080, E.expo], [396, 1080], [412, 1110, E.inOut],
    [484, 1110], [500, 1310, E.inOut],
  ]);
  const rx = kf(f, [
    [6, 90], [30, 14, E.over], [84, 14], [98, 24], [156, 24], [166, 90, E.in], [290, 90],
    [308, 12, E.over], [328, 12], [340, 0], [400, 0], [414, 10], [484, 10], [500, 0],
  ]);
  const ry = kf(f, [
    [6, -26], [30, -10, E.out], [84, -10], [98, 14], [156, 14], [166, 0, E.in], [290, 0],
    [308, -8, E.out], [328, -8], [341, 180, E.inOut], [400, 180], [415, 360, E.inOut],
    [484, 360], [500, 720, E.inOut],
  ]);
  const rz = kf(f, [
    [6, -6], [30, -3], [84, -3], [98, 4], [156, 4], [166, 0], [290, 0], [308, -3],
    [328, -3], [341, 0], [415, 0], [424, 3], [484, 3], [500, 0],
  ]);
  const s = kf(f, [
    [6, 1], [84, 1], [98, 0.86], [156, 0.86], [166, 1, E.in], [328, 1], [400, 1],
    [414, 0.9], [484, 0.9], [500, 0.86],
  ]);
  const w = kf(f, [[334, CARD_W], [352, PANEL_W, E.expo], [396, PANEL_W], [408, CARD_W, E.in]]);
  const h = kf(f, [[334, CARD_H], [352, 960, E.expo], [396, 960], [408, CARD_H, E.in]]);
  // idle life (reduced while it is a screen, zero on the exact match-cut frames)
  const idle =
    f < 30 ? prog(f, 20, 10) : f > 150 && f < 172 ? 0 : f > 284 && f < 310 ? 0 : f > 340 && f < 400 ? 0.25 : f >= 500 ? 0.2 : 1; // lockup: near-still so the fan stays symmetric
  const ph = (f / 96) * Math.PI * 2;
  let tapS = 0;
  let tapX = 0;
  for (const t of TAPS) {
    tapS += bump(f, t - 2, 10);
    tapX += bump(f, t - 2, 12);
  }
  return {
    visible,
    x: CX + idle * Math.sin(ph * 0.5) * 4,
    y: y + idle * Math.sin(ph) * 7,
    rx: rx + idle * Math.cos(ph * 0.8) * 2 + tapX * 6,
    ry: ry + idle * Math.sin(ph * 0.6) * 3,
    rz,
    s: s * (1 - tapS * 0.045),
    w,
    h,
  };
};

const CardFace: React.FC<{ src: string; sheen: number; radius: number }> = ({ src, sheen, radius }) => (
  <div style={{ position: "absolute", inset: 0, borderRadius: radius, overflow: "hidden" }}>
    <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(118deg, rgba(255,255,255,0) ${sheen - 22}%, rgba(255,255,255,0.30) ${sheen}%, rgba(255,255,255,0) ${sheen + 20}%)`,
        mixBlendMode: "screen",
      }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: radius,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22), inset 0 0 0 1px rgba(255,255,255,0.06)",
      }}
    />
  </div>
);

const THICK = 5;
const Card3D: React.FC<{ f: number; children?: React.ReactNode }> = ({ f, children }) => {
  const st = cardState(f);
  if (!st.visible) return null;
  const { w, h } = st;
  const radius = interpolate(w, [CARD_W, PANEL_W], [23, 44], CLAMP);
  const ryN = ((st.ry % 360) + 360) % 360;
  const sheen = 50 + (ryN > 180 ? ryN - 360 : ryN) * 1.6 + st.rx * 1.4;
  const edge = `linear-gradient(90deg, ${C.mag}, ${C.vio}, ${C.blue})`;
  const edgeV = `linear-gradient(180deg, ${C.vio}, ${C.blue})`;
  const facing = Math.abs(Math.cos((st.rx * Math.PI) / 180));
  return (
    <>
      {/* contact shadow + coloured spill */}
      <div
        style={{
          position: "absolute",
          left: st.x - w * st.s * 0.48,
          top: st.y + h * st.s * 0.5 + 40,
          width: w * st.s * 0.96,
          height: 70,
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(0,0,0,0.55), rgba(0,0,0,0) 70%)",
          opacity: 0.8 * facing,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: st.x - w * 0.55,
          top: st.y - h * 0.55,
          width: w * 1.1,
          height: h * 1.1,
          borderRadius: "50%",
          background: `radial-gradient(ellipse at center, rgba(123,58,142,0.42), rgba(43,68,160,0.18) 45%, rgba(0,0,0,0) 70%)`,
          transform: `scale(${st.s * 1.25})`,
          opacity: facing * interpolate(w, [CARD_W, PANEL_W], [1, 0.25], CLAMP),
        }}
      />
      <div style={{ position: "absolute", left: st.x, top: st.y, width: 0, height: 0, perspective: 1900 }}>
        <div
          style={{
            position: "absolute",
            left: -w / 2,
            top: -h / 2,
            width: w,
            height: h,
            transformStyle: "preserve-3d",
            transform: `scale(${st.s}) rotateZ(${st.rz}deg) rotateX(${st.rx}deg) rotateY(${st.ry}deg)`,
          }}
        >
          {/* front */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: `translateZ(${THICK / 2}px)`,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            <CardFace src="revolut/card3.png" sheen={sheen} radius={radius} />
          </div>
          {/* back = dark card → becomes the analytics screen */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: `rotateY(180deg) translateZ(${THICK / 2}px)`,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              borderRadius: radius,
              overflow: "hidden",
              background: `linear-gradient(160deg, #1A1A25, #121219)`,
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07)",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: CARD_H * 0.13,
                height: CARD_H * 0.19,
                background: "#07070B",
                opacity: 1 - prog(f, 334, 8),
              }}
            />
            {children}
          </div>
          {/* edges (thickness) — this strip IS the line at the edge-on match cut */}
          <div style={{ position: "absolute", left: radius, width: w - 2 * radius, top: (h - THICK) / 2, height: THICK, background: edge, transform: `rotateX(90deg) translateZ(${h / 2}px)` }} />
          <div style={{ position: "absolute", left: radius, width: w - 2 * radius, top: (h - THICK) / 2, height: THICK, background: edge, transform: `rotateX(-90deg) translateZ(${h / 2}px)` }} />
          <div style={{ position: "absolute", top: radius, height: h - 2 * radius, left: (w - THICK) / 2, width: THICK, background: edgeV, transform: `rotateY(90deg) translateZ(${w / 2}px)` }} />
          <div style={{ position: "absolute", top: radius, height: h - 2 * radius, left: (w - THICK) / 2, width: THICK, background: edgeV, transform: `rotateY(-90deg) translateZ(${w / 2}px)` }} />
        </div>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------------------------
// BACKDROP — graded glow per world (colour discipline: only the hero gradient's three hues)
// ---------------------------------------------------------------------------------------------
const Backdrop: React.FC<{ f: number }> = ({ f }) => {
  // blob A (warm) + blob B (cool): position + strength per world
  const ax = kf(f, [[0, 240], [84, 220], [160, 160], [252, 820], [328, 300], [400, 860], [488, 300], [600, 280]]);
  const ay = kf(f, [[0, 1500], [84, 1460], [160, 1500], [252, 760], [328, 1500], [400, 700], [488, 760], [600, 760]]);
  const aS = kf(f, [[0, 0], [12, 0.5], [84, 0.42], [160, 0.16], [252, 0.3], [328, 0.12], [400, 0.36], [488, 0.4], [600, 0.42]]);
  const bx = kf(f, [[0, 860], [84, 900], [160, 880], [252, 220], [328, 820], [400, 220], [488, 820], [600, 800]]);
  const by = kf(f, [[0, 800], [84, 760], [160, 700], [252, 1500], [328, 700], [400, 1500], [488, 1400], [600, 1420]]);
  const bS = kf(f, [[0, 0], [12, 0.4], [84, 0.3], [160, 0.42], [252, 0.36], [328, 0.22], [400, 0.3], [488, 0.4], [600, 0.42]]);
  const flash = interpolate(f, [5, 7, 16], [0, 0.1, 0], CLAMP) + interpolate(f, [498, 500, 512], [0, 0.12, 0], CLAMP);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{ position: "absolute", left: ax - 760, top: ay - 760, width: 1520, height: 1520, borderRadius: "50%", background: `radial-gradient(circle, rgba(207,32,106,${aS}) 0%, rgba(123,58,142,${aS * 0.45}) 38%, rgba(11,11,18,0) 70%)` }} />
      <div style={{ position: "absolute", left: bx - 800, top: by - 800, width: 1600, height: 1600, borderRadius: "50%", background: `radial-gradient(circle, rgba(43,68,160,${bS}) 0%, rgba(123,58,142,${bS * 0.35}) 40%, rgba(11,11,18,0) 70%)` }} />
      <AbsoluteFill style={{ background: "#F5F5F7", opacity: flash }} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// HUD — 5-segment world rail (pinned) + VO headline
// ---------------------------------------------------------------------------------------------
const WORLDS = [
  { label: "Spend", a: 88, b: 160 },
  { label: "Invest", a: 160, b: 252 },
  { label: "Crypto", a: 252, b: 328 },
  { label: "Analytics", a: 328, b: 400 },
  { label: "Rewards", a: 400, b: 488 },
];
const RAIL = { x: 90, y: 228, w: 870, gap: 12 };

const Rail: React.FC<{ f: number }> = ({ f }) => {
  const merge = prog(f, 534, 16, E.inOut);
  const gap = RAIL.gap * (1 - merge);
  const segW = (RAIL.w - gap * 4) / 5;
  const fadeOut = 1 - prog(f, 578, 14, E.in);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: W, height: 320, opacity: fadeOut }}>
      {WORLDS.map((wd, i) => {
        const appear = prog(f, 26 + i * 3, 14, E.expo);
        const fill = f >= wd.b ? 1 : f < wd.a ? 0 : prog(f, wd.a, wd.b - wd.a, E.inOut);
        const allFill = Math.max(fill, merge);
        const active = f >= wd.a && f < wd.b;
        const left = RAIL.x + i * (segW + gap);
        return (
          <React.Fragment key={wd.label}>
            <div style={{ position: "absolute", left, top: RAIL.y, width: segW, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.16)", transform: `scaleX(${appear})`, transformOrigin: "left center" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${allFill * 100}%`, borderRadius: 3, background: C.text }} />
            </div>
            <div
              style={{
                position: "absolute",
                left,
                top: RAIL.y + 20,
                fontFamily: F.i5,
                fontSize: 29,
                letterSpacing: 0.2,
                color: C.text,
                opacity: prog(f, 36 + i * 3, 10) * (active ? 1 : 0.38) * (1 - merge),
                transform: `translateY(${(1 - prog(f, 36 + i * 3, 12, E.expo)) * 10}px)`,
              }}
            >
              {wd.label}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

type Word = { t: string; at: number; em?: boolean };
type HeadSpec = { lines: Word[][]; out: number; sizes?: number[] };
const HEAD_TOP = 330;
const HEADS: HeadSpec[] = [
  { lines: [[{ t: "Everything", at: 25, em: true }], [{ t: "your", at: 44 }, { t: "money", at: 50 }, { t: "needs.", at: 63 }]], out: 77, sizes: [150, 88] },
  { lines: [[{ t: "Spend", at: 91, em: true }, { t: "it —", at: 99 }], [{ t: "anywhere", at: 121 }, { t: "in", at: 136 }, { t: "the", at: 140 }, { t: "world.", at: 145 }]], out: 154 },
  { lines: [[{ t: "Grow", at: 167, em: true }, { t: "it.", at: 178 }], [{ t: "Stocks,", at: 194 }, { t: "in", at: 216 }, { t: "seconds.", at: 222 }]], out: 245 },
  { lines: [[{ t: "Trade", at: 258, em: true }, { t: "crypto,", at: 270 }], [{ t: "in", at: 291 }, { t: "the", at: 296 }, { t: "same", at: 301 }, { t: "place.", at: 310 }]], out: 321 },
  { lines: [[{ t: "See", at: 334, em: true }, { t: "exactly", at: 344 }], [{ t: "where", at: 362 }, { t: "it", at: 371 }, { t: "goes.", at: 377 }]], out: 392 },
  { lines: [[{ t: "Get", at: 405 }, { t: "rewarded,", at: 416, em: true }], [{ t: "every", at: 444 }, { t: "time", at: 455 }, { t: "you", at: 463 }, { t: "spend.", at: 469 }]], out: 482 },
];

const Headline: React.FC<{ f: number; spec: HeadSpec }> = ({ f, spec }) => {
  const first = spec.lines[0][0].at;
  if (f < first - 3 || f > spec.out + 12) return null;
  let top = HEAD_TOP;
  return (
    <>
      {spec.lines.map((line, li) => {
        const size = spec.sizes?.[li] ?? 88;
        const lh = Math.round(size * 1.08);
        const exitT = prog(f, spec.out + li * 2, 7, E.in);
        const el = (
          <div
            key={li}
            style={{
              position: "absolute",
              left: 84,
              top,
              height: lh + 14,
              overflow: "hidden",
              paddingRight: 30,
              whiteSpace: "nowrap",
              transform: `translateY(${-exitT * 36}px)`,
              opacity: 1 - exitT,
            }}
          >
            {line.map((wd, wi) => {
              const p = prog(f, wd.at - 2, 13, E.expo);
              return (
                <span
                  key={wi}
                  style={{
                    display: "inline-block",
                    fontFamily: wd.em ? F.boldIt : F.light,
                    fontSize: size,
                    lineHeight: `${lh}px`,
                    color: C.text,
                    letterSpacing: wd.em ? -0.5 : -1,
                    marginRight: wi < line.length - 1 ? size * 0.27 : 0,
                    transform: `translateY(${(1 - p) * 105}%)`,
                    opacity: interpolate(p, [0, 0.25], [0, 1], CLAMP),
                  }}
                >
                  {wd.t}
                </span>
              );
            })}
          </div>
        );
        top += lh + 4;
        return el;
      })}
    </>
  );
};

// ---------------------------------------------------------------------------------------------
// SMALL PRIMITIVES
// ---------------------------------------------------------------------------------------------
const glass = (radius: number): React.CSSProperties => ({
  background: "rgba(30,30,42,0.62)",
  backdropFilter: "blur(22px) saturate(140%)",
  WebkitBackdropFilter: "blur(22px) saturate(140%)",
  border: `1px solid ${C.hair}`,
  borderRadius: radius,
  boxShadow: "0 18px 50px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
});

const Check: React.FC<{ size: number; color: string; draw?: number }> = ({ size, color, draw = 1 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M5 12.5 L10 17.5 L19.5 7" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
  </svg>
);

const Spark: React.FC<{ seed: string; w: number; h: number; color: string; draw?: number; up?: boolean }> = ({ seed, w, h, color, draw = 1, up = true }) => {
  const n = 14;
  const pts = Array.from({ length: n }, (_, i) => {
    const u = i / (n - 1);
    const trend = up ? 1 - u : u;
    const v = 0.15 + 0.6 * trend + 0.22 * (random(`${seed}-${i}`) - 0.5);
    return `${(u * w).toFixed(1)},${(Math.min(0.95, Math.max(0.05, v)) * h).toFixed(1)}`;
  });
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
    </svg>
  );
};

// simple line icons (24-unit grid), stroke white
const ICONS: Record<string, React.ReactNode> = {
  globe: (
    <>
      <circle cx={12} cy={12} r={8.5} />
      <ellipse cx={12} cy={12} rx={3.8} ry={8.5} />
      <path d="M3.5 12h17" />
    </>
  ),
  chart: <path d="M4 17 L9 11.5 L12.5 14 L20 6.5 M15 6.5 h5 v5" />,
  coin: (
    <>
      <circle cx={12} cy={12} r={8.5} />
      <path d="M10 7.5v9 M10 8h3.2a2 2 0 0 1 0 4H10 M10 12h3.8a2.2 2.2 0 0 1 0 4.4H10" />
    </>
  ),
  donut: (
    <>
      <circle cx={12} cy={12} r={7.5} />
      <path d="M12 4.5 A7.5 7.5 0 0 1 19.4 13.2" strokeWidth={3.6} />
    </>
  ),
  star: <path d="M12 3.8 L14.5 9.2 L20.3 9.8 L15.9 13.7 L17.2 19.4 L12 16.4 L6.8 19.4 L8.1 13.7 L3.7 9.8 L9.5 9.2 Z" />,
  plane: <path d="M21 15.5 L13.5 11 V5.2 a1.5 1.5 0 0 0 -3 0 V11 L3 15.5 V17.5 L10.5 15 V19 L8.5 20.5 V21.5 L12 20.6 L15.5 21.5 V20.5 L13.5 19 V15 L21 17.5 Z" />,
  bed: <path d="M3 18.5 V6.5 M3 14 H21 V18.5 M21 14 V11.5 a2.5 2.5 0 0 0 -2.5 -2.5 H11 V14 M7 11.2 a1.7 1.7 0 1 0 0.01 0" />,
  sim: <path d="M8 3.5 H15.5 L19 7 V20.5 H8 a1.5 1.5 0 0 1 -1.5 -1.5 V5 a1.5 1.5 0 0 1 1.5 -1.5 Z M9.5 11 H16 V17.5 H9.5 Z M12.75 11 V17.5 M9.5 14.25 H16" />,
  bag: <path d="M5 8.5 H19 L18 20.5 H6 Z M9 8.5 V7 a3 3 0 0 1 6 0 V8.5" />,
  cart: <path d="M3 4.5 H5.5 L7.8 15 H18 L20 8 H6.6 M9 19.2 a1.2 1.2 0 1 0 0.01 0 M16.5 19.2 a1.2 1.2 0 1 0 0.01 0" />,
  cup: <path d="M5 8 H16 V13 a5 5 0 0 1 -5 5 H10 a5 5 0 0 1 -5 -5 Z M16 9.5 H17.5 a2.5 2.5 0 0 1 0 5 H15.5 M8 3.5 v2 M11 3 v2.5" />,
};
const Icon: React.FC<{ name: string; size: number; color?: string; stroke?: number }> = ({ name, size, color = C.text, stroke = 1.7 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    {ICONS[name]}
  </svg>
);

// ---------------------------------------------------------------------------------------------
// HOOK — the five world tokens orbit on "everything", gather into the card on "needs"
// ---------------------------------------------------------------------------------------------
const TOKENS = ["globe", "chart", "coin", "donut", "star"];
const HookTokens: React.FC<{ f: number; layer: "back" | "front" }> = ({ f, layer }) => {
  if (f < 24 || f > 80) return null;
  return (
    <>
      {TOKENS.map((name, i) => {
        const appear = prog(f, 25 + i * 4, 12, E.over);
        const gather = prog(f, 58 + i * 2, 12, E.in);
        const th = -Math.PI / 2 + (i * Math.PI * 2) / 5 + f * 0.012;
        const z = Math.sin(th);
        if ((layer === "front") !== z > 0) return null;
        const ox = CX + Math.cos(th) * 360;
        const oy = 1120 + z * 300;
        const x = lerp(ox, CX, gather);
        const y = lerp(oy, 1120, gather);
        const sc = appear * (1 - gather) * (0.85 + 0.2 * z);
        const d = 136;
        return (
          <div key={name} style={{ position: "absolute", left: x - d / 2, top: y - d / 2, width: d, height: d, ...glass(d / 2), display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${sc})`, opacity: 0.6 + 0.4 * (z + 1) / 2 }}>
            <Icon name={name} size={60} stroke={1.9} />
          </div>
        );
      })}
    </>
  );
};

/** the light streak that deposits the card (frames 0–14), and the mirrored exit into the cut */
const Streak: React.FC<{ f: number }> = ({ f }) => {
  if (f > 16) return null;
  const p = prog(f, 0, 12, E.inOut);
  const cx = lerp(-150, W + 700, p);
  const len = 900;
  const op = interpolate(f, [0, 10, 15], [1, 1, 0], CLAMP);
  return (
    <div style={{ position: "absolute", left: cx - len / 2, top: 1120 - 3, width: len, height: 6, opacity: op }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 3, background: `linear-gradient(90deg, rgba(207,32,106,0), ${C.mag} 35%, #FFFFFF 62%, ${C.blue} 85%, rgba(43,68,160,0))` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: -40, height: 86, borderRadius: "50%", background: `radial-gradient(ellipse at 62% 50%, rgba(255,255,255,0.35), rgba(123,58,142,0.25) 35%, rgba(0,0,0,0) 70%)` }} />
    </div>
  );
};

// ---------------------------------------------------------------------------------------------
// WORLD 1 — SPEND: dotted globe turns to each city as the card taps; notifications stack
// ---------------------------------------------------------------------------------------------
const GLOBE = { cx: CX, cy: 1040, r: 380, tilt: (32 * Math.PI) / 180 };
const GLOBE_PTS = (() => {
  const n = 1100;
  const out: { lat: number; lon: number }[] = [];
  const ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const lon = (((i * ga) % (Math.PI * 2)) * 180) / Math.PI - 180;
    out.push({ lat: (Math.asin(y) * 180) / Math.PI, lon });
  }
  return out;
})();
const project = (lat: number, lon: number, lon0: number) => {
  const p = (lat * Math.PI) / 180;
  const l = ((lon - lon0) * Math.PI) / 180;
  const x0 = Math.cos(p) * Math.sin(l);
  const y0 = Math.sin(p);
  const z0 = Math.cos(p) * Math.cos(l);
  const y = y0 * Math.cos(GLOBE.tilt) - z0 * Math.sin(GLOBE.tilt);
  const z = y0 * Math.sin(GLOBE.tilt) + z0 * Math.cos(GLOBE.tilt);
  return { x: GLOBE.cx + GLOBE.r * x0, y: GLOBE.cy - GLOBE.r * y, z };
};

const SPENDS = [
  { at: 92, sym: "€", tint: C.mag, title: "Café", sub: "Lisbon", amt: "−3,20 €", lat: 38.72, lon: -9.14 },
  { at: 122, sym: "¥", tint: C.vio, title: "Ramen bar", sub: "Tokyo", amt: "−¥1,450", lat: 35.68, lon: 139.69 },
  { at: 135, sym: "$", tint: C.blue, title: "Taxi", sub: "New York", amt: "−$18.40", lat: 40.71, lon: -74.0 },
  { at: 146, sym: "£", tint: "#9B3C7E", title: "Bookshop", sub: "London", amt: "−£12.99", lat: 51.5, lon: -0.12 },
];

const coastPath = (lon0: number) => {
  let d = "";
  for (const ring of RV_COAST) {
    let pen = false;
    for (let k = 0; k < ring.length; k += 2) {
      const pr = project(ring[k + 1], ring[k], lon0);
      if (pr.z > 0.02) {
        d += `${pen ? "L" : "M"}${pr.x.toFixed(1)},${pr.y.toFixed(1)}`;
        pen = true;
      } else pen = false;
    }
  }
  return d;
};

const Globe: React.FC<{ f: number }> = ({ f }) => {
  if (f < 82 || f > 166) return null;
  const lon0 = kf(f, [[82, -70], [92, -9.1, E.expo], [114, 6], [123, 139.7, E.inOut], [130, 146], [136, 286, E.inOut], [141, 290], [147, 359.9, E.inOut], [166, 372]]);
  const appear = prog(f, 84, 16, E.expo);
  const exit = prog(f, 152, 12, E.in);
  const sc = (0.82 + 0.18 * appear) * (1 + exit * 0.25);
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, opacity: appear * (1 - exit), transform: `scale(${sc})`, transformOrigin: `${GLOBE.cx}px ${GLOBE.cy}px` }}>
      <defs>
        <radialGradient id="rvGlobeShade" cx="45%" cy="38%" r="65%">
          <stop offset="0%" stopColor="rgba(123,58,142,0.20)" />
          <stop offset="100%" stopColor="rgba(11,11,18,0)" />
        </radialGradient>
      </defs>
      <circle cx={GLOBE.cx} cy={GLOBE.cy} r={GLOBE.r} fill="url(#rvGlobeShade)" stroke="rgba(255,255,255,0.07)" strokeWidth={1.5} />
      {/* faint ocean grid so the sphere still reads as a ball */}
      {GLOBE_PTS.map((pt, i) => {
        if (i % 3) return null;
        const pr = project(pt.lat, pt.lon, lon0);
        if (pr.z <= 0.05) return null;
        return <circle key={`o${i}`} cx={pr.x} cy={pr.y} r={1.1} fill="#F5F5F7" opacity={0.03 + pr.z * 0.07} />;
      })}
      {/* land: Natural Earth 1:110m mask, dotted */}
      {Array.from({ length: RV_LAND_DOTS.length / 2 }, (_, i) => {
        const pr = project(RV_LAND_DOTS[2 * i + 1], RV_LAND_DOTS[2 * i], lon0);
        if (pr.z <= 0.03) return null;
        return <circle key={`l${i}`} cx={pr.x} cy={pr.y} r={1.9 + pr.z * 1.3} fill="#F5F5F7" opacity={0.12 + pr.z * 0.55} />;
      })}
      {/* real coastlines, front hemisphere only */}
      <path d={coastPath(lon0)} fill="none" stroke="rgba(245,245,247,0.38)" strokeWidth={1.4} strokeLinejoin="round" />
      {SPENDS.map((s, i) => {
        const pr = project(s.lat, s.lon, lon0);
        if (pr.z <= 0) return null;
        const on = prog(f, s.at - 1, 8, E.over);
        const ring = prog(f, s.at, 22, E.out);
        return (
          <g key={i} opacity={on * Math.min(1, pr.z * 3)}>
            <circle cx={pr.x} cy={pr.y} r={8 + ring * 46} fill="none" stroke={s.tint} strokeWidth={3} opacity={1 - ring} />
            <circle cx={pr.x} cy={pr.y} r={9 * on} fill={C.text} />
            <circle cx={pr.x} cy={pr.y} r={5 * on} fill={s.tint} />
          </g>
        );
      })}
    </svg>
  );
};

const TapRings: React.FC<{ f: number; cy: number; taps: number[] }> = ({ f, cy, taps }) => (
  <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
    {taps.map((t) =>
      [0, 5].map((d) => {
        const p = prog(f, t + d, 24, E.out);
        if (p <= 0 || p >= 1) return null;
        return <ellipse key={`${t}-${d}`} cx={CX} cy={cy} rx={300 + p * 300} ry={190 + p * 190} fill="none" stroke="rgba(245,245,247,0.55)" strokeWidth={2.5 * (1 - p) + 0.5} opacity={1 - p} />;
      }),
    )}
  </svg>
);

const NOTIF = { top: 620, w: 840, h: 118 };
const Notifications: React.FC<{ f: number }> = ({ f }) => {
  if (f < 88 || f > 166) return null;
  const exit = prog(f, 154, 10, E.in);
  return (
    <>
      {SPENDS.map((s, i) => {
        const p = prog(f, s.at, 14, E.expo);
        if (p <= 0) return null;
        // how many newer notifications sit above this one
        const depth = SPENDS.reduce((acc, o, j) => acc + (j > i ? prog(f, o.at, 12, E.expo) : 0), 0);
        const y = NOTIF.top + (1 - p) * -60 + depth * 26 - exit * (90 + i * 20);
        const sc = (0.92 + 0.08 * p) * (1 - depth * 0.055);
        const op = interpolate(p, [0, 0.4], [0, 1], CLAMP) * Math.max(0, 1 - depth * 0.42) * (1 - exit);
        if (op <= 0.01) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 510 - NOTIF.w / 2,
              top: y,
              width: NOTIF.w,
              height: NOTIF.h,
              ...glass(34),
              transform: `scale(${sc})`,
              transformOrigin: "50% 0%",
              opacity: op,
              zIndex: 10 + i,
              display: "flex",
              alignItems: "center",
              padding: "0 30px",
              boxSizing: "border-box",
              gap: 24,
            }}
          >
            <div style={{ width: 70, height: 70, borderRadius: 35, background: s.tint, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.i6, fontSize: 32, color: C.text, flexShrink: 0 }}>{s.sym}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: F.i6, fontSize: 31, color: C.text, lineHeight: "38px" }}>{s.title}</div>
              <div style={{ fontFamily: F.i4, fontSize: 24, color: C.muted, lineHeight: "32px" }}>{s.sub} · Just now</div>
            </div>
            <div style={{ fontFamily: F.i6, fontSize: 31, color: C.text }}>{s.amt}</div>
          </div>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------------------------------------
// WORLD 2 — INVEST: the card's edge becomes the chart line (shape match), tickers, Buy → filled
// ---------------------------------------------------------------------------------------------
const CH = { x0: 110, x1: 940, flatX0: CX - CARD_W / 2, flatX1: CX + CARD_W / 2, flatY: 1180, n: 56 };
const chartY = (u: number) => {
  const base = lerp(1330, 790, Math.pow(u, 1.25));
  const wig = (24 * Math.sin(u * 17.0 + 0.4) + 15 * Math.sin(u * 37.0 + 1.3) + 8 * Math.sin(u * 71.0)) * (1 - u);
  return base + wig;
};
const chartPoints = (f: number) => {
  const pts: { x: number; y: number }[] = [];
  const flatten = prog(f, 278, 12, E.inOut);
  for (let i = 0; i < CH.n; i++) {
    const u = i / (CH.n - 1);
    const t = prog(f, 167 + u * 12, 22, E.expo) * (1 - flatten);
    pts.push({ x: lerp(lerp(CH.flatX0, CH.flatX1, u), lerp(CH.x0, CH.x1, u), t), y: lerp(CH.flatY, chartY(u), t) });
  }
  return pts;
};
const Chart: React.FC<{ f: number }> = ({ f }) => {
  if (f < 166 || f > 290) return null;
  const pts = chartPoints(f);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${d} L${pts[pts.length - 1].x.toFixed(1)},1420 L${pts[0].x.toFixed(1)},1420 Z`;
  const areaOp = prog(f, 176, 18) * (1 - prog(f, 266, 12, E.in));
  const grid = prog(f, 172, 16) * (1 - prog(f, 262, 10, E.in));
  const head = pts[pts.length - 1];
  const headOn = prog(f, 186, 8, E.over) * (1 - prog(f, 250, 6, E.in));
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <defs>
        <linearGradient id="rvLine" x1={CH.x0} x2={CH.x1} y1="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={C.mag} />
          <stop offset="0.5" stopColor={C.vio} />
          <stop offset="1" stopColor="#4C66D8" />
        </linearGradient>
        <linearGradient id="rvArea" x1="0" x2="0" y1="780" y2="1420" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="rgba(123,58,142,0.38)" />
          <stop offset="1" stopColor="rgba(43,68,160,0)" />
        </linearGradient>
      </defs>
      {[860, 1020, 1180, 1340].map((gy, i) => (
        <line key={gy} x1={CH.x0} x2={lerp(CH.x0, CH.x1, prog(f, 172 + i * 3, 18, E.expo))} y1={gy} y2={gy} stroke="rgba(255,255,255,0.07)" strokeWidth={1.5} strokeDasharray="2 10" opacity={grid} />
      ))}
      <path d={area} fill="url(#rvArea)" opacity={areaOp} />
      <path d={d} fill="none" stroke="url(#rvLine)" strokeWidth={THICK + 1} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={head.x} cy={head.y} r={34 * headOn} fill="rgba(76,102,216,0.25)" />
      <circle cx={head.x} cy={head.y} r={11 * headOn} fill={C.text} />
    </svg>
  );
};

const TICKERS = [
  { t: "AAPL", x: 90, y: 590, at: 194 },
  { t: "MSFT", x: 560, y: 600, at: 197 },
  { t: "NVDA", x: 300, y: 690, at: 200 },
  { t: "TSLA", x: 700, y: 700, at: 203 },
];
const Tickers: React.FC<{ f: number }> = ({ f }) => {
  if (f < 190 || f > 264) return null;
  return (
    <>
      {TICKERS.map((k, i) => {
        const p = prog(f, k.at, 14, E.expo);
        const x = prog(f, 248 + i * 2, 9, E.in);
        const drift = Math.sin((f + i * 20) / 22) * 4;
        return (
          <div
            key={k.t}
            style={{
              position: "absolute",
              left: k.x,
              top: k.y + (1 - p) * 30 + drift - x * 40,
              width: 250,
              height: 78,
              ...glass(39),
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 24px",
              boxSizing: "border-box",
              opacity: interpolate(p, [0, 0.4], [0, 1], CLAMP) * (1 - x),
              transform: `scale(${0.9 + 0.1 * p})`,
            }}
          >
            <span style={{ fontFamily: F.i6, fontSize: 28, color: C.text, letterSpacing: 0.5 }}>{k.t}</span>
            <Spark seed={k.t} w={86} h={30} color={C.green} draw={prog(f, k.at + 3, 16, E.out)} />
          </div>
        );
      })}
    </>
  );
};

const BUY = { cx: CX, cy: 1490, w: 500, h: 104 };
const BuyButton: React.FC<{ f: number }> = ({ f }) => {
  if (f < 202 || f > 264) return null;
  const inP = prog(f, 204, 14, E.expo);
  const press = bump(f, 219, 7);
  const done = prog(f, 232, 8, E.inOut);
  const out = prog(f, 250, 10, E.in);
  const bg = `rgba(${Math.round(lerp(245, 62, done))},${Math.round(lerp(245, 207, done))},${Math.round(lerp(247, 142, done))},${lerp(1, 0.16, done)})`;
  return (
    <div
      style={{
        position: "absolute",
        left: BUY.cx - BUY.w / 2,
        top: BUY.cy - BUY.h / 2 + (1 - inP) * 70 + out * 60,
        width: BUY.w,
        height: BUY.h,
        borderRadius: BUY.h / 2,
        background: bg,
        border: `1.5px solid rgba(62,207,142,${done * 0.7})`,
        transform: `scale(${(0.94 + 0.06 * inP) * (1 - press * 0.06)})`,
        opacity: interpolate(inP, [0, 0.3], [0, 1], CLAMP) * (1 - out),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span style={{ position: "absolute", fontFamily: F.i6, fontSize: 36, color: "#0B0B12", opacity: 1 - prog(f, 230, 5) }}>Buy</span>
      <span style={{ position: "absolute", display: "flex", alignItems: "center", gap: 12, fontFamily: F.i6, fontSize: 34, color: C.green, opacity: prog(f, 233, 6), transform: `translateY(${(1 - prog(f, 233, 10, E.expo)) * 16}px)` }}>
        <Check size={40} color={C.green} draw={prog(f, 234, 9, E.out)} />
        Order filled
      </span>
    </div>
  );
};

// ---------------------------------------------------------------------------------------------
// WORLD 3 — CRYPTO: chart head dot → BTC coin, ETH splits off, card re-forms, coins orbit
// ---------------------------------------------------------------------------------------------
const ORBIT = { cx: CX, cy: 1150, rx: 395, ry: 150 };
const coinState = (f: number, which: "btc" | "eth") => {
  const head = { x: CH.x1, y: chartY(1) };
  const isBtc = which === "btc";
  const born = isBtc ? 248 : 268;
  const grow = prog(f, born, 12, E.over);
  // free flight before the card exists
  const hx = isBtc ? kf(f, [[248, head.x], [272, 800, E.inOut]]) : kf(f, [[268, 800], [288, 300, E.inOut]]);
  const hy = isBtc ? kf(f, [[248, head.y], [272, 870, E.inOut]]) : kf(f, [[268, 870], [288, 900, E.inOut]]);
  // orbit after the card re-forms "in the same place"
  const th = (isBtc ? -0.55 : Math.PI + 0.35) + Math.max(0, f - 290) * 0.05;
  const ox = ORBIT.cx + Math.cos(th) * ORBIT.rx;
  const oy = ORBIT.cy + Math.sin(th) * ORBIT.ry - Math.cos(th) * 40;
  const z = Math.sin(th);
  const blend = prog(f, 292, 20, E.inOut);
  // absorbed into the card before it flips
  const absorb = prog(f, isBtc ? 318 : 321, 10, E.in);
  const x = lerp(lerp(hx, ox, blend), CX, absorb);
  const y = lerp(lerp(hy, oy, blend), 1150, absorb);
  const depth = lerp(0, z, blend);
  const spin = (f - born) * (isBtc ? 0.16 : -0.14) + (isBtc ? 0 : 1.2);
  return { x, y, z: depth, s: grow * (1 + 0.18 * depth) * (1 - absorb * 0.85), spin, on: f >= born && absorb < 1 };
};

const Coin: React.FC<{ f: number; which: "btc" | "eth" }> = ({ f, which }) => {
  const st = coinState(f, which);
  if (!st.on || st.s <= 0.01) return null;
  const d = 156;
  const c = Math.cos(st.spin);
  const sx = Math.max(0.08, Math.abs(c));
  const rimDx = Math.sin(st.spin) * 9;
  const face = which === "btc" ? "radial-gradient(circle at 35% 30%, #F4B15A, #D9822B 60%, #A85E1C)" : "radial-gradient(circle at 35% 30%, #E6E7FA, #A9ACE6 60%, #6F73C6)";
  const rim = which === "btc" ? "#8E4E17" : "#555AA8";
  return (
    <div style={{ position: "absolute", left: st.x - d / 2, top: st.y - d / 2, width: d, height: d, transform: `scale(${st.s})` }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: rim, transform: `translateX(${rimDx}px) scaleX(${sx})` }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: face, transform: `scaleX(${sx})`, boxShadow: "inset 0 0 0 5px rgba(255,255,255,0.18), 0 20px 40px rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {which === "btc" ? (
            <span style={{ fontFamily: F.boldIt, fontSize: 92, color: "#FFF6EA", lineHeight: 1, marginTop: 4, transform: c < 0 ? "scaleX(-1)" : undefined }}>₿</span>
          ) : (
            <svg width={64} height={100} viewBox="0 0 64 100" style={{ transform: c < 0 ? "scaleX(-1)" : undefined }}>
              <path d="M32 2 L60 50 L32 66 L4 50 Z" fill="#2E2F5E" />
              <path d="M32 2 L32 66 L4 50 Z" fill="#45478A" />
              <path d="M32 72 L60 55 L32 98 L4 55 Z" fill="#2E2F5E" />
              <path d="M32 72 L32 98 L4 55 Z" fill="#45478A" />
            </svg>
          )}
      </div>
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#0B0B12", transform: `scaleX(${sx})`, opacity: Math.max(0, -st.z) * 0.35 }} />
    </div>
  );
};

const CryptoTiles: React.FC<{ f: number }> = ({ f }) => {
  if (f < 296 || f > 334) return null;
  const tiles = [
    { name: "Bitcoin", t: "BTC", at: 299, x: 70, seed: "btc" },
    { name: "Ethereum", t: "ETH", at: 304, x: 530, seed: "eth" },
  ];
  return (
    <>
      {tiles.map((k, i) => {
        const p = prog(f, k.at, 14, E.expo);
        const out = prog(f, 318 + i * 2, 9, E.in);
        return (
          <div key={k.t} style={{ position: "absolute", left: k.x, top: 1400 + (1 - p) * 50 + out * 50, width: 420, height: 150, ...glass(32), padding: "24px 28px", boxSizing: "border-box", opacity: interpolate(p, [0, 0.35], [0, 1], CLAMP) * (1 - out) }}>
            <div style={{ fontFamily: F.i6, fontSize: 30, color: C.text }}>{k.name}</div>
            <div style={{ fontFamily: F.i5, fontSize: 24, color: C.muted, marginTop: 4 }}>{k.t}</div>
            <div style={{ position: "absolute", right: 28, top: 44 }}>
              <Spark seed={k.seed} w={150} h={62} color={C.green} draw={prog(f, k.at + 4, 18)} />
            </div>
          </div>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------------------------------------
// WORLD 4 — ANALYTICS: rendered on the card's back face as it grows into a screen
// ---------------------------------------------------------------------------------------------
const BARS = [0.42, 0.64, 0.36, 0.86, 0.55, 1.0, 0.3];
const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const CATS = [
  { name: "Groceries", amt: "412,30 €", share: 0.32, icon: "cart", tint: C.mag, at: 362 },
  { name: "Travel", amt: "356,00 €", share: 0.28, icon: "plane", tint: C.vio, at: 368 },
  { name: "Eating out", amt: "248,90 €", share: 0.19, icon: "cup", tint: C.blue, at: 374 },
];
const fmtEUR = (v: number) => {
  const [i, d] = v.toFixed(2).split(".");
  return `${i.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${d} €`;
};
const AnalyticsPanel: React.FC<{ f: number }> = ({ f }) => {
  const on = prog(f, 340, 10) * (1 - prog(f, 399, 5, E.in));
  if (on <= 0) return null;
  const total = 1284.6 * prog(f, 340, 30, E.expo);
  const pad = 56;
  const chartTop = 300;
  const chartH = 250;
  const hi = prog(f, 362, 10);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: PANEL_W, height: 960, opacity: on }}>
      <div style={{ position: "absolute", left: pad, top: 52, fontFamily: F.i5, fontSize: 28, color: C.muted }}>Spent this month</div>
      <div style={{ position: "absolute", left: pad - 4, top: 94, fontFamily: F.light, fontSize: 118, color: C.text, letterSpacing: -2, lineHeight: "130px" }}>{fmtEUR(total)}</div>
      {BARS.map((b, i) => {
        const g = prog(f, 346 + i * 3, 16, E.over);
        const bw = 72;
        const gap = (PANEL_W - 2 * pad - 7 * bw) / 6;
        const x = pad + i * (bw + gap);
        const bh = chartH * b * g;
        const isHi = i === 5;
        return (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: x, top: chartTop + chartH - bh, width: bw, height: bh, borderRadius: 14, background: isHi ? `linear-gradient(180deg, ${C.mag}, ${C.blue})` : "rgba(255,255,255,0.12)", opacity: isHi ? 0.35 + 0.65 * hi : 1 - 0.4 * hi }} />
            <div style={{ position: "absolute", left: x, width: bw, top: chartTop + chartH + 16, textAlign: "center", fontFamily: F.i5, fontSize: 22, color: C.muted }}>{DAYS[i]}</div>
          </React.Fragment>
        );
      })}
      <div style={{ position: "absolute", left: pad, right: pad, top: 628, height: 1, background: C.hair }} />
      {CATS.map((c, i) => {
        const p = prog(f, c.at, 14, E.expo);
        const top = 664 + i * 92;
        return (
          <div key={c.name} style={{ position: "absolute", left: pad, right: pad, top: top + (1 - p) * 26, height: 80, opacity: interpolate(p, [0, 0.35], [0, 1], CLAMP) }}>
            <div style={{ position: "absolute", left: 0, top: 6, width: 64, height: 64, borderRadius: 32, background: c.tint, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={c.icon} size={34} />
            </div>
            <div style={{ position: "absolute", left: 88, top: 4, fontFamily: F.i6, fontSize: 30, color: C.text }}>{c.name}</div>
            <div style={{ position: "absolute", right: 0, top: 4, fontFamily: F.i6, fontSize: 30, color: C.text }}>{c.amt}</div>
            <div style={{ position: "absolute", left: 88, right: 0, top: 54, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.08)" }}>
              <div style={{ width: `${c.share * 100 * 2.2 * prog(f, c.at + 3, 18, E.out)}%`, height: "100%", borderRadius: 4, background: c.tint }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------------------------
// WORLD 5 — REWARDS: points counter, +pts chips on each tap, perk tiles
// ---------------------------------------------------------------------------------------------
const POINT_TAPS = [446, 458, 470];
const pointsAt = (f: number) => {
  let v = 2360 + 120 * prog(f, 417, 10, E.out);
  for (const t of POINT_TAPS) v += 24 * prog(f, t + 6, 6, E.out);
  return Math.round(v);
};
const Rewards: React.FC<{ f: number }> = ({ f }) => {
  if (f < 404 || f > 500) return null;
  const gatherT = (i: number) => prog(f, 484 + i * 1.5, 10, E.in);
  const pIn = prog(f, 410, 14, E.expo);
  const g0 = gatherT(0);
  const pillY = lerp(690, 1110, g0);
  const tiles = [
    { icon: "plane", label: "Miles" },
    { icon: "bed", label: "Stays" },
    { icon: "sim", label: "eSIM" },
    { icon: "bag", label: "Shops" },
  ];
  return (
    <>
      {/* counter pill */}
      <div style={{ position: "absolute", left: CX - 270, top: pillY - 66 + (1 - pIn) * -40, width: 540, height: 132, ...glass(66), display: "flex", alignItems: "center", padding: "0 34px", boxSizing: "border-box", gap: 26, opacity: interpolate(pIn, [0, 0.3], [0, 1], CLAMP) * (1 - g0), transform: `scale(${(0.9 + 0.1 * pIn) * (1 - g0 * 0.7)})` }}>
        <div style={{ width: 72, height: 72, borderRadius: 36, background: HERO_GRAD, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${1 + 0.12 * (bump(f, 416, 10) + POINT_TAPS.reduce((a, t) => a + bump(f, t + 5, 8), 0))})` }}>
          <Icon name="star" size={38} stroke={2} />
        </div>
        <div>
          <div style={{ fontFamily: F.i5, fontSize: 27, color: C.muted, lineHeight: "32px" }}>RevPoints</div>
          <div style={{ fontFamily: F.light, fontSize: 58, color: C.text, lineHeight: "64px", letterSpacing: -1 }}>{pointsAt(f).toLocaleString("de-DE")}</div>
        </div>
      </div>
      {/* +pts chips rising from the card */}
      {[{ t: 416, v: "+120" }, ...POINT_TAPS.map((t) => ({ t: t + 1, v: "+24" }))].map(({ t, v }) => {
        const p = prog(f, t, 20, E.out);
        if (p <= 0 || p >= 1) return null;
        return (
          <div key={t} style={{ position: "absolute", left: CX - 80, top: lerp(930, 770, p), width: 160, textAlign: "center", fontFamily: F.i6, fontSize: 34, color: C.text, opacity: interpolate(p, [0, 0.15, 0.7, 1], [0, 1, 1, 0]) }}>
            {v} <span style={{ fontFamily: F.i5, fontSize: 24, color: C.muted }}>pts</span>
          </div>
        );
      })}
      {/* perk tiles */}
      {tiles.map((t, i) => {
        const p = prog(f, 420 + i * 3, 14, E.expo);
        const g = gatherT(i + 1);
        const x0 = 140 + i * 210;
        const x = lerp(x0, CX - 85, g);
        const y = lerp(1352 + Math.sin((f + i * 17) / 18) * 4, 1110 - 85, g);
        return (
          <div key={t.label} style={{ position: "absolute", left: x, top: y + (1 - p) * 50, width: 170, opacity: interpolate(p, [0, 0.35], [0, 1], CLAMP) * (1 - g), transform: `scale(${(0.9 + 0.1 * p) * (1 - g * 0.8)})` }}>
            <div style={{ width: 170, height: 170, ...glass(44), display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={t.icon} size={64} />
            </div>
            <div style={{ marginTop: 14, textAlign: "center", fontFamily: F.i5, fontSize: 26, color: C.text }}>{t.label}</div>
          </div>
        );
      })}
    </>
  );
};

const Sparkles: React.FC<{ f: number; at: number; cy: number }> = ({ f, at, cy }) => {
  const p = prog(f, at, 26, E.out);
  if (p <= 0 || p >= 1) return null;
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2 + random(`sp-a-${at}-${i}`) * 0.4;
        const dist = 200 + random(`sp-d-${at}-${i}`) * 260;
        const x = CX + Math.cos(a) * dist * p;
        const y = cy + Math.sin(a) * dist * 0.62 * p;
        const s = (8 + random(`sp-s-${at}-${i}`) * 12) * Math.sin(Math.PI * Math.min(1, p * 1.15));
        const col = i % 3 === 0 ? "#F2A5C6" : "#F5F5F7";
        return <path key={i} d={`M${x},${y - s} Q${x},${y} ${x + s},${y} Q${x},${y} ${x},${y + s} Q${x},${y} ${x - s},${y} Q${x},${y} ${x},${y - s} Z`} fill={col} opacity={1 - p * 0.6} />;
      })}
    </svg>
  );
};

// ---------------------------------------------------------------------------------------------
// LOCKUP — wordmark snaps in where the gather lands; the card family fans out behind the hero
// ---------------------------------------------------------------------------------------------
const WM = { cx: CX, cy: 740, w: 720 };
const Wordmark: React.FC<{ f: number }> = ({ f }) => {
  if (f < 498) return null;
  const h = (WM.w * RV_WORDMARK_VIEWBOX.h) / RV_WORDMARK_VIEWBOX.w;
  // letter groups: R (stem + bowl) e v o l u t
  const group = [0, 0, 1, 2, 3, 4, 5, 6];
  const sweep = lerp(-1400, 5200, prog(f, 508, 26, E.inOut));
  const pad = 20 * (RV_WORDMARK_VIEWBOX.w / WM.w);
  return (
    <svg width={WM.w} height={h + 40} viewBox={`0 ${-pad} ${RV_WORDMARK_VIEWBOX.w} ${RV_WORDMARK_VIEWBOX.h + 2 * pad}`} style={{ position: "absolute", left: WM.cx - WM.w / 2, top: WM.cy - h / 2 - 20, overflow: "hidden" }}>
      <defs>
        <linearGradient id="rvSweep" x1={sweep - 900} x2={sweep + 900} y1="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={C.mag} stopOpacity={0} />
          <stop offset="0.4" stopColor={C.mag} stopOpacity={0.9} />
          <stop offset="0.6" stopColor={C.blue} stopOpacity={0.9} />
          <stop offset="1" stopColor={C.blue} stopOpacity={0} />
        </linearGradient>
      </defs>
      {RV_WORDMARK_PATHS.map((d, i) => {
        const p = prog(f, 500 + group[i] * 2, 16, E.expo);
        return (
          <g key={i} transform={`translate(0 ${(1 - p) * (RV_WORDMARK_VIEWBOX.h + 2 * pad)})`}>
            <path d={d} fill={C.text} />
            <path d={d} fill="url(#rvSweep)" />
          </g>
        );
      })}
    </svg>
  );
};

const FAN = [
  // symmetric: card1 straight up behind the hero, card2 / card4 mirrored at ±12°
  { src: "revolut/card1.png", dx: 0, dy: -92, rz: 0, at: 503 },
  { src: "revolut/card2.png", dx: -128, dy: -40, rz: -12, at: 506 },
  { src: "revolut/card4.png", dx: 128, dy: -40, rz: 12, at: 506 },
];
const CardFan: React.FC<{ f: number }> = ({ f }) => {
  if (f < 500) return null;
  const base = cardState(f);
  return (
    <>
      {FAN.map((c, i) => {
        const p = prog(f, c.at, 18, E.over);
        const breathe = Math.sin((f - 500) / 40) * 3; // same phase for all: the fan breathes as one
        return (
          <div
            key={c.src}
            style={{
              position: "absolute",
              left: base.x - (CARD_W * 0.84) / 2 + c.dx * p,
              top: base.y - (CARD_H * 0.84) / 2 + c.dy * p + breathe,
              width: CARD_W * 0.84,
              height: CARD_H * 0.84,
              transform: `rotate(${c.rz * p}deg)`,
              transformOrigin: "50% 100%",
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
              opacity: interpolate(p, [0, 0.2], [0, 1], CLAMP),
            }}
          >
            <Img src={staticFile(c.src)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            <div style={{ position: "absolute", inset: 0, background: "#0B0B12", opacity: i === 0 ? 0.42 : 0.3 }} />
          </div>
        );
      })}
    </>
  );
};

const Tagline: React.FC<{ f: number }> = ({ f }) => {
  const words = [
    { t: "One", at: 534 },
    { t: "app", at: 543 },
    { t: "for", at: 551 },
    { t: "your", at: 557 },
    { t: "money.", at: 563 },
  ];
  if (f < 530) return null;
  return (
    <div style={{ position: "absolute", left: 0, width: W, top: 868, textAlign: "center", height: 84, overflow: "hidden", whiteSpace: "nowrap" }}>
      {words.map((w, i) => {
        const p = prog(f, w.at - 2, 14, E.expo);
        return (
          <span key={i} style={{ display: "inline-block", fontFamily: F.light, fontSize: 62, lineHeight: "76px", color: C.text, marginRight: i < words.length - 1 ? 17 : 0, transform: `translateY(${(1 - p) * 105}%)`, opacity: interpolate(p, [0, 0.25], [0, 1], CLAMP) }}>
            {w.t}
          </span>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------------------------
// CAMERA (world layer only — the HUD is pinned)
// ---------------------------------------------------------------------------------------------
const camera = (f: number) => {
  const s = kf(f, [
    [0, 1.0], [84, 1.035], [98, 1.0], [156, 1.03], [168, 1.0], [250, 1.035], [262, 1.0],
    [326, 1.03], [346, 1.0], [396, 1.025], [414, 1.0], [484, 1.03], [500, 1.0], [600, 1.045],
  ]);
  const t = f * 0.012;
  return {
    s,
    x: noise2D("rv-cx", t, 0) * 3,
    y: noise2D("rv-cy", 0, t) * 3,
    r: noise2D("rv-cr", t, 7) * 0.12,
  };
};

// ---------------------------------------------------------------------------------------------
// SCENE
// ---------------------------------------------------------------------------------------------
const Scene: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camera(f);
  const cs = cardState(f);
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      <Backdrop f={f} />
      <AbsoluteFill style={{ transform: `translate(${cam.x}px, ${cam.y}px) rotate(${cam.r}deg) scale(${cam.s})`, transformOrigin: "50% 58%" }}>
        <Globe f={f} />
        <HookTokens f={f} layer="back" />
        <TapRings f={f} cy={1340} taps={[91, 121, 135, 146]} />
        <TapRings f={f} cy={1110} taps={POINT_TAPS} />
        <Chart f={f} />
        {coinState(f, "btc").z <= 0 ? <Coin f={f} which="btc" /> : null}
        {coinState(f, "eth").z <= 0 ? <Coin f={f} which="eth" /> : null}
        <CardFan f={f} />
        <Card3D f={f}>
          <AnalyticsPanel f={f} />
        </Card3D>
        {coinState(f, "btc").z > 0 ? <Coin f={f} which="btc" /> : null}
        {coinState(f, "eth").z > 0 ? <Coin f={f} which="eth" /> : null}
        <HookTokens f={f} layer="front" />
        <Streak f={f} />
        <Notifications f={f} />
        <Tickers f={f} />
        <BuyButton f={f} />
        <CryptoTiles f={f} />
        <Rewards f={f} />
        <Sparkles f={f} at={416} cy={1110} />
        <Wordmark f={f} />
        <Tagline f={f} />
        {/* absorb flash on the card (coins in / lockup snap) */}
        <div style={{ position: "absolute", left: cs.x - 330, top: cs.y - 210, width: 660, height: 420, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(255,255,255,0.55), rgba(255,255,255,0) 65%)", opacity: interpolate(f, [326, 329, 338], [0, 0.8, 0], CLAMP) + interpolate(f, [497, 499, 510], [0, 0.9, 0], CLAMP) }} />
      </AbsoluteFill>
      {/* pinned HUD */}
      <Rail f={f} />
      {HEADS.map((h, i) => (
        <Headline key={i} f={f} spec={h} />
      ))}
      <AbsoluteFill style={{ pointerEvents: "none", background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 120%)" }} />
    </AbsoluteFill>
  );
};

const GrainLayer: React.FC = () => {
  const f = useCurrentFrame();
  const seed = Math.floor(random(`rv-grain-${f}`) * 100000);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: 0.07, mixBlendMode: "overlay" }}>
      <svg width="100%" height="100%">
        <filter id={`rvn-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#rvn-${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

const Main: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      {inMB(f) ? (
        <CameraMotionBlur shutterAngle={200} samples={8}>
          <Scene />
        </CameraMotionBlur>
      ) : (
        <Scene />
      )}
      <GrainLayer />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// SOUND — spotted to picture. SFX transients lead the visual contact by ~1 frame.
// v3: Luca-selected sounds in public/revolut/sfx3/ (v1 sfx/ and v2 sfx2/ untouched).
// ---------------------------------------------------------------------------------------------
type Cue = { at: number; sfx: string; vol: number; dur?: number };
let tickN = 0;
const tick = () => (tickN++ % 2 === 0 ? "rv-tick" : "rv-tick-2");
const CUES: Cue[] = [
  { at: 0, sfx: "rv-streak", vol: 0.9 },
  { at: 6, sfx: "rv-swish", vol: 0.7 },
  ...[0, 1, 2, 3, 4].map((i) => ({ at: 25 + i * 4, sfx: tick(), vol: 0.55 })),
  { at: 57, sfx: "rv-absorb", vol: 0.8 },
  { at: 70, sfx: "rv-tap", vol: 0.45 },
  { at: 86, sfx: "rv-swish", vol: 0.55 },
  ...[91, 121, 135, 146].flatMap((t) => [
    { at: t - 1, sfx: "rv-tap", vol: 0.7 },
    { at: t + 1, sfx: "rv-pop", vol: 0.6 },
  ]),
  { at: 157, sfx: "rv-swish", vol: 0.8 },
  { at: 166, sfx: "rv-rise", vol: 0.9 },
  ...[194, 197, 200, 203].map((t) => ({ at: t, sfx: tick(), vol: 0.6 })),
  { at: 218, sfx: "rv-press", vol: 0.85 },
  { at: 232, sfx: "rv-confirm", vol: 0.75 },
  { at: 246, sfx: "rv-coin", vol: 0.75 }, // Bling 01
  { at: 266, sfx: "rv-coin2", vol: 0.7 }, // Bling 03
  { at: 288, sfx: "rv-swish", vol: 0.7 },
  { at: 316, sfx: "rv-absorb", vol: 0.85 },
  { at: 326, sfx: "rv-push", vol: 0.8 },
  ...BARS.map((_, i) => ({ at: 345 + i * 3, sfx: tick(), vol: 0.42 })),
  ...CATS.map((c) => ({ at: c.at - 1, sfx: tick(), vol: 0.55 })),
  { at: 395, sfx: "rv-push", vol: 0.55 },
  { at: 413, sfx: "rv-reward", vol: 0.8, dur: 58 }, // Star 02
  ...[420, 423, 426, 429].map((t) => ({ at: t, sfx: tick(), vol: 0.45 })),
  ...POINT_TAPS.flatMap((t) => [
    { at: t - 1, sfx: "rv-tap", vol: 0.6 },
    { at: t + 5, sfx: "rv-sparkle-sm", vol: 0.45 },
  ]),
  { at: 499, sfx: "rv-hit", vol: 0.8, dur: 20 }, // Luca's Hit.mp3, the only accent on the reveal
  { at: 500, sfx: "rv-shine", vol: 0.35, dur: 58 }, // swells under the wordmark sweep, peaks on "One app"
  { at: RV_LOCKUP_END + 17, sfx: "rv-tick", vol: 0.5 },
];

const Sound: React.FC = () => (
  <>
    <Audio src={staticFile("revolut/vo-1.wav")} />
    <Audio src={staticFile("revolut/sfx3/rv-bed.wav")} volume={0.0966} /> {/* ambient pad 1 at -44 LUFS (Luca's call). HPF 70, -4dB @280Hz, fades baked in */}
    {CUES.map((c, i) => (
      <Sequence key={i} from={c.at} durationInFrames={c.dur ?? 60}>
        <Audio src={staticFile(`revolut/sfx3/${c.sfx}.wav`)} volume={c.vol} />
      </Sequence>
    ))}
  </>
);

export const Revolut916: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    <Sequence durationInFrames={RV_LOCKUP_END}>
      <Main />
    </Sequence>
    <Sequence from={RV_LOCKUP_END} durationInFrames={CAT_EYES_DURATION}>
      <CatEyesEnd tint={C.eyes} width={170} />
    </Sequence>
    <Sound />
  </AbsoluteFill>
);
