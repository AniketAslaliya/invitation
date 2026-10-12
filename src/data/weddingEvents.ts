// Single source of truth for every ceremony date, time and title shown on the site.
// Edit these values only; weekdays, countdown and labels are derived from them.

export interface WeddingEventData {
  id: 'engagement' | 'mandap' | 'haldi' | 'garba' | 'wedding';
  title: string;
  date: string; // YYYY-MM-DD in the event's timezone
  time: string; // HH:mm (24h) in the event's timezone
  timezone: string; // IANA zone
  displayTime: string;
}

export const weddingEvents: WeddingEventData[] = [
  {
    id: 'engagement',
    title: 'Engagement',
    date: '2026-12-12',
    time: '08:00',
    timezone: 'Asia/Kolkata',
    displayTime: '8:00 AM',
  },
  {
    id: 'mandap',
    title: 'Mandap',
    date: '2026-12-12',
    time: '09:30',
    timezone: 'Asia/Kolkata',
    displayTime: '9:30 AM',
  },
  {
    id: 'haldi',
    title: 'Haldi Carnival',
    date: '2026-12-12',
    time: '16:00',
    timezone: 'Asia/Kolkata',
    displayTime: '4:00 PM',
  },
  {
    id: 'garba',
    title: 'Garba Night',
    date: '2026-12-12',
    time: '20:00',
    timezone: 'Asia/Kolkata',
    displayTime: '8:00 PM',
  },
  {
    id: 'wedding',
    title: 'The Wedding',
    date: '2026-12-13',
    time: '16:00',
    timezone: 'Asia/Kolkata',
    displayTime: '4:00 PM',
  },
];

// The countdown counts toward this event.
export const COUNTDOWN_EVENT_ID: WeddingEventData['id'] = 'wedding';
