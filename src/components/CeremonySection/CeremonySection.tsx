import { motion, useReducedMotion } from 'framer-motion';
import { useCallback, useRef } from 'react';
import type { Ceremony } from '../../data/ceremonies';
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from '../../lib/gsap';
import { ART, srcSet } from '../../lib/media';
import { ParallaxStage, type StageApi } from '../../parallax/ParallaxStage';
import { ceremonyScene } from '../../scenes/ceremonyScenes';

/** Where the flame sits inside each light-giving layer (fractions of the layer's box). */
const LIGHTS: Record<string, { x: number; y: number; size: number; strip?: boolean }> = {
  'lantern-a': { x: 0.5, y: 0.66, size: 1.9 },
  'lantern-b': { x: 0.5, y: 0.66, size: 1.9 },
  diyas: { x: 0.5, y: 0.6, size: 1, strip: true },
};

/**
 * One ceremony = one phone screen: the original invitation artwork, as large as the screen allows,
 * inside its own palace setting. The artwork already carries the title, date and time.
 */
export function CeremonySection({ ceremony: c }: { ceremony: Ceremony }) {
  const reduce = useReducedMotion();
  const scene = ceremonyScene(c.id, 0);
  const art = ART.event(c.id);
  const rootRef = useRef<HTMLDivElement>(null);
  const figRef = useRef<HTMLElement>(null);
  const glowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const intensity = useRef(0);
  const lights = [...scene.back, ...scene.front].map((l) => l.id).filter((id) => id in LIGHTS);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        // A band of gold light sweeps across the invitation each time it arrives.
        gsap.fromTo(
          '.shimmer-band',
          { xPercent: -170 },
          {
            xPercent: 170,
            duration: 1.7,
            ease: 'power2.inOut',
            scrollTrigger: { trigger: figRef.current, start: 'top 72%', toggleActions: 'play none none reset' },
          },
        );
      });
      // Lantern / diya glow peaks while the scene is centred on screen.
      ScrollTrigger.create({
        trigger: rootRef.current,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          intensity.current = Math.sin(self.progress * Math.PI);
        },
      });
    },
    { scope: rootRef },
  );

  // Runs inside the stage's single animation loop: place each glow on its flame and flicker it.
  const onFrame = useCallback(
    (api: StageApi) => {
      const t = performance.now() / 1000;
      for (const id of lights) {
        const el = glowRefs.current[id];
        const r = api.rectOf(id);
        if (!el) continue;
        if (!r) {
          el.style.opacity = '0';
          continue;
        }
        const L = LIGHTS[id];
        const w = L.strip ? r.width : r.width * L.size;
        const h = L.strip ? r.height * 1.4 : w;
        el.style.width = `${w}px`;
        el.style.height = `${h}px`;
        el.style.transform = `translate3d(${r.left + r.width * L.x - w / 2}px, ${r.top + r.height * L.y - h / 2}px, 0)`;
        // Layered sines read as a living flame without random jumps.
        const flicker = reduce ? 1 : 0.82 + 0.1 * Math.sin(t * 7.3 + w) + 0.08 * Math.sin(t * 13.1 + h);
        el.style.opacity = String((0.35 + 0.65 * intensity.current) * flicker);
      }
    },
    [lights, reduce],
  );

  return (
    <div ref={rootRef} className="ceremony" style={{ '--deep': c.theme.deep } as React.CSSProperties}>
      <ParallaxStage back={scene.back} front={scene.front} particles={scene.particles} camera={0} onFrame={lights.length ? onFrame : undefined}>
        {lights.map((id) => (
          <div
            key={id}
            ref={(el) => {
              glowRefs.current[id] = el;
            }}
            className={`flame-glow ${LIGHTS[id].strip ? 'strip' : ''}`}
            aria-hidden="true"
          />
        ))}
        <motion.figure
          ref={figRef}
          className="ceremony-art"
          initial={reduce ? false : { opacity: 0, scale: 0.9, y: 40 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: false, amount: 0.45 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <img src={art[1080]} srcSet={srcSet(art)} sizes="min(96vw, 470px)" alt={c.artAlt} width={1080} height={1080} loading="lazy" decoding="async" />
          <span className="shimmer" aria-hidden="true">
            <span className="shimmer-band" />
          </span>
          <figcaption className="sr-only">
            {c.title}: {c.dateLabel}, {c.displayTime}
          </figcaption>
        </motion.figure>
      </ParallaxStage>
    </div>
  );
}
