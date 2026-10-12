import { ArrowUp } from 'lucide-react';
import { scrollToTarget } from '../../lib/scroll';
import { ParallaxStage } from '../../parallax/ParallaxStage';
import { CLOSING_ASPECT, closingScene } from '../../scenes/portraitScenes';
import { Divider } from '../Ornaments';
import { Reveal } from '../Reveal';

export function ClosingInvitation() {
  return (
    <section id="closing" className="closing" aria-labelledby="closing-title" style={{ '--closing-aspect': String(CLOSING_ASPECT) } as React.CSSProperties}>
      <h2 id="closing-title" className="sr-only">
        With love, Prutha and Jatin
      </h2>
      <div className="closing-stage-wrap">
        <ParallaxStage back={closingScene.back} front={closingScene.front} particles={closingScene.particles} camera={0.35}>
          {/* The words are part of the photograph; repeated here for screen readers. */}
          <p className="sr-only">
            Photograph of Prutha and Jatin embracing. With the blessings of our families, we heartily welcome you to be a part of our forever. With
            love, Prutha and Jatin.
          </p>
        </ParallaxStage>
      </div>
      <div className="closing-end">
        <Divider />
        <Reveal>
          <button type="button" className="btn-royal" onClick={() => scrollToTarget(0)}>
            <ArrowUp aria-hidden="true" /> Return to the Beginning
          </button>
        </Reveal>
        <p className="colophon">Chapter VII · With love</p>
      </div>
    </section>
  );
}
