import type { ComponentProps } from "react";
import { Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { VIEW, PaperFrame } from "../_engine/paper/PaperFrame";
import { PaperCaptions } from "../_engine/paper/PaperCaptions";
import { PaperLabel } from "../_engine/paper/PaperLabel";
import { PaperMap, worldToScreen } from "../_engine/paper/PaperMap";
import { paperCameraAt, type PaperKey } from "../_engine/paper/paperCamera";
import { CommentPrompt, MoneyCounter, PaperCard, PaperPin } from "../_engine/paper/PaperWidgets";
import { PaperProp, StampRow } from "../_engine/paper/PaperPolitics";
import { SubscribeReminder, SUBSCRIBE_REMINDER_SHORT_FRAMES } from "../_engine/paper/SubscribeReminder";
import { CINZEL, NUNITO, PAPER } from "../_engine/paper/theme";
import { InkStamp, RED, StampFilter } from "../../longform/_casefile/CaseKit";
import { PhotoCard, Picture } from "../../longform/_paper/PhotoKit";
import { pic } from "../../longform/morallybinding/photos";
import * as GU from "../../longform/letgo/geoUS";
import { PLACES, T, TOTAL_FRAMES, WORDS } from "./data";

/**
 * "Will AI be different?" — paper-style story short (9:16). AI's self-policing accord
 * set against Boeing's 737 MAX; reuses the long-form "Morally Binding" photos and props.
 * Facts and sources: scripts/generate_selfpolice_narration.py.
 */

const AI = PAPER.blue;
const BO = RED;
const GOLD = "#B8860B";
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ramp = (f: number, start: number, dur = 12, ease = Easing.out(Easing.cubic)) =>
  interpolate(f, [start, start + dur], [0, 1], { easing: ease, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
// Anything starting at frame ≤ 4 is already fully on screen at frame 0 (the hook).
const span = (f: number, a: number, b: number, fade = 10) => Math.min(a <= 4 ? 1 : ramp(f, a, fade), 1 - ramp(f, b - fade, fade));

const STATE_LINES = Object.values(GU.STATES as Record<string, string>).join(" ");
const at = (lng: number, lat: number, s: number) => {
  const [x, y] = GU.paperProject(lng, lat);
  return { x, y, s };
};
const k = (frame: number, c: { x: number; y: number; s: number }): PaperKey => ({ frame, ...c });
// Cards sit in the upper half, so map shots frame their subject low.
const DC = at(-77.2, 40.6, 3.2);
const NATION = at(-96, 44, 0.42);
const SEATTLE = at(-122.2, 49.2, 3);
const TRAVEL = 26;
const PUSH = 1.08;
const shots: [number, { x: number; y: number; s: number }][] = [
  [0, NATION], [T.last, DC], [T.racing, SEATTLE], [T.now, NATION], [T.referee, DC], [T.will, NATION],
];
const KEYS: PaperKey[] = shots.flatMap(([start, cam], i) => {
  const next = i + 1 < shots.length ? shots[i + 1][0] : TOTAL_FRAMES;
  if (i === 0) return [k(0, cam), k(Math.max(1, next), { ...cam, s: cam.s * PUSH })];
  const arrive = Math.min(start + TRAVEL, next - 1);
  return [k(arrive, cam), k(Math.max(arrive + 1, next), { ...cam, s: cam.s * PUSH })];
});

const TRUMP = "chokepoints/mention/trump.jpg";

/** A Codex prop with a slow float and sway, so held shots never sit still. */
const FloatProp: React.FC<ComponentProps<typeof PaperProp>> = (props) => {
  const f = useCurrentFrame();
  const seed = (props.x * 7 + props.y * 3) % 100;
  return <PaperProp {...props} y={props.y + Math.sin((f + seed) / 34) * 8} rotate={(props.rotate ?? 0) + Math.sin((f + seed) / 55) * 1.8} />;
};

/** Days the government gets to look before release: a bar shrinking 90 → 30. */
const DaysBar: React.FC<{ x: number; y: number; t: number; days: number; voluntary: number }> = ({ x, y, t, days, voluntary }) => {
  const W = 820;
  return (
    <PaperCard x={x} y={y} w={W + 60} t={t}>
      <div style={{ fontFamily: CINZEL, fontWeight: 900, fontSize: 32, letterSpacing: 3, color: AI }}>GOVERNMENT LOOK BEFORE RELEASE</div>
      <div style={{ position: "relative", height: 90, marginTop: 18, border: `4px solid ${PAPER.ink}`, borderRadius: 10, overflow: "hidden" }}>
        <div style={{ width: `${(days / 90) * 100}%`, height: "100%", background: AI }} />
        <div style={{ position: "absolute", left: 20, top: 12, fontFamily: NUNITO, fontWeight: 900, fontSize: 52, color: "#FBF3E2" }}>{Math.round(days)} DAYS</div>
      </div>
      {voluntary > 0 && <div style={{ marginTop: 14, fontFamily: CINZEL, fontWeight: 900, fontSize: 44, color: RED, opacity: voluntary, textAlign: "right" }}>AND VOLUNTARY</div>}
    </PaperCard>
  );
};

export const SelfpoliceShort: React.FC = () => {
  const f = useCurrentFrame();
  const cam = paperCameraAt(f, KEYS);
  const toScreen = (lng: number, lat: number) => worldToScreen(cam, VIEW, ...GU.paperProject(lng, lat));
  const S = (a: number, b: number, fade = 10) => span(f, a, b, fade);
  const prop = (n: string) => staticFile(`paper/props/${n}.png`);
  const Y = 240; // top of the card area; captions sit at 1250
  const X = 540;

  const mapSvg = (
    <PaperMap cam={cam} view={VIEW} base={{ land: GU.LAND, borders: `${GU.BORDERS} ${STATE_LINES}`, rivers: GU.RIVERS }}
      countries={[{ id: "usa", d: GU.USA, color: PAPER.gold, fill: 0.2 }]} />
  );
  const [dx, dy] = toScreen(PLACES.dc.lng, PLACES.dc.lat);
  const [rx, ry] = toScreen(PLACES.renton.lng, PLACES.renton.lat);
  const tilt = Math.sin(f / 20) * 2 - 22 * ramp(f, T.fell - 4, 24);

  const overlay = (
    <>
      <StampFilter />
      <PaperPin x={dx} y={dy} t={S(T.last, T.racing) + S(T.referee, T.will)} color={AI} label="WASHINGTON" labelSide="right" size={56} />
      <PaperPin x={rx} y={ry} t={S(T.racing + 10, T.now)} color={BO} label="BOEING" labelSide="right" size={56} />

      {/* Hook: the plane and the clipboard on screen from frame 0 */}
      <Picture f={f} p={pic("max_flight", "airliner")} x={X} y={Y + 300} w={900} h={520} rotate={tilt * 0.15} from={0}
        t={S(0, T.last)} caption="BOEING 737 MAX" color={BO} focus="50% 80%" />
      <InkStamp x={X} y={Y + 800} t={S(0, T.fell - 2, 4)} text="BOEING CHECKED ITS OWN PLANE" size={46} color={BO} rotate={-4} />
      <FloatProp x={X} y={Y + 1000} t={S(0, T.fell - 2)} src={prop("clipboard_handoff")} size={300} />
      <InkStamp x={X} y={Y + 90} t={S(T.fell - 2, T.last, 4)} text="TWO CRASHES" size={92} />
      <MoneyCounter x={X} y={Y + 700} t={S(T.fell + 6, T.last)} from={0} to={346} p={ramp(f, T.fell + 6, 30)} prefix="" label="PEOPLE DIED" color={RED} size={120} />

      {/* The AI promise */}
      <Picture f={f} p={pic("white_house", "white_house")} x={X} y={Y + 260} w={860} h={480} rotate={1} from={T.last}
        t={S(T.last - 4, T.tests - 4)} caption="WHITE HOUSE · SEPT 29, 2026" color={AI} />
      <StampRow x={X} y={Y + 700} t={S(T.giants - 4, T.tests - 4)} cols={3} cw={320} size={34}
        shown={[0, 6, 12, 18, 24].reduce((n, d) => n + ramp(f, T.giants - 4 + d, 6), 0)}
        items={[{ label: "OPENAI", color: AI }, { label: "ANTHROPIC", color: AI }, { label: "GOOGLE", color: AI }, { label: "META", color: AI }, { label: "NVIDIA", color: AI }]} />
      <PaperLabel x={X} y={Y + 10} text="AI GIANTS: WE'LL POLICE OURSELVES" size={42} badge={AI} t={S(T.police - 6, T.tests - 4)} />
      <FloatProp x={X} y={Y + 330} t={S(T.tests - 4, T.binding - 4)} src={prop("accord_scroll")} size={520} />
      <StampRow x={X} y={Y + 660} t={S(T.tests - 4, T.binding - 4)} cols={1} cw={800} size={50}
        shown={ramp(f, T.tests - 4, 6) + ramp(f, T.auditor - 4, 6)} items={[{ label: "THEIR OWN TESTS", color: AI }, { label: "AN AUDITOR THEY PICK", color: RED }]} />
      <PaperLabel x={X} y={Y + 200} text="IS IT BINDING?" size={84} badge={PAPER.ink} rotate={-3} t={S(T.binding - 6, T.president - 2)} />
      <PhotoCard x={X} y={Y + 330} w={460} h={560} t={S(T.president - 2, T.familiar - 4)} age={f - T.president} src={TRUMP} credit="Official portrait · Public domain" caption="PRESIDENT TRUMP" />
      <InkStamp x={X} y={Y + 760} t={S(T.morally - 4, T.familiar - 4, 4)} text="“MORALLY BINDING”" size={74} color={AI} />
      <PaperLabel x={X} y={Y + 300} text="SOUND FAMILIAR?" size={84} badge={RED} rotate={-3} t={S(T.familiar - 8, T.racing - 2)} />

      {/* Boeing's shortcut */}
      <Picture f={f} p={pic("a320neo", "airliner")} x={X} y={Y + 200} w={820} h={420} rotate={-2} from={T.racing}
        t={S(T.racing - 2, T.bolted - 4)} caption="THE RIVAL: AIRBUS A320neo" color={AI} />
      <PaperLabel x={X} y={Y + 720} text="BOEING vs AIRBUS" size={64} badge={BO} t={S(T.racing - 2, T.bolted - 4)} />
      <Picture f={f} p={pic("max_engine", "airliner")} x={X} y={Y + 200} w={820} h={460} rotate={2} from={T.bolted}
        t={S(T.bolted - 4, T.hidden - 4)} caption="BIGGER ENGINES" color={BO} />
      <PaperLabel x={X} y={Y + 760} text="ON A 1960s DESIGN" size={50} badge={PAPER.ink} t={S(T.old - 6, T.hidden - 4)} />
      <FloatProp x={X} y={Y + 300} t={S(T.hidden - 4, T.pilots - 4)} src={prop("aoa_vane")} size={480} />
      <InkStamp x={X} y={Y + 80} t={S(T.hidden - 2, T.pilots - 4, 4)} text="HIDDEN SOFTWARE: MCAS" size={56} />
      <PaperLabel x={X} y={Y + 690} text="IT COULD PUSH THE NOSE DOWN" size={44} badge={RED} t={S(T.nose - 8, T.pilots - 4)} />
      <FloatProp x={X} y={Y + 330} t={S(T.pilots - 4, T.three - 4)} src={prop("pilot_manual")} size={560} />
      <InkStamp x={X} y={Y + 720} t={S(T.never - 4, T.three - 4, 4)} text="NOT IN THE MANUAL" size={70} />

      {/* The cost */}
      <Picture f={f} p={pic("grounded_max", "airliner")} x={X} y={Y + 210} w={860} h={460} rotate={-1} from={T.three}
        t={S(T.three - 4, T.now - 4)} caption="GROUNDED · SEATTLE, 2019" color={BO} />
      <MoneyCounter x={X} y={Y + 690} t={S(T.three - 4, T.congress - 4)} from={0} to={346} p={ramp(f, T.three - 4, 26)} prefix="" label="DIED IN TWO CRASHES" color={RED} size={140} />
      <InkStamp x={X} y={Y + 760} t={S(T.culture - 6, T.now - 4, 4)} text="“CULTURE OF CONCEALMENT”" size={48} />
      <PaperLabel x={X} y={Y + 660} text="CONGRESS FOUND:" size={44} badge={PAPER.ink} t={S(T.congress - 4, T.culture - 6)} />

      {/* The AI race */}
      <FloatProp x={X} y={Y + 300} t={S(T.now - 4, T.plan - 4)} src={prop("ai_chip")} size={520} />
      <InkStamp x={X} y={Y + 720} t={S(T.china - 6, T.plan - 4, 4)} text="AI IS RACING CHINA" size={64} />
      <FloatProp x={X} y={Y + 760} t={S(T.plan - 4, T.but - 4)} src={prop("ai_chip")} size={360} />
      <DaysBar x={X} y={Y + 140} t={S(T.plan - 4, T.but - 4)} days={90 - 60 * ramp(f, T.thirty - 6, 16)} voluntary={ramp(f, T.voluntary - 6, 10)} />
      <PaperLabel x={X} y={Y + 560} text="TO STAY AHEAD" size={48} badge={AI} t={S(T.thirty + 10, T.but - 4)} />

      {/* The twist */}
      <PaperLabel x={X} y={Y + 300} text="BUT ONE DIFFERENCE MATTERS" size={56} badge={PAPER.ink} rotate={-2} t={S(T.but - 4, T.referee - 4)} />
      <Picture f={f} p={pic("faa_hq", "capitol")} x={X} y={Y + 210} w={820} h={460} rotate={1} from={T.referee}
        t={S(T.referee - 4, T.most - 4)} caption="BOEING'S REFEREE: THE FAA" color={GOLD} />
      <InkStamp x={X} y={Y + 740} t={S(T.ground - 6, T.most - 4, 4)} text="IT GROUNDED EVERY MAX" size={58} color={BO} />
      <FloatProp x={X} y={Y + 330} t={S(T.most - 4, T.will - 4)} src={prop("empty_desk")} size={620} />
      <InkStamp x={X} y={Y + 740} t={S(T.isnt - 6, T.will - 4, 4)} text="NO FAA FOR AI" size={80} />

      {/* Question */}
      <PaperLabel x={X} y={Y + 140} text="WILL AI BE DIFFERENT?" size={70} badge={AI} rotate={-2} t={S(T.will - 4, TOTAL_FRAMES + 20)} />
      <CommentPrompt x={X} y={Y + 420} t={ramp(f, T.comments - 4, 12)} text="Will AI be different? Tell me in the comments." />

      <PaperCaptions words={WORDS} top={1250} keywords={{
        boeing: BO, boeings: BO, crashes: BO, died: BO, concealment: BO, software: BO,
        ai: AI, giants: AI, police: AI, morally: AI, binding: AI, china: RED, referee: GOLD, faa: GOLD, voluntary: RED,
      }} />
    </>
  );

  return (
    <>
      <PaperFrame map={mapSvg} overlay={overlay} />
      <Audio src={staticFile("selfpolice/narration.mp3")} volume={1} />
      {[T.last, T.racing, T.three, T.now, T.but].map((when) => (
        <Sequence key={when} from={Math.max(0, when - 6)} durationInFrames={45}>
          <Audio src={staticFile("populous/whoosh.mp3")} volume={0.25} />
        </Sequence>
      ))}
      <Sequence from={T.comments} durationInFrames={SUBSCRIBE_REMINDER_SHORT_FRAMES}>
        <SubscribeReminder short x={540} y={1060} scale={1.3} />
      </Sequence>
    </>
  );
};

export const selfpoliceTotalFrames = TOTAL_FRAMES;
