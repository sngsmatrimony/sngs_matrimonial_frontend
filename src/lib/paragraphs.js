/**
 * Members often type or paste free text (About me, partner preference…) with
 * hard line breaks every few words, e.g. wrapped on a phone. Shown as-is the
 * text runs down one narrow column. This joins those mid-sentence breaks into
 * flowing paragraphs, while keeping real ones: blank lines, a break after a
 * finished sentence, and list items.
 */
const SENTENCE_END = /[.!?:;)"'”’]$/;
const LIST_ITEM = /^([-•*·]|\d+[.)])\s/;

export function toParagraphs(text) {
  if (!text || typeof text !== 'string') return [];
  const paragraphs = [];
  let current = '';
  for (const raw of text.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trim().replace(/\s+/g, ' ');
    if (!line) {
      if (current) paragraphs.push(current);
      current = '';
    } else if (!current) {
      current = line;
    } else if (SENTENCE_END.test(current) || LIST_ITEM.test(line)) {
      paragraphs.push(current);
      current = line;
    } else {
      current = `${current} ${line}`;
    }
  }
  if (current) paragraphs.push(current);
  return paragraphs;
}
