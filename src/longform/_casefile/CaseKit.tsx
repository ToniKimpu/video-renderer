import type { ReactNode } from "react";
import { Img, staticFile } from "remotion";
import { loadFont as loadCourier } from "@remotion/google-fonts/CourierPrime";
import { loadFont as loadCaveat } from "@remotion/google-fonts/Caveat";
import { CINZEL, NUNITO, PAPER } from "../../shorts/_engine/paper/theme";

/**
 * "Case file" pieces for investigative long-form videos in the paper style:
 * typewritten document excerpts with redactions and highlighter, slammed ink
 * stamps, an evidence board of pinned cards tied with red string, a silhouette
 * card for people we have no free photo of, a boarding pass, a timeline ribbon,
 * and a "they say / they say" split card. Screen-space unless noted; animate
 * with `t` (0 → 1).
 */

export const { fontFamily: COURIER } = loadCourier("normal", { weights: ["400", "700"], subsets: ["latin"] });
export const { fontFamily: HAND } = loadCaveat("normal", { weights: ["700"], subsets: ["latin"] });

export const RED = "#B3261E";
export const MANILA = "#E9D3A1";
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const back = (k: number) => 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2);

/* ---------- document excerpt ---------- */

/** A run of document text. `redact` 1 = blacked out, 0 = revealed; `mark` 0→1 sweeps a highlighter. */
export type DocRun = { text: string; redact?: number; mark?: number; bold?: boolean };
export type DocLine = DocRun[] | string;

/**
 * A typewritten document excerpt (manila sheet, header rule, typed lines).
 * `typed` 0→1 types the lines on in order. Real words only: label it as an excerpt.
 */
export const DocCard: React.FC<{
  x: number; y: number; w: number; t: number; head: string; sub?: string; lines: DocLine[];
  typed?: number; size?: number; rotate?: number; foot?: string; children?: ReactNode;
}> = ({ x, y, w, t, head, sub, lines, typed = 1, size = 34, rotate = -1.2, foot, children }) => {
  if (t <= 0) return null;
  const k = clamp01(t * 1.3);
  const total = lines.reduce<number>((s, l) => s + (typeof l === "string" ? l.length : l.reduce((a, r) => a + r.text.length, 0)), 0);
  let budget = Math.round(typed * total);
  const take = (s: string) => {
    const n = Math.max(0, Math.min(s.length, budget));
    budget -= n;
    return s.slice(0, n);
  };
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y, width: w, opacity: k,
      transform: `translateY(${(1 - k) * 30}px) rotate(${rotate}deg)`, background: "#F6EBD0",
      backgroundImage: "linear-gradient(rgba(120,90,40,0.06) 1px, transparent 1px)", backgroundSize: `100% ${Math.round(size * 1.5)}px`,
      border: "1px solid rgba(90,60,20,0.35)", boxShadow: "0 18px 40px rgba(60,40,10,0.35)", padding: "30px 40px 34px", color: "#1E1A16" }}>
      <div style={{ fontFamily: COURIER, fontWeight: 700, fontSize: size * 0.8, letterSpacing: 3, borderBottom: "3px double #1E1A16", paddingBottom: 10 }}>{head}</div>
      {sub && <div style={{ fontFamily: COURIER, fontSize: size * 0.62, opacity: 0.7, marginTop: 6 }}>{sub}</div>}
      <div style={{ marginTop: 18, fontFamily: COURIER, fontSize: size, lineHeight: 1.5 }}>
        {lines.map((l, i) => {
          const runs = typeof l === "string" ? [{ text: l }] : l;
          return (
            <div key={i} style={{ minHeight: size * 1.5 }}>
              {runs.map((r, j) => {
                const shown = take(r.text);
                if (!shown) return null;
                const red = clamp01(r.redact ?? 0);
                const mark = clamp01(r.mark ?? 0);
                return (
                  <span key={j} style={{ position: "relative", fontWeight: r.bold ? 700 : 400, whiteSpace: "pre-wrap" }}>
                    {mark > 0 && <span style={{ position: "absolute", left: -4, top: "18%", height: "70%", width: `calc(${mark * 100}% + 8px)`, background: "rgba(242,201,76,0.75)", zIndex: 0 }} />}
                    <span style={{ position: "relative", zIndex: 1 }}>{shown}</span>
                    {red > 0 && <span style={{ position: "absolute", left: -2, top: "12%", height: "80%", width: `calc(${red * 100}% + 4px)`, background: "#141414", zIndex: 2 }} />}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
      {foot && <div style={{ marginTop: 14, fontFamily: NUNITO, fontWeight: 800, fontSize: 18, opacity: 0.55, textAlign: "right" }}>{foot}</div>}
      {children}
    </div>
  );
};

/* ---------- stamp ---------- */

/** A rubber stamp that slams down (overshoot, then settles) at `t`. */
export const InkStamp: React.FC<{ x: number; y: number; t: number; text: string; color?: string; size?: number; rotate?: number; sub?: string }> = ({
  x, y, t, text, color = RED, size = 80, rotate = -8, sub,
}) => {
  if (t <= 0) return null;
  const k = clamp01(t * 2.2);
  const scale = 1.9 - 0.9 * back(k);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${scale})`, opacity: Math.min(1, k * 1.6) * 0.92,
      border: `${Math.max(5, size / 12)}px solid ${color}`, borderRadius: 10, padding: `${size * 0.08}px ${size * 0.3}px`, color, textAlign: "center",
      fontFamily: CINZEL, fontWeight: 900, fontSize: size, letterSpacing: size / 14, lineHeight: 1.05, whiteSpace: "nowrap",
      mixBlendMode: "multiply", filter: "url(#stamp-rough)" }}>
      {text}
      {sub && <div style={{ fontFamily: COURIER, fontWeight: 700, fontSize: size * 0.32, letterSpacing: 2 }}>{sub}</div>}
    </div>
  );
};

/** SVG filter that roughens stamp edges; render once per frame (e.g. in the chapter scene). */
export const StampFilter: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <filter id="stamp-rough">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={4} result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale={5} />
    </filter>
  </svg>
);

/* ---------- people ---------- */

/** A person we have no free photo of: ink silhouette, name plate. Never an AI face. */
export const Silhouette: React.FC<{ x: number; y: number; t: number; name: string; sub?: string; w?: number; rotate?: number; color?: string }> = ({
  x, y, t, name, sub, w = 330, rotate = 0, color = PAPER.ink,
}) => {
  if (t <= 0) return null;
  const k = clamp01(t * 1.4);
  const h = w * 1.18;
  return (
    <div style={{ position: "absolute", left: x - w / 2 - 12, top: y, width: w + 24, opacity: k, transform: `translateY(${(1 - k) * 24}px) rotate(${rotate}deg)` }}>
      <div style={{ background: "#FBF3E2", padding: 12, border: `4px solid ${color}`, borderRadius: 6, boxShadow: "0 14px 30px rgba(60,40,10,0.3)" }}>
        <svg width={w} height={h} viewBox="0 0 100 118" style={{ display: "block", background: "#D9C9A6" }}>
          <circle cx={50} cy={44} r={20} fill="#3A3226" />
          <path d="M12 118 C14 84 30 70 50 70 C70 70 86 84 88 118 Z" fill="#3A3226" />
          <text x={50} y={52} textAnchor="middle" fontFamily={CINZEL} fontWeight={900} fontSize={22} fill="#D9C9A6">?</text>
        </svg>
        <div style={{ fontFamily: CINZEL, fontWeight: 900, fontSize: w / 10, textAlign: "center", marginTop: 10, color, lineHeight: 1.1 }}>{name}</div>
        {sub && <div style={{ fontFamily: NUNITO, fontWeight: 800, fontSize: w / 15, textAlign: "center", opacity: 0.7, marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  );
};

/**
 * A police booking shot: silhouette against a height chart, placard below.
 * `age` = frames since it appeared (drives the camera flash). Never an AI face.
 */
export const Mugshot: React.FC<{ x: number; y: number; t: number; age: number; placard: string; sub?: string; w?: number; rotate?: number }> = ({
  x, y, t, age, placard, sub, w = 380, rotate = -2,
}) => {
  if (t <= 0) return null;
  const k = clamp01(t * 1.4);
  const h = w * 1.1;
  const flash = age >= 0 && age < 10 ? 1 - age / 10 : 0;
  return (
    <div style={{ position: "absolute", left: x - w / 2 - 12, top: y, width: w + 24, opacity: k, transform: `translateY(${(1 - k) * -60}px) rotate(${rotate * k}deg)` }}>
      <div style={{ position: "relative", background: "#FBF3E2", padding: 12, border: `4px solid ${PAPER.ink}`, borderRadius: 6, boxShadow: "0 16px 34px rgba(60,40,10,0.35)" }}>
        <svg width={w} height={h} viewBox="0 0 100 110" style={{ display: "block", background: "#CFC3A8" }}>
          {Array.from({ length: 9 }, (_, i) => (
            <g key={i}>
              <line x1={0} x2={100} y1={8 + i * 11} y2={8 + i * 11} stroke="#2A251C" strokeWidth={i % 2 ? 0.4 : 0.9} opacity={0.55} />
              {i % 2 === 0 && <text x={2} y={7 + i * 11} fontFamily={COURIER} fontSize={4.2} fill="#2A251C" opacity={0.7}>{200 - i * 5}</text>}
            </g>
          ))}
          <circle cx={50} cy={42} r={18} fill="#2E281F" />
          <path d="M14 110 C16 80 31 66 50 66 C69 66 84 80 86 110 Z" fill="#2E281F" />
          <text x={50} y={49} textAnchor="middle" fontFamily={CINZEL} fontWeight={900} fontSize={20} fill="#CFC3A8">?</text>
        </svg>
        <div style={{ marginTop: 10, background: "#1C1A17", color: "#F4EEDF", fontFamily: COURIER, fontWeight: 700, textAlign: "center", padding: "10px 8px", lineHeight: 1.25 }}>
          <div style={{ fontSize: w / 13, letterSpacing: 2 }}>{placard}</div>
          {sub && <div style={{ fontSize: w / 19, opacity: 0.85 }}>{sub}</div>}
        </div>
        {flash > 0 && <div style={{ position: "absolute", inset: -40, background: "#fff", opacity: flash * 0.9, borderRadius: 30, filter: "blur(10px)" }} />}
      </div>
    </div>
  );
};

/* ---------- boarding pass ---------- */

export const BoardingPass: React.FC<{ x: number; y: number; t: number; from: string; to: string; date: string; note?: string; w?: number }> = ({
  x, y, t, from, to, date, note, w = 820,
}) => {
  if (t <= 0) return null;
  const k = clamp01(t * 1.4);
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y, width: w, opacity: k, transform: `translateX(${(1 - k) * -60}px) rotate(-2deg)`,
      display: "flex", background: "#F4ECD8", border: `4px solid ${PAPER.ink}`, borderRadius: 18, boxShadow: "0 16px 34px rgba(60,40,10,0.3)", overflow: "hidden" }}>
      <div style={{ flex: 1, padding: "22px 30px" }}>
        <div style={{ fontFamily: COURIER, fontWeight: 700, fontSize: 22, letterSpacing: 4, opacity: 0.7 }}>BOARDING PASS · ECONOMY</div>
        <div style={{ display: "flex", alignItems: "center", gap: 26, marginTop: 10 }}>
          <div style={{ fontFamily: NUNITO, fontWeight: 900, fontSize: 96, color: PAPER.ink }}>{from}</div>
          <svg width={110} height={40} viewBox="0 0 110 40"><path d="M4 20 H96 M80 6 L100 20 L80 34" stroke={RED} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <div style={{ fontFamily: NUNITO, fontWeight: 900, fontSize: 96, color: PAPER.ink }}>{to}</div>
        </div>
        <div style={{ fontFamily: COURIER, fontWeight: 700, fontSize: 30, marginTop: 4 }}>{date}</div>
        {note && <div style={{ fontFamily: NUNITO, fontWeight: 800, fontSize: 24, opacity: 0.7, marginTop: 6 }}>{note}</div>}
      </div>
      <div style={{ width: 150, borderLeft: `4px dashed ${PAPER.ink}`, background: "repeating-linear-gradient(90deg, #22304A 0 4px, transparent 4px 9px, #22304A 9px 11px, transparent 11px 17px)", opacity: 0.85 }} />
    </div>
  );
};

/* ---------- split card ---------- */

/** Two accounts side by side: who says what. `b` fades in the second side. */
export const SplitCard: React.FC<{ x: number; y: number; t: number; a: [string, string]; b: [string, string]; showB?: number; colors?: [string, string]; w?: number; size?: number }> = ({
  x, y, t, a, b, showB = 1, colors = [RED, PAPER.ink], w = 940, size = 34,
}) => {
  if (t <= 0) return null;
  const k = clamp01(t * 1.4);
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y, width: w, opacity: k, transform: `translateY(${(1 - k) * 24}px)`, display: "flex", gap: 22 }}>
      {[a, b].map(([head, body], i) => (
        <div key={head} style={{ flex: 1, background: "#FBF3E2", border: `4px solid ${colors[i]}`, borderRadius: 10, padding: "20px 24px",
          opacity: i ? clamp01(showB) : 1, transform: i ? `translateY(${(1 - clamp01(showB)) * 20}px)` : undefined, boxShadow: "0 12px 26px rgba(60,40,10,0.25)" }}>
          <div style={{ fontFamily: CINZEL, fontWeight: 900, fontSize: size * 0.95, letterSpacing: 2, color: colors[i] }}>{head}</div>
          <div style={{ fontFamily: NUNITO, fontWeight: 800, fontSize: size, lineHeight: 1.2, marginTop: 8, color: PAPER.ink }}>{body}</div>
        </div>
      ))}
    </div>
  );
};

/* ---------- timeline ribbon ---------- */

/**
 * The story's clock, along the top of the page: years 1999 → 2027 with an ink
 * marker at the year the narration is in (fractional years glide).
 */
export const TimelineRibbon: React.FC<{ year: number; t?: number; from?: number; to?: number }> = ({ year, t = 1, from = 1999, to = 2027 }) => {
  if (t <= 0) return null;
  const X0 = 430, W = 1060, Y = 52;
  const px = (yr: number) => X0 + ((yr - from) / (to - from)) * W;
  const ticks = [1999, 2000, 2001, 2002, 2004, 2007, 2012, 2016, 2021, 2024, 2025, 2026];
  const label = [1999, 2001, 2004, 2012, 2021, 2026];
  const mx = px(Math.max(from, Math.min(to, year)));
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 120, opacity: t, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: X0, top: Y, width: W, height: 3, background: "rgba(34,48,74,0.25)" }} />
      <div style={{ position: "absolute", left: X0, top: Y, width: mx - X0, height: 3, background: RED }} />
      {ticks.map((yr) => (
        <div key={yr} style={{ position: "absolute", left: px(yr) - 1, top: Y - 6, width: 2, height: 15, background: "rgba(34,48,74,0.45)" }} />
      ))}
      {label.map((yr) => (
        <div key={yr} style={{ position: "absolute", left: px(yr) - 40, top: Y + 12, width: 80, textAlign: "center", fontFamily: COURIER, fontWeight: 700, fontSize: 17, color: PAPER.ink, opacity: 0.55 }}>{yr}</div>
      ))}
      <div style={{ position: "absolute", left: mx - 11, top: Y - 10, width: 22, height: 22, borderRadius: 11, background: RED, border: `3px solid ${PAPER.ink}` }} />
      <div style={{ position: "absolute", left: mx - 60, top: Y - 44, width: 120, textAlign: "center", fontFamily: CINZEL, fontWeight: 900, fontSize: 24, color: RED }}>{Math.floor(year)}</div>
    </div>
  );
};

/* ---------- evidence board (world space) ---------- */

export type BoardItem = {
  id: string;
  /** Centre on the board, board px. */
  x: number; y: number;
  w: number;
  rotate?: number;
  /** Absolute video frame at which it gets pinned. */
  at: number;
  kind: "photo" | "prop" | "note" | "doc" | "person";
  src?: string;
  h?: number;
  title?: string;
  body?: string;
  credit?: string;
};
export type BoardString = { a: string; b: string; at: number };

const PushPin: React.FC<{ color?: string }> = ({ color = RED }) => (
  <svg width={44} height={44} viewBox="0 0 44 44" style={{ position: "absolute", left: "50%", top: -24, marginLeft: -22, zIndex: 3, overflow: "visible" }}>
    <ellipse cx={26} cy={34} rx={10} ry={4} fill="rgba(0,0,0,0.25)" />
    <circle cx={22} cy={20} r={13} fill={color} stroke="#5A1410" strokeWidth={2} />
    <circle cx={18} cy={16} r={4} fill="rgba(255,255,255,0.55)" />
  </svg>
);

const BoardCard: React.FC<{ it: BoardItem; k: number; glow: number }> = ({ it, k, glow }) => {
  const drop = back(clamp01(k));
  const base: React.CSSProperties = {
    position: "absolute", left: it.x - it.w / 2, top: it.y - (it.h ?? it.w * 0.75) / 2, width: it.w,
    transform: `rotate(${it.rotate ?? 0}deg) scale(${0.6 + 0.4 * drop})`, opacity: clamp01(k * 2),
    boxShadow: glow > 0 ? `0 0 0 ${8 * glow}px rgba(242,201,76,0.9), 0 18px 34px rgba(40,25,5,0.35)` : "0 18px 34px rgba(40,25,5,0.35)",
  };
  if (it.kind === "photo" || it.kind === "person") {
    return (
      <div style={{ ...base, background: "#FBF3E2", padding: "14px 14px 0" }}>
        <PushPin />
        <div style={{ width: "100%", height: it.h ?? it.w * 0.75, overflow: "hidden", background: "#D9C9A6" }}>
          {it.src ? <Img src={staticFile(it.src)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "sepia(0.25) saturate(0.85)" }} />
            : <svg width="100%" height="100%" viewBox="0 0 100 118" preserveAspectRatio="xMidYMax meet"><circle cx={50} cy={44} r={20} fill="#3A3226" /><path d="M12 118 C14 84 30 70 50 70 C70 70 86 84 88 118 Z" fill="#3A3226" /></svg>}
        </div>
        <div style={{ fontFamily: HAND, fontWeight: 700, fontSize: it.w / 9, textAlign: "center", padding: "6px 0 10px", color: "#1E1A16", lineHeight: 1.05 }}>{it.title}</div>
      </div>
    );
  }
  if (it.kind === "prop") {
    return (
      <div style={{ ...base, boxShadow: "none" }}>
        <PushPin />
        <Img src={staticFile(it.src ?? "")} style={{ width: "100%", filter: glow > 0 ? `drop-shadow(0 0 ${14 * glow}px rgba(242,201,76,1))` : "drop-shadow(0 12px 16px rgba(40,25,5,0.35))" }} />
        {it.title && <div style={{ fontFamily: HAND, fontWeight: 700, fontSize: it.w / 8, textAlign: "center", color: "#1E1A16", marginTop: -6 }}>{it.title}</div>}
      </div>
    );
  }
  if (it.kind === "doc") {
    return (
      <div style={{ ...base, background: "#F6EBD0", padding: "18px 20px", fontFamily: COURIER, color: "#1E1A16" }}>
        <PushPin color="#2F4F7F" />
        <div style={{ fontWeight: 700, fontSize: it.w / 13, borderBottom: "2px solid #1E1A16", paddingBottom: 6 }}>{it.title}</div>
        <div style={{ fontSize: it.w / 15, marginTop: 8, lineHeight: 1.35 }}>{it.body}</div>
      </div>
    );
  }
  return (
    <div style={{ ...base, background: "#FFF3B8", padding: "20px 22px", fontFamily: HAND, color: "#1E1A16" }}>
      <PushPin color="#2F6FB5" />
      <div style={{ fontWeight: 700, fontSize: it.w / 7, lineHeight: 1 }}>{it.title}</div>
      {it.body && <div style={{ fontWeight: 700, fontSize: it.w / 11, lineHeight: 1.1, marginTop: 8, opacity: 0.85 }}>{it.body}</div>}
    </div>
  );
};

/**
 * The evidence board: items pinned at their `at` frame, red strings drawn between
 * them. World space (board px); `cam` puts board point (cam.x, cam.y) at screen
 * (cx, cy) with scale cam.s. `frame` is the absolute video frame.
 */
export const EvidenceBoard: React.FC<{
  frame: number; items: BoardItem[]; strings: BoardString[]; cam: { x: number; y: number; s: number };
  cx?: number; cy?: number; t?: number; glow?: Record<string, number>; question?: { x: number; y: number; at: number };
}> = ({ frame, items, strings, cam, cx = 960, cy = 540, t = 1, glow = {}, question }) => {
  if (t <= 0) return null;
  const byId = new Map(items.map((i) => [i.id, i]));
  const vis = (at: number, dur = 14) => clamp01((frame - at) / dur);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity: t }}>
      <div style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0",
        transform: `translate(${cx - cam.x * cam.s}px, ${cy - cam.y * cam.s}px) scale(${cam.s})` }}>
        <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", zIndex: 1 }}>
          {strings.map((s, i) => {
            const a = byId.get(s.a), b = byId.get(s.b);
            if (!a || !b) return null;
            const p = clamp01((frame - s.at) / 22);
            if (p <= 0) return null;
            const ay = a.y - (a.h ?? a.w * 0.75) / 2 + 2, by = b.y - (b.h ?? b.w * 0.75) / 2 + 2;
            const mx = (a.x + b.x) / 2, my = Math.max(ay, by) + Math.abs(b.x - a.x) * 0.08 + 30;
            return (
              <path key={i} d={`M${a.x} ${ay} Q${mx} ${my} ${b.x} ${by}`} fill="none" stroke={RED} strokeWidth={5} strokeLinecap="round"
                pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} style={{ filter: "drop-shadow(0 3px 2px rgba(0,0,0,0.3))" }} />
            );
          })}
        </svg>
        {items.map((it) => {
          const k = vis(it.at);
          return k > 0 ? <BoardCard key={it.id} it={it} k={k} glow={glow[it.id] ?? 0} /> : null;
        })}
        {question && vis(question.at) > 0 && (
          <div style={{ position: "absolute", left: question.x - 150, top: question.y - 170, width: 300, height: 340, background: "#FFF3B8",
            transform: `rotate(3deg) scale(${0.6 + 0.4 * back(vis(question.at))})`, boxShadow: "0 18px 34px rgba(40,25,5,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center", fontFamily: HAND, fontWeight: 700, fontSize: 260, color: RED, zIndex: 2 }}>
            ?
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------- descent diagram ---------- */

/** Plane, horizon and a target: the descent line draws on (`p`), angle arc after. Illustrative. */
export const DescentDiagram: React.FC<{ x: number; y: number; t: number; p: number; w?: number }> = ({ x, y, t, p, w = 900 }) => {
  if (t <= 0) return null;
  const k = clamp01(t * 1.4);
  const q = clamp01(p);
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y, width: w, opacity: k, background: "#FBF3E2", border: `4px solid ${PAPER.ink}`, borderRadius: 10, padding: 20, boxShadow: "0 14px 30px rgba(60,40,10,0.3)" }}>
      <svg width={w - 40} height={(w - 40) * 0.45} viewBox="0 0 860 390">
        <path d="M20 330 H840" stroke={PAPER.ink} strokeWidth={4} />
        <text x={830} y={366} textAnchor="end" fontFamily={COURIER} fontSize={24} fill={PAPER.ink}>horizon</text>
        <g transform="translate(70 60)">
          <path d="M0 20 L70 14 L92 0 L100 4 L86 18 L110 22 L86 26 L100 40 L92 44 L70 30 L0 24 Z" fill={PAPER.ink} />
        </g>
        <path d="M160 85 L760 320" stroke={RED} strokeWidth={6} strokeDasharray="18 12" pathLength={1}
          style={{ strokeDasharray: 1, strokeDashoffset: 1 - q }} />
        <circle cx={760} cy={322} r={16 * q} fill="none" stroke={RED} strokeWidth={6} />
        <circle cx={760} cy={322} r={5} fill={RED} opacity={q} />
        <path d="M160 85 V330" stroke={PAPER.ink} strokeWidth={3} strokeDasharray="8 8" opacity={0.5} />
        <text x={172} y={220} fontFamily={COURIER} fontSize={26} fill={PAPER.ink} opacity={0.75}>height</text>
        <text x={420} y={366} fontFamily={COURIER} fontSize={26} fill={PAPER.ink} opacity={0.75}>distance to target</text>
        <path d="M680 290 A90 90 0 0 0 690 330" fill="none" stroke={RED} strokeWidth={4} opacity={clamp01(q * 3 - 2)} />
        <text x={600} y={300} fontFamily={COURIER} fontWeight={700} fontSize={30} fill={RED} opacity={clamp01(q * 3 - 2)}>descent</text>
      </svg>
      <div style={{ fontFamily: NUNITO, fontWeight: 800, fontSize: 20, opacity: 0.6, textAlign: "right" }}>Illustration of what experts say the formula could calculate</div>
    </div>
  );
};

/** Darker edges for the case-file mood (screen overlay, under captions). */
export const CaseVignette: React.FC<{ amount?: number }> = ({ amount = 1 }) => (
  <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: amount,
    background: "radial-gradient(ellipse 75% 70% at 50% 48%, transparent 55%, rgba(70,45,15,0.28) 85%, rgba(50,30,8,0.5) 100%)" }} />
);
