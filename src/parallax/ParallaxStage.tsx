import { useEffect, useRef, type MutableRefObject, type ReactNode, type RefObject } from 'react';
import { useCaps } from '../lib/capabilities';
import { listenPointer, pointer, subscribe } from '../lib/ticker';
import { DomLayerRenderer } from './DomLayerRenderer';
import { computeFrame, NEUTRAL_ANIM, ParticleField, pxPerUnit, scrollProgressOf, SKILL, type MotionState } from './engine';
import type { WebGLLayerRenderer as WebGLRendererClass } from './WebGLLayerRenderer';
import type { LayerAnim, LayerFrame, LayerLayout, LayerRenderer, LayerSpec, ParticleFrame, ParticleSpec, StageRect } from './types';

export interface StageApi {
  rectOf(id: string): StageRect | null;
  /** Re-render one frame now (used by static mode when an animation value changes). */
  invalidate(): void;
}

interface Props {
  back: LayerSpec[];
  front?: LayerSpec[];
  particles?: ParticleSpec;
  /** Element whose position drives scroll progress. Defaults to the closest <section>. */
  track?: RefObject<HTMLElement>;
  anims?: MutableRefObject<Record<string, LayerAnim>>;
  onFrame?: (api: StageApi) => void;
  apiRef?: MutableRefObject<StageApi | null>;
  /** Multiplier for the skill's camera lean (0 keeps text-adjacent scenes calmer). */
  camera?: number;
  /** Load layers immediately (above-the-fold scenes). */
  eager?: boolean;
  className?: string;
  children?: ReactNode;
}

interface Group {
  specs: LayerSpec[];
  el: HTMLDivElement;
  bases: LayerLayout[];
  frames: LayerFrame[];
  renderer: LayerRenderer | null;
  particles: boolean;
}

const EMPTY: LayerSpec[] = [];

export function ParallaxStage({ back, front = EMPTY, particles, track, anims, onFrame, apiRef, camera = 1, eager, className, children }: Props) {
  const { mode, isMobile, demote } = useCaps();
  const rootRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  useEffect(() => {
    const root = rootRef.current!;
    const trackEl = track?.current ?? (root.closest('section') as HTMLElement | null) ?? root;
    let W = Math.max(1, root.offsetWidth);
    let H = Math.max(1, root.offsetHeight);
    const animated = mode !== 'static';
    if (mode === 'webgl') listenPointer();

    const m: MotionState & { target: number } = { cX: 0, cY: 0, scroll: 0, time: 0, sway: animated ? 1 : 0, target: 0 };
    const particleGroupIsFront = front.length > 0;
    const groups: Group[] = [
      { specs: back, el: backRef.current!, bases: [], frames: [], renderer: null, particles: !!particles && !particleGroupIsFront },
      { specs: front, el: frontRef.current!, bases: [], frames: [], renderer: null, particles: !!particles && particleGroupIsFront },
    ].filter((g) => g.specs.length || g.particles);

    const pCount = particles && animated ? (isMobile ? particles.count.mobile : particles.count.desktop) : 0;
    const field = pCount ? new ParticleField(particles!, pCount) : null;
    field?.resize(W, H);
    const pBuf: ParticleFrame[] = [];

    const computeBases = () => groups.forEach((g) => (g.bases = g.specs.map((s) => s.layout(W, H))));
    computeBases();

    // Three.js is fetched only when a WebGL scene is actually needed (never on phones).
    let WebGLCtor: typeof WebGLRendererClass | null = null;
    let disposed = false;
    const loadGL = mode === 'webgl' ? import('./WebGLLayerRenderer').then((m) => (WebGLCtor = m.WebGLLayerRenderer)) : null;
    const create = () => {
      if (mode === 'webgl' && !WebGLCtor) {
        loadGL!.then(() => {
          if (!disposed && wantNear) {
            create();
            draw(lastTime);
          }
        }, demote);
        return;
      }
      groups.forEach((g) => {
        if (g.renderer) return;
        const widths = g.specs.map((s, i) => g.bases[i].w * (1 + (s.zoom ?? 0)));
        const texs = g.particles && particles ? particles.textures : [];
        const count = g.particles ? pCount : 0;
        try {
          g.renderer =
            mode === 'webgl'
              ? new WebGLCtor!(g.el, g.specs, widths, texs, count, demote)
              : new DomLayerRenderer(g.el, g.specs, widths, texs, count, Boolean(eager));
        } catch {
          // WebGL creation failed (blocked, out of contexts): fall back for the whole page.
          demote();
        }
      });
    };
    const destroy = () =>
      groups.forEach((g) => {
        g.renderer?.dispose();
        g.renderer = null;
      });

    const api: StageApi = {
      rectOf(id) {
        for (const g of groups) {
          const i = g.specs.findIndex((s) => s.id === id);
          if (i >= 0) return g.renderer?.rectOf(i) ?? null;
        }
        return null;
      },
      invalidate: () => draw(0),
    };
    if (apiRef) apiRef.current = api;

    let lastTime = 0;
    const draw = (time: number, dt = 0) => {
      if (animated) {
        m.time = time;
        // Skill: lerp mouse (0.065) and scroll progress (0.06) for a fluid, slightly lagging feel.
        m.cX += (pointer.tX - m.cX) * SKILL.mouseLerp;
        m.cY += (pointer.tY - m.cY) * SKILL.mouseLerp;
        m.target = scrollProgressOf(trackEl);
        m.scroll += (m.target - m.scroll) * SKILL.scrollLerp;
      }
      const U = pxPerUnit(H);
      const cam: [number, number] = animated ? [m.cY * SKILL.camRotX * camera, m.cX * SKILL.camRotY * camera] : [0, 0];
      groups.forEach((g) => {
        if (!g.renderer) return;
        g.frames = g.specs.map((s, i) => computeFrame(s, g.bases[i], anims?.current[s.id] ?? NEUTRAL_ANIM, m, U));
        const parts = g.particles && field && animated ? field.step(dt, m, U, pBuf) : [];
        g.renderer.render(g.frames, parts, cam);
      });
      onFrameRef.current?.(api);
    };
    const tick = (time: number, dt: number) => {
      lastTime = time;
      draw(time, dt);
    };

    const ro = new ResizeObserver(() => {
      W = Math.max(1, root.offsetWidth);
      H = Math.max(1, root.offsetHeight);
      computeBases();
      field?.resize(W, H);
      groups.forEach((g) => g.renderer?.resize(W, H));
      draw(lastTime);
    });
    ro.observe(root);

    // Mount renderers when the scene is within a screen of the viewport; dispose WebGL when far away
    // so only a couple of GL contexts ever exist. Animate only while actually visible.
    let unsub: (() => void) | null = null;
    let wantNear = Boolean(eager);
    const near = new IntersectionObserver(
      ([e]) => {
        wantNear = e.isIntersecting;
        if (e.isIntersecting) {
          create();
          draw(lastTime);
        } else if (mode === 'webgl') {
          destroy();
        }
      },
      { rootMargin: '120% 0px' },
    );
    const visible = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && animated) {
          if (!unsub) {
            m.target = scrollProgressOf(trackEl);
            m.scroll = m.target; // start from the true position, no jump
            unsub = subscribe(tick);
          }
        } else if (unsub) {
          unsub();
          unsub = null;
        }
      },
      { rootMargin: '10% 0px' },
    );
    near.observe(root);
    visible.observe(root);
    if (eager) {
      create();
      draw(0);
    }

    return () => {
      disposed = true;
      unsub?.();
      near.disconnect();
      visible.disconnect();
      ro.disconnect();
      destroy();
      if (apiRef) apiRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, isMobile, back, front, particles]);

  return (
    <div ref={rootRef} className={`stage ${className ?? ''}`} data-render={mode}>
      <div ref={backRef} className="stage-layer stage-back" />
      {children}
      <div ref={frontRef} className="stage-layer stage-front" />
    </div>
  );
}
