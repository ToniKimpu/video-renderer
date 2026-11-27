import { Easing, interpolate, staticFile } from "remotion";

/**
 * "Bold" map engine, part 1: MapTiler tiles in Web Mercator, our camera, and a converter
 * that turns any short's paperGeo (equirectangular world px) paths into Mercator paths.
 *
 * MapTiler: key in the gitignored .env (MAPTILER_KEY), inlined by remotion.config.ts and
 * scripts/render_stills.mjs. Their terms: tiles load live (no saving/caching to disk), and
 * "© MapTiler © OpenStreetMap contributors" (+ logo on the free plan) stays on screen while
 * the map is visible — use <MapTilerCredit/>. Free plan = testing / non-monetised channel only.
 */

export const MAPTILER_KEY = process.env.MAPTILER_KEY ?? "";

/** Camera space: Web Mercator "world px" at zoom ZREF with 512 px tiles. */
export const ZREF = 6;
export const WORLD = 512 * 2 ** ZREF;

export const merc = (lng: number, lat: number): [number, number] => {
  const s = Math.sin((lat * Math.PI) / 180);
  return [((lng + 180) / 360) * WORLD, (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * WORLD];
};

/** Linear scale of Mercator at a latitude, relative to the equator (for true-size comparisons). */
export const mercScale = (lat: number) => 1 / Math.cos((lat * Math.PI) / 180);

/**
 * Our own tiles, drawn by scripts/build_local_tiles.py from open data (no API key, no quota,
 * no on-screen MapTiler credit). "atlas-topo" matches the MapTiler topo-v2 look.
 */
export const LOCAL_STYLES = ["atlas-topo"];
export const isLocalStyle = (style: string) => LOCAL_STYLES.includes(style);

/** Style id → tile URL ("satellite-v2" is the plain satellite tileset; the rest are MapTiler map styles). */
export const tileUrl = (style: string, z: number, x: number, y: number) =>
  isLocalStyle(style)
    ? staticFile(`localmap/${style}/${z}/${x}/${y}.webp`)
    : style === "satellite-v2"
    ? `https://api.maptiler.com/tiles/satellite-v2/${z}/${x}/${y}?key=${MAPTILER_KEY}`
    : style === "hillshade" // relief only (grey shading, no labels or borders)
      ? `https://api.maptiler.com/tiles/hillshade/${z}/${x}/${y}.webp?key=${MAPTILER_KEY}`
      : `https://api.maptiler.com/maps/${style}/${z}/${x}/${y}.png?key=${MAPTILER_KEY}`;

/** Build a converter from a short's paperProject (equirectangular) to Mercator SVG paths. */
export const paperToMercator = (paperProject: (lng: number, lat: number) => [number, number]) => {
  const [p0x, p0y] = paperProject(0, 0);
  const [p1x, p1y] = paperProject(1, 1);
  const toLngLat = (x: number, y: number): [number, number] => [(x - p0x) / (p1x - p0x), (p0y - y) / (p0y - p1y)];
  return (d: string) =>
    d.replace(/(-?[\d.]+)[ ,](-?[\d.]+)/g, (_, x, y) => {
      const [mx, my] = merc(...toLngLat(parseFloat(x), parseFloat(y)));
      return `${mx.toFixed(1)} ${my.toFixed(1)}`;
    });
};

/** [lng, lat] polyline → Mercator SVG path. */
export const mercPath = (coords: number[][]) => coords.map(([lng, lat], i) => `${i ? "L" : "M"}${merc(lng, lat).map((v) => v.toFixed(1)).join(" ")}`).join(" ");

export type Cam = { x: number; y: number; s: number };
export type View = { w: number; h: number; cx: number; cy: number };
export const VIEW_SHORT: View = { w: 1080, h: 1920, cx: 540, cy: 1000 };

export const at = (lng: number, lat: number, s: number): Cam => {
  const [x, y] = merc(lng, lat);
  return { x, y, s };
};

export const toScreen = (cam: Cam, view: View, x: number, y: number): [number, number] => [view.cx + (x - cam.x) * cam.s, view.cy + (y - cam.y) * cam.s];

/**
 * Calm camera (CLAUDE.md): glide between shots with ease-in-out, zoom interpolated in log
 * space, and a slow one-way push while a shot holds. No back-and-forth wobble.
 */
export const camAt = (keys: [number, Cam][], f: number, push = 1.05): Cam => {
  if (f <= keys[0][0]) return keys[0][1];
  let i = 0;
  while (i < keys.length - 2 && f > keys[i + 1][0]) i++;
  const [fa, a] = keys[i];
  const [fb, b] = keys[i + 1];
  const t = interpolate(f, [fa, fb], [0, 1], { easing: Easing.inOut(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const s = Math.exp(Math.log(a.s) + (Math.log(b.s) - Math.log(a.s)) * t);
  const hold = f > fb ? interpolate(f, [fb, fb + 300], [1, push], { extrapolateRight: "clamp" }) : 1;
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, s: s * hold };
};

/** Blend two cameras (zoom in log space). */
export const mixCam = (a: Cam, b: Cam, k: number): Cam => ({
  x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, s: Math.exp(Math.log(a.s) + (Math.log(b.s) - Math.log(a.s)) * k),
});

export const ramp = (f: number, a: number, d = 12, e = Easing.out(Easing.cubic)) =>
  interpolate(f, [a, a + d], [0, 1], { easing: e, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
export const span = (f: number, a: number, b: number, fade = 10) => Math.min(ramp(f, a, fade), 1 - ramp(f, b - fade, fade));
/** Overshoot pop 0 → 1.12 → 1. */
export const pop = (f: number, a: number) => interpolate(f, [a, a + 8, a + 14], [0, 1.12, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
