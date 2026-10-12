import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ceremonyById } from '../../data/ceremonies';
import { COUNTDOWN_EVENT_ID } from '../../data/weddingEvents';
import { ART } from '../../lib/media';
import { remainingUntil, type Remaining } from '../../lib/time';
import { CornerFiligree, Divider } from '../Ornaments';
import { Reveal } from '../Reveal';

const pad = (n: number) => String(n).padStart(2, '0');

function useRemaining(target: number): Remaining | null {
  // Starts as null and fills in after mount, so a server-rendered build would never mismatch.
  const [r, setR] = useState<Remaining | null>(null);
  useEffect(() => {
    const update = () => setR(remainingUntil(target));
    update();
    // Align ticks to the wall-clock second.
    let id = 0;
    const timeout = window.setTimeout(() => {
      update();
      id = window.setInterval(update, 1000);
    }, 1000 - (Date.now() % 1000));
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(id);
    };
  }, [target]);
  return r;
}

export function Countdown() {
  const event = ceremonyById(COUNTDOWN_EVENT_ID);
  const r = useRemaining(event.timestamp);
  const reduce = useReducedMotion();
  const units: [string, number | undefined][] = [
    ['Days', r?.days],
    ['Hours', r?.hours],
    ['Minutes', r?.minutes],
    ['Seconds', r?.seconds],
  ];
  const sway = reduce ? undefined : { rotate: [0, 1.6, 0], transition: { duration: 7, repeat: Infinity, ease: 'easeInOut' as const } };

  return (
    <section id="countdown" className="parchment-section countdown" aria-labelledby="countdown-title">
      <Reveal style={{ textAlign: 'center', marginBottom: 28 }}>
        <span className="chapter-label">Chapter IV</span>
      </Reveal>
      <div style={{ position: 'relative', maxWidth: 880, margin: '0 auto' }}>
        <motion.img
          className="countdown-branch"
          src={ART.branchLeft}
          alt=""
          aria-hidden="true"
          loading="lazy"
          style={{ left: '-9%', top: '-12%', width: 'clamp(120px, 28vw, 260px)', transformOrigin: '0 0' }}
          animate={sway}
        />
        <motion.img
          className="countdown-branch"
          src={ART.branchRight}
          alt=""
          aria-hidden="true"
          loading="lazy"
          style={{ right: '-7%', top: '-10%', width: 'clamp(90px, 20vw, 190px)', transformOrigin: '100% 0' }}
          animate={reduce ? undefined : { rotate: [0, -1.8, 0], transition: { duration: 8, repeat: Infinity, ease: 'easeInOut' } }}
        />
        <div className="parchment countdown-card" style={{ '--parchment-img': `url(${ART.parchment})` } as React.CSSProperties}>
          <CornerFiligree className="tl" />
          <CornerFiligree className="tr" />
          <CornerFiligree className="bl" />
          <CornerFiligree className="br" />
          <p className="eyebrow" style={{ color: '#8a5a2a' }}>
            Countdown
          </p>
          <h2 id="countdown-title">
            Until we say <span className="script">forever</span>
          </h2>
          <p className="countdown-when">
            {event.title} · {event.dateLabel} · {event.displayTime} IST
          </p>
          {r?.done ? (
            <p className="countdown-done">The celebrations have begun — thank you for being part of our forever.</p>
          ) : (
            <ul className="countdown-grid" aria-label="Time remaining until the wedding">
              {units.map(([label, value]) => (
                <li key={label} className="countdown-unit">
                  <span className="countdown-num">{value === undefined ? '--' : pad(value)}</span>
                  <span className="countdown-label">{label}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="sr-only" aria-live="off">
            {r && !r.done ? `${r.days} days, ${r.hours} hours and ${r.minutes} minutes to go.` : ''}
          </p>
          <Divider />
        </div>
      </div>
    </section>
  );
}
