import type { WordCue } from "../_engine/types";
import { ATLAS_SUBSCRIBE_FRAMES } from "../../brand/AtlasSubscribe";
import timings from "./narration-timings.json";

/**
 * AtlasBrief globe 05: "Operation Northwoods" (~1:51, Charon). Every visual is keyed to a spoken word, found in
 * order through the narration, so it re-syncs if the narration is regenerated.
 * Facts: out/AtlasBrief/globe/05_northwoods/facts.md.
 */
type Timings = { wordTimings: WordCue[] };
const WORDS = (timings as unknown as Timings).wordTimings;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
let cursor = 0;
/** Next spoken word (after the previous lookup) that starts with `word`; `exact` needs a full match. */
const w = (word: string, exact = false): number => {
  const t = norm(word);
  for (let i = cursor; i < WORDS.length; i++) {
    const n = norm(WORDS[i].word);
    if (exact ? n === t : n.startsWith(t)) {
      cursor = i + 1;
      return WORDS[i].frame;
    }
  }
  throw new Error(`northwoodsglobe: word "${word}" not found after index ${cursor}`);
};
const last = WORDS[WORDS.length - 1];

export const T = {
  // 1 · hook
  march: w("March"), y1962: w("1962"), senior: w("senior"), signed: w("signed"), stage: w("stage"), americans: w("Americans"), blame: w("blame"), cuba0: w("Cuba"),
  sounds: w("sounds"), conspiracy: w("conspiracy"), keep: w("Keep"), mind: w("mind"),
  // 2 · why Cuba
  cubaSits: w("Cuba"), ninety: w("ninety"), florida: w("Florida"), castro: w("Castro"), communist: w("communist"), soviet: w("Soviet"),
  yearEarlier: w("year"), cia: w("CIA"), bay: w("Bay"), collapsed: w("collapsed"), threeDays: w("three"),
  washington: w("Washington"), gone: w("gone"), needed: w("needed"), reason: w("reason"), accept: w("accept"),
  // 3 · the plan
  so: w("So", true), joint: w("Joint"), memo: w("memo"), justification: w("Justification"), ideas: w("ideas"),
  friendly: w("Friendly"), uniforms: w("uniforms"), attack: w("attack"), guantanamo: w("Guantanamo"),
  ship: w("ship"), blown: w("blown"), gBay: w("Guantanamo"), blamed: w("blamed"), remember: w("Remember"), explosion: w("explosion"), spain: w("Spain"), y1898: w("1898"),
  terror: w("Communist"), miami: w("Miami"), otherFl: w("Florida"), dc: w("Washington"),
  boat: w("boatload"), refugees: w("refugees"), sunk: w("sunk"), real: w("real"), simulated: w("simulated"),
  airliner: w("airliner"), swapped: w("swapped"), drone: w("drone"), shot: w("shot"), cubanJet: w("jet"), takingBlame: w("blame"),
  oneLine: w("line"), casualty: w("Casualty"), newspapers: w("newspapers"), helpful: w("helpful"), indignation: w("indignation"),
  // 4 · what happened
  general: w("General"), lemnitzer: w("Lemnitzer"), sent: w("sent"), defense: w("Defense"), march13: w("13th"),
  threeLater: w("Three"), whiteHouse: w("White"), kennedy: w("Kennedy"), doubted: w("doubted"), forces: w("forces"),
  nothing: w("Nothing"), approved: w("approved"), none: w("none"), carried: w("carried"),
  fall: w("fall"), term: w("term"), europe: w("Europe"), nato: w("NATO"),
  // 5 · the payoff
  thirtyFive: w("thirty"), locked: w("locked"), y1997: w("1997"), board: w("board"), kennedyRec: w("Kennedy"), pub: w("public"), pages: w("pages"),
  scary: w("scary"), stopped: w("stopped"), typed: w("typed"), signedUp: w("signed"), chain: w("chain"), paperwork: w("paperwork"),
  conspiracy2: w("conspiracy"), notThis: w("Not"), read: w("read"), archives: w("Archives"),
  end: last.frame + Math.round(last.durationSec * 30),
};

export const CHAPTERS: { at: number; title: string }[] = [
  { at: T.cubaSits, title: "WHY CUBA" },
  { at: T.so, title: "THE PLAN" },
  { at: T.general, title: "WHAT HAPPENED" },
  { at: T.thirtyFive, title: "THE FILE" },
];

export const SUBSCRIBE_AT = T.end + 20;
export const TOTAL_FRAMES = SUBSCRIBE_AT + ATLAS_SUBSCRIBE_FRAMES + 10;
