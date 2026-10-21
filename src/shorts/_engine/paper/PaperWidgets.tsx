import type { ReactNode } from "react";
import { CINZEL, NUNITO, PAPER } from "./theme";

/**
 * Paper-style story widgets: cream cards with an ink rule, sitting on the atlas
 * page like pasted-in clippings. All screen-space; animate with `t` (0 → 1).
 * Reusable across shorts (markets, money, accounts, pins, comment prompts).
 */

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const appear = (t: number) => ({
  opacity: clamp01(t * 1.5),
  transform: `translateY(${(1 - clamp01(t)) * 24}px) scale(${0.92 + 0.08 * clamp01(t)})`,
});

const cardStyle: React.CSSProperties = {
  position: "absolute",
  background: "#FBF3E2",
  border: `4px solid ${PAPER.ink}`,
  borderRadius: 18,
  boxShadow: `0 0 0 3px #FBF3E2, 0 0 0 6px ${PAPER.ink}33, 0 14px 30px rgba(60,40,10,0.28)`,
  fontFamily: NUNITO,
  color: PAPER.ink,
};

/** A clipping card, centred on (x, y). */
export const PaperCard: React.FC<{ x: number; y: number; w: number; t: number; children: ReactNode; rotate?: number }> = ({
  x, y, w, t, children, rotate = 0,
}) => {
  if (t <= 0) return null;
  const a = appear(t);
  return (
    <div style={{ ...cardStyle, left: x - w / 2, top: y, width: w, padding: "26px 30px", opacity: a.opacity, transform: `${a.transform} rotate(${rotate}deg)` }}>
      {children}
    </div>
  );
};

/** Prediction-market odds: question, big percentage, YES bar. `value` 0..1. */
export const OddsMeter: React.FC<{ x: number; y: number; t: number; question: string; value: number; display?: string; sub?: string }> = ({
  x, y, t, question, value, display, sub,
}) => (
  <PaperCard x={x} y={y} w={760} t={t}>
    <div style={{ fontWeight: 900, fontSize: 40, lineHeight: 1.1 }}>{question}</div>
    {sub && <div style={{ fontWeight: 800, fontSize: 26, opacity: 0.6, marginTop: 4 }}>{sub}</div>}
    <div style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 20 }}>
      <div style={{ flex: 1, height: 30, borderRadius: 15, background: "rgba(34,48,74,0.12)", border: `3px solid ${PAPER.ink}`, overflow: "hidden" }}>
        <div style={{ width: `${clamp01(value) * 100}%`, height: "100%", background: value > 0.5 ? PAPER.green : PAPER.red }} />
      </div>
      <div style={{ fontWeight: 900, fontSize: 64, minWidth: 170, textAlign: "right", color: value > 0.5 ? "#3E8B60" : PAPER.red }}>
        {display ?? `${Math.round(value * 100)}%`}
      </div>
    </div>
  </PaperCard>
);

/** A row of bet "slips": question + YES chip. `shown` = how many rows are visible (fractional fades in). */
export const BetRows: React.FC<{ rows: string[]; shown: number; sub?: string }> = ({ rows, shown, sub }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
    {rows.map((r, i) => {
      const v = clamp01(shown - i);
      if (v <= 0) return null;
      return (
        <div key={r} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
          padding: "10px 16px", borderRadius: 12, background: "rgba(34,48,74,0.06)", border: `2px solid ${PAPER.ink}33`,
          opacity: v, transform: `translateX(${(1 - v) * -30}px)`,
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 32 }}>{r}</div>
            {sub && <div style={{ fontWeight: 700, fontSize: 22, opacity: 0.55 }}>{sub}</div>}
          </div>
          <div style={{ fontWeight: 900, fontSize: 30, color: "#fff", background: PAPER.green, border: `3px solid ${PAPER.ink}`, borderRadius: 10, padding: "4px 18px" }}>
            YES
          </div>
        </div>
      );
    })}
  </div>
);

/** Account header for the card: avatar blob, anonymous handle, joined date; optional DELETED stamp. */
export const AccountHeader: React.FC<{ handle: string; joined: string; deleted?: number }> = ({ handle, joined, deleted = 0 }) => (
  <div style={{ position: "relative" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <div style={{ width: 78, height: 78, borderRadius: 39, border: `4px solid ${PAPER.ink}`, background: `conic-gradient(${PAPER.gold}, ${PAPER.red}, ${PAPER.blue}, ${PAPER.green}, ${PAPER.gold})` }} />
      <div>
        <div style={{ fontWeight: 900, fontSize: 40 }}>{handle}</div>
        <div style={{ fontWeight: 800, fontSize: 26, opacity: 0.6 }}>{joined}</div>
      </div>
    </div>
    {deleted > 0 && (
      <div style={{
        position: "absolute", right: -6, top: -8, transform: `rotate(-12deg) scale(${0.6 + 0.4 * clamp01(deleted)})`, opacity: clamp01(deleted * 2),
        fontFamily: CINZEL, fontWeight: 900, fontSize: 52, letterSpacing: 4, color: PAPER.crimson,
        border: `5px solid ${PAPER.crimson}`, borderRadius: 10, padding: "2px 18px", background: "rgba(251,243,226,0.85)",
      }}>
        DELETED
      </div>
    )}
  </div>
);

/** Big rolling money figure: interpolates `from` → `to` by `p` (0..1). */
export const MoneyCounter: React.FC<{ x: number; y: number; t: number; from: number; to: number; p: number; label?: string; color?: string; prefix?: string; suffix?: string; size?: number }> = ({
  x, y, t, from, to, p, label, color = "#3E8B60", prefix = "$", suffix = "", size = 130,
}) => {
  if (t <= 0) return null;
  const v = Math.round(from + (to - from) * clamp01(p));
  const a = appear(t);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) ${a.transform}`, opacity: a.opacity, textAlign: "center", whiteSpace: "nowrap" }}>
      <div style={{
        fontFamily: NUNITO, fontWeight: 900, fontSize: size, lineHeight: 1, color,
        textShadow: `0 0 0 ${PAPER.ink}, 3px 3px 0 ${PAPER.ink}, 0 0 14px #FBF3E2, 0 0 28px #FBF3E2`,
        WebkitTextStroke: `3px ${PAPER.ink}`,
      }}>
        {prefix}{v.toLocaleString("en-US")}{suffix}
      </div>
      {label && <div style={{ fontFamily: CINZEL, fontWeight: 900, fontSize: 38, letterSpacing: 5, color: PAPER.ink, marginTop: 10, textShadow: "0 0 8px #FBF3E2, 0 0 14px #FBF3E2" }}>{label}</div>}
    </div>
  );
};

/** Ink map pin with a coloured head and a place label. Screen px (tip at x, y). */
export const PaperPin: React.FC<{ x: number; y: number; t: number; color: string; label?: string; labelSide?: "left" | "right" | "top"; size?: number }> = ({
  x, y, t, color, label, labelSide = "right", size = 74,
}) => {
  if (t <= 0) return null;
  const drop = clamp01(t);
  const bounce = drop < 1 ? (1 - drop) * -120 : 0;
  const w = size * 0.72;
  const h = size;
  const pos: React.CSSProperties =
    labelSide === "left" ? { right: w / 2 + 14, top: -h * 0.85 } :
    labelSide === "top" ? { left: "50%", top: -h - 64, transform: "translateX(-50%)" } :
    { left: w / 2 + 14, top: -h * 0.85 };
  return (
    <div style={{ position: "absolute", left: x, top: y + bounce, opacity: clamp01(t * 3), pointerEvents: "none" }}>
      <svg width={w} height={h} style={{ position: "absolute", left: -w / 2, top: -h, overflow: "visible" }}>
        <ellipse cx={w / 2} cy={h} rx={w * 0.28} ry={w * 0.1} fill="#000" fillOpacity={0.25} />
        <path d={`M${w / 2} ${h} C ${w * 0.1} ${h * 0.6}, 0 ${h * 0.42}, 0 ${w / 2} A ${w / 2} ${w / 2} 0 1 1 ${w} ${w / 2} C ${w} ${h * 0.42}, ${w * 0.9} ${h * 0.6}, ${w / 2} ${h} Z`}
          fill={color} stroke={PAPER.ink} strokeWidth={4} strokeLinejoin="round" />
        <circle cx={w / 2} cy={w / 2} r={w * 0.18} fill="#FBF3E2" stroke={PAPER.ink} strokeWidth={3} />
      </svg>
      {label && (
        <div style={{
          position: "absolute", whiteSpace: "nowrap", fontFamily: CINZEL, fontWeight: 900, fontSize: 40, letterSpacing: 3, color: PAPER.ink,
          textShadow: "0 0 4px #FBF3E2, 0 0 8px #FBF3E2, 0 0 14px #FBF3E2", ...pos,
        }}>
          {label}
        </div>
      )}
    </div>
  );
};

/** Simple ink icons for money trails and actions. */
export const PaperIcon: React.FC<{ kind: "vault" | "bank" | "coin" | "helicopter" | "gavel" | "tanker"; x: number; y: number; size?: number; t?: number; label?: string; color?: string }> = ({
  kind, x, y, size = 120, t = 1, label, color = PAPER.gold,
}) => {
  if (t <= 0) return null;
  const s = size;
  const ink = { stroke: PAPER.ink, strokeWidth: 5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  const icon = (() => {
    switch (kind) {
      case "vault":
        return (
          <g>
            <rect x={s * 0.1} y={s * 0.12} width={s * 0.8} height={s * 0.74} rx={s * 0.08} fill={PAPER.grey} {...ink} />
            <circle cx={s * 0.5} cy={s * 0.49} r={s * 0.2} fill="#FBF3E2" {...ink} />
            {[0, 60, 120, 180, 240, 300].map((a) => (
              <line key={a} x1={s * 0.5} y1={s * 0.49} x2={s * 0.5 + Math.cos((a * Math.PI) / 180) * s * 0.15} y2={s * 0.49 + Math.sin((a * Math.PI) / 180) * s * 0.15} {...ink} strokeWidth={3} />
            ))}
            <rect x={s * 0.2} y={s * 0.86} width={s * 0.12} height={s * 0.06} fill={PAPER.ink} />
            <rect x={s * 0.68} y={s * 0.86} width={s * 0.12} height={s * 0.06} fill={PAPER.ink} />
          </g>
        );
      case "bank":
        return (
          <g>
            <polygon points={`${s * 0.08},${s * 0.34} ${s * 0.5},${s * 0.08} ${s * 0.92},${s * 0.34}`} fill={color} {...ink} />
            {[0.2, 0.4, 0.6, 0.8].map((cx) => <rect key={cx} x={s * (cx - 0.05)} y={s * 0.38} width={s * 0.1} height={s * 0.38} fill="#FBF3E2" {...ink} strokeWidth={4} />)}
            <rect x={s * 0.06} y={s * 0.78} width={s * 0.88} height={s * 0.1} fill={color} {...ink} />
          </g>
        );
      case "coin":
        return (
          <g>
            <circle cx={s / 2} cy={s / 2} r={s * 0.42} fill={color} {...ink} />
            <text x={s / 2} y={s * 0.66} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={s * 0.5} fill={PAPER.ink}>$</text>
          </g>
        );
      case "helicopter":
        return (
          <g>
            <line x1={s * 0.05} y1={s * 0.22} x2={s * 0.95} y2={s * 0.22} {...ink} strokeWidth={6} />
            <line x1={s * 0.5} y1={s * 0.22} x2={s * 0.5} y2={s * 0.36} {...ink} />
            <path d={`M${s * 0.2} ${s * 0.5} Q ${s * 0.2} ${s * 0.36} ${s * 0.42} ${s * 0.36} L ${s * 0.62} ${s * 0.36} Q ${s * 0.78} ${s * 0.38} ${s * 0.78} ${s * 0.52} Q ${s * 0.78} ${s * 0.66} ${s * 0.6} ${s * 0.66} L ${s * 0.36} ${s * 0.66} Q ${s * 0.2} ${s * 0.66} ${s * 0.2} ${s * 0.5} Z`} fill={PAPER.grey} {...ink} />
            <path d={`M${s * 0.2} ${s * 0.52} L ${s * 0.02} ${s * 0.46}`} {...ink} strokeWidth={7} />
            <line x1={s * 0.3} y1={s * 0.78} x2={s * 0.7} y2={s * 0.78} {...ink} />
          </g>
        );
      case "tanker":
        return (
          <g>
            <path d={`M${s * 0.04} ${s * 0.56} L ${s * 0.96} ${s * 0.56} L ${s * 0.84} ${s * 0.8} L ${s * 0.14} ${s * 0.8} Z`} fill={PAPER.red} {...ink} />
            <rect x={s * 0.66} y={s * 0.3} width={s * 0.18} height={s * 0.26} fill="#FBF3E2" {...ink} />
            <rect x={s * 0.72} y={s * 0.18} width={s * 0.06} height={s * 0.12} fill={PAPER.ink} />
            {[0.16, 0.32, 0.48].map((cx) => <circle key={cx} cx={s * (cx + 0.04)} cy={s * 0.5} r={s * 0.06} fill={PAPER.grey} {...ink} strokeWidth={3} />)}
          </g>
        );
      case "gavel":
        return (
          <g>
            <rect x={s * 0.18} y={s * 0.2} width={s * 0.42} height={s * 0.2} rx={s * 0.04} fill={color} {...ink} transform={`rotate(-35 ${s * 0.4} ${s * 0.3})`} />
            <line x1={s * 0.45} y1={s * 0.38} x2={s * 0.82} y2={s * 0.78} {...ink} strokeWidth={9} />
            <rect x={s * 0.08} y={s * 0.82} width={s * 0.5} height={s * 0.08} rx={s * 0.02} fill={PAPER.ink} />
          </g>
        );
    }
  })();
  return (
    <div style={{ position: "absolute", left: x - s / 2, top: y - s / 2, width: s, ...appear(t), pointerEvents: "none" }}>
      <svg width={s} height={s} style={{ overflow: "visible", filter: "drop-shadow(0 6px 6px rgba(60,40,10,0.25))" }}>{icon}</svg>
      {label && (
        <div style={{ position: "absolute", top: s + 6, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap", textAlign: "center",
          fontFamily: CINZEL, fontWeight: 900, fontSize: 30, letterSpacing: 2, color: PAPER.ink, textShadow: "0 0 6px #FBF3E2, 0 0 12px #FBF3E2" }}>
          {label}
        </div>
      )}
    </div>
  );
};

/** End-card question for comments: stamp badge with a speech-bubble icon. */
export const CommentPrompt: React.FC<{ x: number; y: number; t: number; text: string }> = ({ x, y, t, text }) => {
  if (t <= 0) return null;
  const a = appear(t);
  return (
    <div style={{ ...cardStyle, left: x, top: y, transform: `translate(-50%, 0) ${a.transform}`, opacity: a.opacity, width: 900, padding: "28px 34px", display: "flex", gap: 24, alignItems: "center" }}>
      <svg width={96} height={86} style={{ flex: "none" }}>
        <path d="M10 8 H86 Q92 8 92 14 V56 Q92 62 86 62 H44 L22 80 L26 62 H10 Q4 62 4 56 V14 Q4 8 10 8 Z" fill={PAPER.gold} stroke={PAPER.ink} strokeWidth={5} strokeLinejoin="round" />
        {[30, 48, 66].map((cx) => <circle key={cx} cx={cx} cy={35} r={5} fill={PAPER.ink} />)}
      </svg>
      <div style={{ fontWeight: 900, fontSize: 46, lineHeight: 1.15 }}>{text}</div>
    </div>
  );
};

/** Horizontal bar comparison (e.g. oil reserves). `grow` 0..1 animates the bars. */
export const BarCompare: React.FC<{ x: number; y: number; t: number; title: string; rows: { label: string; value: number; display: string; color: string }[]; grow: number }> = ({
  x, y, t, title, rows, grow,
}) => {
  const max = Math.max(...rows.map((r) => r.value));
  return (
    <PaperCard x={x} y={y} w={860} t={t}>
      <div style={{ fontFamily: CINZEL, fontWeight: 900, fontSize: 34, letterSpacing: 3, marginBottom: 14 }}>{title}</div>
      {rows.map((r) => (
        <div key={r.label} style={{ marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 36 }}>
            <span>{r.label}</span><span>{r.display}</span>
          </div>
          <div style={{ height: 34, borderRadius: 10, background: "rgba(34,48,74,0.1)", border: `3px solid ${PAPER.ink}`, overflow: "hidden", marginTop: 6 }}>
            <div style={{ width: `${(r.value / max) * clamp01(grow) * 100}%`, height: "100%", background: r.color }} />
          </div>
        </div>
      ))}
    </PaperCard>
  );
};

/** Donut showing one share of a whole (e.g. oil's share of exports). */
export const ShareDonut: React.FC<{ x: number; y: number; t: number; share: number; fill: number; label: string; caption: string; color: string }> = ({
  x, y, t, share, fill, label, caption, color,
}) => {
  if (t <= 0) return null;
  const r = 120;
  const c = 2 * Math.PI * r;
  const a = appear(t);
  return (
    <div style={{ position: "absolute", left: x - 170, top: y, width: 340, textAlign: "center", ...a }}>
      <svg width={340} height={300}>
        <circle cx={170} cy={150} r={r} fill="none" stroke="rgba(34,48,74,0.15)" strokeWidth={56} />
        <circle cx={170} cy={150} r={r} fill="none" stroke={color} strokeWidth={56} strokeDasharray={`${c * share * clamp01(fill)} ${c}`}
          transform="rotate(-90 170 150)" />
        <circle cx={170} cy={150} r={r + 30} fill="none" stroke={PAPER.ink} strokeWidth={4} />
        <circle cx={170} cy={150} r={r - 30} fill="#FBF3E2" stroke={PAPER.ink} strokeWidth={4} />
        <text x={170} y={164} textAnchor="middle" fontFamily={CINZEL} fontWeight={900} fontSize={44} fill={PAPER.ink}>{label}</text>
      </svg>
      <div style={{ fontFamily: NUNITO, fontWeight: 900, fontSize: 40, color: PAPER.ink, textShadow: "0 0 8px #FBF3E2, 0 0 14px #FBF3E2" }}>{caption}</div>
    </div>
  );
};

/** Small line chart card (e.g. oil price). `draw` 0..1 reveals the line left → right. */
export const PriceChart: React.FC<{ x: number; y: number; t: number; title: string; points: { label: string; value: number }[]; draw: number; unit?: string; color?: string }> = ({
  x, y, t, title, points, draw, unit = "$", color = PAPER.crimson,
}) => {
  const W = 760, H = 300, pad = 60;
  const max = Math.max(...points.map((p) => p.value)) * 1.1;
  const px = (i: number) => pad + (i / (points.length - 1)) * (W - pad * 2);
  const py = (v: number) => H - pad * 0.6 - (v / max) * (H - pad * 1.4);
  const d = points.map((p, i) => `${i ? "L" : "M"}${px(i)} ${py(p.value)}`).join(" ");
  const shown = clamp01(draw) * (points.length - 1);
  const lastI = Math.floor(shown + 1e-6);
  return (
    <PaperCard x={x} y={y} w={W + 60} t={t}>
      <div style={{ fontFamily: CINZEL, fontWeight: 900, fontSize: 34, letterSpacing: 3 }}>{title}</div>
      <svg width={W} height={H} style={{ overflow: "visible", marginTop: 6 }}>
        <defs>
          <clipPath id="price-reveal"><rect x={0} y={-50} width={pad + (shown / (points.length - 1)) * (W - pad * 2) + 2} height={H + 100} /></clipPath>
        </defs>
        <line x1={pad} y1={H - pad * 0.6} x2={W - pad} y2={H - pad * 0.6} stroke={PAPER.ink} strokeWidth={3} />
        <g clipPath="url(#price-reveal)">
          <path d={d} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
        </g>
        {points.map((p, i) => i <= lastI && (
          <g key={p.label}>
            <circle cx={px(i)} cy={py(p.value)} r={11} fill="#FBF3E2" stroke={PAPER.ink} strokeWidth={4} />
            <text x={px(i)} y={py(p.value) - 24} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={34} fill={PAPER.ink}>{unit}{p.value}</text>
            <text x={px(i)} y={H + 6} textAnchor="middle" fontFamily={NUNITO} fontWeight={800} fontSize={26} fill={PAPER.ink} opacity={0.65}>{p.label}</text>
          </g>
        ))}
      </svg>
    </PaperCard>
  );
};

/** Grid of little worker figures; `gone` 0..1 greys and drops them out (e.g. mass firings). */
export const WorkerGrid: React.FC<{ x: number; y: number; t: number; cols?: number; rows?: number; gone: number; caption?: string }> = ({
  x, y, t, cols = 9, rows = 3, gone, caption,
}) => {
  if (t <= 0) return null;
  const cell = 74;
  const n = cols * rows;
  const a = appear(t);
  return (
    <div style={{ position: "absolute", left: x - (cols * cell) / 2, top: y, ...a }}>
      <svg width={cols * cell} height={rows * cell} style={{ overflow: "visible" }}>
        {Array.from({ length: n }, (_, i) => {
          const cx = (i % cols) * cell + cell / 2;
          const cy = Math.floor(i / cols) * cell + cell / 2;
          // Fire in a scattered order so it reads as many people, not a wipe.
          const order = (i * 7) % n;
          const g = clamp01(gone * 1.4 - (order / n) * 0.9);
          return (
            <g key={i} transform={`translate(${cx} ${cy + g * 18})`} opacity={1 - g * 0.75}>
              <circle cx={0} cy={-18} r={11} fill={g > 0.5 ? PAPER.grey : PAPER.gold} stroke={PAPER.ink} strokeWidth={3} />
              <path d="M-16 20 Q-16 -4 0 -4 Q16 -4 16 20 Z" fill={g > 0.5 ? PAPER.grey : PAPER.blue} stroke={PAPER.ink} strokeWidth={3} />
            </g>
          );
        })}
      </svg>
      {caption && (
        <div style={{ textAlign: "center", fontFamily: CINZEL, fontWeight: 900, fontSize: 48, letterSpacing: 4, color: PAPER.ink, marginTop: 10, textShadow: "0 0 8px #FBF3E2, 0 0 14px #FBF3E2" }}>
          {caption}
        </div>
      )}
    </div>
  );
};
