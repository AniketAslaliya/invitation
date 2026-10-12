import { ceremonies } from '../../data/ceremonies';
import { scrollToTarget } from '../../lib/scroll';
import { Divider } from '../Ornaments';
import { Reveal } from '../Reveal';

/** Chapter V opening: the full programme at a glance, each row jumping to its scene. */
export function WeddingTimeline() {
  const days = Array.from(new Set(ceremonies.map((c) => c.dateLabel)));
  return (
    <section id="celebrations" className="celebrations-intro" aria-labelledby="celebrations-title">
      <Reveal>
        <span className="chapter-label">Chapter V</span>
      </Reveal>
      <Reveal as="h2" className="section-title" delay={0.08}>
        <span id="celebrations-title">
          The <span className="script">Celebrations</span>
        </span>
      </Reveal>
      <Reveal as="p" className="story-lede" delay={0.14}>
        Five moments, one royal celebration. Walk with us through each of them.
      </Reveal>
      <Divider />
      <div className="timeline">
        {days.map((day) => (
          <Reveal key={day}>
            <h3 className="timeline-day">{day}</h3>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {ceremonies
                .filter((c) => c.dateLabel === day)
                .map((c) => (
                  <li key={c.id}>
                    <a
                      href={`#event-${c.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToTarget(`#event-${c.id}`);
                      }}
                    >
                      <span className="num">{c.numeral}</span>
                      <span className="name">{c.title}</span>
                      <span className="time">{c.displayTime}</span>
                    </a>
                  </li>
                ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
