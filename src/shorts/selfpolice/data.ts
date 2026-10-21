import type { WordCue } from "../_engine/types";
import timings from "./narration-timings.json";
import { SUBSCRIBE_REMINDER_SHORT_FRAMES } from "../_engine/paper/SubscribeReminder";

/**
 * "Will AI be different?" Story-format paper short: the AI industry's Sept 2026
 * self-policing accord against Boeing's 737 MAX. Companion to the long-form
 * "Morally Binding". Every visual event is keyed to a spoken word.
 * Sources: scripts/generate_selfpolice_narration.py header.
 */
type Timings = { words: WordCue[]; wordTimings: WordCue[]; scenes: { _totalFrames: number } };
const data = timings as unknown as Timings;

export const WORDS = data.wordTimings;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9-]/g, "");
/** Frame of the nth spoken word starting with `word`. */
const w = (word: string, nth = 1): number => {
  const target = norm(word);
  let seen = 0;
  for (const x of WORDS) if (norm(x.word).startsWith(target) && ++seen === nth) return x.frame;
  throw new Error(`selfpolice: word "${word}" #${nth} not found`);
};

export const T = {
  check: w("check"),
  fell: w("fell"),
  sky: w("sky"),
  last: w("last"),
  giants: w("giants"),
  police: w("police"),
  tests: w("tests"),
  auditor: w("auditor"),
  binding: w("binding"),
  president: w("president"),
  morally: w("morally"),
  familiar: w("familiar"),
  racing: w("racing"),
  airbus: w("airbus"),
  bolted: w("bolted"),
  old: w("old"),
  hidden: w("hidden"),
  nose: w("nose"),
  pilots: w("pilots"),
  never: w("never"),
  three: w("three"),
  died: w("died"),
  congress: w("congress"),
  culture: w("culture"),
  now: w("now"),
  china: w("china"),
  plan: w("plan", 3),
  ninety: w("ninety"),
  thirty: w("thirty"),
  voluntary: w("voluntary"),
  but: w("but"),
  referee: w("referee"),
  ground: w("ground"),
  most: w("most", 2),
  isnt: w("isn't"),
  will: w("will"),
  comments: w("comments") - 12,
};

/** Narration end, extended so the subscribe reminder finishes (still under 60 s). */
export const TOTAL_FRAMES = Math.max(data.scenes._totalFrames, T.comments + SUBSCRIBE_REMINDER_SHORT_FRAMES + 6);

export const PLACES = {
  dc: { lng: -77.04, lat: 38.9 },
  renton: { lng: -122.21, lat: 47.49 },
};
