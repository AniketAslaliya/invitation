import Lenis from 'lenis';
import { subscribe } from './ticker';

let lenis: Lenis | null = null;
let unsub: (() => void) | null = null;

/** Smooth wheel scrolling on desktop only; touch devices keep native momentum scrolling. */
export function enableSmoothScroll() {
  if (lenis) return;
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false });
  // Lenis runs on the page's shared animation loop.
  unsub = subscribe((time) => lenis?.raf(time * 1000));
}

export function disableSmoothScroll() {
  unsub?.();
  unsub = null;
  lenis?.destroy();
  lenis = null;
}

export function scrollToTarget(target: string | HTMLElement | number, opts: { instant?: boolean } = {}) {
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
  if (el === null) return;
  if (lenis) {
    lenis.scrollTo(el as HTMLElement | number, { duration: opts.instant ? 0 : 1.8, immediate: opts.instant });
    return;
  }
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const behavior: ScrollBehavior = reduce || opts.instant ? 'auto' : 'smooth';
  if (typeof el === 'number') window.scrollTo({ top: el, behavior });
  else el.scrollIntoView({ behavior, block: 'start' });
}
