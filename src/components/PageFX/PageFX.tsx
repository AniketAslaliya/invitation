import { useRef } from 'react';
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from '../../lib/gsap';
import { ART } from '../../lib/media';

export type FXKind = 'fall' | 'shower' | 'splash' | 'orbit';

interface Props {
  kind: FXKind;
  /** Petal images to use. */
  textures: string[];
  count?: number;
  /** Size range in % of the artwork width. */
  size?: [number, number];
  /** Where petals originate, in % of the artwork (falls start along the top by default). */
  origin?: { x: number; y: number };
}

const rand = gsap.utils.random;

/**
 * Light decorative motion layered over a page's artwork, chosen per event. Every loop is a GSAP
 * tween on transform/opacity only, and the whole set is paused whenever its page is off-screen
 * (gsap-performance: pause off-screen work), so at most one page animates at a time.
 */
export function PageFX({ kind, textures, count = 8, size = [4, 7], origin = { x: 50, y: 45 } }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = ref.current!;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const W = root.offsetWidth;
        const H = root.offsetHeight;
        const petals = gsap.utils.toArray<HTMLElement>('.fx-petal', root);
        const loops: gsap.core.Animation[] = [];

        // A petal falling the full height of the artwork, swaying as it goes, forever.
        const fall = (el: HTMLElement, delay: number) => {
          gsap.set(el, { left: `${rand(4, 92)}%`, top: '-6%', autoAlpha: 1 });
          const tl = gsap.timeline({ repeat: -1, delay });
          tl.fromTo(el, { y: 0, rotation: rand(0, 360) }, { y: H * 1.1, rotation: `+=${rand(180, 420)}`, duration: rand(7, 11), ease: 'none' }, 0);
          tl.fromTo(el, { x: -rand(10, 30) }, { x: rand(10, 30), duration: rand(1.6, 2.6), ease: 'sine.inOut', repeat: 5, yoyo: true }, 0);
          loops.push(tl);
        };

        if (kind === 'fall') {
          petals.forEach((el, i) => fall(el, (i / petals.length) * 8));
        }

        if (kind === 'shower') {
          // Phoolon ki baarish: a dense shower as the page arrives, settling into a gentle fall.
          petals.forEach((el, i) => fall(el, rand(0, 1.4) + (i % 3) * 2.5));
        }

        if (kind === 'splash') {
          // "A splash of joy": turmeric-yellow powder bursts out from the centre, then marigolds fall.
          const dots = gsap.utils.toArray<HTMLElement>('.fx-dust', root);
          const burst = gsap.timeline({ paused: true });
          dots.forEach((d) => {
            // Thrown upward out of the haldi pot: angles across the upper half only.
            const a = rand(-Math.PI * 0.95, -Math.PI * 0.05);
            const r = rand(0.1, 0.38) * W;
            const dur = rand(1.4, 2.1);
            burst
              .fromTo(
                d,
                { left: `${origin.x}%`, top: `${origin.y}%`, x: 0, y: 0, scale: 0.3, autoAlpha: 1 },
                { x: Math.cos(a) * r, y: Math.sin(a) * r * 0.8, scale: rand(1, 1.8), duration: dur, ease: 'power3.out' },
                0,
              )
              // Powder hangs in the air, then drifts down and fades.
              .to(d, { y: `+=${H * 0.06}`, autoAlpha: 0, duration: 1.2, ease: 'power1.in' }, dur * 0.65);
          });
          ScrollTrigger.create({ trigger: root, start: 'top 65%', onEnter: () => burst.restart(), onEnterBack: () => burst.restart() });
          petals.forEach((el, i) => fall(el, 0.9 + (i / petals.length) * 7));
        }

        if (kind === 'orbit') {
          // Garba: petals dance in a circle above the rangoli, rising and dipping to the beat.
          const n = petals.length;
          const cx = (origin.x / 100) * W;
          const cy = (origin.y / 100) * H;
          const rx = W * 0.3;
          const ry = H * 0.045;
          gsap.set(petals, { left: 0, top: 0, autoAlpha: 1 });
          const spin = { a: 0 };
          loops.push(
            gsap.to(spin, {
              a: Math.PI * 2,
              duration: 10,
              ease: 'none',
              repeat: -1,
              onUpdate: () => {
                petals.forEach((el, i) => {
                  const t = spin.a + (i / n) * Math.PI * 2;
                  const depth = (Math.sin(t) + 1) / 2; // front of the circle = 1
                  gsap.set(el, {
                    x: cx + Math.cos(t) * rx,
                    y: cy + Math.sin(t) * ry - Math.abs(Math.sin(t * 2)) * H * 0.02,
                    scale: 0.7 + depth * 0.5,
                    autoAlpha: 0.55 + depth * 0.45,
                    rotation: (t * 180) / Math.PI,
                  });
                });
              },
            }),
          );
        }

        // Only animate while the page is on screen.
        ScrollTrigger.create({
          trigger: root,
          start: 'top bottom',
          end: 'bottom top',
          onToggle: (self) => loops.forEach((l) => (self.isActive ? l.play() : l.pause())),
        });
        if (!ScrollTrigger.isInViewport(root)) loops.forEach((l) => l.pause());
      });
    },
    { scope: ref },
  );

  const dust = kind === 'splash' ? 24 : 0;
  return (
    <div ref={ref} className="page-fx" aria-hidden="true">
      {Array.from({ length: dust }, (_, i) => (
        <span key={`d${i}`} className={`fx-dust c${i % 3}`} />
      ))}
      {Array.from({ length: count }, (_, i) => (
        <img
          key={i}
          className="fx-petal"
          src={textures[i % textures.length]}
          alt=""
          style={{ width: `${size[0] + ((i * 37) % 10) / 10 * (size[1] - size[0])}%` }}
        />
      ))}
    </div>
  );
}

/** Petal sets matched to each page's artwork. */
export const FX_PRESETS: Record<string, Props> = {
  story: { kind: 'fall', textures: ART.petals, count: 6, size: [3.5, 6] },
  engagement: { kind: 'fall', textures: [ART.ornament('petal-marigold.svg')], count: 9, size: [2.6, 4.2] },
  mandap: { kind: 'fall', textures: [...ART.petals.slice(0, 3), ART.ornament('petal-jasmine.svg')], count: 9, size: [3, 5.5] },
  haldi: { kind: 'splash', textures: [ART.ornament('petal-marigold.svg')], count: 8, size: [2.6, 4.2], origin: { x: 50, y: 85 } },
  garba: { kind: 'orbit', textures: [ART.ornament('petal-marigold.svg'), ...ART.petals.slice(0, 2)], count: 10, size: [4.2, 6.2], origin: { x: 50, y: 83 } },
  wedding: { kind: 'shower', textures: ART.petals, count: 12, size: [3.5, 6.5] },
  closing: { kind: 'fall', textures: ART.petals, count: 5, size: [4, 6.5] },
};
