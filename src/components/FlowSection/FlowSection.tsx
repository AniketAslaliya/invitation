import { useRef, type CSSProperties, type ReactNode } from 'react';
import { gsap, MOTION_OK, useGSAP } from '../../lib/gsap';

interface Props {
  id: string;
  label: string;
  /** Colour the previous section ends on — this section fades in out of it at its top edge. */
  from?: string;
  /** Colour this section fades into at its bottom edge (the next section starts from the same colour). */
  edge?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/**
 * Sections sit one after another with no overlap, so content never spills into a neighbour.
 * They still read as one continuous surface: where two sections meet, both fade to exactly the same
 * colour (a "seam"), so there is no visible line between them.
 */
export function FlowSection({ id, label, from, edge, className = '', style, children }: Props) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        // As a section arrives, its scene settles from a slight zoom (scrubbed to the scrollbar).
        // Scale only — any vertical shift would open a gap at the section's edge.
        gsap.fromTo(
          ref.current!.querySelector('.flow-inner'),
          { scale: 1.06 },
          {
            scale: 1,
            ease: 'none',
            scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'top top', scrub: 0.6 },
          },
        );
      });
    },
    { scope: ref },
  );

  return (
    <section ref={ref} id={id} aria-label={label} className={`flow ${className}`} style={style}>
      <div className="flow-inner">{children}</div>
      {from && <div className="seam seam-top" style={{ background: `linear-gradient(to bottom, ${from}, transparent)` }} aria-hidden="true" />}
      {edge && <div className="seam seam-bottom" style={{ background: `linear-gradient(to top, ${edge}, transparent)` }} aria-hidden="true" />}
    </section>
  );
}
