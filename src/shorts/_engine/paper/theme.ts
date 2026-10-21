import { loadFont as loadNunito } from "@remotion/google-fonts/Nunito";
import { loadFont as loadCinzel } from "@remotion/google-fonts/Cinzel";
import { loadFont as loadCormorant } from "@remotion/google-fonts/CormorantGaramond";

/**
 * "Paper map" style: an illustrated sea chart on parchment, like an explainer
 * drawn by hand. Light, warm and calm, flat fills with a navy ink outline,
 * uppercase rounded labels. No imagery, so it's cheap to preview and render.
 */
export const { fontFamily: NUNITO } = loadNunito("normal", {
  weights: ["700", "800", "900"],
  subsets: ["latin"],
});
/** Engraved capitals for place names and badges (classic atlas lettering). */
export const { fontFamily: CINZEL } = loadCinzel("normal", { weights: ["700", "900"], subsets: ["latin"] });
/** Italic serif for seas and rivers. */
export const { fontFamily: CORMORANT } = loadCormorant("italic", { weights: ["600", "700"], subsets: ["latin"] });

export const PAPER = {
  ink: "#22304A",
  inkSoft: "rgba(34, 48, 74, 0.35)",
  sea: "#9CC4E0",
  seaDeep: "#A9CCE8",
  seaLabel: "#3B6EA5",
  land: "#FFF6E4",
  landShade: "#E6CC96",
  river: "#5E9BD6",
  card: "#F7EBCF",
  cardBorder: "#22304A",
  accent: "#E8892B",

  // Story palette — print-like, readable on sand.
  red: "#D9634C",
  green: "#6FAE8A",
  yellow: "#F2C94C",
  gold: "#F0A04B",
  blue: "#2F6FB5",
  crimson: "#C0392B",
  grey: "#B9B0A0",
};
