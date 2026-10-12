// Editable details. Change these at any time — no component changes needed.

export interface VenueConfig {
  name: string;
  /** Full postal address, one line per entry. */
  addressLines: string[];
  /** Optional exact Google Maps share link (e.g. from "Share" in Google Maps). If empty, links are built from name + address. */
  mapsUrl: string;
  /** Optional note shown under the address, e.g. parking or dress code. */
  note: string;
}

export interface MusicConfig {
  /** URL or /public path to an audio file you have the rights to use. Empty = music control hidden. */
  src: string;
  /** Shown as the control's accessible label, e.g. "Shehnai instrumental". */
  title: string;
  /** 0..1 */
  initialVolume: number;
}

export const siteConfig: { couple: { bride: string; groom: string; monogram: string }; venue: VenueConfig; music: MusicConfig } = {
  couple: {
    bride: 'Prutha',
    groom: 'Jatin',
    monogram: 'P & J',
  },
  venue: {
    name: 'Lion Valley Resort',
    addressLines: ['Malanka, Junagadh', 'Gujarat, India'],
    mapsUrl: '',
    note: '',
  },
  music: {
    src: '',
    title: 'Wedding music',
    initialVolume: 0.5,
  },
};

export function venueIsConfigured(v: VenueConfig = siteConfig.venue): boolean {
  return Boolean(v.name.trim() || v.addressLines.some((l) => l.trim()) || v.mapsUrl.trim());
}

/** "Lion Valley Resort, Malanka, Junagadh, Gujarat, India" */
export function venueQuery(v: VenueConfig = siteConfig.venue): string {
  return [v.name, ...v.addressLines].map((s) => s.trim()).filter(Boolean).join(', ');
}

/** Turn-by-turn directions from the guest's current location (opens the Google Maps app if installed). */
export function directionsUrl(v: VenueConfig = siteConfig.venue): string | null {
  const q = venueQuery(v);
  if (!q) return v.mapsUrl.trim() || null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`;
}

/** The venue pinned on Google Maps. */
export function mapsSearchUrl(v: VenueConfig = siteConfig.venue): string | null {
  if (v.mapsUrl.trim()) return v.mapsUrl.trim();
  const q = venueQuery(v);
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : null;
}

/** Apple Maps directions — opens the native Maps app on iPhone. */
export function appleMapsUrl(v: VenueConfig = siteConfig.venue): string | null {
  const q = venueQuery(v);
  return q ? `https://maps.apple.com/?daddr=${encodeURIComponent(q)}&dirflg=d` : null;
}

/** Keyless Google Maps embed for the small preview map. */
export function mapEmbedUrl(v: VenueConfig = siteConfig.venue): string | null {
  const q = venueQuery(v);
  return q ? `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=14&output=embed` : null;
}
