import { ParallaxStage } from '../../parallax/ParallaxStage';
import { STORY_ASPECT, storyScene } from '../../scenes/portraitScenes';

/** The story artwork fills the phone; its photographs float as separate layers. */
export function CoupleStory() {
  return (
    <div className="art-screen" style={{ '--art-aspect': String(STORY_ASPECT) } as React.CSSProperties}>
      <ParallaxStage back={storyScene.back} particles={storyScene.particles} camera={0}>
        <h2 className="sr-only">Our Story</h2>
        <p className="sr-only">
          Shubh Vivah. In a thousand tomorrows, I’d still choose you. What began as two separate journeys became one beautiful story. Now, with
          hearts full of love, we begin our forever together. Three photographs of Prutha and Jatin together.
        </p>
      </ParallaxStage>
    </div>
  );
}
