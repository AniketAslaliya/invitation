// One requestAnimationFrame loop for the whole page. Scenes subscribe only while on screen.
type Tick = (time: number, dt: number) => void;

const subs = new Set<Tick>();
let raf = 0;
let last = 0;

function loop(t: number) {
  const time = t / 1000;
  const dt = last ? Math.min(0.05, time - last) : 1 / 60;
  last = time;
  subs.forEach((fn) => fn(time, dt));
  raf = subs.size ? requestAnimationFrame(loop) : 0;
  if (!raf) last = 0;
}

export function subscribe(fn: Tick): () => void {
  subs.add(fn);
  if (!raf) raf = requestAnimationFrame(loop);
  return () => {
    subs.delete(fn);
  };
}

// Shared, smoothed mouse position in −1..1 (skill convention: y up).
export const pointer = { tX: 0, tY: 0 };
let listening = false;
export function listenPointer() {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  window.addEventListener(
    'mousemove',
    (e) => {
      pointer.tX = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.tY = -(e.clientY / window.innerHeight - 0.5) * 2;
    },
    { passive: true },
  );
  document.addEventListener('mouseleave', () => {
    pointer.tX = 0;
    pointer.tY = 0;
  });
}
