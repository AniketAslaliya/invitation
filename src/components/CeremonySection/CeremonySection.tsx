import type { Ceremony } from '../../data/ceremonies';
import { ART } from '../../lib/media';
import { PAGE_ASPECT, PAGE_EDGES } from '../../scenes/pageScenes';
import { ArtPage } from '../ArtPage/ArtPage';

/** One ceremony = its full-page invitation, shown whole. The artwork carries the title, date and time. */
export function CeremonySection({ ceremony: c }: { ceremony: Ceremony }) {
  return (
    <ArtPage src={ART.eventPage(c.id)} aspect={PAGE_ASPECT} alt={c.artAlt} edges={PAGE_EDGES[c.id]} fx={c.id}>
      <p className="sr-only">
        {c.title}: {c.dateLabel}, {c.displayTime}, Lion Valley Resort.
      </p>
    </ArtPage>
  );
}
