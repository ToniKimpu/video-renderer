import React, { useMemo } from "react";
import { loadFont as loadLuckiest } from "@remotion/google-fonts/LuckiestGuy";
import { loadFont as loadNunito } from "@remotion/google-fonts/Nunito";
import { loadFont as loadMono } from "@remotion/google-fonts/CourierPrime";
import { AbsoluteFill, Audio, Easing, Img, interpolate, random, Sequence, staticFile, useCurrentFrame } from "remotion";
import { geoArea, geoDistance, geoGraticule10, geoInterpolate, geoOrthographic, geoPath, type GeoPermissibleObjects } from "d3-geo";
import * as FLAGS from "country-flag-icons/string/3x2";
import { SfxTrack, type SfxCue } from "../_engine/sfx";
import { pop, ramp } from "../_engine/bold/maptiler";
import { AtlasSubscribe, ATLAS_SUBSCRIBE_FRAMES } from "../../brand/AtlasSubscribe";
import { pickMusic, type MusicSet } from "../../thingsworthknowing/music";
import globe from "../../geopin/continents/globe.json";
import { CHAPTERS, SUBSCRIBE_AT, T, TOTAL_FRAMES } from "./data";

const { fontFamily: NUNITO } = loadNunito("normal", { weights: ["800", "900"], subsets: ["latin"] });
const { fontFamily: LUCKIEST } = loadLuckiest();
const { fontFamily: MONO } = loadMono("normal", { weights: ["700"], subsets: ["latin"] });

/**
 * AtlasBrief globe series 05 (English, Charon, ~1:51): "Operation Northwoods", the 1962 Joint Chiefs memo
 * proposing staged pretexts to justify invading Cuba (declassified 1997). Serious tone: calm explorer poses,
 * no drawn violence (documents, stamps, icons and map moves only), real Commons pictures
 * (public/northwoodsglobe/photos). Facts: out/AtlasBrief/globe/05_northwoods/facts.md.
 */
export const northwoodsGlobeTotalFrames = TOTAL_FRAMES;

const PAL = { bg: "#172F4A", dark: "#0A1828", light: "#28507A", dots: "#FFFFFF" };
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const inout = { ...clamp, easing: Easing.inOut(Easing.cubic) };
const outC = { ...clamp, easing: Easing.out(Easing.cubic) };
const fade = (f: number, a: number, b: number, d = 8) => Math.min(ramp(f, a, d), 1 - ramp(f, b - d, d));
const showT = (f: number, a: number, b: number) => (f >= a && f < b ? pop(f, a) * (1 - ramp(f, b - 8, 8)) : 0);
const popAt = (f: number, a: number) => (f >= a ? pop(f, a) : 0);

const OCEAN = "#1C6FAD";
const LAND = "#EFE7D2";
const INK = "#14232E";
const US_BLUE = "#3A6FD8";
const CUBA_RED = "#D9483B";
const SOVIET = "#B3263A";
const GOLD = "#F2B632";
const RED = "#D62839";
const YELLOW = "#FFD60A";
const GREEN = "#1E9A57";
const PAPER = "#FFFDF6";
const MANILA = "#E9C98B";

// ── globe ─────────────────────────────────────────────────────────────────────────────────────────

type LL = [number, number];
const fixWinding = (g: GeoPermissibleObjects): GeoPermissibleObjects => {
  const geom = g as unknown as { type: string; coordinates: number[][][] | number[][][][] };
  const fixPoly = (rings: number[][][]) => (geoArea({ type: "Polygon", coordinates: rings } as GeoPermissibleObjects) > 2 * Math.PI ? rings.map((r) => [...r].reverse()) : rings);
  if (geom.type === "Polygon") return { type: "Polygon", coordinates: fixPoly(geom.coordinates as number[][][]) } as GeoPermissibleObjects;
  if (geom.type === "MultiPolygon") return { type: "MultiPolygon", coordinates: (geom.coordinates as number[][][][]).map(fixPoly) } as GeoPermissibleObjects;
  return g;
};
type Feat = { type: "Feature"; properties: { a3: string; name: string }; geometry: GeoPermissibleObjects };
const FEATS = (globe as unknown as { features: Feat[] }).features.map((x) => ({ ...x, geometry: fixWinding(x.geometry) }));
const GRAT = geoGraticule10();
/** The Soviet Union's 15 republics, by today's countries. */
const USSR = new Set(["RUS", "UKR", "BLR", "KAZ", "UZB", "TKM", "KGZ", "TJK", "GEO", "ARM", "AZE", "MDA", "LTU", "LVA", "EST"]);

const P = {
  havana: [-82.38, 23.13] as LL, keyWest: [-81.78, 24.56] as LL, moscow: [37.62, 55.75] as LL, bayOfPigs: [-81.17, 22.1] as LL,
  washington: [-77.04, 38.9] as LL, gitmo: [-75.13, 19.9] as LL, miami: [-80.19, 25.76] as LL, tampa: [-82.46, 27.95] as LL,
  orlando: [-81.38, 28.54] as LL, jacksonville: [-81.66, 30.33] as LL, paris: [2.12, 48.84] as LL,
};
const BOAT: LL[] = [[-82.3, 23.3], [-82.0, 23.8], [-81.85, 24.2], [-81.78, 24.5]];
const FLIGHT: LL[] = [[-80.3, 25.8], [-81.2, 24.6], [-82.0, 23.9], [-82.9, 23.3]];

const along = (pts: LL[], p: number): LL => {
  const q = Math.max(0, Math.min(1, p)) * (pts.length - 1);
  const i = Math.min(pts.length - 2, Math.floor(q));
  const t = q - i;
  return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t];
};

type Shot = { at: number; dur: number; lon: number; lat: number; z: number };
const SHOTS: Shot[] = [
  { at: -1, dur: 1, lon: -79.5, lat: 26.5, z: 2.6 },
  { at: 0, dur: 120, lon: -79.8, lat: 26.0, z: 2.85 },
  { at: T.cubaSits - 6, dur: 40, lon: -81.6, lat: 23.7, z: 5.0 },
  { at: T.communist - 12, dur: 50, lon: -22, lat: 44, z: 1.1 },
  { at: T.yearEarlier - 6, dur: 44, lon: -80.4, lat: 22.4, z: 4.6 },
  { at: T.washington - 6, dur: 44, lon: -79.2, lat: 29.5, z: 2.5 },
  { at: T.so - 6, dur: 44, lon: -78.6, lat: 26.2, z: 2.75 },
  { at: T.general - 6, dur: 44, lon: -78.0, lat: 33.5, z: 3.2 },
  { at: T.fall - 6, dur: 50, lon: -36, lat: 44, z: 1.3 },
  { at: T.thirtyFive - 6, dur: 44, lon: -79.5, lat: 29, z: 2.4 },
];
const DRIFT = 0.03;
const PUSH = 0.0007;
type Pose = { lon: number; lat: number; z: number };
const poseIn = (i: number, f: number, from: Pose): Pose => {
  const s = SHOTS[i];
  const p = interpolate(f, [s.at, s.at + s.dur], [0, 1], inout);
  const hold = Math.max(0, f - (s.at + s.dur));
  const z = from.z * Math.pow(s.z / from.z, p) * (1 + PUSH * Math.min(hold, 300));
  return { lon: from.lon + (s.lon - from.lon) * p - ((f - s.at) * DRIFT) / z, lat: from.lat + (s.lat - from.lat) * p, z };
};
const camAt = (f: number): Pose => {
  let from: Pose = { lon: SHOTS[0].lon, lat: SHOTS[0].lat, z: SHOTS[0].z };
  let i = 0;
  while (i + 1 < SHOTS.length && f >= SHOTS[i + 1].at) {
    const next = SHOTS[i + 1];
    from = i === 0 ? from : poseIn(i, next.at, from);
    i++;
  }
  return i === 0 ? from : poseIn(i, f, from);
};

const CX = 540;
const CY = 1050;
const R = 420;
const makeProj = (f: number, pose?: Pose) => {
  const c = pose ?? camAt(f);
  return { c, proj: geoOrthographic().scale(R * c.z).translate([CX, CY]).rotate([-c.lon, -c.lat]).clipAngle(90).precision(0.4) };
};
const visible = (c: { lon: number; lat: number }, pt: LL) => geoDistance(pt, [c.lon, c.lat]) < Math.PI / 2 - 0.05;

const Globe: React.FC<{ f: number; pose?: Pose }> = ({ f, pose }) => {
  const { c, proj } = makeProj(f, pose);
  const path = geoPath(proj);
  const r = R * c.z;
  const w0 = Math.min(1.8, 0.8 + 0.2 * c.z);
  const cubaK = Math.max(ramp(f, T.blame - 4, 12) * (1 - ramp(f, T.so + 30, 20)), 0.55 * ramp(f, T.so + 30, 20) * (1 - ramp(f, T.general, 20)), 0.85 * fade(f, T.cubanJet - 4, T.indignation));
  const ussrK = fade(f, T.soviet - 8, T.yearEarlier + 4, 10);
  const arcQ = interpolate(f, [T.soviet - 6, T.soviet + 26], [0, 1], outC) * (1 - ramp(f, T.yearEarlier, 10));
  const rulerQ = interpolate(f, [T.ninety - 6, T.ninety + 16], [0, 1], outC) * (1 - ramp(f, T.communist - 12, 10));
  const natoQ = interpolate(f, [T.europe - 14, T.nato + 6], [0, 1], inout) * (1 - ramp(f, T.thirtyFive - 4, 10));
  const lineAt = (pts: LL[], col: string, w: number, key: string, dash?: string) => {
    const d = path({ type: "LineString", coordinates: pts } as GeoPermissibleObjects);
    return d ? (
      <g key={key}>
        <path d={d} fill="none" stroke={INK} strokeWidth={w + 6} strokeLinecap="round" strokeOpacity={0.5} strokeDasharray={dash} />
        <path d={d} fill="none" stroke={col} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash} />
      </g>
    ) : null;
  };
  const arc = (a: LL, b: LL, q: number, col: string, key: string) => {
    if (q <= 0) return null;
    const ip = geoInterpolate(a, b);
    const pts = Array.from({ length: 40 }, (_, i) => ip((i / 39) * q) as LL);
    return lineAt(pts, col, 7, key);
  };
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920 }}>
      <svg width={1080} height={1920} style={{ display: "block", overflow: "visible" }}>
        <defs>
          <radialGradient id="nwshade" cx="38%" cy="32%" r="70%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.18} />
            <stop offset="55%" stopColor="#FFFFFF" stopOpacity={0} />
            <stop offset="100%" stopColor="#04182A" stopOpacity={0.45} />
          </radialGradient>
        </defs>
        <circle cx={CX} cy={CY} r={r + 16} fill="#FFFFFF" opacity={0.1} />
        <circle cx={CX} cy={CY} r={r} fill={OCEAN} />
        <path d={path(GRAT) ?? ""} fill="none" stroke="#FFFFFF" strokeOpacity={0.1} strokeWidth={1.2} />
        {FEATS.map((x) => {
          const d = path(x.geometry);
          if (!d) return null;
          const a3 = x.properties.a3;
          return (
            <g key={a3 + x.properties.name}>
              <path d={d} fill={a3 === "ATA" ? "#FFFFFF" : LAND} stroke={INK} strokeWidth={w0} strokeLinejoin="round" />
              {a3 === "CUB" && cubaK > 0 ? <path d={d} fill={CUBA_RED} fillOpacity={0.88 * cubaK} stroke="#FFFFFF" strokeWidth={w0 * 1.6} strokeOpacity={cubaK} /> : null}
              {USSR.has(a3) && ussrK > 0 ? <path d={d} fill={SOVIET} fillOpacity={0.85 * ussrK} stroke="#FFFFFF" strokeWidth={w0} strokeOpacity={ussrK} /> : null}
            </g>
          );
        })}
        {rulerQ > 0 ? lineAt([P.keyWest, along([P.keyWest, P.havana], rulerQ)], YELLOW, 7, "ruler", "14 10") : null}
        {arc(P.moscow, P.havana, arcQ, YELLOW, "arc")}
        {arc(P.washington, P.paris, natoQ, GOLD, "nato")}
        <circle cx={CX} cy={CY} r={r} fill="url(#nwshade)" pointerEvents="none" />
        <circle cx={CX} cy={CY} r={r} fill="none" stroke={INK} strokeWidth={5} />
      </svg>
    </div>
  );
};

// ── small pieces ──────────────────────────────────────────────────────────────────────────────────

const Pic: React.FC<{ name: string; h: number; flip?: boolean; style?: React.CSSProperties }> = ({ name, h, flip, style }) => (
  <Img src={staticFile(`paper/props/${name}.png`)} style={{ height: h, width: "auto", display: "block", transform: flip ? "scaleX(-1)" : undefined, filter: "drop-shadow(0 4px 5px rgba(0,0,0,0.35))", ...style }} />
);

const Flag: React.FC<{ cc: string; w: number; style?: React.CSSProperties }> = ({ cc, w, style }) => {
  const svg = (FLAGS as Record<string, string>)[cc];
  if (!svg) return null;
  return <img src={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`} style={{ width: w, height: (w * 2) / 3, border: `4px solid ${INK}`, borderRadius: 6, display: "block", flex: "none", ...style }} />;
};

/** The Soviet flag (hammer and sickle simplified to a gold star + emblem). */
const SovietFlag: React.FC<{ w: number }> = ({ w }) => (
  <svg width={w} height={(w * 2) / 3} viewBox="0 0 300 200" style={{ display: "block", border: `4px solid ${INK}`, borderRadius: 6 }}>
    <rect width={300} height={200} fill="#CC0000" />
    <polygon points="45,22 50,36 65,36 53,45 57,59 45,50 33,59 37,45 25,36 40,36" fill="#FFD700" />
    <path d="M30 95 Q55 110 72 85 L80 92 Q60 125 28 104 Z M48 72 L82 106 L76 112 L42 78 Z" fill="#FFD700" />
  </svg>
);

const Pill: React.FC<{ x: number; y: number; t: number; text: string; color: string; size?: number; rot?: number; fg?: string }> = ({ x, y, t, text, color, size = 50, rot = 0, fg = "#FFFFFF" }) =>
  t <= 0 ? null : (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${t}) rotate(${rot}deg)`, fontFamily: LUCKIEST, fontSize: size, lineHeight: 1, color: fg,
      background: color, border: `5px solid ${INK}`, borderRadius: 999, padding: `${Math.round(size * 0.24)}px ${Math.round(size * 0.42)}px ${Math.round(size * 0.08)}px`, whiteSpace: "nowrap",
      WebkitTextStroke: fg === "#FFFFFF" ? `3px ${INK}` : undefined, paintOrder: "stroke", boxShadow: "0 8px 16px rgba(0,0,0,0.35)" }}>{text}</div>
  );

const Stamp: React.FC<{ x: number; y: number; f: number; a: number; b: number; text: string; color?: string; size?: number; rot?: number }> = ({ x, y, f, a, b, text, color = RED, size = 110, rot = -8 }) => {
  if (f < a || f >= b) return null;
  const s = interpolate(f, [a, a + 6], [2.4, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const o = Math.min(1, ramp(f, a, 3)) * (1 - ramp(f, b - 8, 8));
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${s})`, opacity: o, fontFamily: LUCKIEST, fontSize: size, lineHeight: 1,
      color, border: `10px solid ${color}`, borderRadius: 18, padding: `${size * 0.16}px ${size * 0.3}px 0`, background: "rgba(255,253,246,0.9)", whiteSpace: "nowrap", letterSpacing: 2 }}>{text}</div>
  );
};

const NameTag: React.FC<{ x: number; y: number; t: number; text: string; color?: string; fg?: string; size?: number }> = ({ x, y, t, text, color = "#FFFFFF", fg = INK, size = 38 }) =>
  t <= 0 ? null : (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${0.6 + 0.4 * Math.min(1, t)})`, opacity: Math.min(1, t), fontFamily: NUNITO, fontWeight: 900, fontSize: size,
      lineHeight: 1.35, color: fg, background: color, padding: `2px ${Math.round(size * 0.5)}px`, borderRadius: 999, whiteSpace: "nowrap", boxShadow: "0 6px 16px rgba(5,30,40,0.35)", border: `3px solid ${INK}` }}>{text}</div>
  );

const Panel: React.FC<{ x?: number; y?: number; k: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ x = 540, y = 560, k, children, style }) =>
  k <= 0 ? null : (
    <div style={{ position: "absolute", left: x, top: y, width: "max-content", transform: `translate(-50%, -50%) scale(${0.6 + 0.4 * Math.min(1, k)})`, opacity: Math.min(1, k),
      background: PAPER, borderRadius: 30, padding: "18px 26px", border: `5px solid ${INK}`, boxShadow: "0 14px 34px rgba(0,0,0,0.4)", ...style }}>{children}</div>
  );

const Label: React.FC<{ children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties }> = ({ children, size = 34, color = INK, style }) => (
  <div style={{ fontFamily: NUNITO, fontWeight: 900, fontSize: size, lineHeight: 1.15, color, ...style }}>{children}</div>
);
const Big: React.FC<{ children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties }> = ({ children, size = 80, color = INK, style }) => (
  <div style={{ fontFamily: LUCKIEST, fontSize: size, lineHeight: 1, paddingTop: size * 0.12, color, whiteSpace: "nowrap", ...style }}>{children}</div>
);
const Headline: React.FC<{ y: number; t: number; children: React.ReactNode; size?: number; color?: string; rot?: number; x?: number }> = ({ y, t, children, size = 120, color = "#FFFFFF", rot = 0, x = 540 }) =>
  t <= 0 ? null : (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${t}) rotate(${rot}deg)`, fontFamily: LUCKIEST, fontSize: size, lineHeight: 1, paddingTop: size * 0.12,
      color, WebkitTextStroke: `${Math.max(5, size / 20)}px ${INK}`, paintOrder: "stroke", textShadow: "0 10px 0 rgba(0,0,0,0.3)", whiteSpace: "nowrap" }}>{children}</div>
  );

const Backdrop: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 54%, ${PAL.light} 0%, ${PAL.bg} 46%, ${PAL.dark} 100%)` }}>
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      {Array.from({ length: 36 }, (_, i) => {
        const x = random(`sx${i}`) * 1080;
        const y = (random(`sy${i}`) * 2000 - f * (0.2 + random(`ss${i}`) * 0.35)) % 2000;
        return <circle key={i} cx={x} cy={y < 0 ? y + 2000 : y} r={3 + random(`sr${i}`) * 4} fill={PAL.dots} opacity={0.06 + random(`so${i}`) * 0.1} />;
      })}
    </svg>
  </AbsoluteFill>
);

const Photo: React.FC<{ f: number; src: string; caption: string; from: number; to: number; x: number; y: number; w: number; h: number; rot?: number; focus?: string; fit?: "cover" | "contain"; bg?: string }> = ({ f, src, caption, from, to, x, y, w, h, rot = 2, focus = "50% 40%", fit = "cover", bg = "#EEE" }) => {
  const k = showT(f, from, to);
  if (k <= 0) return null;
  const kb = 1.03 + 0.08 * interpolate(f, [from, to], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${k}) rotate(${rot + Math.sin((f - from) / 40) * 0.4}deg)`, background: "#FFFFFF", padding: 12, paddingBottom: 10,
      borderRadius: 10, border: `4px solid ${INK}`, boxShadow: "0 18px 34px rgba(0,0,0,0.45)" }}>
      <div style={{ width: w, height: h, overflow: "hidden", borderRadius: 4, background: bg }}>
        <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: fit, objectPosition: focus, transform: `scale(${kb})`, transformOrigin: focus }} />
      </div>
      <div style={{ fontFamily: NUNITO, fontWeight: 800, fontSize: 25, color: INK, marginTop: 8, maxWidth: w, lineHeight: 1.2 }}>{caption}</div>
    </div>
  );
};

const count = (f: number, a: number, b: number, v: number) => Math.round(v * interpolate(f, [a, b], [0, 1], outC));
const fmt = (n: number) => n.toLocaleString("en-US");

/** A manila TOP SECRET folder; `sign` draws the signature (0–1); `approved` stamps NOT APPROVED. */
const Folder: React.FC<{ w: number; sign?: number; f: number; notApproved?: number; label?: string }> = ({ w, sign = 0, f, notApproved = 0, label = "JUSTIFICATION FOR US MILITARY INTERVENTION IN CUBA" }) => {
  const h = w * 0.72;
  return (
    <div style={{ position: "relative", width: w, height: h, filter: "drop-shadow(0 14px 18px rgba(0,0,0,0.45))" }}>
      <svg width={w} height={h} viewBox="0 0 400 288" style={{ position: "absolute", inset: 0 }}>
        <path d="M8 30 H150 L170 8 H392 V280 H8 Z" fill="#D9B46E" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <rect x={8} y={40} width={384} height={240} rx={6} fill={MANILA} stroke={INK} strokeWidth={6} />
        <rect x={40} y={60} width={240} height={36} fill="none" stroke={RED} strokeWidth={5} transform="rotate(-4 160 78)" />
        <text x={160} y={88} textAnchor="middle" fontFamily={LUCKIEST} fontSize={30} fill={RED} transform="rotate(-4 160 78)">TOP SECRET</text>
        {[0, 1, 2].map((i) => <rect key={i} x={40} y={150 + i * 24} width={i === 2 ? 180 : 300} height={9} rx={4} fill={INK} opacity={0.35} />)}
        <path d="M230 245 C245 220 255 262 270 236 S300 258 318 232 S348 250 365 238" fill="none" stroke="#1B2A6B" strokeWidth={5} strokeLinecap="round" pathLength={100} strokeDasharray={`${100 * sign} 100`} />
      </svg>
      <div style={{ position: "absolute", left: w * 0.09, top: h * 0.4, width: w * 0.8, fontFamily: MONO, fontWeight: 700, fontSize: w * 0.045, lineHeight: 1.25, color: INK }}>{label}</div>
      {notApproved > 0 ? (
        <div style={{ position: "absolute", left: "50%", top: "52%", transform: `translate(-50%, -50%) rotate(-12deg) scale(${interpolate(notApproved, [0, 1], [2.2, 1], clamp)})`, opacity: Math.min(1, notApproved * 2),
          fontFamily: LUCKIEST, fontSize: w * 0.11, color: RED, border: `${w * 0.02}px solid ${RED}`, borderRadius: 14, padding: `${w * 0.02}px ${w * 0.04}px 0`, background: "rgba(255,253,246,0.88)", whiteSpace: "nowrap" }}>NOT APPROVED</div>
      ) : null}
      <span style={{ display: "none" }}>{f}</span>
    </div>
  );
};

/** A tear-off calendar page. */
const CalPage: React.FC<{ top: string; big: string; w?: number; color?: string }> = ({ top, big, w = 200, color = RED }) => (
  <div style={{ width: w, background: PAPER, border: `5px solid ${INK}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 10px 20px rgba(0,0,0,0.35)", textAlign: "center" }}>
    <div style={{ background: color, color: "#FFFFFF", fontFamily: LUCKIEST, fontSize: w * 0.17, padding: `${w * 0.05}px 0 ${w * 0.01}px`, borderBottom: `5px solid ${INK}` }}>{top}</div>
    <div style={{ fontFamily: LUCKIEST, fontSize: w * 0.44, lineHeight: 1, padding: `${w * 0.08}px 0 ${w * 0.04}px`, color: INK }}>{big}</div>
  </div>
);

/** A map pin. */
const Pin: React.FC<{ s: number; color?: string }> = ({ s, color = RED }) => (
  <svg width={s} height={s * 1.35} viewBox="0 0 56 76" style={{ display: "block", overflow: "visible", filter: "drop-shadow(0 4px 4px rgba(0,0,0,0.4))" }}>
    <path d="M28 74 C 10 46, 4 36, 4 26 A 24 24 0 0 1 52 26 C 52 36, 46 46, 28 74 Z" fill={color} stroke={INK} strokeWidth={5} />
    <circle cx={28} cy={26} r={9} fill="#FFFFFF" />
  </svg>
);

/** Simple icons for the memo's ideas (no drawn violence). */
const Icon: React.FC<{ kind: "uniform" | "ship" | "boat" | "plane" | "drone" | "warn" | "typewriter" | "pen" | "chain" | "vault" | "archive" | "pages"; s: number; ghost?: boolean }> = ({ kind, s, ghost }) => {
  const st = { fill: ghost ? "none" : PAPER, stroke: INK, strokeWidth: 5, strokeLinejoin: "round" as const, strokeDasharray: ghost ? "8 7" : undefined };
  return (
    <svg width={s} height={s} viewBox="0 0 100 100" style={{ display: "block", overflow: "visible", filter: "drop-shadow(0 5px 5px rgba(0,0,0,0.35))" }}>
      {kind === "uniform" ? <><circle cx={50} cy={24} r={14} {...st} /><path d="M22 92 V58 Q22 42 50 42 Q78 42 78 58 V92 Z" {...st} fill="#4F6B3A" /><rect x={42} y={50} width={16} height={11} fill="#002A8F" stroke={INK} strokeWidth={3} /></> : null}
      {kind === "ship" ? <><path d="M8 62 H92 L80 84 H20 Z" {...st} fill="#8C9AA8" /><rect x={34} y={42} width={30} height={20} {...st} fill="#B8C4CF" /><rect x={46} y={26} width={8} height={16} {...st} fill="#B8C4CF" /></> : null}
      {kind === "boat" ? <><path d="M10 60 H90 L76 80 H24 Z" {...st} fill={ghost ? "none" : "#C98A3D"} /><path d="M50 60 V20 L74 54 Z" {...st} /></> : null}
      {kind === "plane" ? <path d="M50 8 L58 40 L92 56 V64 L58 56 L56 82 L66 90 V95 L50 90 L34 95 V90 L44 82 L42 56 L8 64 V56 L42 40 Z" {...st} /> : null}
      {kind === "drone" ? <path d="M50 8 L58 40 L92 56 V64 L58 56 L56 82 L66 90 V95 L50 90 L34 95 V90 L44 82 L42 56 L8 64 V56 L42 40 Z" {...st} fill="#9AA3AD" /> : null}
      {kind === "warn" ? <><path d="M50 8 L94 88 H6 Z" {...st} fill={YELLOW} /><rect x={46} y={36} width={8} height={28} fill={INK} /><circle cx={50} cy={74} r={5} fill={INK} /></> : null}
      {kind === "typewriter" ? <><rect x={14} y={44} width={72} height={40} rx={8} {...st} fill="#6B7A88" /><rect x={28} y={14} width={44} height={34} {...st} /><rect x={22} y={60} width={56} height={6} fill={INK} /></> : null}
      {kind === "pen" ? <><path d="M70 10 L90 30 L40 80 L18 86 L24 64 Z" {...st} fill="#1B2A6B" /><path d="M18 86 L24 64 L40 80 Z" fill={GOLD} stroke={INK} strokeWidth={4} /></> : null}
      {kind === "chain" ? <><rect x={30} y={8} width={40} height={26} rx={6} {...st} /><rect x={30} y={66} width={40} height={26} rx={6} {...st} /><path d="M50 62 V38 M40 46 L50 36 L60 46" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" /></> : null}
      {kind === "vault" ? <><rect x={8} y={8} width={84} height={84} rx={10} {...st} fill="#7D8A96" /><circle cx={50} cy={50} r={26} {...st} fill="#B8C4CF" /><path d="M50 30 V70 M30 50 H70" stroke={INK} strokeWidth={6} /></> : null}
      {kind === "archive" ? <><path d="M8 34 L50 10 L92 34 Z" {...st} /><rect x={14} y={34} width={72} height={8} {...st} />{[20, 38, 56, 74].map((x) => <rect key={x} x={x} y={44} width={8} height={36} {...st} />)}<rect x={8} y={82} width={84} height={10} {...st} /></> : null}
      {kind === "pages" ? <>{[0, 1, 2, 3].map((i) => <rect key={i} x={18 + i * 4} y={14 + i * 6} width={60} height={70} rx={4} {...st} />)}</> : null}
    </svg>
  );
};

// ── chapter ribbon ────────────────────────────────────────────────────────────────────────────────

const Ribbon: React.FC<{ f: number }> = ({ f }) => {
  let i = -1;
  while (i + 1 < CHAPTERS.length && f >= CHAPTERS[i + 1].at) i++;
  if (i < 0 || f >= SUBSCRIBE_AT) return null;
  const ch = CHAPTERS[i];
  const k = interpolate(f, [ch.at, ch.at + 12], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  return (
    <div style={{ position: "absolute", left: 540, top: 236, transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ display: "flex", gap: 10 }}>
        {CHAPTERS.map((_, j) => <div key={j} style={{ width: j === i ? 46 : 18, height: 18, borderRadius: 9, background: j <= i ? GOLD : "rgba(255,255,255,0.25)", border: `3px solid ${INK}` }} />)}
      </div>
      <div style={{ fontFamily: LUCKIEST, fontSize: 44, lineHeight: 1, padding: "14px 30px 4px", color: INK, background: GOLD, border: `4px solid ${INK}`, borderRadius: 14,
        transform: `scale(${k})`, boxShadow: "0 8px 0 rgba(0,0,0,0.25)", whiteSpace: "nowrap", letterSpacing: 1 }}>{ch.title}</div>
    </div>
  );
};

/** The word from the hook, parked top-right until the payoff ("Keep that phrase in mind"). */
const ConspiracyChip: React.FC<{ f: number }> = ({ f }) => {
  if (f < T.conspiracy - 4 || f >= SUBSCRIBE_AT) return null;
  // big in the middle → parks top-right → flies back for the payoff
  const park = interpolate(f, [T.mind - 2, T.mind + 18], [0, 1], inout) * (1 - interpolate(f, [T.conspiracy2 - 14, T.conspiracy2 + 4], [0, 1], inout));
  const x = 540 + (918 - 540) * park;
  const y = 560 + (236 - 560) * park;
  const s = popAt(f, T.conspiracy - 4) * (1 - 0.62 * park) * (1 - ramp(f, SUBSCRIBE_AT - 6, 6));
  const strike = ramp(f, T.notThis, 8);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${s}) rotate(${-3 + Math.sin(f / 14) * 1.5}deg)` }}>
      <div style={{ position: "relative", fontFamily: LUCKIEST, fontSize: 64, lineHeight: 1, padding: "16px 30px 6px", color: "#FFFFFF", background: "#5B4B8A", border: `5px solid ${INK}`, borderRadius: 18,
        WebkitTextStroke: `3px ${INK}`, paintOrder: "stroke", whiteSpace: "nowrap", boxShadow: "0 10px 18px rgba(0,0,0,0.35)" }}>
        CONSPIRACY THEORY?
        {strike > 0 ? <div style={{ position: "absolute", left: 16, top: "50%", height: 12, width: `calc(${strike * 100}% - 32px)`, background: RED, border: `3px solid #FFFFFF`, borderRadius: 6, transform: "rotate(-4deg)" }} /> : null}
      </div>
    </div>
  );
};

// ── the explorer (calm poses only) ────────────────────────────────────────────────────────────────

type ExpPose = "think" | "point" | "surprised" | "shrug" | "binoculars" | "up";
const POSE_FILE: Record<ExpPose, string> = { think: "ab_exp_think", point: "ab_exp_point_side", surprised: "ab_exp_surprised", shrug: "ab_exp_shrug", binoculars: "ab_exp_binoculars", up: "ab_exp_up" };
const POSES: [number, ExpPose, boolean?][] = [
  [0, "think"], [T.blame, "point"], [T.conspiracy, "up"], [T.cubaSits, "point"], [T.communist, "binoculars"], [T.yearEarlier, "point"], [T.washington, "think"],
  [T.so, "point"], [T.ideas, "up"], [T.remember, "think"], [T.terror, "surprised"], [T.boat, "point"], [T.airliner, "think"], [T.oneLine, "surprised", true],
  [T.general, "point"], [T.threeLater, "think"], [T.nothing, "up"], [T.fall, "binoculars"], [T.thirtyFive, "think"], [T.y1997, "point"], [T.scary, "surprised"],
  [T.conspiracy2, "think"], [T.notThis, "up"],
];
const Explorer: React.FC<{ f: number }> = ({ f }) => {
  let i = 0;
  while (i + 1 < POSES.length && f >= POSES[i + 1][0]) i++;
  const [at, pose, hidden] = POSES[i];
  const enter = interpolate(f, [4, 20], [-420, 0], { ...clamp, easing: Easing.out(Easing.back(1.2)) });
  const hide = hidden ? interpolate(f, [at, at + 12], [0, 1], clamp) : (i > 0 && POSES[i - 1][2] ? 1 - interpolate(f, [at, at + 12], [0, 1], clamp) : 0);
  const out = f >= SUBSCRIBE_AT ? interpolate(f, [SUBSCRIBE_AT, SUBSCRIBE_AT + 14], [0, 1], clamp) : 0;
  const s = 0.94 + 0.06 * pop(f, at);
  return (
    <Img src={staticFile(`paper/props/${POSE_FILE[pose]}.png`)} style={{ position: "absolute", left: 160 + enter - (out + hide) * 420, top: 1690 + Math.sin(f / 14) * 3, height: 400, width: "auto",
      transform: `translate(-50%, -100%) scale(${s})`, transformOrigin: "50% 100%", filter: "drop-shadow(0 8px 8px rgba(0,0,0,0.35))" }} />
  );
};

// ── sound ─────────────────────────────────────────────────────────────────────────────────────────

const SHOT_SWITCHES = SHOTS.slice(2).map((s) => s.at);
const IDEAS = [T.friendly, T.ship, T.terror, T.boat, T.airliner];
const SFX: SfxCue[] = [
  { at: 0, name: "thud", volume: 0.55 }, { at: T.y1962, name: "stamp", volume: 0.55 }, { at: T.signed, name: "scribble", volume: 0.55 },
  { at: T.blame, name: "impact", volume: 0.4 }, { at: T.conspiracy - 2, name: "pop", volume: 0.5 }, { at: T.mind, name: "whoosh", volume: 0.45 },
  ...SHOT_SWITCHES.map((a) => ({ at: a, name: "whoosh" as const, volume: 0.35 })),
  ...CHAPTERS.map((c) => ({ at: c.at, name: "swipe" as const, volume: 0.5 })),
  { at: T.ninety, name: "scribble", volume: 0.4 }, { at: T.castro, name: "pop", volume: 0.45 }, { at: T.soviet, name: "riser", volume: 0.35 },
  { at: T.bay, name: "pop", volume: 0.45 }, { at: T.collapsed + 6, name: "stamp", volume: 0.55 }, { at: T.reason, name: "pop_hi", volume: 0.4 },
  { at: T.memo, name: "paper", volume: 0.5 }, ...IDEAS.map((a) => ({ at: a - 2, name: "pop" as const, volume: 0.45 })),
  { at: T.blamed, name: "thud", volume: 0.45 }, { at: T.remember, name: "paper", volume: 0.4 },
  ...[T.miami, T.otherFl, T.otherFl + 8, T.dc].map((a) => ({ at: a, name: "pop_lo" as const, volume: 0.45 })),
  { at: T.simulated, name: "boing", volume: 0.2 }, { at: T.swapped, name: "whoosh", volume: 0.4 }, { at: T.shot, name: "thud", volume: 0.4 },
  { at: T.casualty, name: "typing", volume: 0.5 },
  { at: T.lemnitzer, name: "paper", volume: 0.4 }, { at: T.threeLater, name: "tick", volume: 0.45 }, { at: T.threeLater + 8, name: "tick", volume: 0.45 },
  { at: T.approved - 2, name: "stamp", volume: 0.7 }, { at: T.europe, name: "whoosh_long", volume: 0.4 },
  { at: T.locked, name: "thud", volume: 0.5 }, { at: T.y1997, name: "stamp", volume: 0.6 }, { at: T.pages, name: "paper", volume: 0.45 },
  { at: T.typed, name: "typing", volume: 0.45 }, { at: T.signedUp, name: "scribble", volume: 0.45 }, { at: T.chain, name: "whoosh", volume: 0.4 },
  { at: T.notThis, name: "stamp", volume: 0.7 }, { at: T.archives, name: "ding", volume: 0.45 },
];

const musicVolume = (f: number) => interpolate(f, [0, 16, T.end, TOTAL_FRAMES - 14, TOTAL_FRAMES], [0.24, 0.16, 0.16, 0.24, 0], clamp);
const TRACKS = { meta: { src: "thingsworthknowing/music/anthropy.m4a", startS: 2.5 }, youtube: { src: "koreaunite/audio/music_standoff.mp3", startS: 0 } };

const Sound: React.FC<{ music: MusicSet }> = ({ music }) => {
  const track = pickMusic(music, TRACKS);
  const musicGain = music === "meta" ? 0.6 : 1;
  return (
    <>
      <Audio src={staticFile("northwoodsglobe/narration.mp3")} />
      <Audio src={staticFile(track.src)} loop trimBefore={Math.round(track.startS * 30)} volume={(v) => musicVolume(v) * musicGain} />
      <SfxTrack cues={SFX} />
    </>
  );
};

// ── the video ─────────────────────────────────────────────────────────────────────────────────────

export const NorthwoodsGlobeShort: React.FC<{ music?: MusicSet }> = ({ music = "youtube" }) => {
  const f = useCurrentFrame();
  const { c, proj } = useMemo(() => makeProj(f), [f]);
  const at = (ll: LL): [number, number] => (visible(c, ll) ? (proj(ll) as [number, number] | null) ?? [-999, -999] : [-999, -999]);
  const onMap = (ll: LL, a: number, b: number, node: React.ReactNode, key: string, dy = 0, anchor = "-50%, -50%") => {
    const [x, y] = at(ll);
    const k = showT(f, a, b);
    return x < -500 || k <= 0 ? null : <div key={key} style={{ position: "absolute", left: x, top: y + dy, transform: `translate(${anchor}) scale(${k})` }}>{node}</div>;
  };

  const nameTags: [LL, string, number, number, string?, string?][] = [
    [[-79.0, 21.2], "CUBA", T.blame - 2, T.sounds + 10, CUBA_RED, "#FFFFFF"],
    [[-78.2, 22.2], "CUBA", T.cubaSits - 2, T.communist - 10, CUBA_RED, "#FFFFFF"],
    [[-81.0, 26.8], "FLORIDA", T.florida - 4, T.communist - 10],
    [[42, 60], "SOVIET UNION", T.soviet - 2, T.yearEarlier, SOVIET, "#FFFFFF"],
    [[-81.17, 21.45], "BAY OF PIGS", T.bay - 2, T.washington - 4],
    [[-77.04, 40.0], "WASHINGTON", T.washington - 2, T.so - 4, US_BLUE, "#FFFFFF"],
    [[-75.13, 19.0], "GUANTANAMO", T.guantanamo - 4, T.remember - 4],
    [[-80.19, 24.85], "MIAMI", T.miami - 2, T.boat - 4],
    [[-77.04, 39.9], "WASHINGTON", T.dc - 2, T.boat - 4, US_BLUE, "#FFFFFF"],
    [[-77.04, 39.9], "WASHINGTON", T.whiteHouse - 4, T.fall - 4, US_BLUE, "#FFFFFF"],
    [[2.12, 50.4], "NATO, EUROPE", T.nato - 6, T.thirtyFive - 4, GOLD],
  ];

  // folder
  const folderIn = f < T.cubaSits + 4 ? popAt(f, 0) * (1 - ramp(f, T.cubaSits - 6, 8)) : 0;
  const folderSign = interpolate(f, [T.signed - 2, T.signed + 24], [0, 1], clamp);
  const folderBack = f >= T.nothing - 6 && f < T.fall + 4 ? popAt(f, T.nothing - 6) * (1 - ramp(f, T.fall - 4, 8)) : 0;
  // ideas progress (5 dots)
  const ideaN = IDEAS.filter((a) => f >= a - 2).length;
  const ideasOn = fade(f, T.friendly - 6, T.general, 10);
  const cancelled = ramp(f, T.none, 10);
  // boat & plane
  const boatP = interpolate(f, [T.boat, T.sunk + 10], [0, 1], inout);
  const planeP = interpolate(f, [T.airliner - 4, T.shot], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const swapped = f >= T.drone - 2;
  // typed quote
  const QUOTE = "“Casualty lists in US newspapers would cause a helpful wave of national indignation.”";
  const typedN = Math.round(QUOTE.length * interpolate(f, [T.casualty - 6, T.indignation + 10], [0, 1], clamp));
  const underline = interpolate(f, [T.helpful, T.helpful + 16], [0, 1], outC);

  return (
    <AbsoluteFill style={{ background: PAL.bg, overflow: "hidden" }}>
      <Backdrop f={f} />
      <Globe f={f} />

      {/* ── 1 · hook ── */}
      {folderIn > 0 ? (
        <div style={{ position: "absolute", left: 540, top: 620, transform: `translate(-50%, -50%) scale(${folderIn}) rotate(${-3 + Math.sin(f / 18) * 1}deg)` }}>
          <Folder w={560} sign={folderSign} f={f} />
        </div>
      ) : null}
      <Pill x={540} y={300} t={showT(f, T.y1962 - 2, T.conspiracy - 6)} text="MARCH 1962" color={RED} size={58} />
      {onMap(P.miami, T.stage, T.sounds + 10, <Icon kind="warn" s={70} />, "hm", -40)}
      {onMap([-80.6, 22.6], T.blame + 2, T.sounds + 10, <div style={{ fontFamily: LUCKIEST, fontSize: 40, padding: "8px 16px 0", background: PAPER, border: `4px solid ${INK}`, borderRadius: 12, color: CUBA_RED, whiteSpace: "nowrap", transform: "rotate(-4deg)" }}>BLAMED</div>, "hb", 120)}
      <ConspiracyChip f={f} />

      {/* ── 2 · why Cuba ── */}
      <Panel y={560} k={showT(f, T.ninety - 4, T.communist - 8)} style={{ padding: "12px 30px", textAlign: "center" }}>
        <Big size={96} color={INK}>{count(f, T.ninety - 4, T.ninety + 18, 90)} MILES</Big>
        <Label size={28}>Key West → Havana (about 145 km)</Label>
      </Panel>
      {onMap([-79.6, 22.2], T.castro - 4, T.communist - 8, <Flag cc="CU" w={120} style={{ transform: `rotate(${Math.sin(f / 9) * 4}deg)` }} />, "cuf", 0)}
      {f >= T.soviet - 6 && f < T.yearEarlier ? (
        <div style={{ position: "absolute", left: 540, top: 560, transform: `translate(-50%, -50%) scale(${popAt(f, T.soviet - 6) * (1 - ramp(f, T.yearEarlier - 8, 8))})`, display: "flex", alignItems: "center", gap: 22 }}>
          <Flag cc="CU" w={130} /><Big size={70} color={YELLOW} style={{ WebkitTextStroke: `4px ${INK}`, paintOrder: "stroke" }}>+</Big><SovietFlag w={130} />
        </div>
      ) : null}
      {onMap(P.bayOfPigs, T.bay - 4, T.washington - 4, <Pin s={56} />, "bop", 0, "-50%, -100%")}
      <Photo f={f} src="northwoodsglobe/photos/bayofpigs.jpg" caption="US Navy jets over USS Essex during the Bay of Pigs operation, April 1961" from={T.cia - 4} to={T.washington} x={540} y={540} w={520} h={300} rot={-2} />
      {f >= T.collapsed - 4 && f < T.washington ? (
        <div style={{ position: "absolute", left: 860, top: 880, transform: `translate(-50%, -50%) scale(${popAt(f, T.collapsed - 4) * (1 - ramp(f, T.washington - 8, 8))}) rotate(6deg)` }}>
          <CalPage top="DAYS" big={String(Math.max(1, Math.min(3, 1 + Math.floor((f - T.collapsed + 4) / 6))))} w={170} />
        </div>
      ) : null}
      <Stamp x={330} y={880} f={f} a={T.collapsed + 6} b={T.washington} text="FAILED" size={80} rot={-10} />
      {f >= T.gone - 6 && f < T.so ? (() => {
        const [x1, y1] = at(P.washington);
        const [x2, y2] = at(P.havana);
        const q = interpolate(f, [T.gone - 6, T.gone + 16], [0, 1], outC);
        if (x1 < -500 || x2 < -500) return null;
        return (
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: 1 - ramp(f, T.so - 8, 8) }}>
            <path d={`M${x1} ${y1} Q ${(x1 + x2) / 2 + 160} ${(y1 + y2) / 2} ${x2} ${y2}`} fill="none" stroke="#FFFFFF" strokeWidth={8} strokeDasharray="18 12" strokeLinecap="round" pathLength={100} strokeDashoffset={0} opacity={q} />
            <circle cx={x2} cy={y2} r={30 + 6 * Math.sin(f / 4)} fill="none" stroke={RED} strokeWidth={7} opacity={q} />
            <circle cx={x2} cy={y2} r={12} fill={RED} opacity={q} />
          </svg>
        );
      })() : null}
      <Pill x={540} y={560} t={showT(f, T.reason - 4, T.so)} text="NEEDED: A REASON" color={GOLD} size={56} fg={INK} />

      {/* ── 3 · the plan ── */}
      <Photo f={f} src="northwoodsglobe/photos/memo.png" caption="The real memo, 13 March 1962 (declassified)" from={T.joint - 4} to={T.friendly - 4} x={540} y={600} w={430} h={520} rot={-2} fit="cover" focus="50% 30%" bg="#FFF" />
      {ideasOn > 0 ? (
        <div style={{ position: "absolute", left: 540, top: 420, transform: "translate(-50%, -50%)", opacity: ideasOn, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontFamily: LUCKIEST, fontSize: 40, color: "#FFFFFF", WebkitTextStroke: `3px ${INK}`, paintOrder: "stroke", marginRight: 8, paddingTop: 6 }}>THE IDEAS</div>
          {IDEAS.map((a, i) => {
            const on = i < ideaN;
            return (
              <div key={i} style={{ position: "relative", width: 54, height: 54, borderRadius: 27, background: on ? YELLOW : "rgba(255,255,255,0.18)", border: `4px solid ${INK}`, display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: LUCKIEST, fontSize: 32, color: INK, paddingTop: 4, transform: `scale(${on ? 0.9 + 0.1 * popAt(f, a - 2) : 0.9})` }}>
                {i + 1}
                {cancelled > 0 ? <div style={{ position: "absolute", left: -6, right: -6, top: 22, height: 8, background: RED, transform: `rotate(-35deg) scaleX(${cancelled})`, borderRadius: 4 }} /> : null}
              </div>
            );
          })}
        </div>
      ) : null}
      {/* idea 1: friendly Cubans in uniform at Guantanamo */}
      {onMap(P.gitmo, T.friendly - 2, T.ship - 4, <div style={{ display: "flex", gap: 6 }}><Icon kind="uniform" s={86} /><Icon kind="uniform" s={86} /></div>, "i1", -70)}
      <Panel y={590} k={showT(f, T.uniforms - 4, T.ship - 4)} style={{ padding: "12px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <Icon kind="uniform" s={90} /><Big size={52}>→</Big><Flag cc="CU" w={86} /><Label size={30} style={{ maxWidth: 240 }}>fake “Cuban” attack on the US base</Label>
      </Panel>
      {/* idea 2: a ship in Guantanamo Bay */}
      {onMap([-75.15, 19.98], T.ship - 2, T.terror - 4, <div style={{ transform: `rotate(${Math.sin(f / 7) * 3}deg)` }}><Icon kind="ship" s={110} /></div>, "i2", -40)}
      <Stamp x={540} y={600} f={f} a={T.blamed - 4} b={T.remember - 2} text="BLAME CUBA" color={CUBA_RED} size={78} rot={-6} />
      <Photo f={f} src="northwoodsglobe/photos/maine.jpg" caption="“Destruction of the U.S. battleship Maine”, Havana, 1898 (print)" from={T.remember - 4} to={T.terror - 2} x={540} y={700} w={520} h={330} rot={2} focus="55% 50%" />
      <Pill x={540} y={920} t={showT(f, T.y1898 - 4, T.terror - 2)} text="1898 → WAR WITH SPAIN" color={GOLD} size={42} fg={INK} />
      {/* idea 3: terror campaign pins */}
      {([[P.miami, T.miami], [P.tampa, T.otherFl], [P.orlando, T.otherFl + 6], [P.jacksonville, T.otherFl + 12], [P.washington, T.dc]] as const).map(([ll, a], i) =>
        onMap(ll as LL, a - 2, T.boat - 4, <div style={{ transform: `scale(${1 + 0.08 * Math.sin(f / 4 + i)})` }}><Icon kind="warn" s={62} /></div>, "i3" + i, -36))}
      <Pill x={540} y={590} t={showT(f, T.terror - 2, T.boat - 4)} text="FAKE “CUBAN” TERROR CAMPAIGN" color={RED} size={44} />
      {/* idea 4: refugee boat, real or simulated */}
      {f >= T.boat - 4 && f < T.airliner - 2 ? (() => {
        const [x, y] = at(along(BOAT, boatP));
        const ghost = f >= T.real - 2 && Math.floor((f - T.real) / 8) % 2 === 0;
        return x < -500 ? null : <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -70%) scale(${popAt(f, T.boat - 4) * (1 - ramp(f, T.airliner - 10, 8))}) rotate(${Math.sin(f / 6) * 5}deg)` }}><Icon kind="boat" s={96} ghost={ghost} /></div>;
      })() : null}
      <Panel y={590} k={showT(f, T.real - 4, T.airliner - 2)} style={{ padding: "12px 30px", display: "flex", alignItems: "center", gap: 18 }}>
        <Icon kind="boat" s={80} /><Big size={52}>REAL</Big><Big size={44} color="#8A8273">or</Big><Icon kind="boat" s={80} ghost /><Big size={52} color="#8A8273">FAKE</Big>
      </Panel>
      {/* idea 5: airliner swapped for a drone */}
      {f >= T.airliner - 4 && f < T.oneLine ? (() => {
        const [x, y] = at(along(FLIGHT, planeP));
        const k = popAt(f, T.airliner - 4) * (1 - ramp(f, T.oneLine - 8, 8));
        const flip = swapped ? interpolate(f, [T.drone - 2, T.drone + 8], [0, 1], clamp) : 0;
        return x < -500 ? null : (
          <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${k}) rotate(${-125 + Math.sin(f / 10) * 3}deg)` }}>
            <div style={{ transform: `scaleX(${Math.abs(Math.cos(flip * Math.PI))})` }}><Icon kind={flip > 0.5 ? "drone" : "plane"} s={110} /></div>
          </div>
        );
      })() : null}
      <Panel y={590} k={showT(f, T.swapped - 4, T.oneLine)} style={{ padding: "12px 26px", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ textAlign: "center" }}><Icon kind="plane" s={80} /><Label size={24}>airliner</Label></div>
        <Big size={56}>⇄</Big>
        <div style={{ textAlign: "center", opacity: ramp(f, T.drone - 4, 8) }}><Icon kind="drone" s={80} /><Label size={24}>empty drone</Label></div>
        {f >= T.cubanJet - 4 ? <div style={{ display: "flex", alignItems: "center", gap: 10, transform: `scale(${popAt(f, T.cubanJet - 4)})` }}><Big size={44}>→</Big><Flag cc="CU" w={70} /><Label size={24}>blamed</Label></div> : null}
      </Panel>
      {/* the casualty-list line, typed out */}
      {f >= T.oneLine - 4 && f < T.general ? (
        <div style={{ position: "absolute", left: 540, top: 1420, transform: `translate(-50%, -50%) scale(${popAt(f, T.oneLine - 4) * (1 - ramp(f, T.general - 8, 8))}) rotate(-1deg)`, width: 900,
          background: PAPER, border: `5px solid ${INK}`, borderRadius: 14, padding: "26px 34px", boxShadow: "0 16px 30px rgba(0,0,0,0.45)" }}>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 46, lineHeight: 1.3, color: INK, minHeight: 240 }}>
            {QUOTE.slice(0, typedN)}<span style={{ opacity: Math.floor(f / 8) % 2 ? 1 : 0 }}>▍</span>
          </div>
          <div style={{ height: 8, width: `${underline * 60}%`, marginLeft: "18%", background: RED, borderRadius: 4, marginTop: 6 }} />
          <div style={{ fontFamily: NUNITO, fontWeight: 800, fontSize: 24, color: "#5B5444", marginTop: 10 }}>From the memo's list of pretexts, item 3</div>
        </div>
      ) : null}

      {/* ── 4 · what happened ── */}
      <Photo f={f} src="northwoodsglobe/photos/lemnitzer.jpg" caption="Gen. Lyman L. Lemnitzer (portrait, 1957)" from={T.general - 2} to={T.threeLater} x={790} y={590} w={270} h={330} rot={3} focus="50% 30%" />
      <Panel x={330} y={560} k={showT(f, T.sent - 4, T.threeLater)} style={{ padding: "14px 24px", display: "flex", alignItems: "center", gap: 14 }}>
        <Icon kind="pages" s={80} /><div><Label size={28}>to the Secretary</Label><Label size={28}>of Defense</Label><Big size={44} color={RED} style={{ opacity: ramp(f, T.march13 - 4, 8) }}>MAR 13</Big></div>
      </Panel>
      {f >= T.threeLater - 4 && f < T.nothing - 4 ? (
        <div style={{ position: "absolute", left: 300, top: 560, transform: `translate(-50%, -50%) scale(${popAt(f, T.threeLater - 4) * (1 - ramp(f, T.nothing - 12, 8))}) rotate(-4deg)` }}>
          <CalPage top="MARCH" big={String(Math.min(16, 13 + Math.max(0, Math.floor((f - T.threeLater) / 6))))} w={190} color={US_BLUE} />
        </div>
      ) : null}
      <Photo f={f} src="northwoodsglobe/photos/kennedy.jpg" caption="President John F. Kennedy" from={T.kennedy - 6} to={T.nothing - 4} x={760} y={590} w={300} h={340} rot={3} focus="50% 30%" />
      {folderBack > 0 ? (
        <div style={{ position: "absolute", left: 540, top: 600, transform: `translate(-50%, -50%) scale(${folderBack})` }}>
          <Folder w={520} sign={1} f={f} notApproved={interpolate(f, [T.approved - 2, T.approved + 6], [0, 1], clamp)} />
        </div>
      ) : null}
      <Pill x={540} y={860} t={showT(f, T.none - 2, T.fall)} text="NONE OF IT HAPPENED" color={GREEN} size={46} />
      {f >= T.europe - 14 && f < T.thirtyFive - 4 ? (() => {
        const q = interpolate(f, [T.europe - 14, T.nato + 6], [0, 1], inout);
        const ip = geoInterpolate(P.washington, P.paris);
        const [x, y] = at(ip(q) as LL);
        return x < -500 ? null : <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -100%) scale(${popAt(f, T.europe - 14) * (1 - ramp(f, T.thirtyFive - 10, 8))})` }}><Pin s={58} color={GOLD} /></div>;
      })() : null}
      <Panel y={560} k={showT(f, T.term - 4, T.thirtyFive - 4)} style={{ padding: "12px 26px", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 90, height: 110, borderRadius: 10, overflow: "hidden", border: `4px solid ${INK}` }}><Img src={staticFile("northwoodsglobe/photos/lemnitzer.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 25%" }} /></div>
        <div><Label size={30}>Chairman → term ended</Label><Label size={30} color={GOLD} style={{ opacity: ramp(f, T.europe - 4, 8), WebkitTextStroke: "0" }}>→ NATO command, Europe</Label></div>
      </Panel>

      {/* ── 5 · the file ── */}
      {f >= T.thirtyFive - 4 && f < T.board ? (
        <div style={{ position: "absolute", left: 540, top: 560, transform: `translate(-50%, -50%) scale(${popAt(f, T.thirtyFive - 4) * (1 - ramp(f, T.board - 8, 8))})`, display: "flex", alignItems: "center", gap: 24,
          background: PAPER, border: `5px solid ${INK}`, borderRadius: 28, padding: "16px 30px", boxShadow: "0 14px 30px rgba(0,0,0,0.4)" }}>
          <div style={{ transform: `rotate(${f >= T.y1997 ? interpolate(f, [T.y1997 - 6, T.y1997 + 10], [0, 90], clamp) : 0}deg)` }}><Icon kind="vault" s={170} /></div>
          <div style={{ textAlign: "center" }}>
            <Big size={110} color={INK}>{Math.round(1962 + 35 * interpolate(f, [T.thirtyFive, T.y1997], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) }))}</Big>
            <Label size={34} style={{ whiteSpace: "nowrap" }}>35 years locked away</Label>
          </div>
        </div>
      ) : null}
      <Stamp x={540} y={800} f={f} a={T.y1997} b={T.scary} text="DECLASSIFIED 1997" color={GREEN} size={70} rot={-5} />
      <Panel y={560} k={showT(f, T.board - 4, T.scary)} style={{ padding: "14px 28px", display: "flex", alignItems: "center", gap: 20 }}>
        <Icon kind="pages" s={110} />
        <div><Big size={84} color={INK}>{fmt(count(f, T.board, T.pages + 6, 1500))}+</Big><Label size={28}>pages released by the JFK Records board</Label></div>
      </Panel>
      {f >= T.scary - 4 && f < T.conspiracy2 - 6 ? (
        <div style={{ position: "absolute", left: 540, top: 600, transform: `translate(-50%, -50%) scale(${popAt(f, T.scary - 4) * (1 - ramp(f, T.conspiracy2 - 14, 8))})`, display: "flex", alignItems: "center", gap: 14,
          background: PAPER, border: `5px solid ${INK}`, borderRadius: 26, padding: "18px 26px", boxShadow: "0 14px 30px rgba(0,0,0,0.4)" }}>
          {([["typewriter", T.typed, "typed"], ["pen", T.signedUp, "signed"], ["chain", T.chain, "sent up"]] as const).map(([k, a, lab], i) => (
            <React.Fragment key={k}>
              {i ? <Big size={50} color="#8A8273" style={{ opacity: ramp(f, a - 4, 6) }}>→</Big> : null}
              <div style={{ textAlign: "center", transform: `scale(${popAt(f, a - 4)})` }}><Icon kind={k} s={100} /><Label size={26}>{lab}</Label></div>
            </React.Fragment>
          ))}
        </div>
      ) : null}
      <Stamp x={540} y={760} f={f} a={T.notThis} b={SUBSCRIBE_AT + 2} text="IT'S REAL" color={GREEN} size={96} rot={-6} />
      {f >= T.read - 6 && f < SUBSCRIBE_AT + 2 ? (
        <div style={{ position: "absolute", left: 540, top: 1430, transform: `translate(-50%, -50%) scale(${popAt(f, T.read - 6) * (1 - ramp(f, SUBSCRIBE_AT - 4, 6))})`, display: "flex", alignItems: "center", gap: 18,
          background: PAPER, border: `5px solid ${INK}`, borderRadius: 22, padding: "14px 24px", boxShadow: "0 14px 30px rgba(0,0,0,0.4)" }}>
          <Icon kind="archive" s={100} />
          <div style={{ width: 120, height: 150, border: `3px solid ${INK}`, overflow: "hidden", borderRadius: 6, background: "#FFF" }}><Img src={staticFile("northwoodsglobe/photos/memo.png")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 20%" }} /></div>
          <Label size={30} style={{ maxWidth: 300 }}>US National Archives, JFK Collection</Label>
        </div>
      ) : null}

      {nameTags.map(([ll, name, a, b, col, fg], i) => {
        const [x, y] = at(ll);
        if (x < -500) return null;
        const half = (name.length * 21 + 50) / 2;
        return <NameTag key={"nt" + i} x={Math.min(1040 - half, Math.max(40 + half, x))} y={y} t={showT(f, a, b)} text={name} color={col} fg={fg} />;
      })}
      <Ribbon f={f} />
      <Explorer f={f} />

      <Sequence from={SUBSCRIBE_AT} durationInFrames={ATLAS_SUBSCRIBE_FRAMES}><AtlasSubscribe y={980} /></Sequence>
      <Sound music={music} />
    </AbsoluteFill>
  );
};

/** Sound only (narration + effects + music): render with the Meta music and swap it into the YouTube MP4 for Facebook. */
export const NorthwoodsGlobeAudio: React.FC<{ music?: MusicSet }> = ({ music = "meta" }) => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Sequence from={SUBSCRIBE_AT} durationInFrames={ATLAS_SUBSCRIBE_FRAMES}><AtlasSubscribe y={980} /></Sequence>
    <Sound music={music} />
  </AbsoluteFill>
);

// ── thumbnail (1080×1920; text and key art inside y 320–1600, centre free for the play button) ─────

/** The TOP SECRET folder over Florida and Cuba, with a real memo corner and the question. */
export const NorthwoodsGlobeThumb: React.FC = () => {
  const big: React.CSSProperties = { fontFamily: LUCKIEST, lineHeight: 1, color: "#FFFFFF", WebkitTextStroke: `9px ${INK}`, paintOrder: "stroke", textShadow: "0 12px 0 rgba(0,0,0,0.35)", whiteSpace: "nowrap" };
  const pose: Pose = { lon: -79.5, lat: 25.5, z: 2.9 };
  return (
    <AbsoluteFill style={{ background: PAL.bg, overflow: "hidden" }}>
      <Backdrop f={0} />
      <Globe f={T.blame + 20} pose={pose} />
      <div style={{ position: "absolute", left: 540, top: 340, transform: "translateX(-50%)", textAlign: "center" }}>
        <div style={{ ...big, fontSize: 96 }}>THE US MILITARY'S</div>
        <div style={{ ...big, fontSize: 132, color: YELLOW, paddingTop: 10 }}>SECRET PLAN</div>
      </div>
      <div style={{ position: "absolute", left: 790, top: 1230, transform: "translate(-50%, -50%) rotate(6deg)" }}>
        <div style={{ background: "#FFF", padding: 10, border: `5px solid ${INK}`, borderRadius: 8, boxShadow: "0 16px 30px rgba(0,0,0,0.5)" }}>
          <div style={{ width: 300, height: 360, overflow: "hidden" }}><Img src={staticFile("northwoodsglobe/photos/memo.png")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 22%" }} /></div>
        </div>
        <div style={{ position: "absolute", left: "50%", top: "46%", transform: "translate(-50%, -50%) rotate(-14deg)", fontFamily: LUCKIEST, fontSize: 58, color: RED, border: `8px solid ${RED}`, borderRadius: 14, padding: "8px 16px 0", background: "rgba(255,253,246,0.85)", whiteSpace: "nowrap" }}>TOP SECRET</div>
      </div>
      <div style={{ position: "absolute", left: 540, top: 1460, transform: "translateX(-50%) rotate(-2deg)", textAlign: "center" }}>
        <div style={{ ...big, fontSize: 92 }}>AGAINST <span style={{ color: CUBA_RED }}>AMERICANS</span></div>
      </div>
      <Img src={staticFile("paper/props/ab_exp_surprised.png")} style={{ position: "absolute", left: 170, top: 1440, height: 430, width: "auto", transform: "translate(-50%, -100%)", filter: "drop-shadow(0 10px 10px rgba(0,0,0,0.4))" }} />
    </AbsoluteFill>
  );
};
