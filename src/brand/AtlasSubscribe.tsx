import React from "react";
import { loadFont as loadLuckiest } from "@remotion/google-fonts/LuckiestGuy";
import { loadFont as loadNunito } from "@remotion/google-fonts/Nunito";
import { Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Sfx } from "../shorts/_engine/sfx";
import { GREEN } from "./palette";

const { fontFamily: LUCKIEST } = loadLuckiest();
const { fontFamily: NUNITO } = loadNunito("normal", { weights: ["800", "900"], subsets: ["latin"] });

/** Length of the AtlasBrief subscribe card, in frames (30 fps); same as SUBSCRIBE_REMINDER_SHORT_FRAMES. */
export const ATLAS_SUBSCRIBE_FRAMES = 100;
/** Frame (inside the card) when the hand taps SUBSCRIBE. */
export const ATLAS_SUBSCRIBE_TAP = 42;

const INK = "#0E2A22";
const RED = "#E1262D";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** The bell that drops onto the avatar and rings after the tap. */
const Bell: React.FC<{ ring: number; size: number }> = ({ ring, size }) => {
  const angle = Math.sin(ring * Math.PI * 7) * 24 * (1 - ring);
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" style={{ overflow: "visible", transform: `rotate(${angle}deg)`, transformOrigin: "50% 10%", filter: "drop-shadow(0 6px 6px rgba(0,0,0,0.3))" }}>
      <path d="M28 5c-9 0-15 7-15 16v11l-5 7h40l-5-7V21c0-9-6-16-15-16z" fill="#FFC93C" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      <circle cx={28} cy={45} r={5.5} fill={INK} />
      {ring > 0.04 && ring < 0.9 ? (
        <g stroke={INK} strokeWidth={3.5} strokeLinecap="round" fill="none">
          <path d="M4 16 Q-1 25 4 34" />
          <path d="M52 16 Q57 25 52 34" />
        </g>
      ) : null}
    </svg>
  );
};

/**
 * AtlasBrief end card in the GeoPin style: the map dims, a white card pops up with the channel avatar
 * half out of the top (a bell drops onto it), "Atlas Brief" in the cartoon font, the tagline, and a hand
 * taps SUBSCRIBE, which turns into SUBSCRIBED ✓ while the bell rings (no ripple ring).
 * Put it in a <Sequence durationInFrames={ATLAS_SUBSCRIBE_FRAMES}> at the end of a video.
 */
export const AtlasSubscribe: React.FC<{ y?: number; tagline?: string; sound?: boolean }> = ({ y = 980, tagline = "Geopolitics, one map at a time", sound = true }) => {
  const f = useCurrentFrame();
  const inT = interpolate(f, [0, 14], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  const outT = interpolate(f, [ATLAS_SUBSCRIBE_FRAMES - 12, ATLAS_SUBSCRIBE_FRAMES], [1, 0], { ...clamp, easing: Easing.in(Easing.cubic) });
  const dim = interpolate(f, [0, 10], [0, 0.45], clamp) * outT;
  const tapped = f >= ATLAS_SUBSCRIBE_TAP;
  const press = tapped ? interpolate(f, [ATLAS_SUBSCRIBE_TAP, ATLAS_SUBSCRIBE_TAP + 4, ATLAS_SUBSCRIBE_TAP + 10], [0.9, 1.08, 1], clamp) : 1;
  // hand slides up to the button, taps, and leaves
  const keys = [16, ATLAS_SUBSCRIBE_TAP - 4, ATLAS_SUBSCRIBE_TAP + 18, ATLAS_SUBSCRIBE_TAP + 34];
  const hx = interpolate(f, keys, [760, 600, 600, 820], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const hy = interpolate(f, keys, [y + 520, y + 150, y + 150, y + 560], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const handDown = f >= ATLAS_SUBSCRIBE_TAP - 3 && f < ATLAS_SUBSCRIBE_TAP + 4 ? 0.88 : 1;
  const bellDrop = interpolate(f, [6, 18], [-260, 0], { ...clamp, easing: Easing.in(Easing.quad) });
  const ring = Math.max(0, Math.min(1, (f - ATLAS_SUBSCRIBE_TAP - 4) / 34));
  const bob = tapped ? 0 : Math.sin(f / 6) * 6;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920 }}>
      <div style={{ position: "absolute", inset: 0, background: `rgba(6,26,20,${dim})` }} />
      <div style={{ position: "absolute", left: 540, top: y, width: 880, transform: `translate(-50%, -50%) scale(${inT * outT})`, background: "#FFFFFF", borderRadius: 48,
        boxShadow: "0 24px 60px rgba(0,0,0,0.4)", padding: "120px 40px 44px", display: "flex", flexDirection: "column", alignItems: "center", borderBottom: `14px solid ${GREEN.fresh}` }}>
        {/* avatar half out of the card, with the bell dropping onto it */}
        <div style={{ position: "absolute", left: 440 - 110, top: -110, width: 220, height: 220, borderRadius: "50%", border: "10px solid #FFFFFF", boxShadow: "0 10px 26px rgba(0,0,0,0.3)", overflow: "hidden", background: GREEN.mint }}>
          <Img src={staticFile("brand/avatar.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div style={{ position: "absolute", left: 440 + 62, top: -150 + bellDrop + bob }}>
          <Bell ring={ring} size={96} />
        </div>
        <div style={{ fontFamily: LUCKIEST, fontSize: 110, lineHeight: 1, paddingTop: 16, color: GREEN.deep, whiteSpace: "nowrap" }}>
          Atlas <span style={{ color: GREEN.fresh }}>Brief</span>
        </div>
        <div style={{ fontFamily: NUNITO, fontWeight: 800, fontSize: 36, lineHeight: 1.5, color: "#5C6B68", marginTop: 6, textAlign: "center", whiteSpace: "nowrap" }}>{tagline} 🌍</div>
        <div style={{ marginTop: 26, width: 600, height: 116, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", gap: 18,
          background: tapped ? "#FFFFFF" : RED, border: tapped ? `6px solid ${GREEN.fresh}` : "6px solid transparent",
          boxShadow: tapped ? "none" : "0 10px 0 #A11A20", transform: `scale(${press})`, fontFamily: LUCKIEST, fontSize: 58, paddingTop: 10, color: tapped ? GREEN.fresh : "#FFFFFF" }}>
          {tapped ? "SUBSCRIBED ✓" : "SUBSCRIBE"}
        </div>
      </div>
      {/* the tapping hand (same as GeoPin) */}
      {f >= 14 && f < ATLAS_SUBSCRIBE_TAP + 34 ? (
        <div style={{ position: "absolute", left: hx, top: hy, fontSize: 130, lineHeight: 1, transform: `translate(-30%, -10%) scale(${handDown}) rotate(-12deg)`, filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.35))" }}>👆</div>
      ) : null}
      {sound ? <><Sfx at={ATLAS_SUBSCRIBE_TAP} name="click" volume={0.7} /><Sfx at={ATLAS_SUBSCRIBE_TAP + 4} name="ding" volume={0.4} /></> : null}
    </div>
  );
};
