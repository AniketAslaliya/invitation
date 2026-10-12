import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';

type Tag = 'div' | 'p' | 'h2' | 'h3' | 'span' | 'li' | 'ul' | 'figure';

interface Props extends Omit<HTMLMotionProps<'div'>, 'children'> {
  as?: Tag;
  delay?: number;
  y?: number;
  children: ReactNode;
}

/** Gentle opacity + rise as content enters. Content is fully visible when motion is reduced. */
export function Reveal({ as = 'div', delay = 0, y = 22, children, ...rest }: Props) {
  const reduce = useReducedMotion();
  const Comp = motion[as] as typeof motion.div;
  if (reduce) return <Comp {...rest}>{children}</Comp>;
  return (
    <Comp
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-8% 0px' }}
      transition={{ duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </Comp>
  );
}
