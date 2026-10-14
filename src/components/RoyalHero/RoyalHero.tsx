import { animate, motion, useMotionValue, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import { ChevronDown, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { siteConfig } from '../../data/siteConfig';
import { useCaps } from '../../lib/capabilities';
import { ART } from '../../lib/media';
import { scrollToTarget } from '../../lib/scroll';
import { gsap, haptic } from '../../lib/gsap';
import { ParallaxStage, type StageApi } from '../../parallax/ParallaxStage';
import type { LayerAnim } from '../../parallax/types';
import { envelopeGeometry as G, heroLayers, petals, plateLayout, PLATE_H, PLATE_W } from '../../scenes/heroScene';

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const seg = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));

/** Screens of scrolling the hero stays pinned while the envelope opens. */
export const HERO_HOLD = 1;

type EnvelopeState = 'closed' | 'unsealed' | 'open';

/**
 * Two-part opening:
 *  1. Tap the envelope → the seal glows and the flap folds open (a short animation).
 *  2. Scroll → the card is drawn out of the envelope, then the view moves in to the open invitation.
 * The hero is a tall section with a pinned (sticky) stage, so scrolling scrubs the reveal.
 * Scrolling without tapping also opens the flap first, so nobody gets stuck.
 */
export function RoyalHero() {
  const { mode } = useCaps();
  const reduced = mode === 'static';
  const stickyRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const spritesRef = useRef<HTMLDivElement>(null);
  const flapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLImageElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<StageApi | null>(null);
  const anims = useRef<Record<string, LayerAnim>>({
    'plate-closed': { dx: 0, dy: 0, scale: 1, opacity: 1 },
    'plate-open': { dx: 0, dy: 0, scale: 1, opacity: 0 },
  });
  const [state, setState] = useState<EnvelopeState>('closed');

  // One opening timeline, 0 → 1: seal + flap (0–0.3) → card drawn out (0.28–0.6) → gentle zoom into
  // the open-envelope artwork (0.6–0.95). It is driven by whichever is further along: a tap (played
  // smoothly over time) or a swipe (the scroll glide to the next stop). Because both drive the same
  // timeline, the card only ever comes out once — no jump, no second card.
  const tap = useMotionValue(0);
  const { scrollY } = useScroll();
  const scroll = useTransform(scrollY, (y) => clamp01(y / (HERO_HOLD * window.innerHeight)));
  const progress = useTransform([tap, scroll], ([t, s]: number[]) => Math.max(t, s));

  // The title steps aside as the envelope opens, so the names never appear twice.
  const titleOpacity = useTransform(progress, [0, 0.12], [1, 0]);
  const titleY = useTransform(progress, [0, 0.12], [0, -16]);
  const scrollHintOpacity = useTransform(progress, [0.3, 0.42], [1, 0]);

  const apply = useCallback(() => {
    const box = stickyRef.current;
    if (!box) return;
    const p = progress.get();
    const W = box.clientWidth;
    const H = box.clientHeight;
    const base = plateLayout(W, H);
    const pw = base.w;
    const ph = (pw * PLATE_H) / PLATE_W;
    const at = ([u, w]: [number, number]) => [base.x + (u / PLATE_W - 0.5) * pw, base.y + (w / PLATE_H - 0.5) * ph] as const;
    const [a1x, a1y] = at(G.hinge1);
    const [a2x, a2y] = at(G.hinge2);
    const s = G.openScale;

    const flapT = seg(p, 0, 0.3);
    const cardT = easeOut(seg(p, 0.28, 0.6));
    // The view moves in until it exactly matches the open-envelope artwork, which then takes over.
    const q = reduced ? 0 : easeInOut(seg(p, 0.6, 0.95));
    const m = s + (1 - s) * q;
    const ex = (1 - q) * (a1x - a2x);
    const ey = (1 - q) * (a1y - a2y);
    const k = m / s;
    // A quick dissolve (~0.3 s on tap): the two artworks place the seal slightly differently, so a
    // long blend would show two seals.
    const fade = reduced ? seg(p, 0.2, 0.7) : easeInOut(seg(p, 0.7, 0.78));
    anims.current['plate-open'] = reduced
      ? { dx: 0, dy: 0, scale: 1, opacity: fade }
      : { dx: a2x + m * (base.x - a2x) + ex - base.x, dy: a2y + m * (base.y - a2y) + ey - base.y, scale: m, opacity: fade };
    anims.current['plate-closed'] = reduced
      ? { dx: 0, dy: 0, scale: 1, opacity: 1 - fade }
      : { dx: a2x + ex + k * (base.x - a1x) - base.x, dy: a2y + ey + k * (base.y - a1y) - base.y, scale: k, opacity: 1 - seg(p, 0.78, 0.82) };

    const sprites = spritesRef.current;
    if (sprites) sprites.style.opacity = reduced || p === 0 ? '0' : String(1 - fade);
    const angle = easeInOut(seg(flapT, 0.15, 1)) * 180;
    if (flapRef.current) {
      // A 2D fold about the envelope's top edge (identical on iOS and Android): the flap shortens,
      // passes the hinge, and opens out upward showing its maroon lining — tip pointing up.
      const c = Math.cos((angle * Math.PI) / 180);
      const fold = Math.sign(c || 1) * Math.max(0.02, Math.abs(c));
      flapRef.current.style.transform = `scaleY(${fold})`;
      flapRef.current.dataset.side = c >= 0 ? 'front' : 'back';
      flapRef.current.style.zIndex = c >= 0 ? '4' : '1';
    }
    if (cardRef.current) {
      cardRef.current.style.top = `${G.card.topStart + (G.card.topFinal - G.card.topStart) * cardT}%`;
    }
    if (glowRef.current) {
      const g = p === 0 ? 0 : Math.sin(seg(p, 0, 0.25) * Math.PI);
      glowRef.current.style.opacity = String(g);
      glowRef.current.style.transform = `scale(${1 + 0.06 * g})`;
    }
    if (reduced) apiRef.current?.invalidate();
  }, [progress, reduced]);

  useEffect(() => {
    apply();
    const off = progress.on('change', apply);
    window.addEventListener('resize', apply);
    return () => {
      off();
      window.removeEventListener('resize', apply);
    };
  }, [apply, progress]);

  useMotionValueEvent(progress, 'change', (v) => {
    setState(v > 0.9 ? 'open' : v > 0 ? 'unsealed' : 'closed');
  });

  const onFrame = useCallback((api: StageApi) => {
    const el = overlayRef.current;
    const r = api.rectOf('plate-closed');
    if (!el) return;
    if (!r) {
      el.style.visibility = 'hidden';
      return;
    }
    el.style.visibility = 'visible';
    el.style.width = `${r.width}px`;
    el.style.height = `${r.height}px`;
    el.style.transform = `translate3d(${r.left}px, ${r.top}px, 0)`;
  }, []);

  /** Rose petals burst out of the wax seal as it breaks (GSAP, removed when done). */
  const burstPetals = () => {
    const host = overlayRef.current;
    if (!host || reduced) return;
    const w = host.offsetWidth;
    const cx = G.seal.left + G.seal.width / 2;
    const cy = G.seal.top + G.seal.height / 2;
    for (let n = 0; n < 16; n++) {
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
        .fromTo(img, { xPercent: -50, yPercent: -50, scale: 0.2, opacity: 1, rotation: Math.random() * 360 }, {
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          scale: 1,
          rotation: `+=${(Math.random() - 0.5) * 540}`,
          duration: 0.9 + Math.random() * 0.4,
          ease: 'power3.out',
        })
        .to(img, { y: `+=${w * 0.25}`, opacity: 0, duration: 1.1, ease: 'power1.in' }, '>-0.15');
    }
  };

  const open = () => {
    if (state !== 'closed') return;
    setState('unsealed');
    haptic([10, 40, 18]);
    burstPetals();
    // Flap opens, then the page glides to the next stop and the card is drawn out on the way.
    // Play the whole opening smoothly, then settle the page on the open stop (no visual change).
    animate(tap, 1, {
      duration: reduced ? 0.4 : 3.6,
      ease: 'linear',
      // The picture is already fully open, so settle the page on the open stop instantly.
      onComplete: () => scrollToTarget(window.innerHeight * HERO_HOLD, { instant: true }),
    });
  };
  const reset = () => {
    tap.set(0);
    setState('closed');
    scrollToTarget(0, { instant: true });
  };

  const pc = (n: number) => `${n}%`;
  const { bride, groom } = siteConfig.couple;

  return (
    <div ref={stickyRef} className="hero">
      <ParallaxStage back={heroLayers} particles={petals} anims={anims} apiRef={apiRef} onFrame={onFrame} eager camera={1}>
        <div className="hero-veil" />
        <div ref={overlayRef} className="envelope" style={{ visibility: 'hidden' }}>
          <div ref={spritesRef} style={{ position: 'absolute', inset: 0, opacity: 0, transformStyle: 'preserve-3d' }}>
            <img
              className="env-abs env-liner"
              src={ART.envelope.liner}
              alt=""
              style={{ left: pc(G.flap.left), top: pc(G.flap.top), width: pc(G.flap.width), height: pc(G.flap.height) }}
            />
            <div className="env-card-clip" style={{ clipPath: G.clip, WebkitClipPath: G.clip, zIndex: 2 }}>
              <img
                ref={cardRef}
                className="env-abs"
                src={ART.envelope.card}
                alt=""
                style={{ left: pc(G.card.left), top: pc(G.card.topStart), width: pc(G.card.width), height: pc(G.card.height) }}
              />
            </div>
            <div
              ref={flapRef}
              className="env-flap"
              style={{ left: pc(G.flap.left), top: pc(G.flap.top), width: pc(G.flap.width), height: pc(G.flap.height) }}
            >
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
          {state === 'closed' && <SealHint />}
          {state === 'closed' && (
            <button
              type="button"
              className="env-tap"
              onClick={open}
              aria-label="Open the invitation envelope"
              style={{ left: pc(G.body.left), top: pc(G.body.top), width: pc(G.body.width), height: pc(G.body.height) }}
            />
          )}
        </div>
      </ParallaxStage>

      <motion.div className="hero-title" style={{ opacity: titleOpacity, y: titleY }} aria-hidden={state !== 'closed'}>
        <p className="eyebrow">An Invitation to Celebrate Love</p>
        <h1 className="hero-names">
          {bride.toUpperCase()} <span className="amp">&amp;</span>{' '}{groom.toUpperCase()}
        </h1>
        <p className="hero-tag">Two hearts. One beautiful forever.</p>
      </motion.div>

      <div className="hero-actions">
        {state === 'closed' && (
          <button type="button" className="btn-quiet hero-hint" onClick={open}>
            Tap the envelope to open
          </button>
        )}
        {state === 'unsealed' && (
          <motion.p className="hero-hint scroll-hint" style={{ opacity: scrollHintOpacity }}>
            Swipe up to draw out the card
            <motion.span
              aria-hidden="true"
              animate={reduced ? undefined : { y: [0, 6, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ChevronDown size={16} />
            </motion.span>
          </motion.p>
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

/** Soft pulsing ring on the wax seal inviting a tap. */
function SealHint() {
  const pc = (n: number) => `${n}%`;
  return (
    <motion.div
      className="env-seal-glow"
      aria-hidden="true"
      style={{ left: pc(G.seal.left + 0.4), top: pc(G.seal.top + 0.25), width: pc(G.seal.width - 0.8), height: pc(G.seal.height - 0.45) }}
      animate={{ opacity: [0.15, 0.85, 0.15], scale: [1, 1.08, 1] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}
