import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { webglAvailable } from '../parallax/webglProbe';

/**
 * webgl  – desktop with a fine pointer: Three.js layered scenes.
 * dom    – phones/tablets: same layers as lightweight transformed images (no heavy WebGL).
 * static – prefers-reduced-motion: composed layers, no continuous motion.
 */
export type RenderMode = 'webgl' | 'dom' | 'static';

interface Caps {
  mode: RenderMode;
  reducedMotion: boolean;
  isMobile: boolean;
  /** Called when a WebGL context is lost so every scene falls back to DOM. */
  demote: () => void;
}

const CapsContext = createContext<Caps>({ mode: 'static', reducedMotion: true, isMobile: true, demote: () => {} });

function query(q: string) {
  return typeof window !== 'undefined' && window.matchMedia(q).matches;
}

function detect(forceDom: boolean): Omit<Caps, 'demote'> {
  const reducedMotion = query('(prefers-reduced-motion: reduce)');
  const isMobile = true;
  const override = new URLSearchParams(window.location.search).get('render') as RenderMode | null;
  if (override === 'webgl' && !forceDom) return { mode: 'webgl', reducedMotion, isMobile };
  if (override === 'dom' || override === 'static') return { mode: override, reducedMotion, isMobile };
  if (reducedMotion) return { mode: 'static', reducedMotion, isMobile };
  // The invitation is designed for phones: every device gets the light, scroll-driven layered
  // renderer (no cursor effects). WebGL stays available only via ?render=webgl for experiments.
  void webglAvailable;
  return { mode: 'dom', reducedMotion, isMobile: true };
}

export function CapabilitiesProvider({ children }: { children: ReactNode }) {
  const [forceDom, setForceDom] = useState(false);
  const [caps, setCaps] = useState(() => detect(false));

  useEffect(() => {
    const update = () => setCaps(detect(forceDom));
    update();
    const mqs = ['(prefers-reduced-motion: reduce)', '(min-width: 900px)', '(hover: hover) and (pointer: fine)'].map((q) =>
      window.matchMedia(q),
    );
    mqs.forEach((m) => m.addEventListener('change', update));
    return () => mqs.forEach((m) => m.removeEventListener('change', update));
  }, [forceDom]);

  return <CapsContext.Provider value={{ ...caps, demote: () => setForceDom(true) }}>{children}</CapsContext.Provider>;
}

export const useCaps = () => useContext(CapsContext);
