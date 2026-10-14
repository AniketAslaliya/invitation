/**
 * Splits a short headline into per-letter spans for a GSAP letter reveal (see Page.tsx).
 * Letters are grouped per word (no-wrap) so lines only ever break between words.
 * Screen readers read the whole text from a visually-hidden copy; the letters are hidden from them.
 * Reserve for short headlines (ui-ux-pro-max: don't split long paragraphs).
 */
export function SplitChars({ text }: { text: string }) {
  const words = text.split(' ');
  return (
    <span data-split="">
      <span className="sr-only">{text}</span>
      {words.map((word, w) => (
        <span key={w} className="word" aria-hidden="true">
          {Array.from(word).map((ch, i) => (
            <span key={i} className="ch">
              {ch}
            </span>
          ))}
          {w < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </span>
  );
}
