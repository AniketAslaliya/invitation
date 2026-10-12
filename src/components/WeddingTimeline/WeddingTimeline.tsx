import { ceremonies } from '../../data/ceremonies';
import { haptic } from '../../lib/gsap';
import { scrollToTarget } from '../../lib/scroll';
import { Divider } from '../Ornaments';
import { Reveal } from '../Reveal';

/** The full programme at a glance; each row jumps to its ceremony screen. */
export function WeddingTimeline() {
  const days = Array.from(new Set(ceremonies.map((c) => c.dateLabel)));
  return (
    <div className="timeline-screen">
      <Reveal as="h2" className="section-title">
        The <span className="script">Celebrations</span>
      </Reveal>
      <Divider />
      <div className="timeline">
        {days.map((day) => (
          <Reveal key={day}>
            <h3 className="timeline-day">{day}</h3>
            <ul>
              {ceremonies
                .filter((c) => c.dateLabel === day)
                .map((c) => (
                  <li key={c.id}>
                    <a
                      href={`#event-${c.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        haptic();
                        scrollToTarget(`#event-${c.id}`);
                      }}
                    >
                      <span className="name">{c.title}</span>
                      <span className="time">{c.displayTime}</span>
                    </a>
                  </li>
                ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
