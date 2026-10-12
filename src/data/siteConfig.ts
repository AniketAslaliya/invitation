// Details that have not been confirmed yet. Fill these in at any time — no component changes needed.

export interface VenueConfig {
  /** e.g. "The Leela Palace" — leave empty until confirmed. */
  name: string;
  /** Full postal address, one line per entry. */
  addressLines: string[];
  /** Optional Google Maps share link. If empty, a search link is built from the name + address. */
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
    name: '',
    addressLines: [],
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

export function directionsUrl(v: VenueConfig = siteConfig.venue): string | null {
  if (v.mapsUrl.trim()) return v.mapsUrl.trim();
  const query = [v.name, ...v.addressLines].map((s) => s.trim()).filter(Boolean).join(', ');
  if (!query) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}
