import { useRef, type CSSProperties, type ReactNode } from 'react';
import { gsap, MOTION_OK, useGSAP } from '../../lib/gsap';

interface Props {
  id: string;
  label: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/**
 * One full-screen page. Native scroll-snap moves exactly one page per swipe; when a page arrives a
 * single GSAP timeline (ScrollTrigger on the timeline, never on its children) plays its entrance and
 * reverses it if the guest swipes back. Transform and opacity only, so it stays smooth on low-end phones.
 *
 *   [data-anim]          rise + fade, staggered            (stagger list preset)
 *   [data-anim="art"]    the page's artwork settles in     (scale + fade)
 *   [data-anim="drop"]   drops in with a soft bounce        (e.g. the map pin)
 *   [data-split] .ch     letter-by-letter headline reveal  (short headlines only)
 */
export function Page({ id, label, className = '', style, children }: Props) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const q = gsap.utils.selector(ref);
        const art = q('[data-anim="art"]');
        const drops = q('[data-anim="drop"]');
        const items = q('[data-anim=""]');
        const chars = q('[data-split] .ch');
        if (!art.length && !drops.length && !items.length && !chars.length) return;

        const tl = gsap.timeline({
          defaults: { ease: 'power2.out' },
          scrollTrigger: { trigger: ref.current, start: 'top 60%', toggleActions: 'play none none reverse' },
        });
        if (art.length) tl.from(art, { autoAlpha: 0, scale: 0.94, duration: 0.9 }, 0);
        if (items.length) tl.from(items, { autoAlpha: 0, y: 26, duration: 0.7, stagger: 0.08 }, 0.05);
        if (chars.length)
          tl.from(chars, { autoAlpha: 0, y: 18, rotationX: -50, transformPerspective: 400, duration: 0.6, stagger: 0.025, ease: 'expo.out' }, 0.15);
        if (drops.length) tl.from(drops, { y: -60, autoAlpha: 0, duration: 0.9, ease: 'bounce.out' }, 0.1);
      });
    },
    { scope: ref },
  );

  return (
    <section ref={ref} id={id} aria-label={label} className={`page ${className}`} style={style}>
      {children}
    </section>
  );
}
