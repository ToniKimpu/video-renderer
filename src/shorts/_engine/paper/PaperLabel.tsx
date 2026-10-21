import { CINZEL, CORMORANT, PAPER } from "./theme";

/**
 * Paper-style label: uppercase rounded ink type (or sea-blue for water), an
 * optional hand-drawn curved arrow to the thing it names, or `badge` to draw it
 * as a coloured pill (for key terms: "1899", "UNCLAIMED"). Screen px; `t` 0→1.
 */
type Props = {
  x: number;
  y: number;
  text: string;
  t: number;
  dx?: number;
  dy?: number;
  arrow?: boolean;
  size?: number;
  color?: string;
  badge?: string;
  rotate?: number;
  sub?: string;
  letterSpacing?: number;
  weight?: 700 | 800 | 900;
  /** "place" = engraved Cinzel caps (default), "sea" = italic serif for water. */
  font?: "place" | "sea";
};

export const PaperLabel: React.FC<Props> = ({
  x, y, text, t, dx = 0, dy = 0, arrow = false, size = 44, color = PAPER.ink, badge, rotate = 0, sub,
  letterSpacing = 3, weight = 900, font = "place",
}) => {
  if (t <= 0) return null;
  const textT = Math.min(1, t * 1.6);
  const arrowT = Math.max(0, Math.min(1, (t - 0.35) / 0.65));
  const lx = x + dx;
  const ly = y + dy;

  const sy = ly + (dy < 0 ? size * 0.8 : -size * 0.8);
  const len = Math.hypot(x - lx, y - sy) || 1;
  const ux = (x - lx) / len;
  const uy = (y - sy) / len;
  const ex = x - ux * 10;
  const ey = y - uy * 10;
  const bow = Math.min(50, len * 0.3) * (dx >= 0 ? 1 : -1);
  const cx = (lx + ex) / 2 - uy * bow;
  const cy = (sy + ey) / 2 + ux * bow;
  const hx = ex - cx;
  const hy = ey - cy;
  const hl = Math.hypot(hx, hy) || 1;
  const ax = hx / hl;
  const ay = hy / hl;
  const head = 14;

  return (
    <>
      {arrow && arrowT > 0 && (
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
          <path
            d={`M ${lx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`}
            fill="none" stroke={PAPER.ink} strokeWidth={3.5} strokeLinecap="round"
            pathLength={1} strokeDasharray={1} strokeDashoffset={1 - arrowT}
          />
          {arrowT > 0.95 && (
            <polyline
              points={`${ex - ax * head - ay * head * 0.6},${ey - ay * head + ax * head * 0.6} ${ex},${ey} ${ex - ax * head + ay * head * 0.6},${ey - ay * head - ax * head * 0.6}`}
              fill="none" stroke={PAPER.ink} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round"
            />
          )}
        </svg>
      )}
      <div
        style={{
          position: "absolute",
          left: lx,
          top: ly,
          transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${0.8 + 0.2 * textT})`,
          opacity: textT,
          fontFamily: font === "sea" ? CORMORANT : CINZEL,
          fontStyle: font === "sea" ? "italic" : "normal",
          fontWeight: font === "sea" ? 700 : weight,
          fontSize: size,
          lineHeight: 1.05,
          letterSpacing,
          color: badge ? "#FFFFFF" : color,
          textAlign: "center",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          ...(badge
            ? {
                // A printed stamp/cartouche, not an app pill: square-ish corners,
                // double ink rule, slight tilt-free paper shadow.
                background: badge,
                border: `3px solid ${PAPER.ink}`,
                outline: `2px solid ${badge}`,
                outlineOffset: 3,
                borderRadius: 8,
                padding: `${size * 0.18}px ${size * 0.55}px ${size * 0.12}px`,
                boxShadow: `0 0 0 5px ${PAPER.ink}, 0 10px 18px rgba(60,40,10,0.25)`,
                textShadow: "0 2px 0 rgba(34,48,74,0.35)",
              }
            : { textShadow: "0 0 3px #FBF3E2, 0 0 6px #FBF3E2, 0 0 12px rgba(251,243,226,0.95)" }),
        }}
      >
        {text}
        {sub && (
          <div style={{ fontSize: size * 0.5, fontWeight: 800, letterSpacing: 1, marginTop: 4, opacity: 0.9 }}>{sub}</div>
        )}
      </div>
    </>
  );
};
