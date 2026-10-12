import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ceremonies } from '../../data/ceremonies';
import { siteConfig } from '../../data/siteConfig';
import { ART } from '../../lib/media';
import { CornerFiligree, Divider } from '../Ornaments';
import { Reveal } from '../Reveal';

export function InvitationLetter() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  // The parchment rises out of the palace scene and settles; branches drift at their own depth.
  const cardY = useTransform(scrollYProgress, [0, 0.45], [90, 0]);
  const cardRot = useTransform(scrollYProgress, [0, 0.45], [7, 0]);
  const cardScale = useTransform(scrollYProgress, [0, 0.45], [0.94, 1]);
  const leftY = useTransform(scrollYProgress, [0, 1], [-40, 120]);
  const rightY = useTransform(scrollYProgress, [0, 1], [-20, 160]);

  const first = ceremonies[0];
  const last = ceremonies[ceremonies.length - 1];
  const days = `${first.dateLabel.split(', ')[1].split(' ')[0]}–${last.dateLabel.split(', ')[1]}`;
  const { bride, groom } = siteConfig.couple;

  return (
    <section ref={ref} id="invitation" className="parchment-section invitation" aria-labelledby="invitation-title">
      <motion.img
        className="invitation-branch left"
        src={ART.branchLeft}
        alt=""
        aria-hidden="true"
        loading="lazy"
        style={reduce ? undefined : { y: leftY }}
      />
      <motion.img
        className="invitation-branch right"
        src={ART.branchRight}
        alt=""
        aria-hidden="true"
        loading="lazy"
        style={reduce ? undefined : { y: rightY }}
      />
      <Reveal className="chapter" style={{ textAlign: 'center', marginBottom: 28, position: 'relative', zIndex: 3 }}>
        <span className="chapter-label">Chapter II</span>
      </Reveal>
      <motion.article
        className="parchment invitation-card"
        style={
          reduce
            ? ({ '--parchment-img': `url(${ART.parchment})` } as React.CSSProperties)
            : ({ '--parchment-img': `url(${ART.parchment})`, y: cardY, rotateX: cardRot, scale: cardScale, transformPerspective: 1200 } as never)
        }
      >
        <CornerFiligree className="tl" />
        <CornerFiligree className="tr" />
        <CornerFiligree className="bl" />
        <CornerFiligree className="br" />
        <Reveal>
          <img className="ganesha" src={ART.ganesha} alt="Shri Ganesha" width={76} height={99} loading="lazy" />
        </Reveal>
        <Reveal as="h2" delay={0.1}>
          <span id="invitation-title">Wedding Invitation</span>
        </Reveal>
        <Divider />
        <Reveal as="p" className="invitation-blessing" delay={0.15}>
          With the blessings of our families, we joyfully invite you to celebrate the beginning of our forever.
        </Reveal>
        <Divider />
        <Reveal as="p" className="invitation-names" delay={0.2}>
          {bride}
          <span className="amp">&amp;</span>
          {groom}
        </Reveal>
        <Reveal as="p" className="invitation-foot" delay={0.3}>
          Five celebrations · {days}
        </Reveal>
      </motion.article>
    </section>
  );
}
