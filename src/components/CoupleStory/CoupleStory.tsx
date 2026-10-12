import { ParallaxStage } from '../../parallax/ParallaxStage';
import { STORY_ASPECT, storyScene } from '../../scenes/portraitScenes';
import { Reveal } from '../Reveal';

export function CoupleStory() {
  return (
    <section id="story" className="story" aria-labelledby="story-title" style={{ '--story-aspect': String(STORY_ASPECT) } as React.CSSProperties}>
      <div className="story-layout">
        <div className="story-intro">
          <Reveal>
            <span className="chapter-label">Chapter III</span>
          </Reveal>
          <Reveal as="h2" delay={0.08}>
            <span id="story-title">
              Our <span className="script">Story</span>
            </span>
          </Reveal>
          <Reveal as="p" className="story-lede" delay={0.16}>
            Some stories are written in the stars. Ours began with two separate journeys and grew into a lifetime of memories, laughter, and
            love.
          </Reveal>
        </div>
        <div className="story-stage-wrap">
          <ParallaxStage back={storyScene.back} particles={storyScene.particles} camera={0.4}>
            <p className="sr-only">
              Shubh Vivah. In a thousand tomorrows, I’d still choose you. What began as two separate journeys became one beautiful story. Now,
              with hearts full of love, we begin our forever together. Three photographs of Prutha and Jatin together.
            </p>
          </ParallaxStage>
        </div>
      </div>
    </section>
  );
}
