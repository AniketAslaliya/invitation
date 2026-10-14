import heroManifest from '../../public/media/hero/manifest.json';
import envManifest from '../../public/media/envelope/manifest.json';
import { ART } from '../lib/media';
import type { LayerLayout, LayerSpec } from '../parallax/types';

export const PLATE_W = heroManifest['plate-closed'].w;
export const PLATE_H = heroManifest['plate-closed'].h;
const PA = PLATE_W / PLATE_H;
/** Vertical position of the envelope inside the artwork (0..1). */
const ENVELOPE_V = 0.563;

export const isPortrait = (W: number, H: number) => W / H < 0.95;

/** Plate placement: full-bleed cover on phones, a tall panel to the right on landscape screens. */
export function plateLayout(W: number, H: number): LayerLayout {
  if (isPortrait(W, H)) {
    const k = Math.max(W / PLATE_W, H / PLATE_H);
    const w = PLATE_W * k;
    const h = PLATE_H * k;
    const slack = (h - H) / 2;
    // Keep the envelope just below centre, never exposing an edge.
    const y = Math.max(-slack, Math.min(slack, H * 0.07 - (ENVELOPE_V - 0.5) * h));
    return { x: 0, y, w };
  }
  const h = H * 1.12;
  const w = h * PA;
  const x = Math.min(W * 0.2, W / 2 - w / 2 - W * 0.04);
  return { x, y: H * 0.07 - (ENVELOPE_V - 0.5) * h, w };
}

function inPlate(W: number, H: number, rect: { x: number; y: number; w: number; h: number }, shiftX = 0, shiftY = 0): LayerLayout {
  const p = plateLayout(W, H);
  const k = p.w / PLATE_W;
  const left = p.x - p.w / 2;
  const top = p.y - (PLATE_H * k) / 2;
  const w = rect.w * k;
  return {
    x: left + (rect.x + rect.w / 2) * k + shiftX * w,
    y: top + (rect.y + rect.h / 2) * k + shiftY * w,
    w,
  };
}

export const BACKDROP_ASPECT = 1800 / 640;
const bl = heroManifest['branch-left'];
const br = heroManifest['branch-right'];

export const heroLayers: LayerSpec[] = [
  {
    // Same scale and centre as the plate: its mirrored copies extend the scene sideways.
    id: 'backdrop',
    src: ART.heroBackdrop,
    aspect: BACKDROP_ASPECT,
    parallax: 0.1,
    scrollFY: -0.22,
    zoom: 0.06,
    layout: (W, H) => {
      const p = plateLayout(W, H);
      return { x: p.x, y: p.y, w: p.w * 5 };
    },
  },
  {
    id: 'plate-closed',
    src: ART.plateClosed,
    aspect: PA,
    parallax: 0.1,
    scrollFY: -0.22,
    zoom: 0.06,
    layout: plateLayout,
  },
  {
    id: 'plate-open',
    src: ART.plateOpen,
    aspect: PA,
    parallax: 0.1,
    scrollFY: -0.22,
    zoom: 0.06,
    opacity: 1,
    layout: plateLayout,
  },
  {
    id: 'branch-left',
    src: ART.branchLeft,
    aspect: bl.w / bl.h,
    parallax: 0.36,
    scrollFX: -0.35,
    scrollFY: 0.3,
    sway: { x: 0.025, rot: 1.2, speed: 0.55 },
    layout: (W, H) => {
      if (isPortrait(W, H)) return inPlate(W, H, bl, -0.05, -0.05);
      const w = Math.min(W * 0.3, H * 0.62);
      return { x: -W / 2 + w * 0.42, y: -H / 2 + (w / (bl.w / bl.h)) * 0.42, w };
    },
  },
  {
    id: 'branch-right',
    src: ART.branchRight,
    aspect: br.w / br.h,
    parallax: 0.42,
    scrollFX: 0.35,
    scrollFY: 0.32,
    sway: { x: 0.025, rot: -1.4, speed: 0.48, phase: 2 },
    layout: (W, H) => {
      if (isPortrait(W, H)) return inPlate(W, H, br, 0.04, -0.04);
      const w = Math.min(W * 0.22, H * 0.48);
      return { x: W / 2 - w * 0.42, y: -H / 2 + (w / (br.w / br.h)) * 0.44, w };
    },
  },
];


/** Envelope sprite geometry as fractions of the closed-envelope plate. */
const pct = (v: number, of: number) => (v / of) * 100;
const t = envManifest.triangle;
export const envelopeGeometry = {
  flap: {
    left: pct(envManifest.flap.x, PLATE_W),
    top: pct(envManifest.flap.y, PLATE_H),
    width: pct(envManifest.flap.w, PLATE_W),
    height: pct(envManifest.flap.h, PLATE_H),
  },
  seal: {
    left: pct(envManifest.seal.x, PLATE_W),
    top: pct(envManifest.seal.y, PLATE_H),
    width: pct(envManifest.seal.w, PLATE_W),
    height: pct(envManifest.seal.h, PLATE_H),
  },
  card: {
    left: pct(envManifest.card.x, PLATE_W),
    width: pct(envManifest.card.w, PLATE_W),
    height: pct(envManifest.card.h, PLATE_H),
    topFinal: pct(envManifest.card.y_final, PLATE_H),
    topStart: pct(t.tl[1] + 30, PLATE_H),
  },
  /** Card is visible above the envelope's top edge and inside the opened flap's triangle. */
  clip: (() => {
    const X = (v: number) => `${pct(v, PLATE_W)}%`;
    const Y = (v: number) => `${pct(v, PLATE_H)}%`;
    return `polygon(0 0, 100% 0, 100% ${Y(t.tl[1])}, ${X(t.tr[0])} ${Y(t.tr[1])}, ${X(t.tip[0])} ${Y(t.tip[1])}, ${X(t.tl[0])} ${Y(t.tl[1])}, 0 ${Y(t.tl[1])})`;
  })(),
  /** Envelope body (for the tap target). */
  body: {
    left: pct(756, PLATE_W),
    top: pct(2420, PLATE_H),
    width: pct(2244 - 756, PLATE_W),
    height: pct(3460 - 2420, PLATE_H),
  },
  /** Mapping of the open-envelope artwork onto the closed one (shared hinge, uniform scale). */
  openScale: envManifest.openPlate.scale,
  hinge1: envManifest.openPlate.hinge1 as [number, number],
  hinge2: envManifest.openPlate.hinge2 as [number, number],
};
