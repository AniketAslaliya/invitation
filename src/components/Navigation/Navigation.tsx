import { motion, useScroll } from 'framer-motion';

/** Thin gold line at the top of the screen showing how far through the invitation the guest is. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return <motion.div className="progress" style={{ scaleX: scrollYProgress }} aria-hidden="true" />;
}
