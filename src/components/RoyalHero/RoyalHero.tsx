import { motion } from 'framer-motion';
import { ChevronDown, RotateCcw } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import { siteConfig } from '../../data/siteConfig';
import { gsap, haptic, ScrollTrigger } from '../../lib/gsap';
import { ART, largest, srcSet } from '../../lib/media';
import { scrollToTarget } from '../../lib/scroll';
import { envelopeGeometry as G, heroLayers, plateLayout, PLATE_H, PLATE_W } from '../../scenes/heroScene';

/** Screens of scrolling the hero stays pinned while the envelope opens. */
export const HERO_HOLD = 1;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const seg = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
const pc = (n: number) => `${n}%`;

type EnvelopeState = 'closed' | 'unsealed' | 'open';
type Box = { left: number; top: number; width: number; height: number };

/**
 * The envelope opening, built for smooth playback on any phone (design-parallax-scroll + gsap-performance):
 *  - Layout (sizes and positions) is measured once and again only on resize — never during the animation.
 *  - Every animated frame writes only `transform` and `opacity` (compositor-only, no layout or paint).
 *  - The envelope pieces live inside the picture, so they move with it for free (no per-frame syncing).
 *  - One timeline, 0 → 1: seal + flap (0–0.3) → card drawn out (0.28–0.6) → zoom into the open
 *    artwork (0.6–0.95). A tap plays it over time; a swipe scrubs it (ScrollTrigger, cached positions).
 *  - No mouse parallax on touch devices; ambient petals and branch sway are CSS animations.
 */
export function RoyalHero() {
  const rootRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const openRef = useRef<HTMLImageElement>(null);
  const spritesRef = useRef<HTMLDivElement>(null);
  const flapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLImageElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);
  const [state, setState] = useState<EnvelopeState>('closed');
  const [box, setBox] = useState<Box | null>(null);
  const [branches, setBranches] = useState<{ id: string; src: string; style: React.CSSProperties }[]>([]);

  // Shared between the effect and the tap handler.
  const ctl = useRef({ tap: 0, scroll: 0, render: (_p: number) => {}, reduced: false });

  useLayoutEffect(() => {
    const root = rootRef.current!;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    ctl.current.reduced = reduced;
    // Geometry cached per layout pass; read only on resize.
    let geo = { a1x: 0, a1y: 0, a2x: 0, a2y: 0, cx: 0, cy: 0 };
    let cardTravel = 0; // px the card moves (as translateY) from inside the envelope to fully out
    let last = -1;

    const measure = () => {
      const W = root.clientWidth;
      const H = root.clientHeight;
      const base = plateLayout(W, H);
      const pw = base.w;
      const ph = (pw * PLATE_H) / PLATE_W;
      const left = W / 2 + base.x - pw / 2;
      const top = H / 2 + base.y - ph / 2;
      setBox({ left, top, width: pw, height: ph });
      // Hinge points of the closed and open artworks, relative to the plate's centre.
      const at = ([u, v]: [number, number]) => [(u / PLATE_W - 0.5) * pw, (v / PLATE_H - 0.5) * ph] as const;
      const [a1x, a1y] = at(G.hinge1);
      const [a2x, a2y] = at(G.hinge2);
      geo = { a1x, a1y, a2x, a2y, cx: 0, cy: 0 };
      cardTravel = ((G.card.topFinal - G.card.topStart) / 100) * ph;
      setBranches(
        heroLayers
          .filter((l) => l.id.startsWith('branch'))
          .map((l) => {
            const L = l.layout(W, H);
            const w = L.w;
            const h = w / l.aspect;
            return {
              id: l.id,
              src: l.src as string,
              style: { left: W / 2 + L.x - w / 2, top: H / 2 + L.y - h / 2, width: w, height: h },
            };
          }),
      );
      last = -1;
    };

    const render = (p: number) => {
      if (p === last) return;
      last = p;
      const { a1x, a1y, a2x, a2y } = geo;
      const s = G.openScale;
      const q = reduced ? 0 : easeInOut(seg(p, 0.6, 0.95));
      const m = s + (1 - s) * q; // scale of the open artwork
      const k = m / s; // scale of the closed artwork (and the envelope pieces inside it)
      const ex = (1 - q) * (a1x - a2x);
      const ey = (1 - q) * (a1y - a2y);
      // Positions relative to the plate centre; scale is about the centre (transform-origin 50% 50%).
      const closedX = a2x + ex - k * a1x;
      const closedY = a2y + ey - k * a1y;
      const openX = a2x + ex - m * a2x;
      const openY = a2y + ey - m * a2y;
      const fade = reduced ? seg(p, 0.2, 0.7) : easeInOut(seg(p, 0.7, 0.78));

      const scene = sceneRef.current;
      const open = openRef.current;
      if (scene) {
        scene.style.transform = reduced ? 'none' : `translate3d(${closedX}px, ${closedY}px, 0) scale(${k})`;
        scene.style.opacity = String(reduced ? 1 - fade : 1 - seg(p, 0.78, 0.82));
      }
      if (open) {
        open.style.transform = reduced ? 'none' : `translate3d(${openX}px, ${openY}px, 0) scale(${m})`;
        open.style.opacity = String(fade);
      }
      if (spritesRef.current) spritesRef.current.style.opacity = p === 0 || reduced ? '0' : '1';

      const angle = easeInOut(seg(seg(p, 0, 0.3), 0.15, 1)) * Math.PI;
      const flap = flapRef.current;
      if (flap) {
        // A 2D fold about the envelope's top edge: the flap shortens, passes the hinge and opens upward.
        const c = Math.cos(angle);
        flap.style.transform = `scaleY(${Math.sign(c || 1) * Math.max(0.02, Math.abs(c))})`;
        const side = c >= 0 ? 'front' : 'back';
        if (flap.dataset.side !== side) {
          flap.dataset.side = side;
          flap.style.zIndex = c >= 0 ? '4' : '1';
        }
      }
      if (cardRef.current) cardRef.current.style.transform = `translate3d(0, ${easeOut(seg(p, 0.28, 0.6)) * cardTravel}px, 0)`;
      if (glowRef.current) {
        const g = p === 0 ? 0 : Math.sin(seg(p, 0, 0.25) * Math.PI);
        glowRef.current.style.opacity = String(g);
        glowRef.current.style.transform = `scale(${1 + 0.06 * g})`;
      }
      if (titleRef.current) {
        const t = seg(p, 0, 0.12);
        titleRef.current.style.opacity = String(1 - t);
        titleRef.current.style.transform = `translate3d(0, ${-16 * t}px, 0)`;
      }
      if (hintRef.current) hintRef.current.style.opacity = String(1 - seg(p, 0.3, 0.42));

      setState((st) => {
        const next: EnvelopeState = p > 0.9 ? 'open' : p > 0 ? 'unsealed' : 'closed';
        return st === next ? st : next;
      });
    };

    const update = () => render(Math.max(ctl.current.tap, ctl.current.scroll));
    ctl.current.render = () => update();

    measure();
    // A swipe scrubs the same timeline. ScrollTrigger caches positions, so no layout is read per frame.
    const st = ScrollTrigger.create({
      trigger: root.closest('.hero-track') ?? root,
      start: 'top top',
      end: () => `+=${window.innerHeight * HERO_HOLD}`,
      onUpdate: (self) => {
        ctl.current.scroll = self.progress;
        update();
      },
      onRefresh: () => {
        measure();
        update();
      },
    });
    ctl.current.scroll = st.progress;
    update();
    return () => st.kill();
  }, []);

  // Re-apply the current frame once React has placed the measured layout.
  useLayoutEffect(() => {
    ctl.current.render(0);
  }, [box]);

  /** Rose petals burst out of the wax seal as it breaks. */
  const burstPetals = () => {
    const host = spritesRef.current?.parentElement;
    if (!host || ctl.current.reduced) return;
    const w = host.clientWidth;
    const cx = G.seal.left + G.seal.width / 2;
    const cy = G.seal.top + G.seal.height / 2;
    for (let n = 0; n < 12; n++) {
      const img = document.createElement('img');
      img.src = ART.petals[n % ART.petals.length];
      img.alt = '';
      img.className = 'burst-petal';
      img.style.left = `${cx}%`;
      img.style.top = `${cy}%`;
      img.style.width = `${w * (0.035 + Math.random() * 0.035)}px`;
      host.appendChild(img);
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.5;
      const dist = w * (0.18 + Math.random() * 0.32);
      gsap
        .timeline({ onComplete: () => img.remove() })
        .fromTo(
          img,
          { xPercent: -50, yPercent: -50, scale: 0.2, opacity: 1, rotation: Math.random() * 360, force3D: true },
          { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, scale: 1, rotation: `+=${(Math.random() - 0.5) * 540}`, duration: 1, ease: 'power3.out' },
        )
        .to(img, { y: `+=${w * 0.25}`, opacity: 0, duration: 1.1, ease: 'power1.in' }, '>-0.15');
    }
  };

  const open = () => {
    if (state !== 'closed') return;
    haptic([10, 40, 18]);
    burstPetals();
    const c = ctl.current;
    gsap.to(c, {
      tap: 1,
      duration: c.reduced ? 0.4 : 3.6,
      ease: 'none',
      onUpdate: () => c.render(0),
      // The picture is already fully open, so settle the page on the open stop instantly.
      onComplete: () => scrollToTarget(window.innerHeight * HERO_HOLD, { instant: true }),
    });
  };
  const reset = () => {
    gsap.killTweensOf(ctl.current);
    ctl.current.tap = 0;
    scrollToTarget(0, { instant: true });
    ctl.current.render(0);
  };

  const { bride, groom } = siteConfig.couple;
  const plateStyle: React.CSSProperties | undefined = box ?? undefined;

  return (
    <div ref={rootRef} className="hero">
      {/* Open-envelope artwork, revealed at the end of the zoom. */}
      <img
        ref={openRef}
        className="hero-plate hero-open"
        style={{ ...plateStyle, opacity: 0 }}
        src={largest(ART.plateOpen)}
        srcSet={srcSet(ART.plateOpen)}
        sizes="(min-width: 480px) 600px, 125vw"
        alt=""
        decoding="async"
      />
      {/* Closed-envelope artwork with the animated envelope pieces inside it. */}
      <div ref={sceneRef} className="hero-plate hero-scene" style={plateStyle}>
        <img
          className="hero-scene-img"
          src={largest(ART.plateClosed)}
          srcSet={srcSet(ART.plateClosed)}
          sizes="(min-width: 480px) 600px, 125vw"
          alt=""
          {...{ fetchpriority: 'high' }}
        />
        <div ref={spritesRef} className="env-sprites" style={{ opacity: 0 }}>
          <img
            className="env-abs env-liner"
            src={ART.envelope.liner}
            alt=""
            style={{ left: pc(G.flap.left), top: pc(G.flap.top), width: pc(G.flap.width), height: pc(G.flap.height) }}
          />
          <div className="env-card-clip" style={{ clipPath: G.clip, WebkitClipPath: G.clip, zIndex: 2 }}>
            <img
              ref={cardRef}
              className="env-abs env-card"
              src={ART.envelope.card}
              alt=""
              style={{ left: pc(G.card.left), top: pc(G.card.topStart), width: pc(G.card.width), height: pc(G.card.height) }}
            />
          </div>
          <div ref={flapRef} className="env-flap" style={{ left: pc(G.flap.left), top: pc(G.flap.top), width: pc(G.flap.width), height: pc(G.flap.height) }}>
            <img className="front" src={ART.envelope.flap} alt="" />
            <img className="back" src={ART.envelope.liner} alt="" />
          </div>
          <img
            className="env-abs env-seal"
            src={ART.envelope.seal}
            alt=""
            style={{ left: pc(G.seal.left), top: pc(G.seal.top), width: pc(G.seal.width), height: pc(G.seal.height), zIndex: 5 }}
          />
        </div>
        <div
          ref={glowRef}
          className="env-seal-glow"
          style={{ left: pc(G.seal.left + 0.4), top: pc(G.seal.top + 0.25), width: pc(G.seal.width - 0.8), height: pc(G.seal.height - 0.45), opacity: 0 }}
        />
        {state === 'closed' && (
          <>
            <div
              className="env-seal-glow seal-pulse"
              aria-hidden="true"
              style={{ left: pc(G.seal.left + 0.4), top: pc(G.seal.top + 0.25), width: pc(G.seal.width - 0.8), height: pc(G.seal.height - 0.45) }}
            />
            <button
              type="button"
              className="env-tap"
              onClick={open}
              aria-label="Open the invitation envelope"
              style={{ left: pc(G.body.left), top: pc(G.body.top), width: pc(G.body.width), height: pc(G.body.height) }}
            />
          </>
        )}
      </div>

      {/* Foreground: flowering branches (gentle CSS sway) and a few drifting petals (CSS, compositor-only). */}
      {branches.map((b) => (
        <img key={b.id} className={`hero-branch ${b.id}`} src={b.src} alt="" aria-hidden="true" style={b.style} />
      ))}
      <div className="amb-petals" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <img key={i} className={`amb-petal p${i}`} src={ART.petals[(i * 3) % ART.petals.length]} alt="" />
        ))}
      </div>
      <div className="hero-veil" />

      <div ref={titleRef} className="hero-title" aria-hidden={state !== 'closed'}>
        <p className="eyebrow">An Invitation to Celebrate Love</p>
        <h1 className="hero-names">
          {bride.toUpperCase()} <span className="amp">&amp;</span> {groom.toUpperCase()}
        </h1>
        <p className="hero-tag">Two hearts. One beautiful forever.</p>
      </div>

      <div className="hero-actions">
        {state === 'closed' && (
          <button type="button" className="btn-quiet hero-hint" onClick={open}>
            Tap the envelope to open
          </button>
        )}
        {state === 'unsealed' && (
          <p ref={hintRef} className="hero-hint scroll-hint">
            Swipe up to draw out the card
            <span className="hint-bob" aria-hidden="true">
              <ChevronDown size={16} />
            </span>
          </p>
        )}
        <motion.button
          type="button"
          className="btn-royal"
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          onClick={() => {
            haptic();
            scrollToTarget('#invitation');
          }}
        >
          Enter the Invitation <ChevronDown aria-hidden="true" />
        </motion.button>
        {state === 'open' && (
          <button type="button" className="btn-quiet" onClick={reset} style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            <RotateCcw size={13} aria-hidden="true" /> Seal it again
          </button>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {state === 'open' ? `The envelope is open: ${bride} weds ${groom}.` : ''}
      </p>
    </div>
  );
}
