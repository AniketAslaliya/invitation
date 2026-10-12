/** Map of intrinsic width → URL. A plain string means a single size (e.g. an SVG). */
export type Responsive = string | Record<number, string>;

/** Where a layer sits at rest. Centre offset from the stage centre in CSS px (y down) and width in px. */
export interface LayerLayout {
  x: number;
  y: number;
  w: number;
  /** Rest rotation in degrees. */
  rot?: number;
  /** Hide the layer for this viewport. */
  hidden?: boolean;
}

export interface LayerSpec {
  id: string;
  src: Responsive;
  /** width / height of the asset — the plane height is always w / aspect (skill rule). */
  aspect: number;
  layout: (W: number, H: number) => LayerLayout;
  /** Mouse parallax factor (skill units): background ~0.04–0.08, mid ~0.15–0.25, front ~0.30–0.45. */
  parallax?: number;
  /** Scroll-driven drift (skill units): negative X drifts left, positive Y floats up as the section scrolls. */
  scrollFX?: number;
  scrollFY?: number;
  /** Extra scale gained across the section's scroll (a gentle camera push). */
  zoom?: number;
  /** Idle motion so phones without a mouse still feel alive. Amplitudes in skill units / degrees. */
  sway?: { x?: number; y?: number; rot?: number; speed?: number; phase?: number };
  opacity?: number;
  flipX?: boolean;
}

/** Imperative per-layer animation applied on top of parallax (envelope push-in, crossfades). */
export interface LayerAnim {
  dx: number;
  dy: number;
  scale: number;
  opacity: number;
}

export interface ParticleSpec {
  textures: string[];
  count: { mobile: number; desktop: number };
  /** Rendered size range in px at depth 1. */
  size: [number, number];
  /** Fall speed range in px / second. */
  speed: [number, number];
  /** Horizontal sway amplitude in px. */
  drift: number;
  /** Max spin in degrees / second. */
  spin: number;
  opacity: [number, number];
  /** Particles rise instead of fall (sparkles, embers). */
  rise?: boolean;
}

/** Final placement of a layer for one frame: centre in stage px (y down), size in px, rotation in radians. */
export interface LayerFrame {
  x: number;
  y: number;
  w: number;
  h: number;
  rot: number;
  opacity: number;
  hidden: boolean;
}

export interface ParticleFrame {
  x: number;
  y: number;
  size: number;
  rot: number;
  opacity: number;
  tex: number;
}

export interface StageRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface LayerRenderer {
  readonly kind: 'webgl' | 'dom';
  resize(W: number, H: number): void;
  /** camRot: [rotX, rotY] radians — the skill's subtle camera lean (WebGL applies it natively). */
  render(frames: LayerFrame[], particles: ParticleFrame[], camRot: [number, number]): void;
  rectOf(index: number): StageRect | null;
  dispose(): void;
}
