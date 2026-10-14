import pages from '../../public/media/pages.json';

const p = pages as Record<string, { w: number; h: number }>;
export const PAGE_ASPECT = p['events/engagement-full'].w / p['events/engagement-full'].h;
export const STORY_PAGE_ASPECT = p['story/page'].w / p['story/page'].h;
export const CLOSING_PAGE_ASPECT = p['closing/couple'].w / p['closing/couple'].h;

/** Outer border colour at the top and bottom of each page, sampled from the artwork, so the
 * neighbouring sections can fade straight into it. */
export const PAGE_EDGES = {
  story: { top: '#9b3d32', bottom: '#a03d32' },
  engagement: { top: '#3a648d', bottom: '#37618a' },
  mandap: { top: '#a97d1b', bottom: '#a87b16' },
  haldi: { top: '#ac7a19', bottom: '#ad7815' },
  garba: { top: '#93271f', bottom: '#93251d' },
  wedding: { top: '#f3c39a', bottom: '#eacda4' },
  closing: { top: '#945860', bottom: '#000000' },
} as const;
