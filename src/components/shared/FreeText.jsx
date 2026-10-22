import { toParagraphs } from '@/lib/paragraphs';

/** A member's free text as flowing paragraphs (see lib/paragraphs). */
export default function FreeText({ text, className = '' }) {
  const paragraphs = toParagraphs(text);
  if (!paragraphs.length) return null;
  return (
    <div className={`space-y-3 ${className}`}>
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}
