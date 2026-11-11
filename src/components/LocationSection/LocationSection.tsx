import { mapsSearchUrl, siteConfig, venueQuery } from '../../data/siteConfig';
import { haptic } from '../../lib/gsap';
import { ART } from '../../lib/media';
import { PAGE_ASPECT, PAGE_EDGES } from '../../scenes/pageScenes';
import { ArtPage } from '../ArtPage/ArtPage';

/**
 * Venue: the full-page venue card, shown whole like the ceremony pages. The map-pin icon in the
 * artwork is a link — tapping it opens the venue on Google Maps (no embedded map).
 */
export function LocationSection() {
  const v = siteConfig.venue;
  const pin = mapsSearchUrl(v);

  return (
    <ArtPage
      src={ART.venuePage}
      aspect={PAGE_ASPECT}
      alt={`Venue: ${venueQuery(v)}. A map-pin icon above the address; tap it to open the location in Google Maps.`}
      edges={PAGE_EDGES.venue}
      overlay={
        pin && (
          <a className="venue-pin" href={pin} target="_blank" rel="noopener noreferrer" onClick={() => haptic()}>
            <span className="sr-only">Open {v.name} in Google Maps (opens a new tab)</span>
          </a>
        )
      }
    >
      <h2 className="sr-only">The Venue</h2>
    </ArtPage>
  );
}
