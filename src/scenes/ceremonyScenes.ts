import heroManifest from '../../public/media/hero/manifest.json';
import { ART } from '../lib/media';
import type { LayerLayout, LayerSpec, ParticleSpec } from '../parallax/types';
import type { WeddingEventData } from '../data/weddingEvents';

type Id = WeddingEventData['id'];
export interface SceneDef {
  back: LayerSpec[];
  front: LayerSpec[];
  particles: ParticleSpec;
}

const portrait = (W: number, H: number) => W / H < 0.95;
const bl = heroManifest['branch-left'];
const br = heroManifest['branch-right'];
const ARCADE_ASPECT = 1800 / 1100;

/* Shared building blocks ------------------------------------------------------------------- */

const backdrop = (id: Id): LayerSpec => ({
  id: 'backdrop',
  src: ART.eventBackdrop(id),
  aspect: 1,
  parallax: 0.05,
  scrollFY: -0.08,
  zoom: 0.06,
  opacity: 0.5,
  layout: (W, H) => ({ x: 0, y: 0, w: Math.max(W, H) * 1.2 }),
});

const arcade = (id: Id, side: number): LayerSpec => ({
  id: 'arcade',
  src: ART.ornament(`arcade-${id}.svg`),
  aspect: ARCADE_ASPECT,
  parallax: 0.16,
  scrollFY: -0.04,
  zoom: 0.05,
  opacity: 0.94,
  layout: (W, H) => {
    if (portrait(W, H)) {
      const h = H * 0.98;
      return { x: 0, y: H * 0.04, w: h * ARCADE_ASPECT };
    }
    // Centre arch frames the card, which sits on one side on wide screens.
    const w = Math.max(W * 1.18, H * 1.05 * ARCADE_ASPECT);
    return { x: side * W * 0.2, y: H * 0.02, w };
  },
});

const cornerBranch = (which: 'left' | 'right', scale = 1): LayerSpec => {
  const m = which === 'left' ? bl : br;
  const aspect = m.w / m.h;
  const dir = which === 'left' ? -1 : 1;
  return {
    id: `branch-${which}`,
    src: which === 'left' ? ART.branchLeft : ART.branchRight,
    aspect,
    parallax: which === 'left' ? 0.36 : 0.42,
    scrollFX: dir * 0.3,
    scrollFY: 0.28,
    sway: { x: 0.02, rot: dir * 1.2, speed: 0.5, phase: which === 'left' ? 0 : 2 },
    layout: (W, H) => {
      const w = (portrait(W, H) ? W * (which === 'left' ? 0.5 : 0.38) : Math.min(W * (which === 'left' ? 0.24 : 0.18), H * 0.45)) * scale;
      const h = w / aspect;
      return { x: dir * (W / 2 - w * 0.4), y: -H / 2 + h * 0.36, w };
    },
  };
};

const lantern = (id: string, xFrac: number, drop: number, size: number, parallax: number, phase: number): LayerSpec => ({
  id,
  src: ART.ornament('lantern.svg'),
  aspect: 300 / 820,
  parallax,
  scrollFY: parallax * 0.6,
  sway: { rot: 2.2, speed: 0.7, phase },
  layout: (W, H) => {
    const p = portrait(W, H);
    const h = (p ? H * 0.34 : H * 0.62) * size;
    const w = h * (300 / 820);
    // Hangs from above the frame; `drop` lowers it.
    return { x: p ? Math.sign(xFrac) * (W / 2 - w * 0.3) : xFrac * W, y: -H / 2 + h * ((p ? 0.3 : 0.08) + drop), w };
  },
});

const petalsOf = (textures: string[], extra: Partial<ParticleSpec> = {}): ParticleSpec => ({
  textures,
  count: { mobile: 6, desktop: 12 },
  size: [16, 36],
  speed: [24, 48],
  drift: 34,
  spin: 50,
  opacity: [0.75, 1],
  ...extra,
});

/* Scenes ------------------------------------------------------------------------------------ */

function engagement(side: number): SceneDef {
  return {
    back: [backdrop('engagement'), arcade('engagement', side)],
    front: [cornerBranch('left'), cornerBranch('right')],
    particles: petalsOf(ART.petals),
  };
}

function mandap(side: number): SceneDef {
  const jasmine: LayerSpec = {
    id: 'jasmine',
    src: ART.ornament('jasmine-strands.svg'),
    aspect: 1,
    parallax: 0.3,
    scrollFY: 0.18,
    sway: { x: 0.01, speed: 0.6 },
    layout: (W, H) => {
      const p = portrait(W, H);
      const w = p ? W * 0.62 : Math.min(W * 0.2, H * 0.4);
      // Hangs at the outer edge beside the card on desktop (never over the text); top-left on phones.
      return { x: p ? -W / 2 + w * 0.3 : side * (W / 2 - w * 0.36), y: -H / 2 + w * (p ? 0.34 : 0.22), w };
    },
  };
  return {
    back: [backdrop('mandap'), arcade('mandap', side)],
    front: [jasmine, lantern('lantern-a', 0.42 * -side, 0.05, 1, 0.38, 0), lantern('lantern-b', 0.3 * side, -0.08, 0.72, 0.28, 1.7)],
    particles: petalsOf([ART.ornament('petal-jasmine.svg')], { size: [14, 26], count: { mobile: 6, desktop: 12 } }),
  };
}

function haldi(side: number): SceneDef {
  const toran: LayerSpec = {
    id: 'toran',
    src: ART.ornament('marigold-toran.svg'),
    aspect: 1800 / 760,
    parallax: 0.28,
    scrollFY: 0.2,
    sway: { y: 0.008, rot: 0.25, speed: 0.6 },
    layout: (W, H) => {
      const p = portrait(W, H);
      const w = p ? W * 1.15 : W * 1.04;
      const h = w / (1800 / 760);
      return { x: 0, y: -H / 2 + h * (p ? 0.52 : 0.06), w };
    },
  };
  const leaf = (which: 'l' | 'r'): LayerSpec => ({
    id: `leaf-${which}`,
    src: ART.ornament('banana-leaf.svg'),
    aspect: 700 / 1300,
    flipX: which === 'r',
    parallax: which === 'l' ? 0.4 : 0.34,
    scrollFX: which === 'l' ? -0.25 : 0.25,
    scrollFY: 0.22,
    sway: { rot: which === 'l' ? 1.6 : -1.6, speed: 0.45, phase: which === 'l' ? 0 : 1.4 },
    layout: (W, H) => {
      const p = portrait(W, H);
      const h = p ? H * 0.34 : H * 0.66;
      const w = h * (700 / 1300);
      const dir = which === 'l' ? -1 : 1;
      return { x: dir * (W / 2 - w * (p ? -0.02 : 0.04)), y: H / 2 - h * (p ? 0.3 : 0.26), w, rot: dir * (p ? 16 : 12) };
    },
  });
  return {
    back: [backdrop('haldi'), arcade('haldi', side)],
    front: [leaf('l'), leaf('r'), toran],
    particles: petalsOf([ART.ornament('petal-marigold.svg')], { size: [10, 20], count: { mobile: 8, desktop: 16 } }),
  };
}

function garba(side: number): SceneDef {
  const lights: LayerSpec = {
    id: 'lights',
    src: ART.ornament('string-lights.svg'),
    aspect: 1800 / 360,
    parallax: 0.2,
    scrollFY: 0.06,
    layout: (W, H) => {
      const w = Math.max(W * 1.1, 700);
      return { x: 0, y: -H / 2 + (w / 5) * 0.55, w };
    },
  };
  const dandiya: LayerSpec = {
    id: 'dandiya',
    src: ART.ornament('dandiya.svg'),
    aspect: 1,
    parallax: 0.42,
    scrollFX: side * 0.2,
    scrollFY: 0.3,
    sway: { rot: 3, speed: 0.6 },
    layout: (W, H) => {
      const p = portrait(W, H);
      const w = p ? Math.min(W * 0.4, H * 0.19) : Math.min(W * 0.2, H * 0.36);
      return { x: (p ? 1 : -side) * (W / 2 - w * (p ? 0.3 : 0.42)), y: H / 2 - w * (p ? 0.3 : 0.4), w, rot: -8 };
    },
  };
  return {
    back: [backdrop('garba'), arcade('garba', side), lights],
    front: [lantern('lantern-a', 0.42 * -side, 0.02, 1, 0.38, 0.5), lantern('lantern-b', 0.33 * side, -0.1, 0.7, 0.28, 2.1), dandiya],
    particles: petalsOf([ART.ornament('sparkle.svg')], { size: [10, 26], speed: [10, 24], rise: true, spin: 0, drift: 20, opacity: [0.5, 0.95], count: { mobile: 10, desktop: 18 } }),
  };
}

function wedding(side: number): SceneDef {
  const drape = (which: 'l' | 'r'): LayerSpec => ({
    id: `drape-${which}`,
    src: ART.ornament('drape.svg'),
    aspect: 600 / 1500,
    flipX: which === 'r',
    parallax: 0.22,
    scrollFX: which === 'l' ? -0.12 : 0.12,
    sway: { x: 0.008, speed: 0.4, phase: which === 'l' ? 0 : 1 },
    layout: (W, H) => {
      const p = portrait(W, H);
      const h = H * 1.04;
      const w = h * 0.4;
      const dir = which === 'l' ? -1 : 1;
      // Phones show only the outer folds so the drapes frame rather than cover.
      return { x: dir * (W / 2 + (p ? w * 0.26 : -w * 0.42)), y: 0, w };
    },
  });
  const diyas: LayerSpec = {
    id: 'diyas',
    src: ART.ornament('diya-row.svg'),
    aspect: 1800 / 300,
    parallax: 0.4,
    scrollFY: 0.1,
    layout: (W, H): LayerLayout => {
      const p = portrait(W, H);
      const w = p ? W * 1.25 : Math.min(W * 0.9, 1400);
      return { x: 0, y: H / 2 - (w / 6) * 0.42, w };
    },
  };
  return {
    back: [backdrop('wedding'), arcade('wedding', side), drape('l'), drape('r')],
    front: [diyas, cornerBranch('left', 0.9), cornerBranch('right', 0.9)],
    particles: petalsOf(ART.petals),
  };
}

const builders: Record<Id, (side: number) => SceneDef> = { engagement, mandap, haldi, garba, wedding };
const cache = new Map<string, SceneDef>();

/** Stable scene definitions (same object per id/side so stages do not rebuild). */
export function ceremonyScene(id: Id, side: number): SceneDef {
  const key = `${id}:${side}`;
  if (!cache.has(key)) cache.set(key, builders[id](side));
  return cache.get(key)!;
}
