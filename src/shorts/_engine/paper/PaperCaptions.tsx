import { getInputProps, interpolate, spring, useCurrentFrame } from "remotion";
import type { WordCue } from "../types";
import { NUNITO, PAPER } from "./theme";

/**
 * Paper-style captions: bold ink lettering with a paper halo (no box), 1–3
 * words at a time (breaking at punctuation), synced word-by-word from the
 * Gemini pipeline's `wordTimings`. The word being spoken turns `highlight`;
 * `keywords` colour names/numbers with the story palette.
 */
type Word = { text: string; key: string; frame: number };
type Chunk = { words: Word[]; start: number; end: number };

const MAX_WORDS = 3;
const HOLD_AFTER = 8;
const keyOf = (w: string) => w.toLowerCase().replace(/[^a-z0-9-]/g, "");

const buildChunks = (cues: WordCue[], fps: number): Chunk[] => {
  const chunks: Chunk[] = [];
  let cur: WordCue[] = [];
  const flush = () => {
    if (!cur.length) return;
    const last = cur[cur.length - 1];
    chunks.push({
      words: cur.map((w) => ({ text: w.word, key: keyOf(w.word), frame: w.frame })),
      start: cur[0].frame,
      end: last.frame + Math.round(last.durationSec * fps),
    });
    cur = [];
  };
  for (const w of cues) {
    cur.push(w);
    if (cur.length >= MAX_WORDS || /[.,?!;:]$/.test(w.word)) flush();
  }
  flush();
  return chunks;
};
const cache = new WeakMap<WordCue[], Chunk[]>();

type Props = {
  words: WordCue[];
  top: number;
  fps?: number;
  highlight?: string;
  keywords?: Record<string, string>;
};

export const PaperCaptions: React.FC<Props> = ({ words, top, fps = 30, highlight = PAPER.accent, keywords = {} }) => {
  const frame = useCurrentFrame();
  // Thumbnail renders pass { noCaptions: true } so the frame is clean.
  if ((getInputProps() as { noCaptions?: boolean }).noCaptions) return null;
  let chunks = cache.get(words);
  if (!chunks) {
    chunks = buildChunks(words, fps);
    cache.set(words, chunks);
  }
  const idx = chunks.findIndex((c, i) => {
    const next = chunks![i + 1];
    // Bridge short pauses (< 1 s) so the card never sits empty mid-sentence.
    const until = next ? (next.start - c.end < 30 ? next.start : c.end + HOLD_AFTER) : c.end + HOLD_AFTER;
    return frame >= c.start && frame < until;
  });

  // The card itself stays on screen through short gaps so it doesn't blink.
  const anyVisible = idx >= 0;
  const chunk = anyVisible ? chunks[idx] : null;
  const pop = chunk ? spring({ frame: frame - chunk.start, fps, config: { damping: 15, stiffness: 240, mass: 0.6 } }) : 0;
  const textOpacity = chunk ? interpolate(frame - chunk.start, [0, 3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  const first = chunks[0];
  const lastC = chunks[chunks.length - 1];
  const cardOpacity = interpolate(frame, [first.start - 6, first.start, lastC.end + HOLD_AFTER, lastC.end + HOLD_AFTER + 8], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const activeIdx = chunk ? chunk.words.reduce((acc, w, i) => (frame >= w.frame ? i : acc), 0) : -1;

  // No box: bold ink type with a soft paper-coloured halo, so it reads on sea
  // and land alike and sits on the page like printed lettering.
  const halo =
    "0 0 3px #FBF3E2, 0 0 3px #FBF3E2, 0 0 6px #FBF3E2, 0 0 10px #FBF3E2, 0 0 18px rgba(251,243,226,0.9)";
  return (
    <div
      style={{
        position: "absolute", left: 40, right: 40, top, height: 140,
        display: "flex", alignItems: "center", justifyContent: "center", opacity: cardOpacity,
      }}
    >
      {chunk && (
        <div
          style={{
            fontFamily: NUNITO, fontWeight: 900, fontSize: 70, lineHeight: 1, color: PAPER.ink,
            opacity: textOpacity, transform: `translateY(${(1 - pop) * 10}px) scale(${0.9 + 0.1 * pop})`,
            whiteSpace: "nowrap", textShadow: halo,
          }}
        >
          {chunk.words.map((w, i) => {
            const isActive = i === activeIdx;
            const key = keywords[w.key];
            const lift = isActive ? spring({ frame: frame - w.frame, fps, config: { damping: 12, stiffness: 300, mass: 0.5 } }) : 0;
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  marginRight: i < chunk.words.length - 1 ? "0.3em" : 0,
                  color: key ?? (isActive ? highlight : PAPER.ink),
                  transform: `translateY(${-5 * lift}px)`,
                }}
              >
                {w.text}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};
