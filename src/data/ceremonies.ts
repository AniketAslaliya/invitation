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
      "Engagement invitation — A promise for forever. A beautiful beginning to a shared journey. 12 December 2026, 08:00 AM onwards, Lion Valley Resort. A sunlit garden mandap hung with marigold garlands.",
  },
  mandap: {
    numeral: 'II',
    heading: 'Mandap',
    tagline: 'An auspicious beginning, blessed with love and tradition.',
    theme: { deep: '#0b2a1d', mid: '#123D2B', accent: '#E9C889', ink: '#FFF1D5' },
    artAlt:
      "Mandap invitation — With cherished rituals and the blessings of loved ones, we celebrate the sacred union marking the new beginning. 12 December 2026, 09:30 AM onwards, Lion Valley Resort. A garden with pink drapes, flowers and a parasol.",
  },
  haldi: {
    numeral: 'III',
    heading: 'Haldi Carnival',
    tagline: 'A little sunshine, a lot of laughter, and a celebration of love.',
    theme: { deep: '#6a3306', mid: '#a2560c', accent: '#FFE2A2', ink: '#FFF6E3' },
    artAlt:
      "Haldi Carnival invitation — A splash of joy. A vibrant celebration of colours, laughter and new beginnings. 12 December 2026, 4:00 PM onwards, Lion Valley Resort. Yellow drapes, banana trees and bowls of turmeric and flowers.",
  },
  garba: {
    numeral: 'IV',
    heading: 'Garba Night',
    tagline: 'An evening of rhythm, tradition, and unforgettable memories.',
    theme: { deep: '#051326', mid: '#071B31', accent: '#E9C889', ink: '#FFF1D5' },
    artAlt:
      "Garba Night invitation — A night of rhythm and joy. Let's come together for an evening of music, dance and vibrant celebrations. 12 December 2026, 08:00 PM onwards, Lion Valley Resort. A palace courtyard with red drapes, brass lanterns and dandiya sticks.",
  },
  wedding: {
    numeral: 'V',
    heading: 'The Wedding',
    tagline: 'Two souls, one sacred promise, and a lifetime of togetherness.',
    theme: { deep: '#2c0510', mid: '#430918', accent: '#E9C889', ink: '#FFF1D5' },
    artAlt:
      "The Wedding Day invitation — Sunday 13 December 2026 at 4:00 PM. A floral mandap by the sea under palm trees at sunset, with a chandelier above.",
  },
};

export const ceremonies: Ceremony[] = weddingEvents.map((e) => {
  const timestamp = zonedTimeToUtc(e.date, e.time, e.timezone);
  const weekday = formatInZone(timestamp, e.timezone, { weekday: 'long' });
  const day = formatInZone(timestamp, e.timezone, { day: 'numeric', month: 'long', year: 'numeric' });
  return { ...e, ...presentation[e.id], timestamp, weekday, dateLabel: `${weekday}, ${day}` };
});

export const ceremonyById = (id: WeddingEventData['id']) => ceremonies.find((c) => c.id === id)!;
