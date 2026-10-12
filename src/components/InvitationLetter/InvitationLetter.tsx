import { motion, useReducedMotion } from 'framer-motion';
import { ceremonies } from '../../data/ceremonies';
import { siteConfig } from '../../data/siteConfig';
import { ART } from '../../lib/media';
import { Divider } from '../Ornaments';
import { Reveal } from '../Reveal';

/** Full-screen parchment invitation — no frame, the paper fills the phone. */
export function InvitationLetter() {
  const reduce = useReducedMotion();
  const first = ceremonies[0];
  const last = ceremonies[ceremonies.length - 1];
  const days = `${first.dateLabel.split(', ')[1].split(' ')[0]}–${last.dateLabel.split(', ')[1]}`;
  const { bride, groom } = siteConfig.couple;
  const sway = (dir: number) =>
    reduce ? undefined : { rotate: [0, dir * 1.6, 0], transition: { duration: 7, repeat: Infinity, ease: 'easeInOut' as const } };

  return (
    <div className="paper invitation" style={{ '--parchment-img': `url(${ART.parchment})` } as React.CSSProperties}>
      <motion.img className="corner-branch left" src={ART.branchLeft} alt="" aria-hidden="true" animate={sway(1)} />
      <motion.img className="corner-branch right" src={ART.branchRight} alt="" aria-hidden="true" animate={sway(-1)} />
      <div className="paper-content">
        <Reveal>
          <img className="ganesha" src={ART.ganesha} alt="Shri Ganesha" width={76} height={99} />
        </Reveal>
        <Reveal as="h2" delay={0.1} className="invitation-title">
          Wedding Invitation
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
      </div>
    </div>
  );
}
