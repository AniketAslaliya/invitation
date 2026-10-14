import { largest, srcSet } from '../../lib/media';
import type { Responsive } from '../../parallax/types';
import { FX_PRESETS, PageFX } from '../PageFX/PageFX';

interface Props {
  src: Responsive;
  /** width / height of the artwork */
  aspect: number;
  alt: string;
  /** Border colours of the artwork (top, bottom) — they fill the screen around it. */
  edges: { top: string; bottom: string };
  /** Key into FX_PRESETS for this page's decorative motion. */
  fx?: keyof typeof FX_PRESETS;
  /** Fill the whole screen (for unframed photos); framed artwork stays fully visible otherwise. */
  cover?: boolean;
  children?: React.ReactNode;
}

/**
 * A complete, framed portrait page shown whole on one screen: fitted inside the phone so its border
 * is never cropped, with the space around it filled by the artwork's own border colours. The box is
 * exactly the artwork's size, so per-event effects line up with the picture on every phone.
 */
export function ArtPage({ src, aspect, alt, edges, fx, cover, children }: Props) {
  return (
    <div className={`art-page ${cover ? 'cover' : ''}`} style={{ background: `linear-gradient(${edges.top}, ${edges.bottom})` }}>
      <div className="art-box" style={{ '--a': String(aspect) } as React.CSSProperties}>
        <img
          data-anim="art"
          className="art-page-img"
          src={largest(src)}
          srcSet={srcSet(src)}
          sizes="(min-width: 480px) 480px, 100vw"
          alt={alt}
          loading="lazy"
          decoding="async"
        />
        {fx && <PageFX {...FX_PRESETS[fx]} />}
      </div>
      {children}
    </div>
  );
}
