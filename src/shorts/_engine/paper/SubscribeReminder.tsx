import { Audio, Easing, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CINZEL, NUNITO, PAPER } from "./theme";

/**
 * Reusable "subscribe" reminder in the paper style (≈4.5 s). Drop it into any
 * composition inside a <Sequence from={…} durationInFrames={SUBSCRIBE_REMINDER_FRAMES}>:
 *
 *   <Sequence from={7600} durationInFrames={SUBSCRIBE_REMINDER_FRAMES}>
 *     <SubscribeReminder x={1490} y={720} />
 *   </Sequence>
 *
 * Beats: card slides in (avatar + "Enjoying the story?") → red SUBSCRIBE button →
 * a hand cursor glides in and clicks → button turns grey "SUBSCRIBED ✓" → the
 * bell rings → card slides away. (x, y) is the card's centre; `scale` resizes it
 * (≈1 for 16:9, ≈1.2 for 9:16 shorts).
 */
export const SUBSCRIBE_REMINDER_FRAMES = 140;
/** Faster cut for the end of shorts (≈3.3 s): starts on "Tell me in the comments". */
export const SUBSCRIBE_REMINDER_SHORT_FRAMES = 100;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const Bell: React.FC<{ ring: number }> = ({ ring }) => {
  const angle = Math.sin(ring * Math.PI * 6) * 22 * (1 - ring);
  return (
    <svg width={56} height={56} viewBox="0 0 56 56" style={{ transform: `rotate(${angle}deg)`, transformOrigin: "50% 12%" }}>
      <path d="M28 6c-9 0-15 7-15 16v10l-5 7h40l-5-7V22c0-9-6-16-15-16z" fill={PAPER.gold} stroke={PAPER.ink} strokeWidth={3.5} strokeLinejoin="round" />
      <circle cx={28} cy={45} r={5} fill={PAPER.ink} />
      {ring > 0.05 && ring < 0.95 && (
        <g stroke={PAPER.ink} strokeWidth={3} strokeLinecap="round">
          <path d="M6 18 Q2 26 6 34" fill="none" />
          <path d="M50 18 Q54 26 50 34" fill="none" />
        </g>
      )}
    </svg>
  );
};

const Hand: React.FC = () => (
  <svg width={70} height={84} viewBox="0 0 70 84" style={{ filter: "drop-shadow(0 6px 6px rgba(60,40,10,0.35))" }}>
    <path d="M22 8c0-5 8-5 8 0v26l4-2c0-5 8-5 8 0v4c0-5 8-5 8 0v4c0-5 8-5 8 0v16c0 12-8 22-22 22H36c-8 0-12-4-17-10L6 52c-3-4 2-9 6-6l10 8V8z"
      fill="#FBF3E2" stroke={PAPER.ink} strokeWidth={4} strokeLinejoin="round" />
  </svg>
);

export const SubscribeReminder: React.FC<{ x: number; y: number; scale?: number; sound?: boolean; short?: boolean }> = ({ x, y, scale = 1, sound = true, short = false }) => {
  // `short` plays the same animation faster, in SUBSCRIBE_REMINDER_SHORT_FRAMES.
  const speed = short ? SUBSCRIBE_REMINDER_FRAMES / SUBSCRIBE_REMINDER_SHORT_FRAMES : 1;
  const f = useCurrentFrame() * speed;
  const { fps } = useVideoConfig();

  const enter = spring({ frame: f, fps, config: { damping: 14, stiffness: 160 } });
  const exit = interpolate(f, [SUBSCRIBE_REMINDER_FRAMES - 16, SUBSCRIBE_REMINDER_FRAMES], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  const CLICK = 66;
  const buttonIn = spring({ frame: f - 14, fps, config: { damping: 12, stiffness: 200 } });
  const handP = interpolate(f, [38, CLICK - 2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const handOut = interpolate(f, [CLICK + 14, CLICK + 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.quad) });
  const press = f >= CLICK && f < CLICK + 6 ? 0.9 : 1;
  const subscribed = f >= CLICK + 2;
  const ring = clamp01((f - (CLICK + 10)) / 34);

  const W = 560;
  const tx = (1 - enter) * 80 + exit * 80;
  const opacity = clamp01(enter * 1.4) * (1 - exit);

  return (
    <div style={{ position: "absolute", left: x - (W * scale) / 2, top: y - 70 * scale, width: W, transform: `scale(${scale}) translateX(${tx}px)`, transformOrigin: "0 0", opacity }}>
      <div style={{
        position: "relative", display: "flex", alignItems: "center", gap: 18, padding: "16px 20px", background: "#FBF3E2",
        border: `4px solid ${PAPER.ink}`, borderRadius: 22, boxShadow: `0 0 0 3px #FBF3E2, 0 0 0 6px ${PAPER.ink}33, 0 16px 34px rgba(60,40,10,0.32)`,
      }}>
        <Img src={staticFile("brand/avatar.png")} style={{ width: 92, height: 92, borderRadius: 46, border: `4px solid ${PAPER.ink}`, flex: "none" }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: CINZEL, fontWeight: 900, fontSize: 30, letterSpacing: 3, color: PAPER.ink }}>ATLAS BRIEF</div>
          <div style={{ fontFamily: NUNITO, fontWeight: 800, fontSize: 22, color: PAPER.ink, opacity: 0.7 }}>Enjoying the story?</div>
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              transform: `scale(${(0.6 + 0.4 * buttonIn) * press})`, transformOrigin: "left center", opacity: clamp01(buttonIn * 1.5),
              fontFamily: NUNITO, fontWeight: 900, fontSize: 26, letterSpacing: 1.5, padding: "8px 22px", borderRadius: 999,
              border: `3px solid ${PAPER.ink}`, color: subscribed ? PAPER.ink : "#FBF3E2", background: subscribed ? "#D8CDB8" : PAPER.crimson,
            }}>
              {subscribed ? "SUBSCRIBED ✓" : "SUBSCRIBE"}
            </div>
            {subscribed && <Bell ring={ring} />}
          </div>
        </div>
        {/* Hand cursor: glides in from lower right, clicks, then leaves. */}
        <div style={{
          position: "absolute", left: 150 + (1 - handP) * 300 + handOut * 260, top: 92 + (1 - handP) * 120 + handOut * 120,
          opacity: clamp01(handP * 3) * (1 - handOut), transform: `scale(${f >= CLICK && f < CLICK + 6 ? 0.88 : 1})`,
        }}>
          <Hand />
        </div>
      </div>
      {sound && (
        <Sequence from={Math.round(CLICK / speed)} durationInFrames={30}>
          <Audio src={staticFile("populous/whoosh.mp3")} volume={0.15} />
        </Sequence>
      )}
    </div>
  );
};
