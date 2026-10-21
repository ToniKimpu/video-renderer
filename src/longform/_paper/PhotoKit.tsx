import { Img, staticFile } from "remotion";
import { PaperLabel } from "../../shorts/_engine/paper/PaperLabel";
import { PaperProp } from "../../shorts/_engine/paper/PaperPolitics";
import { CINZEL, NUNITO, PAPER } from "../../shorts/_engine/paper/theme";

/**
 * Photo and icon pieces for paper-style long-form videos. Documentary photos come
 * from Wikimedia Commons (free licences, credited in the video description and
 * on the card). Screen-space; animate with `t` (0 → 1).
 */

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * A documentary photo taped onto the page. It slowly pushes in while on screen
 * (Ken Burns), so a held shot still moves. `x`/`y` is the card centre; `age` is
 * frames since it appeared; `drift` pans the push (−1 left … 1 right).
 */
export const PhotoCard: React.FC<{
  x: number; y: number; w: number; h: number; t: number; age: number; src: string;
  caption?: string; credit?: string; rotate?: number; drift?: number; focus?: string; color?: string;
}> = ({ x, y, w, h, t, age, src, caption, credit, rotate = 0, drift = 0, focus = "50% 50%", color = PAPER.ink }) => {
  if (t <= 0) return null;
  const k = clamp01(t * 1.4);
  const zoom = Math.min(1.3, 1.03 + Math.max(0, age) * 0.0007);
  const tape: React.CSSProperties = { position: "absolute", top: -16, width: 96, height: 34, background: "rgba(240,215,160,0.8)", border: "1px solid rgba(120,90,40,0.25)" };
  return (
    <div style={{ position: "absolute", left: x - w / 2 - 14, top: y - h / 2 - 14, width: w + 28, opacity: k,
      transform: `translateY(${(1 - k) * 26}px) scale(${0.94 + 0.06 * k}) rotate(${rotate}deg)` }}>
      <div style={{ position: "relative", background: "#FBF3E2", padding: 14, border: `4px solid ${color}`, borderRadius: 6, boxShadow: "0 16px 34px rgba(60,40,10,0.35)" }}>
        <div style={{ width: w, height: h, overflow: "hidden", border: `2px solid ${PAPER.ink}` }}>
          <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: focus,
            transform: `scale(${zoom}) translateX(${drift * (zoom - 1) * 40}%)`, filter: "sepia(0.2) saturate(0.88) contrast(1.03)" }} />
        </div>
        <div style={{ ...tape, left: -20, transform: "rotate(-22deg)" }} />
        <div style={{ ...tape, right: -20, transform: "rotate(20deg)" }} />
        {caption && <div style={{ marginTop: 10, textAlign: "center", fontFamily: CINZEL, fontWeight: 900, fontSize: 30, letterSpacing: 2, color, lineHeight: 1.1 }}>{caption}</div>}
        {credit && <div style={{ marginTop: caption ? 2 : 6, textAlign: "right", fontFamily: NUNITO, fontWeight: 700, fontSize: 15, color: PAPER.ink, opacity: 0.55 }}>Photo: {credit}</div>}
      </div>
    </div>
  );
};

type IconKind = "job" | "cross" | "clock" | "house" | "school" | "clinic";

/** Simple ink icons (job, house, school, clinic…); `struck` draws a red cross over it. */
export const InkIcon: React.FC<{ kind: IconKind; x: number; y: number; t: number; size?: number; color?: string; label?: string; struck?: number }> = ({
  kind, x, y, t, size = 150, color = PAPER.ink, label, struck = 0,
}) => {
  if (t <= 0) return null;
  const k = clamp01(t * 1.4);
  const sw = 7;
  const g: Record<IconKind, React.ReactNode> = {
    job: (<><rect x={18} y={40} width={84} height={58} rx={8} fill="#FBF3E2" stroke={color} strokeWidth={sw} /><path d="M44 40 V28 h32 v12" fill="none" stroke={color} strokeWidth={sw} /><path d="M18 62 h84" stroke={color} strokeWidth={sw} /></>),
    cross: null,
    clock: (<><circle cx={60} cy={60} r={44} fill="#FBF3E2" stroke={color} strokeWidth={sw} /><path d="M60 32 V60 L80 72" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" /></>),
    house: (<><path d="M18 58 L60 22 L102 58" fill="none" stroke={color} strokeWidth={sw} strokeLinejoin="round" /><rect x={30} y={56} width={60} height={46} fill="#FBF3E2" stroke={color} strokeWidth={sw} /><rect x={52} y={74} width={16} height={28} fill={color} /></>),
    school: (<><path d="M10 46 L60 22 L110 46 L60 70 Z" fill="#FBF3E2" stroke={color} strokeWidth={sw} strokeLinejoin="round" /><path d="M32 58 V84 Q60 100 88 84 V58" fill="none" stroke={color} strokeWidth={sw} /></>),
    clinic: (<><rect x={20} y={20} width={80} height={80} rx={14} fill="#FBF3E2" stroke={color} strokeWidth={sw} /><path d="M60 38 V82 M38 60 H82" stroke={PAPER.crimson} strokeWidth={12} strokeLinecap="round" /></>),
  };
  const s = clamp01(struck);
  return (
    <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, opacity: k, transform: `scale(${0.7 + 0.3 * k})`, textAlign: "center" }}>
      <svg width={size} height={size} viewBox="0 0 120 120">
        {g[kind]}
        {s > 0 && <path d="M14 14 L106 106 M106 14 L14 106" stroke={PAPER.crimson} strokeWidth={12} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - s} />}
      </svg>
      {label && <div style={{ fontFamily: CINZEL, fontWeight: 900, fontSize: 26, letterSpacing: 2, color, marginTop: 4, whiteSpace: "nowrap" }}>{label}</div>}
    </div>
  );
};

/* ---------- photo-or-illustration slots ---------- */

type Credit = { slot: string; file: string; author: string; licence: string };
export type Pic = { kind: "photo"; src: string; credit: string } | { kind: "prop"; src: string };

const shortAuthor = (a: string) => (a.length > 34 ? `${a.slice(0, 32)}…` : a);

/**
 * Build a `pic(slot, fallback)` lookup over a video's credits.json
 * (public/<slug>/photos/). It returns the licensed photo for `slot`, or the Codex
 * illustration public/paper/props/<fallback>.png when the slot has none.
 */
export const makePic = (slug: string, credits: Credit[]) => {
  const bySlot = new Map(credits.map((c) => [c.slot, c]));
  return (slot: string, fallback: string): Pic => {
    const c = bySlot.get(slot);
    return c
      ? { kind: "photo", src: `${slug}/photos/${c.file.split("/").pop()}`, credit: `${shortAuthor(c.author)} · ${c.licence}` }
      : { kind: "prop", src: `paper/props/${fallback}.png` };
  };
};

/** A documentary photo when one is licensed, else the matching illustration with a caption badge. */
export const Picture: React.FC<{
  f: number; p: Pic; x: number; y: number; w: number; h: number; t: number; from: number;
  caption?: string; rotate?: number; color?: string; drift?: number; focus?: string;
}> = ({ f, p, x, y, w, h, t, from, caption, rotate = 0, color = PAPER.ink, drift = 0, focus }) => {
  if (t <= 0) return null;
  if (p.kind === "photo") {
    return <PhotoCard x={x} y={y} w={w} h={h} t={t} age={f - from} src={p.src} caption={caption} credit={p.credit} rotate={rotate} color={color} drift={drift} focus={focus} />;
  }
  return (
    <>
      <PaperProp x={x} y={y - 10} t={t} src={staticFile(p.src)} size={Math.min(w * 1.05, h * 1.45)} rotate={rotate} />
      {caption && <PaperLabel x={x} y={y + h / 2 + 4} text={caption} size={30} badge={color} t={t} />}
    </>
  );
};
