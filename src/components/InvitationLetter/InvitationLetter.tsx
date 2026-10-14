import { ceremonies } from '../../data/ceremonies';
import { siteConfig } from '../../data/siteConfig';
import { ART } from '../../lib/media';
import { Divider } from '../Ornaments';
import { Reveal } from '../Reveal';
import { SplitChars } from '../SplitChars';

/** Full-screen parchment invitation — no frame, the paper fills the phone. */
export function InvitationLetter() {
  const first = ceremonies[0];
  const last = ceremonies[ceremonies.length - 1];
  const days = `${first.dateLabel.split(', ')[1].split(' ')[0]}–${last.dateLabel.split(', ')[1]}`;
  const { bride, groom } = siteConfig.couple;

  return (
    <div className="paper invitation" style={{ '--parchment-img': `url(${ART.parchment})` } as React.CSSProperties}>
      <img className="corner-branch left" src={ART.branchLeft} alt="" aria-hidden="true" />
      <img className="corner-branch right" src={ART.branchRight} alt="" aria-hidden="true" />
      <div className="paper-content">
        <Reveal>
          <img className="ganesha" src={ART.ganesha} alt="Shri Ganesha" width={76} height={99} />
        </Reveal>
        <h2 className="invitation-title">
          <SplitChars text="Wedding Invitation" />
        </h2>
        <Divider />
        <Reveal as="p" className="invitation-blessing">
          With the blessings of our families, we joyfully invite you to celebrate the beginning of our forever.
        </Reveal>
        <Divider />
        <p className="invitation-names">
          <SplitChars text={bride} />
          <span className="amp" data-anim="">
            &amp;
          </span>
          <SplitChars text={groom} />
        </p>
        <Reveal as="p" className="invitation-foot">
          Five celebrations · {days}
        </Reveal>
      </div>
    </div>
  );
}
