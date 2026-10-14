import type { Responsive } from '../parallax/types';

const BASE = `${import.meta.env.BASE_URL}media/`;

export const media = (path: string) => BASE + path;

/** `resp('hero/plate-open', [720, 1200])` → { 720: '.../plate-open-720.webp', ... } */
export function resp(stem: string, widths: number[]): Record<number, string> {
  return Object.fromEntries(widths.map((w) => [w, media(`${stem}-${w}.webp`)]));
}

export function srcSet(src: Responsive): string | undefined {
  if (typeof src === 'string') return undefined;
  return Object.entries(src)
    .map(([w, url]) => `${url} ${w}w`)
    .join(', ');
}

export function largest(src: Responsive): string {
  if (typeof src === 'string') return src;
  const ws = Object.keys(src).map(Number);
  return src[Math.max(...ws)];
}

export function preload(urls: string[], timeoutMs: number): Promise<void> {
  const all = Promise.all(
    urls.map(
      (u) =>
        new Promise<void>((res) => {
          const img = new Image();
          img.onload = img.onerror = () => res();
          img.src = u;
        }),
    ),
  ).then(() => undefined);
  return Promise.race([all, new Promise<void>((r) => setTimeout(r, timeoutMs))]);
}

export const ART = {
  plateClosed: resp('hero/plate-closed', [720, 1200, 1680]),
  plateOpen: resp('hero/plate-open', [720, 1200, 1680]),
  heroBackdrop: media('hero/backdrop.webp'),
  branchLeft: media('hero/branch-left.webp'),
  branchRight: media('hero/branch-right.webp'),
  petals: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => media(`hero/petal-${i}.webp`)),
  envelope: {
    flap: media('envelope/flap.webp'),
    liner: media('envelope/liner.webp'),
    seal: media('envelope/seal.webp'),
    card: media('envelope/card.webp'),
  },
  closing: resp('closing/couple', [720, 1200, 1600]),
  /** Full-page (9:16) ceremony invitations. */
  eventPage: (id: string) => resp(`events/${id}-full`, [720, 1080, 1440]),
  storyPage: resp('story/page', [720, 941]),
  ornament: (name: string) => media(`ornaments/${name}`),
  ganesha: media('ornaments/ganesha.webp'),
  parchment: media('textures/parchment.webp'),
};
