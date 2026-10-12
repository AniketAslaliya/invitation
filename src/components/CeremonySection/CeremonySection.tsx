import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import type { Ceremony } from '../../data/ceremonies';
import { ART, srcSet } from '../../lib/media';
import { ParallaxStage } from '../../parallax/ParallaxStage';
import { ceremonyScene } from '../../scenes/ceremonyScenes';

interface Props {
  ceremony: Ceremony;
  index: number;
  prevDeep: string;
  nextDeep: string;
}

export function CeremonySection({ ceremony: c, index, prevDeep, nextDeep }: Props) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  // Alternate the artwork left/right on wide screens for rhythm.
  const side = index % 2 === 0 ? -1 : 1;
  const scene = ceremonyScene(c.id, side);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const artOpacity = useTransform(scrollYProgress, [0.1, 0.3], [0, 1]);
  const artScale = useTransform(scrollYProgress, [0.1, 0.34], [0.92, 1]);
  const artY = useTransform(scrollYProgress, [0.1, 0.34], [60, 0]);
  const headOpacity = useTransform(scrollYProgress, [0.16, 0.32], [0, 1]);
  const headY = useTransform(scrollYProgress, [0.16, 0.32], [24, 0]);
  const textOpacity = useTransform(scrollYProgress, [0.24, 0.4], [0, 1]);
  const textY = useTransform(scrollYProgress, [0.24, 0.4], [24, 0]);
  const art = ART.event(c.id);

  const style = {
    '--deep': c.theme.deep,
    '--mid': c.theme.mid,
    '--accent': c.theme.accent,
    '--prev': prevDeep,
    '--next': nextDeep,
  } as React.CSSProperties;

  return (
    <section ref={ref} id={`event-${c.id}`} className="ceremony" style={style} aria-labelledby={`event-${c.id}-title`}>
      <div className="ceremony-sticky">
        <ParallaxStage back={scene.back} front={scene.front} particles={scene.particles} camera={0.45}>
          <div className="ceremony-content" data-side={side === 1 ? '1' : '0'}>
            <motion.figure className="ceremony-art" style={reduce ? undefined : { opacity: artOpacity, scale: artScale, y: artY }}>
              <img
                src={art[1080]}
                srcSet={srcSet(art)}
                sizes="(min-width: 900px) min(72svh, 640px), min(92vw, 52svh)"
                alt={c.artAlt}
                width={1080}
                height={1080}
                loading="lazy"
                decoding="async"
              />
            </motion.figure>
            <div className="ceremony-copy">
              <motion.header className="ceremony-head" style={reduce ? undefined : { opacity: headOpacity, y: headY }}>
                <p className="eyebrow">Ceremony {c.numeral}</p>
                <h3 id={`event-${c.id}-title`}>{c.heading.toUpperCase()}</h3>
              </motion.header>
              <motion.div className="ceremony-text ceremony-text-scrim" style={reduce ? undefined : { opacity: textOpacity, y: textY }}>
                <p className="ceremony-tagline">“{c.tagline}”</p>
                <p className="ceremony-when">
                  <time dateTime={new Date(c.timestamp).toISOString()}>
                    {c.dateLabel}
                    <span className="dot" aria-hidden="true">
                      ·
                    </span>
                    {c.displayTime}
                  </time>
                </p>
              </motion.div>
            </div>
          </div>
        </ParallaxStage>
      </div>
    </section>
  );
}
