import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { siteConfig } from '../../data/siteConfig';
import { ART, pickSrc, preload } from '../../lib/media';

/** Brief veil while the opening scene's artwork arrives (never longer than ~2.4s). */
export function LoadingScreen() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const plateW = Math.min(window.innerHeight * 0.5629 * 1.12, Math.max(window.innerWidth, window.innerHeight * 0.5629));
    const urls = [pickSrc(ART.plateClosed, plateW), ART.branchLeft, ART.branchRight];
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts?.ready ?? Promise.resolve();
    let alive = true;
    Promise.all([preload(urls, 2200), Promise.race([fonts, new Promise((r) => setTimeout(r, 1200))])]).then(() => {
      if (alive) setDone(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div className="loader" aria-hidden="true" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9, ease: 'easeOut' }}>
          <div className="loader-mark">
            <span className="script">{siteConfig.couple.monogram}</span>
            <div className="loader-line">
              <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 2.2, ease: 'easeInOut' }} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
