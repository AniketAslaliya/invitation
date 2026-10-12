import { motion, useReducedMotion } from 'framer-motion';
import type { Ceremony } from '../../data/ceremonies';
import { ART, srcSet } from '../../lib/media';
import { ParallaxStage } from '../../parallax/ParallaxStage';
import { ceremonyScene } from '../../scenes/ceremonyScenes';

/**
 * One ceremony = the original invitation artwork, as large as the phone allows, inside its own
 * palace setting. The artwork already carries the title, date and time.
 */
export function CeremonySection({ ceremony: c }: { ceremony: Ceremony }) {
  const reduce = useReducedMotion();
  const scene = ceremonyScene(c.id, 0);
  const art = ART.event(c.id);

  return (
    <div className="ceremony" style={{ '--deep': c.theme.deep } as React.CSSProperties}>
      <ParallaxStage back={scene.back} front={scene.front} particles={scene.particles} camera={0}>
        <motion.figure
          className="ceremony-art"
          initial={reduce ? false : { opacity: 0, scale: 0.9, y: 40 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: false, amount: 0.45 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <img src={art[1080]} srcSet={srcSet(art)} sizes="min(96vw, 470px)" alt={c.artAlt} width={1080} height={1080} loading="lazy" decoding="async" />
          <figcaption className="sr-only">
            {c.title}: {c.dateLabel}, {c.displayTime}
          </figcaption>
        </motion.figure>
      </ParallaxStage>
    </div>
  );
}
