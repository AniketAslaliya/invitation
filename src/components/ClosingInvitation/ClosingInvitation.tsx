import { ParallaxStage } from '../../parallax/ParallaxStage';
import { CLOSING_ASPECT, closingScene } from '../../scenes/portraitScenes';

/** Final screen: the couple's photograph fills the phone, framed by flowers and drifting petals. */
export function ClosingInvitation() {
  return (
    <div className="art-screen" style={{ '--art-aspect': String(CLOSING_ASPECT) } as React.CSSProperties}>
      <ParallaxStage back={closingScene.back} front={closingScene.front} particles={closingScene.particles} camera={0}>
        <h2 className="sr-only">With love, Prutha and Jatin</h2>
        {/* The words are part of the photograph; repeated here for screen readers. */}
        <p className="sr-only">
          Photograph of Prutha and Jatin embracing. With the blessings of our families, we heartily welcome you to be a part of our forever. With
          love, Prutha and Jatin.
        </p>
      </ParallaxStage>
    </div>
  );
}
