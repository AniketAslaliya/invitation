import { animate, motion, useMotionValue, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import { ChevronDown, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { siteConfig } from '../../data/siteConfig';
import { useCaps } from '../../lib/capabilities';
import { ART } from '../../lib/media';
import { scrollToTarget } from '../../lib/scroll';
import { useMediaQuery } from '../../lib/useMediaQuery';
import { ParallaxStage, type StageApi } from '../../parallax/ParallaxStage';
import type { LayerAnim } from '../../parallax/types';
import { envelopeGeometry as G, heroLayers, petals, plateLayout, PLATE_H, PLATE_W } from '../../scenes/heroScene';

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const seg = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));

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
  const sectionRef = useRef<HTMLElement>(null);
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

  // `tap` animates 0→1 when the envelope is tapped (seal + flap); `scroll` is the pinned-scroll progress.
  const tap = useMotionValue(0);
  const { scrollYProgress: scroll } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });
  // The flap is open if tapped, or once the guest has scrolled a little.
  const flap = useTransform([tap, scroll], ([t, s]: number[]) => Math.max(t, seg(s, 0, 0.14)));

  // On phones the title shares the sky with the rising card, so it steps aside; on wide screens it stays.
  const landscape = useMediaQuery('(min-aspect-ratio: 19/20)');
  const titleOpacity = useTransform(flap, [0, 0.5], [1, landscape ? 1 : 0]);
  const titleY = useTransform(flap, [0, 0.5], [0, landscape ? 0 : -16]);
  const scrollHintOpacity = useTransform(scroll, [0, 0.12], [1, 0]);

  const apply = useCallback(() => {
    const box = stickyRef.current;
    if (!box) return;
    const f = flap.get();
    const sc = scroll.get();
    const W = box.clientWidth;
    const H = box.clientHeight;
    const base = plateLayout(W, H);
    const pw = base.w;
    const ph = (pw * PLATE_H) / PLATE_W;
    const at = ([u, w]: [number, number]) => [base.x + (u / PLATE_W - 0.5) * pw, base.y + (w / PLATE_H - 0.5) * ph] as const;
    const [a1x, a1y] = at(G.hinge1);
    const [a2x, a2y] = at(G.hinge2);
    const s = G.openScale;

    // The card is drawn out over the first half of the scroll, never before the flap is open.
    const cardT = easeOut(Math.min(seg(sc, 0.08, 0.55), seg(f, 0.55, 1)));
    // Then the view moves in until it becomes the open-envelope artwork.
    const q = reduced ? 0 : easeInOut(seg(sc, 0.55, 0.92));
    const m = s + (1 - s) * q;
    const ex = (1 - q) * (a1x - a2x);
    const ey = (1 - q) * (a1y - a2y);
    const k = m / s;
    const fade = reduced ? seg(sc, 0.2, 0.7) : easeInOut(seg(sc, 0.6, 0.74));
    anims.current['plate-open'] = reduced
      ? { dx: 0, dy: 0, scale: 1, opacity: fade }
      : { dx: a2x + m * (base.x - a2x) + ex - base.x, dy: a2y + m * (base.y - a2y) + ey - base.y, scale: m, opacity: fade };
    anims.current['plate-closed'] = reduced
      ? { dx: 0, dy: 0, scale: 1, opacity: 1 - fade }
      : { dx: a2x + ex + k * (base.x - a1x) - base.x, dy: a2y + ey + k * (base.y - a1y) - base.y, scale: k, opacity: 1 - seg(sc, 0.74, 0.8) };

    const sprites = spritesRef.current;
    if (sprites) sprites.style.opacity = reduced || f === 0 ? '0' : String(1 - fade);
    const angle = easeInOut(seg(f, 0.25, 1)) * 180;
    if (flapRef.current) {
      // perspective() lives on the flap itself: the faded parent flattens inherited 3D context.
      const persp = Math.max(600, (overlayRef.current?.offsetWidth ?? 500) * 2.4);
      flapRef.current.style.transform = `perspective(${persp}px) rotateX(${angle}deg)`;
      flapRef.current.style.zIndex = angle < 90 ? '4' : '1';
    }
    if (cardRef.current) {
      cardRef.current.style.top = `${G.card.topStart + (G.card.topFinal - G.card.topStart) * cardT}%`;
    }
    if (glowRef.current) {
      const g = f === 0 ? 0 : Math.sin(seg(f, 0, 0.6) * Math.PI);
      glowRef.current.style.opacity = String(g);
      glowRef.current.style.transform = `scale(${1 + 0.06 * g})`;
    }
    if (reduced) apiRef.current?.invalidate();
  }, [flap, scroll, reduced]);

  useEffect(() => {
    apply();
    const a = flap.on('change', apply);
    const b = scroll.on('change', apply);
    window.addEventListener('resize', apply);
    return () => {
      a();
      b();
      window.removeEventListener('resize', apply);
    };
  }, [apply, flap, scroll]);

  useMotionValueEvent(scroll, 'change', (v) => {
    setState((st) => {
      if (v > 0.9) return 'open';
      if (st === 'open') return 'unsealed';
      if (st === 'closed' && v > 0.14) return 'unsealed';
      return st;
    });
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

  const open = () => {
    if (state !== 'closed') return;
    setState('unsealed');
    animate(tap, 1, { duration: reduced ? 0.3 : 1.6, ease: 'easeInOut' });
  };
  const reset = () => {
    tap.set(0);
    setState('closed');
    scrollToTarget(0, { instant: true });
  };

  const pc = (n: number) => `${n}%`;
  const { bride, groom } = siteConfig.couple;

  return (
    <section ref={sectionRef} className="hero" id="top" aria-label="The Palace Awakens">
      <div ref={stickyRef} className="hero-sticky">
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

      <motion.div className="hero-title" style={{ opacity: titleOpacity, y: titleY }} aria-hidden={state !== 'closed' && !landscape}>
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
            Scroll to draw out the card
            <motion.span
              aria-hidden="true"
              animate={reduced ? undefined : { y: [0, 6, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ChevronDown size={16} />
            </motion.span>
          </motion.p>
        )}
        <button type="button" className="btn-royal" onClick={() => scrollToTarget('#invitation')}>
          Enter the Invitation <ChevronDown aria-hidden="true" />
        </button>
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
    </section>
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
