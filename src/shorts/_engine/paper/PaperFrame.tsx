import type { ReactNode } from "react";
import { getInputProps, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CINZEL, PAPER } from "./theme";

/**
 * The paper-style page: an antique atlas sheet, not an app screen.
 *
 *   - The map is drawn straight onto the parchment (`map` layer, multiplied so
 *     the paper grain shows through every fill, like watercolour on paper).
 *   - A second copy of the parchment sits on top with a soft radial mask, so
 *     the map dissolves into the paper toward the edges — no boxes, no frame —
 *     and the sepia island doodles in the corners stay visible.
 *   - Header lettering + a hairline progress rule, and a compass rose.
 *
 * VIEW is the map viewport (full frame). Its centre sits a little above the
 * middle so the story area clears the captions and the YouTube UI below.
 */
export const VIEW = { w: 1080, h: 1920, cx: 540, cy: 820 };

type Props = { map: ReactNode; overlay?: ReactNode; title?: string };

const CompassRose: React.FC<{ size: number; rotate: number }> = ({ size, rotate }) => {
  const c = size / 2;
  const star = (len: number, w: number, a: number, dark: string, light: string, key: string) => {
    const r = (a * Math.PI) / 180;
    const tip = [c + Math.sin(r) * len, c - Math.cos(r) * len];
    const l = [c + Math.sin(r - Math.PI / 2) * w, c - Math.cos(r - Math.PI / 2) * w];
    const rr = [c + Math.sin(r + Math.PI / 2) * w, c - Math.cos(r + Math.PI / 2) * w];
    return (
      <g key={key}>
        <polygon points={`${c},${c} ${tip[0]},${tip[1]} ${l[0]},${l[1]}`} fill={dark} />
        <polygon points={`${c},${c} ${tip[0]},${tip[1]} ${rr[0]},${rr[1]}`} fill={light} />
      </g>
    );
  };
  return (
    <svg width={size} height={size} style={{ transform: `rotate(${rotate}deg)`, overflow: "visible" }}>
      <circle cx={c} cy={c} r={c * 0.62} fill="none" stroke="#6B4E2C" strokeOpacity={0.6} strokeWidth={2} />
      <circle cx={c} cy={c} r={c * 0.55} fill="none" stroke="#6B4E2C" strokeOpacity={0.4} strokeWidth={1} strokeDasharray="2 5" />
      {[45, 135, 225, 315].map((a) => star(c * 0.6, c * 0.08, a, "#6B4E2C", "#C9A46A", `d${a}`))}
      {[0, 90, 180, 270].map((a) => star(c * 0.95, c * 0.13, a, "#4F3820", "#D9B77E", `m${a}`))}
      <circle cx={c} cy={c} r={c * 0.06} fill="#4F3820" />
      <text x={c} y={-8} textAnchor="middle" fontFamily={CINZEL} fontWeight={900} fontSize={c * 0.32} fill="#4F3820">N</text>
    </svg>
  );
};

export const PaperFrame: React.FC<Props> = ({ map, overlay, title = "ATLAS BRIEF" }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width } = useVideoConfig();
  const progress = frame / Math.max(1, durationInFrames - 1);
  const drift = interpolate(frame, [0, durationInFrames], [1.0, 1.03]);
  const paper = (extra: React.CSSProperties = {}) => (
    <Img
      src={staticFile("paper/parchment.jpg")}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", transform: `scale(${drift})`, ...extra }}
    />
  );
  // Edge mask: map fully visible in the middle, fading into paper at the rim.
  const topMask = "linear-gradient(to bottom, #000 0px, #000 215px, transparent 330px)";
  const edgeMask = `radial-gradient(ellipse 62% 52% at 50% ${(VIEW.cy / VIEW.h) * 100}%, transparent 62%, rgba(0,0,0,0.85) 88%, #000 100%)`;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#EAD7AE" }}>
      {paper()}
      <div style={{ position: "absolute", inset: 0, mixBlendMode: "multiply" }}>{map}</div>
      {paper({ WebkitMaskImage: edgeMask, maskImage: edgeMask })}
      {/* Paper returns under the header so lettering never sits on the map. */}
      {paper({ WebkitMaskImage: topMask, maskImage: topMask })}

      {/* Header lettering + hairline progress rule */}
      <div
        style={{
          position: "absolute", top: 150, left: 0, right: 0, textAlign: "center",
          fontFamily: CINZEL, fontWeight: 900, fontSize: 36, letterSpacing: 10, color: PAPER.ink,
        }}
      >
        {title}
      </div>
      <div style={{ position: "absolute", top: 206, left: (width - 520) / 2, width: 520, height: 3, background: "rgba(34,48,74,0.18)" }}>
        <div style={{ width: `${progress * 100}%`, height: "100%", background: PAPER.ink }} />
      </div>
      <div style={{ position: "absolute", top: 204, left: (width - 520) / 2 + progress * 520 - 5, width: 10, height: 10, marginTop: -3.5, borderRadius: 5, background: PAPER.accent }} />

      <div style={{ position: "absolute", top: 118, right: 40, opacity: 0.9 }}>
        <CompassRose size={140} rotate={Math.sin(frame / 90) * 4} />
      </div>

      {/* Thumbnail background renders pass { mapOnly: true }: the map without cards or labels. */}
      {!(getInputProps() as { mapOnly?: boolean }).mapOnly && overlay}
    </div>
  );
};
