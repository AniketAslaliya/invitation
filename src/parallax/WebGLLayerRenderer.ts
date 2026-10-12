import * as THREE from 'three';
import { pickSrc, pxPerUnit, SKILL } from './engine';
import type { LayerFrame, LayerRenderer, LayerSpec, ParticleFrame, StageRect } from './types';

// One texture cache for the whole page so scenes that share artwork (branches, petals) upload once.
const textureCache = new Map<string, Promise<THREE.Texture>>();
const loader = new THREE.TextureLoader();

// Skill: every texture uses SRGBColorSpace, otherwise colours double-correct and look washed out.
function loadTex(src: string): Promise<THREE.Texture> {
  let p = textureCache.get(src);
  if (!p) {
    p = new Promise((res, rej) =>
      loader.load(
        src,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = 4;
          res(tex);
        },
        undefined,
        rej,
      ),
    );
    textureCache.set(src, p);
  }
  return p;
}

/**
 * Renders stacked transparent layers on PlaneGeometry exactly as the threejs-parallax skill describes:
 * perspective camera (fov 55, z 5), transparent materials with depthWrite/depthTest off, explicit
 * renderOrder, SRGB output, and a ResizeObserver-driven canvas. Positions are supplied each frame by
 * the shared engine so the DOM fallback stays pixel-identical.
 */
export class WebGLLayerRenderer implements LayerRenderer {
  readonly kind = 'webgl' as const;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private canvas: HTMLCanvasElement;
  private meshes: THREE.Mesh[] = [];
  private particleMeshes: THREE.Mesh[] = [];
  private geo = new THREE.PlaneGeometry(1, 1);
  private W = 1;
  private H = 1;
  private U = 1;
  private last: LayerFrame[] = [];
  private disposed = false;

  constructor(
    container: HTMLElement,
    specs: LayerSpec[],
    initialWidths: number[],
    particleTextures: string[],
    particleCount: number,
    onContextLost: () => void,
  ) {
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
    this.canvas.setAttribute('aria-hidden', 'true');
    container.appendChild(this.canvas);

    this.W = Math.max(1, container.offsetWidth);
    this.H = Math.max(1, container.offsetHeight);

    try {
      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (err) {
      this.canvas.remove(); // leave no dead canvas behind; the stage falls back to DOM layers
      throw err;
    }
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.W, this.H, false);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.camera = new THREE.PerspectiveCamera(SKILL.fov, this.W / this.H, 0.1, 100);
    this.camera.position.z = SKILL.cameraZ;
    this.U = pxPerUnit(this.H);

    this.canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      // Our own dispose() also forces a context loss; only a real loss should demote the page.
      if (!this.disposed) onContextLost();
    });

    specs.forEach((spec, i) => {
      const mat = new THREE.MeshBasicMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: false,
        opacity: 0,
        side: spec.flipX ? THREE.DoubleSide : THREE.FrontSide,
      });
      const mesh = new THREE.Mesh(this.geo, mat);
      mesh.renderOrder = i; // back-to-front, independent of z
      mesh.visible = false;
      mesh.userData.ready = false;
      mesh.userData.flip = spec.flipX ? -1 : 1;
      this.scene.add(mesh);
      this.meshes.push(mesh);
      loadTex(pickSrc(spec.src, initialWidths[i]))
        .then((tex) => {
          if (this.disposed) return;
          mat.map = tex;
          mat.needsUpdate = true;
          mesh.userData.ready = true;
        })
        .catch(() => {
          /* missing decorative layer: leave hidden */
        });
    });

    const pTex = particleTextures.map((src) => loadTex(src));
    for (let i = 0; i < particleCount; i++) {
      const mat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, depthTest: false, opacity: 0 });
      const mesh = new THREE.Mesh(this.geo, mat);
      mesh.renderOrder = specs.length + i;
      mesh.visible = false;
      this.scene.add(mesh);
      this.particleMeshes.push(mesh);
    }
    Promise.all(pTex)
      .then((texs) => {
        if (this.disposed) return;
        this.particleMeshes.forEach((m) => {
          (m.userData as { texs?: THREE.Texture[] }).texs = texs;
        });
      })
      .catch(() => {});
  }

  resize(W: number, H: number) {
    this.W = Math.max(1, W);
    this.H = Math.max(1, H);
    this.camera.aspect = this.W / this.H;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.W, this.H, false);
    this.U = pxPerUnit(this.H);
  }

  render(frames: LayerFrame[], particles: ParticleFrame[], camRot: [number, number]) {
    if (this.disposed) return;
    const U = this.U;
    this.camera.rotation.x = camRot[0];
    this.camera.rotation.y = camRot[1];
    frames.forEach((fr, i) => {
      const mesh = this.meshes[i];
      if (!mesh) return;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      const visible = mesh.userData.ready && !fr.hidden && fr.opacity > 0.002;
      mesh.visible = visible;
      if (!visible) return;
      mesh.position.set(fr.x / U, -fr.y / U, 0);
      mesh.scale.set((fr.w / U) * mesh.userData.flip, fr.h / U, 1);
      mesh.rotation.z = -fr.rot;
      mat.opacity = fr.opacity;
    });
    this.last = frames;

    this.particleMeshes.forEach((mesh, i) => {
      const p = particles[i];
      const texs = (mesh.userData as { texs?: THREE.Texture[] }).texs;
      if (!p || !texs) {
        mesh.visible = false;
        return;
      }
      const mat = mesh.material as THREE.MeshBasicMaterial;
      const tex = texs[p.tex % texs.length];
      if (mat.map !== tex) {
        mat.map = tex;
        mat.needsUpdate = true;
      }
      const img = tex.image as { width: number; height: number } | undefined;
      const aspect = img && img.height ? img.width / img.height : 1;
      mesh.visible = true;
      mesh.position.set(p.x / U, -p.y / U, 0);
      mesh.scale.set(p.size / U, p.size / aspect / U, 1);
      mesh.rotation.z = -p.rot;
      mat.opacity = p.opacity;
    });

    this.renderer.render(this.scene, this.camera);
  }

  /** Screen-space bounding box of a layer (for syncing DOM overlays with the moving plate). */
  rectOf(index: number): StageRect | null {
    const fr = this.last[index];
    const mesh = this.meshes[index];
    if (!fr || !mesh) return null;
    const U = this.U;
    const v = new THREE.Vector3();
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const [sx, sy] of [
      [-0.5, -0.5],
      [0.5, -0.5],
      [0.5, 0.5],
      [-0.5, 0.5],
    ]) {
      v.set((fr.x + sx * fr.w) / U, -(fr.y + sy * fr.h) / U, 0).project(this.camera);
      const px = (v.x * 0.5 + 0.5) * this.W;
      const py = (-v.y * 0.5 + 0.5) * this.H;
      minX = Math.min(minX, px);
      maxX = Math.max(maxX, px);
      minY = Math.min(minY, py);
      maxY = Math.max(maxY, py);
    }
    return { left: minX, top: minY, width: maxX - minX, height: maxY - minY };
  }

  dispose() {
    this.disposed = true;
    for (const m of [...this.meshes, ...this.particleMeshes]) {
      // Textures live in the shared cache and are reused by other scenes; only materials are freed here.
      (m.material as THREE.Material).dispose();
      this.scene.remove(m);
    }
    this.geo.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.canvas.remove();
  }
}
