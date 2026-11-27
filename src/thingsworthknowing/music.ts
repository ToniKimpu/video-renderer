/**
 * Background music per platform. YouTube Audio Library tracks (standard licence) are for YouTube;
 * Meta Sound Collection tracks are licensed only for Meta's apps (Facebook, Instagram). So a
 * ThingsWorthKnowing video renders once with the Meta track for Facebook, and the YouTube copy only
 * swaps its audio: `python scripts/twk_youtube_audio.py <CompositionId> <facebook.mp4>`.
 *
 * Meta tracks live in public/thingsworthknowing/music/ (loudness-matched to the old tracks, about
 * -12 LUFS; untouched downloads in raw/, sources in credits.json).
 */
export type MusicSet = "meta" | "youtube";

export type Track = { src: string; startS: number };

export const pickMusic = (set: MusicSet, tracks: { meta: Track; youtube: Track }): Track => tracks[set];
