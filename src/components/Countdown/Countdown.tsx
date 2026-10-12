import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { ceremonyById } from '../../data/ceremonies';
import { COUNTDOWN_EVENT_ID } from '../../data/weddingEvents';
import { gsap, REDUCED } from '../../lib/gsap';
import { ART } from '../../lib/media';
import { remainingUntil, type Remaining } from '../../lib/time';
import { Divider } from '../Ornaments';
import { Reveal } from '../Reveal';

const pad = (n: number) => String(n).padStart(2, '0');

/** A number that flips down like a station clock each time it changes. */
function FlipNumber({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const el = ref.current;
    if (!el || window.matchMedia(REDUCED).matches) return;
    const tween = gsap.fromTo(
      el,
      { rotationX: -90, opacity: 0.2, transformPerspective: 320, transformOrigin: '50% 0%' },
      { rotationX: 0, opacity: 1, duration: 0.55, ease: 'back.out(1.7)' },
    );
    return () => {
      tween.kill();
    };
  }, [value]);
  return (
    <span ref={ref} className="countdown-num">
      {value}
    </span>
  );
}

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
    <div className="paper countdown" style={{ '--parchment-img': `url(${ART.parchment})` } as React.CSSProperties}>
      <motion.img className="corner-branch left" src={ART.branchLeft} alt="" aria-hidden="true" animate={sway} />
      <motion.img
        className="corner-branch right"
        src={ART.branchRight}
        alt=""
        aria-hidden="true"
        animate={reduce ? undefined : { rotate: [0, -1.8, 0], transition: { duration: 8, repeat: Infinity, ease: 'easeInOut' } }}
      />
      <div className="paper-content">
        <Reveal>
          <p className="eyebrow paper-eyebrow">Countdown</p>
          <h2 className="paper-title">
            Until we say <span className="script">forever</span>
          </h2>
          <p className="countdown-when">
            {event.title} · {event.dateLabel} · {event.displayTime} IST
          </p>
        </Reveal>
        {r?.done ? (
          <p className="countdown-done">The celebrations have begun — thank you for being part of our forever.</p>
        ) : (
          <Reveal as="ul" className="countdown-grid" delay={0.1} aria-label="Time remaining until the wedding">
            {units.map(([label, value]) => (
              <li key={label} className="countdown-unit">
                <FlipNumber value={value === undefined ? '--' : pad(value)} />
                <span className="countdown-label">{label}</span>
              </li>
            ))}
          </Reveal>
        )}
        <Divider />
      </div>
    </div>
  );
}
