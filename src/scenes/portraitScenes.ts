import sections from '../../public/media/sections.json';
import heroManifest from '../../public/media/hero/manifest.json';
import { ART } from '../lib/media';
import type { LayerLayout, LayerSpec, ParticleSpec } from '../parallax/types';

const SW = sections.story.w;
const SH = sections.story.h;
const SA = SW / SH;
const portrait = (W: number, H: number) => W / H < 0.95;

/**
 * Portrait artwork placement. Phones: the stage itself has the artwork's aspect ratio, so the
 * artwork fills it with nothing cropped. Wide screens: a tall panel offset to one side.
 */
export function panelLayout(side: number) {
  return (W: number, H: number): LayerLayout => {
    if (portrait(W, H)) return { x: 0, y: 0, w: Math.max(W, H * SA) };
    const h = H * 0.9;
    return { x: side * Math.min(W * 0.2, W / 2 - (h * SA) / 2 - W * 0.05), y: 0, w: h * SA };
  };
}

function inPanel(side: number, rect: { x: number; y: number; w: number; h: number }) {
  const panel = panelLayout(side);
  return (W: number, H: number): LayerLayout => {
    const p = panel(W, H);
    const k = p.w / SW;
    const left = p.x - p.w / 2;
    const top = p.y - (SH * k) / 2;
    return { x: left + (rect.x + rect.w / 2) * k, y: top + (rect.y + rect.h / 2) * k, w: rect.w * k };
  };
}

/** Gold-matted frame behind a portrait panel on wide screens (hidden on phones). */
function frameFor(id: string, panel: (W: number, H: number) => LayerLayout, parallax: number): LayerSpec {
  return {
    id,
    src: ART.ornament('frame-portrait.svg'),
    aspect: 607 / 1044,
    parallax,
    layout: (W, H) => {
      const p = panel(W, H);
      return { x: p.x, y: p.y, w: (p.w * 607) / 563, hidden: portrait(W, H) };
    },
  };
}

const BACKDROP_ASPECT = 1800 / 282;
const sunset: LayerSpec = {
  id: 'sunset',
  src: ART.sky,
  aspect: BACKDROP_ASPECT,
  parallax: 0.05,
  scrollFY: -0.1,
  opacity: 0.75,
  layout: (W, H) => ({ x: 0, y: H * 0.1, w: Math.max(W * 1.15, H * 1.15 * BACKDROP_ASPECT), hidden: portrait(W, H) }),
};

/* Our Story --------------------------------------------------------------------------------- */
const STORY_SIDE = 1;
const L = sections.story.layers;

export const storyScene: { back: LayerSpec[]; particles: ParticleSpec } = {
  back: [
    sunset,
    { ...frameFor('story-frame', panelLayout(STORY_SIDE), 0.06), scrollFY: -0.04 },
    { id: 'story-plate', src: ART.story.plate, aspect: SA, parallax: 0.06, scrollFY: -0.04, layout: panelLayout(STORY_SIDE) },
    {
      id: 'photo-left',
      src: ART.story.photoLeft,
      aspect: L['photo-left'].w / L['photo-left'].h,
      parallax: 0.3,
      scrollFY: 0.07,
      sway: { rot: 0.5, speed: 0.5 },
      layout: inPanel(STORY_SIDE, L['photo-left']),
    },
    {
      id: 'photos-right',
      src: ART.story.photosRight,
      aspect: L['photos-right'].w / L['photos-right'].h,
      parallax: 0.24,
      scrollFY: 0.05,
      sway: { rot: -0.4, speed: 0.42, phase: 1.5 },
      layout: inPanel(STORY_SIDE, L['photos-right']),
    },
  ],
  particles: {
    textures: ART.petals,
    count: { mobile: 4, desktop: 9 },
    size: [14, 30],
    speed: [20, 40],
    drift: 30,
    spin: 40,
    opacity: [0.7, 1],
  },
};
export const STORY_ASPECT = SA;

/* Closing ----------------------------------------------------------------------------------- */
const CA = sections.closing.w / sections.closing.h;
const bl = heroManifest['branch-left'];
const br = heroManifest['branch-right'];

export const closingScene: { back: LayerSpec[]; front: LayerSpec[]; particles: ParticleSpec } = {
  back: [
    sunset,
    { ...frameFor('couple-frame', (_W, H) => ({ x: 0, y: 0, w: H * 0.9 * CA }), 0.05), scrollFY: -0.03, zoom: 0.03 },
    {
      id: 'couple',
      src: ART.closing,
      aspect: CA,
      parallax: 0.05,
      scrollFY: -0.03,
      zoom: 0.03,
      layout: (W, H) => {
        if (portrait(W, H)) return { x: 0, y: 0, w: Math.max(W, H * CA) };
        const h = H * 0.9;
        return { x: 0, y: 0, w: h * CA };
      },
    },
  ],
  front: [
    {
      id: 'branch-left',
      src: ART.branchLeft,
      aspect: bl.w / bl.h,
      parallax: 0.36,
      scrollFX: -0.25,
      scrollFY: 0.2,
      sway: { x: 0.02, rot: 1.2, speed: 0.5 },
      layout: (W, H) => {
        const w = portrait(W, H) ? W * 0.46 : Math.min(W * 0.28, H * 0.55);
        return { x: -W / 2 + w * 0.36, y: -H / 2 + (w / (bl.w / bl.h)) * 0.34, w };
      },
    },
    {
      id: 'branch-right',
      src: ART.branchRight,
      aspect: br.w / br.h,
      parallax: 0.42,
      scrollFX: 0.25,
      scrollFY: 0.22,
      sway: { x: 0.02, rot: -1.3, speed: 0.46, phase: 2 },
      layout: (W, H) => {
        const w = portrait(W, H) ? W * 0.34 : Math.min(W * 0.2, H * 0.42);
        return { x: W / 2 - w * 0.38, y: -H / 2 + (w / (br.w / br.h)) * 0.36, w };
      },
    },
  ],
  particles: {
    textures: ART.petals,
    count: { mobile: 6, desktop: 12 },
    size: [16, 36],
    speed: [18, 36],
    drift: 34,
    spin: 40,
    opacity: [0.75, 1],
  },
};
export const CLOSING_ASPECT = CA;
