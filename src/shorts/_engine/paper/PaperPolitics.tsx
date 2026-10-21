import { Img } from "remotion";
import { PaperCard } from "./PaperWidgets";
import { CINZEL, NUNITO, PAPER } from "./theme";

/**
 * Paper-style widgets for politics stories: real-person photo cards, the
 * parliament hemicycle, date stamps, threshold bars and Codex-drawn props.
 * Screen-space; animate with `t` (0 → 1), like PaperWidgets.
 */

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const appear = (t: number) => ({
  opacity: clamp01(t * 1.5),
  transform: `translateY(${(1 - clamp01(t)) * 24}px) scale(${0.92 + 0.08 * clamp01(t)})`,
});

/**
 * A real photograph pasted onto the page: cream mat, ink rule, two tape strips,
 * name plate below. Use for real people (Wikipedia/Commons portraits), never
 * AI-generated faces. `badge` adds a small stamp (e.g. "45 · 47").
 */
export const PortraitCard: React.FC<{
  x: number; y: number; t: number; src: string; name: string; sub?: string;
  w?: number; rotate?: number; badge?: string; badgeColor?: string; dim?: number;
}> = ({ x, y, t, src, name, sub, w = 330, rotate = 0, badge, badgeColor = PAPER.crimson, dim = 0 }) => {
  if (t <= 0) return null;
  const a = appear(t);
  const h = w * 1.18;
  const tape: React.CSSProperties = { position: "absolute", top: -18, width: 110, height: 38, background: "rgba(240,215,160,0.78)", border: "1px solid rgba(120,90,40,0.25)" };
  return (
    <div style={{ position: "absolute", left: x - w / 2 - 16, top: y, width: w + 32, opacity: a.opacity, transform: `${a.transform} rotate(${rotate}deg)` }}>
      <div style={{ position: "relative", background: "#FBF3E2", padding: 16, border: `4px solid ${PAPER.ink}`, borderRadius: 6, boxShadow: "0 14px 30px rgba(60,40,10,0.3)" }}>
        <Img src={src} style={{
          display: "block", width: w, height: h, objectFit: "cover", objectPosition: "50% 18%", border: `2px solid ${PAPER.ink}`,
          filter: `sepia(0.18) saturate(${0.9 - dim * 0.8}) contrast(1.02) brightness(${1 - dim * 0.25})`,
        }} />
        <div style={{ ...tape, left: -22, transform: "rotate(-24deg)" }} />
        <div style={{ ...tape, right: -22, transform: "rotate(22deg)" }} />
        {badge && (
          <div style={{
            position: "absolute", right: -24, top: 24, transform: "rotate(8deg)", fontFamily: CINZEL, fontWeight: 900, fontSize: Math.min(40, w * 0.14), letterSpacing: 2,
            color: "#FBF3E2", background: badgeColor, border: `4px solid ${PAPER.ink}`, borderRadius: 12, padding: "2px 16px", whiteSpace: "nowrap",
          }}>
            {badge}
          </div>
        )}
        <div style={{ textAlign: "center", marginTop: 12, fontFamily: CINZEL, fontWeight: 900, fontSize: Math.min(38, w * 0.125), letterSpacing: 1, color: PAPER.ink, lineHeight: 1.05 }}>{name}</div>
        {sub && <div style={{ textAlign: "center", marginTop: 4, fontFamily: NUNITO, fontWeight: 800, fontSize: 26, color: PAPER.ink, opacity: 0.7 }}>{sub}</div>}
      </div>
    </div>
  );
};

/**
 * A quoted social-media post or statement, in our own paper style: real photo,
 * the exact words in quotation marks, and a source line. Deliberately NOT a
 * replica of any platform's interface, so it reads as a quote, never a fake post.
 */
export const QuoteCard: React.FC<{ x: number; y: number; t: number; src: string; name: string; quote: string; source: string; w?: number }> = ({
  x, y, t, src, name, quote, source, w = 900,
}) => (
  <PaperCard x={x} y={y} w={w} t={t} rotate={-1}>
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <Img src={src} style={{ width: 96, height: 96, borderRadius: 48, objectFit: "cover", objectPosition: "50% 20%", border: `4px solid ${PAPER.ink}`, flex: "none" }} />
      <div>
        <div style={{ fontFamily: CINZEL, fontWeight: 900, fontSize: 38, letterSpacing: 2 }}>{name}</div>
        <div style={{ fontWeight: 800, fontSize: 24, opacity: 0.6 }}>{source}</div>
      </div>
    </div>
    <div style={{ position: "relative", marginTop: 18, paddingLeft: 26, borderLeft: `6px solid ${PAPER.crimson}`, fontWeight: 800, fontSize: 38, lineHeight: 1.25 }}>
      “{quote}”
    </div>
  </PaperCard>
);

/** An illustrated prop (Codex-generated, background cut to transparent), centred on (x, y), `size` = width. */
export const PaperProp: React.FC<{ x: number; y: number; t: number; src: string; size?: number; rotate?: number; flip?: boolean; grey?: number }> = ({
  x, y, t, src, size = 420, rotate = 0, flip = false, grey = 0,
}) => {
  if (t <= 0) return null;
  const a = appear(t);
  return (
    <Img src={src} style={{
      position: "absolute", left: x, top: y, width: size, height: "auto", pointerEvents: "none",
      opacity: a.opacity * (1 - grey * 0.4), transform: `translate(-50%, -50%) ${a.transform} rotate(${rotate}deg)${flip ? " scaleX(-1)" : ""}`,
      filter: `drop-shadow(0 10px 12px rgba(60,40,10,0.25)) grayscale(${grey})`,
    }} />
  );
};

export type HemiParty = { seats: number; color: string; dim?: number };

/**
 * Parliament seat diagram (hemicycle). Seats are ordered left → right by angle,
 * so each party reads as a wedge. `fill` 0..1 colours seats in order; `marker`
 * shows a dashed majority line after seat `majority`; `scatter` 0..1 breaks the
 * chamber apart (a coalition collapsing).
 */
export const Hemicycle: React.FC<{
  x: number; y: number; t: number; parties: HemiParty[]; fill: number; title?: string; caption?: string;
  majority?: number; marker?: number; scatter?: number; w?: number;
}> = ({ x, y, t, parties, fill, title, caption, majority, marker = 0, scatter = 0, w = 900 }) => {
  if (t <= 0) return null;
  const total = parties.reduce((s, p) => s + p.seats, 0);
  const rows = 8;
  const R = w / 2 - 30;
  const r0 = R * 0.4;
  const radii = Array.from({ length: rows }, (_, i) => r0 + ((R - r0) * i) / (rows - 1));
  const sumR = radii.reduce((a, b) => a + b, 0);
  const counts = radii.map((rr) => Math.round((rr / sumR) * total));
  counts[rows - 1] += total - counts.reduce((a, b) => a + b, 0);
  const seats: { a: number; r: number }[] = [];
  radii.forEach((rr, i) => {
    const n = counts[i];
    for (let j = 0; j < n; j++) seats.push({ a: Math.PI - (Math.PI * (j + 0.5)) / n, r: rr });
  });
  seats.sort((p, q) => q.a - p.a || p.r - q.r);
  const colorOf: { color: string; dim: number }[] = [];
  parties.forEach((p) => {
    for (let k = 0; k < p.seats; k++) colorOf.push({ color: p.color, dim: p.dim ?? 0 });
  });
  const cx = w / 2;
  const cy = R + 20;
  const seatR = ((R - r0) / (rows - 1)) * 0.42;
  const shown = fill * total;
  const mA = majority ? (seats[majority - 1].a + seats[majority].a) / 2 : 0;
  const a = appear(t);
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y, width: w, textAlign: "center", ...a }}>
      {/* Paper halo so the chamber reads cleanly over map linework. */}
      <div style={{ position: "absolute", left: -60, right: -60, top: -40, bottom: -40, background: "radial-gradient(ellipse 50% 50% at 50% 55%, rgba(251,243,226,0.94) 62%, rgba(251,243,226,0) 100%)" }} />
      {title && (
        <div style={{ position: "relative", fontFamily: CINZEL, fontWeight: 900, fontSize: 40, letterSpacing: 4, color: PAPER.ink, textShadow: "0 0 8px #FBF3E2, 0 0 14px #FBF3E2", marginBottom: 6 }}>
          {title}
        </div>
      )}
      <svg width={w} height={R + 40} style={{ position: "relative", overflow: "visible" }}>
        {seats.map((s, i) => {
          const on = clamp01(shown - i) > 0.5;
          const c = colorOf[i];
          const jitter = scatter * (40 + ((i * 37) % 60));
          const ang = s.a + scatter * (((i * 13) % 7) - 3) * 0.03;
          const px = cx + Math.cos(ang) * (s.r + jitter);
          const py = cy - Math.sin(ang) * (s.r + jitter) + scatter * scatter * ((i * 29) % 90);
          const op = (1 - c.dim * 0.78) * (1 - scatter * 0.55);
          return (
            <circle key={i} cx={px} cy={py} r={seatR} fill={on ? c.color : "#FBF3E2"} fillOpacity={on ? op : 0.9}
              stroke={PAPER.ink} strokeWidth={2.5} strokeOpacity={0.3 + 0.7 * op} />
          );
        })}
        {majority && marker > 0 && (
          <g opacity={clamp01(marker * 2)}>
            <line
              x1={cx + Math.cos(mA) * (r0 - 30)} y1={cy - Math.sin(mA) * (r0 - 30)}
              x2={cx + Math.cos(mA) * (R + 34)} y2={cy - Math.sin(mA) * (R + 34)}
              stroke={PAPER.crimson} strokeWidth={6} strokeDasharray="14 10" strokeLinecap="round"
            />
            <text x={cx} y={cy - 22} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={110} fill={PAPER.crimson} stroke={PAPER.ink} strokeWidth={3}>
              {majority}
            </text>
            <text x={cx} y={cy + 20} textAnchor="middle" fontFamily={CINZEL} fontWeight={900} fontSize={32} letterSpacing={3} fill={PAPER.ink}>TO GOVERN</text>
          </g>
        )}
      </svg>
      {caption && (
        <div style={{ position: "relative", fontFamily: NUNITO, fontWeight: 800, fontSize: 28, color: PAPER.ink, opacity: 0.75, marginTop: 34 }}>{caption}</div>
      )}
    </div>
  );
};

/** Grid of date stamps (e.g. election days). `shown` brings items in one by one; `dim` greys some out. */
export const StampRow: React.FC<{ x: number; y: number; t: number; items: { label: string; color?: string; dim?: number }[]; shown: number; cols?: number; cw?: number; size?: number }> = ({
  x, y, t, items, shown, cols = 3, cw = 300, size = 40,
}) => {
  if (t <= 0) return null;
  const a = appear(t);
  return (
    <div style={{ position: "absolute", left: x - (cols * cw) / 2, top: y, width: cols * cw, display: "flex", flexWrap: "wrap", justifyContent: "center", rowGap: 24, ...a }}>
      {items.map((it, i) => {
        const v = clamp01(shown - i);
        const d = it.dim ?? 0;
        const col = it.color ?? PAPER.blue;
        return (
          <div key={it.label} style={{ width: cw, display: "flex", justifyContent: "center" }}>
            <div style={{
              opacity: v * (1 - d * 0.6), transform: `rotate(${((i * 5) % 9) - 4}deg) scale(${1.5 - 0.5 * v})`,
              fontFamily: CINZEL, fontWeight: 900, fontSize: size, letterSpacing: 2, color: col, background: "rgba(251,243,226,0.92)",
              border: `5px solid ${col}`, borderRadius: 12, padding: "8px 18px", boxShadow: `inset 0 0 0 3px #FBF3E2, inset 0 0 0 5px ${col}55`,
              filter: d > 0.5 ? "grayscale(1)" : "none", whiteSpace: "nowrap",
            }}>
              {it.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** Bars on a fixed scale with a dashed target line (e.g. poll seats vs. the 61 majority). */
export const ThresholdBars: React.FC<{
  x: number; y: number; t: number; title: string; sub?: string; max: number; grow: number;
  rows: { label: string; value: number; display: string; color: string }[]; line: { value: number; label: string };
}> = ({ x, y, t, title, sub, max, grow, rows, line }) => {
  const W = 780;
  const lineT = clamp01(grow * 2);
  return (
    <PaperCard x={x} y={y} w={860} t={t}>
      <div style={{ fontFamily: CINZEL, fontWeight: 900, fontSize: 34, letterSpacing: 3 }}>{title}</div>
      {sub && <div style={{ fontWeight: 800, fontSize: 24, opacity: 0.6, marginTop: 2 }}>{sub}</div>}
      <div style={{ position: "relative" }}>
        {rows.map((r) => (
          <div key={r.label} style={{ marginTop: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 34 }}>
              <span>{r.label}</span>
              <span>{r.display}</span>
            </div>
            <div style={{ width: W, height: 36, borderRadius: 10, background: "rgba(34,48,74,0.1)", border: `3px solid ${PAPER.ink}`, overflow: "hidden", marginTop: 6 }}>
              <div style={{ width: `${(r.value / max) * clamp01(grow) * 100}%`, height: "100%", background: r.color }} />
            </div>
          </div>
        ))}
        <div style={{ position: "absolute", left: (line.value / max) * W, top: 54, bottom: -14, borderLeft: `5px dashed ${PAPER.crimson}`, opacity: lineT }} />
        <div style={{ position: "absolute", left: (line.value / max) * W - 120, bottom: -58, width: 240, textAlign: "center", fontWeight: 900, fontSize: 30, color: PAPER.crimson, opacity: lineT }}>
          {line.label}
        </div>
      </div>
      <div style={{ height: 50 }} />
    </PaperCard>
  );
};

/**
 * Up/down bars on a zero line (e.g. House seats won/lost per midterm). Bars
 * appear left → right with `draw` 0..1; positive bars turn green. `avg` draws
 * a dashed line with a label once `avgT` > 0.
 */
export const DivergingBars: React.FC<{
  x: number; y: number; t: number; title: string; rows: { label: string; value: number }[]; draw: number;
  min: number; max: number; avg?: number; avgT?: number; avgLabel?: string; highlight?: string[];
}> = ({ x, y, t, title, rows, draw, min, max, avg, avgT = 0, avgLabel, highlight = [] }) => {
  const W = 820, H = 470;
  const n = rows.length;
  const bw = W / n;
  const zy = (max / (max - min)) * H;
  const sy = (v: number) => zy - (v / (max - min)) * H;
  const shown = clamp01(draw) * n;
  return (
    <PaperCard x={x} y={y} w={880} t={t}>
      <div style={{ fontFamily: CINZEL, fontWeight: 900, fontSize: 32, letterSpacing: 3 }}>{title}</div>
      <svg width={W} height={H + 40} style={{ overflow: "visible", marginTop: 10 }}>
        {rows.map((r, i) => {
          const v = clamp01(shown - i);
          if (v <= 0) return null;
          const val = r.value * v;
          const pos = r.value > 0;
          const hi = highlight.includes(r.label);
          return (
            <g key={r.label}>
              <rect x={i * bw + bw * 0.14} y={Math.min(zy, sy(val))} width={bw * 0.72} height={Math.abs(sy(val) - zy)}
                fill={pos ? "#3E8B60" : PAPER.crimson} fillOpacity={hi || pos ? 1 : 0.8} stroke={PAPER.ink} strokeWidth={2.5} rx={3} />
              {(i % 2 === 0 || pos) && (
                <text x={i * bw + bw / 2} y={pos ? zy + 30 : zy - 10} textAnchor="middle" fontFamily={NUNITO} fontWeight={900}
                  fontSize={pos ? 24 : 20} fill={pos ? "#3E8B60" : PAPER.ink} opacity={pos ? 1 : 0.6}>
                  {`'${r.label.slice(2)}`}
                </text>
              )}
            </g>
          );
        })}
        <line x1={0} y1={zy} x2={W} y2={zy} stroke={PAPER.ink} strokeWidth={3} />
        {avg !== undefined && avgT > 0 && (
          <g opacity={clamp01(avgT * 2)}>
            <line x1={0} y1={sy(avg)} x2={W * clamp01(avgT)} y2={sy(avg)} stroke={PAPER.ink} strokeWidth={4} strokeDasharray="12 9" />
            {avgLabel && (
              <text x={W - 6} y={sy(avg) + 40} textAnchor="end" fontFamily={NUNITO} fontWeight={900} fontSize={34} fill={PAPER.ink}
                stroke="#FBF3E2" strokeWidth={8} paintOrder="stroke">{avgLabel}</text>
            )}
          </g>
        )}
      </svg>
    </PaperCard>
  );
};

/** A paper ballot: office rows with a checkbox; `struck` 0..1 crosses out the first row. */
export const BallotCard: React.FC<{ x: number; y: number; t: number; title: string; rows: string[]; struck?: number; checked?: number }> = ({
  x, y, t, title, rows, struck = 0, checked = 0,
}) => (
  <PaperCard x={x} y={y} w={700} t={t} rotate={-2}>
    <div style={{ fontFamily: CINZEL, fontWeight: 900, fontSize: 36, letterSpacing: 4, textAlign: "center", borderBottom: `3px solid ${PAPER.ink}`, paddingBottom: 10 }}>{title}</div>
    {rows.map((r, i) => (
      <div key={r} style={{ position: "relative", display: "flex", alignItems: "center", gap: 20, marginTop: 18, opacity: i === 0 ? 1 - 0.55 * clamp01(struck) : 1 }}>
        <div style={{ width: 40, height: 40, border: `4px solid ${PAPER.ink}`, borderRadius: 6, position: "relative", flex: "none" }}>
          {clamp01(checked * rows.length - i) > 0.5 && <div style={{ position: "absolute", inset: 4, background: PAPER.ink, borderRadius: 3 }} />}
        </div>
        <div style={{ fontWeight: 900, fontSize: 38 }}>{r}</div>
        {i === 0 && struck > 0 && (
          <div style={{ position: "absolute", left: -10, top: "50%", height: 7, width: `${clamp01(struck) * 105}%`, background: PAPER.crimson, borderRadius: 4, transform: "rotate(-3deg)" }} />
        )}
      </div>
    ))}
  </PaperCard>
);
