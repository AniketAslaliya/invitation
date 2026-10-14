import type { HTMLAttributes, ReactNode } from 'react';

type Tag = 'div' | 'p' | 'h2' | 'h3' | 'span' | 'li' | 'ul' | 'figure';

interface Props extends HTMLAttributes<HTMLElement> {
  as?: Tag;
  /** Kept for call-site compatibility; ordering now comes from GSAP's stagger in <Page>. */
  delay?: number;
  children: ReactNode;
}

/** Marks an element for its page's GSAP entrance (see Page.tsx). Fully visible without JS/motion. */
export function Reveal({ as = 'div', delay: _delay, children, ...rest }: Props) {
  const Tag = as as 'div';
  return (
    <Tag data-anim="" {...(rest as HTMLAttributes<HTMLDivElement>)}>
      {children}
    </Tag>
  );
}
