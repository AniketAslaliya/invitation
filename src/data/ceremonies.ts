import { weddingEvents, type WeddingEventData } from './weddingEvents';
import { formatInZone, zonedTimeToUtc } from '../lib/time';

export interface CeremonyTheme {
  /** Deep section background the scene melts into. */
  deep: string;
  /** Slightly lighter tone for gradients. */
  mid: string;
  /** Text accent (headings). */
  accent: string;
  /** Body text on the section background. */
  ink: string;
}

export interface Ceremony extends WeddingEventData {
  numeral: string;
  tagline: string;
  /** Visible heading — the approved title in display caps. */
  heading: string;
  theme: CeremonyTheme;
  artAlt: string;
  timestamp: number;
  weekday: string;
  dateLabel: string; // "Saturday, 12 December 2026"
}

const presentation: Record<WeddingEventData['id'], Omit<Ceremony, keyof WeddingEventData | 'timestamp' | 'weekday' | 'dateLabel'>> = {
  engagement: {
    numeral: 'I',
    heading: 'Engagement',
    tagline: 'Where our forever begins.',
    theme: { deep: '#4a0c26', mid: '#7a1a45', accent: '#E9C889', ink: '#FFF1D5' },
    artAlt:
      'Engagement invitation: an ivory arch framed in rich pink with carved sandstone jharokhas, peacocks and bougainvillea. Saturday 12 December 2026 at 8:00 AM.',
  },
  mandap: {
    numeral: 'II',
    heading: 'Mandap',
    tagline: 'An auspicious beginning, blessed with love and tradition.',
    theme: { deep: '#0b2a1d', mid: '#123D2B', accent: '#E9C889', ink: '#FFF1D5' },
    artAlt:
      'Mandap invitation: a forest green and champagne gold frame with a carved pillar, a peacock, white jasmine and a hanging brass lantern. Saturday 12 December 2026 at 9:30 AM.',
  },
  haldi: {
    numeral: 'III',
    heading: 'Haldi Carnival',
    tagline: 'A little sunshine, a lot of laughter, and a celebration of love.',
    theme: { deep: '#6a3306', mid: '#a2560c', accent: '#FFE2A2', ink: '#FFF6E3' },
    artAlt:
      'Haldi Carnival invitation: turmeric yellow with marigold garlands, banana leaves, a shehnai and brass bowls of haldi. Saturday 12 December 2026 at 4:00 PM.',
  },
  garba: {
    numeral: 'IV',
    heading: 'Garba Night',
    tagline: 'An evening of rhythm, tradition, and unforgettable memories.',
    theme: { deep: '#051326', mid: '#071B31', accent: '#E9C889', ink: '#FFF1D5' },
    artAlt:
      'Garba Night invitation: a midnight blue courtyard with brass lanterns, string lights, dandiya sticks, a dhol and a vintage car garlanded with flowers. Saturday 12 December 2026 at 8:00 PM.',
  },
  wedding: {
    numeral: 'V',
    heading: 'The Wedding',
    tagline: 'Two souls, one sacred promise, and a lifetime of togetherness.',
    theme: { deep: '#2c0510', mid: '#430918', accent: '#E9C889', ink: '#FFF1D5' },
    artAlt:
      'Wedding invitation: the couple exchanging garlands beneath a sandstone mandap draped in maroon and red roses, with brass diyas and a sunset over the hills. Sunday 13 December 2026 at 4:00 PM.',
  },
};

export const ceremonies: Ceremony[] = weddingEvents.map((e) => {
  const timestamp = zonedTimeToUtc(e.date, e.time, e.timezone);
  const weekday = formatInZone(timestamp, e.timezone, { weekday: 'long' });
  const day = formatInZone(timestamp, e.timezone, { day: 'numeric', month: 'long', year: 'numeric' });
  return { ...e, ...presentation[e.id], timestamp, weekday, dateLabel: `${weekday}, ${day}` };
});

export const ceremonyById = (id: WeddingEventData['id']) => ceremonies.find((c) => c.id === id)!;
