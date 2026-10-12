import { MapPin, Navigation } from 'lucide-react';
import { directionsUrl, siteConfig, venueIsConfigured } from '../../data/siteConfig';
import { ART } from '../../lib/media';
import { ArchCap, Divider } from '../Ornaments';
import { Reveal } from '../Reveal';

/** Venue details come entirely from siteConfig.venue — nothing here is hard-coded. */
export function LocationSection() {
  const v = siteConfig.venue;
  const ready = venueIsConfigured(v);
  const url = directionsUrl(v);

  return (
    <section id="location" className="parchment-section location" aria-labelledby="location-title">
      <Reveal style={{ textAlign: 'center', marginBottom: 28 }}>
        <span className="chapter-label">Chapter VI</span>
      </Reveal>
      <Reveal className="location-frame">
        <div className="parchment location-body" style={{ '--parchment-img': `url(${ART.parchment})` } as React.CSSProperties}>
          <ArchCap outside="#26050e" />
          <MapPin aria-hidden="true" size={26} color="var(--gold)" style={{ margin: '0 auto' }} />
          <p className="eyebrow" style={{ color: '#8a5a2a', marginTop: 10 }}>
            Location
          </p>
          <h2 id="location-title">The Venue</h2>
          <Divider />
          {ready ? (
            <>
              {v.name && <p className="location-name">{v.name}</p>}
              {v.addressLines.length > 0 && (
                <address className="location-address">
                  {v.addressLines.map((line) => (
                    <span key={line} style={{ display: 'block' }}>
                      {line}
                    </span>
                  ))}
                </address>
              )}
              {v.note && <p className="location-note">{v.note}</p>}
              {url && (
                <a className="btn-royal" href={url} target="_blank" rel="noopener noreferrer">
                  <Navigation aria-hidden="true" /> Get Directions
                  <span className="sr-only">(opens Google Maps in a new tab)</span>
                </a>
              )}
            </>
          ) : (
            <p className="location-soon">Venue details will be shared soon.</p>
          )}
        </div>
      </Reveal>
    </section>
  );
}
