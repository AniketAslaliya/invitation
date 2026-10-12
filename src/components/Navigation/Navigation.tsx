import { AnimatePresence, motion, useScroll } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { siteConfig } from '../../data/siteConfig';
import { scrollToTarget } from '../../lib/scroll';

const LINKS = [
  { href: '#story', label: 'Our Story' },
  { href: '#celebrations', label: 'Celebrations' },
  { href: '#countdown', label: 'Countdown' },
  { href: '#location', label: 'Location' },
];

export function Navigation() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();

  useEffect(() => scrollY.on('change', (y) => setSolid(y > window.innerHeight * 0.6)), [scrollY]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const go = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    scrollToTarget(href);
  };

  return (
    <>
      <nav className="nav" data-solid={solid} aria-label="Invitation sections">
        <a className="nav-mark" href="#top" onClick={go('#top')} aria-label={`${siteConfig.couple.monogram} — back to the beginning`}>
          {siteConfig.couple.monogram}
        </a>
        <ul className="nav-links">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} onClick={go(l.href)}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="nav-menu-btn"
          aria-expanded={open}
          aria-controls="nav-sheet"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
        </button>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.div
            id="nav-sheet"
            className="nav-sheet"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <ul>
              {LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} onClick={go(l.href)}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return <motion.div className="progress" style={{ scaleX: scrollYProgress }} aria-hidden="true" />;
}
