/**
 * Local font loader — offline and deterministic.
 *
 * Loads a font file from public/fonts/ via the FontFace API and holds the
 * render (delayRender) until it's ready. No network at render time, so the
 * result is identical in the cloud and on the Windows render machine.
 *
 * Faces are registered with default descriptors (weight 400, style normal) and
 * should be used with fontWeight 400 / fontStyle normal in CSS. The glyphs
 * themselves carry the weight/italic, so the browser never synthesizes fakes.
 *
 * Usage (module top level):
 *   const RAP = loadLocalFont("RapAnton", "Anton.woff2");
 *   <span style={{ fontFamily: RAP }}>RAP</span>
 */
import { continueRender, delayRender, staticFile } from "remotion";

const requested = new Set<string>();

export const loadLocalFont = (family: string, file: string): string => {
  if (typeof window === "undefined" || requested.has(family)) return family;
  requested.add(family);
  const handle = delayRender(`Loading font ${family}`);
  const face = new FontFace(family, `url(${staticFile(`fonts/${file}`)})`);
  face
    .load()
    .then((loaded) => {
      document.fonts.add(loaded);
      continueRender(handle);
    })
    .catch((err) => {
      // Never hang the render on a font; fall back and log.
      console.error(`Font ${family} failed to load`, err);
      continueRender(handle);
    });
  return family;
};
