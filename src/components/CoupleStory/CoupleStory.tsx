import { ART } from '../../lib/media';
import { PAGE_EDGES, STORY_PAGE_ASPECT } from '../../scenes/pageScenes';
import { ArtPage } from '../ArtPage/ArtPage';

/** Our Story: the full framed page, shown whole, with petals drifting over it. */
export function CoupleStory() {
  return (
    <ArtPage
      src={ART.storyPage}
      aspect={STORY_PAGE_ASPECT}
      alt="Shubh Vivah. In a thousand tomorrows, I'd still choose you. What began as two separate journeys became one beautiful story. Now, with hearts full of love, we begin our forever together."
      edges={PAGE_EDGES.story}
      fx="story"
    >
      <h2 className="sr-only">Our Story</h2>
    </ArtPage>
  );
}
