import { pickSrc, pxPerUnit, SKILL } from './engine';
import type { LayerFrame, LayerRenderer, LayerSpec, ParticleFrame, StageRect } from './types';

/**
 * Lightweight renderer for phones, reduced motion and browsers without WebGL. Same layers, same
 * motion maths — just absolutely positioned images moved with compositor-only transforms.
 */
export class DomLayerRenderer implements LayerRenderer {
  readonly kind = 'dom' as const;
  private root: HTMLDivElement;
  private els: HTMLImageElement[] = [];
  private pEls: HTMLImageElement[] = [];
  private W = 1;
  private H = 1;
  private last: LayerFrame[] = [];

  constructor(
    container: HTMLElement,
    specs: LayerSpec[],
    initialWidths: number[],
    private particleTextures: string[],
    particleCount: number,
    eager: boolean,
  ) {
    this.root = document.createElement('div');
    this.root.className = 'dom-layers';
    this.root.setAttribute('aria-hidden', 'true');
    container.appendChild(this.root);
    this.W = Math.max(1, container.offsetWidth);
    this.H = Math.max(1, container.offsetHeight);

    specs.forEach((spec, i) => {
      const img = document.createElement('img');
      img.alt = '';
      img.decoding = 'async';
      img.draggable = false;
      img.loading = eager ? 'eager' : 'lazy';
      img.src = pickSrc(spec.src, initialWidths[i]);
      img.className = 'dom-layer';
      img.style.opacity = '0';
      if (spec.flipX) img.dataset.flip = '1';
      this.root.appendChild(img);
      this.els.push(img);
    });
    for (let i = 0; i < particleCount; i++) {
      const img = document.createElement('img');
      img.alt = '';
      img.decoding = 'async';
      img.className = 'dom-layer dom-particle';
      img.src = particleTextures[i % particleTextures.length];
      img.dataset.tex = String(i % particleTextures.length);
      this.root.appendChild(img);
      this.pEls.push(img);
    }
  }

  resize(W: number, H: number) {
    this.W = Math.max(1, W);
    this.H = Math.max(1, H);
  }

  render(frames: LayerFrame[], particles: ParticleFrame[], camRot: [number, number]) {
    // Emulate the skill's camera lean: a rotation of the camera shifts everything at z = 0.
    const U = pxPerUnit(this.H);
    const camX = Math.tan(camRot[1]) * SKILL.cameraZ * U;
    const camY = Math.tan(camRot[0]) * SKILL.cameraZ * U;
    const cx = this.W / 2 + camX;
    const cy = this.H / 2 + camY;
    frames.forEach((fr, i) => {
      const el = this.els[i];
      if (!el) return;
      if (fr.hidden || fr.opacity <= 0.002) {
        el.style.visibility = 'hidden';
        return;
      }
      el.style.visibility = 'visible';
      el.style.width = `${fr.w}px`;
      el.style.height = `${fr.h}px`;
      el.style.opacity = String(fr.opacity);
      const flip = el.dataset.flip ? ' scaleX(-1)' : '';
      el.style.transform = `translate3d(${cx + fr.x - fr.w / 2}px, ${cy + fr.y - fr.h / 2}px, 0) rotate(${fr.rot}rad)${flip}`;
    });
    this.last = frames.map((f) => ({ ...f, x: f.x + camX, y: f.y + camY }));

    this.pEls.forEach((el, i) => {
      const p = particles[i];
      if (!p) {
        el.style.visibility = 'hidden';
        return;
      }
      const tex = String(p.tex % this.particleTextures.length);
      if (el.dataset.tex !== tex) {
        el.dataset.tex = tex;
        el.src = this.particleTextures[p.tex % this.particleTextures.length];
      }
      el.style.visibility = 'visible';
      el.style.width = `${p.size}px`;
      el.style.opacity = String(p.opacity);
      el.style.transform = `translate3d(${cx + p.x - p.size / 2}px, ${cy + p.y - p.size / 2}px, 0) rotate(${p.rot}rad)`;
    });
  }

  rectOf(index: number): StageRect | null {
    const fr = this.last[index];
    if (!fr) return null;
    return { left: this.W / 2 + fr.x - fr.w / 2, top: this.H / 2 + fr.y - fr.h / 2, width: fr.w, height: fr.h };
  }

  dispose() {
    this.root.remove();
  }
}
