/**
 * Shared shorts engine — type definitions.
 *
 * Every short under src/shorts/<name>/ should produce a SCENES array of this
 * shape. The engine components (ShortWorldMap, FlagBadge, ScriptLine,
 * CompanyIcons) consume Scenes uniformly, so building a new short is just:
 *   1. Write narration text + scene triggers (Python)
 *   2. Define SCENES with country/camera/script per beat
 *   3. Compose engine components in <NameShort>.tsx
 */

export type Camera = { lng: number; lat: number; zoom: number };

export type WordCue = {
  word: string;       // phrase shown at this cue
  offsetSec: number;  // start time in seconds
  durationSec: number;
  frame: number;      // start frame at FPS=30
};

export type Scene = {
  id: string;
  startFrame: number;
  endFrame: number;
  camera: Camera;
  /** Numeric ISO codes (matching world-atlas topology) for countries to highlight. */
  isoNumerics: string[];
  /**
   * Optional fallback for features that have NO id in the world-atlas
   * topology (Kosovo, Somaliland, N. Cyprus). Match is by exact
   * `feature.properties.name`. Use this when isoNumerics can't address the
   * country because it lacks an ISO code in the dataset.
   */
  featureNames?: string[];
  /** Two-letter ISO code for the FlagBadge. Empty string = no flag this scene. */
  iso2: string;
  /** Display name shown in the SVG title overlay. Empty = suppress label. */
  countryName: string;
  /** Logo/text badges to render via CompanyIcons. */
  companies: string[];
  /** Karaoke script line. \n splits into multiple display lines. */
  script: string;
  /** Accent color for highlights, borders, glow. */
  color: string;
};

/** Convenience: the JSON shape produced by scripts/generate_*_narration.py */
export type NarrationTimings = {
  /** One cue per sentence of the script (edge: per VTT cue). */
  words: WordCue[];
  /** Gemini engine only: per-word times in the script's own wording. */
  wordTimings?: WordCue[];
  scenes: Record<string, number> & { _totalFrames: number };
};
