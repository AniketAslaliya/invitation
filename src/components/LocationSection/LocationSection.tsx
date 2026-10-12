import { Check, Copy, MapPin, Navigation } from 'lucide-react';
import { useState } from 'react';
import { appleMapsUrl, directionsUrl, mapEmbedUrl, mapsSearchUrl, siteConfig, venueIsConfigured, venueQuery } from '../../data/siteConfig';
import { haptic } from '../../lib/gsap';
import { ArchCap, Divider } from '../Ornaments';
import { Reveal } from '../Reveal';

/** Venue details come entirely from siteConfig.venue — nothing here is hard-coded. */
export function LocationSection() {
  const v = siteConfig.venue;
  const ready = venueIsConfigured(v);
  const [copied, setCopied] = useState(false);
  const dir = directionsUrl(v);
  const pin = mapsSearchUrl(v);
  const apple = appleMapsUrl(v);
  const embed = mapEmbedUrl(v);

  const copy = async () => {
    const text = venueQuery(v);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Older iOS WebViews: fall back to a hidden textarea.
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    haptic([8, 30, 8]);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="location">
      <ArchCap outside="var(--burgundy-deep)" />
      <div className="location-body">
        <Reveal>
          <MapPin aria-hidden="true" size={26} color="var(--gold)" style={{ margin: '0 auto' }} />
          <p className="eyebrow location-eyebrow">The Venue</p>
        </Reveal>
        {ready ? (
          <>
            <Reveal delay={0.08}>
              <h2 className="location-name">{v.name}</h2>
              {pin ? (
                <a className="location-address" href={pin} target="_blank" rel="noopener noreferrer">
                  {v.addressLines.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                  <span className="sr-only">(opens the map in a new tab)</span>
                </a>
              ) : null}
              {v.note && <p className="location-note">{v.note}</p>}
            </Reveal>
            <Divider />
            {embed && (
              <Reveal delay={0.12} className="location-map">
                <iframe
                  title={`Map showing ${v.name}`}
                  src={embed}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </Reveal>
            )}
            <Reveal delay={0.16} className="location-actions">
              {dir && (
                <a className="btn-royal" href={dir} target="_blank" rel="noopener noreferrer" onClick={() => haptic()}>
                  <Navigation aria-hidden="true" /> Get Directions
                  <span className="sr-only">(opens Google Maps)</span>
                </a>
              )}
              <div className="location-secondary">
                {apple && (
                  <a className="btn-quiet" href={apple} target="_blank" rel="noopener noreferrer">
                    Apple Maps
                  </a>
                )}
                <button type="button" className="btn-quiet" onClick={copy} aria-live="polite">
                  {copied ? (
                    <>
                      <Check size={13} aria-hidden="true" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy size={13} aria-hidden="true" /> Copy address
                    </>
                  )}
                </button>
              </div>
            </Reveal>
          </>
        ) : (
          <p className="location-soon">Venue details will be shared soon.</p>
        )}
      </div>
    </div>
  );
}
