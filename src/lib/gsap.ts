import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register once, before any ScrollTrigger / useGSAP usage (gsap-scrolltrigger + gsap-react skills).
gsap.registerPlugin(ScrollTrigger, useGSAP);

// Mobile browsers resize the viewport as the URL bar shows/hides; don't recalc on those tiny changes.
ScrollTrigger.config({ ignoreMobileResize: true });

export const REDUCED = '(prefers-reduced-motion: reduce)';
export const MOTION_OK = '(prefers-reduced-motion: no-preference)';

/** Light haptic tick on Android (iOS Safari has no Vibration API — silently ignored). */
export function haptic(pattern: number | number[] = 12) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported */
  }
}

export { gsap, ScrollTrigger, useGSAP };

// Recalculate trigger positions once fonts and images have settled the layout.
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
