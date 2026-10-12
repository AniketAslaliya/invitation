import { motion, useReducedMotion } from 'framer-motion';

/** Gold filigree for parchment corners. Draws itself in when scrolled into view. */
export function CornerFiligree({ className }: { className: string }) {
  const reduce = useReducedMotion();
  const draw = reduce
    ? {}
    : {
        initial: { pathLength: 0, opacity: 0 },
        whileInView: { pathLength: 1, opacity: 1 },
        viewport: { once: true, margin: '-10% 0px' },
        transition: { duration: 2.2, ease: [0.22, 1, 0.36, 1] },
      };
  return (
    <svg className={`ornament-corner ${className}`} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <motion.path {...draw} d="M6 114 V30 Q6 6 30 6 H114" stroke="currentColor" strokeWidth="1.6" />
      <motion.path {...draw} d="M16 104 V40 Q16 16 40 16 H104" stroke="currentColor" strokeWidth="0.9" opacity=".7" />
      <motion.path
        {...draw}
        d="M24 24 C40 24 46 34 44 46 C42 56 30 56 30 48 C30 40 40 40 40 46 M24 24 C24 40 34 46 46 44 C56 42 56 30 48 30 C40 30 40 40 46 40"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <motion.path {...draw} d="M50 14 C60 22 70 22 80 14 M14 50 C22 60 22 70 14 80" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="24" cy="24" r="3" fill="currentColor" />
      <circle cx="86" cy="11" r="1.8" fill="currentColor" />
      <circle cx="11" cy="86" r="1.8" fill="currentColor" />
    </svg>
  );
}

/** Lotus-centred flourish used between blocks of text. */
export function Divider({ className = '' }: { className?: string }) {
  const reduce = useReducedMotion();
  const line = reduce
    ? {}
    : {
        initial: { pathLength: 0 },
        whileInView: { pathLength: 1 },
        viewport: { once: true },
        transition: { duration: 1.6, ease: [0.22, 1, 0.36, 1] },
      };
  return (
    <svg className={`divider ${className}`} viewBox="0 0 260 30" fill="none" aria-hidden="true">
      <motion.path {...line} d="M128 15 H8" stroke="currentColor" strokeWidth="1" />
      <motion.path {...line} d="M132 15 H252" stroke="currentColor" strokeWidth="1" />
      <path d="M8 15 l-5 -3 v6 z M252 15 l5 -3 v6 z" fill="currentColor" />
      <path
        d="M130 4 C134 9 136 12 130 22 C124 12 126 9 130 4 Z M130 22 C138 18 144 16 150 16 C144 20 138 22 130 22 Z M130 22 C122 18 116 16 110 16 C116 20 122 22 130 22 Z"
        fill="currentColor"
      />
      <circle cx="98" cy="15" r="2" fill="currentColor" />
      <circle cx="162" cy="15" r="2" fill="currentColor" />
    </svg>
  );
}

/** Scalloped Mughal arch cap: fills the area outside the arch with `outside`, outlines it in gold. */
export function ArchCap({ outside }: { outside: string }) {
  // Seven cusps across a pointed arch, drawn in a 400×170 box.
  const cusps = [
    [0, 170],
    [18, 112],
    [56, 66],
    [108, 34],
    [160, 16],
    [200, 6],
    [240, 16],
    [292, 34],
    [344, 66],
    [382, 112],
    [400, 170],
  ];
  let d = `M${cusps[0][0]} ${cusps[0][1]}`;
  for (let i = 1; i < cusps.length; i++) {
    const [x, y] = cusps[i];
    const [px, py] = cusps[i - 1];
    const r = Math.hypot(x - px, y - py) * 0.58;
    d += ` A${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${x} ${y}`;
  }
  return (
    <svg className="arch-cap" viewBox="0 0 400 170" preserveAspectRatio="none" aria-hidden="true">
      <path d={`${d} V0 H0 Z`} fill={outside} />
      <path d={d} fill="none" stroke="var(--gold)" strokeWidth="2.2" vectorEffect="non-scaling-stroke" />
      <path d={d} fill="none" stroke="var(--gold)" strokeWidth="1" opacity=".5" transform="translate(0 9)" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
