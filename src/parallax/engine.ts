import type { LayerAnim, LayerFrame, LayerLayout, LayerSpec, ParticleFrame, ParticleSpec, Responsive } from './types';

/** Values from the threejs-parallax skill. */
export const SKILL = {
  fov: 55,
  cameraZ: 5,
  mouseLerp: 0.065,
  scrollLerp: 0.06,
  camRotY: 0.035,
  camRotX: 0.025,
  scrollClamp: 1.4,
} as const;

/** CSS px per world unit at z = 0 for the skill's camera, so DOM and WebGL layers line up exactly. */
export function pxPerUnit(H: number): number {
  return H / (2 * SKILL.cameraZ * Math.tan((SKILL.fov * Math.PI) / 360));
}

/** Skill scroll progress: −1 (section below centre) → 0 (centred) → +1 (above), clamped ±1.4. */
export function scrollProgressOf(el: Element): number {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight;
  const mid = rect.top + rect.height * 0.5;
  const p = (vh * 0.5 - mid) / (vh * 0.5 + rect.height * 0.5);
  return Math.max(-SKILL.scrollClamp, Math.min(SKILL.scrollClamp, p));
}

export interface MotionState {
  cX: number;
  cY: number;
  scroll: number;
  time: number;
  /** 0 disables idle sway (reduced motion / static frame). */
  sway: number;
}

export const NEUTRAL_ANIM: LayerAnim = { dx: 0, dy: 0, scale: 1, opacity: 1 };

export function computeFrame(
  spec: LayerSpec,
  base: LayerLayout,
  anim: LayerAnim,
  m: MotionState,
  U: number,
): LayerFrame {
  const f = spec.parallax ?? 0;
  const sx = spec.scrollFX ?? 0;
  const sy = spec.scrollFY ?? 0;
  let swX = 0;
  let swY = 0;
  let swR = 0;
  if (spec.sway && m.sway) {
    const s = spec.sway;
    const t = m.time * (s.speed ?? 0.5) + (s.phase ?? 0);
    swX = Math.sin(t) * (s.x ?? 0) * m.sway;
    swY = Math.sin(t * 0.8 + 1.3) * (s.y ?? 0) * m.sway;
    swR = Math.sin(t * 0.9 + 0.4) * (s.rot ?? 0) * m.sway;
  }
  // Skill formula: position = base + mouse * pFactor + scrollF * smoothScrollProg (y is up in world space).
  const ox = (m.cX * f + sx * m.scroll + swX) * U;
  const oy = -(m.cY * f + sy * m.scroll + swY) * U;
  const push = 1 + (spec.zoom ?? 0) * Math.max(0, Math.min(1, (m.scroll + 1) / 2));
  const scale = anim.scale * push;
  const w = base.w * scale;
  return {
    x: base.x + anim.dx + ox,
    y: base.y + anim.dy + oy,
    w,
    h: w / spec.aspect,
    rot: (((base.rot ?? 0) + swR) * Math.PI) / 180,
    opacity: (spec.opacity ?? 1) * anim.opacity,
    hidden: Boolean(base.hidden),
  };
}

/** Picks the smallest variant that covers the rendered width at the device's pixel ratio (capped at 2). */
export function pickSrc(src: Responsive, cssWidth: number): string {
  if (typeof src === 'string') return src;
  const need = cssWidth * Math.min(window.devicePixelRatio || 1, 2);
  const widths = Object.keys(src)
    .map(Number)
    .sort((a, b) => a - b);
  const w = widths.find((x) => x >= need) ?? widths[widths.length - 1];
  return src[w];
}

/* ------------------------------------------------------------------------ particles */

interface Particle {
  x: number;
  y: number;
  z: number;
  base: number;
  speed: number;
  phase: number;
  spin: number;
  rot: number;
  opacity: number;
  tex: number;
}

let seed = 42;
const rand = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

/** Gently drifting petals / sparkles at several depths. Shared by both renderers. */
export class ParticleField {
  private ps: Particle[] = [];
  private W = 1;
  private H = 1;

  constructor(
    private spec: ParticleSpec,
    count: number,
  ) {
    for (let i = 0; i < count; i++) this.ps.push(this.spawn(true));
  }

  get size() {
    return this.ps.length;
  }

  resize(W: number, H: number) {
    const sx = W / this.W;
    const sy = H / this.H;
    for (const p of this.ps) {
      p.x *= sx;
      p.y *= sy;
    }
    this.W = W;
    this.H = H;
  }

  private spawn(anywhere: boolean): Particle {
    const s = this.spec;
    const z = 0.35 + rand() * 0.65;
    return {
      x: (rand() - 0.5) * this.W,
      y: anywhere ? (rand() - 0.5) * this.H : (s.rise ? 1 : -1) * (this.H / 2 + 60),
      z,
      base: s.size[0] + rand() * (s.size[1] - s.size[0]),
      speed: s.speed[0] + rand() * (s.speed[1] - s.speed[0]),
      phase: rand() * Math.PI * 2,
      spin: (rand() - 0.5) * 2 * s.spin,
      rot: rand() * 360,
      opacity: s.opacity[0] + rand() * (s.opacity[1] - s.opacity[0]),
      tex: Math.floor(rand() * s.textures.length),
    };
  }

  step(dt: number, m: MotionState, U: number, out: ParticleFrame[]): ParticleFrame[] {
    out.length = 0;
    const s = this.spec;
    for (let i = 0; i < this.ps.length; i++) {
      let p = this.ps[i];
      const dir = s.rise ? -1 : 1;
      p.y += dir * p.speed * p.z * dt;
      p.rot += p.spin * dt;
      const off = this.H / 2 + 80;
      if ((dir > 0 && p.y > off) || (dir < 0 && p.y < -off)) {
        p = this.ps[i] = this.spawn(false);
        p.x = (rand() - 0.5) * this.W;
      }
      const sway = Math.sin(m.time * 0.6 + p.phase) * s.drift * p.z;
      // Closer particles (higher z) react more to mouse and scroll, like foreground layers.
      const par = 0.15 + 0.35 * p.z;
      out.push({
        x: p.x + sway + m.cX * par * U,
        y: p.y - m.cY * par * U - m.scroll * 0.3 * p.z * U,
        size: p.base * (0.55 + 0.45 * p.z),
        rot: (p.rot * Math.PI) / 180,
        opacity: p.opacity * (0.6 + 0.4 * p.z),
        tex: p.tex,
      });
    }
    return out;
  }
}
