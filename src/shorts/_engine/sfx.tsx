import { Audio, Sequence, staticFile } from "remotion";
import { SFX_KIT } from "./sfxKit";

/**
 * Short sound effects (our own, synthesised by scripts/make_sfx.py into public/sfx/). Each sound is
 * pre-levelled to sit under the narration; `volume` trims it further (1 = default level).
 *
 * Rule of thumb (from the GeoGlobeTales study: about one effect every 1–2 s):
 *   camera fly-over → whoosh / whoosh_long · card or photo slides in → swipe · thing appears → pop
 *   label or text writes on → typing / click · counter → tick · line draws on → scribble
 *   money → cash / coin · stamp → stamp · big number or reveal → impact (rare) · shock → boing
 *   map fill / change of owner → sparkle · before a reveal → riser · flashback → rewind
 */
export type SfxName = keyof typeof SFX_KIT;
export type SfxCue = { at: number; name: SfxName; volume?: number };

export const Sfx: React.FC<SfxCue> = ({ at, name, volume = 1 }) => (
  <Sequence from={Math.round(at)} durationInFrames={SFX_KIT[name].frames} layout="none" name={`sfx:${name}`} showInTimeline={false}>
    <Audio src={staticFile(`sfx/${name}.wav`)} volume={SFX_KIT[name].gain * volume} showInTimeline={false} />
  </Sequence>
);

/** A list of cues; `master` scales them all (0 mutes). */
export const SfxTrack: React.FC<{ cues: SfxCue[]; master?: number }> = ({ cues, master = 1 }) =>
  master <= 0 ? null : (
    <>
      {cues.map((c, i) => (
        <Sfx key={i} {...c} volume={(c.volume ?? 1) * master} />
      ))}
    </>
  );
