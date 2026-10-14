/** Smoothly scrolls to a page (or pixel offset). Native scrolling only — scroll-snap does the rest. */
export function scrollToTarget(target: string | HTMLElement | number, opts: { instant?: boolean } = {}) {
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
  if (el === null) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const behavior: ScrollBehavior = reduce || opts.instant ? 'auto' : 'smooth';
  const top = typeof el === 'number' ? el : el.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top, behavior });
}
