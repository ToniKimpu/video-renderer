import { PAPER } from "./theme";
import type { PaperCam } from "./paperCamera";

/**
 * The illustrated map, reusable across shorts. Draws in "world px" (from
 * scripts/build_paper_geo.py) through the story camera; pair with PaperFrame,
 * which multiplies it onto the parchment.
 *
 *   <PaperMap cam={cam} base={{ land: LAND, borders: BORDERS, rivers: RIVERS }}
 *             countries={[{ id: "egypt", d: EGYPT, color: PAPER.red, fill: 0.5 }]}
 *             regions={[{ id: "bir", d: BIR_TAWIL, color: PAPER.yellow, fill: 1, lift: 12 }]}
 *             lines={[{ id: "route", d: ROUTE, color: PAPER.blue, draw: 0.6, dash: "14 10" }]} />
 *
 * Every stroke width is in screen px (non-scaling), so the ink weight stays
 * constant at any zoom. Everything is vector: sharp at any scale.
 */

export type PaperView = { w: number; h: number; cx: number; cy: number };

export type PaperBase = {
  land: string;
  borders?: string;
  rivers?: string;
  lakes?: string;
  /** Sea ripple marks, world px. */
  waves?: [number, number][];
};

/** Flat watercolour wash over a country, with an ink outline as it appears. */
export type PaperCountry = { id: string; d: string; color: string; fill: number };

/** A territory "plate": can lift off the paper with an ink shadow, and be hatched. */
export type PaperRegion = {
  id: string;
  d: string;
  color: string;
  fill: number;
  /** Lift in screen px. */
  lift?: number;
  /** Outline opacity when unfilled (e.g. to introduce a shape before colouring it). */
  outline?: number;
  hatch?: boolean;
};

/** A line drawn on progressively along its own direction (borders, routes, flight paths). */
export type PaperLine = {
  id: string;
  d: string;
  color: string;
  /** 0..1 draw-on progress along the path. */
  draw: number;
  width?: number;
  opacity?: number;
  dash?: string;
};

type Props = {
  cam: PaperCam;
  view: PaperView;
  base: PaperBase;
  countries?: PaperCountry[];
  regions?: PaperRegion[];
  lines?: PaperLine[];
  /** Extra world-space SVG drawn last (markers, custom shapes). */
  children?: React.ReactNode;
};

const SHELF = "#C3DCEC";

/** Screen position of a world-px point under the camera. */
export const worldToScreen = (cam: PaperCam, view: PaperView, x: number, y: number): [number, number] => [
  view.cx + (x - cam.x) * cam.s,
  view.cy + (y - cam.y) * cam.s,
];

/** Build an SVG path (world px) from [lng, lat] pairs through a projector. */
export const lngLatPath = (coords: number[][], project: (lng: number, lat: number) => [number, number]) =>
  coords
    .map(([lng, lat], i) => {
      const [x, y] = project(lng, lat);
      return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

export const PaperMap: React.FC<Props> = ({ cam, view, base, countries = [], regions = [], lines = [], children }) => {
  const px = (screenPx: number) => screenPx / cam.s;
  const ns = { vectorEffect: "non-scaling-stroke" as const, strokeLinejoin: "round" as const };

  return (
    <svg width={view.w} height={view.h} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <pattern id="paper-hatch" width={px(16)} height={px(16)} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width={px(5)} height={px(16)} fill={PAPER.ink} fillOpacity={0.25} />
        </pattern>
      </defs>
      <rect width={view.w} height={view.h} fill={PAPER.sea} />
      <g transform={`translate(${view.cx} ${view.cy}) scale(${cam.s}) translate(${-cam.x} ${-cam.y})`}>
        {(base.waves ?? []).map(([x, y], i) => {
          const w = px(46);
          return (
            <path key={i} d={`M${x - w} ${y} q${w / 4} ${-px(9)} ${w / 2} 0 t${w / 2} 0 t${w / 2} 0 t${w / 2} 0`}
              fill="none" stroke={PAPER.seaLabel} strokeOpacity={0.35} strokeWidth={2.5} strokeLinecap="round" {...ns} />
          );
        })}

        {/* Antique-chart coast: shallow shelf, two engraved ripple lines, then land. */}
        <path d={base.land} fill="none" stroke={SHELF} strokeWidth={90} {...ns} />
        <path d={base.land} fill="none" stroke={PAPER.ink} strokeOpacity={0.25} strokeWidth={50} {...ns} />
        <path d={base.land} fill="none" stroke={SHELF} strokeWidth={46} {...ns} />
        <path d={base.land} fill="none" stroke={PAPER.ink} strokeOpacity={0.3} strokeWidth={26} {...ns} />
        <path d={base.land} fill="none" stroke={SHELF} strokeWidth={22} {...ns} />
        <path d={base.land} fill={PAPER.land} stroke={PAPER.ink} strokeWidth={3} {...ns} />

        {countries.map((c) => c.fill > 0.001 && <path key={c.id} d={c.d} fill={c.color} fillOpacity={c.fill} />)}
        {base.borders && (
          <path d={base.borders} fill="none" stroke={PAPER.ink} strokeOpacity={0.35} strokeWidth={1.8} strokeDasharray="7 6" {...ns} />
        )}
        {countries.map((c) => c.fill > 0.01 && (
          <path key={`${c.id}-o`} d={c.d} fill="none" stroke={PAPER.ink} strokeOpacity={Math.min(1, c.fill * 2)} strokeWidth={2.5} {...ns} />
        ))}
        {base.rivers && <path d={base.rivers} fill="none" stroke={PAPER.river} strokeWidth={3.5} strokeLinecap="round" {...ns} />}
        {base.lakes && <path d={base.lakes} fill={PAPER.river} stroke={PAPER.ink} strokeOpacity={0.6} strokeWidth={1.5} {...ns} />}

        {regions.map((r) => {
          const outline = r.outline ?? 0;
          if (r.fill <= 0.001 && outline <= 0.001) return null;
          const lift = r.lift ?? 0;
          return (
            <g key={r.id}>
              {lift > 0.5 && <path d={r.d} fill={PAPER.ink} fillOpacity={0.28} transform={`translate(0 ${px(3 + lift * 0.3)})`} />}
              <g transform={`translate(0 ${-px(lift)})`}>
                <path d={r.d} fill={r.color} fillOpacity={r.fill} />
                {r.hatch && <path d={r.d} fill="url(#paper-hatch)" />}
                <path d={r.d} fill="none" stroke={PAPER.ink} strokeOpacity={Math.max(outline, r.fill > 0 ? 1 : 0)} strokeWidth={3.5} {...ns} />
              </g>
            </g>
          );
        })}

        {/* Lines reveal along their own direction via a mask, so dashed lines
            keep a fixed dash pattern and any route shape works. */}
        {lines.map((l) => {
          if (l.draw <= 0) return null;
          const maskId = `paper-line-${l.id}`;
          return (
            <g key={l.id} opacity={l.opacity ?? 1}>
              <defs>
                <mask id={maskId} maskUnits="userSpaceOnUse" x={-1e6} y={-1e6} width={2e6} height={2e6}>
                  <path d={l.d} fill="none" stroke="#fff" strokeWidth={px(80)} strokeLinecap="round" strokeLinejoin="round"
                    pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.min(1, l.draw)} />
                </mask>
              </defs>
              <g mask={`url(#${maskId})`}>
                <path d={l.d} fill="none" stroke={l.color} strokeWidth={l.width ?? 5.5} strokeDasharray={l.dash}
                  strokeLinecap="round" {...ns} />
              </g>
            </g>
          );
        })}

        {children}
      </g>
    </svg>
  );
};
