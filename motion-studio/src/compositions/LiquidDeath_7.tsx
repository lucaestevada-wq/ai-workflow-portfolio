/**
 * LIQUID DEATH — "Murder Your Thirst."   (unaffiliated spec piece, 16:9)   v7
 *
 * PARAMETER BRIEF (v4 = v3 + Luca's review: layered journal collage, richer opening,
 * full-screen gather, cutout-stack transition, contract rebuilt, no credit line)
 * - Reference / lineage: Liquid Death's voice through Luca's collage-kinetic refs, now with a
 *   LAYERED JOURNAL language (his refs: b&w halftone cutout stickers with white outlines,
 *   tape, scribbles, stacked paper). Spotify v4 cadence system kept (global twos grid).
 * - Palette (4): bg #0B0B0C / off-white #F2F2EF / ice #7FC9DC (+ flash #CFEEF5) /
 *   red #C8352A (79% HSV: blood signature + wax seal, red X, "Plastic.").
 *   Cutouts are strictly black & white halftone (paper #ECEAE2 / ink #121213).
 * - Type: Traditio AH shouts (hard black offset shadow over collage), URW Clarendon ExtBold
 *   ExtNarrow labels / tape text / tagline, URW Clarendon Regular fine print.
 * - Composition: every scene is a collage bed (stickers, tape, scraps, symbols) under ONE
 *   focal element; beds sit lower contrast / smaller than the focal word or object.
 * - Pacing / sync: as v3 (bars 42/97/152/206/261/316/370/424/479/537, drop 152, hit 424).
 *   NEW: 199/201/203/205 cutout pieces slam over the skull on every step and BUILD the
 *   100% MOUNTAIN WATER collage (replaces the v3 whip).
 * - Easing / stagger / smear / camera: as v3. Sticker slams snap (.12,0,.08,1) from 1.25.
 * - Texture: halftone dot + line-screen cutouts, real paper, photocopy plate, grain, scorch
 *   on the contract, red wax seal with embossed skull + splatter.
 * - Sound: as v3 (-14 LUFS). No credit / name on screen (ink.2d page carries contact).
 *
 * v5 (Luca's review of v4):
 *   - NO DEAD HOLDS: every cutout / word / sticker / tape boils (stepped +-1.6px, +-0.35deg on the
 *     twos grid, independent per piece) + visible camera float + accelerating (ease-in) pushes,
 *     so no hold ever freezes (v4 froze ~f31-41, ~f114-119, ~f285-297).
 *   - "NO MERCY." stays readable: bed moved to the corners, no sticker behind the word, split
 *     only on landing, Mercy glyphs ride ON TOP of the gather flood.
 *   - lockup can = real 3D (three.js) cylinder with Luca's label unwrapped onto it, swings in
 *     from its side and turns to camera on the twos grid; tape removed.
 *   - analysis prop: renders without grain/photocopy so motion can be measured honestly.
 *
 * v6 (Luca's review of v5):
 *   - 132-152 rebuilt: camera PULLS BACK from "Mercy." in 3 stepped zoom-outs (133/138/143),
 *     revealing the collage that lives around the word (no items pop in), then CRASH to centre
 *     at 147; "NO Mercy." punches forward, compresses on 150, stays whole + readable to the 152 cut.
 *   - calmer life: boil ~40% amplitude / ~30% rotation, poses change every 4 frames (was every
 *     2, read as nervous micro-shake); camera float calmer, still stepped on twos.
 *
 * v7 (Luca's review of v6, ONLY change): from 147 "NO Mercy." crashes to the centre with the
 *   collage on the same steps (147 / 150), deforming (pinch, stretch, skew, twist, chroma split).
 *   Everything up to 146 and everything else is identical to v6.
 *
 * VERSIONING: never overwrite. Next iteration = LiquidDeath_8.tsx + id LiquidDeath-8.
 */
import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, random, Sequence, staticFile, useCurrentFrame } from "remotion";
import { noise2D } from "@remotion/noise";
import { stepFrame } from "../lib/modes";
import { SyncData, hitFrames } from "../lib/audio";
import { loadLocalFont } from "../lib/localFonts";
import { LD_SKULL_D, LD_SKULL_VIEWBOX as SKV } from "../lib/ldSkullPath";
import { LD_STACK, LD_STACK_TRANSFORM, LD_STACK_VIEWBOX } from "../lib/ldPaths";
import { Grain, Vignette } from "../components/Texture";
import { CatEyesEnd, CAT_EYES_DURATION } from "../components/CatEyesEnd";
import { LdCan3D } from "../components/LdCan3D";
import syncJson from "../../public/data/metal1-ld_1.json";

// ---------------------------------------------------------------- constants
const CUT = 537;
export const LD_DURATION = CUT + CAT_EYES_DURATION; // 585
const W = 1920;
const H = 1080;
const CX = W / 2;
const CY = H / 2;

const C = {
  bg: "#0B0B0C",
  white: "#F2F2EF",
  ice: "#7FC9DC",
  iceFlash: "#CFEEF5",
  red: "#C8352A",
  paper: "#EDEBE4",
};

const E = {
  out: Easing.bezier(0, 0, 0.2, 1),
  in: Easing.bezier(0.4, 0, 1, 1),
  inOut: Easing.bezier(0.4, 0, 0.2, 1),
  snap: Easing.bezier(0.12, 0, 0.08, 1),
  over: Easing.bezier(0.34, 1.56, 0.64, 1),
};
type Ease = (n: number) => number;
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const prog = (t: number, start: number, dur: number, ease: Ease) =>
  interpolate(t, [start, start + Math.max(1, dur)], [0, 1], { ...CLAMP, easing: ease });
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

// ---------------------------------------------------------------- cadence (Spotify house rule)
const HOLD = 2;
/**
 * Event-relative stepped progress. Pose updates every `hold` frames counted from the event's
 * OWN start frame. lead=1 pre-advances one step so a MOVE registers on its hit frame;
 * lead=0 keeps the extreme pose on the hit frame (slams). `lag` = smear ghost offset (frames).
 */
const grid = (fi: number) => Math.floor(fi / HOLD) * HOLD; // ONE global twos grid for the whole piece
/** local stepped time of an event: its hit frame shows the impact pose exactly ON the hit (odd or even),
 *  every later pose snaps to the shared global grid, so overlapping events never fight phase. */
const local = (fi: number, start: number) => (fi === start ? 0 : Math.max(0, grid(fi) - start));
const ps = (fi: number, start: number, dur: number, ease: Ease, lag = 0, lead = 0) =>
  fi < start ? 0 : prog(local(fi, start) + lead * HOLD - lag, 0, dur, ease);
const pm = (fi: number, start: number, dur: number, ease: Ease, lag = 0) => ps(fi, start, dur, ease, lag, 1);
/** Paper BOIL: hand-placed cutouts never sit perfectly still. Stepped on the global twos grid,
 *  independent per piece (seed), so a held frame pair is always followed by a new pose. */
const BOIL_AMP = 0.4; // v6: v5's boil read as nervous micro-shake -> 40% amplitude
const BOIL_ROT = 0.3; //      and 30% rotation
const BOIL_HOLD = 4; //      new pose every 4 frames (still on the twos grid)
const boilAt = (fi: number, seed: string, amp = 1.6, rot = 0.35) => {
  const g = Math.floor(fi / BOIL_HOLD) * BOIL_HOLD;
  const a = amp * BOIL_AMP;
  const r = rot * BOIL_ROT;
  return { x: (random(`bx-${seed}-${g}`) - 0.5) * 2 * a, y: (random(`by-${seed}-${g}`) - 0.5) * 2 * a, r: (random(`br-${seed}-${g}`) - 0.5) * 2 * r };
};
const useBoil = (seed: string, amp = 1.6, rot = 0.35) => boilAt(useCurrentFrame(), seed, amp, rot);
const boilT = (b: { x: number; y: number; r: number }) => `translate(${b.x.toFixed(2)}px, ${b.y.toFixed(2)}px) rotate(${b.r.toFixed(3)}deg)`;
const slam = (fi: number, start: number, from = 1.18, dur = 4, lag = 0) => lerp(from, 1, ps(fi, start, dur, E.snap, lag));
/** Stepped hit pulse: 1 on the hit frame, decays in steps of two. */
const pulse = (fi: number, hits: number[], decay = 8) => {
  let best = 0;
  for (const h of hits) {
    if (fi >= h && fi < h + decay) {
      const p = 1 - local(fi, h) / decay;
      best = Math.max(best, p * p);
    }
  }
  return best;
};
/** Cumulative stepped advance: +1 per beat, eased over `dur` (ambient motion locked to the beat). */
const beatAdv = (fi: number, beats: number[], dur = 6) => beats.reduce((n, b) => n + ps(fi, b, dur, E.out, 0, 1), 0);

// ---------------------------------------------------------------- smear (Spotify: stepped smear, not film blur)
const SHUTTER = 0.5;
type Ghost = { lag: number; o: number };
/** dist = px travelled by the element across ONE step (2 frames). Nothing under ~8px/frame smears. */
const smearOf = (dist: number, max = 8): Ghost[] => {
  if (dist < 16) return [];
  const n = Math.min(max, Math.ceil(dist / 14));
  return Array.from({ length: n }, (_, k) => ({ lag: ((k + 1) / n) * SHUTTER * HOLD, o: 0.3 * (1 - k / n) }));
};
const GHOST_FILTER = "blur(1.5px)";
/** Renders ghosts (oldest first) then the sharp pose. render(lag, ghostOpacity|undefined). */
const Smeared = ({ ghosts, render }: { ghosts: Ghost[]; render: (lag: number, o?: number) => React.ReactNode }) => (
  <>
    {[...ghosts].reverse().map((g, i) => (
      <AbsoluteFill key={`gh${i}`} style={{ opacity: g.o, filter: GHOST_FILTER }}>
        {render(g.lag, g.o)}
      </AbsoluteFill>
    ))}
    {render(0)}
  </>
);

// ---------------------------------------------------------------- fonts + assets
const FONT = {
  black: loadLocalFont("LdTraditio", "Traditio.ttf"),
  slab: loadLocalFont("LdClarendonXN", "URWClarendon-ExtBoldExtNarrow.ttf"),
  body: loadLocalFont("LdClarendon", "URWClarendon-Regular.ttf"),
};
const A = {
  can: staticFile("ld/can-white.png"), // 511x1500
  mountains: staticFile("ld/mountains-ice.png"), // 2112x1184
  bottle: staticFile("ld/bottle-xerox.png"), // 804x1671
  splat: staticFile("ld/splat-mask.png"), // 2400x1800, mirrored: dense blob (2054, 1014), spray throws LEFT
  tear: staticFile("ld/tear-mask.png"), // 2752x1300, torn edge on the left (~152px zone)
  scrap: staticFile("ld/paper-scrap.png"), // 685x304
  signature: staticFile("ld/signature.png"), // 897x375
  photocopy: staticFile("ld/photocopy.jpg"), // 2112x1188
  xerox: staticFile("ld/xerox.jpg"), // 1920x1080
  dust: staticFile("ld/spray-dust.png"),
  face: staticFile("ld/soul-face.jpg"), // 700x540
};
const CAN_AR = 511 / 1500;
const SCRAP_AR = 304 / 685;

// ---------------------------------------------------------------- sync grid
const SYNC = syncJson as unknown as SyncData;
const BEATS = hitFrames(SYNC, "beats");

// ---------------------------------------------------------------- timeline (frames)
const T = {
  eye: 10,
  warn: 15,
  b1: 42,
  no1: 47,
  sugar: 52,
  no2: 84,
  plastic: 88,
  no3: 120,
  dip: 132,
  g1: 138,
  g2: 143,
  g3: 147,
  drop: 152,
  stack: 199,
  bar2: 206,
  can: 220,
  tear: 238,
  scared: 247,
  water: 261,
  push: 298,
  bar4: 316,
  sig: 343,
  stamp: 357,
  splat: 364,
  bar5: 370,
  bottle: 384,
  x1: 397,
  x2: 400,
  inv: 411,
  shatter: 420,
  smash: 424,
  bar7: 479,
  tag: 483,
};

// ---------------------------------------------------------------- shapes
const tornRect = (seed: string, jag = 1.6, steps = 20) => {
  const r = (i: number, e: number) => random(`${seed}-${e}-${i}`) * jag;
  const p: string[] = [];
  for (let i = 0; i < steps; i++) p.push(`${(i / steps) * 100}% ${r(i, 0)}%`);
  for (let i = 0; i < steps; i++) p.push(`${100 - r(i, 1)}% ${(i / steps) * 100}%`);
  for (let i = 0; i < steps; i++) p.push(`${100 - (i / steps) * 100}% ${100 - r(i, 2)}%`);
  for (let i = 0; i < steps; i++) p.push(`${r(i, 3)}% ${100 - (i / steps) * 100}%`);
  return `polygon(${p.join(",")})`;
};
const RAYS = new Array(22)
  .fill(0)
  .map((_, k) => {
    const a0 = (k / 22) * Math.PI * 2;
    const a1 = a0 + Math.PI / 22;
    const r = 1700;
    return `M0 0 L${(Math.cos(a0) * r).toFixed(1)} ${(Math.sin(a0) * r).toFixed(1)} L${(Math.cos(a1) * r).toFixed(1)} ${(Math.sin(a1) * r).toFixed(1)} Z`;
  })
  .join(" ");

// ---------------------------------------------------------------- collage items (gather -> explode)
// First 6 items ARE the "Mercy." glyphs (measured Traditio advances). The rest fill the WHOLE frame
// from a jittered 12x8 grid: letters, symbols, halftone stickers, scraps.
type SymKind = "asterisk" | "star4" | "burst" | "bolt" | "cross" | "xmark" | "arrow" | "bones";
type CutKey = "can_w" | "can_g" | "can_b" | "bottle" | "mtn" | "face" | "skull" | "banner";
type Item = {
  kind: "mercy" | "char" | "sym" | "cut" | "scrap";
  ch: string;
  sym: SymKind;
  cut: CutKey;
  x0: number;
  y0: number;
  ang: number;
  r0: number;
  size: number;
  rot: number;
  spin: number;
  ice: boolean;
  seed: string;
};
const MERCY_GLYPHS: [string, number][] = [["M", 605.7], ["e", 898.9], ["r", 1041.9], ["c", 1179.9], ["y", 1334.1], [".", 1478.4]];
const ITEM_CHARS = "SUGARPLASTICNODEATH".split("");
const SYMS: SymKind[] = ["asterisk", "star4", "burst", "bolt", "cross", "xmark", "arrow", "bones"];
const CUTS: CutKey[] = ["skull", "can_w", "bottle", "can_b", "banner", "can_g", "mtn", "face"];
const ITEMS: Item[] = (() => {
  const out: Item[] = MERCY_GLYPHS.map(([ch, x], i) => ({
    kind: "mercy" as const,
    ch,
    sym: "star4" as SymKind,
    cut: "skull" as CutKey,
    x0: x,
    y0: 545,
    ang: Math.atan2(545 - CY, x - CX),
    r0: Math.hypot(x - CX, 545 - CY),
    size: 430,
    rot: (random(`mrot${i}`) - 0.5) * 24,
    spin: 0,
    ice: false,
    seed: `m${i}`,
  }));
  const cols = 12;
  const rows = 8;
  let k = 0;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++, k++) {
      const x0 = -40 + ((c + 0.5) / cols) * (W + 80) + (random(`gx${k}`) - 0.5) * 120;
      const y0 = -30 + ((r + 0.5) / rows) * (H + 60) + (random(`gy${k}`) - 0.5) * 90;
      const roll = random(`gk${k}`);
      const kind: Item["kind"] = roll < 0.4 ? "char" : roll < 0.7 ? "sym" : roll < 0.88 ? "cut" : "scrap";
      out.push({
        kind,
        ch: ITEM_CHARS[k % ITEM_CHARS.length],
        sym: SYMS[k % SYMS.length],
        cut: CUTS[k % CUTS.length],
        x0,
        y0,
        ang: Math.atan2(y0 - CY, x0 - CX),
        r0: Math.hypot(x0 - CX, y0 - CY),
        size: kind === "cut" ? 120 + random(`gs${k}`) * 110 : kind === "scrap" ? 120 + random(`gs${k}`) * 90 : 60 + random(`gs${k}`) * 90,
        rot: (random(`grot${k}`) - 0.5) * 80,
        spin: (random(`gsp${k}`) - 0.5) * 18,
        ice: random(`gice${k}`) < 0.22,
        seed: `g${k}`,
      });
    }
  return out;
})();
/** Gather radius fraction: 3 stepped, accelerating jumps that register ON the snare stabs. */
const gatherR = (fi: number, lag = 0) => {
  if (fi < T.g1) return lerp(1, 0.96, pm(fi, T.dip, 6, E.out, lag));
  if (fi < T.g2) return lerp(0.96, 0.6, pm(fi, T.g1, 3, E.in, lag));
  if (fi < T.g3) return lerp(0.6, 0.28, pm(fi, T.g2, 3, E.in, lag));
  if (fi < 150) return lerp(0.27, 0.08, pm(fi, T.g3, 3, E.in, lag));
  return lerp(0.08, 0, pm(fi, 150, 2, E.in, lag));
};

// ---------------------------------------------------------------- primitives
const PaperGrain: React.FC<{ id: string; clip?: string; opacity?: number }> = ({ id, clip, opacity = 0.22 }) => (
  <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, clipPath: clip, mixBlendMode: "multiply", opacity, pointerEvents: "none" }}>
    <filter id={`pf-${id}`}>
      <feTurbulence type="fractalNoise" baseFrequency="0.75 0.22" numOctaves="3" seed={id.length * 7 + 3} />
      <feColorMatrix type="saturate" values="0" />
      <feComponentTransfer>
        <feFuncR type="linear" slope="0.6" intercept="0.42" />
        <feFuncG type="linear" slope="0.6" intercept="0.42" />
        <feFuncB type="linear" slope="0.6" intercept="0.42" />
      </feComponentTransfer>
    </filter>
    <rect width="100%" height="100%" filter={`url(#pf-${id})`} />
  </svg>
);

const Skull: React.FC<{ left: number; top: number; width: number; fill: string; opacity?: number; blend?: React.CSSProperties["mixBlendMode"] }> = ({
  left,
  top,
  width,
  fill,
  opacity = 1,
  blend,
}) => (
  <svg
    viewBox={`${SKV.x} ${SKV.y} ${SKV.w} ${SKV.h}`}
    width={width}
    height={(width * SKV.h) / SKV.w}
    style={{ position: "absolute", left, top, overflow: "visible", opacity, mixBlendMode: blend }}
  >
    <path d={LD_SKULL_D} fill={fill} fillRule="evenodd" />
  </svg>
);

/** Skull inside a fixed full-frame SVG (no CSS-scaled SVG layers -> no Chrome tile dropout). */
const SkullInFrame: React.FC<{ id: string; left: number; top: number; k: number; fill: string; opacity: number; halftone?: { spacing: number; r: number } }> = ({
  id,
  left,
  top,
  k,
  fill,
  opacity,
  halftone,
}) => {
  const tf = `translate(${left} ${top}) scale(${k}) translate(${-SKV.x} ${-SKV.y})`;
  if (!halftone)
    return (
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, opacity }}>
        <path d={LD_SKULL_D} fillRule="evenodd" fill={fill} transform={tf} />
      </svg>
    );
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, opacity }}>
      <defs>
        <pattern id={`hp-${id}`} width={halftone.spacing} height={halftone.spacing} patternUnits="userSpaceOnUse">
          <circle cx={halftone.spacing / 2} cy={halftone.spacing / 2} r={halftone.r} fill={fill} />
        </pattern>
        <mask id={`hm-${id}`} maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
          <path d={LD_SKULL_D} fillRule="evenodd" fill="#fff" transform={tf} />
        </mask>
      </defs>
      <rect width={W} height={H} fill={`url(#hp-${id})`} mask={`url(#hm-${id})`} />
    </svg>
  );
};

const StackMark: React.FC<{ cx: number; cy: number; width: number; fill: string; opacity?: number; blend?: React.CSSProperties["mixBlendMode"] }> = ({
  cx,
  cy,
  width,
  fill,
  opacity = 1,
  blend,
}) => {
  const [, , vw, vh] = LD_STACK_VIEWBOX.split(" ").map(Number);
  const h = (width * vh) / vw;
  return (
    <svg viewBox={LD_STACK_VIEWBOX} width={width} height={h} style={{ position: "absolute", left: cx - width / 2, top: cy - h / 2, overflow: "visible", opacity, mixBlendMode: blend }}>
      <g transform={LD_STACK_TRANSFORM} fill={fill}>
        {LD_STACK.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  );
};

type LineProps = {
  text: string;
  font: string;
  size: number;
  color: string;
  x: number;
  y: number;
  align?: "left" | "right" | "center";
  tracking?: string;
  split?: number;
  opacity?: number;
  rotate?: number;
  scale?: number;
  /** smear ghosts: earlier (bigger) slam scales */
  ghosts?: { s: number; o: number }[];
  /** hard offset print shadow so a shout separates from the collage bed */
  shadow?: boolean;
};
const Line: React.FC<LineProps> = ({ text, font, size, color, x, y, align = "left", tracking = "0em", split = 0, opacity = 1, rotate = 0, scale = 1, ghosts = [], shadow = false }) => {
  const anchor = align === "left" ? "0%" : align === "right" ? "-100%" : "-50%";
  const bo = useBoil(`ln-${text}-${x}-${y}`);
  const base = (s: number): React.CSSProperties => ({
    position: "absolute",
    left: x,
    top: y,
    fontFamily: font,
    fontSize: size,
    lineHeight: 1,
    letterSpacing: tracking,
    whiteSpace: "nowrap",
    transformOrigin: align === "left" ? "left center" : align === "right" ? "right center" : "center center",
    transform: `translateX(${anchor}) ${boilT(bo)} rotate(${rotate}deg) scale(${s})`,
    opacity,
  });
  return (
    <>
      {ghosts.map((g, i) => (
        <div key={`g${i}`} style={{ ...base(g.s), color, opacity: g.o * opacity, filter: GHOST_FILTER }}>
          {text}
        </div>
      ))}
      {split > 0.4 ? (
        <>
          <div style={{ ...base(scale), color: C.red, marginLeft: -split, mixBlendMode: "screen" }}>{text}</div>
          <div style={{ ...base(scale), color: C.ice, marginLeft: split, mixBlendMode: "screen" }}>{text}</div>
        </>
      ) : null}
      <div style={{ ...base(scale), color, textShadow: shadow ? `${size * 0.028}px ${size * 0.032}px 0 rgba(0,0,0,0.78)` : undefined }}>{text}</div>
    </>
  );
};

/** Slam with Spotify smear: halfW = half the element's width in px (sets the smear distance). */
const slamS = (fi: number, start: number, from: number, dur: number, halfW: number) => {
  const s = slam(fi, start, from, dur);
  const prev = slam(fi, start, from, dur, HOLD);
  const ghosts = fi >= start ? smearOf(Math.abs(prev - s) * halfW, 6).map((g) => ({ s: slam(fi, start, from, dur, g.lag), o: g.o })) : [];
  return { s, ghosts };
};

const Words: React.FC<{
  fi: number;
  words: { w: string; at: number; color?: string }[];
  font: string;
  size: number;
  color: string;
  x: number;
  y: number;
  align?: "left" | "right" | "center";
  gap?: number;
  tracking?: string;
  from?: number;
  splitFirst?: number;
  underline?: number;
}> = ({ fi, words, font, size, color, x, y, align = "left", gap = 0.28, tracking = "0em", from = 1.18, splitFirst = 0, underline = 0 }) => {
  const anchor = align === "left" ? "0%" : align === "right" ? "-100%" : "-50%";
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translateX(${anchor})`, display: "flex", gap: size * gap, whiteSpace: "nowrap" }}>
      {words.map((wd, i) => {
        const on = fi >= wd.at;
        const { s, ghosts } = slamS(fi, wd.at, from, 4, size * wd.w.length * 0.22);
        const base = (sc: number): React.CSSProperties => ({ fontFamily: font, fontSize: size, lineHeight: 1, letterSpacing: tracking, display: "inline-block", transform: `scale(${sc})`, transformOrigin: "50% 60%" });
        const sp = i === 0 && fi < wd.at + 3 ? splitFirst : 0;
        const bo = boilAt(fi, `wd-${wd.w}-${i}`);
        return (
          <span key={i} style={{ position: "relative", visibility: on ? "visible" : "hidden", display: "inline-block", transform: boilT(bo) }}>
            {on
              ? ghosts.map((g, k) => (
                  <span key={`g${k}`} style={{ ...base(g.s), position: "absolute", left: 0, top: 0, color: wd.color ?? color, opacity: g.o, filter: GHOST_FILTER }}>
                    {wd.w}
                  </span>
                ))
              : null}
            {sp > 0 ? (
              <>
                <span style={{ ...base(s), position: "absolute", left: -sp, top: 0, color: C.red, mixBlendMode: "screen" }}>{wd.w}</span>
                <span style={{ ...base(s), position: "absolute", left: sp, top: 0, color: C.ice, mixBlendMode: "screen" }}>{wd.w}</span>
              </>
            ) : null}
            <span style={{ ...base(s), position: "relative", color: wd.color ?? color }}>{wd.w}</span>
          </span>
        );
      })}
      {underline > 0 ? <div style={{ position: "absolute", left: 0, bottom: -size * 0.16, width: `${underline * 100}%`, height: 5, background: C.white }} /> : null}
    </div>
  );
};

const Dots: React.FC<{ id: string; color: string; opacity: number; spacing?: number; r?: number; ox?: number; oy?: number }> = ({ id, color, opacity, spacing = 18, r = 3, ox = 0, oy = 0 }) => (
  <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, opacity }}>
    <defs>
      <pattern id={`p-${id}`} width={spacing} height={spacing} patternUnits="userSpaceOnUse" x={ox} y={oy}>
        <circle cx={spacing / 2} cy={spacing / 2} r={r} fill={color} />
      </pattern>
      <radialGradient id={`g-${id}`} cx="50%" cy="50%" r="65%">
        <stop offset="0%" stopColor="#fff" stopOpacity={1} />
        <stop offset="100%" stopColor="#fff" stopOpacity={0} />
      </radialGradient>
      <mask id={`m-${id}`}>
        <rect width={W} height={H} fill={`url(#g-${id})`} />
      </mask>
    </defs>
    <rect width={W} height={H} fill={`url(#p-${id})`} mask={`url(#m-${id})`} />
  </svg>
);

const Rays: React.FC<{ cx: number; cy: number; rot: number; color: string; opacity: number }> = ({ cx, cy, rot, color, opacity }) => (
  <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, opacity }}>
    <g transform={`translate(${cx} ${cy}) rotate(${rot})`}>
      <path d={RAYS} fill={color} />
    </g>
  </svg>
);

/** Real torn paper scrap (Luca's asset), width w, rotated. */
const Scrap: React.FC<{ x: number; y: number; w: number; r: number; s?: number; o?: number }> = ({ x, y, w, r, s = 1, o = 0.95 }) => (
  <Img src={A.scrap} style={{ position: "absolute", left: x, top: y, width: w, height: w * SCRAP_AR, transform: `${boilT(boilAt(useCurrentFrame(), `sc-${x}-${y}`, 1.6, 0.6))} rotate(${r}deg) scale(${s})`, opacity: o }} />
);

const Can: React.FC<{ cx: number; bottom: number; h: number; rot?: number; o?: number; shadow?: boolean }> = ({ cx, bottom, h, rot = 0, o = 1, shadow = true }) => {
  const w = h * CAN_AR;
  return (
    <Img
      src={A.can}
      style={{
        position: "absolute",
        left: cx - w / 2,
        top: bottom - h,
        width: w,
        height: h,
        transform: `${boilT(boilAt(useCurrentFrame(), `can-${cx}`, 1.4, 0.3))} rotate(${rot}deg)`,
        transformOrigin: "50% 100%",
        opacity: o,
        filter: shadow ? "drop-shadow(16px 18px 0 rgba(0,0,0,0.6))" : undefined,
      }}
    />
  );
};


// ---------------------------------------------------------------- journal collage primitives
const CUT_SRC: Record<CutKey, { src: string; ar: number }> = {
  can_w: { src: staticFile("ld/cut/can_w.png"), ar: 2.7601 },
  can_g: { src: staticFile("ld/cut/can_g.png"), ar: 2.75 },
  can_b: { src: staticFile("ld/cut/can_b.png"), ar: 2.3898 },
  bottle: { src: staticFile("ld/cut/bottle.png"), ar: 2.0314 },
  mtn: { src: staticFile("ld/cut/mtn.png"), ar: 0.4547 },
  face: { src: staticFile("ld/cut/face.png"), ar: 0.7767 },
  skull: { src: staticFile("ld/cut/skull.png"), ar: 0.8123 },
  banner: { src: staticFile("ld/cut/banner.png"), ar: 0.5361 },
};
const SCRIBBLE = { src: staticFile("ld/cut/scribble_w.png"), ar: 0.4181 };
const SIG_RED = { src: staticFile("ld/cut/signature_red.png"), ar: 0.4181 };
const STICKER_SHADOW = "drop-shadow(9px 11px 0 rgba(0,0,0,0.62))";

/** B&W halftone cutout sticker (white outline baked in). (x, y) = top-left, w = width. */
const Sticker: React.FC<{ k: CutKey; x: number; y: number; w: number; r?: number; s?: number; o?: number; ghost?: boolean }> = ({ k, x, y, w, r = 0, s = 1, o = 1, ghost }) => {
  const bo = useBoil(`st-${k}-${x}-${y}`, 1.8, 0.5);
  return (
  <Img
    src={CUT_SRC[k].src}
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: w * CUT_SRC[k].ar,
      transform: `${boilT(bo)} rotate(${r}deg) scale(${s})`,
      opacity: o,
      filter: ghost ? GHOST_FILTER : STICKER_SHADOW,
    }}
  />
  );
};

const SYM_D: Record<SymKind, { d: string; stroke?: number }> = {
  asterisk: { d: "M0 -46 V46 M-40 -23 L40 23 M-40 23 L40 -23", stroke: 13 },
  star4: { d: "M0 -50 Q0 0 50 0 Q0 0 0 50 Q0 0 -50 0 Q0 0 0 -50 Z" },
  burst: {
    d:
      "M" +
      new Array(24)
        .fill(0)
        .map((_, k) => {
          const a = (k / 24) * Math.PI * 2 - Math.PI / 2;
          const rr = k % 2 === 0 ? 50 : 30;
          return `${(Math.cos(a) * rr).toFixed(1)} ${(Math.sin(a) * rr).toFixed(1)}`;
        })
        .join(" L") +
      " Z",
  },
  bolt: { d: "M12 -50 L-26 6 L-2 6 L-14 50 L28 -10 L4 -10 Z" },
  cross: { d: "M-9 -48 H9 V-9 H48 V9 H9 V48 H-9 V9 H-48 V-9 H-9 Z" },
  xmark: { d: "M-38 -38 L38 38 M38 -38 L-38 38", stroke: 15 },
  arrow: { d: "M-44 0 H30 M8 -22 L32 0 L8 22", stroke: 11 },
  bones: { d: "M-36 -36 L36 36 M36 -36 L-36 36", stroke: 16 },
};
/** Hand-made symbol (white / ice), centred at (x, y), size = px across. */
const Sym: React.FC<{ k: SymKind; x: number; y: number; size: number; color?: string; r?: number; s?: number; o?: number }> = ({ k, x, y, size, color = C.white, r = 0, s = 1, o = 1 }) => {
  const def = SYM_D[k];
  const bo = useBoil(`sy-${k}-${x}-${y}`, 2, 2.5);
  return (
    <svg viewBox="-60 -60 120 120" width={size} height={size} style={{ position: "absolute", left: x - size / 2, top: y - size / 2, transform: `${boilT(bo)} rotate(${r}deg) scale(${s})`, opacity: o, overflow: "visible" }}>
      {def.stroke ? <path d={def.d} fill="none" stroke={color} strokeWidth={def.stroke} strokeLinecap="round" strokeLinejoin="round" /> : <path d={def.d} fill={color} />}
      {k === "bones"
        ? [
            [-36, -36],
            [36, 36],
            [36, -36],
            [-36, 36],
          ].map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r={11} fill={color} />)
        : null}
    </svg>
  );
};

/** Hazard / caution tape across the frame. Text scrolls one notch per beat (stepped). */
const Tape: React.FC<{ y: number; angle: number; text: string; h?: number; offset?: number; s?: number; dark?: boolean }> = ({ y, angle, text, h = 96, offset = 0, s = 1, dark = false }) => {
  const bg = dark ? C.bg : C.white;
  const fg = dark ? C.white : C.bg;
  const bo = useBoil(`tp-${y}-${angle}`, 2, 0.12);
  return (
    <div
      style={{
        position: "absolute",
        left: -400,
        top: y - h / 2,
        width: W + 800,
        height: h,
        transform: `${boilT(bo)} rotate(${angle}deg) scale(${s})`,
        transformOrigin: "50% 50%",
        background: bg,
        overflow: "hidden",
        boxShadow: "0 14px 0 rgba(0,0,0,0.55)",
      }}
    >
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: h * 0.14, background: `repeating-linear-gradient(-45deg, ${fg} 0 16px, ${bg} 16px 32px)` }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: h * 0.14, background: `repeating-linear-gradient(-45deg, ${fg} 0 16px, ${bg} 16px 32px)` }} />
      <div
        style={{
          position: "absolute",
          left: -offset,
          top: h * 0.2,
          whiteSpace: "nowrap",
          fontFamily: FONT.slab,
          fontSize: h * 0.56,
          lineHeight: 1,
          letterSpacing: "0.08em",
          color: fg,
        }}
      >
        {text.repeat(8)}
      </div>
    </div>
  );
};

/** Journal tape strip (real paper, translucent) holding things down. */
const TapeStrip: React.FC<{ x: number; y: number; w: number; r: number; s?: number }> = ({ x, y, w, r, s = 1 }) => (
  <Img src={A.scrap} style={{ position: "absolute", left: x, top: y, width: w, height: w * 0.32, objectFit: "cover", transform: `${boilT(boilAt(useCurrentFrame(), `ts-${x}-${y}`, 1.4, 0.6))} rotate(${r}deg) scale(${s})`, opacity: 0.88, filter: "drop-shadow(4px 5px 0 rgba(0,0,0,0.35))" }} />
);

/** "NO" as a journal label sticker (white box, black slab caps, hard shadow). */
const NoTag: React.FC<{ x: number; y: number; r: number; s: number; size?: number; align?: "left" | "right" | "center" }> = ({ x, y, r, s, size = 120, align = "left" }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      transform: `translateX(${align === "left" ? "0%" : align === "right" ? "-100%" : "-50%"}) ${boilT(boilAt(useCurrentFrame(), `no-${x}-${y}`, 1.8, 0.6))} rotate(${r}deg) scale(${s})`,
      background: C.white,
      color: C.bg,
      fontFamily: FONT.slab,
      fontSize: size,
      letterSpacing: "0.08em",
      lineHeight: 1,
      padding: `${size * 0.1}px ${size * 0.22}px ${size * 0.02}px ${size * 0.26}px`,
      boxShadow: "10px 12px 0 rgba(0,0,0,0.65)",
    }}
  >
    NO
  </div>
);

/** One collage item at screen position (x, y), scale sc, rotation rot. */
const ItemView: React.FC<{ it: Item; x: number; y: number; sc: number; rot: number; o?: number }> = ({ it, x, y, sc, rot, o = 1 }) => {
  const base: React.CSSProperties = { position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${sc})`, opacity: o };
  if (it.kind === "sym") return <Sym k={it.sym} x={x} y={y} size={it.size} color={it.ice ? C.ice : C.white} r={rot} s={sc} o={o} />;
  if (it.kind === "cut")
    return <Img src={CUT_SRC[it.cut].src} style={{ ...base, width: it.size, height: it.size * CUT_SRC[it.cut].ar, filter: STICKER_SHADOW }} />;
  if (it.kind === "scrap") return <Img src={A.scrap} style={{ ...base, width: it.size * 1.6, height: it.size * 1.6 * SCRAP_AR }} />;
  return (
    <div style={{ ...base, fontFamily: FONT.black, fontSize: it.size, color: it.ice ? C.ice : C.white, lineHeight: 1, textShadow: it.kind === "mercy" ? undefined : "6px 7px 0 rgba(0,0,0,0.7)" }}>{it.ch}</div>
  );
};

/** A collage piece that slams onto the frame (scale 1.25 -> 1, rotation settle) with smear ghosts. */
const slamPiece = (fi: number, at: number, halfW: number, from = 1.25) => slamS(fi, at, from, 4, halfW);

// ---------------------------------------------------------------- scenes (fi = integer frame)

/** 0-42 · WARNING tease: the eye idles from frame 0; hazard tapes SLAP across it on onsets 15/24/29. */
const S1 = (fi: number) => {
  const lit = (fi >= T.eye && fi < 12) || (fi >= T.warn && fi < 19) || (fi >= 21 && fi < 22) || fi >= 24;
  const flick = lit ? (fi >= 24 ? 0.72 + 0.28 * random(`flk-${Math.floor(fi / 2)}`) : 1) : 0.26 + 0.06 * random(`idle-${grid(fi)}`);
  const push = 1 + 0.14 * ps(fi, 0, 42, E.in);
  const k = 5.15 * push;
  const sx = 1180 - (740 - SKV.x) * k;
  const sy = 520 - (496 - SKV.y) * k;
  const ba = beatAdv(fi, BEATS);
  const tapes = [
    { at: T.warn, y: 650, angle: -11, text: "WARNING  ✕  CONTAINS WATER  ✕  ", h: 108, dark: false },
    { at: 24, y: 350, angle: 8, text: "MAY CAUSE HYDRATION  ✕  DO NOT RESIST  ✕  ", h: 92, dark: true },
    { at: 29, y: 910, angle: -3, text: "WARNING  ✕  WARNING  ✕  ", h: 78, dark: false },
  ];
  return (
    <AbsoluteFill>
      <SkullInFrame id="s1" left={sx} top={sy} k={k} fill={C.ice} opacity={0.55 * flick} />
      {fi >= 24 ? <Sym k="star4" x={300} y={170} size={90} color={C.ice} s={slam(fi, 24, 1.4)} r={12} /> : null}
      {fi >= 29 ? <Sym k="asterisk" x={1700} y={180} size={80} color={C.white} s={slam(fi, 29, 1.4)} /> : null}
      {tapes.map((t, i) => (fi >= t.at ? <Tape key={i} y={t.y} angle={t.angle} text={t.text} h={t.h} dark={t.dark} offset={(ba * 92 + i * 137) % 880} s={slam(fi, t.at, 1.16, 4)} /> : null))}
    </AbsoluteFill>
  );
};

/** 42-132 · NO SUGAR. NO PLASTIC. NO MERCY. Each phrase lands on its own journal-collage bed. */
type Bed = { k: CutKey; x: number; y: number; w: number; r: number; at: number; ph: number; o?: number; front?: boolean };
type SymAt = { k: SymKind; x: number; y: number; size: number; at: number; ph: number; ice?: boolean; r?: number };
const S2_BEDS: Bed[] = [
  { k: "skull", x: 40, y: 640, w: 400, r: -8, at: 42, ph: 1 },
  { k: "can_b", x: 1610, y: 250, w: 200, r: 11, at: 47, ph: 1 },
  { k: "banner", x: 1290, y: 26, w: 380, r: 4, at: 52, ph: 1 },
  { k: "can_g", x: 50, y: 30, w: 190, r: -12, at: 84, ph: 2 },
  { k: "mtn", x: -60, y: 860, w: 560, r: -4, at: 97, ph: 2 },
  { k: "bottle", x: 1560, y: 600, w: 260, r: 14, at: 88, ph: 2, front: true },
  { k: "skull", x: 40, y: 40, w: 230, r: -10, at: 125, ph: 3 },
  { k: "can_w", x: 1740, y: 640, w: 140, r: 9, at: 125, ph: 3 },
];
const S2_SYMS: SymAt[] = [
  { k: "star4", x: 1770, y: 900, size: 100, at: 61, ph: 1, ice: true },
  { k: "asterisk", x: 980, y: 930, size: 80, at: 70, ph: 1 },
  { k: "xmark", x: 1700, y: 130, size: 70, at: 97, ph: 2, ice: true },
  { k: "asterisk", x: 150, y: 960, size: 80, at: 97, ph: 2 },
  { k: "star4", x: 1010, y: 95, size: 70, at: 102, ph: 2, ice: true },
  { k: "burst", x: 1790, y: 170, size: 110, at: 125, ph: 3, ice: true },
  { k: "star4", x: 330, y: 960, size: 80, at: 125, ph: 3 },
  { k: "bones", x: 1560, y: 980, size: 80, at: 125, ph: 3 },
];
/** The "No Mercy." bed (phase 3 of S2) on its own, so S3 can carry it into the pull-back. */
const S2_MERCY_BED = (fi: number) => {
  const beat = pulse(fi, BEATS, 6);
  return (
    <>
      {S2_BEDS.filter((b) => b.ph === 3 && fi >= b.at).map((b, i) => (
        <Sticker key={`mb${i}`} k={b.k} x={b.x} y={b.y} w={b.w} r={b.r} o={b.o ?? 1} s={slam(fi, b.at, 1.25)} />
      ))}
      {S2_SYMS.filter((sy) => sy.ph === 3 && fi >= sy.at).map((sy, i) => (
        <Sym key={`ms${i}`} k={sy.k} x={sy.x} y={sy.y} size={sy.size} color={sy.ice ? C.ice : C.white} r={(sy.r ?? 0) + 8 * beat} s={slam(fi, sy.at, 1.5) + 0.12 * beat} />
      ))}
      {fi >= 125 ? <Scrap x={40} y={940} w={220} r={-9} s={slam(fi, 125, 1.3)} /> : null}
    </>
  );
};
/** S2's per-phrase push at its last frame: S3 starts from exactly this framing (no size jump on the cut). */
const S2_END_PUSH = () => 1 + 0.05 * ps(T.dip - 1, T.no3, T.dip - T.no3, E.in);
const S2 = (fi: number) => {
  const phase = fi < T.no2 ? 1 : fi < T.no3 ? 2 : 3;
  const p0 = phase === 1 ? T.b1 : phase === 2 ? T.no2 : T.no3;
  const push = 1 + 0.05 * ps(fi, p0, (phase === 1 ? T.no2 : phase === 2 ? T.no3 : T.dip) - p0, E.in); // per phrase, resets on each cut
  const dotsOff = beatAdv(fi, BEATS) * 9;
  const recoil = (at: number) => pulse(fi, [at], 6);
  const sugar = slamS(fi, T.sugar, 1.24, 5, 640);
  const panel = slamS(fi, T.plastic, 1.14, 5, 850);
  const mercy = slamS(fi, T.no3 + 1, 1.26, 5, 640);
  const beat = pulse(fi, BEATS, 6);
  const panelW = 1700;
  const panelH = panelW * SCRAP_AR;
  const panelRot = lerp(-3.2, -1.6, ps(fi, T.plastic, 6, E.out)) - 0.8 * pulse(fi, [97], 8);
  const panelBody = (s: number, o?: number) => (
    <div
      style={{
        position: "absolute",
        left: CX - panelW / 2,
        top: 600 - panelH / 2,
        width: panelW,
        height: panelH,
        transform: `${boilT(boilAt(fi, "plasticpanel", 1.6, 0.25))} rotate(${panelRot}deg) scale(${s})`,
        opacity: o ?? 1,
        filter: o !== undefined ? GHOST_FILTER : "drop-shadow(14px 16px 0 rgba(0,0,0,0.6))",
      }}
    >
      <Img src={A.scrap} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      {o === undefined && fi < T.plastic + 3 ? (
        <>
          <Line text="Plastic." font={FONT.black} size={400} color={C.red} x={panelW / 2 - 9} y={panelH / 2 - 225} align="center" opacity={0.75} />
          <Line text="Plastic." font={FONT.black} size={400} color={C.ice} x={panelW / 2 + 9} y={panelH / 2 - 225} align="center" opacity={0.75} />
        </>
      ) : null}
      <Line text="Plastic." font={FONT.black} size={400} color={C.bg} x={panelW / 2} y={panelH / 2 - 225} align="center" />
    </div>
  );
  const beds = S2_BEDS.filter((b) => b.ph === phase && fi >= b.at);
  const bed = (front: boolean) =>
    beds.filter((b) => !!b.front === front).map((b, i) => <Sticker key={`${front}${i}`} k={b.k} x={b.x} y={b.y} w={b.w} r={b.r} o={b.o ?? 1} s={slam(fi, b.at, 1.25)} />);
  const syms = S2_SYMS.filter((sy) => sy.ph === phase && fi >= sy.at).map((sy, i) => (
    <Sym key={i} k={sy.k} x={sy.x} y={sy.y} size={sy.size} color={sy.ice ? C.ice : C.white} r={(sy.r ?? 0) + 8 * beat} s={slam(fi, sy.at, 1.5) + 0.12 * beat} />
  ));
  return (
    <AbsoluteFill style={{ transform: `scale(${push})` }}>
      <Dots id="s2" color={C.white} opacity={0.06 + 0.05 * beat} ox={dotsOff} oy={dotsOff * 0.5} />
      {bed(false)}
      {phase === 1 ? (
        <>
          {fi >= 61 ? <Img src={SCRIBBLE.src} style={{ position: "absolute", left: 1150, top: 800, width: 560, height: 560 * SCRIBBLE.ar, transform: `rotate(-6deg) scale(${slam(fi, 61, 1.2)})`, opacity: 0.9 }} /> : null}
          {syms}
          {fi >= T.no1 ? <NoTag x={150 - 14 * recoil(T.sugar)} y={170} r={-6} s={slam(fi, T.no1, 1.2, 3) - 0.05 * recoil(T.sugar)} /> : null}
          {fi >= T.sugar ? (
            <Line text="Sugar." font={FONT.black} size={440} color={C.white} x={430} y={330} scale={sugar.s + 0.02 * beat} ghosts={sugar.ghosts} split={(fi < T.sugar + 3 ? 11 : 0) + 7 * pulse(fi, [56, 70], 5)} shadow />
          ) : null}
        </>
      ) : null}
      {phase === 2 ? (
        <>
          {syms}
          {fi >= T.plastic ? (
            <>
              {panel.ghosts.map((g, i) => (
                <React.Fragment key={i}>{panelBody(g.s, g.o)}</React.Fragment>
              ))}
              {panelBody(panel.s)}
              {fi >= T.plastic + 2 ? (
                <>
                  <TapeStrip x={120} y={200} w={270} r={-32} s={slam(fi, T.plastic + 2, 1.2)} />
                  <TapeStrip x={1560} y={200} w={270} r={28} s={slam(fi, T.plastic + 2, 1.2)} />
                </>
              ) : null}
            </>
          ) : null}
          {bed(true)}
          <NoTag x={1790 + 14 * recoil(T.plastic)} y={36 - 8 * recoil(T.plastic)} r={5} s={slam(fi, T.no2, 1.2, 3) - 0.05 * recoil(T.plastic)} align="right" />
        </>
      ) : null}
      {phase === 3 ? (
        <>
          {syms}
          {fi >= 125 ? <Scrap x={40} y={940} w={220} r={-9} s={slam(fi, 125, 1.3)} /> : null}
          <NoTag x={CX} y={150 - 10 * recoil(T.no3 + 1)} r={-3} s={slam(fi, T.no3, 1.2, 3)} align="center" />
          <Line text="Mercy." font={FONT.black} size={430} color={C.white} x={CX} y={330} align="center" scale={mercy.s + 0.03 * pulse(fi, [125], 6)} ghosts={mercy.ghosts} split={fi < T.no3 + 4 ? 9 : 0} shadow />
        </>
      ) : null}
    </AbsoluteFill>
  );
};

/** 132-152 · PULL-BACK REVEAL then CRASH.
 *  132 holds S2's exact last framing (same bed, same push, same "NO Mercy.") so the cut is invisible.
 *  The camera then kicks back in 3 stepped zoom-outs (133 / 138 / 143). The collage already lives in
 *  the world AROUND the word, placed fully outside the 132 frame (item extents included), so each
 *  pull-back reveals a new ring entering from the edges: nothing ever pops in. 147: everything
 *  crashes to the centre while "NO Mercy." punches forward, compresses, and stays whole and readable
 *  on a dark backing until the hard cut to the drop at 152. */
const MERCY_C = { x: CX, y: 545 }; // visual centre of the S2 "Mercy." line (top 330, 430px)
/** rough half-extent of a world item (px, at world size), rotation-safe */
const itemExt = (it: Item, size: number) => {
  if (it.kind === "cut") {
    const w = size;
    const h = size * CUT_SRC[it.cut].ar;
    return 0.5 * Math.sqrt(w * w + h * h) + 14;
  }
  if (it.kind === "scrap") {
    const w = size * 1.6;
    const h = w * SCRAP_AR;
    return 0.5 * Math.sqrt(w * w + h * h);
  }
  if (it.kind === "sym") return size * 0.6;
  return size * 0.62 + 10; // blackletter glyph + its hard shadow
};
const WORLD_ITEMS = ITEMS.filter((it) => it.kind !== "mercy").map((it, k) => {
  const size = it.size * 2.2;
  const ext = itemExt(it, size);
  let dx = (it.x0 - CX) * 2.3;
  let dy = (it.y0 - MERCY_C.y) * 2.3;
  // the 132 frame (zoom >= 1) spans |dx| < 960, dy in [-545, 535]: anything that would show any part
  // of itself there is pushed just past its nearest edge, so the first pull-back reveals it
  const limX = 960 + ext + 24;
  const limY = 545 + ext + 24;
  if (Math.abs(dx) < limX && Math.abs(dy) < limY) {
    const extra = random(`wpush${k}`) * 220;
    if ((limX - Math.abs(dx)) / limX < (limY - Math.abs(dy)) / limY) dx = Math.sign(dx || 1) * (limX + extra);
    else dy = Math.sign(dy || 1) * (limY + extra * 0.6);
  }
  return { it, dx, dy, size };
});
const ZOOM_STEPS = [
  { at: 133, z: 0.76 },
  { at: T.g1, z: 0.58 },
  { at: T.g2, z: 0.44 },
];
const camZoom = (fi: number, lag = 0) => {
  let z = 1;
  for (const st of ZOOM_STEPS) z = lerp(z, st.z, pm(fi, st.at, 4, E.out, lag));
  return z;
};
/** crash radius factor: 1 = in place, 0 = at the word's centre */
const crashR = (fi: number, lag = 0) => {
  if (fi < T.g3) return 1;
  if (fi < 150) return lerp(1, 0.3, pm(fi, T.g3, 3, E.in, lag));
  return lerp(0.3, 0.12, pm(fi, 150, 2, E.in, lag));
};
/** the word's crash factor: 1 = whole, -> 0.34 on 147, -> ~0 on 150 (gone by the 152 cut) */
const wordCrash = (fi: number, lag = 0) => {
  if (fi < T.g3) return 1;
  if (fi < 150) return lerp(1, 0.34, pm(fi, T.g3, 3, E.in, lag));
  return lerp(0.34, 0.03, pm(fi, 150, 2, E.in, lag));
};
const S3 = (fi: number) => {
  const base = S2_END_PUSH();
  const zz = base * camZoom(fi);
  const push = lerp(1, 1.12, pm(fi, T.g3, 5, E.in)); // camera leans into the crash
  const cr = crashR(fi);
  // the word: rides the pull-back (identical to v6 up to 146), then CRASHES to the centre with
  // everything else on the same steps (147 / 150), deforming as it goes: pinched narrow, stretched
  // tall, skewed + twisted, chroma split opening up.
  const wc = wordCrash(fi);
  const wordT = (c: number) => {
    const k = 1 - c;
    return `rotate(${7 * k}deg) skewX(${-14 * k}deg) scale(${zz * c * (1 - 0.4 * k)}, ${zz * c * (1 + 0.45 * k)})`;
  };
  const wordGhosts = fi >= T.g3 ? smearOf(Math.abs(wordCrash(fi, HOLD) - wc) * 900, 2) : [];
  const zoomGhosts = fi >= 133 && fi < T.g3 ? smearOf(Math.abs(camZoom(fi, HOLD) - camZoom(fi)) * 1100, 3) : [];
  const crashGhosts = fi >= T.g3 ? smearOf(Math.abs(crashR(fi, HOLD) - cr) * 1000, 2) : [];
  const glow = pm(fi, 146, 6, E.in);
  const ringR = fi >= T.g3 ? lerp(640, 120, pm(fi, T.g3, 5, E.in)) : 0;
  const itemsAt = (z: number, c: number) =>
    WORLD_ITEMS.map(({ it, dx, dy, size }, i) => {
      const sx = MERCY_C.x + dx * z * c;
      const sy = MERCY_C.y + dy * z * c;
      const sc = (size / it.size) * z * lerp(0.4, 1, c);
      // cull what is far outside the frame
      if (sx < -500 || sx > W + 500 || sy < -500 || sy > H + 500) return null;
      return <ItemView key={i} it={it} x={sx} y={sy} sc={sc} rot={it.rot * (0.4 + 0.6 * c) + it.spin * (1 - c) * 5} />;
    });
  // S2's own "No Mercy." bed rides the same camera (and crashes with everything else)
  const bedS = zz * lerp(0.4, 1, cr) * (fi >= T.g3 ? cr : 1);
  return (
    <AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: `${MERCY_C.x}px ${MERCY_C.y}px` }}>
      <Dots id="s3" color={C.white} opacity={0.06 + 0.05 * pulse(fi, BEATS, 6)} ox={beatAdv(fi, BEATS) * 9} oy={beatAdv(fi, BEATS) * 4.5} />
      <div
        style={{
          position: "absolute",
          left: CX - 500,
          top: MERCY_C.y - 500,
          width: 1000,
          height: 1000,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.iceFlash}${Math.round(glow * 150).toString(16).padStart(2, "0")} 0%, transparent 45%)`,
        }}
      />
      <AbsoluteFill style={{ transform: `scale(${bedS})`, transformOrigin: `${CX}px ${H / 2}px` }}>{S2_MERCY_BED(fi)}</AbsoluteFill>
      {/* the world: pull-back ghosts, then the crash ghosts, then the sharp pose */}
      {zoomGhosts.map((g, k) => (
        <AbsoluteFill key={`zg${k}`} style={{ opacity: g.o, filter: GHOST_FILTER }}>
          {itemsAt(base * camZoom(fi, g.lag), 1)}
        </AbsoluteFill>
      ))}
      {crashGhosts.map((g, k) => (
        <AbsoluteFill key={`cg${k}`} style={{ opacity: g.o * 0.6, filter: GHOST_FILTER }}>
          {itemsAt(zz, crashR(fi, g.lag))}
        </AbsoluteFill>
      ))}
      <AbsoluteFill>{itemsAt(zz, cr)}</AbsoluteFill>
      {ringR > 0 ? (
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
          <circle cx={MERCY_C.x} cy={MERCY_C.y} r={ringR} fill="none" stroke={C.ice} strokeWidth={3} opacity={0.85} />
          <circle cx={MERCY_C.x} cy={MERCY_C.y} r={ringR * 0.6} fill="none" stroke={C.ice} strokeWidth={2} opacity={0.5} strokeDasharray="10 14" />
        </svg>
      ) : null}
      {/* the words: on top, on a dark backing through the pull-back; from 147 they crash + deform */}
      {wordGhosts.map((g, k) => (
        <div key={`wg${k}`} style={{ position: "absolute", inset: 0, opacity: g.o, filter: GHOST_FILTER, transform: wordT(wordCrash(fi, g.lag)), transformOrigin: `${MERCY_C.x}px ${MERCY_C.y}px` }}>
          <NoTag x={CX} y={150} r={-3} s={1} align="center" />
          <Line text="Mercy." font={FONT.black} size={430} color={C.white} x={CX} y={330} align="center" />
        </div>
      ))}
      <div style={{ position: "absolute", inset: 0, transform: wordT(wc), transformOrigin: `${MERCY_C.x}px ${MERCY_C.y}px` }}>
        <div
          style={{
            position: "absolute",
            left: MERCY_C.x - 880,
            top: MERCY_C.y - 520,
            width: 1760,
            height: 940,
            borderRadius: "50%",
            opacity: 0.55,
            background: "radial-gradient(ellipse at center, rgba(11,11,12,0.94) 0%, rgba(11,11,12,0.8) 48%, rgba(11,11,12,0) 72%)",
          }}
        />
        <NoTag x={CX} y={150} r={-3} s={1} align="center" />
        <Line text="Mercy." font={FONT.black} size={430} color={C.white} x={CX} y={330} align="center" split={12 * (1 - wc)} shadow />
      </div>
    </AbsoluteFill>
  );
};

/** 152-206 · DROP: skull lands where everything converged; the collage bursts back out. */
const S4 = (fi: number) => {
  const bang = pulse(fi, [166, 179, 193], 7);
  const land = (lag: number) => lerp(1.45, 1, ps(fi, T.drop, 7, E.over, lag)) + 0.035 * bang;
  const split = 24 * (1 - ps(fi, T.drop, 5, E.out, 0, 1)) + 6 * bang + 1.5;
  const ring = ps(fi, T.drop, 18, E.out, 0, 1);
  const burst = (lag: number) => pm(fi, T.drop, 24, E.out, lag);
  const t = fi - T.drop;
  const landGhosts = t < 8 ? smearOf(Math.abs(land(HOLD) - land(0)) * 540, 4) : [];
  const burstGhosts = t < 24 ? smearOf(Math.abs(burst(HOLD) - burst(0)) * 900, 3) : [];
  const fade = 1 - ps(fi, T.drop + 8, 16, E.in);
  const debris = (lag: number) =>
    ITEMS.map((it, i) => {
      const b = burst(lag);
      const r = Math.max(60, it.r0) * (0.04 + 1.9 * b);
      const sc = (0.25 + 1.0 * b) * (it.kind === "mercy" ? 0.3 : 1);
      return <ItemView key={i} it={it} x={CX + Math.cos(it.ang) * r} y={CY + Math.sin(it.ang) * r * 0.85} sc={sc} rot={it.rot + it.spin * b * 12} o={fade} />;
    });
  const SL = CX - 30 - 540;
  const ST = CY + 6 - 438;
  return (
    <AbsoluteFill>
      <Rays cx={CX - 30} cy={CY} rot={beatAdv(fi, BEATS) * 3.2} color={C.ice} opacity={0.07 + 0.07 * pulse(fi, BEATS, 8)} />
      <Dots id="s4" color={C.ice} opacity={0.1} spacing={22} r={2.6} />
      {t < 20 ? (
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
          <circle cx={CX - 30} cy={CY} r={40 + 1400 * ring} fill="none" stroke={C.ice} strokeWidth={lerp(46, 2, ring)} opacity={1 - ring} />
        </svg>
      ) : null}
      {t < 26 ? <Smeared ghosts={burstGhosts} render={(lag) => <AbsoluteFill>{debris(lag)}</AbsoluteFill>} /> : null}
      {landGhosts.map((g, i) => (
        <div key={i} style={{ position: "absolute", inset: 0, transform: `scale(${land(g.lag)})`, transformOrigin: `${CX - 30}px ${CY}px`, opacity: g.o, filter: GHOST_FILTER }}>
          <Skull left={SL} top={ST} width={1080} fill={C.white} />
        </div>
      ))}
      <div style={{ position: "absolute", inset: 0, transform: `${boilT(boilAt(fi, "skull", 2.2, 0.3))} translateY(${6 * bang}px) scale(${land(0)})`, transformOrigin: `${CX - 30}px ${CY}px` }}>
        {split > 0.4 ? (
          <>
            <Skull left={SL - split} top={ST + split * 0.25} width={1080} fill={C.red} opacity={0.9} blend="screen" />
            <Skull left={SL + split} top={ST - split * 0.25} width={1080} fill={C.ice} opacity={0.9} blend="screen" />
          </>
        ) : null}
        <Skull left={SL} top={ST} width={1080} fill={C.white} />
      </div>
    </AbsoluteFill>
  );
};

/** 199-252 · CUTOUT-STACK transition -> 100% MOUNTAIN WATER collage.
 *  Pieces slam over the skull on every step (199/201/203/205) and ARE the next scene. */
const S6 = (fi: number) => {
  const ba = beatAdv(fi, BEATS);
  const drift = 1 + 0.05 * ps(fi, T.bar2, 46, E.in);
  const mtRise = lerp(300, 0, pm(fi, 213, 8, E.out));
  const canY = (lag: number) => lerp(760, 0, ps(fi, T.can, 8, E.over, lag, 1));
  const canGhosts = fi >= T.can ? smearOf(Math.abs(canY(HOLD) - canY(0)), 6) : [];
  const canH = 860;
  const p1 = slamPiece(fi, T.stack, 680);
  const p2 = slamPiece(fi, T.stack + 2, 630);
  const PAPER_W = 1360;
  const paper = (s: number, o?: number) => (
    <div
      style={{
        position: "absolute",
        left: -70,
        top: 70,
        width: PAPER_W,
        height: PAPER_W * SCRAP_AR,
        transform: `${boilT(boilAt(fi, "paper100", 1.6, 0.25))} rotate(-5deg) scale(${s})`,
        opacity: o ?? 1,
        filter: o !== undefined ? GHOST_FILTER : "drop-shadow(14px 16px 0 rgba(0,0,0,0.6))",
      }}
    >
      <Img src={A.scrap} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      {o === undefined && fi >= T.bar2 ? <Line text="100%" font={FONT.slab} size={400} color={C.bg} x={170} y={110} scale={slam(fi, T.bar2, 1.14, 5)} /> : null}
    </div>
  );
  return (
    <AbsoluteFill style={{ transform: `scale(${drift})` }}>
      {fi >= 213 ? <Img src={A.mountains} style={{ position: "absolute", left: -96 - ba * 6, top: 360 + mtRise, width: 2112, height: 1184, opacity: 0.9 }} /> : null}
      {fi >= T.stack + 2 ? (
        <>
          {p2.ghosts.map((g, i) => (
            <Sticker key={i} k="mtn" x={560} y={590} w={1260} r={3} s={g.s} o={g.o} ghost />
          ))}
          <Sticker k="mtn" x={560} y={590} w={1260} r={3} s={p2.s} />
        </>
      ) : null}
      {fi >= T.stack ? (
        <>
          {p1.ghosts.map((g, i) => (
            <React.Fragment key={i}>{paper(g.s, g.o)}</React.Fragment>
          ))}
          {paper(p1.s)}
        </>
      ) : null}
      {fi >= T.stack + 4 ? <Tape y={850} angle={-6} text="MOUNTAIN WATER  ✕  100%  ✕  " h={104} offset={(ba * 92) % 880} s={slam(fi, T.stack + 4, 1.12, 4)} /> : null}
      {fi >= T.stack + 6 ? (
        <>
          <Sticker k="skull" x={30} y={760} w={290} r={-10} s={slam(fi, T.stack + 6, 1.3)} />
          <Sticker k="can_b" x={1400} y={24} w={165} r={-8} s={slam(fi, T.stack + 6, 1.3)} />
          <Sym k="burst" x={1840} y={420} size={130} color={C.ice} s={slam(fi, T.stack + 6, 1.5)} r={10 * pulse(fi, BEATS, 6)} />
          <Sym k="asterisk" x={1640} y={140} size={80} color={C.white} s={slam(fi, T.stack + 6, 1.5)} />
          <Sym k="star4" x={420} y={760} size={80} color={C.ice} s={slam(fi, T.stack + 6, 1.5)} />
        </>
      ) : null}
      {fi >= T.can ? (
        <>
          {canGhosts.map((g, i) => (
            <div key={i} style={{ position: "absolute", inset: 0, transform: `translateY(${canY(g.lag)}px)`, opacity: g.o, filter: GHOST_FILTER }}>
              <Can cx={1640} bottom={1010} h={canH} rot={4} shadow={false} />
            </div>
          ))}
          <div style={{ position: "absolute", inset: 0, transform: `translateY(${canY(0)}px)` }}>
            <Can cx={1640} bottom={1010} h={canH} rot={4 - 3 * pulse(fi, [233, 247], 6)} />
          </div>
        </>
      ) : null}
    </AbsoluteFill>
  );
};

/** 238-316 · DON'T BE SCARED / IT'S JUST WATER over a halftone skull; stepped dive into the socket. */
const S7 = (fi: number) => {
  const ox = 1300;
  const oy = 430;
  const zoomAt = (lag: number) => {
    const d = pm(fi, T.push, 18, E.in, lag);
    return (1 + 0.1 * ps(fi, T.tear, 60, E.in)) * lerp(1, 26, d * d);
  };
  const z0 = zoomAt(0);
  const diveGhosts = fi >= T.push ? smearOf(Math.abs(zoomAt(HOLD) - z0) * 180, 4) : [];
  const textOut = ps(fi, 304, 8, E.in, 0, 1);
  const dotPulse = pulse(fi, [281, 300], 9);
  const skullAt = (lag: number, id: string, o: number) => {
    const k = 1.5 * zoomAt(lag);
    return <SkullInFrame id={id} left={ox - (712 - SKV.x) * k} top={oy - (505 - SKV.y) * k} k={k} fill={C.ice} opacity={o} halftone={{ spacing: 14, r: 4.6 + 1.4 * dotPulse }} />;
  };
  return (
    <AbsoluteFill>
      {diveGhosts.map((g, i) => (
        <AbsoluteFill key={i} style={{ filter: GHOST_FILTER }}>
          {skullAt(g.lag, `s7g${i}`, 0.5 * g.o)}
        </AbsoluteFill>
      ))}
      {skullAt(0, "s7", 0.5)}
      <AbsoluteFill style={{ transform: `scale(${1 + 0.6 * textOut})`, opacity: 1 - textOut, transformOrigin: "40% 50%" }}>
        <Words fi={fi} words={[{ w: "Don't", at: T.scared }, { w: "be", at: T.scared + 3 }, { w: "scared.", at: T.scared + 6 }]} font={FONT.black} size={250} color={C.white} x={110} y={140} gap={0.22} />
        <Words fi={fi} words={[{ w: "It's", at: T.water }, { w: "just", at: T.water + 3 }, { w: "water.", at: T.water + 6 }]} font={FONT.black} size={250} color={C.ice} x={1810} y={600} align="right" gap={0.22} splitFirst={8} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** 316-376 · THE CONTRACT: aged scorched sheet taped over a collage bed, blackletter header, blood-red
 *  signature with drips, red wax SKULL SEAL slams on 357 with splatter (the splat reveal bursts from it). */
const PANEL = { left: 640, top: 90, w: 1000, h: 900, rot: -4 };
const SEAL_LOCAL = { x: 770, y: 690, r: 145 };
const SEAL_SCREEN = (() => {
  const a = (PANEL.rot * Math.PI) / 180;
  const dx = SEAL_LOCAL.x - PANEL.w / 2;
  const dy = SEAL_LOCAL.y - PANEL.h / 2;
  return { x: PANEL.left + PANEL.w / 2 + dx * Math.cos(a) - dy * Math.sin(a), y: PANEL.top + PANEL.h / 2 + dx * Math.sin(a) + dy * Math.cos(a) };
})();
const STAMP_CENTER = SEAL_SCREEN;
const SEAL_RIM = (() => {
  const n = 44;
  const p: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = 118 * (1 + (random(`seal-${i}`) - 0.5) * 0.12 + (i % 7 === 0 ? 0.07 : 0));
    p.push(`${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`);
  }
  return `M${p.join(" L")} Z`;
})();
const SEAL = { wax: "#A8291F", deep: "#761A14", lite: "#D2574A", text: "#F2C9C0" };
const WaxSeal: React.FC<{ size: number }> = ({ size }) => {
  const k = 150 / SKV.w; // skull fits ~150 units wide inside the seal
  return (
    <svg viewBox="-135 -135 270 270" width={size} height={size} style={{ overflow: "visible" }}>
      <defs>
        <path id="sealArc" d="M -96 0 A 96 96 0 1 1 96 0 A 96 96 0 1 1 -96 0" />
      </defs>
      <path d={SEAL_RIM} fill={SEAL.deep} transform="translate(6 7)" opacity={0.6} />
      <path d={SEAL_RIM} fill={SEAL.wax} />
      <circle r={84} fill="none" stroke={SEAL.deep} strokeWidth={7} />
      <circle r={108} fill="none" stroke={SEAL.lite} strokeWidth={2} opacity={0.5} />
      <g transform={`translate(${-SKV.w * k * 0.5 - 4} ${-SKV.h * k * 0.5 - 4}) scale(${k}) translate(${-SKV.x} ${-SKV.y})`}>
        <path d={LD_SKULL_D} fillRule="evenodd" fill={SEAL.lite} opacity={0.55} />
      </g>
      <g transform={`translate(${-SKV.w * k * 0.5} ${-SKV.h * k * 0.5}) scale(${k}) translate(${-SKV.x} ${-SKV.y})`}>
        <path d={LD_SKULL_D} fillRule="evenodd" fill={SEAL.deep} />
      </g>
      <text fontFamily={FONT.slab} fontSize={21} letterSpacing="3" fill={SEAL.text}>
        <textPath href="#sealArc">SOLD · SOLD · SOLD · SOLD · SOLD · SOLD ·</textPath>
      </text>
    </svg>
  );
};
const S8 = (fi: number) => {
  const enter = (lag: number) => lerp(0.82, 1, ps(fi, T.bar4, 8, E.over, lag));
  const enterGhosts = fi < T.bar4 + 8 ? smearOf(Math.abs(enter(HOLD) - enter(0)) * 470, 4) : [];
  const drift = 1 + 0.04 * ps(fi, T.bar4, 56, E.in);
  const push = lerp(1, 1.08, ps(fi, 350, 14, E.in, 0, 1));
  const lines = [0.94, 0.8, 0.88, 0.62, 0.9, 0.72];
  const sig = ps(fi, T.sig, 8, E.out, 0, 1);
  const seal = slamS(fi, T.stamp, 2.3, 4, 150);
  const spl = ps(fi, T.stamp, 4, E.out, 0, 1);
  const clip = tornRect("contract", 1.2, 26);
  const panel = (s: number, ghost: boolean) => (
    <div
      style={{
        position: "absolute",
        left: PANEL.left,
        top: PANEL.top,
        width: PANEL.w,
        height: PANEL.h,
        transform: `${boilT(boilAt(fi, "contract", 1.4, 0.2))} rotate(${PANEL.rot}deg) scale(${s})`,
        transformOrigin: "50% 50%",
        filter: ghost ? GHOST_FILTER : "drop-shadow(20px 24px 0 rgba(0,0,0,0.7))",
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: C.paper, clipPath: clip }} />
      {!ghost ? (
        <>
          <Img src={A.scrap} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", clipPath: clip, mixBlendMode: "multiply", opacity: 0.8 }} />
          <PaperGrain id="contract" clip={clip} opacity={0.3} />
          {/* scorch: burnt, aged edges */}
          <div style={{ position: "absolute", inset: 0, clipPath: clip, background: "radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 52%, rgba(52,26,10,0.42) 80%, rgba(20,9,3,0.85) 100%)", mixBlendMode: "multiply" }} />
          <div style={{ position: "absolute", left: 62, top: 26, fontFamily: FONT.black, fontSize: 168, color: C.bg, lineHeight: 1 }}>Contract</div>
          <div style={{ position: "absolute", left: 70, top: 222, fontFamily: FONT.slab, fontSize: 78, letterSpacing: "0.04em", color: C.bg, lineHeight: 1 }}>SELL YOUR SOUL.</div>
          <div style={{ position: "absolute", left: 72, top: 318, width: 840, fontFamily: FONT.body, fontSize: 21, letterSpacing: "0.12em", color: C.bg, lineHeight: 1.45 }}>
            THE UNDERSIGNED HEREBY SURRENDERS ONE (1) SOUL. BINDING FOR ALL ETERNITY. NO REFUNDS.
          </div>
          {lines.map((w, i) => {
            const p = ps(fi, 322 + i * 3, 4, E.out, 0, 1);
            return <div key={i} style={{ position: "absolute", left: 74, top: 420 + i * 34, width: 820 * w * p, height: 12, background: C.bg, opacity: 0.8 }} />;
          })}
          <div style={{ position: "absolute", left: 74, top: 700, fontFamily: FONT.slab, fontSize: 70, color: C.bg }}>X</div>
          <div style={{ position: "absolute", left: 130, top: 760, width: 500, height: 4, background: C.bg }} />
          {sig > 0 ? (
            <Img src={SIG_RED.src} style={{ position: "absolute", left: 140, top: 610, width: 460, height: 460 * SIG_RED.ar, clipPath: `inset(0 ${(1 - sig) * 100}% 0 0)`, transform: "rotate(-4deg)" }} />
          ) : null}
          {[210, 335, 470].map((x, i) => {
            const d = ps(fi, 347 + i * 3, 10, E.out, 0, 1);
            if (d <= 0) return null;
            const len = [56, 84, 44][i] * d;
            return (
              <div key={i} style={{ position: "absolute", left: x, top: 744 - 4 * i, width: 9, height: len, background: C.red, borderRadius: "0 0 6px 6px" }}>
                <div style={{ position: "absolute", left: -3, bottom: -7, width: 15, height: 15, borderRadius: "50%", background: C.red }} />
              </div>
            );
          })}
          {fi >= T.stamp ? (
            <div
              style={{
                position: "absolute",
                left: SEAL_LOCAL.x - 260,
                top: SEAL_LOCAL.y - 230,
                width: 520,
                height: 460,
                background: C.red,
                opacity: 0.85,
                WebkitMaskImage: `url(${A.splat})`,
                maskImage: `url(${A.splat})`,
                WebkitMaskSize: "100% 100%",
                maskSize: "100% 100%",
                transform: `scale(${lerp(0.5, 1, spl)}) rotate(160deg)`,
                mixBlendMode: "multiply",
              }}
            />
          ) : null}
          {fi >= T.stamp ? (
            <>
              {seal.ghosts.map((g, i) => (
                <div key={i} style={{ position: "absolute", left: SEAL_LOCAL.x - SEAL_LOCAL.r, top: SEAL_LOCAL.y - SEAL_LOCAL.r, transform: `scale(${g.s}) rotate(-12deg)`, opacity: g.o, filter: GHOST_FILTER }}>
                  <WaxSeal size={SEAL_LOCAL.r * 2} />
                </div>
              ))}
              <div style={{ position: "absolute", left: SEAL_LOCAL.x - SEAL_LOCAL.r, top: SEAL_LOCAL.y - SEAL_LOCAL.r, transform: `scale(${seal.s}) rotate(-12deg)`, filter: "drop-shadow(5px 7px 0 rgba(0,0,0,0.45))" }}>
                <WaxSeal size={SEAL_LOCAL.r * 2} />
              </div>
            </>
          ) : null}
          {fi >= T.bar4 + 4 ? (
            <>
              <TapeStrip x={-60} y={-24} w={300} r={-32} s={slam(fi, T.bar4 + 4, 1.2)} />
              <TapeStrip x={800} y={-14} w={280} r={27} s={slam(fi, T.bar4 + 4, 1.2)} />
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
  return (
    <AbsoluteFill style={{ transform: `scale(${drift * push})`, transformOrigin: `${SEAL_SCREEN.x}px ${SEAL_SCREEN.y}px` }}>
      {fi >= T.bar4 + 2 ? <Sticker k="face" x={20} y={150} w={760} r={-6} s={slam(fi, T.bar4 + 2, 1.2)} /> : null}
      {fi >= 329 ? <Sticker k="skull" x={1660} y={760} w={230} r={12} s={slam(fi, 329, 1.3)} /> : null}
      {fi >= 329 ? <Sym k="bones" x={1790} y={170} size={110} color={C.white} s={slam(fi, 329, 1.5)} /> : null}
      {fi >= 336 ? <Sym k="star4" x={560} y={110} size={74} color={C.ice} s={slam(fi, 336, 1.5)} /> : null}
      {fi >= 343 ? <Sym k="asterisk" x={520} y={970} size={80} color={C.white} s={slam(fi, 343, 1.5)} /> : null}
      {enterGhosts.map((g, i) => (
        <div key={i} style={{ position: "absolute", inset: 0, opacity: g.o }}>
          {panel(enter(g.lag), true)}
        </div>
      ))}
      {panel(enter(0), false)}
    </AbsoluteFill>
  );
};

/** 364-424 · DEATH TO PLASTIC on paper: xeroxed bottle + red X, spray dust; slice-shatter out. */
const S9 = (fi: number) => {
  const xa = ps(fi, T.x1, 3, E.out, 0, 1);
  const xb = ps(fi, T.x2, 3, E.out, 0, 1);
  const inverted = (fi >= T.inv && fi < T.inv + 2) || (fi >= T.inv + 4 && fi < T.inv + 5);
  const shat = ps(fi, T.shatter, 4, E.in, 0, 1);
  const plastic = slamS(fi, T.bar5 + 4, 1.24, 5, 620);
  const death = slamS(fi, T.bar5, 1.18, 4, 420);
  const bottleS = slam(fi, T.bottle, 1.2);
  const content = (
    <AbsoluteFill style={{ background: C.paper, filter: inverted ? "invert(1)" : undefined }}>
      <PaperGrain id="s9paper" opacity={0.18} />
      <Dots id="s9" color={C.ice} opacity={0.55} spacing={20} r={3.4} />
      {fi >= T.bar5 + 4 ? <Img src={A.dust} style={{ position: "absolute", left: 120, top: 420, width: 1500, opacity: 0.5, transform: `scale(${slam(fi, T.bar5 + 4, 1.15)})` }} /> : null}
      {fi >= T.bar5 ? <Line text="Death to" font={FONT.black} size={300} color={C.bg} x={110} y={110} scale={death.s} ghosts={death.ghosts} /> : null}
      {fi >= T.bar5 + 4 ? <Line text="Plastic." font={FONT.black} size={380} color={C.red} x={110} y={470} scale={plastic.s} ghosts={plastic.ghosts} /> : null}
      {fi >= T.bottle ? (
        <div style={{ position: "absolute", left: 1400, top: 150, width: 380, height: 790, transform: `${boilT(boilAt(fi, "bottle9", 1.6, 0.4))} scale(${bottleS}) rotate(6deg)` }}>
          <Img src={CUT_SRC.bottle.src} style={{ position: "absolute", left: 0, top: 0, width: 380, height: 380 * CUT_SRC.bottle.ar, filter: "drop-shadow(9px 11px 0 rgba(0,0,0,0.35))" }} />
          {fi >= T.bottle + 2 ? <TapeStrip x={70} y={-30} w={240} r={-8} s={slam(fi, T.bottle + 2, 1.2)} /> : null}
          <svg width={380} height={790} viewBox="0 0 380 790" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <line x1={-30} y1={20} x2={-30 + 440 * xa} y2={20 + 760 * xa} stroke={C.red} strokeWidth={40} strokeLinecap="round" />
            <line x1={410} y1={20} x2={410 - 440 * xb} y2={20 + 760 * xb} stroke={C.red} strokeWidth={40} strokeLinecap="round" />
          </svg>
        </div>
      ) : null}
    </AbsoluteFill>
  );
  if (shat <= 0) return content;
  const bands = 9;
  return (
    <AbsoluteFill>
      {new Array(bands).fill(0).map((_, b) => {
        const dir = b % 2 === 0 ? 1 : -1;
        const off = dir * (80 + random(`band-${b}`) * 520) * shat;
        const top = (b / bands) * H;
        return (
          <AbsoluteFill key={b} style={{ clipPath: `inset(${top}px 0 ${H - top - H / bands}px 0)`, transform: `translateX(${off}px)`, opacity: 1 - 0.3 * shat }}>
            {content}
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

/** 424-537 · SMASH: stacked wordmark; at 479 it's pushed left as the can slides in; tagline. */
const S10 = (fi: number) => {
  const kick = pulse(fi, [438, 452, 465, 520], 7);
  const landAt = (lag: number) => lerp(1.55, 1, ps(fi, T.smash, 6, E.over, lag));
  const riseAt = (lag: number) => pm(fi, T.bar7, 8, E.inOut, lag);
  const markScale = (lag: number) => (landAt(lag) + 0.025 * kick) * lerp(1, 0.62, riseAt(lag));
  const markX = (lag: number) => lerp(CX, 720, riseAt(lag));
  const markY = (lag: number) => lerp(CY, 350, riseAt(lag));
  const canX = (lag: number) => lerp(2400, 1360, ps(fi, T.bar7, 10, E.over, lag, 1));
  const split = 26 * (1 - ps(fi, T.smash, 6, E.out, 0, 1)) + 5 * kick;
  const push = 1 + 0.06 * ps(fi, T.smash, 113, E.in);
  const antic = 1 + 0.03 * ps(fi, 528, 9, E.in, 0, 1);
  const burst = ps(fi, T.smash, 18, E.out, 0, 1);
  const markDist = Math.hypot(markX(HOLD) - markX(0), markY(HOLD) - markY(0)) + Math.abs(markScale(HOLD) - markScale(0)) * 430;
  const markGhosts = fi < T.smash + 8 || (fi >= T.bar7 && fi < T.bar7 + 10) ? smearOf(markDist, 5) : [];
  const canBoil = boilAt(fi, "can3d", 1.4, 1);
  const words = [
    { w: "MURDER", at: T.tag },
    { w: "YOUR", at: T.tag + 4 },
    { w: "THIRST.", at: T.tag + 8 },
  ];
  const ul = ps(fi, 497, 8, E.out, 0, 1);
  const mark = (lag: number, ghost: boolean) => (
    <div style={{ position: "absolute", inset: 0, transform: `${boilT(boilAt(fi, "wordmark", 1.6, 0.25))} scale(${markScale(lag)})`, transformOrigin: `${markX(lag)}px ${markY(lag)}px` }}>
      {!ghost && split > 0.5 ? (
        <>
          <StackMark cx={markX(lag) - split} cy={markY(lag)} width={860} fill={C.red} opacity={0.9} blend="screen" />
          <StackMark cx={markX(lag) + split} cy={markY(lag)} width={860} fill={C.ice} opacity={0.9} blend="screen" />
        </>
      ) : null}
      <StackMark cx={markX(lag)} cy={markY(lag)} width={860} fill={C.white} />
    </div>
  );
  return (
    <AbsoluteFill style={{ transform: `scale(${push * antic})` }}>
      <Rays cx={lerp(CX, 1040, riseAt(0))} cy={lerp(CY, 430, riseAt(0))} rot={beatAdv(fi, BEATS) * 2.6} color={C.ice} opacity={(0.06 + 0.07 * kick) * (1 - 0.4 * riseAt(0))} />
      {fi < T.smash + 18
        ? new Array(14).fill(0).map((_, i) => {
            const a = (i / 14) * Math.PI * 2 + random(`sm-a${i}`);
            const r = 120 + 1300 * burst * (0.6 + random(`sm-r${i}`) * 0.6);
            const w = 140 + random(`sm-w${i}`) * 180;
            return (
              <Img
                key={i}
                src={A.scrap}
                style={{
                  position: "absolute",
                  left: CX + Math.cos(a) * r,
                  top: CY + Math.sin(a) * r * 0.7,
                  width: w,
                  height: w * SCRAP_AR,
                  transform: `translate(-50%,-50%) rotate(${(random(`sm-rt${i}`) - 0.5) * 140 * burst}deg)`,
                  opacity: 1 - ps(fi, T.smash + 8, 10, E.in),
                }}
              />
            );
          })
        : null}
      {markGhosts.map((g, i) => (
        <AbsoluteFill key={i} style={{ opacity: g.o, filter: GHOST_FILTER }}>
          {mark(g.lag, true)}
        </AbsoluteFill>
      ))}
      {mark(0, false)}
      {fi >= T.bar7 ? (
        <>
          {/* contact shadow */}
          <div
            style={{
              position: "absolute",
              left: canX(0) - 170,
              top: 768,
              width: 340,
              height: 46,
              borderRadius: "50%",
              background: "radial-gradient(ellipse at center, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 70%)",
              opacity: ps(fi, T.bar7 + 2, 8, E.out, 0, 1),
            }}
          />
          <LdCan3D
            cx={canX(0) + canBoil.x}
            cy={445 + canBoil.y + 6 * pulse(fi, [493, 520], 6)}
            height={690}
            rotY={lerp(-1.55, -0.34, ps(fi, T.bar7, 12, E.over, 0, 1)) + 0.37 * ps(fi, 491, 46, E.inOut, 0, 1) + canBoil.r * 0.01}
            rotZ={-0.05 + 0.02 * pulse(fi, [493, 520], 6)}
          />
        </>
      ) : null}
      <Words fi={fi} words={words} font={FONT.slab} size={100} color={C.ice} x={CX} y={830} align="center" gap={0.3} tracking="0.05em" from={1.28} underline={ul} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- camera (stepped)
const IMPACTS = [
  { t: T.warn, a: 7, d: 6 },
  { t: 24, a: 6, d: 6 },
  { t: 29, a: 4, d: 4 },
  { t: T.stack, a: 6, d: 4 },
  { t: T.stack + 2, a: 6, d: 4 },
  { t: T.stack + 4, a: 5, d: 4 },
  { t: T.stack + 6, a: 6, d: 4 },
  { t: T.sugar, a: 5, d: 6 },
  { t: T.plastic, a: 6, d: 6 },
  { t: T.no3, a: 6, d: 6 },
  { t: T.drop, a: 16, d: 12 },
  { t: 166, a: 3, d: 6 },
  { t: 179, a: 3, d: 6 },
  { t: 193, a: 3, d: 6 },
  { t: T.can, a: 7, d: 6 },
  { t: T.water, a: 4, d: 6 },
  { t: T.stamp, a: 8, d: 8 },
  { t: T.x1, a: 4, d: 6 },
  { t: T.x2, a: 4, d: 6 },
  { t: T.smash, a: 16, d: 14 },
  { t: 489, a: 6, d: 6 },
];
const shakeAmp = (fi: number) =>
  IMPACTS.reduce((m, i) => (fi >= i.t && fi < i.t + i.d ? Math.max(m, i.a * Math.pow(1 - local(fi, i.t) / i.d, 2)) : m), 0);

// ---------------------------------------------------------------- content
const Content: React.FC = () => {
  const fi = useCurrentFrame();
  const s2 = grid(fi);
  const s3 = grid(fi);
  const amp = shakeAmp(fi);
  const sx = noise2D("shx", s2 * 0.9, 0) * amp + noise2D("cdx", s3 * 0.04, 0) * 5;
  const sy = noise2D("shy", 0, s2 * 0.9) * amp + noise2D("cdy", 0, s3 * 0.04) * 4;

  // tear reveal (S6 -> S7): S6 sits on a REAL torn sheet (mask) ripped away left -> right, white fibre lip
  const tearX = lerp(-300, W + 120, ps(fi, T.tear, 14, E.inOut, 0, 1));
  const tearMask = (x: number): React.CSSProperties => ({
    WebkitMaskImage: `url(${A.tear})`,
    maskImage: `url(${A.tear})`,
    WebkitMaskSize: "2540px 1200px",
    maskSize: "2540px 1200px",
    WebkitMaskPosition: `${x}px -60px`,
    maskPosition: `${x}px -60px`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
  });

  // splat reveal (S8 -> S9): the REAL ink splat grows from the stamp, spray thrown left across the frame
  const z = lerp(0.12, 4.2, ps(fi, T.splat, 12, E.inOut, 0, 1));
  const splatMask = (zz: number): React.CSSProperties => {
    const w = 2400 * zz;
    const h = 1800 * zz;
    const x = STAMP_CENTER.x - 2054 * zz;
    const y = STAMP_CENTER.y - 1014 * zz;
    return {
      WebkitMaskImage: `url(${A.splat})`,
      maskImage: `url(${A.splat})`,
      WebkitMaskSize: `${w}px ${h}px`,
      maskSize: `${w}px ${h}px`,
      WebkitMaskPosition: `${x}px ${y}px`,
      maskPosition: `${x}px ${y}px`,
      WebkitMaskRepeat: "no-repeat",
      maskRepeat: "no-repeat",
    };
  };
  const splatDone = fi >= T.splat + 10;

  return (
    <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px)` }}>
      {fi < T.b1 ? S1(fi) : null}
      {fi >= T.b1 && fi < T.dip ? S2(fi) : null}
      {fi >= T.dip && fi < T.drop ? S3(fi) : null}
      {fi >= T.drop && fi < T.bar2 ? S4(fi) : null}
      {fi >= T.tear && fi < T.bar4 ? S7(fi) : null}
      {fi >= T.stack && fi < T.tear + 14 ? (
        fi >= T.tear ? (
          <>
            <AbsoluteFill style={{ ...tearMask(tearX - 16), background: C.paper }} />
            <AbsoluteFill style={{ ...tearMask(tearX), background: C.bg }}>{S6(fi)}</AbsoluteFill>
          </>
        ) : (
          S6(fi)
        )
      ) : null}
      {fi >= T.bar4 && fi < T.splat + 12 ? S8(fi) : null}
      {fi >= T.splat && fi < T.smash ? (
        splatDone ? (
          S9(fi)
        ) : (
          <>
            <AbsoluteFill style={{ ...splatMask(z * 1.08), background: C.bg }} />
            <AbsoluteFill style={splatMask(z)}>{S9(fi)}</AbsoluteFill>
          </>
        )
      ) : null}
      {fi >= T.smash && fi < CUT ? S10(fi) : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- overlays
const Photocopy: React.FC = () => {
  const fi = useCurrentFrame();
  const s = stepFrame(fi, 2);
  const ox = -Math.floor(random(`pcx-${s}`) * 180);
  const oy = -Math.floor(random(`pcy-${s}`) * 100);
  return <Img src={A.photocopy} style={{ position: "absolute", left: ox, top: oy, width: 2112, height: 1188, mixBlendMode: "screen", opacity: 0.16, pointerEvents: "none" }} />;
};

export const LiquidDeath: React.FC<{ analysis?: boolean }> = ({ analysis = false }) => {
  const fi = useCurrentFrame();
  // drop flash: ramps in 2f before (ear leads eye on the 152 onset), peak 152-153, stepped out
  const dropFlash = fi >= 150 && fi < 160 ? (fi < T.drop ? (fi === 150 ? 0.1 : 0.24) : 0.88 * (1 - ps(fi, T.drop + 1, 6, E.out, 0, 1))) : 0;
  // smash flash: white + xerox streak plate, stepped out
  const smashFlash = fi >= T.smash && fi < T.smash + 7 ? 1 - ps(fi, T.smash + 1, 5, E.out, 0, 1) : 0;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Audio src={staticFile("audio/metal1-ld_1.wav")} />
      {fi < CUT ? <Content /> : null}
      {dropFlash > 0 ? <AbsoluteFill style={{ background: C.iceFlash, opacity: dropFlash }} /> : null}
      {smashFlash > 0 ? (
        <>
          <AbsoluteFill style={{ background: C.white, opacity: smashFlash * 0.55 }} />
          <Img src={A.xerox} style={{ position: "absolute", left: 0, top: 0, width: W, height: H, mixBlendMode: "screen", opacity: smashFlash }} />
        </>
      ) : null}
      {!analysis ? (
        <>
          <Photocopy />
          <Grain opacity={0.07} />
          <AbsoluteFill style={{ mixBlendMode: "screen", opacity: 0.6 }}>
            <Grain opacity={0.1} />
          </AbsoluteFill>
        </>
      ) : null}
      <Vignette opacity={0.35} />
      <Sequence from={CUT} durationInFrames={CAT_EYES_DURATION}>
        <CatEyesEnd tint={C.ice} />
      </Sequence>
    </AbsoluteFill>
  );
};
