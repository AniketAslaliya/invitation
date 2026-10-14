import { ART } from '../../lib/media';
import { CLOSING_PAGE_ASPECT, PAGE_EDGES } from '../../scenes/pageScenes';
import { ArtPage } from '../ArtPage/ArtPage';

/** Final page: the couple's photograph with their message, shown whole, petals drifting over it. */
export function ClosingInvitation() {
  return (
    <ArtPage
      src={ART.closing}
      aspect={CLOSING_PAGE_ASPECT}
      alt="Prutha and Jatin holding hands around a sunflower and red rose. With the blessings of our families, we heartily welcome you to be a part of our forever. With love, Prutha and Jatin."
      edges={PAGE_EDGES.closing}
      fx="closing"
      cover
    >
      <h2 className="sr-only">With love, Prutha and Jatin</h2>
    </ArtPage>
  );
}
