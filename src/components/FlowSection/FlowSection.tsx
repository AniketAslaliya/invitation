import { useRef, type CSSProperties, type ReactNode } from 'react';
import { gsap, MOTION_OK, useGSAP } from '../../lib/gsap';

interface Props {
  id: string;
  label: string;
  /** Overlap with the previous section (feathered dissolve). The first section after the hero uses it too. */
  blend?: boolean;
  /** Depth of each section in the stack so later sections dissolve over earlier ones. */
  index: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/**
 * Sections flow continuously (no pinning — the skill warns that pinning every section fights native
 * mobile scroll). Each one overlaps the previous by a feathered edge so the two images dissolve into
 * each other, and GSAP scrubs a gentle depth change as it arrives and leaves.
 */
export function FlowSection({ id, label, blend = true, index, className = '', style, children }: Props) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const inner = ref.current!.querySelector('.flow-inner');
        // Arriving: content rises out of the blend and settles (scrubbed to the scrollbar).
        gsap.fromTo(
          inner,
          { yPercent: 7, scale: 1.04 },
          {
            yPercent: 0,
            scale: 1,
            ease: 'none',
            scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'top top', scrub: 0.6 },
          },
        );
        // Leaving: content softens as the next section dissolves in. (No vertical drift here — moving
        // the content up would open an empty strip at the bottom that shows through the feather.)
        gsap.to(inner, {
          opacity: 0.5,
          ease: 'none',
          immediateRender: false,
          scrollTrigger: { trigger: ref.current, start: 'bottom bottom', end: 'bottom top', scrub: 0.6 },
        });
      });
    },
    { scope: ref },
  );

  return (
    <section
      ref={ref}
      id={id}
      aria-label={label}
      className={`flow ${blend ? 'flow-blend' : ''} ${className}`}
      style={{ zIndex: index + 1, ...style }}
    >
      <div className="flow-inner">{children}</div>
    </section>
  );
}
