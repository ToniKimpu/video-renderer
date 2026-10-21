import { Easing } from "remotion";

/**
 * 2D camera over a flat "world px" drawing: (x, y) is the world point at the
 * centre of the viewport, s the scale (screen px per world px).
 *
 * Same map-style fly-to as getFlyCameraAtFrame: scale interpolates in log
 * space and the pan is coupled to it, so the target moves at a steady speed on
 * screen — glide while zoomed out, then dive in.
 */
export type PaperCam = { x: number; y: number; s: number };
export type PaperKey = PaperCam & { frame: number };

const ease = Easing.inOut(Easing.cubic);

export const paperCameraAt = (frame: number, keys: PaperKey[]): PaperCam => {
  const first = keys[0];
  const last = keys[keys.length - 1];
  if (frame <= first.frame) return first;
  if (frame >= last.frame) return last;
  let i = 0;
  while (i < keys.length - 2 && frame > keys[i + 1].frame) i++;
  const a = keys[i];
  const b = keys[i + 1];
  if (b.frame === a.frame) return b;
  const t = ease((frame - a.frame) / (b.frame - a.frame));
  const s = Math.exp(Math.log(a.s) + (Math.log(b.s) - Math.log(a.s)) * t);
  const p = Math.abs(b.s - a.s) < 1e-6 ? t : (1 / a.s - 1 / s) / (1 / a.s - 1 / b.s);
  return { x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p, s };
};
